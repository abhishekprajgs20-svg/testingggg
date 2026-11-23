// QUIZINOX v4.0 — PERSONAL KNOWLEDGE VAULT
// A searchable personal library for important facts, explanations, notes, screenshots and
// difficult concepts. Extra powers: AI ask-about-an-item, AI auto-tagging, clipboard image
// capture, category filters, one-tap export. All data stays on this device (IndexedDB).
export default function vaultPage(C) {
  const { $, $$, esc, toast, modal, confirmBox } = C;
  const store = () => { const d = C.db; if (!d.vault || typeof d.vault !== 'object') d.vault = { items: [] }; if (!Array.isArray(d.vault.items)) d.vault.items = []; return d.vault; };
  const persist = () => C.save();
  let q = '', cat = '', viewId = null;

  const CATS = ['Fact', 'Concept', 'Note', 'Screenshot', 'Difficult', 'Other'];
  const catIcon = c => ({ Fact: '⚡', Concept: '🧠', Note: '🗒', Screenshot: '🖼', Difficult: '⚠', Other: '📌' }[c] || '📌');

  // --- image helpers ---
  const fileToDataUrl = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
  function shrink(dataUrl, maxW = 1400) {
    return new Promise(res => {
      const img = new Image();
      img.onload = () => {
        if (img.width <= maxW) return res(dataUrl);
        const c = document.createElement('canvas'); const k = maxW / img.width;
        c.width = maxW; c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => res(dataUrl); img.src = dataUrl;
    });
  }
  const pickImage = () => C.pickFile('image/*').then(async f => f ? shrink(await fileToDataUrl(f)) : null);

  function render() {
    const items = store().items;
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    const cats = [...new Set(items.map(i => i.cat))];
    let list = items.slice().sort((a, b) => b.created - a.created);
    if (cat) list = list.filter(i => i.cat === cat);
    if (terms.length) list = list.map(i => { const hay = `${i.title} ${i.text} ${(i.tags || []).join(' ')}`.toLowerCase(); return { i, s: terms.reduce((a, t) => a + (hay.includes(t) ? 1 : 0), 0) }; }).filter(x => x.s > 0).sort((a, b) => b.s - a.s).map(x => x.i);
    const item = viewId ? items.find(i => i.id === viewId) : null;
    if (viewId && !item) viewId = null;

    C.view.innerHTML = `
    <div class="page-title"><div><div class="eyebrow">YOUR SECOND BRAIN</div><h1>Knowledge Vault</h1><p>Save important facts, explanations, notes, screenshots and difficult concepts — then find anything in one search. Everything stays on this device.</p></div>
    <div class="title-actions row"><button class="secondary" id="vShot">🖼 Screenshot</button><button class="secondary" id="vNew">＋ Save item</button></div></div>
    <div class="panel"><div class="v4-toolbar" style="margin:0">
      <input id="vSearch" placeholder="⌕ Search title, text, tags…" value="${esc(q)}" style="flex:1;min-width:200px"/>
      <select id="vCat"><option value="">All categories (${items.length})</option>${catIcon && CATS.map(c => `<option ${cat === c ? 'selected' : ''}>${c} (${items.filter(i => i.cat === c).length})</option>`).join('')}${cats.filter(c => !CATS.includes(c)).map(c => `<option ${cat === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
    </div></div>
    ${viewId && item ? itemHtml(item) : gridHtml(list, items.length)}`;
    wire(list);
  }

  const gridHtml = (list, total) => `
    ${list.length ? `<div class="v4-grid">${list.map(i => `
      <button class="v4-card" data-vid="${i.id}">${i.img ? `<img src="${i.img}" alt="" loading="lazy"/>` : ''}
        <span class="pill">${catIcon(i.cat)} ${esc(i.cat)}</span>
        <b>${esc(i.title)}</b>
        <small>${esc(String(i.text || '').replace(/\s+/g, ' ').slice(0, 110))}${String(i.text || '').length > 110 ? '…' : ''}</small>
        <div class="v4-tags">${(i.tags || []).slice(0, 4).map(t => `<span class="v4-tag">#${esc(t)}</span>`).join('')}</div>
        <small>${new Date(i.created).toLocaleDateString()}</small>
      </button>`).join('')}</div>`
    : `<div class="v4-empty"><span class="big">🗄</span><b>${total ? 'Nothing matches' : 'Your vault is empty'}</b><small>${total ? 'Try other keywords or clear the category filter.' : 'Tap “＋ Save item” or “🖼 Screenshot” to capture your first knowledge.'}</small></div>`}`;

  const itemHtml = i => `
    <div class="panel" style="margin-top:14px">
      <div class="panel-head"><div><h3>${catIcon(i.cat)} ${esc(i.title)}</h3><p>${esc(i.cat)} · saved ${new Date(i.created).toLocaleString()}${i.src === 'ai' ? ' · ✦ AI-tagged' : ''}</p></div>
      <div class="title-actions row"><button class="secondary" id="viBack">← All items</button><button class="textbtn danger-text" id="viDel">Delete</button></div></div>
      ${i.img ? `<img src="${i.img}" alt="" style="max-width:100%;border-radius:12px;margin-bottom:12px"/>` : ''}
      ${i.text ? `<div class="ai-answer" style="white-space:pre-wrap">${esc(i.text)}</div>` : ''}
      <div class="v4-tags">${(i.tags || []).map(t => `<span class="v4-tag">#${esc(t)}</span>`).join('') || '<small class="muted">No tags</small>'}</div>
      <div class="v4-toolbar">
        <button class="secondary" id="viAsk">✦ Ask AI about this</button>
        <button class="secondary" id="viQuiz">✦ Quiz me from this</button>
        <button class="secondary" id="viExport">⇩ Export</button>
      </div>
      <div class="v4-status" id="viStatus"></div><div id="viOut"></div>
    </div>`;

  function wire() {
    $('#vSearch').oninput = e => { q = e.target.value; viewId = null; render(); setTimeout(() => { const s = $('#vSearch'); s.focus(); s.setSelectionRange(s.value.length, s.value.length); }, 0); };
    $('#vCat').onchange = e => { cat = e.target.value; viewId = null; render(); };
    $('#vNew').onclick = () => editDialog(null);
    $('#vShot').onclick = async () => {
      const img = await pickImage(); if (!img) return;
      editDialog(null, { img });
    };
    $$('[data-vid]').forEach(b => b.onclick = () => { viewId = b.dataset.vid; render(); window.scrollTo(0, 0); });
    if (viewId) wireItem(store().items.find(i => i.id === viewId));
  }

  function wireItem(i) {
    if (!i) return;
    const status = m => { const e = $('#viStatus'); if (e) e.innerHTML = m; };
    $('#viBack').onclick = () => { viewId = null; render(); };
    $('#viDel').onclick = async () => { if (await confirmBox('Delete item?', `“${i.title}” will be removed from the vault.`, 'Delete', true)) { store().items = store().items.filter(x => x.id !== i.id); viewId = null; persist(); render(); } };
    $('#viExport').onclick = async () => {
      const body = `${i.title}\n${'='.repeat(i.title.length)}\nCategory: ${i.cat}\nTags: ${(i.tags || []).join(', ')}\nSaved: ${new Date(i.created).toLocaleString()}\n\n${i.text || '(screenshot item)'}`;
      const r = await C.saveFile(C.slug(i.title) + '.txt', body, 'text/plain'); toast(`Exported (${r.where}) ✓`);
    };
    $('#viAsk').onclick = async () => {
      if (!C.AI.aiReady()) { toast('Add an AI key (or sign in) in Settings first'); return C.setTab('settings'); }
      status('<span class="muted">Asking AI…</span>');
      try {
        const r = await C.AI.aiCall(`You are an expert tutor. Explain, elaborate and give exam context for this saved knowledge item from a student's personal vault.\nTitle: ${i.title}\nCategory: ${i.cat}\nContent:\n"""\n${String(i.text || '(screenshot — describe what such an item usually contains and ask the student to type the key text if they want a specific explanation)').slice(0, 4000)}\n"""\n\nGive: (1) a clear explanation, (2) why it is important for exams, (3) 2-3 related facts, (4) a possible MCQ angle. Reply in ${C.db.settings.tutorLang || 'English'} with markdown.`, { json: false, maxTokens: 2000, temperature: 0.4, onStatus: m => status(esc(m)) });
        status(`Answered by ${C.AI.modelLabel(r.provider, r.model)}`);
        $('#viOut').innerHTML = `<div class="v4-ai-out">${C.md(r.text)}<div class="dialog-actions"><button class="secondary" id="viCp">⎘ Copy</button></div></div>`;
        $('#viCp').onclick = async () => { try { await navigator.clipboard.writeText(r.text); toast('Copied'); } catch { toast('Copy not available'); } };
      } catch (e) { status(`<span class="red-text">✕ ${esc(e.message)}</span>`); }
    };
    $('#viQuiz').onclick = async () => {
      if (!C.AI.aiReady()) { toast('Add an AI key (or sign in) in Settings first'); return C.setTab('settings'); }
      status('<span class="muted">AI is writing questions…</span>');
      try {
        const r = await C.AI.aiCall(`Create 5 exam-style MCQs from this content. Exactly 4 options each, ONE correct.\n"""\n${String(i.text || i.title).slice(0, 6000)}\n"""\nReturn ONLY JSON: {"questions":[{"question":"","options":["","","",""],"correct":"A","explanation":""}]}`, { json: true, maxTokens: 2600, temperature: 0.6 });
        const obj = C.AI.parseJsonLoose(r.text);
        const qs = C.parseJSON(JSON.stringify(obj));
        if (!qs.length) throw new Error('AI returned no usable questions');
        const qz = C.quizTemplate(`Vault: ${i.title.slice(0, 40)}`); qz.subject = 'Knowledge Vault'; qz.questions = qs;
        C.db.quizzes.unshift(qz); persist(); status('');
        toast(`${qs.length} questions saved as “${qz.title}” ✓`);
        C.chooseMode(qz.id);
      } catch (e) { status(`<span class="red-text">✕ ${esc(e.message)}</span>`); }
    };
  }

  function editDialog(item, preset = {}) {
    const isNew = !item;
    const it = item || { id: C.uid(), title: '', text: '', img: preset.img || '', cat: preset.img ? 'Screenshot' : 'Note', tags: [], created: Date.now(), src: 'manual' };
    const { el, close } = modal(`<div class="eyebrow">KNOWLEDGE VAULT</div><h2>${isNew ? 'Save to vault' : 'Edit item'}</h2>
      <div class="form-grid"><label>Title<input id="veTitle" value="${esc(it.title)}" placeholder="e.g. Article 21 — Protection of Life & Personal Liberty"/></label>
      <label>Category<select id="veCat">${CATS.map(c => `<option ${it.cat === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label></div>
      <label>Content (fact / explanation / note — paste anything)<textarea id="veText" rows="6" placeholder="Write or paste the fact, explanation or concept…">${esc(it.text)}</textarea></label>
      <div class="form-grid"><label>Tags (comma separated)<input id="veTags" value="${esc((it.tags || []).join(', '))}" placeholder="polity, fundamental rights, article 21"/></label>
      <div class="v4-imgbox" id="veShot"><span style="font-size:26px">${it.img ? '🖼' : '📷'}</span><b>${it.img ? 'Replace image' : 'Add screenshot / image'}</b><small>JPG/PNG — compressed & stored on device</small></div></div>
      ${it.img ? `<img src="${it.img}" style="max-width:100%;border-radius:10px;margin-top:10px" alt=""/>` : ''}
      <div class="muted" id="veStatus"></div>
      <div class="dialog-actions">${isNew ? '<button class="secondary" id="veAiTag">✦ AI tags</button>' : ''}<button class="primary" id="veSave">${isNew ? '＋ Save item' : 'Save changes'}</button></div>`, { wide: true });
    let img = it.img;
    $('#veShot', el).onclick = async () => { const d = await pickImage(); if (d) { img = d; toast('Image attached ✓ — save to keep it'); } };
    $('#veAiTag', el)?.addEventListener('click', async () => {
      const text = $('#veText', el).value.trim(), title = $('#veTitle', el).value.trim();
      if (!text && !title) return toast('Write something first');
      if (!C.AI.aiReady()) { toast('Add an AI key in Settings first'); return; }
      $('#veStatus', el).textContent = 'AI is tagging…';
      try {
        const r = await C.AI.aiCall(`Given this study item, return ONLY JSON: {"tags":["",""]}\nTitle: ${title}\nContent: ${String(text).slice(0, 3000)}\nGive 4-7 short lowercase tags (topics, subjects, keywords) for search.`, { json: true, maxTokens: 200, temperature: 0.2 });
        const tags = (C.AI.parseJsonLoose(r.text)?.tags || []).map(String).slice(0, 8);
        if (tags.length) { $('#veTags', el).value = tags.join(', '); $('#veStatus', el).textContent = 'Tags suggested ✓'; }
      } catch (e) { $('#veStatus', el).textContent = '✕ ' + e.message; }
    });
    $('#veSave', el).onclick = () => {
      const title = $('#veTitle', el).value.trim();
      if (!title && !$('#veText', el).value.trim() && !img) return toast('Add a title, text or an image');
      it.title = title || 'Untitled';
      it.text = $('#veText', el).value;
      it.cat = $('#veCat', el).value;
      it.tags = $('#veTags', el).value.split(',').map(t => t.trim().toLowerCase()).filter(Boolean).slice(0, 10);
      it.img = img;
      if (isNew) store().items.unshift(it);
      persist(); close(); viewId = it.id; render();
      toast(isNew ? 'Saved to your vault ✓' : 'Updated ✓');
    };
    setTimeout(() => $('#veTitle', el)?.focus(), 30);
  }

  render();
}
