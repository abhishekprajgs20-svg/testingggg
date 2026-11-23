// QUIZINOX v4.0 — NOTES HUB
// Nested subsections (folders inside folders, unlimited depth). A note can be built by
// pasting anything, uploading a PDF, or asking AI to research & write it. AI tools on each
// note: summarize, expand, key points, explain simply. Everything is stored on this device.
export default function notesPage(C) {
  const { $, $$, esc, escMl, toast, modal, confirmBox } = C;
  const hub = () => { const d = C.db; if (!d.notesHub || typeof d.notesHub !== 'object') d.notesHub = { root: [] }; if (!Array.isArray(d.notesHub.root)) d.notesHub.root = []; return d.notesHub; };
  const persist = () => C.save();
  let path = [];      // folder ids from root → current folder
  let openNote = null; // note id currently open

  const mkFolder = title => ({ id: C.uid(), kind: 'folder', title: title || 'New subsection', children: [], created: Date.now() });
  const mkNote = (title, text, src) => ({ id: C.uid(), kind: 'note', title: title || 'Untitled note', text: text || '', src: src || 'paste', created: Date.now(), updated: Date.now() });
  const nodeById = (list, id) => { for (const n of list || []) { if (n.id === id) return n; const f = nodeById(n.children, id); if (f) return f; } return null; };
  const allNodes = list => (list || []).flatMap(n => [n, ...allNodes(n.children)]);
  const parentListOf = id => { const walk = list => { for (const n of list) { if (n.id === id) return list; const r = walk(n.children || []); if (r) return r; } return null; }; return walk(hub().root); };
  const noteCount = list => (list || []).reduce((n, x) => n + (x.kind === 'note' ? 1 : noteCount(x.children)), 0);

  const curFolder = () => { let list = hub().root; let node = null; for (const id of path) { node = list.find(n => n.id === id && n.kind === 'folder'); if (!node) { path = path.slice(0, path.indexOf(id)); break; } list = node.children; } return list; };
  const crumbs = () => {
    const out = [`<button data-crumb="-1">⌂ Notes Hub</button>`]; let list = hub().root;
    path.forEach((id, i) => { const n = list.find(x => x.id === id); if (!n) return; out.push(`<span class="sep">›</span><button data-crumb="${i}">${esc(n.title)}</button>`); list = n.children || []; });
    return `<div class="v4-crumbs">${out.join('')}</div>`;
  };

  function render() {
    const list = curFolder();
    const note = openNote ? nodeById(hub().root, openNote) : null;
    if (openNote && (!note || note.kind !== 'note')) openNote = null;
    const total = noteCount(hub().root);
    C.view.innerHTML = `
    <div class="page-title"><div><div class="eyebrow">WRITE · PASTE · PDF · AI</div><h1>Notes Hub</h1><p>Notes organised in unlimited nested subsections. Paste anything, upload a PDF, or let AI research a topic and write the note for you. Saved on this device.</p></div>
    <div class="title-actions row"><input id="nhSearch" placeholder="⌕ Search all notes…" value="${esc(q_)}" style="min-width:200px"/><button class="secondary" id="nhAiNote">✦ AI note from topic</button><button class="primary" id="nhNewNote">＋ New note</button></div></div>
    <div class="v4-layout">
      <aside class="panel v4-side">
        ${crumbs()}
        <div class="v4-toolbar"><button class="secondary" id="nhNewFolder" style="flex:1">🗀 New subsection</button></div>
        <div id="nhTree">${list.length ? list.map(n => rowHtml(n, 0)).join('') : `<div class="empty-mini"><span>🗒</span><b>Empty</b><small>Create a note or a subsection.</small></div>`}</div>
        <p class="muted" style="margin-top:10px">${total} note${total === 1 ? '' : 's'} in total</p>
      </aside>
      <section class="panel v4-editor" id="nhMain">${openNote ? editorHtml(note) : homeHtml()}</section>
    </div>`;
    wire();
  }
  let q_ = '';
  const rowHtml = (n, depth) => {
    const kids = n.kind === 'folder' && n.children?.length ? `<div class="v4-kids">${n.children.map(k => rowHtml(k, depth + 1)).join('')}</div>` : '';
    const sel = n.id === openNote || path.includes(n.id) ? 'sel' : '';
    return `<button class="v4-row ${sel}" data-nid="${n.id}" data-nkind="${n.kind}"><span class="ic">${n.kind === 'folder' ? '🗀' : '🗒'}</span><span class="t">${esc(n.title)}${n.kind === 'folder' ? ` <small>· ${noteCount(n.children)}</small>` : ''}</span>${n.kind === 'note' && n.src === 'ai' ? '<small title="Written by AI">✦</small>' : ''}<button class="mini del" data-nren="${n.id}" title="Rename">✎</button><button class="mini delete del" data-ndel="${n.id}" title="Delete">×</button></button>${kids}`;
  };
  const homeHtml = () => `<div class="v4-empty"><span class="big">🗒</span><b>Pick a note on the left, or create one</b><small>Paste text, drop in a PDF, or tap “✦ AI note from topic”. Subsections nest as deep as you like.</small></div>`;
  const editorHtml = n => `
    <div class="panel-head"><div><h3 contenteditable="false">${esc(n.title)}</h3><p>${n.src === 'pdf' ? '📄 From PDF' : n.src === 'ai' ? '✦ Written by AI' : '✎ Pasted / typed'} · updated ${new Date(n.updated).toLocaleString()}</p></div><div class="title-actions row">
      <button class="textbtn" id="neRename">Rename</button><button class="secondary" id="neExport">⇩ Export TXT</button><button class="textbtn danger-text" id="neDel">Delete</button></div></div>
    <div class="v4-toolbar">
      <button class="secondary" id="nePdf">📄 Upload PDF into note</button>
      <button class="secondary" id="neSumm">✦ Summarize</button>
      <button class="secondary" id="neExpand">✦ Expand</button>
      <button class="secondary" id="nePoints">✦ Key points</button>
      <button class="secondary" id="neSimple">✦ Explain simply</button>
    </div>
    <textarea id="neText" placeholder="Paste or write anything here…">${esc(n.text)}</textarea>
    <div class="v4-toolbar"><button class="primary" id="neSave">Save note</button><span class="v4-status" id="neStatus"></span></div>
    <div id="neAiOut"></div>`;

  function wire() {
    $$('[data-crumb]').forEach(b => b.onclick = () => { path = path.slice(0, Number(b.dataset.crumb) + 1); openNote = null; render(); });
    $('#nhNewFolder').onclick = () => { const f = mkFolder(); curFolder().push(f); persist(); path.push(f.id); openNote = null; render(); };
    $('#nhNewNote').onclick = () => { const n = mkNote(); curFolder().push(n); openNote = n.id; persist(); render(); };
    $('#nhAiNote').onclick = aiNoteDialog;
    const sIn = $('#nhSearch'); sIn.oninput = () => { q_ = sIn.value; if (q_.trim()) showSearch(q_.trim()); };
    $$('[data-nid]').forEach(b => b.onclick = e => {
      if (e.target.dataset.nren || e.target.dataset.ndel) return;
      const n = nodeById(hub().root, b.dataset.nid);
      if (n.kind === 'folder') { path = [...pathOf(n.id)]; openNote = null; render(); }
      else { openNote = n.id; render(); }
    });
    $$('[data-nren]').forEach(b => b.onclick = e => { e.stopPropagation(); renameNode(b.dataset.nren); });
    $$('[data-ndel]').forEach(b => b.onclick = async e => { e.stopPropagation(); const n = nodeById(hub().root, b.dataset.ndel); if (!n) return; const extra = n.kind === 'folder' ? ` and its ${noteCount(n.children)} note(s) / subsections` : ''; if (await confirmBox('Delete?', `“${n.title}” will be deleted${extra}.`, 'Delete', true)) { const l = parentListOf(n.id); if (l) { l.splice(l.findIndex(x => x.id === n.id), 1); } if (openNote === n.id) openNote = null; persist(); render(); } });
    if (openNote) wireEditor(nodeById(hub().root, openNote));
  }
  const pathOf = id => { const out = []; const walk = (list, trail) => { for (const n of list) { const t = [...trail, n.id]; if (n.id === id) { out.push(...t); return true; } if (walk(n.children || [], t)) return true; } return false; }; walk(hub().root, []); return out.slice(0, -1); };

  function renameNode(id) {
    const n = nodeById(hub().root, id); if (!n) return;
    const { el, close } = modal(`<h2>Rename</h2><label>Title<input id="rnIn" value="${esc(n.title)}"/></label><div class="dialog-actions"><button class="primary" id="rnOk">Save</button></div>`);
    const ok = () => { const v = $('#rnIn', el).value.trim(); if (!v) return; n.title = v; persist(); close(); render(); };
    $('#rnOk', el).onclick = ok; $('#rnIn', el).onkeydown = e => { if (e.key === 'Enter') ok(); };
    setTimeout(() => { $('#rnIn', el).focus(); $('#rnIn', el).select(); }, 30);
  }

  function showSearch(q) {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    const hits = allNodes(hub().root).filter(n => n.kind === 'note').map(n => { const hay = (n.title + ' ' + n.text).toLowerCase(); const s = terms.reduce((a, t) => a + (hay.includes(t) ? 1 : 0), 0); return { n, s }; }).filter(x => x.s >= Math.min(1, terms.length)).sort((a, b) => b.s - a.s).slice(0, 40);
    $('#nhMain').innerHTML = `<div class="panel-head"><div><h3>⌕ “${esc(q)}”</h3><p>${hits.length} matching note(s) — whole library searched</p></div><button class="textbtn" id="neBack">← Back to note</button></div>
      ${hits.length ? hits.map(({ n }) => `<button class="v4-row" data-opennote="${n.id}"><span class="ic">🗒</span><span class="t"><b>${esc(n.title)}</b> — ${esc(String(n.text).replace(/\s+/g, ' ').slice(0, 120))}…</span></button>`).join('') : '<div class="empty-mini"><b>No matches</b></div>'}`;
    $('#neBack').onclick = () => render();
    $$('[data-opennote]').forEach(b => b.onclick = () => { openNote = b.dataset.opennote; path = pathOf(openNote); render(); });
  }

  function wireEditor(n) {
    const status = m => { const e = $('#neStatus'); if (e) e.innerHTML = m; };
    $('#neSave').onclick = () => { n.text = $('#neText').value; n.updated = Date.now(); persist(); status('Saved ✓'); };
    $('#neRename').onclick = () => renameNode(n.id);
    $('#neDel').onclick = async () => { if (await confirmBox('Delete note?', `“${n.title}” will be permanently deleted.`, 'Delete', true)) { const l = parentListOf(n.id); if (l) l.splice(l.findIndex(x => x.id === n.id), 1); openNote = null; persist(); render(); } };
    $('#neExport').onclick = async () => { const r = await C.saveFile(C.slug(n.title) + '.txt', `${n.title}\n\n${$('#neText').value}`, 'text/plain'); toast(`TXT saved (${r.where}) ✓`); };
    $('#nePdf').onclick = async () => {
      const f = await C.pickFile('.pdf,application/pdf'); if (!f) return;
      status('Reading PDF on device…');
      try {
        const pdf = await C.getPdfEngines();
        const pages = await pdf.extractPages(f);
        if (!pages.some(p => p.items.length)) return status('<span class="red-text">✕ This PDF is scanned (no text layer).</span>');
        const text = pdf.genericText(pages);
        const box = $('#neText'); box.value = (box.value ? box.value + '\n\n' : '') + `── ${f.name} ──\n` + text.slice(0, 90000);
        status(`PDF text added (${text.length.toLocaleString()} characters) ✓ — press Save note to keep it`);
      } catch (e) { status(`<span class="red-text">✕ ${esc(e.message)}</span>`); }
    };
    const aiTool = async (kind) => {
      const text = $('#neText').value.trim();
      if (!text) return toast('Write or paste something first');
      if (!C.AI.aiReady()) { toast('Add an AI key (or sign in) in Settings first'); return C.setTab('settings'); }
      const acts = {
        summ: ['Summarize', 'Summarise the following notes into crisp exam-ready points. Keep every fact, number and name. Use short bullets.', 'Summarizing…'],
        expand: ['Expand', 'Expand and complete these notes for deep exam preparation. Add missing context, related facts, examples and possible question angles. Keep it factual.', 'Expanding…'],
        points: ['Key points', 'Extract the KEY POINTS from these notes as a numbered revision list — only high-yield facts worth memorising.', 'Extracting key points…'],
        simple: ['Explain simply', 'Explain the content of these notes in very simple language, as to a beginner, with one everyday analogy and a memory trick.', 'Simplifying…'],
      };
      const [label, task, busyMsg] = acts[kind];
      const out = $('#neAiOut'); out.innerHTML = `<div class="v4-ai-out"><div class="ai-loading"><i></i><i></i><i></i></div><div class="muted">${busyMsg}</div></div>`;
      status('');
      try {
        const r = await C.AI.aiCall(`${task}\n\nNOTES:\n"""\n${text.slice(0, 14000)}\n"""\n\nReply in ${C.db.settings.tutorLang || 'English'}. Use markdown headings and bullets.`, { json: false, maxTokens: 2200, temperature: 0.4, onStatus: m => status(esc(m)) });
        out.innerHTML = `<div class="v4-ai-out"><div class="eyebrow">✦ AI · ${label}</div>${C.md(r.text)}<div class="dialog-actions"><button class="secondary" id="neCopy">⎘ Copy</button><button class="primary" id="neAppend">＋ Append to note</button></div></div>`;
        $('#neCopy').onclick = async () => { try { await navigator.clipboard.writeText(r.text); toast('Copied'); } catch { toast('Copy not available'); } };
        $('#neAppend').onclick = () => { const box = $('#neText'); box.value = `${box.value.trim()}\n\n✦ AI ${label}:\n${r.text}`.trim() + '\n'; n.text = box.value; n.updated = Date.now(); persist(); toast('Appended to note ✓'); out.innerHTML = ''; };
      } catch (e) { out.innerHTML = ''; status(`<span class="red-text">✕ ${esc(e.message)}</span>`); }
    };
    $('#neSumm').onclick = () => aiTool('summ');
    $('#neExpand').onclick = () => aiTool('expand');
    $('#nePoints').onclick = () => aiTool('points');
    $('#neSimple').onclick = () => aiTool('simple');
  }

  function aiNoteDialog() {
    if (!C.AI.aiReady()) { toast('Add an AI key (or sign in) in Settings first'); return C.setTab('settings'); }
    const { el, close } = modal(`<div class="eyebrow">✦ AI NOTE</div><h2>Let AI research &amp; write a note</h2><p>Describe the topic. AI writes structured, exam-ready notes and saves them in the current subsection.</p>
      <label>Topic<input id="anTopic" placeholder="e.g. Fundamental Duties — Article 51A, all 11 duties with examples"/></label>
      <label>Detail level<select id="anDepth"><option value="concise">Concise revision note</option><option value="standard" selected>Standard study note</option><option value="deep">Deep-dive (detailed)</option></select></label>
      <div class="muted" id="anStatus"></div><div id="anOut"></div>
      <div class="dialog-actions"><button class="secondary" id="anGo">✦ Write note</button></div>`, { wide: true });
    $('#anGo', el).onclick = async () => {
      const topic = $('#anTopic', el).value.trim(); if (topic.length < 4) return toast('Type the topic first');
      const depth = $('#anDepth', el).value;
      const b = $('#anGo', el); b.disabled = true; $('#anStatus', el).textContent = 'AI is writing…';
      try {
        const r = await C.AI.aiCall(`Write ${depth === 'concise' ? 'a concise revision note' : depth === 'deep' ? 'a detailed deep-dive study note' : 'a well-structured study note'} on: "${topic}".\nAudience: UPSC / competitive-exam student. Be factually accurate; do not invent facts, dates or article numbers. Use markdown headings, bullets and small tables where helpful. End with a "Quick recall" box of 5 one-line facts.`, { json: false, maxTokens: 3200, temperature: 0.5, onStatus: m => $('#anStatus', el).textContent = m });
        $('#anOut', el).innerHTML = `<div class="v4-ai-out">${C.md(r.text)}</div>`;
        const acts = `<div class="dialog-actions"><button class="secondary" id="anCopy">⎘ Copy</button><button class="primary" id="anSave">＋ Save as note</button></div>`;
        $('#anOut', el).insertAdjacentHTML('beforeend', acts);
        $('#anStatus', el).textContent = `Answered by ${C.AI.modelLabel(r.provider, r.model)}`;
        $('#anCopy', el).onclick = async () => { try { await navigator.clipboard.writeText(r.text); toast('Copied'); } catch { toast('Copy not available'); } };
        $('#anSave', el).onclick = () => { const n = mkNote(topic.slice(0, 80), r.text, 'ai'); curFolder().push(n); openNote = n.id; persist(); close(); render(); toast('AI note saved ✓'); };
      } catch (e) { $('#anStatus', el).innerHTML = `<span class="red-text">✕ ${esc(e.message)}</span>`; }
      finally { b.disabled = false; }
    };
    setTimeout(() => $('#anTopic', el)?.focus(), 30);
  }

  render();
}
