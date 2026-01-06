const $ = (id)=>document.getElementById(id);
const statusEl = $("status");

async function postJSON(url, body, isForm=false) {
  const res = await fetch(url, {
    method: "POST",
    headers: isForm ? {} : {"Content-Type":"application/json"},
    body: isForm ? body : JSON.stringify(body || {})
  });
  if (!res.ok) throw new Error(url + " " + res.status);
  return res.json();
}

function setStatus(msg){ if(statusEl) statusEl.textContent = msg; }

// Helper to create elements with text content safely
function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

// Helper to create a pill span
function createPill(text) {
  const span = document.createElement("span");
  span.className = "pill";
  span.textContent = text;
  return span;
}

function renderSnippets(snips){
  const box = $("snippets");
  if(!box) return;
  box.textContent = "";
  if(!snips || !snips.length){
    box.appendChild(createEl("p", "warn", "No retrieval context yet."));
    return;
  }
  snips.forEach(s=>{
    const div = createEl("div", "card");
    const score = (typeof s.score === "number") ? s.score.toFixed(3) : "-";
    div.appendChild(createEl("h4", null, "[" + (s.idx || "") + "] " + (s.source || "") + " (chunk " + (s.chunk_index || "") + ")"));
    div.appendChild(createEl("p", null, s.text || ""));
    div.appendChild(createEl("div", "tag", "score " + score));
    box.appendChild(div);
  });
}

function renderReport(report){
  const scores = report.overall_scores_avg || {};
  const el = $("scores");
  if(el){
    el.textContent = "";
    const kv = createEl("div", "kv");
    kv.appendChild(createPill("clarity: " + (scores.clarity ?? "-") + "/10"));
    kv.appendChild(createPill("accuracy: " + (scores.accuracy ?? "-") + "/10"));
    kv.appendChild(createPill("engagement: " + (scores.engagement ?? "-") + "/10"));
    kv.appendChild(createPill("novelty: " + (scores.novelty ?? "-") + "/10"));
    kv.appendChild(createPill("risk: " + (scores.risk ?? "-") + "/10"));
    el.appendChild(kv);
  }

  const consSug = $("consSuggestions");
  if(consSug){
    consSug.textContent = "";
    (report.top_consensus_suggestions || []).forEach(x=>{
      consSug.appendChild(createEl("li", null, (x.item || "") + " (" + x.count + ")"));
    });
  }

  const consRisk = $("consRisks");
  if(consRisk){
    consRisk.textContent = "";
    (report.top_consensus_risks || []).forEach(x=>{
      consRisk.appendChild(createEl("li", null, (x.item || "") + " (" + x.count + ")"));
    });
  }

  const head = $("headlines");
  if(head){
    head.textContent = "";
    (report.headline_ideas_pool || []).forEach(h=>{
      head.appendChild(createEl("li", null, h));
    });
  }
}

function renderBots(bots, perBot){
  const cards = $("botCards");
  if(!cards) return;
  cards.textContent = "";

  const formatCites = (arr) => (arr && arr.length ? arr.map(x=>"["+x+"]").join(" ") : "—");

  bots.forEach(b=>{
    const r = perBot[b.id] || {};
    const ratings = r.ratings || {};
    const cite = (r.citations || []).map(c=>"["+c+"]").join(" ");

    const card = createEl("div", "card");
    card.appendChild(createEl("h4", null, b.name || ""));
    card.appendChild(createEl("p", null, r.summary || ""));

    const kv = createEl("div", "kv");
    kv.appendChild(createPill("clarity " + (ratings.clarity ?? "-") + "/10"));
    kv.appendChild(createPill("accuracy " + (ratings.accuracy ?? "-") + "/10"));
    kv.appendChild(createPill("engagement " + (ratings.engagement ?? "-") + "/10"));
    kv.appendChild(createPill("novelty " + (ratings.novelty ?? "-") + "/10"));
    kv.appendChild(createPill("risk " + (ratings.risk ?? "-") + "/10"));
    card.appendChild(kv);

    // Key Points
    card.appendChild(createEl("h5", null, "Key Points"));
    const kpUl = document.createElement("ul");
    (r.key_points || []).forEach(x => kpUl.appendChild(createEl("li", null, x)));
    card.appendChild(kpUl);

    // Suggestions
    card.appendChild(createEl("h5", null, "Suggestions"));
    const sugUl = document.createElement("ul");
    (r.suggestions || []).forEach(x => {
      const li = document.createElement("li");
      if (typeof x === "string") {
        li.textContent = x;
      } else {
        li.appendChild(createEl("div", null, x.text || ""));
        if (x.rationale) li.appendChild(createEl("div", "muted", x.rationale));
        li.appendChild(createEl("div", "tag", "impact: " + (x.impact || "-")));
        li.appendChild(createEl("div", "tag", "effort: " + (x.effort || "-")));
        li.appendChild(createEl("div", "tag", "cites: " + formatCites(x.supported_by || [])));
      }
      sugUl.appendChild(li);
    });
    card.appendChild(sugUl);

    // Risks
    card.appendChild(createEl("h5", "warn", "Risks"));
    const riskUl = document.createElement("ul");
    (r.risks || []).forEach(x => {
      const li = document.createElement("li");
      if (typeof x === "string") {
        li.textContent = x;
      } else {
        li.appendChild(createEl("div", null, x.issue || ""));
        if (x.rationale) li.appendChild(createEl("div", "muted", x.rationale));
        li.appendChild(createEl("div", "tag", "severity: " + (x.severity ?? "-") + "/10"));
        li.appendChild(createEl("div", "tag", "cites: " + formatCites(x.supported_by || [])));
        if (x.mitigation) li.appendChild(createEl("div", "badge", "mitigation: " + x.mitigation));
      }
      riskUl.appendChild(li);
    });
    card.appendChild(riskUl);

    // Headline Suggestions
    if (r.headline_suggestions && r.headline_suggestions.length) {
      card.appendChild(createEl("h5", null, "Headline Suggestions"));
      const headUl = document.createElement("ul");
      r.headline_suggestions.forEach(x => headUl.appendChild(createEl("li", null, x)));
      card.appendChild(headUl);
    }

    // Next Actions
    if (r.next_actions && r.next_actions.length) {
      card.appendChild(createEl("h5", null, "Next Actions"));
      const actUl = document.createElement("ul");
      r.next_actions.forEach(x => actUl.appendChild(createEl("li", null, x)));
      card.appendChild(actUl);
    }

    card.appendChild(createEl("div", "tag", "Citations: " + (cite || "—")));
    cards.appendChild(card);
  });
}

