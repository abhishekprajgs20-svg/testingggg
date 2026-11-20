// Spaced-repetition flashcards: decks, SM-2-style adjustable scheduler, import/export, AI generation, conversion. Works fully offline.
import { C, setC, esc, $, $$, sub, stats, persist, head, bar, chip, tabsHtml, ui, pct, uid, DAY, ask, hasAI, SYSTEM_UPSC, toast, empty, mdx, relatedNotes } from './core.js';
import { SYSTEM_PROMPT_JSON } from './flash-ai.js';

export const DEFAULT_DECKS = ['Polity Articles', 'Constitutional Amendments', 'History Dates', 'Historical Events', 'Geography Facts', 'Economy Definitions', 'Environment', 'Science and Technology', 'Important Personalities', 'International Relations', 'Current Affairs'];
const DEF_SET = { againMin: 10, hardDays: 2, easyDays: 7, easeStart: 2.5, masterDays: 21, newPerDay: 20 };
export const F = () => {
  const f = sub('flash', { decks: [], cards: [], settings: { ...DEF_SET } });
  f.settings = { ...DEF_SET, ...(f.settings || {}) };
  if (!f.decks.length) DEFAULT_DECKS.forEach(n => f.decks.push({ id: 'd-' + n.toLowerCase().replace(/[^a-z]+/g, '-'), name: n, builtin: true }));
  return f;
};
const deckById = id => F().decks.find(d => d.id === id);
/** Add cards to a deck by name (creates the deck if needed). Skips exact duplicates. Returns {added, skipped}. */
export function addCardsToDeck(deckName, items, src = 'manual') {
  const f = F(); let d = f.decks.find(x => x.name.toLowerCase() === deckName.toLowerCase());
  if (!d) { d = { id: 'd-' + uid().slice(0, 8), name: deckName }; f.decks.push(d); }
  const seen = new Set(f.cards.filter(c => c.deck === d.id).map(c => (c.front || '').trim().toLowerCase())); let added = 0, skipped = 0;
  for (const it of items) {
    const front = String(it.front || '').trim(), back = String(it.back || '').trim(); if (!front || !back) { skipped++; continue; }
    if (seen.has(front.toLowerCase())) { skipped++; continue; } seen.add(front.toLowerCase());
    f.cards.push({ id: uid(), deck: d.id, front, back, extra: String(it.extra || '').trim(), rel: String(it.rel || ''), upsc: String(it.upsc || ''), src, created: Date.now(), state: 'new', due: Date.now(), ivl: 0, ease: f.settings.easeStart, reps: 0, lapses: 0, last: 0, hist: [] }); added++;
  }
  persist(); return { added, skipped, deck: d };
}
export const stateOf = (c, now = Date.now()) => (c.state === 'new' ? 'new' : c.state === 'learning' ? 'learning' : c.ivl >= F().settings.masterDays ? 'mastered' : 'review');
/** Scheduler. Again → minutes; Hard/Easy → days that adapt to the card's ease and history. */
export function review(c, rating) {
  const s = F().settings, now = Date.now(); c.hist = [...(c.hist || []), [now, rating]].slice(-12); c.last = now; c.reps = (c.reps || 0) + 1;
  c.ease = c.ease || s.easeStart;
  if (rating === 'again') { c.lapses = (c.lapses || 0) + 1; c.ease = Math.max(1.3, c.ease - 0.2); c.ivl = 0; c.state = 'learning'; c.due = now + s.againMin * 60000; }
  else if (rating === 'hard') {
    c.ease = Math.max(1.3, c.ease - 0.15); c.ivl = c.state === 'review' && c.ivl >= 1 ? Math.max(s.hardDays, Math.round(c.ivl * 1.2)) : s.hardDays; c.state = 'review'; c.due = now + c.ivl * DAY;
  } else {
    c.ease = Math.min(3.0, c.ease + 0.1); const recentAgain = (c.hist || []).slice(-4).filter(h => h[1] === 'again').length;
    c.ivl = c.state === 'review' && c.ivl >= 1 ? Math.max(s.easyDays, Math.round(c.ivl * c.ease * 1.3 * (recentAgain ? 0.8 : 1))) : s.easyDays; c.state = 'review'; c.due = now + c.ivl * DAY;
  }
  return c;
}
const nextLabel = (c, r) => { const t = JSON.parse(JSON.stringify(c)); review(t, r); const ms = t.due - Date.now(); return ms < 3600000 ? `${Math.max(1, Math.round(ms / 60000))} min` : ms < DAY ? `${Math.round(ms / 3600000)} h` : `${Math.round(ms / DAY)} d`; };
function dueList(deckId) { const f = F(), now = Date.now(); let l = f.cards.filter(c => (!deckId || c.deck === deckId) && c.due <= now); const news = l.filter(c => c.state === 'new').slice(0, f.settings.newPerDay), old = l.filter(c => c.state !== 'new'); return [...old.sort((a, b) => a.due - b.due), ...news]; }
export function flashStats() {
  const f = F(), now = Date.now(); const c = f.cards; const by = { new: 0, learning: 0, review: 0, mastered: 0 }; c.forEach(x => by[stateOf(x)]++);
  const up = [0, 0, 0, 0, 0, 0, 0]; c.forEach(x => { if (x.state === 'new' || x.due <= now) return; const d = Math.floor((x.due - now) / DAY); if (d < 7) up[d]++; });
  return { total: c.length, ...by, due: c.filter(x => x.due <= now).length, up };
}
let tab = 'study', sess = null, deckSel = '';
export function page(ctx) {
  setC(ctx); const f = F(); const st = flashStats(); stats().flash = { due: st.due, total: st.total };
  const tabs = [['study', 'Study'], ['decks', 'Decks & cards'], ['stats', 'Analytics'], ['settings', 'Scheduler']];
  ui(head('FLASHCARDS', 'Spaced-repetition flashcards', `${st.total} cards · <b>${st.due}</b> due now · ${st.mastered} mastered. Active recall with a scheduler that adapts to your answers. Fully offline.`, `<button class="u-acc" data-go-study>▶ Study due cards (${st.due})</button><button class="secondary" data-newcard>＋ New card</button>`) + tabsHtml(tabs, tab) + (tab === 'study' ? studyHtml() : tab === 'decks' ? decksHtml() : tab === 'stats' ? statsHtml() : settingsHtml()));
  $$('[data-t]').forEach(b => b.onclick = () => { tab = b.dataset.t; sess = null; page(C); });
  const gs = $('[data-go-study]'); if (gs) gs.onclick = () => { tab = 'study'; startSession(''); };
  $('[data-newcard]').onclick = () => editCard();
  if (tab === 'study') wireStudy(); else if (tab === 'decks') wireDecks(); else if (tab === 'settings') wireSettings();
}
/* ---------- study ---------- */
function studyHtml() {
  if (sess) return sessHtml();
  const f = F(); const rows = f.decks.map(d => { const n = f.cards.filter(c => c.deck === d.id).length, due = f.cards.filter(c => c.deck === d.id && c.due <= Date.now()).length; return `<button class="u-card" data-study="${d.id}"><b>${esc(d.name)}</b><small>${n} cards</small><div style="margin-top:6px">${due ? chip(due + ' due', 'p') : chip(n ? 'All caught up' : 'Empty', n ? 'g' : '')}</div></button>`; }).join('');
  return `<div class="u-glass"><h3>Choose a deck to study</h3><p>Cards are shown one at a time: think of the answer first, then flip.</p><div class="u-grid"><button class="u-card" data-study=""><b>All decks</b><small>${flashStats().due} due</small></button>${rows}</div></div>`;
}
function startSession(deck) { const q = dueList(deck); if (!q.length) { toast('Nothing due in this deck 🎉'); sess = null; return page(C); } sess = { deck, q, i: 0, flipped: false, done: 0, rated: { again: 0, hard: 0, easy: 0 } }; page(C); }
function sessHtml() {
  if (sess.i >= sess.q.length) return `<div class="u-glass u-empty"><div style="font-size:34px">🎉</div><b>Session complete</b><p>${sess.done} cards reviewed — Again ${sess.rated.again} · Hard ${sess.rated.hard} · Easy ${sess.rated.easy}</p><button class="u-acc" data-end>Back to decks</button></div>`;
  const c = sess.q[sess.i], d = deckById(c.deck);
  return `<div class="u-glass"><div class="u-row sp"><small>${esc(d?.name || '')} · card ${sess.i + 1} of ${sess.q.length}</small><button class="textbtn" data-end>End session</button></div>${bar(sess.i / sess.q.length * 100)}
  <div class="fc-stage"><div class="fc-card ${sess.flipped ? 'flip' : ''}" id="fcCard" tabindex="0" role="button" aria-label="Flip card"><div class="fc-face fc-front"><div class="fc-q">${esc(c.front).replace(/\n/g, '<br>')}</div><div class="fc-hint">Tap or press Space to show the answer</div></div><div class="fc-face fc-back"><div class="fc-a">${esc(c.back).replace(/\n/g, '<br>')}</div>${c.extra ? `<div class="fc-x">${esc(c.extra)}</div>` : ''}${c.rel ? `<div class="fc-x"><b>Related:</b> ${esc(c.rel)}</div>` : ''}${c.upsc ? `<div class="fc-x"><b>UPSC relevance:</b> ${esc(c.upsc)}</div>` : ''}</div></div></div>
  ${sess.flipped ? `<div class="fc-rate"><button class="fc-again" data-r="again">Again<small>${nextLabel(c, 'again')}</small></button><button class="fc-hard" data-r="hard">Hard<small>${nextLabel(c, 'hard')}</small></button><button class="fc-easy" data-r="easy">Easy<small>${nextLabel(c, 'easy')}</small></button></div><div class="u-sub" style="text-align:center;margin-top:8px">Keys: 1 Again · 2 Hard · 3 Easy</div>` : `<div style="text-align:center;margin-top:14px"><button class="u-acc" id="fcShow">Show answer</button></div>`}</div>`;
}
function onKey(e) { if (tab !== 'study' || !sess || sess.i >= sess.q.length || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; if (!document.getElementById('fcCard')) { document.removeEventListener('keydown', onKey); return; } if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); flip(); } else if (sess.flipped) { const r = { 1: 'again', 2: 'hard', 3: 'easy' }[e.key]; if (r) rate(r); } }
function flip() { if (!sess || sess.flipped) return; sess.flipped = true; const el = $('#fcCard'); if (el) { el.classList.add('flip'); setTimeout(() => page(C), 520); } else page(C); }
function rate(r) { const c = sess.q[sess.i]; review(c, r); sess.rated[r]++; sess.done++; if (r === 'again') { const clone = c; sess.q.push(clone); } sess.i++; sess.flipped = false; persist(); page(C); }
function wireStudy() {
  $$('[data-study]').forEach(b => b.onclick = () => startSession(b.dataset.study));
  $$('[data-end]').forEach(b => b.onclick = () => { sess = null; page(C); });
  if (sess) { const el = $('#fcCard'); if (el) el.onclick = flip; const sh = $('#fcShow'); if (sh) sh.onclick = flip; $$('[data-r]').forEach(b => b.onclick = () => rate(b.dataset.r)); document.removeEventListener('keydown', onKey); document.addEventListener('keydown', onKey); }
}
/* ---------- decks & cards ---------- */
function decksHtml() {
  const f = F(); const dsel = deckSel && deckById(deckSel) ? deckSel : f.decks[0]?.id; deckSel = dsel; const cards = f.cards.filter(c => c.deck === dsel);
  return `<div class="u-glass"><div class="u-row sp"><h3>Decks</h3><div class="u-row"><button class="secondary" id="dNew">＋ New deck</button><button class="secondary" id="dImp">⇪ Import TXT / JSON</button><button class="secondary" id="dExp">⇩ Export deck</button></div></div>
  <div class="u-tabs">${f.decks.map(d => `<button data-ds="${d.id}" class="${d.id === dsel ? 'on' : ''}">${esc(d.name)} (${f.cards.filter(c => c.deck === d.id).length})</button>`).join('')}</div>
  <div class="u-row" style="margin:8px 0"><button class="u-acc" id="cNew">＋ New card</button><button class="secondary" id="cAI">✦ Generate with AI</button><button class="secondary" id="cStarter">📦 Add starter cards</button><button class="secondary" id="dRen">Rename</button><button class="secondary" id="dDel">Delete deck</button></div>
  ${cards.length ? cards.map(c => `<div class="u-card" style="margin:7px 0"><div class="u-row sp"><b>${esc(c.front).slice(0, 160)}</b><span>${chip(stateOf(c), stateOf(c) === 'mastered' ? 'g' : stateOf(c) === 'new' ? '' : 'p')}</span></div><div class="u-sub">${esc(c.back).slice(0, 220)}</div><div class="u-row"><small class="u-sub">${c.state === 'new' ? 'New' : 'Next review ' + new Date(c.due).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}${c.lapses ? ' · lapses ' + c.lapses : ''}${c.src && c.src !== 'manual' ? ' · from ' + c.src : ''}</small><button class="textbtn" data-ce="${c.id}">Edit</button><button class="textbtn" data-cd="${c.id}" style="color:#ff9eac">Delete</button></div></div>`).join('') : empty('🃏', 'No cards in this deck', 'Create cards, import a file, generate with AI, or add the starter cards.')}</div>`;
}
function wireDecks() {
  $$('[data-ds]').forEach(b => b.onclick = () => { deckSel = b.dataset.ds; page(C); });
  $('#dNew').onclick = () => prompt2('New deck', 'Deck name', '', v => { const f = F(); f.decks.push({ id: 'd-' + uid().slice(0, 8), name: v }); deckSel = f.decks[f.decks.length - 1].id; persist(); page(C); });
  $('#dRen').onclick = () => { const d = deckById(deckSel); prompt2('Rename deck', 'Deck name', d.name, v => { d.name = v; persist(); page(C); }); };
  $('#dDel').onclick = async () => { const d = deckById(deckSel), n = F().cards.filter(c => c.deck === d.id).length; if (await C.confirmBox('Delete deck?', `“${d.name}” and its ${n} cards will be removed. Your notes and quizzes are not affected.`, 'Delete', true)) { const f = F(); f.cards = f.cards.filter(c => c.deck !== d.id); f.decks = f.decks.filter(x => x.id !== d.id); deckSel = ''; persist(); page(C); } };
  $('#cNew').onclick = () => editCard(); $('#cAI').onclick = aiGen; $('#dImp').onclick = importFile; $('#dExp').onclick = exportDeck; $('#cStarter').onclick = starter;
  $$('[data-ce]').forEach(b => b.onclick = () => editCard(F().cards.find(c => c.id === b.dataset.ce)));
  $$('[data-cd]').forEach(b => b.onclick = () => { const f = F(); f.cards = f.cards.filter(c => c.id !== b.dataset.cd); persist(); page(C); });
}
function prompt2(title, label, val, ok) { const { el, close } = C.modal(`<h2>${esc(title)}</h2><label class="u-sub">${esc(label)}</label><input class="u-in" id="pv" value="${esc(val)}"/><div class="dialog-actions"><button class="secondary" data-c>Cancel</button><button class="primary" data-o>OK</button></div>`); $('[data-c]', el).onclick = close; $('[data-o]', el).onclick = () => { const v = $('#pv', el).value.trim(); if (v) { close(); ok(v); } }; $('#pv', el).focus(); }
export function editCard(card = null, preset = {}) {
  const f = F(); const c = card || { deck: deckSel || preset.deck || f.decks[0].id, front: preset.front || '', back: preset.back || '', extra: preset.extra || '', rel: preset.rel || '', upsc: preset.upsc || '' };
  const { el, close } = C.modal(`<div class="eyebrow">FLASHCARD</div><h2>${card ? 'Edit card' : 'New card'}</h2>
   <label class="u-sub">Deck</label><select class="u-in" id="fd">${f.decks.map(d => `<option value="${d.id}" ${d.id === c.deck ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select>
   <label class="u-sub">Front — question / keyword / concept / date / article</label><textarea class="u-in" id="ff">${esc(c.front)}</textarea>
   <label class="u-sub">Back — answer</label><textarea class="u-in" id="fb">${esc(c.back)}</textarea>
   <label class="u-sub">Detailed explanation / additional facts (optional)</label><textarea class="u-in" id="fx">${esc(c.extra || '')}</textarea>
   <div class="u-form"><label>Related information<input class="u-in" id="fr" value="${esc(c.rel || '')}"/></label><label>UPSC relevance<input class="u-in" id="fu" value="${esc(c.upsc || '')}"/></label></div>
   <div class="dialog-actions"><button class="secondary" data-c>Cancel</button><button class="primary" data-s>Save card</button></div>`, { wide: true });
  $('[data-c]', el).onclick = close;
  $('[data-s]', el).onclick = () => { const front = $('#ff', el).value.trim(), back = $('#fb', el).value.trim(); if (!front || !back) return toast('Front and back are both needed'); if (card) Object.assign(card, { deck: $('#fd', el).value, front, back, extra: $('#fx', el).value.trim(), rel: $('#fr', el).value.trim(), upsc: $('#fu', el).value.trim() }); else { const d = F().decks.find(x => x.id === $('#fd', el).value); addCardsToDeck(d.name, [{ front, back, extra: $('#fx', el).value, rel: $('#fr', el).value, upsc: $('#fu', el).value }]); } persist(); close(); if (C.db.activeTab === 'flash') page(C); toast('Card saved ✓'); };
}
function parseTxt(t) {
  // Accepts "front :: back", "front | back", "Q: ... / A: ..." blocks and tab-separated lines.
  const out = []; const lines = t.replace(/\r/g, '').split('\n');
  const blocks = t.split(/\n\s*\n/); let qa = 0; for (const b of blocks) { const m = b.match(/^\s*(?:Q|Question)\s*[:.)-]\s*([\s\S]+?)\n\s*(?:A|Answer)\s*[:.)-]\s*([\s\S]+)$/i); if (m) { out.push({ front: m[1].trim(), back: m[2].trim() }); qa++; } }
  if (qa) return out;
  for (const l of lines) { const m = l.split(/\s*(?:::|\t|\|)\s*/); if (m.length >= 2 && m[0].trim() && m[1].trim()) out.push({ front: m[0].trim(), back: m[1].trim(), extra: m.slice(2).join(' | ').trim() }); }
  return out;
}
function importFile() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.txt,.json,text/plain,application/json';
  inp.onchange = async () => { const file = inp.files[0]; if (!file) return; try {
    const text = await file.text(); let items = [], deckName = null;
    if (/\.json$/i.test(file.name) || /^\s*[\[{]/.test(text)) { const j = JSON.parse(text); const arr = Array.isArray(j) ? j : j.cards || j.flashcards || []; deckName = j.deck || j.name || null; items = arr.map(x => ({ front: x.front || x.question || x.q || x.term, back: x.back || x.answer || x.a || x.definition, extra: x.extra || x.explanation || '', rel: x.related || x.rel || '', upsc: x.upsc || '' })); }
    else items = parseTxt(text);
    if (!items.length) return toast('No cards found. Use "front :: back" per line, or JSON [{front, back}].');
    const d = deckById(deckSel) || F().decks[0]; const r = addCardsToDeck(deckName || d.name, items, 'import'); deckSel = r.deck.id; page(C); toast(`Imported ${r.added} cards${r.skipped ? ` (${r.skipped} duplicates/invalid skipped)` : ''} ✓`);
  } catch (e) { toast('Import failed: ' + e.message); } };
  inp.click();
}
function exportDeck() { const d = deckById(deckSel); const cards = F().cards.filter(c => c.deck === d.id).map(({ front, back, extra, rel, upsc }) => ({ front, back, extra, related: rel, upsc })); C.saveFile(`flashcards-${C.slug(d.name)}.json`, JSON.stringify({ deck: d.name, cards }, null, 2), 'application/json').then(r => toast(`Exported (${r.where}) ✓`)); }
async function aiGen() {
  if (!hasAI()) { toast('Add an AI key (or sign in) in Settings first'); return C.setTab('settings'); }
  const d = deckById(deckSel);
  const { el, close } = C.modal(`<div class="eyebrow">AI · ONLINE</div><h2>Generate flashcards</h2><p>Deck: <b>${esc(d.name)}</b>. Review the cards before saving — AI can make mistakes; verify important facts.</p><label class="u-sub">Topic or pasted study text</label><textarea class="u-in" id="gt" placeholder="e.g. Fundamental Rights — Articles 14 to 18"></textarea><div class="u-form"><label>Cards<select class="u-in" id="gn">${[5, 10, 15, 20].map(n => `<option>${n}</option>`).join('')}</select></label></div><div id="gs" class="u-sub"></div><div id="gp"></div><div class="dialog-actions"><button class="secondary" data-c>Close</button><button class="primary" id="gg">✦ Generate</button><button class="primary" id="gk" hidden>Save selected</button></div>`, { wide: true });
  let got = []; $('[data-c]', el).onclick = close;
  $('#gg', el).onclick = async () => { const t = $('#gt', el).value.trim(); if (t.length < 4) return toast('Enter a topic or paste some text'); const b = $('#gg', el); b.disabled = true; $('#gs', el).textContent = 'Asking AI…';
    try { const r = await ask(`${SYSTEM_PROMPT_JSON(Number($('#gn', el).value), d.name)}\n\nTOPIC / SOURCE TEXT:\n${t.slice(0, 9000)}`, { json: true, system: SYSTEM_UPSC, maxTokens: 3500, onStatus: m => { $('#gs', el).textContent = m; } });
      const j = C.AI.parseJsonLoose(r.text); const arr = Array.isArray(j) ? j : j.cards || []; got = arr.filter(x => x && x.front && x.back);
      if (!got.length) throw new Error('The AI reply had no usable cards. Try again or shorten the text.');
      $('#gs', el).textContent = `${got.length} cards generated by ${C.AI.providerName(r.provider)} — untick any you do not want.`; $('#gp', el).innerHTML = got.map((x, i) => `<label class="u-task"><input type="checkbox" checked data-gi="${i}"/><span><b>${esc(x.front)}</b><br>${esc(x.back)}</span></label>`).join(''); $('#gk', el).hidden = false;
    } catch (e) { $('#gs', el).innerHTML = `<span class="red-text">✕ ${esc(e.message)}</span>`; } finally { b.disabled = false; } };
  $('#gk', el).onclick = () => { const sel = got.filter((_, i) => $(`[data-gi="${i}"]`, el)?.checked); const r = addCardsToDeck(d.name, sel, 'AI'); close(); page(C); toast(`Saved ${r.added} cards ✓`); };
}
const STARTER = {
  'History Dates': [['1757', 'Battle of Plassey — the East India Company defeated Siraj-ud-Daulah'], ['1764', 'Battle of Buxar'], ['1857', 'Revolt of 1857 (First War of Independence)'], ['1885', 'Foundation of the Indian National Congress'], ['1905', 'Partition of Bengal (Curzon)'], ['1919', 'Jallianwala Bagh massacre; Government of India Act 1919'], ['1930', 'Dandi March / Civil Disobedience Movement'], ['1942', 'Quit India Movement'], ['1947', 'Independence and Partition of India'], ['1950', 'Constitution of India came into force on 26 January']].map(([a, b]) => ({ front: `What happened in ${a}?`, back: b })),
  'Economy Definitions': [['GDP', 'Gross Domestic Product — market value of all final goods and services produced within a country in a year'], ['Fiscal deficit', 'Total expenditure minus total receipts excluding borrowings'], ['Repo rate', 'Rate at which the RBI lends short-term funds to commercial banks'], ['CRR', 'Cash Reserve Ratio — share of deposits banks must keep with the RBI'], ['SLR', 'Statutory Liquidity Ratio — share of deposits banks must hold in liquid assets'], ['Inflation', 'Sustained rise in the general price level'], ['MSP', 'Minimum Support Price — price at which the government buys specified crops']].map(([a, b]) => ({ front: `Define: ${a}`, back: b })),
  'Important Personalities': [['Who wrote the Arthashastra?', 'Kautilya (Chanakya)'], ['Who founded the Brahmo Samaj (1828)?', 'Raja Ram Mohan Roy'], ['Who founded the Arya Samaj (1875)?', 'Swami Dayananda Saraswati'], ['Who is known as the father of the Indian Constitution?', 'B. R. Ambedkar (Chairman of the Drafting Committee)'], ['Who was the first President of independent India?', 'Dr Rajendra Prasad'], ['Who was the Chairman of the Constituent Assembly?', 'Dr Rajendra Prasad (President); Dr Sachchidananda Sinha was the interim President']].map(([a, b]) => ({ front: a, back: b })),
  'International Relations': [['Headquarters of the United Nations', 'New York'], ['Headquarters of the WTO', 'Geneva'], ['Headquarters of the IMF', 'Washington, D.C.'], ['Headquarters of the ASEAN secretariat', 'Jakarta'], ['QUAD members', 'India, USA, Japan and Australia']].map(([a, b]) => ({ front: a, back: b })),
  'Science and Technology': [['ISRO headquarters', 'Bengaluru'], ['First Indian satellite (1975)', 'Aryabhata'], ['Chandrayaan-3 achievement (2023)', 'Soft landing near the lunar south pole region'], ['Full form of CRISPR', 'Clustered Regularly Interspaced Short Palindromic Repeats — gene-editing tool']].map(([a, b]) => ({ front: a, back: b })),
};
async function starter() {
  const { CATS } = await import('./data-mem.js'); const d = deckById(deckSel); const map = { 'Polity Articles': 'art', 'Constitutional Amendments': 'amend', 'Geography Facts': ['river', 'range', 'pass', 'dam'], Environment: ['np', 'ramsar', 'tr', 'br'] };
  const m = map[d.name]; let items = [];
  if (m) (Array.isArray(m) ? m : [m]).forEach(id => { const cat = CATS.find(c => c.id === id); cat.rows.slice(0, 40).forEach(r => { const k = cat.card(r); items.push({ front: k.front, back: k.back, extra: k.extra, rel: k.rel || '' }); }); });
  else if (STARTER[d.name]) items = STARTER[d.name];
  if (!items.length) return toast('No starter pack for this deck — create cards, import a file or use AI.');
  const r = addCardsToDeck(d.name, items, 'starter'); page(C); toast(`Added ${r.added} starter cards${r.skipped ? ` (${r.skipped} already present)` : ''} ✓`);
}
/* ---------- analytics & settings ---------- */
function statsHtml() {
  const f = F(), s = flashStats(); const days = ['Today', '+1', '+2', '+3', '+4', '+5', '+6']; const max = Math.max(1, ...s.up);
  const rows = f.decks.map(d => { const cs = f.cards.filter(c => c.deck === d.id); if (!cs.length) return ''; const rev = cs.flatMap(c => c.hist || []); const good = rev.filter(h => h[1] !== 'again').length; return `<div class="u-card" style="margin:6px 0"><div class="u-row sp"><b>${esc(d.name)}</b><span>${cs.length} cards · ${cs.filter(c => c.due <= Date.now()).length} due</span></div>${bar(pct(cs.filter(c => stateOf(c) === 'mastered').length, cs.length), 'g')}<small>${cs.filter(c => stateOf(c) === 'mastered').length} mastered · recall ${rev.length ? pct(good, rev.length) + '% (' + rev.length + ' reviews)' : 'no reviews yet'}</small></div>`; }).join('');
  const leech = f.cards.filter(c => (c.lapses || 0) >= 4);
  return `<div class="u-glass"><h3>Overview</h3><div class="u-stat"><div><small>TOTAL</small><strong>${s.total}</strong></div><div><small>NEW</small><strong>${s.new}</strong></div><div><small>DUE</small><strong style="color:#f6cd7d">${s.due}</strong></div><div><small>LEARNING</small><strong>${s.learning}</strong></div><div><small>MASTERED</small><strong style="color:#8bebc4">${s.mastered}</strong></div></div></div>
  <div class="u-glass"><h3>Upcoming reviews (next 7 days)</h3><div class="bars">${s.up.map((n, i) => `<div><small>${n}</small><i style="height:${Math.max(3, n / max * 100)}%"></i><small>${days[i]}</small></div>`).join('')}</div></div>
  <div class="u-glass"><h3>Deck-wise performance</h3>${rows || '<div class="u-sub">Study some cards to see performance.</div>'}${leech.length ? `<div class="u-sub" style="margin-top:10px">⚠ ${leech.length} difficult card(s) (4+ lapses) — consider rewriting them: ${leech.slice(0, 3).map(c => esc(c.front.slice(0, 40))).join(' · ')}</div>` : ''}</div>`;
}
function settingsHtml() {
  const s = F().settings; return `<div class="u-glass"><h3>Scheduler settings</h3><p>Initial intervals for the three buttons. After the first review, intervals adapt to each card's ease and your response history (SM-2 style): Easy grows the interval, Hard keeps it short, Again resets to minutes.</p><div class="u-form"><label>Again (minutes)<input class="u-in" type="number" min="1" max="1440" id="sA" value="${s.againMin}"/></label><label>Hard (days)<input class="u-in" type="number" min="1" max="60" id="sH" value="${s.hardDays}"/></label><label>Easy (days)<input class="u-in" type="number" min="1" max="365" id="sE" value="${s.easyDays}"/></label><label>Mastered after (days)<input class="u-in" type="number" min="7" max="365" id="sM" value="${s.masterDays}"/></label><label>New cards per day<input class="u-in" type="number" min="1" max="200" id="sN" value="${s.newPerDay}"/></label></div><div class="u-row" style="margin-top:12px"><button class="u-acc" id="sSave">Save</button><button class="secondary" id="sReset">Reset to defaults</button></div></div>`;
}
function wireSettings() {
  $('#sSave').onclick = () => { const s = F().settings; const g = (id, lo, hi, d) => Math.max(lo, Math.min(hi, Number($(id).value) || d)); Object.assign(s, { againMin: g('#sA', 1, 1440, 10), hardDays: g('#sH', 1, 60, 2), easyDays: g('#sE', 1, 365, 7), masterDays: g('#sM', 7, 365, 21), newPerDay: g('#sN', 1, 200, 20) }); persist(); toast('Scheduler saved ✓'); };
  $('#sReset').onclick = () => { Object.assign(F().settings, DEF_SET); persist(); page(C); };
}
