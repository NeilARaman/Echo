const $ = (id)=>document.getElementById(id);
const statusEl = $("status");

async function postJSON(url, body, isForm=false) {
  const res = await fetch(url, {
    method: "POST",
    headers: isForm ? {} : {"Content-Type":"application/json"},
    body: isForm ? body : JSON.stringify(body || {})
  });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.json();
}

function setStatus(msg){ if(statusEl) statusEl.textContent = msg; }

function renderSnippets(snips){
  const box = $("snippets");
  if(!box) return;
  box.innerHTML = "";
  if(!snips || !snips.length){
    box.innerHTML = "<p class='warn'>No retrieval context yet.</p>";
    return;
  }
  snips.forEach(s=>{
    const div = document.createElement("div");
    div.className = "card";
    const score = (typeof s.score === "number") ? s.score.toFixed(3) : "-";
    div.innerHTML = `<h4>[${s.idx}] ${s.source} (chunk ${s.chunk_index})</h4><p>${s.text}</p><div class="tag">score ${score}</div>`;
    box.appendChild(div);
  });
}

function renderReport(report){
  const scores = report.overall_scores_avg || {};
  const el = $("scores");
  if(el){
    el.innerHTML = `
      <div class="kv">
        <span class="pill">clarity: <b>${scores.clarity ?? "-"}/10</b></span>
        <span class="pill">accuracy: <b>${scores.accuracy ?? "-"}/10</b></span>
        <span class="pill">engagement: <b>${scores.engagement ?? "-"}/10</b></span>
        <span class="pill">novelty: <b>${scores.novelty ?? "-"}/10</b></span>
        <span class="pill">risk: <b>${scores.risk ?? "-"}/10</b></span>
      </div>
    `;
  }

  const consSug = $("consSuggestions");
  if(consSug){
    consSug.innerHTML = "";
    (report.top_consensus_suggestions || []).forEach(x=>{
      const li = document.createElement("li");
      li.textContent = `${x.item} (${x.count})`;
      consSug.appendChild(li);
    });
  }

  const consRisk = $("consRisks");
  if(consRisk){
    consRisk.innerHTML = "";
    (report.top_consensus_risks || []).forEach(x=>{
      const li = document.createElement("li");
      li.textContent = `${x.item} (${x.count})`;
      consRisk.appendChild(li);
    });
  }

  const head = $("headlines");
  if(head){
    head.innerHTML = "";
    (report.headline_ideas_pool || []).forEach(h=>{
      const li = document.createElement("li");
      li.textContent = h;
      head.appendChild(li);
    });
  }
}

