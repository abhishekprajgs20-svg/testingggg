// Memorisation Lab: 14 fact categories, interactive India map for National Parks, active recall, analytics, flashcard links.
import { CATS, SOURCES, INDIA_OUTLINE, ISLANDS, STATES_OF } from './data-mem.js';
import { C, setC, esc, $, $$, sub, stats, persist, head, bar, chip, tabsHtml, ui, pct, uid, toast, empty } from './core.js';
import { addCardsToDeck } from './flash.js';

const M = () => sub('mem', {});
const custom = () => sub('memCustom', { list: [] }).list;
const rec = id => M()[id] || (M()[id] = { seen: 0, mastered: false, right: 0, wrong: 0, last: 0 });
function rowsOf(cat) { const extra = custom().filter(x => x.cat === cat.id).map((x, i) => ({ ...x, id: x.id || `${cat.id}:c${i}` })); return [...cat.rows, ...extra]; }
function refresh() { let total = 0, mastered = 0; CATS.forEach(c => { const r = rowsOf(c); total += r.length; r.forEach(f => { if (M()[f.id]?.mastered) mastered++; }); }); stats().mem = { total, mastered }; }
function catStats(cat) { const rows = rowsOf(cat); let studied = 0, mastered = 0, right = 0, wrong = 0, repeated = 0; rows.forEach(f => { const r = M()[f.id]; if (!r) return; if (r.seen) studied++; if (r.mastered) mastered++; right += r.right; wrong += r.wrong; if (r.wrong >= 2) repeated++; }); return { total: rows.length, studied, mastered, pending: rows.length - mastered, right, wrong, repeated }; }
let view = { cat: null, tab: 'explore', state: '', q: '', sel: null, recall: null, mode: 'reveal' };
export function page(ctx) { setC(ctx); refresh(); persist(); if (!view.cat) home(); else catPage(); }
/* ---------- home ---------- */
function home() {
  const all = CATS.reduce((a, c) => { const s = catStats(c); Object.keys(s).forEach(k => a[k] = (a[k] || 0) + s[k]); return a; }, {});
  ui(head('MEMORISATION LAB', 'Learn facts by exploring, then recalling', 'Fourteen UPSC fact categories with an interactive India map, active recall and mastery tracking. Datasets are starter sets compiled from public references — each category shows its source and you can import JSON to extend or correct it.') +
   `<div class="u-glass"><h3>Your memorisation progress</h3><div class="u-stat"><div><small>TOTAL FACTS</small><strong>${all.total}</strong></div><div><small>STUDIED</small><strong>${all.studied}</strong></div><div><small>MASTERED</small><strong style="color:#8bebc4">${all.mastered}</strong></div><div><small>PENDING</small><strong>${all.pending}</strong></div><div><small>CORRECT RECALL</small><strong>${all.right}</strong></div><div><small>INCORRECT</small><strong style="color:#ff9eac">${all.wrong}</strong></div><div><small>REPEATED MISTAKES</small><strong>${all.repeated}</strong></div></div>${bar(pct(all.mastered, all.total))}</div>
   <div class="u-grid">${CATS.map(c => { const s = catStats(c); return `<button class="u-card" data-cat="${c.id}"><div style="font-size:26px">${c.icon}</div><b>${esc(c.name)}</b><small>${s.total} facts · ${s.mastered} mastered</small>${bar(pct(s.mastered, s.total), 'g')}${c.map ? chip('Interactive map', 'p') : ''}</button>`; }).join('')}</div>`);
  $$('[data-cat]').forEach(b => b.onclick = () => { view = { cat: b.dataset.cat, tab: CATS.find(c => c.id === b.dataset.cat).map ? 'map' : 'explore', state: '', q: '', sel: null, recall: null, mode: 'reveal' }; catPage(); });
}
/* ---------- category ---------- */
const cat = () => CATS.find(c => c.id === view.cat);
function catPage() {
  const c = cat(), s = catStats(c); const rows = rowsOf(c);
  const tabs = [...(c.map ? [['map', '🗺 Map']] : []), ['explore', '🔎 Explore'], ['recall', '🎯 Active recall'], ['stats', '📊 Analytics']];
  let body = '';
  if (view.tab === 'map') body = mapHtml(c, rows); else if (view.tab === 'explore') body = exploreHtml(c, rows); else if (view.tab === 'recall') body = recallHtml(c, rows); else body = statsHtml(c, s, rows);
  ui(`<div class="u-row"><button class="secondary" id="mBack">‹ All categories</button></div>` + head('MEMORISATION LAB', `${c.icon} ${c.name}`, `${s.total} facts · ${s.mastered} mastered · ${s.pending} pending. Source: ${esc(SOURCES[c.src])}. <i>Starter dataset — totals change over time; verify against the official source.</i>`, `<button class="secondary" id="mFlash">🃏 Add all to flashcards</button><button class="secondary" id="mImp">⇪ Import / update data (JSON)</button>`) + tabsHtml(tabs, view.tab) + body);
  $('#mBack').onclick = () => { view.cat = null; page(C); };
  $$('[data-t]').forEach(b => b.onclick = () => { view.tab = b.dataset.t; view.recall = null; catPage(); });
  $('#mFlash').onclick = () => toCards(c, rows); $('#mImp').onclick = () => importJson(c);
  if (view.tab === 'map') wireMap(c, rows); else if (view.tab === 'explore') wireExplore(c, rows); else if (view.tab === 'recall') wireRecall(c, rows);
}
function detailHtml(c, f) {
  const r = rec(f.id); const lines = c.fields.map(([k, l]) => f[k] ? `<div class="u-task"><span><small class="u-sub">${esc(l)}</small><br>${esc(f[k])}</span></div>` : '').join('');
  const near = c.map ? nearby(f, rowsOf(c)) : []; const sameState = c.map ? rowsOf(c).filter(x => x.id !== f.id && x.state === f.state).slice(0, 8) : [];
  return `<div class="u-glass" id="detail"><div class="u-row sp"><h3>${esc(f.name)}</h3><div class="u-row">${r.mastered ? chip('Mastered ✓', 'g') : chip(r.seen ? 'Studied' : 'New')}</div></div>${lines}
   ${c.map ? `<div class="u-sub" style="margin:8px 0">📍 Approx. ${(+f.lat).toFixed(2)}°N, ${(+f.lon).toFixed(2)}°E (park centroid)</div>${sameState.length ? `<div><small class="u-sub">Other parks in ${esc(f.state)}:</small><br>${sameState.map(x => `<button class="u-chip p" data-pick="${x.id}">${esc(x.name)}</button>`).join('')}</div>` : ''}${near.length ? `<div style="margin-top:6px"><small class="u-sub">Nearest parks in the dataset:</small><br>${near.map(x => `<button class="u-chip" data-pick="${x.f.id}">${esc(x.f.name)} · ${x.d} km</button>`).join('')}</div>` : ''}` : ''}
   <div class="u-row" style="margin-top:10px"><button class="${r.mastered ? 'secondary' : 'u-acc'}" data-master="${f.id}">${r.mastered ? 'Unmark mastered' : '✓ Mark as mastered'}</button><button class="secondary" data-fc="${f.id}">🃏 Add to flashcards</button></div></div>`;
}
function km(a, b) { const R = 6371, t = x => x * Math.PI / 180; const dLa = t(b.lat - a.lat), dLo = t(b.lon - a.lon); const h = Math.sin(dLa / 2) ** 2 + Math.cos(t(a.lat)) * Math.cos(t(b.lat)) * Math.sin(dLo / 2) ** 2; return Math.round(2 * R * Math.asin(Math.sqrt(h))); }
const nearby = (f, rows) => rows.filter(x => x.id !== f.id && x.lat).map(x => ({ f: x, d: km({ lat: +f.lat, lon: +f.lon }, { lat: +x.lat, lon: +x.lon }) })).sort((a, b) => a.d - b.d).slice(0, 4);
function wireDetail(c) {
  $$('[data-master]').forEach(b => b.onclick = () => { const r = rec(b.dataset.master); r.mastered = !r.mastered; r.seen ||= 1; persist(); refresh(); catPage(); });
  $$('[data-fc]').forEach(b => b.onclick = () => { const f = rowsOf(c).find(x => x.id === b.dataset.fc); const k = c.card(f); const r = addCardsToDeck(deckFor(c), [k], 'Memorisation Lab'); toast(r.added ? `Added to “${r.deck.name}” ✓` : 'Already in your flashcards'); });
  $$('[data-pick]').forEach(b => b.onclick = () => { view.sel = b.dataset.pick; markSeen(view.sel); catPage(); setTimeout(() => $('#detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); });
}
const deckFor = c => ({ art: 'Polity Articles', amend: 'Constitutional Amendments', river: 'Geography Facts', range: 'Geography Facts', pass: 'Geography Facts', dam: 'Geography Facts' }[c.id] || (['np', 'wls', 'br', 'ramsar', 'tr', 'er'].includes(c.id) ? 'Environment' : 'Polity Articles'));
function markSeen(id) { const r = rec(id); r.seen = (r.seen || 0) + 1; r.last = Date.now(); persist(); }
async function toCards(c, rows) { const items = rows.map(f => c.card(f)); const r = addCardsToDeck(deckFor(c), items, 'Memorisation Lab'); toast(`${r.added} cards added to “${r.deck.name}”${r.skipped ? ` · ${r.skipped} already existed` : ''} ✓`); }
/* ---------- map ---------- */
const SC = 10, PX = lon => (lon - 67) * 0.93 * SC, PY = lat => (38 - lat) * SC;
const poly = pts => pts.map(p => `${PX(p[0]).toFixed(1)},${PY(p[1]).toFixed(1)}`).join(' ');
function mapHtml(c, rows) {
  const states = STATES_OF(rows); const list = rows.filter(f => (!view.state || String(f.state).includes(view.state)) && (!view.q || f.name.toLowerCase().includes(view.q)));
  const sel = view.sel && rows.find(f => f.id === view.sel); let vb = [0, 0, 290, 320];
  if (view.state && list.length) { const xs = list.map(f => PX(+f.lon)), ys = list.map(f => PY(+f.lat)); const pad = 14; let x0 = Math.min(...xs) - pad, x1 = Math.max(...xs) + pad, y0 = Math.min(...ys) - pad, y1 = Math.max(...ys) + pad; const w = Math.max(60, x1 - x0), h = Math.max(60, y1 - y0); const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; const S = Math.max(w, h * 0.9); vb = [cx - S / 2, cy - S / 2, S, S]; }
  return `<div class="u-glass"><div class="u-row"><select class="u-in" id="mapState" style="max-width:260px"><option value="">All India (${rows.length} parks)</option>${states.map(s => `<option ${s === view.state ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select><input class="u-in" id="mapQ" placeholder="Search park…" value="${esc(view.q)}" style="max-width:220px"/></div>
  <svg class="ml-map" viewBox="${vb.map(v => v.toFixed(1)).join(' ')}" id="mapSvg" role="img" aria-label="Map of India with national park markers"><polygon class="land" points="${poly(INDIA_OUTLINE)}"/>${ISLANDS.map(i => `<polygon class="land" points="${poly(i)}"/>`).join('')}
  ${rows.map(f => { const on = sel && sel.id === f.id, dim = view.state && !String(f.state).includes(view.state); const x = PX(+f.lon), y = PY(+f.lat); const r = vb[2] < 150 ? 1.1 : 1.45; return `<g class="pin ${on ? 'on' : ''} ${dim ? 'dim' : ''}" data-pin="${f.id}"><circle cx="${x}" cy="${y}" r="${r}"/><circle cx="${x}" cy="${y}" r="${r * 2.8}" fill="transparent" stroke="none"/>${on || (view.state && !dim) ? `<text x="${x + 2}" y="${y - 1.5}" style="font-size:${vb[2] < 150 ? 2.6 : 3.2}px">${esc(f.name.replace(/ National Park$| \(.*\)/, ''))}</text>` : ''}</g>`; }).join('')}</svg>
  <div class="u-sub" style="margin-top:6px">Pins use real approximate coordinates; the India outline is a simplified silhouette (state borders are not drawn). Tap a pin or choose a state to zoom.</div></div>
  ${sel ? detailHtml(c, sel) : ''}<div class="u-glass"><h3>${view.state ? esc(view.state) : 'All parks'} <small>(${list.length})</small></h3><div>${list.map(f => `<button class="u-chip ${sel && sel.id === f.id ? 'p' : ''}" data-pin="${f.id}" style="font-size:12px;padding:6px 11px">${esc(f.name.replace(/ National Park$/, ''))}${M()[f.id]?.mastered ? ' ✓' : ''}</button>`).join('') || '<span class="u-sub">No park matches.</span>'}</div></div>`;
}
function wireMap(c, rows) {
  $('#mapState').onchange = e => { view.state = e.target.value; view.sel = null; catPage(); };
  const q = $('#mapQ'); q.oninput = () => { view.q = q.value.trim().toLowerCase(); const p = q.selectionStart; catPage(); const n = $('#mapQ'); n.focus(); n.setSelectionRange(p, p); };
  $$('[data-pin]').forEach(g => g.addEventListener('click', e => { e.stopPropagation(); view.sel = g.dataset.pin; markSeen(view.sel); catPage(); setTimeout(() => $('#detail')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50); }));
  wireDetail(c);
}
/* ---------- explore ---------- */
function exploreHtml(c, rows) {
  const list = rows.filter(f => !view.q || Object.values(f).join(' ').toLowerCase().includes(view.q)); const sel = view.sel && rows.find(f => f.id === view.sel);
  return `<div class="u-glass"><input class="u-in" id="exQ" placeholder="Search ${esc(c.name)}…" value="${esc(view.q)}"/><div style="margin-top:10px">${list.map(f => `<details class="u-det" ${sel && sel.id === f.id ? 'open' : ''} data-open="${f.id}"><summary><span>${esc(f.name)} ${M()[f.id]?.mastered ? '<span class="u-chip g">✓</span>' : ''}</span></summary><div class="u-body">${c.fields.map(([k, l]) => f[k] ? `<div><b>${esc(l)}:</b> ${esc(f[k])}</div>` : '').join('')}<div class="u-row" style="margin-top:8px"><button class="${M()[f.id]?.mastered ? 'secondary' : 'u-acc'}" data-master="${f.id}">${M()[f.id]?.mastered ? 'Unmark mastered' : '✓ Mastered'}</button><button class="secondary" data-fc="${f.id}">🃏 Flashcard</button></div></div></details>`).join('') || empty('🔎', 'Nothing matches', 'Try a different search.')}</div></div>`;
}
function wireExplore(c) { const q = $('#exQ'); q.oninput = () => { view.q = q.value.trim().toLowerCase(); const p = q.selectionStart; catPage(); const n = $('#exQ'); n.focus(); n.setSelectionRange(p, p); }; $$('[data-open]').forEach(d => d.addEventListener('toggle', () => { if (d.open) markSeen(d.dataset.open); })); wireDetail(c); }
/* ---------- active recall ---------- */
function buildQs(c, rows, n = 10) {
  const out = []; const pool = rows.slice().sort((a, b) => weight(b) - weight(a) || Math.random() - 0.5); const tried = new Set();
  for (const f of pool) { if (out.length >= n) break; const qs = c.qs.filter(t => f[t.key] && f[t.ans] && String(f[t.key]).length < 220); if (!qs.length) continue; const t = qs[Math.floor(Math.random() * qs.length)]; const key = f.id + t.key; if (tried.has(key)) continue; tried.add(key);
    const answer = f[t.ans]; const wrong = [...new Set(rows.filter(x => x.id !== f.id && x[t.ans] && x[t.ans] !== answer).map(x => x[t.ans]))].sort(() => Math.random() - 0.5).slice(0, 3);
    const opts = [...wrong, answer].sort(() => Math.random() - 0.5); out.push({ f, text: t.tpl.replace(/\{(\w+)\}/g, (_, k) => f[k] || ''), answer, opts, more: c.fields.map(([k, l]) => (f[k] && f[k] !== answer ? `${l}: ${f[k]}` : '')).filter(Boolean).slice(0, 5) }); }
  return out;
}
const weight = f => { const r = M()[f.id]; return !r ? 2 : r.mastered ? -1 : (r.wrong || 0) * 2 + (r.seen ? 0 : 1); };
function recallHtml(c, rows) {
  const R = view.recall;
  if (!R) return `<div class="u-glass"><h3>Active recall</h3><p>You see the question first. Reveal the answer, then say whether you knew it. Facts you miss come back more often; mastered facts are skipped.</p><div class="seg"><button data-md="reveal" class="${view.mode === 'reveal' ? 'active' : ''}">Reveal &amp; self-check</button><button data-md="choice" class="${view.mode === 'choice' ? 'active' : ''}">Multiple choice</button></div><div class="u-row" style="margin-top:12px"><button class="u-acc" id="rStart">▶ Start 10 questions</button></div></div>`;
  if (R.i >= R.qs.length) return `<div class="u-glass u-empty"><div style="font-size:34px">🎯</div><b>Round complete</b><p>${R.right} correct · ${R.qs.length - R.right} to revisit</p><div class="u-row" style="justify-content:center"><button class="u-acc" id="rAgain">Another round</button><button class="secondary" id="rDone">Close</button></div></div>`;
  const q = R.qs[R.i];
  return `<div class="u-glass"><div class="u-row sp"><small>Question ${R.i + 1} of ${R.qs.length}</small><small>${R.right} correct</small></div>${bar(R.i / R.qs.length * 100)}<div class="fc-q" style="margin:14px 0;text-align:left">${esc(q.text)}</div>
  ${R.mode === 'choice' ? `<div class="ml-opts">${q.opts.map((o, i) => `<button data-o="${i}" class="${R.pick == null ? '' : o === q.answer ? 'ok' : i === R.pick ? 'no' : ''}" ${R.pick != null ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div>` : R.shown ? '' : `<button class="u-acc" id="rShow">Reveal answer</button>`}
  ${(R.mode === 'choice' && R.pick != null) || (R.mode === 'reveal' && R.shown) ? `<div class="instant-feedback ${R.mode === 'choice' ? (q.opts[R.pick] === q.answer ? 'is-correct' : 'is-wrong') : 'is-correct'}"><b>Answer: ${esc(q.answer)}</b><div style="margin-top:6px;font-size:11.5px">${q.more.map(m => `<div>${esc(m)}</div>`).join('')}</div></div>
  <div class="u-row" style="margin-top:12px">${R.mode === 'reveal' ? `<button class="fc-easy" style="border-radius:10px;padding:10px 16px;color:#fff" data-k="1">✓ I knew it</button><button class="fc-again" style="border-radius:10px;padding:10px 16px;color:#fff" data-k="0">✕ I missed it</button>` : `<button class="u-acc" data-k="${q.opts[R.pick] === q.answer ? 1 : 0}">Next →</button>`}<button class="secondary" data-fc1="1">🃏 Save as flashcard</button></div>` : ''}</div>`;
}
function wireRecall(c, rows) {
  $$('[data-md]').forEach(b => b.onclick = () => { view.mode = b.dataset.md; catPage(); });
  const start = () => { const qs = buildQs(c, rows); if (!qs.length) return toast('No questions could be built for this category'); view.recall = { qs, i: 0, right: 0, shown: false, pick: null, mode: view.mode }; catPage(); };
  const s = $('#rStart'); if (s) s.onclick = start; const a = $('#rAgain'); if (a) a.onclick = start; const d = $('#rDone'); if (d) d.onclick = () => { view.recall = null; catPage(); };
  const R = view.recall; if (!R || R.i >= R.qs.length) return; const q = R.qs[R.i];
  const sh = $('#rShow'); if (sh) sh.onclick = () => { R.shown = true; catPage(); };
  $$('[data-o]').forEach(b => b.onclick = () => { R.pick = Number(b.dataset.o); catPage(); });
  $$('[data-k]').forEach(b => b.onclick = () => { const ok = b.dataset.k === '1'; const r = rec(q.f.id); r.seen = (r.seen || 0) + 1; r.last = Date.now(); if (ok) { r.right++; R.right++; } else r.wrong++; persist(); R.i++; R.shown = false; R.pick = null; refresh(); catPage(); });
  const f1 = $('[data-fc1]'); if (f1) f1.onclick = () => { const k = c.card(q.f); const r = addCardsToDeck(deckFor(c), [k], 'Memorisation Lab'); toast(r.added ? 'Saved to flashcards ✓' : 'Already in flashcards'); };
}
/* ---------- analytics, import ---------- */
function statsHtml(c, s, rows) {
  const weak = rows.filter(f => (M()[f.id]?.wrong || 0) >= 1).sort((a, b) => M()[b.id].wrong - M()[a.id].wrong).slice(0, 12);
  return `<div class="u-glass"><h3>${esc(c.name)} — analytics</h3><div class="u-stat"><div><small>TOTAL</small><strong>${s.total}</strong></div><div><small>STUDIED</small><strong>${s.studied}</strong></div><div><small>MASTERED</small><strong style="color:#8bebc4">${s.mastered}</strong></div><div><small>PENDING</small><strong>${s.pending}</strong></div><div><small>CORRECT</small><strong>${s.right}</strong></div><div><small>INCORRECT</small><strong>${s.wrong}</strong></div><div><small>REPEATED MISTAKES</small><strong>${s.repeated}</strong></div></div>${bar(pct(s.mastered, s.total), 'g')}</div>
  <div class="u-glass"><h3>Facts you keep missing</h3>${weak.length ? weak.map(f => `<div class="u-task"><span><b>${esc(f.name)}</b><br><small class="u-sub">missed ${M()[f.id].wrong}× · correct ${M()[f.id].right}×</small></span></div>`).join('') : '<div class="u-sub">Nothing yet — try Active recall.</div>'}</div>`;
}
function importJson(c) {
  const { el, close } = C.modal(`<div class="eyebrow">UPDATE DATASET</div><h2>Import facts into ${esc(c.name)}</h2><p>Add or correct entries from a JSON file: an array of objects with the fields <code>${['name', ...c.fields.map(f => f[0]), ...(c.map ? ['lat', 'lon'] : [])].join(', ')}</code>. Imported facts are kept in your own data and shown with the built-in ones. Use official sources only.</p><div class="dialog-actions"><button class="secondary" data-c>Cancel</button><button class="primary" data-f>Choose file…</button></div>`);
  $('[data-c]', el).onclick = close; $('[data-f]', el).onclick = () => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json'; inp.onchange = async () => { try { const j = JSON.parse(await inp.files[0].text()); const arr = Array.isArray(j) ? j : j.facts || j.rows || []; const have = new Set(rowsOf(c).map(f => f.name.toLowerCase())); let n = 0; for (const x of arr) { if (!x || !x.name || have.has(String(x.name).toLowerCase())) continue; custom().push({ ...x, cat: c.id, id: `${c.id}:u${uid().slice(0, 6)}` }); have.add(String(x.name).toLowerCase()); n++; } persist(); close(); refresh(); catPage(); toast(`${n} new facts added${arr.length - n ? ` · ${arr.length - n} skipped (duplicate/invalid)` : ''}`); } catch (e) { toast('Import failed: ' + e.message); } }; inp.click(); };
}