function renderAudienceReport(aud) {
  const box = $("audienceScores");
  if(!box) return;
  const s = aud.avg_scores || {};
  const st = aud.stance_counts || {};

  box.textContent = "";
  const kv = createEl("div", "kv");
  kv.appendChild(createPill("trust: " + (s.trust ?? "-") + "/10"));
  kv.appendChild(createPill("relevance: " + (s.relevance ?? "-") + "/10"));
  kv.appendChild(createPill("share intent: " + (s.share_intent ?? "-") + "/10"));
  kv.appendChild(createPill("stance — support: " + (st.support||0) + ", oppose: " + (st.oppose||0) + ", mixed: " + (st.mixed||0)));
  box.appendChild(kv);

  const concerns = aud.top_concerns || [];
  const questions = aud.top_questions || [];

  const ulC = $("audienceTopConcerns");
  const ulQ = $("audienceTopQuestions");
  if (ulC) {
    ulC.textContent = "";
    concerns.forEach(x=>{
      ulC.appendChild(createEl("li", null, (x.item || "") + " (" + x.count + ")"));
    });
  }
  if (ulQ) {
    ulQ.textContent = "";
    questions.forEach(x=>{
      ulQ.appendChild(createEl("li", null, (x.item || "") + " (" + x.count + ")"));
    });
  }
}

