// Micro-level UPSC syllabus tracker. Hierarchy: Exam > Paper > Subject > Unit > Topic > Subtopic > Micro-topic.
import { SYLLABUS_TEXT } from './data-syllabus.js';
import { C, setC, esc, $, $$, sub, stats, persist, head, bar, chip, tabsHtml, ui, pct, dayKey, relatedQuestions, relatedNotes, relatedQuizzes, practiceQuestions, generateFor, toast, words } from './core.js';

const LEVELS = ['Exam', 'Paper', 'Subject', 'Unit', 'Topic', 'Subtopic', 'Micro-topic'];
const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
let TREE = null, INDEX = new Map(), LEAVES = [];
const ST = ['Not started', 'In progress', 'Completed'];

function mk(name, level, parent) { const path = (parent ? parent.path + '>' : '') + name; const n = { id: hash(path), name, level, parent, path, kids: [], custom: false }; INDEX.set(n.id, n); if (parent) parent.kids.push(n); return n; }
function build() {
  INDEX = new Map(); const roots = []; const stack = [];
  for (const raw of SYLLABUS_TEXT.split('\n')) {
    if (!raw.trim()) continue; const depth = raw.length - raw.trimStart().length; const text = raw.trim();
    while (stack.length > depth) stack.pop();
    const parent = stack[depth - 1] || null;
    if (depth <= 3 || (depth === 5 && !text.includes(':')) || (depth === 4 && !text.includes('|') && !text.includes(':'))) {
      const n = mk(text, depth, parent); stack[depth] = n; if (!parent) roots.push(n); continue;
    }
    const segs = text.split('|').map(s => s.trim()).filter(Boolean);
    if (segs[0].includes(':')) { // "Name: micro | micro | micro"
      const ci = segs[0].indexOf(':'); const name = segs[0].slice(0, ci).trim(); const micros = [segs[0].slice(ci + 1).trim(), ...segs.slice(1)].filter(Boolean);
      const holder = mk(name, depth, parent); stack[depth] = holder;
      if (depth === 4) { const sb = mk('Key areas', 5, holder); micros.forEach(m => mk(m, 6, sb)); } else micros.forEach(m => mk(m, 6, holder));
    } else segs.forEach(s => { const n = mk(s, depth, parent); stack[depth] = n; }); // pipe-separated leaf topics
  }
  // user-created topics (saved locally) are attached as extra micro-topics
  for (const c of sub('sylCustom', { list: [] }).list) { const p = INDEX.get(c.parent); if (p) { const n = { id: c.id, name: c.name, level: Math.min(6, p.level + 1), parent: p, path: p.path + '>' + c.name, kids: [], custom: true }; INDEX.set(n.id, n); p.kids.push(n); } }
  TREE = roots; LEAVES = [...INDEX.values()].filter(n => !n.kids.length);
}
const S = () => sub('syllabus', {});
const rec = id => S()[id] || (S()[id] = { s: 0, pri: 'med', note: '', start: '', done: '', rev: { n: 0, last: '' } });
const status = id => S()[id]?.s || 0;
function leavesOf(n) { if (!n.kids.length) return [n]; const out = []; (function w(x) { if (!x.kids.length) out.push(x); else x.kids.forEach(w); })(n); return out; }
function prog(n) { const l = leavesOf(n); let d = 0, p = 0; l.forEach(x => { const s = status(x.id); if (s === 2) d++; else if (s === 1) p++; }); return { total: l.length, done: d, prog: p, pending: l.length - d - p, pct: pct(d + p * 0.5, l.length), pctDone: pct(d, l.length) }; }
function nodeStatus(n) { const p = prog(n); return p.done === p.total ? 2 : p.done + p.prog > 0 ? 1 : 0; }
function refreshStats() { const t = { total: LEAVES.length, done: 0, prog: 0 }; LEAVES.forEach(x => { const s = status(x.id); if (s === 2) t.done++; else if (s === 1) t.prog++; }); t.pct = pct(t.done, t.total); stats().syl = t; }
function setLeaf(id, s) {
  const r = rec(id), prev = r.s; r.s = s; const today = dayKey(Date.now());
  if (s >= 1 && !r.start) r.start = today; if (s === 2 && !r.done) r.done = today; if (s < 2) r.done = ''; if (s === 0) r.start = '';
  if (prev !== 2 && s === 2) { /* first completion starts the revision track */ r.rev ||= { n: 0, last: '' }; }
}
function setNode(n, s) { leavesOf(n).forEach(x => setLeaf(x.id, s)); }
let tab = 'tree', open = new Set(), filter = '', stFilter = -1;
const matches = n => n.path.toLowerCase().includes(filter) || n.kids.some(matches);
function nodeHtml(n) {
  const leaf = !n.kids.length, p = prog(n), s = leaf ? status(n.id) : nodeStatus(n), isOpen = open.has(n.id) || (!!filter && n.kids.some(matches));
  if (stFilter >= 0 && leaf && s !== stFilter) return '';
  if (stFilter >= 0 && !leaf) { const hasMatch = leavesOf(n).some(x => status(x.id) === stFilter); if (!hasMatch) return ''; }
  if (filter && !matches(n)) return '';
  const pri = S()[n.id]?.pri; 
  return `<div class="node" data-n="${n.id}"><div class="nh"><span class="u-twist" data-tw="${n.id}">${leaf ? '•' : isOpen ? '▾' : '▸'}</span><span class="lv">${LEVELS[n.level] || ''}</span><b data-name="${n.id}">${esc(n.name)}${n.custom ? ' ✎' : ''}</b>${pri === 'high' ? chip('High', 'r') : ''}${leaf ? `<button class="u-st s${s}" data-cyc="${n.id}" title="Tap to change status">${ST[s]}</button>` : `<em>${p.done}/${p.total}</em><button class="u-st s${s}" data-bulk="${n.id}" title="Set status for everything inside">${s === 2 ? '✓' : s === 1 ? '◐' : '○'}</button>`}<button class="textbtn" data-info="${n.id}" title="Details">ⓘ</button></div>${!leaf ? bar(p.pct, p.done === p.total ? 'g' : '') : ''}${isOpen && !leaf ? n.kids.map(nodeHtml).join('') : ''}</div>`;
}
function dash() {
  const t = prog({ kids: TREE, id: '' }) , all = { total: LEAVES.length, done: 0, prog: 0 }; LEAVES.forEach(x => { const s = status(x.id); if (s === 2) all.done++; else if (s === 1) all.prog++; });
  const rows = (nodes, withKids) => nodes.map(n => { const p = prog(n); return `<div class="u-card" style="margin:6px 0"><div class="u-row sp"><b>${esc(n.name)}</b><span><b>${p.pctDone}%</b> <small>${p.done}/${p.total}</small></span></div>${bar(p.pctDone, p.done === p.total ? 'g' : '')}<small>${p.prog} in progress · ${p.pending} pending</small></div>`; }).join('');
  const papers = TREE.flatMap(e => e.kids), subjects = papers.flatMap(p => p.kids), units = subjects.flatMap(s => s.kids);
  const unitsSel = subjects.map(s => `<option value="${s.id}">${esc(s.parent.name)} › ${esc(s.name)}</option>`).join('');
  return `<div class="u-glass"><div class="u-row sp"><h3>Overall syllabus completion</h3><b style="font-size:26px">${pct(all.done, all.total)}%</b></div>${bar(pct(all.done, all.total))}<div class="u-stat"><div><small>MICRO-TOPICS</small><strong>${all.total}</strong></div><div><small>COMPLETED</small><strong style="color:#8bebc4">${all.done}</strong></div><div><small>IN PROGRESS</small><strong style="color:#f6cd7d">${all.prog}</strong></div><div><small>PENDING</small><strong>${all.total - all.done - all.prog}</strong></div></div></div>
  <div class="u-grid wide"><div class="u-glass"><h3>Paper-wise</h3>${rows(papers)}</div><div class="u-glass"><h3>Subject-wise</h3>${rows(subjects)}</div></div>
  <div class="u-glass"><h3>Unit-wise &amp; topic-wise</h3><label class="u-sub">Choose a subject</label><select class="u-in" id="dSub">${unitsSel}</select><div id="dUnits"></div></div>`;
}
function lists() {
  const mk2 = s => { const l = LEAVES.filter(x => status(x.id) === s); return `<div class="u-glass"><h3>${['Pending topics', 'Currently studying', 'Completed topics'][s]} <small>(${l.length})</small></h3>${l.length ? l.slice(0, 80).map(x => `<div class="u-task"><span><b>${esc(x.name)}</b><br><small class="u-sub">${esc(x.path.split('>').slice(1, 4).join(' › '))}</small></span><button class="textbtn" data-info="${x.id}" style="margin-left:auto">Open</button></div>`).join('') + (l.length > 80 ? `<small class="u-sub">+${l.length - 80} more — use the Tracker tab filters</small>` : '') : '<div class="u-sub">Nothing here yet.</div>'}</div>`; };
  return `<div class="u-grid wide">${mk2(1)}${mk2(2)}</div>${mk2(0)}`;
}
export function page(ctx) {
  setC(ctx); if (!TREE) build(); refreshStats();
  const body = tab === 'tree' ? `<div class="u-glass"><div class="u-row"><input class="u-in" id="sf" placeholder="Search the syllabus (e.g. Fundamental Rights, monsoon)…" value="${esc(filter)}" style="flex:1;min-width:200px"/><select class="u-in" id="stf" style="width:auto"><option value="-1">All statuses</option>${ST.map((s, i) => `<option value="${i}" ${stFilter === i ? 'selected' : ''}>${s}</option>`).join('')}</select><button class="secondary" id="expAll">Expand to subjects</button><button class="secondary" id="colAll">Collapse</button></div><div class="u-tree" style="margin-top:10px">${TREE.map(nodeHtml).join('') || ''}</div></div>` : tab === 'dash' ? dash() : lists();
  const t = stats().syl;
  ui(head('SYLLABUS TRACKER', 'Micro-level UPSC syllabus tracker', `${t.total} micro-topics across Prelims, CSAT, Mains GS I–IV, Essay and Optional. <b>${t.pct}%</b> complete · ${t.done} done · ${t.prog} in progress. Progress is saved on this device.`) + tabsHtml([['tree', 'Tracker'], ['dash', 'Progress dashboard'], ['lists', 'Completed / pending']], tab) + body);
  $$('[data-t]').forEach(b => b.onclick = () => { tab = b.dataset.t; page(C); });
  wireTree();
  const ds = $('#dSub'); if (ds) { const draw = () => { const s = INDEX.get(ds.value); $('#dUnits').innerHTML = s.kids.map(u => { const p = prog(u); return `<details class="u-det"><summary><span>${esc(u.name)} <small>· ${p.done}/${p.total}</small></span><b>${p.pctDone}%</b></summary><div class="u-body">${u.kids.map(tp => { const q = prog(tp); return `<div class="u-row sp" style="margin:6px 0"><span>${esc(tp.name)}</span><span><b>${q.pctDone}%</b> <small>${q.done}/${q.total}</small></span></div>${bar(q.pctDone, q.done === q.total ? 'g' : '')}`; }).join('')}</div></details>`; }).join(''); }; ds.onchange = draw; draw(); }
}
function repaint() { refreshStats(); persist(); const keep = window.scrollY; page(C); window.scrollTo(0, keep); }
function wireTree() {
  const sf = $('#sf'); if (sf) { sf.oninput = () => { filter = sf.value.trim().toLowerCase(); const pos = sf.selectionStart; page(C); const n = $('#sf'); n.focus(); n.setSelectionRange(pos, pos); }; $('#stf').onchange = e => { stFilter = Number(e.target.value); page(C); }; $('#expAll').onclick = () => { INDEX.forEach(n => { if (n.level < 3 && n.kids.length) open.add(n.id); }); page(C); }; $('#colAll').onclick = () => { open.clear(); page(C); }; }
  const toggle = id => { const n = INDEX.get(id); if (!n || !n.kids.length) return info(id); open.has(id) ? open.delete(id) : open.add(id); page(C); };
  $$('[data-tw]').forEach(b => b.onclick = e => { e.stopPropagation(); toggle(b.dataset.tw); });
  $$('[data-name]').forEach(b => b.onclick = () => toggle(b.dataset.name));
  $$('[data-cyc]').forEach(b => b.onclick = e => { e.stopPropagation(); setLeaf(b.dataset.cyc, (status(b.dataset.cyc) + 1) % 3); repaint(); });
  $$('[data-bulk]').forEach(b => b.onclick = e => { e.stopPropagation(); bulk(b.dataset.bulk); });
  $$('[data-info]').forEach(b => b.onclick = e => { e.stopPropagation(); info(b.dataset.info); });
}
function bulk(id) {
  const n = INDEX.get(id), p = prog(n);
  C.actionSheet(n.name, `${p.total} micro-topics inside · ${p.done} completed`, [
    { icon: '○', label: 'Mark all Not started', hint: 'Resets dates for these topics', run: () => { setNode(n, 0); repaint(); } },
    { icon: '◐', label: 'Mark all In progress', hint: '', run: () => { setNode(n, 1); repaint(); } },
    { icon: '✓', label: 'Mark all Completed', hint: '', cls: 'practice-icon', run: () => { setNode(n, 2); repaint(); } },
  ]);
}
function info(id) {
  const n = INDEX.get(id); if (!n) return; const leaf = !n.kids.length, r = rec(id), p = prog(n);
  const kids = n.kids.length ? n.kids : [];
  const extra = [...new Set(leavesOf(n).slice(0, 25).map(x => x.name))];
  const rq = relatedQuestions(n.name, extra), rn = relatedNotes(n.name, extra.slice(0, 8)), rz = relatedQuizzes(n.name, extra.slice(0, 8));
  const status0 = leaf ? r.s : nodeStatus(n);
  const { el, close } = C.modal(`<div class="eyebrow">${LEVELS[n.level] || ''} · ${esc(n.path.split('>').slice(0, -1).slice(-3).join(' › '))}</div><h2>${esc(n.name)}</h2>
   <div class="u-row" style="margin:6px 0"><span class="u-chip ${status0 === 2 ? 'g' : status0 === 1 ? 'a' : ''}">${ST[status0]}</span>${chip(`${p.done}/${p.total} micro-topics done`, 'p')}${chip('Revised ' + (r.rev?.n || 0) + '×' + (r.rev?.last ? ' · last ' + r.rev.last : ''))}</div>
   <div class="u-form"><label>Study status<select class="u-in" id="iSt">${ST.map((s, i) => `<option value="${i}" ${status0 === i ? 'selected' : ''}>${s}${leaf ? '' : ' (applies to all inside)'}</option>`).join('')}</select></label><label>Priority<select class="u-in" id="iPri">${['low', 'med', 'high'].map(x => `<option value="${x}" ${r.pri === x ? 'selected' : ''}>${x === 'med' ? 'Medium' : x[0].toUpperCase() + x.slice(1)}</option>`).join('')}</select></label><label>Start date<input type="date" class="u-in" id="iStart" value="${r.start || ''}"/></label><label>Completion date<input type="date" class="u-in" id="iDone" value="${r.done || ''}"/></label></div>
   ${kids.length ? `<h5 class="u-sub" style="margin:14px 0 4px">SUBTOPICS / MICRO-TOPICS</h5><div style="max-height:170px;overflow:auto">${kids.map(k => `<div class="u-task"><span style="flex:1">${esc(k.name)} ${k.kids.length ? `<small class="u-sub">(${prog(k).done}/${prog(k).total})</small>` : ''}</span>${!k.kids.length ? `<button class="u-st s${status(k.id)}" data-kc="${k.id}">${ST[status(k.id)]}</button>` : `<button class="textbtn" data-ko="${k.id}">open</button>`}</div>`).join('')}</div>` : ''}
   <label class="u-sub" style="display:block;margin-top:12px">Personal notes</label><textarea class="u-in" id="iNote" placeholder="Your own notes, sources, doubts…">${esc(r.note || '')}</textarea>
   <div class="u-row" style="margin-top:10px"><button class="secondary" id="iRev">↻ Mark revised today</button><button class="secondary" id="iAddC">＋ Add custom sub-topic</button>${n.custom ? '<button class="secondary" id="iDel">🗑 Remove this custom topic</button>' : ''}</div>
   <h5 class="u-sub" style="margin:14px 0 4px">RELATED EXISTING NOTES</h5>${rn.length ? rn.map(x => `<div class="u-task"><span><small>${x.kind}</small><br>${esc(x.title)}</span></div>`).join('') : '<div class="u-sub">No matching notes yet. Wrong answers in quizzes appear here automatically.</div>'}
   <h5 class="u-sub" style="margin:14px 0 4px">RELATED EXISTING QUIZZES</h5>${rz.length ? rz.map(x => `<div class="u-task"><span><b>${esc(x.quiz.title)}</b> <small>${x.n ? x.n + ' matching questions' : 'title match'}</small></span><button class="textbtn" data-oq="${x.quiz.id}" style="margin-left:auto">Open</button></div>`).join('') : '<div class="u-sub">No quiz in your library matches this topic.</div>'}
   <div class="dialog-actions" style="margin-top:16px;flex-wrap:wrap"><button class="primary" id="iPrac">▶ Practice ${rq.length ? `(${rq.length} questions)` : ''}</button><button class="secondary" id="iGen">✦ Generate questions with AI</button><button class="secondary" id="iAsk">💬 Ask AI</button><button class="secondary" id="iSave">Save</button></div>`, { wide: true });
  const save = () => { const a = Number($('#iSt', el).value); r.pri = $('#iPri', el).value; r.note = $('#iNote', el).value; r.start = $('#iStart', el).value; r.done = $('#iDone', el).value; const cur = leaf ? r.s : nodeStatus(n); const sd = r.start, dd = r.done; if (a !== cur) { leaf ? setLeaf(id, a) : setNode(n, a); } if (leaf) { if (sd) r.start = sd; if (dd && a === 2) r.done = dd; } };
  $('#iSave', el).onclick = () => { save(); close(); repaint(); toast('Saved ✓'); };
  $('#iRev', el).onclick = () => { r.rev ||= { n: 0, last: '' }; r.rev.n++; r.rev.last = dayKey(Date.now()); persist(); toast('Revision logged ✓'); };
  $('#iPrac', el).onclick = () => { save(); persist(); close(); if (!practiceQuestions(n.name, n.path.split('>')[2] || 'UPSC', rq)) noQ(n); };
  $('#iGen', el).onclick = () => { save(); persist(); close(); generateFor(`${n.name} — UPSC ${n.path.split('>')[0]}`, n.path.split('>')[2] || 'UPSC'); };
  $('#iAsk', el).onclick = () => { save(); persist(); close(); sessionStorage.setItem('upsc_doubt_ctx', JSON.stringify({ kind: 'Topic', title: n.name, text: `Syllabus topic: ${n.path.split('>').join(' › ')}\nIncludes: ${extra.join('; ')}\nMy notes: ${r.note || '(none)'}` })); C.setTab('doubt'); };
  $$('[data-kc]', el).forEach(b => b.onclick = () => { setLeaf(b.dataset.kc, (status(b.dataset.kc) + 1) % 3); b.className = 'u-st s' + status(b.dataset.kc); b.textContent = ST[status(b.dataset.kc)]; persist(); });
  $$('[data-ko]', el).forEach(b => b.onclick = () => { save(); persist(); close(); info(b.dataset.ko); });
  $$('[data-oq]', el).forEach(b => b.onclick = () => { close(); C.chooseMode(b.dataset.oq); });
  $('#iAddC', el).onclick = () => { save(); persist(); close(); addCustom(n); };
  const del = $('#iDel', el); if (del) del.onclick = () => { const L = sub('sylCustom', { list: [] }); L.list = L.list.filter(c => c.id !== id); delete S()[id]; persist(); close(); build(); repaint(); };
}
function noQ(n) {
  const { el, close } = C.modal(`<div class="eyebrow">PRACTICE</div><h2>No questions on “${esc(n.name)}” yet</h2><p>None of your saved quizzes match this topic, and QUIZINOX never invents questions. You can generate fresh ones with the existing AI Question Generator (they are saved as a normal quiz), or import a question bank.</p><div class="dialog-actions"><button class="secondary" data-c>Close</button><button class="primary" data-g>✦ Generate with AI</button></div>`);
  $('[data-c]', el).onclick = close; $('[data-g]', el).onclick = () => { close(); generateFor(`${n.name} — UPSC`, n.path.split('>')[2] || 'UPSC'); };
}
function addCustom(parent) {
  const { el, close } = C.modal(`<div class="eyebrow">CUSTOM TOPIC</div><h2>Add under “${esc(parent.name)}”</h2><label class="u-sub">Topic name</label><input class="u-in" id="cn" placeholder="e.g. Paper I · Unit 3 · Topic"/><div class="dialog-actions"><button class="secondary" data-c>Cancel</button><button class="primary" data-s>Add</button></div>`);
  $('[data-c]', el).onclick = close; $('[data-s]', el).onclick = () => { const name = $('#cn', el).value.trim(); if (!name) return; sub('sylCustom', { list: [] }).list.push({ id: 'c' + hash(parent.id + name + Date.now()), parent: parent.id, name }); persist(); build(); open.add(parent.id); close(); repaint(); };
}
/** Used by the planner: in-progress first, then pending high-priority micro-topics (names + paths). */
export function pendingTopics(ctx, n = 15) {
  setC(ctx); if (!TREE) build();
  const rank = x => (status(x.id) === 1 ? 0 : S()[x.id]?.pri === 'high' ? 1 : 2);
  return LEAVES.filter(x => status(x.id) < 2).sort((a, b) => rank(a) - rank(b)).slice(0, n).map(x => ({ name: x.name, path: x.path.split('>').slice(1, 4).join(' › '), s: status(x.id) }));
}