function renderBots(bots, perBot){
  const cards = $("botCards");
  if(!cards) return;
  cards.innerHTML = "";

  const formatCites = (arr) => (arr && arr.length ? arr.map(x=>`[${x}]`).join(" ") : "—");

  bots.forEach(b=>{
    const r = perBot[b.id] || {};
    const ratings = r.ratings || {};
    const cite = (r.citations || []).map(c=>`[${c}]`).join(" ");
    const kp = (r.key_points || []).map(x=>`<li>${x}</li>`).join("");

    const sug = (r.suggestions || []).map(x=>{
      if (typeof x === "string") return `<li>${x}</li>`;
      return `<li>
        <div><b>${x.text || ""}</b></div>
        ${x.rationale ? `<div class="muted">${x.rationale}</div>` : ""}
        <div class="tag">impact: ${x.impact || "-"}</div>
        <div class="tag">effort: ${x.effort || "-"}</div>
        <div class="tag">cites: ${formatCites(x.supported_by || [])}</div>
      </li>`;
    }).join("");

    const risk = (r.risks || []).map(x=>{
      if (typeof x === "string") return `<li>${x}</li>`;
      return `<li>
        <div><b>${x.issue || ""}</b></div>
        ${x.rationale ? `<div class="muted">${x.rationale}</div>` : ""}
        <div class="tag">severity: ${x.severity ?? "-"}/10</div>
        <div class="tag">cites: ${formatCites(x.supported_by || [])}</div>
        ${x.mitigation ? `<div class="badge">mitigation: ${x.mitigation}</div>` : ""}
      </li>`;
    }).join("");

    const heads = (r.headline_suggestions || []).map(x=>`<li>${x}</li>`).join("");
    const acts = (r.next_actions || []).map(x=>`<li>${x}</li>`).join("");

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h4>${b.name}</h4>
      <p>${r.summary || ""}</p>
      <div class="kv">
        <span class="pill">clarity ${ratings.clarity ?? "-"}/10</span>
        <span class="pill">accuracy ${ratings.accuracy ?? "-"}/10</span>
        <span class="pill">engagement ${ratings.engagement ?? "-"}/10</span>
        <span class="pill">novelty ${ratings.novelty ?? "-"}/10</span>
        <span class="pill">risk ${ratings.risk ?? "-"}/10</span>
      </div>
      <h5>Key Points</h5><ul>${kp}</ul>
      <h5>Suggestions</h5><ul>${sug}</ul>
      <h5 class="warn">Risks</h5><ul>${risk}</ul>
      ${heads ? `<h5>Headline Suggestions</h5><ul>${heads}</ul>` : ""}
      ${acts ? `<h5>Next Actions</h5><ul>${acts}</ul>` : ""}
      <div class="tag">Citations: ${cite || "—"}</div>
    `;
    cards.appendChild(card);
  });
}

function renderAudienceReport(aud) {
  const box = $("audienceScores");
  if(!box) return;
  const s = aud.avg_scores || {};
  const st = aud.stance_counts || {};
  const concerns = aud.top_concerns || [];
  const questions = aud.top_questions || [];

  box.innerHTML = `
    <div class="kv">
      <span class="pill">trust: <b>${s.trust ?? "-"}/10</b></span>
      <span class="pill">relevance: <b>${s.relevance ?? "-"}/10</b></span>
      <span class="pill">share intent: <b>${s.share_intent ?? "-"}/10</b></span>
      <span class="pill">stance — support: ${st.support||0}, oppose: ${st.oppose||0}, mixed: ${st.mixed||0}</span>
    </div>
  `;

  const ulC = $("audienceTopConcerns");
  const ulQ = $("audienceTopQuestions");
  if (ulC) {
    ulC.innerHTML = "";
    concerns.forEach(x=>{
      const li = document.createElement("li");
      li.textContent = `${x.item} (${x.count})`;
      ulC.appendChild(li);
    });
  }
  if (ulQ) {
    ulQ.innerHTML = "";
    questions.forEach(x=>{
      const li = document.createElement("li");
      li.textContent = `${x.item} (${x.count})`;
      ulQ.appendChild(li);
    });
  }
}

function renderAudienceCards(audBots, perAudience){
  const cards = $("audienceCards");
  if(!cards) return;
  cards.innerHTML = "";

  const formatCites = (arr) => (arr && arr.length ? arr.map(x=>`[${x}]`).join(" ") : "—");

  audBots.forEach(a=>{
    const r = perAudience[a.id] || {};
    const pos = (r.positives || []).map(x=>`<li>${x}</li>`).join("");
    const concerns = (r.concerns || []).map(x=>{
      if (typeof x === "string") return `<li>${x}</li>`;
      return `<li>
        <div><b>${x.issue || ""}</b></div>
        ${x.why ? `<div class="muted">${x.why}</div>` : ""}
        <div class="tag">severity: ${x.severity ?? "-"}/10</div>
        <div class="tag">cites: ${formatCites(x.supported_by || [])}</div>
      </li>`;
    }).join("");
    const qs = (r.questions_for_reporter || []).map(x=>`<li>${x}</li>`).join("");
    const sugs = (r.suggestions_to_journalist || []).map(x=>{
      if (typeof x === "string") return `<li>${x}</li>`;
      return `<li><b>${x.text || ""}</b>${x.rationale?` — <span class="muted">${x.rationale}</span>`:""} <span class="tag">cites: ${formatCites(x.supported_by||[])}</span></li>`;
    }).join("");
    const cites = (r.citations || []).map(x=>`[${x}]`).join(" ");

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h4>${a.name}</h4>
      ${a.why_included ? `<p class="muted">${a.why_included}</p>` : ""}
      <p>${r.persona_takeaway || ""}</p>
      <div class="kv">
        <span class="pill">stance: ${r.stance || "-"}</span>
        <span class="pill">trust ${r.scores?.trust ?? "-"}/10</span>
        <span class="pill">relevance ${r.scores?.relevance ?? "-"}/10</span>
        <span class="pill">share ${r.scores?.share_intent ?? "-"}/10</span>
      </div>
      ${pos ? `<h5>Positives</h5><ul>${pos}</ul>` : ""}
      ${concerns ? `<h5 class="warn">Concerns</h5><ul>${concerns}</ul>` : ""}
      ${qs ? `<h5>Questions for Reporter</h5><ul>${qs}</ul>` : ""}
      ${sugs ? `<h5>Suggestions to Journalist</h5><ul>${sugs}</ul>` : ""}
      ${r.likely_comment ? `<div class="badge">Likely Comment: “${r.likely_comment}”</div>` : ""}
      <div class="tag">Citations: ${cites || "—"}</div>
    `;
    cards.appendChild(card);
  });
}

async function seed() {
  try{
    setStatus("Seeding synthetic corpus…");
    const res = await postJSON("/seed", {});
    setStatus(`Seeded: ${res.ingested_files || 0} files, ${res.ingested_chunks || 0} chunks.`);
  }catch(e){
    setStatus(`Seed failed: ${e.message}`);
  }
}

async function ingestGlob(){
  const globPattern = $("globInput").value;
  try{
    setStatus("Ingesting glob…");
    const res = await postJSON("/ingest", {glob_pattern: globPattern});
    setStatus(`Ingested: ${res.ingested_files || 0} files, ${res.ingested_chunks || 0} chunks.`);
  }catch(e){
    setStatus(`Ingest failed: ${e.message}`);
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
    setStatus(`Uploaded: ${res.file}, chunks: ${res.chunks}`);
  }catch(e){
    setStatus(`Upload failed: ${e.message}`);
  }
}

async function loadSample(){
  try{
    const res = await fetch("/sample_draft").then(r=>r.json());
    $("draft").value = res.draft || "";
  }catch(e){
    setStatus(`Load sample failed: ${e.message}`);
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
    setStatus(`Analyze failed: ${e.message}`);
  }
}

window.addEventListener("DOMContentLoaded", ()=>{
  $("seedBtn")?.addEventListener("click", seed);
  $("ingestBtn")?.addEventListener("click", ingestGlob);
  $("fileInput")?.addEventListener("change", uploadFile);
  $("loadSample")?.addEventListener("click", loadSample);
  $("analyzeBtn")?.addEventListener("click", analyze);
});