function renderAudienceCards(audBots, perAudience){
  const cards = $("audienceCards");
  if(!cards) return;
  cards.textContent = "";

  const formatCites = (arr) => (arr && arr.length ? arr.map(x=>"["+x+"]").join(" ") : "—");

  audBots.forEach(a=>{
    const r = perAudience[a.id] || {};
    const cites = (r.citations || []).map(x=>"["+x+"]").join(" ");

    const card = createEl("div", "card");
    card.appendChild(createEl("h4", null, a.name || ""));
    if (a.why_included) card.appendChild(createEl("p", "muted", a.why_included));
    card.appendChild(createEl("p", null, r.persona_takeaway || ""));

    const kv = createEl("div", "kv");
    kv.appendChild(createPill("stance: " + (r.stance || "-")));
    kv.appendChild(createPill("trust " + (r.scores?.trust ?? "-") + "/10"));
    kv.appendChild(createPill("relevance " + (r.scores?.relevance ?? "-") + "/10"));
    kv.appendChild(createPill("share " + (r.scores?.share_intent ?? "-") + "/10"));
    card.appendChild(kv);

    // Positives
    const pos = r.positives || [];
    if (pos.length) {
      card.appendChild(createEl("h5", null, "Positives"));
      const posUl = document.createElement("ul");
      pos.forEach(x => posUl.appendChild(createEl("li", null, x)));
      card.appendChild(posUl);
    }

    // Concerns
    const concerns = r.concerns || [];
    if (concerns.length) {
      card.appendChild(createEl("h5", "warn", "Concerns"));
      const conUl = document.createElement("ul");
      concerns.forEach(x => {
        const li = document.createElement("li");
        if (typeof x === "string") {
          li.textContent = x;
        } else {
          li.appendChild(createEl("div", null, x.issue || ""));
          if (x.why) li.appendChild(createEl("div", "muted", x.why));
          li.appendChild(createEl("div", "tag", "severity: " + (x.severity ?? "-") + "/10"));
          li.appendChild(createEl("div", "tag", "cites: " + formatCites(x.supported_by || [])));
        }
        conUl.appendChild(li);
      });
      card.appendChild(conUl);
    }

    // Questions for Reporter
    const qs = r.questions_for_reporter || [];
    if (qs.length) {
      card.appendChild(createEl("h5", null, "Questions for Reporter"));
      const qsUl = document.createElement("ul");
      qs.forEach(x => qsUl.appendChild(createEl("li", null, x)));
      card.appendChild(qsUl);
    }

    // Suggestions to Journalist
    const sugs = r.suggestions_to_journalist || [];
    if (sugs.length) {
      card.appendChild(createEl("h5", null, "Suggestions to Journalist"));
      const sugsUl = document.createElement("ul");
      sugs.forEach(x => {
        const li = document.createElement("li");
        if (typeof x === "string") {
          li.textContent = x;
        } else {
          const textSpan = createEl("span", null, x.text || "");
          li.appendChild(textSpan);
          if (x.rationale) {
            li.appendChild(document.createTextNode(" — "));
            li.appendChild(createEl("span", "muted", x.rationale));
          }
          li.appendChild(document.createTextNode(" "));
          li.appendChild(createEl("span", "tag", "cites: " + formatCites(x.supported_by||[])));
        }
        sugsUl.appendChild(li);
      });
      card.appendChild(sugsUl);
    }

    if (r.likely_comment) {
      card.appendChild(createEl("div", "badge", 'Likely Comment: "' + r.likely_comment + '"'));
    }
    card.appendChild(createEl("div", "tag", "Citations: " + (cites || "—")));
    cards.appendChild(card);
  });
}

async function seed() {
  try{
    setStatus("Seeding synthetic corpus…");
    const res = await postJSON("/seed", {});
    setStatus("Seeded: " + (res.ingested_files || 0) + " files, " + (res.ingested_chunks || 0) + " chunks.");
  }catch(e){
    setStatus("Seed failed: " + e.message);
  }
}

async function ingestGlob(){
  const globPattern = $("globInput").value;
  try{
    setStatus("Ingesting glob…");
    const res = await postJSON("/ingest", {glob_pattern: globPattern});
    setStatus("Ingested: " + (res.ingested_files || 0) + " files, " + (res.ingested_chunks || 0) + " chunks.");
  }catch(e){
    setStatus("Ingest failed: " + e.message);
  }
}

async function uploadFile(){
  const f = $("fileInput").files[0];
  if(!f){ setStatus("Pick a file first."); return; }
  const form = new FormData();
  form.append("file", f);
  try{
    setStatus("Uploading & ingesting…");
    const res = await postJSON("/ingest/upload", form, true);
    setStatus("Uploaded: " + res.file + ", chunks: " + res.chunks);
  }catch(e){
    setStatus("Upload failed: " + e.message);
  }
}

async function loadSample(){
  try{
    const res = await fetch("/sample_draft").then(r=>r.json());
    $("draft").value = res.draft || "";
  }catch(e){
    setStatus("Load sample failed: " + e.message);
  }
}

async function analyze(){
  const draft = $("draft").value.trim();
  if(!draft){ setStatus("Please paste a draft first."); return; }
  setStatus("Analyzing across editorial + dynamic audience bots…");
  const body = {
    draft,
    top_k: parseInt($("topK").value || "8", 10),
    temperature: parseFloat($("temp").value || "0.3"),
    max_tokens: parseInt($("maxTok").value || "900", 10)
  };
  try{
    const res = await postJSON("/analyze", body);
    setStatus("Done.");
    renderSnippets(res.retrieval.snippets || []);
    renderReport(res.report || {});
    renderBots(res.bots || [], res.per_bot || {});
    renderAudienceReport(res.audience_report || {});
    renderAudienceCards(res.audience_bots || [], res.per_audience || {});
  }catch(e){
    setStatus("Analyze failed: " + e.message);
  }
}

window.addEventListener("DOMContentLoaded", ()=>{
  $("seedBtn")?.addEventListener("click", seed);
  $("ingestBtn")?.addEventListener("click", ingestGlob);
  $("fileInput")?.addEventListener("change", uploadFile);
  $("loadSample")?.addEventListener("click", loadSample);
  $("analyzeBtn")?.addEventListener("click", analyze);
});
