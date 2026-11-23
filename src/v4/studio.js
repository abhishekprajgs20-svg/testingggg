// QUIZINOX v4.0 — CONTENT CREATOR STUDIO
// One source → many study outputs. Upload a PDF / TXT or paste text, tick any combination of
// outputs (notes, facts, MCQs, flashcards, statement questions, revision sheet, question paper,
// worksheet, mock test), and the AI generates them one by one with progress. Every output is
// linked to its source, can be edited, regenerated on its own, exported (TXT / PDF) or sent to
// the Quiz Library / Flashcards / Mock tests.
export default function studioPage(C) {
  const { $, $$, esc, escMl, toast, modal, confirmBox, saveFile, slug } = C;
  const store = () => { const d = C.db; if (!d.studio || typeof d.studio !== 'object') d.studio = { projects: [] }; if (!Array.isArray(d.studio.projects)) d.studio.projects = []; return d.studio; };
  const persist = () => C.save();
  const MAXSRC = 40000; // chars of source kept for AI context (long docs are sampled)

  const OUTPUTS = {
    notes: { icon: '📒', name: 'Chapter-wise notes', desc: 'Structured topic notes with headings & key takeaways', kind: 'md' },
    facts: { icon: '💎', name: 'Important facts doc', desc: 'High-yield facts, dates, numbers & definitions', kind: 'md' },
    mcq: { icon: '✓✗', name: 'MCQ question set', desc: 'N multiple-choice questions → save to Quiz Library', kind: 'quiz' },
    flash: { icon: '🃏', name: 'Flashcards', desc: 'N front/back cards → added to Flashcards deck', kind: 'flash' },
    statement: { icon: '☑', name: 'Statement-based questions', desc: 'Which statements are correct/incorrect UPSC-style', kind: 'md' },
    revision: { icon: '⏱', name: 'Printable revision sheet', desc: 'One-page rapid revision sheet', kind: 'pdf' },
    paper: { icon: '📝', name: 'Question paper', desc: 'Full question paper with separate answer key (PDF)', kind: 'pdf' },
    worksheet: { icon: '📋', name: 'Practice worksheet', desc: 'Short exercises with blanks & answers', kind: 'pdf' },
    mock: { icon: '⏳', name: 'Timed mock test', desc: 'N-question exam-style paper → save to Mock tests', kind: 'quiz' },
  };
  const DEFAULT_SEL = ['notes', 'facts', 'mcq', 'flash'];

  let P = null, sel = [...DEFAULT_SEL], busy = false, abort = null, genProg = null;

  /* ---------------- source intake ---------------- */
  async function readSource(file) {
    if (!file) return null;
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (file.type === 'application/pdf' || ext === 'pdf') {
      const { extractPages, genericText } = await C.getPdfEngines();
      const pages = await extractPages(file);
      return { name: file.name, text: genericText(pages).slice(0, MAXSRC), pages: pages.length, ext: 'pdf' };
    }
    const text = await file.text();
    return { name: file.name, text: text.slice(0, MAXSRC), pages: 0, ext };
  }

  /* ---------------- AI generation ---------------- */
  const prompts = {
    notes: (s, n) => `Turn this study material into clear CHAPTER-WISE NOTES.\n${s}\n\nRules: organised with ## headings (topic > sub-topic), bullet points, bold key terms, a "Key takeaway" line per section. Cover everything important but compress. No fluff. Markdown.`,
    facts: (s, n) => `Extract the MOST IMPORTANT FACTS from this material into a high-yield facts document.\n${s}\n\nRules: one fact per bullet, group under ## headings (dates, numbers, definitions, articles, names…), only exam-relevant facts. Markdown.`,
    mcq: (s, n) => `Create EXACTLY ${n} multiple-choice questions from this material.\n${s}\n\nRules: 4 options each, exactly one correct, exam-style (UPSC/SSC level), mix of easy/medium/hard, include a one-line explanation per question. Return ONLY JSON: {"questions":[{"question":"...","options":["a","b","c","d"],"correct":0,"explanation":"..."}]}`,
    flash: (s, n) => `Create EXACTLY ${n} flashcards from this material.\n${s}\n\nRules: front = short question/term, back = crisp answer (under 40 words), only high-yield content. Return ONLY JSON: {"cards":[{"front":"...","back":"..."}]}`,
    statement: (s, n) => `Create ${Math.min(15, Math.max(5, Math.round(n / 2)))} STATEMENT-BASED questions (UPSC Prelims style: "Consider the following statements… which is/are correct?") from this material.\n${s}\n\nRules: 2-4 statements each, options like "1 only / 2 only / Both / Neither", state the answer + explanation after each. Markdown, clearly numbered.`,
    revision: (s, n) => `Create a ONE-PAGE PRINTABLE REVISION SHEET from this material.\n${s}\n\nRules: ultra-condensed — only names, dates, numbers, formulas, definitions and 5-second-recall triggers. Dense bullets, tight headings, fits one page. Markdown.`,
    paper: (s, n) => `Create a full QUESTION PAPER of ${n} questions from this material.\n${s}\n\nFormat strictly: first the paper itself (numbered questions, MCQ with 4 options, plus 2-3 short-answer questions at the end), then a line "--- ANSWER KEY ---" followed by answers with brief explanations. Markdown.`,
    worksheet: (s, n) => `Create a PRACTICE WORKSHEET from this material.\n${s}\n\nRules: fill-in-the-blanks, match-the-following, one-liner questions and 3 MCQs. Student answers on the sheet; keep a separate answer section after "--- ANSWERS ---". Markdown.`,
    mock: (s, n) => `Create a TIMED MOCK TEST of EXACTLY ${n} MCQs from this material, exam-style difficulty.\n${s}\n\nRules: 4 options, one correct, realistic distractors, one-line explanation each. Return ONLY JSON: {"questions":[{"question":"...","options":["a","b","c","d"],"correct":0,"explanation":"..."}]}`,
  };
  const countFor = key => key === 'mock' ? 25 : key === 'mcq' ? 20 : 30;

  async function generate(key) {
    const o = OUTPUTS[key], p = P, src = p.src;
    o; // eslint
    p.outputs[key] = { status: 'running', text: '', at: Date.now(), from: 'AI' };
    busy = true; abort = new AbortController(); drawDetail();
    try {
      const r = await C.AI.aiCall(prompts[key](src.text, countFor(key)), {
        json: key === 'mcq' || key === 'flash' || key === 'mock',
        maxTokens: key === 'mcq' || key === 'mock' ? 4000 : 3200, temperature: 0.5,
        signal: abort.signal,
        system: 'You are QUIZINOX Content Studio — an expert exam-content generator. Be accurate, exam-relevant and concise.',
        onStatus: s => { const e = $('#csStatus'); if (e) e.textContent = `Generating ${o.name}… ${s}`; },
      });
      const out = p.outputs[key];
      out.status = 'done'; out.text = r.text; out.meta = { model: C.AI.modelLabel(r.provider, r.model), keyLabel: r.keyLabel || '' };
    } catch (e) {
      const out = p.outputs[key];
      out.status = e.code === 'abort' ? 'idle' : 'error';
      if (out.status === 'error') out.text = e.message;
    } finally { busy = false; abort = null; }
    persist(); drawDetail();
  }

  async function generateSelected() {
    const keys = sel.filter(k => (P.outputs[k]?.status || 'idle') !== 'running');
    if (!keys.length) return;
    genProg = { i: 0, n: keys.length };
    for (const k of keys) { genProg.i++; await generate(k); if (P.outputs[k]?.status === 'error') break; }
    genProg = null; persist(); drawDetail();
    toast('Generation finished ✓');
  }

  /* ---------------- consuming outputs ---------------- */
  async function saveQuizOut(key) {
    const out = P.outputs[key]; if (!out?.text) return;
    let qs = [];
    try { qs = C.parseJSON(out.text); } catch (e) { return toast('Could not parse questions: ' + e.message, 5000); }
    if (!qs.length) return toast('No valid questions found in the output');
    const q = C.quizTemplate(`${P.name} — ${key === 'mock' ? 'Mock test' : 'MCQs'}`);
    q.questions = qs; q.subject = P.name;
    if (key === 'mock') { q.settings.timer = qs.length * 72; q.settings.negative = 0.33; }
    C.db.quizzes.unshift(q); persist();
    toast(`${qs.length} questions saved to Quiz Library ✓`);
  }
  async function saveFlashOut() {
    const out = P.outputs.flash; if (!out?.text) return;
    let cards = [];
    try { const d = C.AI.parseJsonLoose(out.text); cards = d.cards || d; } catch (e) { return toast('Could not parse flashcards: ' + e.message, 5000); }
    if (!Array.isArray(cards) || !cards.length) return toast('No cards found');
    const { addCardsToDeck } = await import('../upsc/flash.js');
    const r = addCardsToDeck(P.name, cards, 'studio');
    toast(`Added ${r.added} flashcards${r.skipped ? ` (${r.skipped} duplicates skipped)` : ''} ✓`);
  }
  async function exportOut(key) {
    const out = P.outputs[key]; if (!out?.text || out.status !== 'done') return;
    const o = OUTPUTS[key]; const base = slug(P.name) + '-' + key;
    if (o.kind === 'pdf') {
      const { jsPDF } = await C.getJsPDF();
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const margin = 48, maxW = doc.internal.pageSize.getWidth() - margin * 2;
      doc.setFontSize(15); doc.setFont(undefined, 'bold'); doc.text(P.name + ' — ' + o.name, margin, margin);
      doc.setFontSize(9.5); doc.setFont(undefined, 'normal');
      let y = margin + 24;
      const raw = out.text.replace(/^```(?:markdown|md)?\s*|\s*```$/g, '');
      for (const line of raw.split('\n')) {
        const txt = line.replace(/^#+\s*/, '').replace(/\*\*/g, '');
        const bold = /^#+\s*\*\*/.test(line) || line.startsWith('#');
        if (y > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin; }
        doc.setFont(undefined, bold ? 'bold' : 'normal');
        doc.setFontSize(bold ? 11 : 9.5);
        const chunks = doc.splitTextToSize(txt || ' ', maxW);
        chunks.forEach(c => { if (y > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin; } doc.text(c, margin, y); y += (bold ? 15 : 13); });
      }
      doc.save(base + '.pdf'); toast('PDF saved ✓');
    } else {
      const r = await saveFile(base + '.md', out.text, 'text/markdown');
      toast(`Saved (${r.where}) ✓`);
    }
  }

  /* ---------------- rendering ---------------- */
  const outState = k => P.outputs[k]?.status || 'idle';
  const stateChip = s => s === 'done' ? '<span class="v4-chip ok">✓ done</span>' : s === 'running' ? '<span class="v4-chip run">⏳ generating</span>' : s === 'error' ? '<span class="v4-chip err">✕ failed</span>' : '<span class="v4-chip">· not generated</span>';

  function draw() { P ? drawDetail() : drawList(); }

  function drawList() {
    const projects = store().projects;
    C.view.innerHTML = `
    <div class="page-title"><div><div class="eyebrow">ONE SOURCE → EVERY FORMAT</div><h1>Creator Studio</h1><p>Ek PDF, notes ya text upload karo — aur AI se notes, facts, MCQs, flashcards, statement questions, revision sheet, question paper, worksheet aur mock test sab generate karo. Har output source se linked, alag-alag edit / regenerate / export ho sakta hai.</p></div>
    <div class="title-actions row"><button class="primary" id="csNew">＋ New project</button></div></div>
    ${projects.length ? `<div class="v4-grid">${projects.map(p => { const done = Object.values(p.outputs || {}).filter(o => o.status === 'done').length, total = Object.keys(p.outputs || {}).length; return `<button class="v4-card" data-open="${p.id}"><b>${esc(p.name)}</b><small>${p.src?.ext?.toUpperCase() || 'TXT'} · ${p.src?.pages || 0} pages · ${done}/${total} outputs</small><span class="v4-chip">${new Date(p.at).toLocaleDateString()}</span></button>`; }).join('')}</div>` : `<div class="empty-hero"><div class="empty-icon">🛠</div><h3>No projects yet</h3><p>Upload a PDF or paste text, pick outputs, and let AI build your study pack.</p><button class="primary" id="csNew2">＋ Create first project</button></div>`}`;
    $('#csNew').onclick = newProject;
    const n2 = $('#csNew2'); if (n2) n2.onclick = newProject;
    $$('[data-open]').forEach(b => b.onclick = () => { P = store().projects.find(x => x.id === b.dataset.open); sel = DEFAULT_SEL.filter(k => outState(k) !== 'done'); draw(); });
  }

  function newProject() {
    const { el, close } = modal(`<div class="eyebrow">🛠 NEW PROJECT</div><h2>Content Creator Studio</h2>
      <label>Project name<input id="csName" placeholder="e.g. Indian Economy — Budget & Banking"/></label>
      <div class="two-col" style="margin:8px 0">
        <button class="secondary" id="csPdf">📄 Upload PDF</button>
        <button class="secondary" id="csTxt">📝 Upload TXT / MD</button>
      </div>
      <label>…or paste text directly<textarea id="csPaste" rows="5" placeholder="Paste your study material here…"></textarea></label>
      <div class="muted">PDF text is extracted on-device. Long documents are auto-summarised to fit the AI context.</div>
      <div class="dialog-actions"><button class="textbtn" id="csCancel">Cancel</button><button class="primary" id="csCreate">Create project ➤</button></div>`);
    let src = null;
    $('#csPdf', el).onclick = async () => { const f = await C.pickFile('.pdf'); if (!f) return; toast('Reading PDF…'); src = await readSource(f); toast(`✓ ${src.pages} pages extracted`); };
    $('#csTxt', el).onclick = async () => { const f = await C.pickFile('.txt,.md,.csv,.text'); if (!f) return; src = await readSource(f); toast('✓ File loaded'); };
    $('#csCancel', el).onclick = close;
    $('#csCreate', el).onclick = () => {
      const name = $('#csName', el).value.trim() || (src?.name?.replace(/\.[^.]+$/, '')) || 'Untitled project';
      if (!src) { const t = $('#csPaste', el).value.trim(); if (t.length < 200) return toast('Add a source: upload a file or paste at least ~200 characters'); src = { name: 'pasted-text', text: t.slice(0, MAXSRC), pages: 0, ext: 'txt' }; }
      if (!C.AI.aiReady()) { toast('Add an AI key (or sign in) in Settings first'); return C.setTab('settings'); }
      P = { id: C.uid(), name, at: Date.now(), src, outputs: {} };
      store().projects.unshift(P); if (store().projects.length > 30) store().projects.length = 30;
      persist(); close(); draw();
    };
    setTimeout(() => $('#csName', el)?.focus(), 30);
  }

  function drawDetail() {
    const prog = genProg ? `<div class="v4-prog"><i style="width:${Math.round(genProg.i / genProg.n * 100)}%"></i><small id="csStatus">Generating ${genProg.i}/${genProg.n}…</small></div>` : (busy ? '<div class="v4-prog"><i style="width:40%"></i><small id="csStatus">Generating…</small></div>' : '');
    C.view.innerHTML = `
    <div class="page-title"><div><div class="eyebrow">🛠 CREATOR STUDIO · PROJECT</div><h1>${esc(P.name)}</h1><p>Source: <b>${esc(P.src.name)}</b> · ${P.src.pages || 0} pages · ${P.src.ext?.toUpperCase()} · ${(P.src.text.length / 1000).toFixed(1)}k chars · created ${new Date(P.at).toLocaleDateString()}</p></div>
    <div class="title-actions row"><button class="secondary" id="csBack">← Projects</button><button class="textbtn danger-text" id="csDelete">Delete project</button></div></div>
    ${prog}
    <div class="panel"><div class="panel-head"><div><h3>Source preview</h3><p>First part of the extracted text</p></div><button class="textbtn" id="csSrcView">View all</button></div><div class="v4-ai-out" style="max-height:140px;overflow:auto">${esc(P.src.text.slice(0, 700))}${P.src.text.length > 700 ? '…' : ''}</div></div>
    <div class="panel"><div class="panel-head"><div><h3>Pick outputs</h3><p>Tick any combination — each is generated independently and linked to this source</p></div><div><button class="secondary" id="csGen" ${busy ? 'disabled' : ''}>✦ Generate selected (${sel.length})</button></div></div>
      <div class="v4-sel-list">${Object.entries(OUTPUTS).map(([k, o]) => { const st = outState(k); return `<button class="v4-sel ${sel.includes(k) ? 'on' : ''}" data-out="${k}" ${st === 'running' ? 'disabled' : ''}><b>${o.icon} ${o.name}</b><small>${o.desc}</small>${stateChip(st)}${P.outputs[k]?.meta ? `<small class="muted">via ${esc(P.outputs[k].meta.model)}</small>` : ''}</button>`; }).join('')}</div></div>
    ${Object.entries(P.outputs).filter(([, o]) => o.status === 'done' || o.status === 'error').map(([k, o]) => outputPanel(k, o)).join('')}`;
    $('#csBack').onclick = () => { P = null; draw(); };
    $('#csDelete').onclick = async () => { if (await confirmBox('Delete this project?', `"${P.name}" and all its outputs will be removed.`, 'Delete', true)) { store().projects = store().projects.filter(x => x.id !== P.id); persist(); P = null; draw(); } };
    $('#csSrcView').onclick = () => modal(`<h3>${esc(P.src.name)}</h3><div class="v4-ai-out" style="max-height:60vh;overflow:auto;white-space:pre-wrap">${esc(P.src.text.slice(0, 12000))}${P.src.text.length > 12000 ? '\n…(truncated)' : ''}</div>`);
    $('#csGen').onclick = () => { if (!sel.length) return toast('Tick at least one output'); if (!C.AI.aiReady()) { toast('Add an AI key in Settings first'); return C.setTab('settings'); } generateSelected(); };
    $$('[data-out]').forEach(b => b.onclick = () => { const k = b.dataset.out; sel = sel.includes(k) ? sel.filter(x => x !== k) : [...sel, k]; drawDetail(); });
    $$('[data-edit]').forEach(b => b.onclick = () => editOut(b.dataset.edit));
    $$('[data-regen]').forEach(b => b.onclick = () => { const k = b.dataset.regen; sel = [k]; drawDetail(); generate(k); });
    $$('[data-exp]').forEach(b => b.onclick = () => exportOut(b.dataset.exp));
    $$('[data-saveq]').forEach(b => b.onclick = () => saveQuizOut(b.dataset.saveq));
    $$('[data-savef]').forEach(b => b.onclick = saveFlashOut);
  }

  function outputPanel(k, o) {
    const def = OUTPUTS[k];
    if (o.status === 'error') return `<div class="panel"><div class="panel-head"><div><h3>${def.icon} ${def.name}</h3></div>${stateChip('error')}</div><div class="red-text">${esc(o.text)}</div><div class="row" style="margin-top:8px"><button class="secondary" data-regen="${k}">↻ Retry</button></div></div>`;
    const canQuiz = def.kind === 'quiz' && (k === 'mcq' || k === 'mock');
    return `<div class="panel"><div class="panel-head"><div><h3>${def.icon} ${def.name}</h3><p>Generated ${new Date(o.at).toLocaleString()} · ${esc(o.meta?.model || 'AI')}</p></div><div class="row">
      ${canQuiz ? `<button class="secondary" data-saveq="${k}">${k === 'mock' ? '⏳ Save as mock test' : '✓ Save to Quiz Library'}</button>` : ''}
      ${k === 'flash' ? '<button class="secondary" data-savef>🃏 Add to Flashcards</button>' : ''}
      <button class="secondary" data-edit="${k}">✎ Edit</button><button class="secondary" data-regen="${k}">↻ Regenerate</button><button class="primary" data-exp="${k}">⇩ Export ${def.kind === 'pdf' ? 'PDF' : 'MD'}</button></div></div>
      <div class="v4-ai-out" style="max-height:260px;overflow:auto">${k === 'mcq' || k === 'mock' || k === 'flash' ? `<pre style="white-space:pre-wrap;font:inherit">${esc(o.text.slice(0, 1500))}${o.text.length > 1500 ? '…' : ''}</pre>` : C.md(o.text.slice(0, 3000)) + (o.text.length > 3000 ? '<div class="muted">…(open editor to see all)</div>' : '')}</div></div>`;
  }

  function editOut(k) {
    const o = P.outputs[k]; const def = OUTPUTS[k];
    const { el, close } = modal(`<div class="eyebrow">${def.icon} EDIT OUTPUT</div><h2>${def.name}</h2>
      <textarea id="csEd" rows="14" style="width:100%">${escMl(o.text)}</textarea>
      <div class="dialog-actions"><button class="textbtn" id="csEdCancel">Cancel</button><button class="primary" id="csEdSave">Save changes</button></div>`, { wide: true });
    $('#csEdCancel', el).onclick = close;
    $('#csEdSave', el).onclick = () => { o.text = $('#csEd', el).value; o.meta = { ...(o.meta || {}), model: (o.meta?.model || '') + ' · edited' }; persist(); close(); drawDetail(); toast('Output updated ✓'); };
  }

  draw();
}
