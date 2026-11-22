// QUIZINOX v2.9 — feature pages (loaded on demand): Mock & Section builder, Achievements, Mistake Notebook,
import { generateNonVerbal, NV_KINDS, NV_ALL } from './figures.js';
import { EXPL_TYPES, explRule, explPer, VERBAL_TYPES } from './ai-modes.js';
// Quizinox Analyser and Quizinox Predictor. Nothing here touches the older features.
let C = null; // ctx of the page being drawn
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dayKey = d => new Date(d).toLocaleDateString('en-CA');
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const fmtMin = m => m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ' ' + (m % 60) + 'm' : ''}` : `${m} min`;

/* =====================================================================================
   MOCK & SECTION TESTS
   ===================================================================================== */
let B = null; // builder state
const newSection = (n = 1) => ({ id: Math.random().toString(36).slice(2), name: `Section ${n}`, count: 20, minutes: 30, src: 'quiz', quizIds: [], order: 'random', topic: '', exam: 'UPSC Prelims', diff: 'Mixed', lang: 'English', expl: 'short', rk: ['nv_series', 'nv_odd', 'nv_mirror', 'nv_matrix', 'vr_series', 'vr_coding'], txt: '', manual: [{ text: '', o: ['', '', '', ''], c: 0, ex: '' }] });
const TIME_PRESETS = [120, 90, 60, 45, 30, 15, 10];

function mocksPage() {
  const db = C.db, list = db.quizzes.filter(q => q.kind);
  C.view.innerHTML = `<div class="page-title"><div><div class="eyebrow">EXAM SIMULATION</div><h1>Mock &amp; Section tests</h1><p>Real exam conditions — section timers, negative marking, auto-submit, no explanations until the result.</p></div></div>
  <div class="x-hero-cards"><button class="x-hero-card" id="mkMock"><span class="x-hero-ic">◷</span><b>Full Mock Test Simulator</b><small>Several sections (subjects), each with its own timer, questions from your quizzes, AI, TXT or typed by hand. Starts in Exam, Practice or OMR mode.</small><em>Build a mock →</em></button><button class="x-hero-card x-alt" id="mkSection"><span class="x-hero-ic">▤</span><b>Section Mode</b><small>One focused section: choose time and number of questions, then fill it from existing quizzes (random or in sequence), a TXT file, instant AI or manual entry.</small><em>Create a section test →</em></button></div>
  <div class="panel"><div class="panel-head"><div><h3>Your mock &amp; section tests</h3><p>${list.length ? 'Tap Start — you will be asked for Exam / Practice / OMR mode.' : 'Nothing here yet. Build your first mock above.'}</p></div></div>${list.map(q => { const n = q.sections?.length || 0, tm = q.secTiming === 'overall' ? (q.totalMinutes || 0) : (q.sections || []).reduce((s, x) => s + (Number(x.minutes) || 0), 0); return `<div class="quiz-row" data-id="${q.id}"><div class="quiz-symbol">${q.kind === 'mock' ? '◷' : q.kind === 'mistake-mock' ? '✎' : '▤'}</div><div class="quiz-info"><b>${C.esc(q.title)}</b><small>${q.questions.length} questions · ${n} section${n === 1 ? '' : 's'}${tm ? ' · ' + fmtMin(tm) : ''}${q.settings?.negative ? ' · −' + q.settings.negative + ' negative' : ''}</small></div><button class="primary" data-start="${q.id}">▶ Start</button><button class="iconbtn danger" data-del="${q.id}" title="Delete">×</button></div>`; }).join('')}</div>`;
  $('#mkMock').onclick = () => openBuilder('mock'); $('#mkSection').onclick = () => openBuilder('section');
  $$('[data-start]').forEach(b => b.onclick = () => C.chooseMode(b.dataset.start));
  $$('[data-del]').forEach(b => b.onclick = async () => { const q = C.db.quizzes.find(x => x.id === b.dataset.del); if (q && await C.confirmBox('Delete this test?', `“${q.title}” will be removed.`, 'Delete', true)) { C.db.quizzes = C.db.quizzes.filter(x => x.id !== q.id); C.save(); mocksPage(); } });
}
function openBuilder(kind) {
  B = { kind, title: '', neg: 0.33, pass: 40, timing: 'section', totalMin: 120, sections: [newSection(1)] };
  if (kind === 'mock') { B.sections.push(newSection(2)); B.sections[0].name = 'General Studies'; B.sections[1].name = 'CSAT'; }
  else { B.sections[0].name = 'Section test'; B.sections[0].minutes = 20; B.sections[0].count = 20; }
  drawBuilder();
}
function srcPanel(s, i) {
  const quizzes = C.db.quizzes.filter(q => !q.kind);
  if (s.src === 'quiz') return `<div class="x-src"><div class="x-src-list">${quizzes.length ? quizzes.map(q => `<label class="x-check"><input type="checkbox" data-s="${i}" data-qz="${q.id}" ${s.quizIds.includes(q.id) ? 'checked' : ''}/> <span>${C.esc(q.title)} <small>· ${q.questions.length} Q · ${C.esc(q.subject || 'General')}</small></span></label>`).join('') : '<div class="muted">No quizzes yet — create or import one first.</div>'}</div><div class="form-grid"><label>Pick questions<select data-s="${i}" data-f="order"><option value="random" ${s.order === 'random' ? 'selected' : ''}>Random shuffle</option><option value="seq" ${s.order === 'seq' ? 'selected' : ''}>In sequence (tick order)</option></select></label><div class="x-avail" id="avail-${i}"></div></div></div>`;
  if (s.src === 'reason') return `<div class="x-src"><small class="muted">REASONING QUESTION KINDS — figure kinds are built by the app (no AI, always correct); verbal kinds are written by AI</small><div class="chips">${[...NV_ALL.map(k => [k, '🧩 ' + NV_KINDS[k][0]]), ...Object.entries(VERBAL_TYPES).map(([k, v]) => [k, v.label])].map(([k, l]) => `<button class="chip ${(s.rk || []).includes(k) ? 'active' : ''}" data-s="${i}" data-rk="${k}">${l}</button>`).join('')}</div><div class="form-grid"><label>Difficulty<select data-s="${i}" data-f="diff">${['Easy', 'Moderate', 'Hard', 'Mixed'].map(d => `<option ${s.diff === d ? 'selected' : ''}>${d}</option>`).join('')}</select></label><label>Explanation style<select data-s="${i}" data-f="expl">${Object.entries(EXPL_TYPES).map(([k, v]) => `<option value="${k}" ${s.expl === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select></label><label>Language (verbal)<select data-s="${i}" data-f="lang">${['English', 'Hindi'].map(d => `<option ${s.lang === d ? 'selected' : ''}>${d}</option>`).join('')}</select></label></div></div>`;
  if (s.src === 'ai') return `<div class="x-src"><div class="form-grid"><label>Topic / syllabus<input data-s="${i}" data-f="topic" value="${C.esc(s.topic)}" placeholder="e.g. Indian Polity — Fundamental Rights"/></label><label>Exam style<input data-s="${i}" data-f="exam" value="${C.esc(s.exam)}"/></label><label>Difficulty<select data-s="${i}" data-f="diff">${['Easy', 'Moderate', 'Hard', 'Mixed'].map(d => `<option ${s.diff === d ? 'selected' : ''}>${d}</option>`).join('')}</select></label><label>Language<select data-s="${i}" data-f="lang">${['English', 'Hindi'].map(d => `<option ${s.lang === d ? 'selected' : ''}>${d}</option>`).join('')}</select></label><label>Explanation style<select data-s="${i}" data-f="expl">${Object.entries(EXPL_TYPES).map(([k, v]) => `<option value="${k}" ${s.expl === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select></label></div><small class="muted">AI writes exactly the number of questions you set, when you press Create. Needs internet + an AI source in Settings.</small></div>`;
  if (s.src === 'txt') return `<div class="x-src"><textarea rows="6" data-s="${i}" data-f="txt" placeholder="Paste questions (Q1. … 😂 … ✅ … Ex:) or JSON here — or load a file">${C.esc(s.txt)}</textarea><div class="form-grid"><label>Pick questions<select data-s="${i}" data-f="order"><option value="random" ${s.order === 'random' ? 'selected' : ''}>Random shuffle</option><option value="seq" ${s.order === 'seq' ? 'selected' : ''}>In sequence</option></select></label><div class="x-avail" id="avail-${i}"></div></div><button class="secondary" data-s="${i}" data-load="1">⇧ Load .txt / .json file</button></div>`;
  return `<div class="x-src">${s.manual.map((m, k) => `<div class="x-mrow"><div class="x-mhead"><b>Q${k + 1}</b><button class="textbtn" data-s="${i}" data-mdel="${k}">× remove</button></div><textarea rows="2" data-s="${i}" data-m="${k}" data-mf="text" placeholder="Question text">${C.esc(m.text)}</textarea>${m.o.map((o, j) => `<input data-s="${i}" data-m="${k}" data-mf="o${j}" value="${C.esc(o)}" placeholder="Option ${String.fromCharCode(65 + j)}"/>`).join('')}<div class="form-grid"><label>Correct<select data-s="${i}" data-m="${k}" data-mf="c">${['A', 'B', 'C', 'D'].map((l, j) => `<option value="${j}" ${m.c === j ? 'selected' : ''}>${l}</option>`).join('')}</select></label><label>Explanation (optional)<input data-s="${i}" data-m="${k}" data-mf="ex" value="${C.esc(m.ex)}"/></label></div></div>`).join('')}<button class="secondary" data-s="${i}" data-madd="1">＋ Add question</button></div>`;
}
function poolOf(s) {
  if (s.src === 'quiz') return s.quizIds.flatMap(id => C.db.quizzes.find(q => q.id === id)?.questions || []);
  if (s.src === 'txt') { try { return /^\s*[\[{]/.test(s.txt) ? C.parseJSON(s.txt) : C.parseText(s.txt); } catch { return []; } }
  if (s.src === 'manual') return s.manual.filter(m => m.text.trim() && m.o.filter(o => o.trim()).length >= 2).map(m => C.question(m.text.trim(), m.o.map(o => o.trim()).filter(Boolean), m.c, m.ex.trim()));
  return [];
}
function updateAvail() { B.sections.forEach((s, i) => { const el = $('#avail-' + i); if (el) { const n = poolOf(s).length; el.innerHTML = `Available: <b>${n}</b> question${n === 1 ? '' : 's'}${n && n < s.count ? ` <span class="red-text">(fewer than ${s.count} — all ${n} will be used)</span>` : ''}`; } }); updateSummary(); }
function updateSummary() {
  const el = $('#bSummary'); if (!el) return; const q = B.sections.reduce((n, s) => n + (Number(s.count) || 0), 0);
  const t = B.kind === 'mock' && B.timing === 'overall' ? B.totalMin : B.sections.reduce((n, s) => n + (Number(s.minutes) || 0), 0);
  el.innerHTML = `<b>${q}</b> questions · <b>${B.sections.length}</b> section${B.sections.length > 1 ? 's' : ''} · <b>${t ? fmtMin(t) : 'no time limit'}</b>`;
}
function distribute() {
  const tot = B.totalMin, sum = B.sections.reduce((n, s) => n + (Number(s.count) || 0), 0) || 1; let left = tot;
  B.sections.forEach((s, i) => { const m = i === B.sections.length - 1 ? left : Math.max(1, Math.round(tot * (Number(s.count) || 0) / sum)); s.minutes = Math.max(1, m); left -= s.minutes; });
}
function drawBuilder() {
  const mock = B.kind === 'mock';
  C.view.innerHTML = `<div class="page-title"><div><div class="eyebrow">${mock ? 'FULL MOCK TEST SIMULATOR' : 'SECTION MODE'}</div><h1>${mock ? 'Build your mock test' : 'Create a section test'}</h1><p>${mock ? 'Add as many sections (subjects) as you like. Each gets its own questions and timer.' : 'One section with its own timer and question count.'}</p></div><button class="secondary" id="bBack">← Back</button></div>
  <div class="panel"><div class="form-grid"><label>Test name<input id="bTitle" value="${C.esc(B.title)}" placeholder="${mock ? 'e.g. UPSC Prelims Mock 12' : 'e.g. Polity — 20 min sprint'}"/></label><label>Negative marking (per wrong answer)<input id="bNeg" type="number" step="0.01" min="0" max="5" value="${B.neg}"/></label><label>Pass mark %<input id="bPass" type="number" min="0" max="100" value="${B.pass}"/></label></div>
  ${mock && B.sections.length > 1 ? `<div class="x-timing"><b>Timing</b><label class="x-check"><input type="radio" name="bTiming" value="section" ${B.timing === 'section' ? 'checked' : ''}/> <span>Section-wise timers — when one section's time ends the next starts automatically</span></label><label class="x-check"><input type="radio" name="bTiming" value="overall" ${B.timing === 'overall' ? 'checked' : ''}/> <span>One overall timer — move freely between sections</span></label></div>` : ''}
  ${mock ? `<div class="x-total"><label>Total time (minutes)<input id="bTotal" type="number" min="1" max="600" value="${B.totalMin}"/></label><div class="chips">${TIME_PRESETS.map(m => `<button class="chip ${B.totalMin === m ? 'active' : ''}" data-preset="${m}">${fmtMin(m)}</button>`).join('')}</div>${B.timing === 'section' && B.sections.length > 1 ? '<button class="secondary" id="bSpread">⇄ Spread total time over sections</button>' : ''}</div>` : ''}</div>
  ${B.sections.map((s, i) => `<div class="panel x-sec" data-sec="${i}"><div class="panel-head"><div><h3>Section ${i + 1}</h3></div>${mock && B.sections.length > 1 ? `<button class="textbtn danger-text" data-rmsec="${i}">× Remove</button>` : ''}</div>
    <div class="form-grid"><label>Section name / subject<input data-s="${i}" data-f="name" value="${C.esc(s.name)}"/></label><label>Number of questions<input type="number" min="1" max="300" data-s="${i}" data-f="count" value="${s.count}"/></label>${!mock || B.timing === 'section' ? `<label>Section time (minutes)<input type="number" min="0" max="600" data-s="${i}" data-f="minutes" value="${s.minutes}"/></label>` : ''}</div>
    <div class="x-srcs"><small class="muted">QUESTIONS COME FROM</small><div class="chips">${[['quiz', '▤ My quizzes'], ['ai', '✦ Instant AI'], ['txt', '⎘ TXT / paste'], ['reason', '🧩 Reasoning (verbal + figures)'], ['manual', '✎ Write manually']].map(([k, l]) => `<button class="chip ${s.src === k ? 'active' : ''}" data-s="${i}" data-src="${k}">${l}</button>`).join('')}</div></div>${srcPanel(s, i)}</div>`).join('')}
  ${mock ? '<button class="secondary x-add" id="bAdd">＋ Add another section</button>' : ''}
  <div class="x-footer panel"><div id="bSummary"></div><div class="dialog-actions"><button class="secondary" id="bSave">Save only</button><button class="primary" id="bCreate">Create &amp; start →</button></div><div class="muted" id="bStatus"></div></div>`;
  updateAvail(); bindBuilder();
}
function bindBuilder() {
  const root = C.view;
  $('#bBack').onclick = () => { B = null; mocksPage(); };
  $('#bTitle').oninput = e => { B.title = e.target.value; };
  $('#bNeg').oninput = e => { B.neg = Math.max(0, Number(e.target.value) || 0); };
  $('#bPass').oninput = e => { B.pass = clamp(Number(e.target.value) || 0, 0, 100); };
  $$('[name=bTiming]').forEach(r => r.onchange = () => { B.timing = r.value; drawBuilder(); });
  $('#bTotal')?.addEventListener('input', e => { B.totalMin = Math.max(1, Number(e.target.value) || 1); updateSummary(); });
  $$('[data-preset]').forEach(b => b.onclick = () => { B.totalMin = Number(b.dataset.preset); if (B.timing === 'section') distribute(); drawBuilder(); });
  $('#bSpread')?.addEventListener('click', () => { distribute(); drawBuilder(); });
  $('#bAdd')?.addEventListener('click', () => { B.sections.push(newSection(B.sections.length + 1)); drawBuilder(); });
  $$('[data-rmsec]').forEach(b => b.onclick = () => { B.sections.splice(Number(b.dataset.rmsec), 1); drawBuilder(); });
  $$('[data-src]').forEach(b => b.onclick = () => { B.sections[Number(b.dataset.s)].src = b.dataset.src; drawBuilder(); });
  $$('[data-rk]').forEach(b => b.onclick = () => { const sec = B.sections[Number(b.dataset.s)]; sec.rk = sec.rk || []; const k = b.dataset.rk; sec.rk = sec.rk.includes(k) ? sec.rk.filter(x => x !== k) : [...sec.rk, k]; if (!sec.rk.length) sec.rk = [k]; drawBuilder(); });
  $$('[data-madd]').forEach(b => b.onclick = () => { B.sections[Number(b.dataset.s)].manual.push({ text: '', o: ['', '', '', ''], c: 0, ex: '' }); drawBuilder(); });
  $$('[data-mdel]').forEach(b => b.onclick = () => { const s = B.sections[Number(b.dataset.s)]; s.manual.splice(Number(b.dataset.mdel), 1); if (!s.manual.length) s.manual.push({ text: '', o: ['', '', '', ''], c: 0, ex: '' }); drawBuilder(); });
  $$('[data-load]').forEach(b => b.onclick = () => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.txt,.json,text/plain,application/json'; inp.onchange = async () => { const f = inp.files[0]; if (!f) return; B.sections[Number(b.dataset.s)].txt = await f.text(); drawBuilder(); }; inp.click(); });
  root.oninput = onField; root.onchange = onField;
  $('#bSave').onclick = () => create(false); $('#bCreate').onclick = () => create(true);
}
function onField(e) {
  const t = e.target; if (!B || t.dataset.s == null) return; const s = B.sections[Number(t.dataset.s)]; if (!s) return;
  if (t.dataset.qz) { const id = t.dataset.qz; s.quizIds = t.checked ? [...s.quizIds, id] : s.quizIds.filter(x => x !== id); updateAvail(); return; }
  if (t.dataset.m != null) { const m = s.manual[Number(t.dataset.m)], f = t.dataset.mf; if (f === 'text') m.text = t.value; else if (f === 'c') m.c = Number(t.value); else if (f === 'ex') m.ex = t.value; else m.o[Number(f.slice(1))] = t.value; if (e.type === 'change') updateAvail(); return; }
  const f = t.dataset.f; if (!f) return;
  s[f] = (f === 'count' || f === 'minutes') ? Math.max(0, Number(t.value) || 0) : t.value;
  if (f === 'txt' && e.type === 'change') updateAvail(); else if (f === 'order') updateAvail(); else updateSummary();
}
async function aiMake(s, cb) {
  const out = []; let guard = 0;
  while (out.length < s.count && guard++ < 8) {
    const n = Math.min(explPer(s.expl || 'short') + 4, s.count - out.length); cb(`AI is writing questions… ${out.length}/${s.count}`);
    const avoid = out.slice(-12).map(q => q.text.slice(0, 70)).join(' | ');
    const prompt = `Create exactly ${n} high-quality multiple-choice questions in ${s.lang} for the exam "${s.exam}". Subject/topic: ${s.topic || s.name}. Difficulty: ${s.diff}. Each question has exactly 4 options and exactly ONE correct option, and an explanation field written in this style: ${explRule(s.expl || 'short')} Do not repeat these already-made questions: ${avoid || 'none'}.\nReturn ONLY JSON: {"questions":[{"question":"...","options":["...","...","...","..."],"correct":"A","explanation":"...","topic":"sub-topic"}]}`;
    const text = await C.gemini(prompt, { json: true, maxTokens: 5200, temperature: 0.7 });
    try { out.push(...C.parseJSON(text)); } catch { /* retry next loop */ }
  }
  return out.slice(0, s.count);
}
async function reasonMake(s, cb) {
  const kinds = (s.rk && s.rk.length ? s.rk : ['nv_series']), nv = kinds.filter(k => NV_ALL.includes(k)), vr = kinds.filter(k => VERBAL_TYPES[k]);
  const nNv = vr.length ? (nv.length ? Math.ceil(s.count / 2) : 0) : s.count, nVr = s.count - nNv; const out = [];
  if (nNv) { cb(`Building ${nNv} figure questions…`); out.push(...generateNonVerbal(nv, nNv, s.expl || 'detailed', Date.now())); }
  if (nVr) {
    if (!C.AI.aiReady()) throw new Error('Verbal reasoning needs AI — add a key/sign in under Settings, or untick the verbal kinds (figure questions need no AI).');
    let guard = 0, got = [];
    while (got.length < nVr && guard++ < 8) {
      const n = Math.min(explPer(s.expl || 'short'), nVr - got.length); cb(`AI is writing verbal reasoning… ${got.length}/${nVr}`);
      const mix = vr.map(k => `- ${VERBAL_TYPES[k].label.replace(/^\S+\s/, '')}: ${VERBAL_TYPES[k].rule}`).join('\n'); const avoid = got.slice(-10).map(q => q.text.slice(0, 60)).join(' | ');
      const prompt = `Create exactly ${n} verbal reasoning multiple-choice questions in ${s.lang} for the exam "${s.exam}", difficulty ${s.diff}. Kinds (spread them):\n${mix}\nEach question has exactly 4 options and exactly ONE correct option; solve each question yourself first and make sure the key is right. Everything must be in words (no pictures). Explanation style: ${explRule(s.expl || 'short')}. Do not repeat: ${avoid || 'none'}.\nReturn ONLY JSON: {"questions":[{"question":"...","options":["...","...","...","..."],"correct":"A","explanation":"...","topic":"Verbal reasoning"}]}`;
      const text = await C.gemini(prompt, { json: true, maxTokens: 6000, temperature: 0.6 });
      try { got.push(...C.parseJSON(text).map(q => ({ ...q, topic: q.topic || 'Verbal reasoning' }))); } catch { /* retry */ }
    }
    out.push(...got.slice(0, nVr));
  }
  return C.shuffle(out).slice(0, s.count);
}
function pick(pool, count, order) { let a = pool.slice(); if (order === 'random') C.shuffle(a); return a.slice(0, count); }
const cloneQ = (q, subject) => ({ ...q, id: C.uid(), options: q.options.slice(), subject });
/** Shared by the builder and the Mistake Notebook. sections: [{name, minutes, qs}] */
export function makeMockQuiz(ctx, { title, kind, sections, timing, totalMin, neg, pass }) {
  const q = ctx.quizTemplate(title); q.kind = kind; q.subject = kind === 'section' ? sections[0].name : kind === 'mistake-mock' ? 'Mistakes' : 'Mock Test';
  q.questions = sections.flatMap(s => s.qs.map(x => cloneQ(x, s.name)));
  q.sections = sections.map(s => ({ name: s.name, minutes: Number(s.minutes) || 0, count: s.qs.length }));
  q.secTiming = timing; q.totalMinutes = Number(totalMin) || 0; q.settings = { ...q.settings, timer: 0, negative: Number(neg) || 0, pass: pass ?? 40, shuffleQ: false, shuffleO: false };
  q.description = `${kind === 'mock' ? 'Mock test' : kind === 'mistake-mock' ? 'Mistake-based mock' : 'Section test'} · ${q.questions.length} questions`;
  return q;
}
async function create(start) {
  const status = $('#bStatus'), btns = [$('#bSave'), $('#bCreate')];
  const title = (B.title || '').trim() || (B.kind === 'mock' ? `Mock test — ${new Date().toLocaleDateString()}` : `Section test — ${B.sections[0].name}`);
  for (const [i, s] of B.sections.entries()) { if (!s.name.trim()) return C.toast(`Give section ${i + 1} a name`); if (!(s.count >= 1)) return C.toast(`Set the number of questions for “${s.name}”`); }
  btns.forEach(b => b.disabled = true);
  try {
    const built = [];
    for (const s of B.sections) {
      let qs;
      if (s.src === 'ai') { if (!C.AI.aiReady()) throw new Error('AI is not set up — add a key or sign in under Settings.'); qs = await aiMake(s, m => { status.textContent = `${s.name}: ${m}`; }); }
      else if (s.src === 'reason') qs = await reasonMake(s, m => { status.textContent = `${s.name}: ${m}`; });
      else qs = pick(poolOf(s), s.count, s.order);
      if (!qs.length) throw new Error(`“${s.name}” has no questions yet — pick a source with questions.`);
      if (qs.length < s.count) C.toast(`“${s.name}”: only ${qs.length} of ${s.count} questions available — using all of them`, 4500);
      built.push({ name: s.name.trim(), minutes: (B.kind === 'mock' && B.timing === 'overall') ? 0 : s.minutes, qs });
    }
    const timing = B.kind === 'mock' && B.sections.length > 1 && B.timing === 'overall' ? 'overall' : 'section';
    const q = makeMockQuiz(C, { title, kind: B.kind, sections: built, timing, totalMin: timing === 'overall' ? B.totalMin : 0, neg: B.neg, pass: B.pass });
    C.db.quizzes.unshift(q); C.save(); B = null;
    if (start) C.chooseMode(q.id); else { C.toast(`“${q.title}” saved — find it under Mock & Section tests`, 4000); mocksPage(); }
    if (start) mocksPage();
  } catch (e) { C.toast('✕ ' + e.message, 6000); if (status) status.textContent = ''; btns.forEach(b => b && (b.disabled = false)); }
}

/* =====================================================================================
   ACHIEVEMENTS
   ===================================================================================== */
const STREAK_REWARDS = [[3, 30], [7, 70], [14, 150], [30, 300], [60, 600], [100, 1000]];
const TIERS = [{ n: 25, acc: 60, name: 'Bronze', icon: '🥉' }, { n: 75, acc: 70, name: 'Silver', icon: '🥈' }, { n: 150, acc: 80, name: 'Gold', icon: '🥇' }, { n: 300, acc: 90, name: 'Platinum', icon: '💎' }];
const levelOf = xp => Math.floor((1 + Math.sqrt(1 + 4 * xp / 50)) / 2);
const levelStart = n => 50 * n * (n - 1);
const levelTitle = n => n >= 18 ? 'Grandmaster' : n >= 12 ? 'Master' : n >= 8 ? 'Expert' : n >= 5 ? 'Scholar' : n >= 3 ? 'Learner' : 'Novice';
function computeAch(db) {
  const S = { attempts: db.attempts.length, solved: 0, correct: 0, wrong: 0, perfect: 0, sharp: 0, mock: 0, omr: 0, xpBase: 0, perDay: {}, subj: {}, bestPct: null, bestAcc: null, bestMock: null, maxCorrect: 0, timeSum: 0, timeN: 0, subjBest: {} };
  for (const a of db.attempts) {
    const att = a.correct + a.wrong; S.solved += att; S.correct += a.correct; S.wrong += a.wrong;
    S.xpBase += a.correct * 10 + a.wrong * 2 + 20 + (a.percent >= 80 ? 50 : 0) + (a.percent >= 100 && a.total >= 5 ? 100 : 0);
    const dk = dayKey(a.date); S.perDay[dk] = (S.perDay[dk] || 0) + att;
    if (a.percent >= 100 && a.total >= 5) S.perfect++;
    const acc = pct(a.correct, att); if (att >= 20 && acc >= 90) S.sharp++;
    if (a.sections || a.omr) { S.mock++; if (!S.bestMock || a.percent > S.bestMock.percent) S.bestMock = a; } if (a.omr) S.omr++;
    if (!S.bestPct || a.percent > S.bestPct.percent) S.bestPct = a;
    if (att >= 10 && (!S.bestAcc || acc > S.bestAcc.acc)) S.bestAcc = { acc, a };
    S.maxCorrect = Math.max(S.maxCorrect, a.correct);
    const sb = S.subjBest[a.subject || 'General']; if (!sb || a.percent > sb.percent) S.subjBest[a.subject || 'General'] = a;
    for (const d of a.details || []) {
      if (d.timeSec > 0) { S.timeSum += d.timeSec; S.timeN++; }
      if (d.status === 'blank') continue; const k = d.subject || a.subject || 'General'; const e = S.subj[k] ||= { n: 0, c: 0 }; e.n++; if (d.status === 'correct') e.c++;
    }
  }
  const days = Object.keys(S.perDay).sort(); let longest = 0, run = 0, prev = null;
  for (const d of days) { run = prev && (new Date(d) - new Date(prev)) / 864e5 === 1 ? run + 1 : 1; longest = Math.max(longest, run); prev = d; }
  const today = dayKey(Date.now()), yest = dayKey(Date.now() - 864e5); let cur = 0;
  if (days.length && (days.at(-1) === today || days.at(-1) === yest)) { cur = 1; for (let i = days.length - 2; i >= 0; i--) { if ((new Date(days[i + 1]) - new Date(days[i])) / 864e5 === 1) cur++; else break; } }
  S.streak = cur; S.longest = longest; S.days = days.length; S.bestDay = Math.max(0, ...Object.values(S.perDay)); S.todayQ = S.perDay[today] || 0;
  S.streakXp = STREAK_REWARDS.filter(([m]) => longest >= m).reduce((n, [, x]) => n + x, 0);
  S.nbMastered = Object.values(db.notebook?.items || {}).filter(i => i.state === 'mastered').length;
  S.revMastered = db.revStats?.mastered || 0;
  S.xp = S.xpBase + S.streakXp; S.level = levelOf(S.xp);
  S.avgT = S.timeN >= 20 ? Math.round(S.timeSum / S.timeN) : null;
  return S;
}
const BADGES = [
  ['first', '🚀', 'First Step', 'Finish your first quiz', S => [S.attempts, 1]],
  ['q10', '📘', 'Quiz Regular', 'Finish 10 quizzes', S => [S.attempts, 10]],
  ['q50', '📚', 'Quiz Veteran', 'Finish 50 quizzes', S => [S.attempts, 50]],
  ['q100', '🎓', 'Quiz Legend', 'Finish 100 quizzes', S => [S.attempts, 100]],
  ['s100', '💯', '100 Questions Solved', 'Answer 100 questions', S => [S.solved, 100]],
  ['s500', '🔥', '500 Questions Solved', 'Answer 500 questions', S => [S.solved, 500]],
  ['s1000', '⚡', '1,000 Questions Solved', 'Answer 1,000 questions', S => [S.solved, 1000]],
  ['s5000', '🌟', '5,000 Questions Solved', 'Answer 5,000 questions', S => [S.solved, 5000]],
  ['c100', '✅', 'Century of Correct', '100 correct answers', S => [S.correct, 100]],
  ['c1000', '🏅', 'Thousand Correct', '1,000 correct answers', S => [S.correct, 1000]],
  ['perfect', '🎯', 'Perfectionist', 'Score 100% in a quiz (5+ questions)', S => [S.perfect, 1]],
  ['sharp', '🏹', 'Sharp Shooter', '90%+ accuracy in a 20+ question quiz', S => [S.sharp, 1]],
  ['mock1', '◷', 'Mock Starter', 'Finish a mock / OMR / section test', S => [S.mock, 1]],
  ['mock10', '🛡️', 'Mock Warrior', 'Finish 10 mock / OMR / section tests', S => [S.mock, 10]],
  ['omr3', '▦', 'OMR Master', 'Finish 3 OMR tests', S => [S.omr, 3]],
  ['st3', '🔥', '3-Day Streak', 'Practise 3 days in a row', S => [S.longest, 3]],
  ['st7', '🔥', 'Week Warrior', '7-day streak', S => [S.longest, 7]],
  ['st30', '🔥', 'Monthly Master', '30-day streak', S => [S.longest, 30]],
  ['nb10', '✎', 'Mistake Slayer', 'Master 10 notebook mistakes', S => [S.nbMastered, 10]],
  ['nb50', '🧠', 'Mistake Terminator', 'Master 50 notebook mistakes', S => [S.nbMastered, 50]],
];
function achievementsPage() {
  const db = C.db, S = computeAch(db), seen = new Set(db.achSeen || []);
  const next = levelStart(S.level + 1), base = levelStart(S.level), prog = clamp((S.xp - base) / (next - base) * 100, 0, 100);
  const badges = BADGES.map(([id, ic, name, desc, f]) => { const [cur, tgt] = f(S); return { id, ic, name, desc, cur: Math.min(cur, tgt), tgt, done: cur >= tgt }; });
  const unlocked = badges.filter(b => b.done), subjects = Object.entries(S.subj).filter(([, v]) => v.n >= 5).sort((a, b) => b[1].n - a[1].n);
  C.view.innerHTML = `<div class="page-title"><div><div class="eyebrow">YOUR PROGRESS</div><h1>Achievements</h1><p>XP, streaks, badges and personal bests — all earned from your real quiz attempts.</p></div></div>
  <div class="x-level panel"><div class="x-lvl-badge"><strong>${S.level}</strong><small>LEVEL</small></div><div class="x-lvl-info"><b>${levelTitle(S.level)}</b><span>${S.xp.toLocaleString()} XP · ${(next - S.xp).toLocaleString()} XP to level ${S.level + 1}</span><div class="x-bar"><i style="width:${prog}%"></i></div></div><div class="x-lvl-stats"><div><strong>🔥 ${S.streak}</strong><small>DAY STREAK</small></div><div><strong>${unlocked.length}/${badges.length}</strong><small>BADGES</small></div><div><strong>${S.solved.toLocaleString()}</strong><small>QUESTIONS SOLVED</small></div></div></div>
  <div class="panel"><div class="panel-head"><div><h3>Daily streak rewards</h3><p>Practise every day — bonus XP at each milestone. Today: ${S.todayQ} question${S.todayQ === 1 ? '' : 's'} solved.</p></div></div><div class="x-streaks">${STREAK_REWARDS.map(([m, x]) => { const ok = S.longest >= m; return `<div class="x-streak ${ok ? 'ok' : ''}"><span>${ok ? '🔥' : '🔒'}</span><b>${m} days</b><small>+${x} XP</small></div>`; }).join('')}</div></div>
  <div class="panel"><div class="panel-head"><div><h3>Badges</h3><p>${unlocked.length} unlocked · ${badges.length - unlocked.length} to go</p></div></div><div class="x-badges">${badges.map(b => `<div class="x-badge ${b.done ? 'ok' : ''}"><div class="x-b-ic">${b.done ? b.ic : '🔒'}</div><b>${b.name}</b>${b.done && !seen.has(b.id) ? '<em class="x-new">NEW</em>' : ''}<small>${b.desc}</small>${b.done ? '' : `<div class="x-bar sm"><i style="width:${pct(b.cur, b.tgt)}%"></i></div><small>${b.cur.toLocaleString()} / ${b.tgt.toLocaleString()}</small>`}</div>`).join('')}</div></div>
  <div class="panel"><div class="panel-head"><div><h3>Subject mastery</h3><p>Bronze 25 answers @60% · Silver 75 @70% · Gold 150 @80% · Platinum 300 @90%</p></div></div>${subjects.length ? subjects.map(([name, v]) => { const acc = pct(v.c, v.n); const ti = TIERS.filter(t => v.n >= t.n && acc >= t.acc).length - 1; const nx = TIERS[ti + 1]; return `<div class="x-mastery"><div class="x-m-head"><b>${ti >= 0 ? TIERS[ti].icon : '▫'} ${C.esc(name)}</b><span>${ti >= 0 ? TIERS[ti].name : 'Unranked'} · ${acc}% accuracy · ${v.n} answered</span></div>${nx ? `<div class="x-bar sm"><i style="width:${clamp(Math.min(v.n / nx.n, acc / nx.acc) * 100, 0, 100)}%"></i></div><small class="muted">Next: ${nx.icon} ${nx.name} — needs ${nx.n} answers at ${nx.acc}% (now ${v.n} · ${acc}%)</small>` : '<small class="muted">Top tier reached 🎉</small>'}</div>`; }).join('') : '<div class="empty-mini"><b>No subject data yet</b><small>Answer at least 5 questions in a subject.</small></div>'}</div>
  <div class="panel"><div class="panel-head"><div><h3>Personal bests</h3><p>Your records so far</p></div></div><div class="x-pb">${[
    ['🏆', 'Highest score', S.bestPct ? `${S.bestPct.percent}%` : '—', S.bestPct ? S.bestPct.quizTitle : ''],
    ['🎯', 'Best accuracy', S.bestAcc ? `${S.bestAcc.acc}%` : '—', S.bestAcc ? S.bestAcc.a.quizTitle : 'needs a 10+ answer quiz'],
    ['◷', 'Best mock / OMR', S.bestMock ? `${S.bestMock.percent}%` : '—', S.bestMock ? S.bestMock.quizTitle : 'no mock yet'],
    ['🔥', 'Longest streak', `${S.longest} day${S.longest === 1 ? '' : 's'}`, `${S.days} active days`],
    ['📅', 'Most solved in a day', `${S.bestDay}`, 'questions'],
    ['✅', 'Most correct in one quiz', `${S.maxCorrect}`, 'questions'],
    ['⚡', 'Average time / question', S.avgT != null ? `${S.avgT}s` : '—', 'from timed answers']].map(([i, l, v, sub]) => `<div class="x-pb-card"><span>${i}</span><small>${l}</small><strong>${C.esc(v)}</strong><em>${C.esc(sub)}</em></div>`).join('')}</div>
   ${Object.keys(S.subjBest).length ? `<h4 class="x-h4">Best score by subject</h4><div class="x-chips">${Object.entries(S.subjBest).sort((a, b) => b[1].percent - a[1].percent).slice(0, 8).map(([k, a]) => `<span class="tag">${C.esc(k)} · ${a.percent}%</span>`).join('')}</div>` : ''}</div>`;
  db.achSeen = unlocked.map(b => b.id); C.save();
}

/* =====================================================================================
   MISTAKE NOTEBOOK
   ===================================================================================== */
const NB = { filter: 'open', subject: '', q: '', limit: 20 };
function notebookPage() {
  C.ensureNotebook(); const items = Object.values(C.db.notebook.items);
  const open = items.filter(i => i.state === 'open'), mastered = items.filter(i => i.state === 'mastered');
  const subjects = [...new Set(items.map(i => i.subject || 'General'))].sort();
  const list = items.filter(i => (NB.filter === 'all' || i.state === NB.filter) && (!NB.subject || i.subject === NB.subject) && (!NB.q || (i.text + ' ' + i.topic).toLowerCase().includes(NB.q.toLowerCase()))).sort((a, b) => (b.wrong - a.wrong) || String(b.last).localeCompare(String(a.last)));
  const top = Object.entries(open.reduce((m, i) => (m[i.subject || 'General'] = (m[i.subject || 'General'] || 0) + 1, m), {})).sort((a, b) => b[1] - a[1])[0];
  C.view.innerHTML = `<div class="page-title"><div><div class="eyebrow">PERSONAL</div><h1>Mistake Notebook</h1><p>Every wrong answer is collected automatically. Answer it correctly twice in a row and it is mastered — or mark it yourself.</p></div><div class="title-actions"><button class="primary" id="nbMock" ${open.length ? '' : 'disabled'}>✎ Mistake mock test</button></div></div>
  <div class="stats-grid"><div class="stat-card"><small>OPEN MISTAKES</small><strong class="red-text">${open.length}</strong><span>still to fix</span></div><div class="stat-card"><small>MASTERED</small><strong class="green-text">${mastered.length}</strong><span>${pct(mastered.length, items.length)}% of all</span></div><div class="stat-card"><small>TOTAL COLLECTED</small><strong>${items.length}</strong><span>unique questions</span></div><div class="stat-card"><small>WEAKEST SUBJECT</small><strong class="x-sm">${top ? C.esc(top[0]) : '—'}</strong><span>${top ? top[1] + ' open' : 'nothing open'}</span></div></div>
  <div class="toolbar"><input id="nbSearch" placeholder="⌕  Search mistakes…" value="${C.esc(NB.q)}"/><select id="nbSubject"><option value="">All subjects</option>${subjects.map(s => `<option ${NB.subject === s ? 'selected' : ''}>${C.esc(s)}</option>`).join('')}</select></div>
  <div class="chips">${[['open', 'Open', open.length], ['mastered', 'Mastered', mastered.length], ['all', 'All', items.length]].map(([k, l, n]) => `<button class="chip ${NB.filter === k ? 'active' : ''}" data-nbf="${k}">${l} · ${n}</button>`).join('')}</div>
  <div id="nbList">${list.slice(0, NB.limit).map(nbCard).join('') || '<div class="empty-state"><div>✎</div><h3>Nothing here</h3><p>Wrong answers from your quizzes will appear here automatically.</p></div>'}</div>${list.length > NB.limit ? `<button class="secondary x-more" id="nbMore">Show more (${list.length - NB.limit} left)</button>` : ''}`;
  $('#nbSearch').oninput = e => { NB.q = e.target.value; NB.limit = 20; clearTimeout(NB.t); NB.t = setTimeout(() => { notebookPage(); const i = $('#nbSearch'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250); };
  $('#nbSubject').onchange = e => { NB.subject = e.target.value; NB.limit = 20; notebookPage(); };
  $$('[data-nbf]').forEach(b => b.onclick = () => { NB.filter = b.dataset.nbf; NB.limit = 20; notebookPage(); });
  $('#nbMore')?.addEventListener('click', () => { NB.limit += 20; notebookPage(); });
  $('#nbMock')?.addEventListener('click', () => mistakeMockDialog(open, subjects));
  $$('[data-nbm]').forEach(b => b.onclick = () => { const it = C.db.notebook.items[b.dataset.nbm]; it.state = 'mastered'; it.auto = false; it.masteredAt = new Date().toISOString(); C.save(); C.toast('Marked as mastered ✓'); notebookPage(); });
  $$('[data-nbr]').forEach(b => b.onclick = () => { const it = C.db.notebook.items[b.dataset.nbr]; it.state = 'open'; it.streak = 0; C.save(); notebookPage(); });
  $$('[data-nbd]').forEach(b => b.onclick = async () => { if (await C.confirmBox('Remove from notebook?', 'It will be collected again if you get it wrong later.', 'Remove', true)) { delete C.db.notebook.items[b.dataset.nbd]; C.save(); notebookPage(); } });
  $$('[data-nba]').forEach(b => b.onclick = () => { const it = C.db.notebook.items[b.dataset.nba]; C.askAI({ text: it.text, options: it.options, correct: it.correct, selected: it.lastSel, explanation: it.explanation, subject: it.subject, topic: it.topic }); });
}
function nbCard(i) {
  const mastered = i.state === 'mastered';
  return `<div class="x-card nb-card ${mastered ? 'is-mastered' : ''}"><div class="x-card-top"><span class="tag">${C.esc(i.subject || 'General')}</span>${i.topic ? `<span class="muted">${C.esc(i.topic)}</span>` : ''}<span class="x-wrong">✕ missed ${i.wrong}×</span>${mastered ? `<span class="tag green">${i.auto ? 'AUTO-MASTERED' : 'MASTERED'}</span>` : (i.streak ? `<span class="tag">${i.streak}/2 correct since</span>` : '')}</div><b class="x-q">${C.escMl(i.text)}</b><div class="review-options">${i.options.map((o, j) => `<div class="${j === i.correct ? 'review-correct' : j === i.lastSel ? 'review-wrong' : ''}">${C.L(j)}. ${C.esc(o)} ${j === i.correct ? '✓' : j === i.lastSel ? '✕ your last answer' : ''}</div>`).join('')}</div>${i.explanation ? `<details class="x-expl"><summary>Explanation</summary><p class="explanation-text">${C.esc(i.explanation)}</p></details>` : ''}<div class="review-actions">${mastered ? `<button class="textbtn" data-nbr="${C.esc(i.key)}">↺ Reopen</button>` : `<button class="primary x-small" data-nbm="${C.esc(i.key)}">✓ Mark as mastered</button>`}<button class="textbtn" data-nba="${C.esc(i.key)}">✦ Ask AI</button><button class="textbtn danger-text" data-nbd="${C.esc(i.key)}">🗑 Remove</button></div></div>`;
}
function mistakeMockDialog(open, subjects) {
  const { el, close } = C.modal(`<div class="eyebrow">MISTAKE-BASED MOCK TEST</div><h2>Test yourself on your mistakes</h2><p>Questions are picked from your <b>open</b> mistakes (${open.length}).</p>
    <div class="form-grid"><label>Questions<input id="mmN" type="number" min="1" max="${open.length}" value="${Math.min(30, open.length)}"/></label><label>Subject<select id="mmSub"><option value="">All subjects</option>${subjects.map(s => `<option>${C.esc(s)}</option>`).join('')}</select></label><label>Pick<select id="mmOrd"><option value="random">Random</option><option value="most">Most missed first</option></select></label><label>Time (minutes, 0 = none)<input id="mmMin" type="number" min="0" max="600" value="${Math.min(30, open.length)}"/></label><label>Negative marking<input id="mmNeg" type="number" step="0.01" min="0" value="0"/></label></div>
    <label class="x-check"><input type="checkbox" id="mmSec"/> <span>Subject-wise sections (time is split and sections switch automatically)</span></label>
    <div class="dialog-actions"><button class="primary" id="mmGo">Create &amp; start →</button></div>`);
  $('#mmGo', el).onclick = () => {
    const sub = $('#mmSub', el).value; let pool = open.filter(i => !sub || i.subject === sub);
    if (!pool.length) return C.toast('No open mistakes for this subject');
    const n = clamp(Number($('#mmN', el).value) || 1, 1, pool.length), ord = $('#mmOrd', el).value, mins = Math.max(0, Number($('#mmMin', el).value) || 0), neg = Math.max(0, Number($('#mmNeg', el).value) || 0), bySub = $('#mmSec', el).checked;
    pool = pool.slice(); C.shuffle(pool); if (ord === 'most') pool.sort((a, b) => b.wrong - a.wrong); pool = pool.slice(0, n);
    const qOf = i => { const q = C.question(i.text, i.options.slice(), i.correct, i.explanation, i.topic); q.subject = i.subject; return q; };
    let sections, timing = 'section', totalMin = 0;
    if (bySub) { const g = {}; pool.forEach(i => (g[i.subject || 'General'] ||= []).push(i)); sections = Object.entries(g).map(([name, arr]) => ({ name, qs: arr.map(qOf), minutes: mins ? Math.max(1, Math.round(mins * arr.length / n)) : 0 })); }
    else { sections = [{ name: 'Mistakes', qs: pool.map(qOf), minutes: 0 }]; timing = 'overall'; totalMin = mins; }
    const q = makeMockQuiz(C, { title: `Mistake mock — ${new Date().toLocaleDateString()} (${n}Q)`, kind: 'mistake-mock', sections, timing, totalMin, neg, pass: 40 });
    C.db.quizzes.unshift(q); C.save(); close(); C.chooseMode(q.id);
  };
}

/* =====================================================================================
   QUIZINOX ANALYSER  (AI teacher — separate from AI Studio)
   ===================================================================================== */
const AN = { level: 'Moderate', history: true, busy: false };
const LEVELS = { Easy: 'EASY — simple words, everyday analogies, no jargon, short', Moderate: 'MODERATE — exam-oriented, clear structure, key facts and examples', Advanced: 'ADVANCED — in depth, nuances, exceptions, linkages, mains-level analysis' };
function analyserProfile() {
  try {
    const p = C.buildProfile(); if (!p.attempts) return 'No quiz attempts yet.';
    const o = p.overall, weakSub = p.subjects.filter(s => s.correct + s.wrong >= 3).slice(0, 5).map(s => `${s.key} ${s.acc}% (${s.correct + s.wrong} q)`).join('; ');
    const weakTop = p.topics.filter(s => s.correct + s.wrong >= 3 && s.key).slice(0, 8).map(s => `${s.key} ${s.acc}%`).join('; ');
    const rep = p.repeated.slice(0, 5).map(r => `“${r.text.slice(0, 90)}” (missed ${r.count}×)`).join(' | ');
    const open = Object.values(C.db.notebook?.items || {}).filter(i => i.state === 'open').length;
    return `Attempts: ${p.attempts}. Overall accuracy ${o.acc}%, avg score ${o.avgPercent}%, skip rate ${o.skipRate}%. Weakest subjects: ${weakSub || 'n/a'}. Weakest topics: ${weakTop || 'n/a'}. Repeated mistakes: ${rep || 'none'}. Open notebook mistakes: ${open}.`;
  } catch { return 'History unavailable.'; }
}
function analyserPage() {
  const msgs = C.db.analyser || [];
  C.view.innerHTML = `<div class="page-title"><div><div class="eyebrow">AI PERSONAL TEACHER</div><h1>Quizinox Analyser</h1><p>Ask doubts in any subject, get your mistakes explained at your level, and be tested with follow-up questions.</p></div><div class="title-actions"><button class="secondary" id="anClear" ${msgs.length ? '' : 'disabled'}>🗑 Clear chat</button></div></div>
  <div class="panel x-an-ctl"><div><small class="muted">EXPLANATION LEVEL</small><div class="chips">${Object.keys(LEVELS).map(l => `<button class="chip ${AN.level === l ? 'active' : ''}" data-lvl="${l}">${l}</button>`).join('')}</div></div><label class="x-check"><input type="checkbox" id="anHist" ${AN.history ? 'checked' : ''}/> <span>Use my quiz history &amp; mistakes</span></label><label>Language<select id="anLang">${['English', 'Hindi', 'Hinglish'].map(l => `<option ${C.db.settings.tutorLang === l ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
  <div class="x-quick"><button class="chip" data-q="history">📊 Analyse my full history</button><button class="chip" data-q="mistakes">✎ Explain my mistakes</button><button class="chip" data-q="test">❓ Check my understanding</button></div>
  <div class="x-chat" id="anChat">${msgs.length ? msgs.map(bubble).join('') : '<div class="x-chat-empty"><span>🧠</span><b>Hi! I am your Quizinox Analyser.</b><small>Ask me any doubt, or tap a quick button above. I explain at the level you pick and test you with follow-up questions.</small></div>'}</div>
  <div class="x-compose"><textarea id="anIn" rows="2" placeholder="Type your doubt… e.g. “Explain Article 32 vs 226 simply”"></textarea><button class="primary" id="anSend">Send ➤</button></div><div class="muted" id="anStatus"></div>`;
  const chat = $('#anChat'); chat.scrollTop = chat.scrollHeight;
  $$('[data-lvl]').forEach(b => b.onclick = () => { AN.level = b.dataset.lvl; $$('[data-lvl]').forEach(x => x.classList.toggle('active', x === b)); });
  $('#anHist').onchange = e => { AN.history = e.target.checked; };
  $('#anLang').onchange = e => { C.db.settings.tutorLang = e.target.value; C.save(); };
  $('#anClear').onclick = async () => { if (await C.confirmBox('Clear this chat?', 'The conversation will be removed from this device.', 'Clear', true)) { C.db.analyser = []; C.save(); analyserPage(); } };
  $('#anSend').onclick = () => send($('#anIn').value);
  $('#anIn').addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send($('#anIn').value); });
  $$('[data-q]').forEach(b => b.onclick = () => quick(b.dataset.q));
}
const bubble = m => `<div class="x-msg ${m.r === 'u' ? 'me' : 'ai'}${m.err ? ' err' : ''}">${m.r === 'u' ? C.escMl(m.t) : C.md(m.t)}</div>`;
function quick(kind) {
  if (kind === 'history') return send('Analyse my complete quiz history: what am I good at, where do I lose marks, what patterns do you see in my mistakes, and give me a 7-day improvement plan.', { forceHistory: true });
  if (kind === 'mistakes') {
    const open = Object.values(C.db.notebook?.items || {}).filter(i => i.state === 'open').sort((a, b) => b.wrong - a.wrong).slice(0, 8);
    if (!open.length) return C.toast('No open mistakes yet — attempt a quiz first');
    return send('Explain the concepts behind my most-repeated mistakes below. For each: why my answer is wrong, the correct idea, and a memory trick.\n\n' + open.map((i, n) => `${n + 1}. ${i.text.slice(0, 300)}\n   Correct: ${i.options[i.correct]} | I answered: ${i.options[i.lastSel] ?? 'skipped'} | missed ${i.wrong}×`).join('\n'), { forceHistory: true, label: '✎ Explain my top mistakes' });
  }
  return send('Check my understanding of what we just discussed (or of my weakest topic if we have not discussed anything). Ask me exactly 3 short questions, one after another in a numbered list, and wait for my answers.', { label: '❓ Check my understanding' });
}
async function send(text, opt = {}) {
  text = String(text || '').trim(); if (!text || AN.busy) return;
  if (!C.AI.aiReady()) return C.toast('Set up an AI source first (Settings → AI)', 4000);
  const db = C.db; db.analyser = db.analyser || []; db.analyser.push({ r: 'u', t: opt.label || text }); $('#anIn') && ($('#anIn').value = '');
  const chat = $('#anChat'); chat.querySelector('.x-chat-empty')?.remove(); chat.insertAdjacentHTML('beforeend', bubble(db.analyser.at(-1)) + '<div class="x-msg ai" id="anWait"><div class="ai-loading"><i></i><i></i><i></i></div></div>'); chat.scrollTop = chat.scrollHeight;
  AN.busy = true; $('#anSend').disabled = true;
  const lang = C.db.settings.tutorLang || 'English';
  const hist = db.analyser.slice(-9, -1).map(m => `${m.r === 'u' ? 'STUDENT' : 'TEACHER'}: ${m.t.slice(0, 900)}`).join('\n');
  const useHist = AN.history || opt.forceHistory;
  const system = `You are "Quizinox Analyser", a patient, encouraging personal teacher for competitive-exam learners. Reply in ${lang}${lang === 'Hinglish' ? ' (Hindi written in Roman script mixed with English)' : ''}. Explanation level: ${LEVELS[AN.level]}. Use short headings, bullet points and one example; stay accurate and under ~450 words; if unsure of a fact say so. When you explain a concept, finish with a section "Check yourself" containing 2 short follow-up questions. If the student's message answers earlier check questions, grade each answer (✓ / ✗), correct gently and explain what was missing.`;
  const prompt = `${useHist ? `STUDENT'S QUIZ HISTORY (use it to personalise, do not repeat it back): ${analyserProfile()}\n\n` : ''}${hist ? `CONVERSATION SO FAR:\n${hist}\n\n` : ''}STUDENT: ${text.slice(0, 3500)}\n\nTEACHER:`;
  try {
    const r = await C.AI.aiCall(prompt, { json: false, system, maxTokens: 2200, temperature: 0.5 });
    db.analyser.push({ r: 'a', t: String(r.text || '').trim() || 'I could not produce an answer — please try again.' });
  } catch (e) { db.analyser.push({ r: 'a', t: '✕ ' + e.message, err: true }); }
  AN.busy = false; db.analyser = db.analyser.slice(-40); C.save();
  if (C.db.activeTab === 'analyser') analyserPage();
}

/* =====================================================================================
   QUIZINOX PREDICTOR  (exam readiness)
   ===================================================================================== */
const erf = x => { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)); };
const cdf = z => 0.5 * (1 + erf(z / Math.SQRT2));
let PR = { target: 60 };
function predict(db) {
  const at = db.attempts.slice(0, 60); if (!at.length) return null; const now = Date.now();
  const w = a => Math.pow(0.5, Math.max(0, (now - new Date(a.date)) / 864e5) / 21) * ((a.sections || a.omr || a.total >= 50) ? 1.4 : 1) * Math.sqrt(clamp(a.total, 5, 100) / 20);
  const ws = at.map(w), W = ws.reduce((x, y) => x + y, 0), W2 = ws.reduce((x, y) => x + y * y, 0), neff = W * W / W2;
  const mean = at.reduce((s, a, i) => s + ws[i] * a.percent, 0) / W, vr = at.reduce((s, a, i) => s + ws[i] * (a.percent - mean) ** 2, 0) / W, sd = Math.sqrt(vr);
  const recent = at.slice(0, 10).map(a => a.percent), rm = recent.reduce((a, b) => a + b, 0) / recent.length, rsd = Math.sqrt(recent.reduce((s, x) => s + (x - rm) ** 2, 0) / recent.length);
  const consistency = clamp(100 - rsd * 2.5, 0, 100);
  const chrono = at.slice(0, 8).reverse(); let slope = 0; if (chrono.length >= 3) { const n = chrono.length, xm = (n - 1) / 2, ym = chrono.reduce((s, a) => s + a.percent, 0) / n; slope = chrono.reduce((s, a, i) => s + (i - xm) * (a.percent - ym), 0) / chrono.reduce((s, _, i) => s + (i - xm) ** 2, 0); }
  const trendScore = clamp(50 + slope * 5, 0, 100), readiness = clamp(0.7 * mean + 0.15 * consistency + 0.15 * trendScore, 0, 100);
  const se = sd / Math.sqrt(Math.max(neff, 1)), margin = clamp(1.28 * Math.sqrt(se * se + (neff < 4 ? 5 : 1.5) ** 2), 2, 25);
  const answered = at.reduce((n, a) => n + a.correct + a.wrong, 0), conf = Math.round(clamp(35 + 15 * Math.log2(neff + 1) + (answered >= 300 ? 8 : 0), 20, 95));
  const nextExp = clamp(mean + clamp(slope * 0.5, -5, 5), 0, 100), pTarget = cdf((nextExp - PR.target) / Math.max(sd, 6));
  // subjects / topics
  const subj = new Map(), topic = new Map(), neg = a => Number(a.negative) || 0;
  at.slice().reverse().forEach(a => { const wa = w(a), per = new Map(); (a.details || []).forEach(d => { const k = d.subject || a.subject || 'General'; const e = subj.get(k) || { n: 0, c: 0, wr: 0, wsum: 0, wnet: 0, wtot: 0, runs: [] }; e.n++; e.wtot += wa; if (d.status === 'correct') { e.c++; e.wsum += wa; e.wnet += wa; } else if (d.status === 'wrong') { e.wr++; e.wnet -= wa * neg(a); } subj.set(k, e); const r = per.get(k) || { c: 0, t: 0 }; if (d.status !== 'blank') { r.t++; if (d.status === 'correct') r.c++; } per.set(k, r);
    if (d.topic && d.status !== 'blank') { const t = topic.get(d.topic) || { n: 0, c: 0, sub: k }; t.n++; if (d.status === 'correct') t.c++; topic.set(d.topic, t); } });
    per.forEach((r, k) => { if (r.t) subj.get(k).runs.push(pct(r.c, r.t)); }); });
  const subjects = [...subj.entries()].map(([name, e]) => { const ready = clamp(e.wnet / e.wtot * 100, 0, 100), acc = pct(e.c, e.c + e.wr), runs = e.runs, rec = runs.slice(-2), pri = runs.slice(0, -2); const tr = rec.length && pri.length ? Math.round(rec.reduce((a, b) => a + b, 0) / rec.length - pri.reduce((a, b) => a + b, 0) / pri.length) : null; return { name, ready: Math.round(ready), acc, n: e.n, tr }; }).filter(s => s.n >= 3).sort((a, b) => a.ready - b.ready);
  const topics = [...topic.entries()].filter(([, t]) => t.n >= 3).map(([name, t]) => ({ name, acc: pct(t.c, t.n), n: t.n, sub: t.sub })).sort((a, b) => a.acc - b.acc).slice(0, 8);
  const det = at.slice(0, 15).flatMap(a => (a.details || []).map(d => ({ ...d, neg: neg(a) }))), wrongs = det.filter(d => d.status === 'wrong');
  const pat = { rushed: det.filter(d => d.status === 'wrong' && d.timeSec > 0 && d.timeSec < 12).length, wrong: wrongs.length, skip: det.length ? pct(det.filter(d => d.status === 'blank').length, det.length) : 0, negLost: +wrongs.reduce((s, d) => s + d.neg, 0).toFixed(2), slow: det.filter(d => d.timeSec > 90).length };
  return { at, mean, sd, consistency, slope, readiness, margin, conf, pTarget, nextExp, neff, answered, subjects, topics, pat, series: at.slice(0, 30).reverse().map(a => a.percent) };
}
function chartSvg(series) {
  const W = 640, H = 190, px = i => 28 + i * (W - 48) / Math.max(series.length - 1, 1), py = v => 12 + (100 - v) / 100 * (H - 34);
  const ma = series.map((_, i) => { const s = series.slice(Math.max(0, i - 2), i + 1); return s.reduce((a, b) => a + b, 0) / s.length; });
  const line = arr => arr.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' ');
  return `<svg viewBox="0 0 ${W} ${H}" class="x-chart" role="img" aria-label="Score trend">${[0, 50, 100].map(g => `<line x1="28" x2="${W - 20}" y1="${py(g)}" y2="${py(g)}" class="gl"/><text x="2" y="${py(g) + 4}">${g}</text>`).join('')}<polyline points="${line(series)}" class="raw"/><polyline points="${line(ma)}" class="avg"/>${series.map((v, i) => `<circle cx="${px(i)}" cy="${py(v)}" r="3.2"/>`).join('')}<text x="${W - 140}" y="${H - 4}" class="lg">— score   — 3-attempt average</text></svg>`;
}
function predictorPage() {
  const P = predict(C.db);
  if (!P) { C.view.innerHTML = `<div class="page-title"><div><div class="eyebrow">AI EXAM READINESS</div><h1>Quizinox Predictor</h1></div></div><div class="empty-state"><div>🎯</div><h3>Not enough data yet</h3><p>Attempt a few quizzes or mock tests — the Predictor learns from every attempt.</p></div>`; return; }
  const lo = Math.round(clamp(P.readiness - P.margin, 0, 100)), hi = Math.round(clamp(P.readiness + P.margin, 0, 100)), rd = Math.round(P.readiness);
  const lvl = rd >= 75 ? ['green-text', 'Exam-ready'] : rd >= 55 ? ['', 'On track — keep pushing'] : rd >= 40 ? ['', 'Needs focused revision'] : ['red-text', 'Early stage — build the basics'];
  const confTxt = P.conf >= 75 ? 'High' : P.conf >= 55 ? 'Medium' : 'Low';
  const open = Object.values(C.db.notebook?.items || {}).filter(i => i.state === 'open').sort((a, b) => b.wrong - a.wrong).slice(0, 6);
  const tr = P.slope > 0.8 ? '↗ improving' : P.slope < -0.8 ? '↘ declining' : '→ steady';
  C.view.innerHTML = `<div class="page-title"><div><div class="eyebrow">AI EXAM READINESS</div><h1>Quizinox Predictor</h1><p>Built from every question you have attempted — mock tests count more, recent attempts count more.</p></div></div>
  <div class="x-pred panel"><div class="x-pred-ring" style="--v:${rd * 3.6}deg"><div><strong>${rd}</strong><small>READINESS</small></div></div><div class="x-pred-info"><h2 class="${lvl[0]}">${lvl[1]}</h2><div class="x-range">Estimated range <b>${lo}% – ${hi}%</b></div><div class="muted">Confidence: <b>${confTxt} (${P.conf}%)</b> · based on ${P.at.length} attempts, ${P.answered} answers</div><div class="x-target">Chance of scoring ≥ <input id="prTarget" type="number" min="1" max="100" value="${PR.target}"/>% next time: <b>${Math.round(P.pTarget * 100)}%</b></div></div></div>
  <div class="stats-grid"><div class="stat-card"><small>WEIGHTED SCORE</small><strong>${Math.round(P.mean)}%</strong><span>recent & mocks weigh more</span></div><div class="stat-card"><small>CONSISTENCY</small><strong>${Math.round(P.consistency)}</strong><span>${P.consistency >= 75 ? 'very steady' : P.consistency >= 50 ? 'some ups and downs' : 'scores swing a lot'}</span></div><div class="stat-card"><small>TREND</small><strong class="x-sm">${tr}</strong><span>${P.slope >= 0 ? '+' : ''}${P.slope.toFixed(1)} pts per attempt</span></div><div class="stat-card"><small>NEXT SCORE (EXPECTED)</small><strong>${Math.round(P.nextExp)}%</strong><span>if you keep this pace</span></div></div>
  <div class="panel"><div class="panel-head"><div><h3>Preparation progress</h3><p>Your last ${P.series.length} attempts</p></div></div>${P.series.length > 1 ? chartSvg(P.series) : '<div class="muted">Attempt more quizzes to draw the trend line.</div>'}</div>
  <div class="panel"><div class="panel-head"><div><h3>Subject-wise readiness</h3><p>Weakest first — this is where your marks are leaking</p></div></div>${P.subjects.length ? P.subjects.map(s => `<div class="x-mastery"><div class="x-m-head"><b>${C.esc(s.name)}</b><span class="${s.ready >= 70 ? 'green-text' : s.ready < 50 ? 'red-text' : ''}">${s.ready}% ready · ${s.acc}% accuracy · ${s.n} answered${s.tr != null ? ` · ${s.tr >= 0 ? '↗ +' : '↘ '}${s.tr}` : ''}</span></div><div class="x-bar sm ${s.ready < 50 ? 'bad' : s.ready >= 70 ? 'good' : ''}"><i style="width:${s.ready}%"></i></div>${s.n < 15 ? '<small class="muted">Low data — practise more for a reliable score.</small>' : ''}</div>`).join('') : '<div class="empty-mini"><b>Need at least 3 answered questions per subject</b></div>'}</div>
  <div class="two-col"><div class="panel"><div class="panel-head"><div><h3>Weak topics</h3><p>Lowest accuracy (3+ answers)</p></div></div>${P.topics.length ? P.topics.map(t => `<div class="x-line"><span>${C.esc(t.name)} <small class="muted">· ${C.esc(t.sub)}</small></span><b class="${t.acc < 50 ? 'red-text' : ''}">${t.acc}%</b></div>`).join('') : '<div class="muted">Topic tags appear for quizzes that have them (AI-made quizzes do).</div>'}</div>
  <div class="panel"><div class="panel-head"><div><h3>Where you go wrong</h3><p>Patterns from your last 15 attempts</p></div></div><div class="x-line"><span>Wrong answers</span><b>${P.pat.wrong}</b></div><div class="x-line"><span>Rushed wrong answers (&lt;12 s)</span><b class="${P.pat.rushed > P.pat.wrong * .3 ? 'red-text' : ''}">${P.pat.rushed}</b></div><div class="x-line"><span>Questions skipped</span><b>${P.pat.skip}%</b></div><div class="x-line"><span>Marks lost to negative marking</span><b>${P.pat.negLost}</b></div><div class="x-line"><span>Slow questions (&gt;90 s)</span><b>${P.pat.slow}</b></div></div></div>
  <div class="panel"><div class="panel-head"><div><h3>Mistakes you keep repeating</h3><p>Open items from your Mistake Notebook</p></div><button class="textbtn" id="prNb">Open notebook →</button></div>${open.length ? open.map(i => `<div class="x-line"><span>${C.esc(i.text.slice(0, 120))}${i.text.length > 120 ? '…' : ''}<br><small class="muted">${C.esc(i.subject)} · correct: ${C.esc(i.options[i.correct] || '')}</small></span><b class="red-text">${i.wrong}×</b></div>`).join('') : '<div class="muted">No open mistakes — great!</div>'}</div>
  <div class="panel"><div class="panel-head"><div><h3>AI coach report</h3><p>Optional — the AI reads these numbers and writes your plan (uses 1 AI request)</p></div><button class="primary" id="prAi">✦ Generate report</button></div><div id="prOut" class="tutor-out"></div></div>
  <div class="muted x-foot">Readiness = 70% weighted performance + 15% consistency + 15% improvement trend. It is an estimate, not a guarantee.</div>`;
  $('#prTarget').onchange = e => { PR.target = clamp(Number(e.target.value) || 60, 1, 100); predictorPage(); };
  $('#prNb').onclick = () => C.setTab('notebook');
  $('#prAi').onclick = async () => {
    if (!C.AI.aiReady()) return C.toast('Set up an AI source first (Settings → AI)', 4000);
    const b = $('#prAi'), out = $('#prOut'); b.disabled = true; out.innerHTML = '<div class="ai-loading"><i></i><i></i><i></i></div>';
    const facts = `Readiness ${rd}/100 (range ${lo}-${hi}, confidence ${P.conf}%). Weighted score ${Math.round(P.mean)}%. Consistency ${Math.round(P.consistency)}. Trend ${P.slope.toFixed(1)} pts/attempt. Subjects: ${P.subjects.map(s => `${s.name} ${s.ready}%`).join('; ')}. Weak topics: ${P.topics.map(t => `${t.name} ${t.acc}%`).join('; ')}. Patterns: ${P.pat.rushed} rushed wrong, ${P.pat.skip}% skipped, ${P.pat.negLost} marks lost to negatives. Target ${PR.target}%.`;
    try { const r = await C.AI.aiCall(`You are an exam-preparation coach. From these statistics write: 1) a 3-line honest verdict, 2) the 3 biggest reasons marks are being lost, 3) a concrete 7-day plan (subject, task, minutes), 4) one tip on exam strategy (attempt/skip, negative marking). Be specific, kind, under 350 words. Reply in ${C.db.settings.tutorLang || 'English'}.\n\nSTATS: ${facts}`, { json: false, maxTokens: 1500, temperature: 0.4 }); out.innerHTML = C.md(r.text); }
    catch (e) { out.innerHTML = `<span class="red-text">✕ ${C.esc(e.message)}</span>`; } finally { b.disabled = false; }
  };
}

export const pages = {
  mocks: c => { C = c; B = null; mocksPage(); },
  achievements: c => { C = c; achievementsPage(); },
  notebook: c => { C = c; notebookPage(); },
  analyser: c => { C = c; analyserPage(); },
  predictor: c => { C = c; predictorPage(); },
};
