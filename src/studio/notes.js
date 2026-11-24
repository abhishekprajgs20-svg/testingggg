// Notes: unlimited notebooks → sections → sub-sections. Paste, import PDF/TXT, AI research/organise/summarise, AI chat about the note, voice typing.
import { C, setC, esc, $, $$, S, save, uid, head, chip, ui, empty, mdx, hasAI, ask, askJSON, toast, when, mic, readAny, download, slug, SYSTEM_UPSC, needAI, aiBanner, modelTag } from './core.js';
const N = () => S('notes', { items: [] }).items;
const get = id => N().find(n => n.id === id);
const kids = id => N().filter(n => (n.parent || null) === (id || null)).sort((a, b) => (b.pin ? 1 : 0) - (a.pin ? 1 : 0) || a.order - b.order || a.created - b.created);
const desc = id => kids(id).flatMap(k => [k, ...desc(k.id)]);
let st = { sel: null, open: new Set(), preview: false, ai: true, q: '' };
function add(parent, title = 'Untitled', body = '', extra = {}) { const n = { id: uid(), parent: parent || null, title, body, tags: [], pin: false, created: Date.now(), updated: Date.now(), order: Date.now(), chat: [], ...extra }; N().push(n); if (parent) st.open.add(parent); save(); return n; }
const path = n => { const p = []; let x = n; while (x) { p.unshift(x.title); x = x.parent ? get(x.parent) : null; } return p; };
const textOf = (n, deep = true) => `# ${n.title}\n\n${n.body}` + (deep ? kids(n.id).map(k => '\n\n' + textOf(k)).join('') : '');
export function page(ctx) {
  setC(ctx); const cur = st.sel && get(st.sel); if (st.sel && !cur) st.sel = null; const roots = kids(null);
  const res = st.q ? N().filter(n => (n.title + ' ' + n.body + ' ' + (n.tags || []).join(' ')).toLowerCase().includes(st.q.toLowerCase())).slice(0, 60) : null;
  const row = (n, d) => { const k = kids(n.id), op = st.open.has(n.id); return `<div class="nt-row ${n.id === st.sel ? 'on' : ''}" style="padding-left:${6 + d * 14}px" data-n="${n.id}"><span class="nt-tw" data-tw="${n.id}">${k.length ? (op ? '▾' : '▸') : '·'}</span><span class="nt-t">${n.pin ? '📌 ' : ''}${esc(n.title)}</span>${k.length ? `<em>${k.length}</em>` : ''}<button class="textbtn" data-add="${n.id}" title="Add sub-note">＋</button></div>${op ? k.map(c => row(c, d + 1)).join('') : ''}`; };
  ui(head('NOTES', 'Notes', 'Notebooks with unlimited sections and sub-sections. Paste anything, import a PDF/TXT, or let AI research a topic and organise it for you. Saved on this device and included in backups.', `<button class="u-acc" id="ntNew">＋ New notebook</button><button class="secondary" id="ntPaste">📋 Paste</button><button class="secondary" id="ntFile">📄 Import PDF / TXT</button><button class="secondary" id="ntRes">✦ AI research</button>`) +
   `<div class="nt-wrap ${st.ai && cur ? 'with-ai' : ''}"><aside class="u-glass nt-tree"><input class="u-in" id="ntQ" placeholder="Search notes…" value="${esc(st.q)}"/>${res ? (res.map(n => `<div class="nt-row ${n.id === st.sel ? 'on' : ''}" data-n="${n.id}"><span class="nt-t">${esc(n.title)}<small>${esc(path(n).slice(0, -1).join(' › '))}</small></span></div>`).join('') || '<div class="u-sub">No matches.</div>') : (roots.map(n => row(n, 0)).join('') || empty('🗒', 'No notes yet', 'Create a notebook, paste text, import a file or ask AI to research a topic.'))}</aside>
   <section class="u-glass nt-main">${cur ? editor(cur) : '<div class="u-empty"><div style="font-size:30px">🗒</div><b>Select or create a note</b><div>Use ＋ next to any note to add a sub-section — you can nest as deep as you like.</div></div>'}</section>${st.ai && cur ? `<aside class="u-glass nt-ai">${aiPanel(cur)}</aside>` : ''}</div>`);
  wire(cur);
}
function editor(n) {
  const k = kids(n.id);
  return `<div class="nt-crumb">${path(n).map(esc).join(' › ')}</div><input class="u-in nt-title" id="ntTitle" value="${esc(n.title)}" placeholder="Title"/>
  <div class="nt-tools"><button class="secondary" data-act="sub">＋ Sub-note</button><button class="secondary" data-act="pin">${n.pin ? '📌 Unpin' : '📌 Pin'}</button><button class="secondary" data-act="move">⇄ Move</button><button class="secondary" data-act="dup">⧉ Duplicate</button><button class="secondary" data-act="export">⇩ Export</button><button class="secondary" data-act="del" style="color:#ff9eac">🗑 Delete</button><button class="secondary" data-act="prev">${st.preview ? '✎ Edit' : '👁 Preview'}</button><button class="secondary" data-act="aipanel">${st.ai ? 'Hide AI' : '✦ Show AI'}</button></div>
  <div class="nt-tools"><button class="u-chip p" data-ai="sum">✦ Summarise</button><button class="u-chip p" data-ai="exp">✦ Expand</button><button class="u-chip p" data-ai="simple">✦ Simplify</button><button class="u-chip p" data-ai="org">✦ Organise into sub-notes</button><button class="u-chip p" data-ai="cards">🃏 Flashcards</button><button class="u-chip p" data-ai="quiz">▶ Make quiz</button><button class="u-chip" data-act="vault">🗄 Save to Vault</button></div>
  ${st.preview ? `<div class="nt-prev">${mdx(n.body) || '<span class="u-sub">Empty note</span>'}</div>` : `<div class="u-row" style="margin:6px 0"><button class="secondary" data-fmt="**">B</button><button class="secondary" data-fmt="_">I</button><button class="secondary" data-fmt="# ">H</button><button class="secondary" data-fmt="- ">• List</button><button class="secondary" id="ntMic" title="Voice typing">🎤</button></div><textarea class="u-in nt-body" id="ntBody" placeholder="Write, paste or dictate…">${esc(n.body)}</textarea>`}
  <div class="u-sub" style="margin-top:6px">${(n.body.match(/\S+/g) || []).length} words · ${n.updated ? 'saved ' + when(n.updated) : ''}${n.src ? ' · source: ' + esc(n.src) : ''}</div>
  <input class="u-in" id="ntTags" placeholder="Tags (comma separated)" value="${esc((n.tags || []).join(', '))}" style="margin-top:6px"/>
  ${k.length ? `<h5 class="u-sub" style="margin:12px 0 4px">SUB-NOTES</h5><div>${k.map(c => `<button class="u-chip p" data-n="${c.id}" style="font-size:12px;padding:6px 11px">${esc(c.title)}</button>`).join('')}</div>` : ''}`;
}
function aiPanel(n) {
  const msgs = n.chat || [];
  return `<div class="u-row sp"><b>✦ Notes AI</b><button class="textbtn" id="ntChatClr">Clear</button></div><div class="nt-chat" id="ntChat">${msgs.length ? msgs.map(m => `<div class="ch-msg ${m.role === 'user' ? 'u' : 'a'}">${m.role === 'user' ? esc(m.text) : (m.err ? `<span class="red-text">✕ ${esc(m.text)}</span>` : mdx(m.text))}</div>`).join('') : '<div class="u-sub">Ask me about this note: “Explain this simply”, “What are the key points?”, “Quiz me”.</div>'}</div>${aiBanner()}<div class="ch-input"><textarea class="u-in" id="ntAsk" rows="1" placeholder="Ask me about your notes…"></textarea><button class="secondary" id="ntAskMic">🎤</button><button class="u-acc" id="ntSend">➤</button></div>`;
}
function wire(cur) {
  $('#ntNew').onclick = () => { const n = add(null, 'New notebook'); st.sel = n.id; page(C); };
  $('#ntPaste').onclick = pasteNote; $('#ntFile').onclick = importFile; $('#ntRes').onclick = research;
  const q = $('#ntQ'); q.oninput = () => { st.q = q.value.trim(); const p = q.selectionStart; page(C); const e = $('#ntQ'); e.focus(); e.setSelectionRange(p, p); };
  $$('[data-n]').forEach(b => b.onclick = e => { if (e.target.closest('[data-tw],[data-add]')) return; st.sel = b.dataset.n; page(C); });
  $$('[data-tw]').forEach(b => b.onclick = e => { e.stopPropagation(); const id = b.dataset.tw; st.open.has(id) ? st.open.delete(id) : st.open.add(id); page(C); });
  $$('[data-add]').forEach(b => b.onclick = e => { e.stopPropagation(); const n = add(b.dataset.add, 'New sub-note'); st.sel = n.id; page(C); });
  if (!cur) return;
  const touch = () => { cur.updated = Date.now(); save(); };
  $('#ntTitle').oninput = e => { cur.title = e.target.value || 'Untitled'; touch(); }; $('#ntTitle').onchange = () => page(C);
  const body = $('#ntBody'); if (body) { body.oninput = () => { cur.body = body.value; touch(); }; mic($('#ntMic'), body); $$('[data-fmt]').forEach(b => b.onclick = () => { const f = b.dataset.fmt, s = body.selectionStart, e = body.selectionEnd, sel = body.value.slice(s, e); const wrap = f === '# ' || f === '- ' ? f + sel : f + (sel || 'text') + f; body.setRangeText(wrap, s, e, 'end'); body.dispatchEvent(new Event('input')); body.focus(); }); }
  $('#ntTags').onchange = e => { cur.tags = e.target.value.split(',').map(x => x.trim()).filter(Boolean); touch(); };
  $$('[data-act]').forEach(b => b.onclick = () => act(b.dataset.act, cur)); $$('[data-ai]').forEach(b => b.onclick = () => aiAct(b.dataset.ai, cur, b));
  const send = $('#ntSend'); if (send) { const ta = $('#ntAsk'); mic($('#ntAskMic'), ta); const go = () => chat(cur, ta.value.trim()); send.onclick = go; ta.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); go(); } }; $('#ntChatClr').onclick = () => { cur.chat = []; save(); page(C); }; const log = $('#ntChat'); log.scrollTop = log.scrollHeight; }
}
async function act(a, n) {
  if (a === 'sub') { const c = add(n.id, 'New sub-note'); st.sel = c.id; }
  else if (a === 'pin') { n.pin = !n.pin; save(); }
  else if (a === 'prev') st.preview = !st.preview; else if (a === 'aipanel') st.ai = !st.ai;
  else if (a === 'dup') { const cp = (x, parent) => { const c = add(parent, x.title + (parent === x.parent ? ' (copy)' : ''), x.body, { tags: [...(x.tags || [])] }); kids(x.id).forEach(k => cp(k, c.id)); return c; }; st.sel = cp(n, n.parent).id; toast('Duplicated ✓'); }
  else if (a === 'del') { const ids = [n.id, ...desc(n.id).map(x => x.id)]; if (await C.confirmBox('Delete note?', `“${n.title}” and its ${ids.length - 1} sub-note(s) will be removed from this device.`, 'Delete', true)) { const sset = new Set(ids); S('notes', { items: [] }).items = N().filter(x => !sset.has(x.id)); st.sel = n.parent || null; save(); } }
  else if (a === 'move') return move(n);
  else if (a === 'export') return exportNote(n);
  else if (a === 'vault') { S('vault', { items: [] }).items.unshift({ id: uid(), type: 'note', title: n.title, body: n.body.slice(0, 6000), tags: [...(n.tags || [])], subject: '', diff: 1, fav: false, created: Date.now(), updated: Date.now(), from: 'Notes' }); save(); return toast('Saved to Knowledge Vault ✓'); }
  page(C);
}
function move(n) {
  const bad = new Set([n.id, ...desc(n.id).map(x => x.id)]); const opts = N().filter(x => !bad.has(x.id));
  const { el, close } = C.modal(`<div class="eyebrow">MOVE</div><h2>Move “${esc(n.title)}”</h2><select class="u-in" id="mvTo"><option value="">— Top level (notebook) —</option>${opts.map(x => `<option value="${x.id}" ${x.id === n.parent ? 'selected' : ''}>${esc(path(x).join(' › '))}</option>`).join('')}</select><div class="dialog-actions"><button class="secondary" data-c>Cancel</button><button class="primary" data-s>Move</button></div>`);
  $('[data-c]', el).onclick = close; $('[data-s]', el).onclick = () => { n.parent = $('#mvTo', el).value || null; if (n.parent) st.open.add(n.parent); save(); close(); page(C); };
}
function exportNote(n) {
  const { el, close } = C.modal(`<div class="eyebrow">EXPORT</div><h2>${esc(n.title)}</h2><div class="dialog-actions" style="flex-wrap:wrap"><button class="secondary" data-f="md">Markdown (.md)</button><button class="secondary" data-f="txt">Text (.txt)</button><button class="secondary" data-f="html">Printable HTML</button><button class="secondary" data-f="json">All notes (.json)</button></div>`);
  $$('[data-f]', el).forEach(b => b.onclick = () => { close(); const f = b.dataset.f, t = textOf(n); if (f === 'md') download(`${slug(n.title)}.md`, t, 'text/markdown'); else if (f === 'txt') download(`${slug(n.title)}.txt`, t.replace(/[#*_]/g, ''), 'text/plain'); else if (f === 'html') download(`${slug(n.title)}.html`, `<!doctype html><meta charset="utf-8"><title>${esc(n.title)}</title><style>body{font:15px/1.7 system-ui;max-width:780px;margin:30px auto;padding:0 16px}h1,h2,h3,h4{margin:1.2em 0 .3em}</style>${mdx(t)}`, 'text/html'); else download('quizinox-notes.json', JSON.stringify({ app: 'QUIZINOX', type: 'notes', items: N() }, null, 2), 'application/json'); });
}
function pasteNote() {
  const { el, close } = C.modal(`<div class="eyebrow">PASTE</div><h2>Paste into a new note</h2><input class="u-in" id="pnT" placeholder="Title (optional)"/><textarea class="u-in" id="pnB" style="min-height:180px;margin-top:8px" placeholder="Paste text here…"></textarea><div class="u-row"><button class="secondary" id="pnClip">📋 From clipboard</button><button class="secondary" id="pnMic">🎤</button></div><div class="dialog-actions"><button class="secondary" data-c>Cancel</button><button class="primary" data-s>Save note</button></div>`, { wide: true });
  $('#pnClip', el).onclick = async () => { try { $('#pnB', el).value = await navigator.clipboard.readText(); } catch { toast('Clipboard access was blocked — paste manually (Ctrl/⌘+V).'); } }; mic($('#pnMic', el), $('#pnB', el));
  $('[data-c]', el).onclick = close; $('[data-s]', el).onclick = () => { const b = $('#pnB', el).value.trim(); if (!b) return toast('Nothing to save'); const n = add(st.sel, $('#pnT', el).value.trim() || b.split('\n')[0].slice(0, 60), b, { src: 'Pasted' }); st.sel = n.id; close(); page(C); };
}
async function importFile() {
  const f = await C.pickFile('.pdf,.txt,.md,text/plain,application/pdf'); if (!f) return; toast('Reading ' + f.name + '…');
  try { const r = await readAny(f); if (!r.text?.trim()) throw new Error('No text found in this file'); const n = add(st.sel, f.name.replace(/\.[^.]+$/, ''), r.text.slice(0, 200000), { src: f.name }); st.sel = n.id; page(C); toast(`Imported ${r.text.length.toLocaleString()} characters ✓ — use “Organise into sub-notes” to split it with AI`); } catch (e) { toast('Could not import: ' + e.message); }
}
function research() {
  if (!needAI()) return;
  const { el, close } = C.modal(`<div class="eyebrow">✦ AI RESEARCH</div><h2>Create notes on a topic</h2><p class="u-sub">AI writes from its own knowledge — it cannot browse live websites, so verify important facts. The result is saved as a note with a sub-note per section.</p><label class="u-sub">Topic</label><input class="u-in" id="rsT" placeholder="e.g. Fundamental Rights in the Indian Constitution"/><div class="u-form" style="margin-top:8px"><label>Depth<select class="u-in" id="rsD"><option>Brief overview</option><option selected>Detailed notes</option><option>Exhaustive (many sections)</option></select></label><label>Style<select class="u-in" id="rsS"><option>Exam-oriented (UPSC)</option><option>Simple explanation</option><option>Bullet revision notes</option></select></label><label>Language<select class="u-in" id="rsL"><option>English</option><option>Hindi</option><option>Hinglish</option></select></label></div><div id="rsOut" class="u-sub"></div><div class="dialog-actions"><button class="secondary" data-c>Close</button><button class="primary" id="rsGo">✦ Create notes</button></div>`, { wide: true });
  $('[data-c]', el).onclick = close;
  $('#rsGo', el).onclick = async () => {
    const t = $('#rsT', el).value.trim(); if (t.length < 3) return toast('Enter a topic'); const b = $('#rsGo', el); b.disabled = true; $('#rsOut', el).textContent = 'AI is writing…';
    try { const { j, r } = await askJSON(`Write ${$('#rsD', el).value.toLowerCase()} study notes on "${t}" in ${$('#rsL', el).value}. Style: ${$('#rsS', el).value}. Be accurate; if unsure of a fact, leave it out. Return ONLY JSON: {"title":"...","overview":"short markdown intro","sections":[{"title":"...","body":"markdown (bullets, bold key terms)","sub":[{"title":"...","body":"markdown"}]}]}`, { maxTokens: 6000 });
      if (!j?.sections?.length) throw new Error('The AI reply had no sections — try again.'); const root = add(st.sel, j.title || t, j.overview || '', { src: 'AI research · ' + modelTag(r), tags: ['AI'] });
      j.sections.forEach(s => { const c = add(root.id, s.title || 'Section', s.body || '', { src: 'AI' }); (s.sub || []).forEach(x => add(c.id, x.title || 'Sub-section', x.body || '', { src: 'AI' })); }); st.sel = root.id; st.open.add(root.id); close(); page(C); toast('Notes created ✓'); }
    catch (e) { $('#rsOut', el).innerHTML = `<span class="red-text">✕ ${esc(e.message)}</span>`; b.disabled = false; }
  };
}
async function aiAct(kind, n, btn) {
  if (!needAI()) return; const text = textOf(n, false).slice(0, 14000); if (n.body.trim().length < 15 && kind !== 'org') return toast('Write or paste some text first'); const old = btn.textContent; btn.disabled = true; btn.textContent = '…';
  try {
    if (kind === 'sum' || kind === 'exp' || kind === 'simple') { const ins = { sum: 'Summarise into crisp bullet points (keep every key fact).', exp: 'Expand with more explanation, examples and related facts; keep the original structure.', simple: 'Rewrite in very simple language for a beginner; keep all facts.' }[kind]; const r = await ask(`${ins}\nReturn only the markdown text.\n\nNOTE:\n${text}`, { maxTokens: 3000 }); const c = add(n.id, `${{ sum: 'Summary', exp: 'Expanded', simple: 'Simplified' }[kind]} — ${n.title}`, r.text, { src: 'AI · ' + modelTag(r) }); st.sel = c.id; st.open.add(n.id); toast('Saved as a sub-note ✓'); }
    else if (kind === 'org') { const src = n.body.trim().length > 40 ? text : (kids(n.id).map(k => textOf(k)).join('\n')); const { j } = await askJSON(`Split and organise this text into a clean hierarchy of sections and sub-sections WITHOUT losing facts. Return ONLY JSON: {"sections":[{"title":"...","body":"markdown","sub":[{"title":"...","body":"markdown"}]}]}\n\nTEXT:\n${src.slice(0, 16000)}`, { maxTokens: 6000 }); if (!j?.sections?.length) throw new Error('No sections returned'); j.sections.forEach(s => { const c = add(n.id, s.title, s.body, { src: 'AI organised' }); (s.sub || []).forEach(x => add(c.id, x.title, x.body, { src: 'AI organised' })); }); st.open.add(n.id); toast('Organised into sub-notes ✓ (original kept)'); }
    else if (kind === 'cards') { const { j } = await askJSON(`Make 10 flashcards from this note. Return ONLY JSON [{"front":"question","back":"short answer","extra":"1-2 line explanation"}]. Use only facts in the note.\n\nNOTE:\n${text}`, { maxTokens: 3000 }); const arr = (Array.isArray(j) ? j : j.cards || []).filter(x => x.front && x.back); const { addCardsToDeck } = await import('../upsc/flash.js'); const r = addCardsToDeck('Notes — ' + n.title.slice(0, 30), arr, 'Notes'); toast(`${r.added} flashcards added (deck “${r.deck.name}”) ✓`); }
    else if (kind === 'quiz') C.aiGenerator({ source: 'paste', sourceText: text, subject: 'Notes', types: ['mcq', 'statement'], count: 10 });
  } catch (e) { toast('✕ ' + e.message); } finally { btn.disabled = false; btn.textContent = old; save(); page(C); }
}
async function chat(n, q) {
  if (!q) return; if (!needAI()) return; n.chat ||= []; n.chat.push({ role: 'user', text: q }); save(); page(C);
  try { const hist = n.chat.slice(-8, -1).map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.text.slice(0, 700)}`).join('\n'); const r = await ask(`Answer using the student's note below (add outside knowledge only if clearly helpful and say so).\n\nNOTE "${n.title}":\n${textOf(n, true).slice(0, 12000)}\n\n${hist ? 'Conversation so far:\n' + hist + '\n\n' : ''}Student: ${q}`, { maxTokens: 1800, noLog: false }); n.chat.push({ role: 'ai', text: r.text }); }
  catch (e) { n.chat.push({ role: 'ai', err: true, text: e.message }); } save(); page(C);
}
