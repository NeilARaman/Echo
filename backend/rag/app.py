import os, io, glob, json, hashlib, re, time
from typing import List, Dict, Any, Union, Tuple
from datetime import datetime

from flask import Flask, request, jsonify, render_template, make_response
from flask_cors import CORS
from dotenv import load_dotenv

import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from pypdf import PdfReader

from anthropic import Anthropic, NotFoundError
import httpx  # required by anthropic client internals
from secrets import token_urlsafe

# -----------------------------
# Env & global init
# -----------------------------
load_dotenv()
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    raise RuntimeError("Set ANTHROPIC_API_KEY in .env")

EMBED_MODEL = os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

# Honor .env first; if that 404s, try the next ones.
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL") or "claude-3-haiku-20240307"
MODEL_FALLBACKS = [
    CLAUDE_MODEL,
    "claude-3-5-haiku-latest",
    "claude-3-haiku-20240307",
]

INDEX_DIR = os.getenv("INDEX_DIR", "./faiss_store")
DATA_DIR = "./data/docs"
os.makedirs(INDEX_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

EXPORT_DIR = os.getenv("EXPORT_DIR", "./exports")
os.makedirs(EXPORT_DIR, exist_ok=True)

# Handoff token TTL (seconds) — short-lived by default
HANDOFF_TTL_SECONDS = int(os.getenv("HANDOFF_TTL_SECONDS", "600"))
HANDOFFS: Dict[str, Dict[str, Any]] = {}  # token -> {"draft":..., "communityId":..., "ts": epoch_s}

anthropic = Anthropic(api_key=ANTHROPIC_API_KEY)
embedder = SentenceTransformer(EMBED_MODEL)
EMB_DIM = embedder.get_sentence_embedding_dimension()

INDEX_PATH = os.path.join(INDEX_DIR, "index.faiss")
META_PATH  = os.path.join(INDEX_DIR, "meta.jsonl")

# -----------------------------
# Editorial bots (10 personas)
# -----------------------------
BOTS: List[Dict[str, str]] = [
    {"id":"bot01","name":"Fact Checker","system":"""ROLE: Rigorous fact checker.
MISSION: Test every claim against the context; highlight unsupported ones; propose precise evidence needs.
DELIVERABLE:
- Suggestions must include exact claim text or quote from the draft (short) and show which context snippets support it.
- If unsupported, label it UNSUPPORTED and say what source would be needed.
AVOID: Style fixes; speculation without marking it as unsupported. Do NOT propose headlines."""},
    {"id":"bot02","name":"Copy & Clarity Editor","system":"""ROLE: Line editor for clarity, structure, brevity.
MISSION: Improve flow and readability with concrete rewrites.
DELIVERABLE:
- Provide before→after micro-rewrites; group by section/paragraph if obvious.
- Note jargon and give plain-language replacements.
AVOID: Changing factual meaning; SEO gadgets. Do NOT propose headlines."""},
    {"id":"bot03","name":"SEO & Discoverability","system":"""ROLE: Search strategist.
MISSION: Improve findability while staying truthful.
DELIVERABLE:
- 2–3 keyword clusters (primary+supporting), H2/H3 outline variants, internal/external link ideas with anchor text.
- Show how each suggestion maps to cited context or draft lines.
AVOID: Clickbait or unverifiable claims. Do NOT propose headlines."""},
    {"id":"bot04","name":"Social Audience Simulator","system":"""ROLE: Social reactions forecaster.
MISSION: Predict likely praise/critique; produce platform-ready posts.
DELIVERABLE:
- 4–6 post drafts (serious, witty, explanatory, critical) referencing quotable lines from the draft.
- Note potential backlash vectors with mitigation phrasing rooted in context.
AVOID: Generic platitudes. Do NOT propose headlines."""},
    {"id":"bot05","name":"Data & Evidence Coach","system":"""ROLE: Data journalism coach.
MISSION: Suggest quantifications, charts, and datasets.
DELIVERABLE:
- For each claim, propose metric(s), dataset(s), chart type, sketch title/axes, and calculation notes; cite context indices.
AVOID: High-level advice without concrete operational steps. Do NOT propose headlines."""},
    {"id":"bot06","name":"Ethics & Harm Review","system":"""ROLE: Ethics reviewer.
MISSION: Identify fairness, privacy, harm, and missing voices; propose mitigations.
DELIVERABLE:
- Each risk has severity and mitigation language; call out who is affected and where to add context boxes.
AVOID: Vague warnings without fixes. Do NOT propose headlines."""},
    {"id":"bot07","name":"Accessibility & Inclusive Lang","system":"""ROLE: Accessibility editor.
MISSION: Ensure inclusive language and accessible presentation.
DELIVERABLE:
- Reading level notes, alt-text stubs for visuals, caption/contrast guidance, table/figure accessibility, and inclusive wording swaps.
AVOID: Cosmetic nits that don’t aid access. Do NOT propose headlines."""},
    {"id":"bot08","name":"Legal Risk Spotter (Not Legal Advice)","system":"""ROLE: Legal issue spotter (not legal advice).
MISSION: Flag defamation, copyright/quotation, and other exposure; propose safer phrasing and diligence.
DELIVERABLE:
- Risk item with severity, rationale, safer alternative wording, and diligence checklist; tie to context.
AVOID: Final legal conclusions. Do NOT propose headlines."""},
    {"id":"bot09","name":"Headline & Framing Coach","system":"""ROLE: Headline/dek coach.
MISSION: Produce accurate, distinct angles.
DELIVERABLE:
- 6 headline options + 1-sentence dek each; note target audience and angle (accountability, explainer, service).
AVOID: Over-promising or ambiguity. This is the ONLY role allowed to propose headlines."""},
    {"id":"bot10","name":"Adversarial / Skeptical Reader","system":"""ROLE: Skeptical steelman.
MISSION: Pressure-test claims with the strongest reasonable counter-arguments.
DELIVERABLE:
- For each major claim, counter-argument, missing evidence, and what reporting would resolve it; propose balance lines.
AVOID: Bad-faith attacks. Do NOT propose headlines."""},
]
HEADLINE_BOT_ID = "bot09"

# -----------------------------
# Audience instruction (distinct schema)
# -----------------------------
AUDIENCE_INSTR = """AUDIENCE REPORT RULES
- Speak from the assigned audience perspective only. Avoid generic newsroom advice.
- Use CONTEXT [1..N] when relevant; cite indices like [2], [4].
- Be specific to your lived impact; avoid overlapping with other audience roles.

RETURN STRICT JSON WITH THIS AUDIENCE SCHEMA:
{
  "persona_takeaway": "1–3 sentences from this audience viewpoint",
  "stance": "support|oppose|mixed",
  "positives": ["..."],
  "concerns": [
    {"issue":"...", "why":"...", "supported_by":[1,2], "severity":1-10}
  ],
  "questions_for_reporter": ["..."],
  "scores": {
    "trust": 1-10,
    "relevance": 1-10,
    "share_intent": 1-10
  },
  "likely_comment": "a short comment this audience might post",
  "suggestions_to_journalist": [
    {"text":"...", "rationale":"...", "supported_by":[3]}
  ],
  "citations": [1,2]
}
ONLY OUTPUT VALID JSON.
"""

# -----------------------------
# Editorial shared instruction (JSON, 1–10)
# -----------------------------
RAG_INSTR = """GENERAL RULES
- Use the CONTEXT snippets [1..N] when relevant; cite snippet numbers like [2], [4] directly in your text fields.
- If a claim is not supported by the context, mark it clearly as UNSUPPORTED and state what source would resolve it.
- Be concise, specific, and operational. Prefer concrete rewrites and checklists over abstract advice.
- Do not include any prose outside JSON. No markdown code fences. No commentary.

SCORING RUBRIC (1–10)
- 1–3: poor / broken; 4–5: weak; 6–7: acceptable; 8–9: strong; 10: exemplary.

RETURN STRICT JSON WITH THIS SCHEMA:
{
  "summary": "2–4 sentences tailored to your role",
  "key_points": ["short, high-signal bullets..."],
  "suggestions": [
    {
      "text": "the actionable suggestion or rewrite",
      "rationale": "why this helps, referencing context or draft quote",
      "supported_by": [1,2],
      "impact": "low|medium|high",
      "effort": "low|medium|high",
      "quote_from_draft": "optional short quote"
    }
  ],
  "risks": [
    {
      "issue": "risk statement",
      "rationale": "why it's a risk",
      "supported_by": [3],
      "severity": 1-10,
      "mitigation": "specific mitigation or safer phrasing"
    }
  ],
  "ratings": {
    "clarity": 1-10,
    "accuracy": 1-10,
    "engagement": 1-10,
    "novelty": 1-10,
    "risk": 1-10
  },
  "headline_suggestions": ["..."],    // leave [] unless you are the Headline Coach
  "citations": [1,2],
  "next_actions": ["ranked, concrete steps (max 5)"]
}
ONLY OUTPUT VALID JSON.
"""

# -----------------------------
# Flask app
# -----------------------------
app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

# -----------------------------
# Utilities
# -----------------------------
def _hash_id(s: str) -> str:
    return hashlib.sha1(s.encode("utf-8")).hexdigest()

def _safe_filename_from_text(text: str, prefix: str = "analysis", ext: str = "json") -> str:
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    h = hashlib.sha1((text or "").encode("utf-8")).hexdigest()[:8]
    return f"{prefix}_{ts}_{h}.{ext}"

def save_run_json(payload: Dict[str, Any], draft: str) -> str:
    fname = _safe_filename_from_text(draft, prefix="analysis", ext="json")
    fpath = os.path.join(EXPORT_DIR, fname)
    with open(fpath, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    return os.path.abspath(fpath)

def _slugify(name: str) -> str:
    name = name.lower()
    name = re.sub(r"[^a-z0-9]+","-",name).strip("-")
    return name or "persona"

def _read_text(path: str) -> str:
    """Legacy plain-text reader for txt/md/pdf only (JSON handled elsewhere)."""
    ext = os.path.splitext(path)[1].lower()
    if ext in [".txt", ".md", ".markdown"]:
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        except Exception:
            return ""
    if ext == ".pdf":
        try:
            pdf = PdfReader(path)
            return "\n\n".join([p.extract_text() or "" for p in pdf.pages])
        except Exception:
            return ""
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except Exception:
        return ""

def _chunk(text: str, size: int = 900, overlap: int = 140) -> List[str]:
    text = text.strip().replace("\r\n", "\n")
    out = []
    i = 0
    while i < len(text):
        out.append(text[i:i+size])
        i += (size - overlap)
    return [c for c in out if c.strip()]

def _load_meta() -> List[Dict[str, Any]]:
    if not os.path.exists(META_PATH):
        return []
    rows = []
    with open(META_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows

def _append_meta(rows: List[Dict[str, Any]]):
    with open(META_PATH, "a", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

def _save_faiss(index: faiss.Index):
    faiss.write_index(index, INDEX_PATH)

def _load_faiss() -> faiss.Index:
    if os.path.exists(INDEX_PATH):
        return faiss.read_index(INDEX_PATH)
    return faiss.IndexFlatIP(EMB_DIM)  # cosine via normalized inner product

def _normalize(v: np.ndarray) -> np.ndarray:
    n = np.linalg.norm(v, axis=1, keepdims=True) + 1e-12
    return v / n

# ---------- JSON corpus helpers (NEW) ----------
def _extract_texts_from_json_obj(obj: Any, filename: str) -> List[Tuple[str, str]]:
    out: List[Tuple[str, str]] = []

    def _pick_text(d: Dict[str, Any]) -> str:
        for k in ("text", "data", "content", "body"):
            v = d.get(k)
            if isinstance(v, str) and v.strip():
                return v
        return ""

    if isinstance(obj, dict):
        if isinstance(obj.get("sources"), list):
            for i, it in enumerate(obj["sources"]):
                if isinstance(it, dict):
                    txt = _pick_text(it)
                    if not txt: continue
                    url = (it.get("url") or "").strip()
                    label = f"{filename}::{url}" if url else f"{filename}::source_{i+1}"
                    out.append((label, txt))
        for key in ("documents", "docs"):
            if isinstance(obj.get(key), list):
                for i, it in enumerate(obj[key]):
                    if isinstance(it, dict):
                        txt = _pick_text(it)
                        if not txt: continue
                        url = (it.get("url") or "").strip()
                        label = f"{filename}::{url}" if url else f"{filename}::{key[:-1]}_{i+1}"
                        out.append((label, txt))
                    elif isinstance(it, str) and it.strip():
                        out.append((f"{filename}::{key[:-1]}_{i+1}", it))
        single = None
        for k in ("text", "data", "content", "body"):
            v = obj.get(k)
            if isinstance(v, str) and v.strip():
                single = v
                break
        if single:
            out.append((f"{filename}::single", single))

    elif isinstance(obj, list):
        for i, it in enumerate(obj):
            if isinstance(it, dict):
                txt = _pick_text(it)
                if not txt: continue
                url = (it.get("url") or "").strip()
                label = f"{filename}::{url}" if url else f"{filename}::item_{i+1}"
                out.append((label, txt))
            elif isinstance(it, str) and it.strip():
                out.append((f"{filename}::item_{i+1}", it))

    return out

def _extract_texts_from_path(path: str) -> List[Tuple[str, str]]:
    ext = os.path.splitext(path)[1].lower()
    if ext == ".json":
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                obj = json.load(f)
            items = _extract_texts_from_json_obj(obj, os.path.basename(path))
            return [(src, txt) for (src, txt) in items if (txt and txt.strip())]
        except Exception:
            raw = _read_text(path)
            return [(path, raw)] if raw.strip() else []
    else:
        raw = _read_text(path)
        return [(path, raw)] if raw.strip() else []

# ---------- Index build ----------
def _build_index_from_paths(paths: List[str]) -> Dict[str, Any]:
    index = _load_faiss()
    new_meta = []
    add_vecs: List[np.ndarray] = []
    ingested_docs = 0
    ingested_chunks = 0

    for p in paths:
        docs = _extract_texts_from_path(p)
        if not docs:
            continue
        for src_label, text in docs:
            chunks = _chunk(text)
            if not chunks:
                continue
            embs = embedder.encode(chunks, convert_to_numpy=True)
            embs = _normalize(embs).astype("float32")
            add_vecs.append(embs)

            for i, ch in enumerate(chunks):
                new_meta.append({
                    "id": _hash_id(f"{src_label}|{i}|{len(ch)}"),
                    "source": src_label,
                    "chunk_index": i,
                    "text": ch
                })
            ingested_docs += 1
            ingested_chunks += len(chunks)

    if not new_meta:
        return {"ok": True, "msg": "No readable text found.", "ingested_chunks": 0}

    add_mat = np.vstack(add_vecs).astype("float32")
    index.add(add_mat)
    _save_faiss(index)
    _append_meta(new_meta)
    return {"ok": True, "ingested_files": len(paths), "ingested_docs": ingested_docs, "ingested_chunks": ingested_chunks}

def _dedup_hits(hits: List[Dict[str,Any]]) -> List[Dict[str,Any]]:
    seen = set()
    out = []
    for h in hits:
        htxt = (h.get("text") or "").strip()
        key = hashlib.sha1(htxt.encode("utf-8")).hexdigest()
        if key in seen:
            continue
        seen.add(key)
        out.append(h)
    return out

def retrieve(query: str, k: int = 6) -> List[Dict[str, Any]]:
    meta = _load_meta()
    if not meta or not os.path.exists(INDEX_PATH):
        return []
    index = _load_faiss()
    q = embedder.encode([query], convert_to_numpy=True)
    q = _normalize(q).astype("float32")
    D, I = index.search(q, min(k*3, len(meta)))
    hits = []
    for score, idx in zip(D[0].tolist(), I[0].tolist()):
        if idx == -1:
            continue
        m = meta[idx]
        hits.append({
            "score": float(score),
            "text": m["text"],
            "source": m["source"],
            "chunk_index": m["chunk_index"]
        })
    hits = _dedup_hits(hits)
    return hits[:k]

# -----------------------------
# JSON hardening helpers
# -----------------------------
def _to_list(x: Any) -> list:
    return x if isinstance(x, list) else ([] if x is None else [x])

def _norm_1_10(v: Union[int, float, None]) -> Union[int, None]:
    if v is None: return None
    try:
        f = float(v)
    except Exception:
        return None
    f = max(0.0, min(10.0, f))
    return int(round(f))

def _maybe_scale_5_to_10(ratings: Dict[str, Any]) -> Dict[str, Any]:
    vals = [float(v) for v in ratings.values() if isinstance(v, (int, float))]
    if not vals:
        return ratings
    def _scale_or_none(v):
        if isinstance(v, (int, float)):
            return _norm_1_10(v * 2.0)
        return None
    if max(vals) <= 5.0:
        return {k: _scale_or_none(ratings.get(k)) for k in ratings}
    else:
        return {k: _norm_1_10(ratings.get(k)) for k in ratings}

def _coerce_suggestions(sugg: Any) -> List[Dict[str, Any]]:
    out = []
    for s in _to_list(sugg):
        if isinstance(s, dict):
            out.append({
                "text": s.get("text") or "",
                "rationale": s.get("rationale") or "",
                "supported_by": [int(i) for i in _to_list(s.get("supported_by")) if str(i).isdigit()],
                "impact": (s.get("impact") or "").lower() or "medium",
                "effort": (s.get("effort") or "").lower() or "medium",
                "quote_from_draft": s.get("quote_from_draft") or ""
            })
        else:
            out.append({
                "text": str(s),
                "rationale": "",
                "supported_by": [],
                "impact": "medium",
                "effort": "medium",
                "quote_from_draft": ""
            })
    return out

def _coerce_risks(risks: Any) -> List[Dict[str, Any]]:
    out = []
    for r in _to_list(risks):
        if isinstance(r, dict):
            sev = r.get("severity")
            out.append({
                "issue": r.get("issue") or (r.get("text") or ""),
                "rationale": r.get("rationale") or "",
                "supported_by": [int(i) for i in _to_list(r.get("supported_by")) if str(i).isdigit()],
                "severity": _norm_1_10(sev if isinstance(sev,(int,float)) else (float(sev) if str(sev).replace('.','',1).isdigit() else 5)),
                "mitigation": r.get("mitigation") or ""
            })
        else:
            out.append({
                "issue": str(r),
                "rationale": "",
                "supported_by": [],
                "severity": 5,
                "mitigation": ""
            })
    return out

# -----------------------------
# Anthropic helper
# -----------------------------
def _gen_with_fallbacks(system: str, user: str, temp: float, max_tokens: int) -> Dict[str,Any]:
    content = None
    used_model = None
    last_err = None
    seen = set()
    candidates = [m for m in MODEL_FALLBACKS if (m and not (m in seen or seen.add(m)))]
    for model_try in candidates:
        try:
            msg = anthropic.messages.create(
                model=model_try,
                temperature=temp,
                max_tokens=max_tokens,
                system=system,
                messages=[{"role": "user", "content": user}],
            )
            content = "".join([c.text for c in msg.content if getattr(c, "type", "") == "text"])
            used_model = model_try
            break
        except NotFoundError as e:
            last_err = e; continue
        except Exception as e:
            last_err = e; continue
    return {"content": content, "used_model": used_model, "error": last_err}

# -----------------------------
# Editorial bot call
# -----------------------------
def call_bot(bot: Dict[str,str], draft: str, hits: List[Dict[str,Any]], temp: float, max_tokens: int) -> Dict[str,Any]:
    ctx = "\n\n".join(
        f"[{i+1}] Source: {h['source']} (chunk {h['chunk_index']})\n{h['text']}"
        for i, h in enumerate(hits)
    ) if hits else "No context available."

    system = f"""{bot['system'].strip()}

{RAG_INSTR}
"""
    user = f"""JOURNALIST DRAFT:
---
{draft}
---

CONTEXT SNIPPETS:
{ctx}
"""

    out = _gen_with_fallbacks(system, user, temp, max_tokens)
    content, used_model = out["content"], out["used_model"]

    if content is None:
        return {
            "summary": "Model call failed for this bot.",
            "key_points": [],
            "suggestions": [],
            "risks": [],
            "ratings": {"clarity": 5, "accuracy": 5, "engagement": 5, "novelty": 5, "risk": 5},
            "headline_suggestions": [],
            "citations": [],
            "next_actions": ["Check or change CLAUDE_MODEL in .env."],
            "_model": "unavailable"
        }

    try:
        data = json.loads(content)
    except Exception:
        try:
            start = content.find("{"); end = content.rfind("}")
            data = json.loads(content[start:end+1]) if start != -1 and end != -1 else {}
        except Exception:
            data = {}

    summary = data.get("summary") or ""
    key_points = [str(x) for x in _to_list(data.get("key_points"))]
    suggestions = _coerce_suggestions(data.get("suggestions"))
    risks = _coerce_risks(data.get("risks"))
    ratings_raw = data.get("ratings") or {"clarity":5,"accuracy":5,"engagement":5,"novelty":5,"risk":5}
    ratings = _maybe_scale_5_to_10({
        "clarity": ratings_raw.get("clarity", 5),
        "accuracy": ratings_raw.get("accuracy", 5),
        "engagement": ratings_raw.get("engagement", 5),
        "novelty": ratings_raw.get("novelty", 5),
        "risk": ratings_raw.get("risk", 5),
    })
    headline_suggestions = [str(x) for x in _to_list(data.get("headline_suggestions"))]
    citations = [int(i) for i in _to_list(data.get("citations")) if str(i).isdigit()]
    next_actions = [str(x) for x in _to_list(data.get("next_actions"))]

    if bot["id"] != HEADLINE_BOT_ID:
        headline_suggestions = []

    return {
        "summary": summary,
        "key_points": key_points,
        "suggestions": suggestions,
        "risks": risks,
        "ratings": ratings,
        "headline_suggestions": headline_suggestions,
        "citations": citations,
        "next_actions": next_actions,
        "_model": used_model
    }

# -----------------------------
# Persona JSON extraction (robust)
# -----------------------------
def _extract_personas_from_content(content: str) -> List[Dict[str,Any]]:
    try:
        obj = json.loads(content)
        if isinstance(obj, dict) and isinstance(obj.get("personas"), list):
            return obj["personas"]
        if isinstance(obj, list):
            return obj
    except Exception:
        pass
    try:
        start = content.find("{"); end = content.rfind("}")
        if start != -1 and end != -1 and end > start:
            obj = json.loads(content[start:end+1])
            if isinstance(obj, dict) and isinstance(obj.get("personas"), list):
                return obj["personas"]
            if isinstance(obj, list):
                return obj
    except Exception:
        pass
    m = re.search(r'"personas"\s*:\s*(\[[\s\S]*\])', content)
    if m:
        arr_txt = m.group(1)
        try:
            arr = json.loads(arr_txt)
            if isinstance(arr, list):
                return arr
        except Exception:
            pass
    try:
        lb = content.find("["); rb = content.rfind("]")
        if lb != -1 and rb != -1 and rb > lb:
            arr = json.loads(content[lb:rb+1])
            if isinstance(arr, list):
                return arr
    except Exception:
        pass
    return []

# -----------------------------
# Dynamic Audience Persona Generation
# -----------------------------
def _generate_personas_once(draft: str, hits: List[Dict[str,Any]], target_n: int,
                            exclude_names: List[str], temp: float, max_tokens: int) -> List[Dict[str,str]]:
    ctx = "\n\n".join(
        f"[{i+1}] {h['source']} (chunk {h['chunk_index']})\n{h['text']}"
        for i, h in enumerate(hits)
    ) if hits else "No context available."

    system = """You are an audience research planner for a newsroom.
Design distinct, non-overlapping audience personas tailored to the article draft and context.
Each persona must be a realistic local stakeholder group with unique concerns and must NOT overlap with the others.
Return STRICT JSON only."""
    existing = ", ".join(sorted(set(exclude_names))) if exclude_names else "none"

    user = f"""ARTICLE DRAFT:
---
{draft}
---

CONTEXT (snippets; you may reference indices like [1..N] only in rationale strings):
{ctx}

EXISTING NAMES TO AVOID: [{existing}]
TASK:
Return a JSON object with EXACTLY {target_n} personas, each with:
- "name": short label e.g., "Nearby School Parent", "Small Landscaping Owner" (must not match existing names)
- "why_included": one sentence on why this audience matters (may reference [indices])
- "scope": 3–6 bullet topics this audience cares about (no overlap with other personas)
- "avoid_overlap_with": 2–5 bullets the persona will NOT cover (to keep personas distinct)
- "system_prompt": instruction block starting with "AUDIENCE ROLE: ..." that sets tone, scope, anti-goals

JSON SHAPE:
{{
  "personas":[
    {{"name":"...", "why_included":"...", "scope":["..."], "avoid_overlap_with":["..."], "system_prompt":"AUDIENCE ROLE: ..."}}
  ]
}}
STRICT: No commentary. Only JSON.
"""

    out = _gen_with_fallbacks(system, user, temp, max_tokens)
    content = out["content"]
    if not content:
        return []

    personas = _extract_personas_from_content(content)
    clean = []
    for p in personas:
        if not isinstance(p, dict):
            continue
        name = str(p.get("name","")).strip()
        if not name or name.lower() in {n.lower() for n in exclude_names}:
            continue
        sys = (p.get("system_prompt") or "").strip()
        if not sys:
            scope = "; ".join([str(x) for x in _to_list(p.get("scope"))][:6])
            avoid = "; ".join([str(x) for x in _to_list(p.get("avoid_overlap_with"))][:5])
            sys = f"""AUDIENCE ROLE: {name}.
SCOPE: {scope or "—"}.
AVOID OVERLAP: {avoid or "—"}.
DELIVER IN THE AUDIENCE SCHEMA ONLY."""
        clean.append({
            "id": f"aud-{_slugify(name)}",
            "name": name,
            "why_included": p.get("why_included",""),
            "system": sys
        })
    return clean

def generate_audience_personas(draft: str, hits: List[Dict[str,Any]], n: int = 5,
                               temp: float = 0.2, max_tokens: int = 1200) -> List[Dict[str,str]]:
    chosen: List[Dict[str,str]] = []
    p1 = _generate_personas_once(draft, hits, target_n=n, exclude_names=[], temp=temp, max_tokens=max_tokens)
    seen = set()
    for p in p1:
        if p["name"].lower() in seen:
            continue
        seen.add(p["name"].lower())
        chosen.append(p)
        if len(chosen) == n:
            break
    if len(chosen) < n:
        missing = n - len(chosen)
        exclude = [p["name"] for p in chosen]
        p2 = _generate_personas_once(draft, hits, target_n=missing, exclude_names=exclude, temp=temp, max_tokens=max_tokens)
        for p in p2:
            if p["name"].lower() in seen:
                continue
            seen.add(p["name"].lower())
            chosen.append(p)
            if len(chosen) == n:
                break
    if len(chosen) < n:
        defaults = _fallback_personas(draft)
        for d in defaults:
            if d["name"].lower() in seen:
                continue
            seen.add(d["name"].lower())
            chosen.append(d)
            if len(chosen) == n:
                break
    return chosen[:n]

def _fallback_personas(draft: str) -> List[Dict[str,str]]:
    defaults = [
        {"name":"Nearby School Parent","system":"AUDIENCE ROLE: Parent of students near schools. SCOPE: noise during school hours, learning impact, child health, quiet-hours enforcement. AVOID OVERLAP: business costs, taxation, citywide budget policy. DELIVER IN THE AUDIENCE SCHEMA ONLY."},
        {"name":"Small Landscaping Owner","system":"AUDIENCE ROLE: Owner of a 6–8 person landscaping crew. SCOPE: equipment cost, runtime, productivity, rebates, depot charging. AVOID OVERLAP: school impacts, broad health epidemiology. DELIVER IN THE AUDIENCE SCHEMA ONLY."},
        {"name":"Asthma-Impacted Household","system":"AUDIENCE ROLE: Household managing asthma. SCOPE: PM2.5, triggers, quiet zones near clinics, seasonal patterns, warning/signage. AVOID OVERLAP: business cashflow logistics. DELIVER IN THE AUDIENCE SCHEMA ONLY."},
        {"name":"City Budget Watcher","system":"AUDIENCE ROLE: Taxpayer focused on efficient public spending. SCOPE: rebate design, fairness, evaluation metrics, cost verification, enforcement costs. AVOID OVERLAP: school learning impacts. DELIVER IN THE AUDIENCE SCHEMA ONLY."},
        {"name":"Environmental Justice Resident","system":"AUDIENCE ROLE: Resident near busy corridors concerned with cumulative burdens. SCOPE: equity, hotspot neighborhoods, multilingual outreach, charger siting, exemption risks. AVOID OVERLAP: SEO/social media tactics. DELIVER IN THE AUDIENCE SCHEMA ONLY."},
    ]
    out = []
    for d in defaults:
        out.append({
            "id": f"aud-{_slugify(d['name'])}",
            "name": d["name"],
            "why_included": "",
            "system": d["system"]
        })
    return out

# -----------------------------
# Audience bot call
# -----------------------------
def call_audience_bot(bot: Dict[str,str], draft: str, hits: List[Dict[str,Any]], temp: float, max_tokens: int) -> Dict[str,Any]:
    ctx = "\n\n".join(
        f"[{i+1}] Source: {h['source']} (chunk {h['chunk_index']})\n{h['text']}"
        for i, h in enumerate(hits)
    ) if hits else "No context available."

    system = f"""{bot['system'].strip()}

{AUDIENCE_INSTR}
"""
    user = f"""ARTICLE DRAFT (for audience reaction):
---
{draft}
---

CONTEXT SNIPPETS (for evidence; cite like [3]):
{ctx}
"""

    out = _gen_with_fallbacks(system, user, temp, max_tokens)
    content, used_model = out["content"], out["used_model"]

    if content is None:
        return {
            "persona_takeaway": "Model call failed for this audience bot.",
            "stance": "mixed",
            "positives": [],
            "concerns": [],
            "questions_for_reporter": [],
            "scores": {"trust":5,"relevance":5,"share_intent":5},
            "likely_comment": "",
            "suggestions_to_journalist": [],
            "citations": [],
            "_model": "unavailable"
        }

    try:
        data = json.loads(content)
    except Exception:
        try:
            start = content.find("{"); end = content.rfind("}")
            data = json.loads(content[start:end+1]) if start != -1 and end != -1 else {}
        except Exception:
            data = {}

    def _aud_concerns(lst):
        out = []
        for c in _to_list(lst):
            if isinstance(c, dict):
                out.append({
                    "issue": c.get("issue",""),
                    "why": c.get("why",""),
                    "supported_by": [int(i) for i in _to_list(c.get("supported_by")) if str(i).isdigit()],
                    "severity": _norm_1_10(c.get("severity",5))
                })
            else:
                out.append({"issue": str(c), "why":"", "supported_by": [], "severity": 5})
        return out

    def _aud_sug(lst):
        out = []
        for s in _to_list(lst):
            if isinstance(s, dict):
                out.append({
                    "text": s.get("text",""),
                    "rationale": s.get("rationale",""),
                    "supported_by": [int(i) for i in _to_list(s.get("supported_by")) if str(i).isdigit()],
                })
            else:
                out.append({"text": str(s), "rationale": "", "supported_by": []})
        return out

    scores = data.get("scores") or {}
    scores = {
        "trust": _norm_1_10(scores.get("trust",5)),
        "relevance": _norm_1_10(scores.get("relevance",5)),
        "share_intent": _norm_1_10(scores.get("share_intent",5)),
    }

    res = {
        "persona_takeaway": data.get("persona_takeaway",""),
        "stance": (data.get("stance","mixed") or "mixed"),
        "positives": [str(x) for x in _to_list(data.get("positives"))],
        "concerns": _aud_concerns(data.get("concerns")),
        "questions_for_reporter": [str(x) for x in _to_list(data.get("questions_for_reporter"))],
        "scores": scores,
        "likely_comment": data.get("likely_comment",""),
        "suggestions_to_journalist": _aud_sug(data.get("suggestions_to_journalist")),
        "citations": [int(i) for i in _to_list(data.get("citations")) if str(i).isdigit()],
        "_model": used_model
    }
    return res

# -----------------------------
# Aggregations
# -----------------------------
def aggregate_editorial(all_results: Dict[str, Dict[str,Any]]) -> Dict[str,Any]:
    ratings = {"clarity":[], "accuracy":[], "engagement":[], "novelty":[], "risk":[]}
    suggestions_texts, risks_texts = [], []
    citations = set()

    for res in all_results.values():
        r = res.get("ratings") or {}
        for k in ratings:
            v = r.get(k)
            if isinstance(v, (int,float)):
                ratings[k].append(float(v))
        for s in res.get("suggestions") or []:
            if isinstance(s, dict):
                if s.get("text"): suggestions_texts.append(s["text"].strip().lower())
                for c in _to_list(s.get("supported_by")):
                    if isinstance(c, int): citations.add(c)
            else:
                suggestions_texts.append(str(s).strip().lower())
        for ri in res.get("risks") or []:
            if isinstance(ri, dict):
                if ri.get("issue"): risks_texts.append(ri["issue"].strip().lower())
                for c in _to_list(ri.get("supported_by")):
                    if isinstance(c, int): citations.add(c)
            else:
                risks_texts.append(str(ri).strip().lower())
        for c in res.get("citations") or []:
            if isinstance(c, int): citations.add(c)

    avg = {k: round(sum(v)/len(v), 2) if v else None for k,v in ratings.items()}

    def tally(items):
        counts = {}
        for s in items:
            if not s: continue
            counts[s] = counts.get(s, 0) + 1
        ranked = sorted(counts.items(), key=lambda x: x[1], reverse=True)
        return [{"item": k, "count": c} for k,c in ranked]

    return {
        "scores_avg": avg,
        "consensus_suggestions": tally(suggestions_texts)[:10],
        "consensus_risks": tally(risks_texts)[:10],
        "context_citations_used": sorted(list(citations)),
    }

def aggregate_audience(per_audience: Dict[str, Dict[str,Any]]) -> Dict[str,Any]:
    trust, relevance, share = [], [], []
    concerns, questions = [], []
    stance_counts = {"support":0, "oppose":0, "mixed":0}
    for res in per_audience.values():
        sc = res.get("scores") or {}
        if isinstance(sc.get("trust"), (int,float)): trust.append(float(sc["trust"]))
        if isinstance(sc.get("relevance"), (int,float)): relevance.append(float(sc["relevance"]))
        if isinstance(sc.get("share_intent"), (int,float)): share.append(float(sc["share_intent"]))
        for c in res.get("concerns") or []:
            if isinstance(c, dict) and c.get("issue"):
                concerns.append(c["issue"].strip().lower())
        for q in res.get("questions_for_reporter") or []:
            questions.append(str(q).strip().lower())
        st = (res.get("stance") or "mixed").lower()
        if st in stance_counts: stance_counts[st] += 1
    def tally(items):
        counts = {}
        for s in items:
            if not s: continue
            counts[s] = counts.get(s, 0) + 1
        return sorted([{"item":k,"count":c} for k,c in counts.items()], key=lambda x: x["count"], reverse=True)[:10]
    return {
        "avg_scores": {
            "trust": round(sum(trust)/len(trust),2) if trust else None,
            "relevance": round(sum(relevance)/len(relevance),2) if relevance else None,
            "share_intent": round(sum(share)/len(share),2) if share else None,
        },
        "stance_counts": stance_counts,
        "top_concerns": tally(concerns),
        "top_questions": tally(questions),
    }

# -----------------------------
# Synthetic seed data (optional demo)
# -----------------------------
SAMPLE_DRAFT = """\
City Council Eyes 2027 Gas Leaf Blower Phase-Out Amid Noise and Emissions Concerns

A proposed ordinance would phase out gas-powered leaf blowers by 2027, citing high-decibel noise and local air-quality impacts. 
Small landscaping firms warn that battery equipment is costly and may not last full shifts. The city says pilot programs in 
two districts cut complaints and reduced particulate spikes on high-use days. The plan includes rebates for low-income crews, 
quiet hours near clinics and schools, and a review of exemptions for wildfire clean-up. Opponents say city modeling underestimates 
replacement costs; supporters argue health gains and worker hearing protection justify the timeline. 
"""

SYNTHETIC_DOCS = {
    "policy_brief.txt": """\
Leaf Blower Policy Brief (2024)
- WHO community noise guidelines: prolonged exposure above 55 dB contributes to annoyance and cardiovascular risks.
- Gas leaf blowers typically 70–90 dB at operator; bystanders experience 60–75 dB at 15–20m.
- Two pilot districts saw ~22% reduction in noise complaints and ~12% reduction in measured PM2.5 on landscaping days.
- Battery runtime varies (30–90 minutes per pack) depending on power setting and ambient temperature.
- Trade-in + rebate programs in six peer cities increased adoption among small firms.""",
    "economics_note.md": """\
Economics of Transition
- Upfront cost: battery backpack blowers and multiple packs; amortized costs depend on duty cycle and electricity prices.
- Some cities offer per-crew rebates ($400–$1,200) and utility off-peak charging discounts.
- Productivity gap narrows with improved battery CFM ratings and optimized charging logistics (swap stations).""",
    "health_research.txt": """\
Health and Air Quality
- Two-stroke engines emit unburned hydrocarbons and fine particulates; exposure correlates with respiratory irritation.
- Hearing protection standards recommend limiting exposure above 85 dB for workers.
- Hospital outpatient visits for asthma flare-ups tend to cluster on high landscaping activity days in some datasets (observational).""",
    "implementation_playbook.md": """\
Implementation Playbook
- Phased timeline: procurement training -> trade-in -> quiet-hours enforcement -> review exemptions.
- Outreach: multilingual guides for small firms, hands-on demos, shared charging hubs in depots.
- Metrics: complaint counts, spot dB readings, PM2.5 near parks/schools, adoption rates by firm size.""",
    "comparative_policies.txt": """\
Comparative Policies
- City A (2023): full ban within 3 years; funded $1.5M in rebates; noise complaints down 18%.
- City B (2022): seasonal restrictions + quiet hours; PM2.5 monitors showed modest improvement.
- City C (2024): exemption for wildfire clean-up periods; required signage for enforcement education.""",
}

def write_seed_files():
    written = []
    for fname, content in SYNTHETIC_DOCS.items():
        path = os.path.join(DATA_DIR, fname)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        written.append(path)
    return written

# -----------------------------
# Handoff helpers
# -----------------------------
def _cleanup_handoffs():
    """Remove expired tokens."""
    now = time.time()
    expired = [t for t, v in HANDOFFS.items() if now - v.get("ts", 0) > HANDOFF_TTL_SECONDS]
    for t in expired:
        HANDOFFS.pop(t, None)

def _consume_token(token: str) -> Dict[str, Any]:
    """Return payload if token valid & unexpired; pop it (one-time)."""
    _cleanup_handoffs()
    info = HANDOFFS.pop(token, None)
    if not info:
        return {}
    if time.time() - info.get("ts", 0) > HANDOFF_TTL_SECONDS:
        return {}
    return info

# -----------------------------
# Routes: UI
# -----------------------------
@app.get("/")
def index():
    """
    If ?token=... is present, prefill the draft <textarea id="draft"> and optionally autostart.
    We inject a tiny inline <script> right before </body> so you don't need to change index.html.
    """
    token = request.args.get("token", "").strip()
    autostart = request.args.get("autostart", "0").strip() in ("1", "true", "yes")

    # Render the base template first
    html = render_template("index.html")

    if not token:
        return html

    info = _consume_token(token)
    draft = (info.get("draft") or "").strip() if info else ""
    if not draft:
        # Token invalid/expired, just show page
        return html

    # Inject a script that fills the textarea and optionally clicks Analyze
    injection = f"""
<script>
window.addEventListener('DOMContentLoaded', function(){{
  try {{
    var draft = {json.dumps(draft)};
    var ta = document.getElementById('draft');
    if (ta) ta.value = draft;
    var autostart = {json.dumps(bool(autostart))};
    if (autostart) {{
      var btn = document.getElementById('analyzeBtn');
      if (btn) btn.click();
    }}
  }} catch (e) {{}}
}});
</script>
"""
    # Insert before </body>
    if "</body>" in html:
        html = html.replace("</body>", injection + "\n</body>")
    else:
        html = html + injection
    return make_response(html)

@app.get("/")
def index():
    return render_template("index.html")
@app.get("/run/<run_id>")
def run_view(run_id: str):
    """Simple page that fetches /api/run/<run_id> and renders results (template must exist)."""
    return render_template("run.html", run_id=run_id)

@app.get("/sample_draft")
def sample_draft():
    return jsonify({"draft": SAMPLE_DRAFT})

# -----------------------------
# Routes: API
# -----------------------------
@app.get("/health")
def health():
    return jsonify({"ok": True, "time": datetime.utcnow().isoformat()+"Z"})

@app.get("/bots")
def bots():
    return jsonify([{"id": f"bot{str(i+1).zfill(2)}", "name": b["name"]} for i, b in enumerate(BOTS)])

@app.post("/seed")
def seed():
    paths = write_seed_files()
    # reset index/meta for clean demo
    if os.path.exists(INDEX_PATH): os.remove(INDEX_PATH)
    if os.path.exists(META_PATH): os.remove(META_PATH)
    return jsonify(_build_index_from_paths(paths))

@app.post("/ingest")
def ingest():
    body = request.get_json(silent=True) or {}
    glob_pattern = body.get("glob_pattern", "data/docs/**/*.*")
    paths = glob.glob(glob_pattern, recursive=True)
    if not paths:
        return jsonify({"ok": False, "msg": "No files matched.", " ingested_chunks": 0})
    return jsonify(_build_index_from_paths(paths))

@app.post("/ingest/upload")
def ingest_upload():
    if "file" not in request.files:
        return jsonify({"ok": False, "msg": "No file provided"}), 400
    file = request.files["file"]
    filename = file.filename or "upload"
    content = file.read()
    ext = os.path.splitext(filename)[1].lower()

    index = _load_faiss()
    new_meta = []
    add_vecs: List[np.ndarray] = []
    total_chunks = 0
    ingested_docs = 0

    if ext == ".json":
        try:
            obj = json.loads(content.decode("utf-8", errors="ignore"))
        except Exception:
            return jsonify({"ok": False, "msg": "Invalid JSON"}), 400
        docs = _extract_texts_from_json_obj(obj, filename)
        if not docs:
            return jsonify({"ok": False, "msg": "No usable texts in JSON"}), 400
        for src_label, text in docs:
            chunks = _chunk(text)
            if not chunks:
                continue
            embs = embedder.encode(chunks, convert_to_numpy=True)
            embs = _normalize(embs).astype("float32")
            add_vecs.append(embs)
            for i, ch in enumerate(chunks):
                new_meta.append({
                    "id": _hash_id(f"{src_label}|{i}|{len(ch)}"),
                    "source": src_label,
                    "chunk_index": i,
                    "text": ch
                })
            total_chunks += len(chunks)
            ingested_docs += 1
    else:
        text = ""
        try:
            text = content.decode("utf-8", errors="ignore")
        except Exception:
            try:
                pdf = PdfReader(io.BytesIO(content))
                text = "\n\n".join([p.extract_text() or "" for p in pdf.pages])
            except Exception:
                return jsonify({"ok": False, "msg": "Unsupported file"}), 400

        chunks = _chunk(text)
        if not chunks:
            return jsonify({"ok": False, "msg": "No text extracted."}), 400

        embs = embedder.encode(chunks, convert_to_numpy=True)
        embs = _normalize(embs).astype("float32")
        add_vecs.append(embs)

        for i, ch in enumerate(chunks):
            new_meta.append({
                "id": _hash_id(f"{filename}|{i}|{len(ch)}"),
                "source": filename,
                "chunk_index": i,
                "text": ch
            })
        total_chunks = len(chunks)
        ingested_docs = 1

    if not new_meta:
        return jsonify({"ok": False, "msg": "Nothing to index"}), 400

    add_mat = np.vstack(add_vecs).astype("float32")
    index.add(add_mat)
    _save_faiss(index)
    _append_meta(new_meta)

    return jsonify({"ok": True, "file": filename, "docs": ingested_docs, "chunks": total_chunks})

@app.post("/search")
def search():
    body = request.get_json(silent=True) or {}
    query = body.get("query", "")
    top_k = int(body.get("top_k", 6))
    return jsonify({"results": retrieve(query, top_k)})

@app.post("/analyze")
def analyze():
    body = request.get_json(silent=True) or {}
    draft = body.get("draft", "").strip()
    if not draft:
        return jsonify({"ok": False, "msg": "Missing 'draft'"}), 400

    top_k = int(body.get("top_k", 8))
    temperature = float(body.get("temperature", 0.3))  # precision
    max_tokens = int(body.get("max_tokens", 900))

    retrieval_query = f"Key claims and entities in this draft: {draft[:2000]}"
    hits = retrieve(retrieval_query, top_k)

    audience_personas = generate_audience_personas(
        draft, hits, n=5, temp=0.2, max_tokens=1200
    )

    per_bot = {}
    for i, bot in enumerate(BOTS):
        bot_id = f"bot{str(i+1).zfill(2)}"
        try:
            per_bot[bot_id] = call_bot({"id": bot_id, **bot}, draft, hits, temperature, max_tokens)
        except Exception as e:
            per_bot[bot_id] = {
                "summary": "Bot failed to generate.",
                "key_points": [],
                "suggestions": [],
                "risks": [],
                "ratings": {"clarity": 5, "accuracy": 5, "engagement": 5, "novelty": 5, "risk": 5},
                "headline_suggestions": [],
                "citations": [],
                "next_actions": ["Retry or check server logs."],
                "_model": "n/a",
                "_error": f"{type(e).__name__}: {e}"
            }

    per_audience = {}
    for a in audience_personas:
        try:
            per_audience[a["id"]] = call_audience_bot(a, draft, hits, temperature, max_tokens)
        except Exception as e:
            per_audience[a["id"]] = {
                "persona_takeaway": "Audience bot failed to generate.",
                "stance": "mixed",
                "positives": [],
                "concerns": [],
                "questions_for_reporter": [],
                "scores": {"trust":5,"relevance":5,"share_intent":5},
                "likely_comment": "",
                "suggestions_to_journalist": [],
                "citations": [],
                "_model": "n/a",
                "_error": f"{type(e).__name__}: {e}"
            }

    editorial_rollup = aggregate_editorial(per_bot)
    headline_pool = (per_bot.get(HEADLINE_BOT_ID, {}) or {}).get("headline_suggestions", [])[:12]
    audience_rollup = aggregate_audience(per_audience)

    response_payload = {
        "bots": [{"id": f"bot{str(i+1).zfill(2)}", "name": b["name"]} for i, b in enumerate(BOTS)],
        "audience_bots": [
            {"id": a["id"], "name": a["name"], "why_included": a.get("why_included","")}
            for a in audience_personas
        ],
        "retrieval": {
            "query_used": retrieval_query,
            "snippets": [
                {
                    "idx": i+1,
                    "source": h["source"],
                    "chunk_index": h["chunk_index"],
                    "score": h["score"],
                    "text": h["text"]
                }
                for i, h in enumerate(hits)
            ]
        },
        "per_bot": per_bot,
        "per_audience": per_audience,
        "report": {
            "overall_scores_avg": editorial_rollup["scores_avg"],
            "top_consensus_suggestions": editorial_rollup["consensus_suggestions"],
            "top_consensus_risks": editorial_rollup["consensus_risks"],
            "headline_ideas_pool": headline_pool,
            "citations_used": editorial_rollup["context_citations_used"],
        },
        "audience_report": {
            "avg_scores": audience_rollup["avg_scores"],
            "stance_counts": audience_rollup["stance_counts"],
            "top_concerns": audience_rollup["top_concerns"],
            "top_questions": audience_rollup["top_questions"],
        }
    }

    export_payload = {
        "meta": {
            "timestamp_utc": datetime.utcnow().isoformat() + "Z",
            "params": {"top_k": top_k, "temperature": temperature, "max_tokens": max_tokens},
            "models": {"fallbacks": MODEL_FALLBACKS},
        },
        "input": {
            "draft": draft,
            "retrieval_query": retrieval_query
        },
        "retrieval": response_payload["retrieval"],
        "editorial": {
            "bots": response_payload["bots"],
            "per_bot": per_bot,
            "rollup": editorial_rollup,
            "headline_pool": headline_pool
        },
        "audience": {
            "personas": audience_personas,
            "per_audience": per_audience,
            "rollup": audience_rollup
        }
    }

    export_file_path = save_run_json(export_payload, draft)

# NEW: derive a run_id from the export filename (without .json)
    run_id = os.path.splitext(os.path.basename(export_file_path))[0]

# include these in the response
    response_payload["export_file"] = export_file_path
    response_payload["run_id"] = run_id
    response_payload["ok"] = True

    return jsonify(response_payload)

# -----------------------------
# Handoff API
# -----------------------------
@app.post("/handoff")
def handoff():
    """
    Body: { draft: str, communityId?: str }
    Returns: { ok: true, token: "..." }
    """
    body = request.get_json(silent=True) or {}
    draft = (body.get("draft") or "").strip()
    community_id = (body.get("communityId") or "").strip()
    if not draft:
        return jsonify({"ok": False, "msg": "Missing 'draft'"}), 400

    _cleanup_handoffs()
    tok = token_urlsafe(18)
    HANDOFFS[tok] = {"draft": draft, "communityId": community_id, "ts": time.time()}
    return jsonify({"ok": True, "token": tok, "ttl_seconds": HANDOFF_TTL_SECONDS})

@app.get("/api/run/<run_id>")
def api_run(run_id: str):
    """Return the saved export JSON for a completed run."""
    path = os.path.join(EXPORT_DIR, f"{run_id}.json")
    if not os.path.exists(path):
        return jsonify({"ok": False, "msg": "Run not found"}), 404
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return jsonify({"ok": True, "run_id": run_id, "data": data})


if __name__ == "__main__":
    print(f"[Anthropic] CLAUDE_MODEL (env): {os.getenv('CLAUDE_MODEL') or '(none)'}")
    print(f"[Anthropic] Model candidates: {MODEL_FALLBACKS}")
    app.run(host="0.0.0.0", port=5000, debug=True)
