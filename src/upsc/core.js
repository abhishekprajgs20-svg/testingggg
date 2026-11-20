// Shared helpers for every UPSC module. Uses the app's own context (db, save, modal, startQuiz, AI…): no second database, no second AI setup.
import { dayKey } from './lite.js';
export { dayKey };
export let C = null;
export const setC = c => { C = c; };
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
export const pct = (a, b) => (b ? Math.round(a / b * 100) : 0);
export const fmtMin = m => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ' ' + (m % 60) + 'm' : ''}` : `${Math.round(m)} min`);
export const DAY = 86400000;
export const U = () => { const d = C.db; if (!d.upsc || typeof d.upsc !== 'object') d.upsc = {}; return d.upsc; };
/** Get (and create on first use) one module's saved state inside db.upsc. */
export const sub = (k, def) => { const u = U(); if (!u[k] || typeof u[k] !== 'object') u[k] = typeof def === 'function' ? def() : def; return u[k]; };
export const stats = () => { const u = U(); if (!u.stats) u.stats = {}; return u.stats; };
export const persist = () => C.save();
export const toast = m => C.toast(m);
export const hasAI = () => { try { return C.AI.aiReady(); } catch { return false; } };
export function head(eyebrow, title, subtitle, actions = '') {
  return `<div class="u-hero"><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1><p>${subtitle}</p>${actions ? `<div class="u-hero-actions">${actions}</div>` : ''}</div>`;
}
export const bar = (p, cls = '') => `<div class="u-bar ${cls}"><i style="width:${Math.max(0, Math.min(100, p))}%"></i></div>`;
export const chip = (t, cls = '') => `<span class="u-chip ${cls}">${esc(t)}</span>`;
export function tabsHtml(list, on, attr = 'data-t') { return `<div class="u-tabs">${list.map(([k, l]) => `<button ${attr}="${k}" class="${k === on ? 'on' : ''}">${l}</button>`).join('')}</div>`; }
export function empty(icon, title, text, btn = '') { return `<div class="u-empty"><div style="font-size:30px">${icon}</div><b>${esc(title)}</b><div>${text}</div>${btn}</div>`; }
export function ui(html) { C.view.innerHTML = `<div class="u-wrap">${html}</div>`; }
export const goto = tab => C.setTab(tab);
/** Plain-text renderer for AI output: headings, lists, bold, tables, code. Output is escaped first. */
export function mdx(src) {
  const lines = esc(src).replace(/\r/g, '').split('\n'); let html = '', list = null, i = 0;
  const close = () => { if (list) { html += `</${list}>`; list = null; } };
  const inl = t => t.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<i>$2</i>').replace(/`([^`]+)`/g, '<code>$1</code>');
  while (i < lines.length) {
    const l = lines[i].trim(); let m;
    if (!l) { close(); i++; continue; }
    if (l.startsWith('|') && i + 1 < lines.length && /^\|?[\s:|-]+\|?$/.test(lines[i + 1].trim()) && lines[i + 1].includes('-')) {
      close(); const rows = []; while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(lines[i].trim()); i++; }
      const cells = r => r.replace(/^\||\|$/g, '').split('|').map(c => inl(c.trim()));
      html += `<table><thead><tr>${cells(rows[0]).map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.slice(2).map(r => `<tr>${cells(r).map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`; continue;
    }
    if ((m = l.match(/^#{1,6}\s+(.*)/))) { close(); html += `<h4>${inl(m[1])}</h4>`; }
    else if ((m = l.match(/^[-*•]\s+(.*)/))) { if (list !== 'ul') { close(); html += '<ul>'; list = 'ul'; } html += `<li>${inl(m[1])}</li>`; }
    else if ((m = l.match(/^\d+[.)]\s+(.*)/))) { if (list !== 'ol') { close(); html += '<ol>'; list = 'ol'; } html += `<li>${inl(m[1])}</li>`; }
    else { close(); html += `<p>${inl(l)}</p>`; }
    i++;
  }
  close(); return html;
}
/** One AI request through the app's existing AI engine (providers, keys, fallback). Never fabricates — throws an honest error. */
export async function ask(prompt, o = {}) {
  if (!hasAI()) { const e = new Error('AI is not set up. Add an API key or sign in under Settings → AI (the same setup used everywhere in QUIZINOX).'); e.code = 'nokey'; throw e; }
  return C.AI.aiCall(prompt, { json: false, maxTokens: 2600, ...o });
}
export const SYSTEM_UPSC = 'You are QUIZINOX AI, a careful UPSC Civil Services tutor. Be accurate; if you are not sure of a fact, say so plainly instead of guessing. Never invent article numbers, dates, statistics, scheme names or quotations. Prefer standard sources (NCERT, Laxmikanth, Spectrum, Constitution of India text, official reports). Use clear headings and short points.';
/* ---------- links into the existing app: quizzes, notes, mistakes ---------- */
const STOP = new Set('the and of in on to for with from by a an is are as at its their india indian other related various system act acts policy policies basic basics general overview introduction important key main concept concepts'.split(' '));
export const words = s => String(s || '').toLowerCase().replace(/[^a-z0-9\u0900-\u097f\s]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !STOP.has(w));
export function scoreText(text, kws, phrase) { const t = String(text || '').toLowerCase(); if (!t) return 0; let s = phrase && phrase.length > 4 && t.includes(phrase) ? 4 : 0; for (const k of kws) if (t.includes(k)) s++; return s; }
export function relatedQuestions(name, extraKw = [], limit = 60) {
  const kws = [...new Set([...words(name), ...extraKw.flatMap(words)])]; if (!kws.length) return [];
  const phrase = String(name).toLowerCase(); const out = [];
  for (const qz of C.db.quizzes) for (const q of qz.questions || []) {
    const s = scoreText(q.topic, kws, phrase) * 2 + scoreText(q.text, kws, phrase) + scoreText(q.explanation, kws, '') * 0.5 + scoreText(qz.title, kws, phrase) * 0.5;
    const need = kws.length >= 3 ? 2 : 1; if (s >= need + 0.01 && (q.options || []).length >= 2) out.push({ q, quiz: qz, s });
  }
  return out.sort((a, b) => b.s - a.s).slice(0, limit);
}
export function relatedQuizzes(name, extraKw = []) {
  const kws = [...new Set([...words(name), ...extraKw.flatMap(words)])]; const phrase = String(name).toLowerCase(); const map = new Map();
  for (const r of relatedQuestions(name, extraKw, 400)) { const e = map.get(r.quiz.id) || { quiz: r.quiz, n: 0 }; e.n++; map.set(r.quiz.id, e); }
  for (const qz of C.db.quizzes) if (scoreText(qz.title + ' ' + (qz.subject || ''), kws, phrase) >= 1 && !map.has(qz.id)) map.set(qz.id, { quiz: qz, n: 0 });
  return [...map.values()].sort((a, b) => b.n - a.n).slice(0, 8);
}
export function relatedNotes(name, extraKw = []) {
  const kws = [...new Set([...words(name), ...extraKw.flatMap(words)])]; const phrase = String(name).toLowerCase(); const out = [];
  for (const it of Object.values(C.db.notebook?.items || {})) { const s = scoreText((it.text || it.question || '') + ' ' + (it.topic || '') + ' ' + (it.note || ''), kws, phrase); if (s >= 1) out.push({ kind: 'Mistake notebook', title: String(it.text || it.question || '').slice(0, 110), s, item: it }); }
  for (const it of Object.values(C.db.revision || {})) { const s = scoreText((it.text || '') + ' ' + (it.topic || '') + ' ' + (it.explanation || ''), kws, phrase); if (s >= 1) out.push({ kind: 'Revision item', title: String(it.text || '').slice(0, 110), s, item: it }); }
  return out.sort((a, b) => b.s - a.s).slice(0, 8);
}
/** Start a practice session on the existing quiz engine using questions that already exist in the user's quizzes. */
export function practiceQuestions(title, subject, list) {
  if (!list.length) return false;
  const seen = new Set(), qs = [];
  for (const r of list) { const k = String(r.q.text).slice(0, 100); if (seen.has(k)) continue; seen.add(k); qs.push({ ...r.q, id: C.uid(), topic: r.q.topic || title, subject: r.quiz?.subject || subject }); }
  const { el, close } = C.modal(`<div class="eyebrow">PRACTICE · EXISTING QUIZ ENGINE</div><h2>${esc(title)}</h2><p>${qs.length} question${qs.length > 1 ? 's' : ''} from your own quizzes. Choose how to attempt them.</p>
   <button class="mode-choice" data-m="practice"><span class="mode-icon practice-icon">✓</span><span><b>Practice mode</b><small>Instant answer + explanation, free navigation</small></span><span class="mode-arrow">›</span></button>
   <button class="mode-choice" data-m="exam"><span class="mode-icon exam-icon">◷</span><span><b>Exam mode</b><small>Palette, mark for review, submit at the end</small></span><span class="mode-arrow">›</span></button>`);
  $$('[data-m]', el).forEach(b => b.onclick = () => { close(); const quiz = { ...C.quizTemplate('Topic practice · ' + title), id: 'upsc-' + C.uid().slice(0, 8), subject, questions: qs }; quiz.settings = { ...quiz.settings, negative: 0.33, timer: 0 }; C.startQuiz(quiz.id, b.dataset.m, 'none', quiz); });
  return true;
}
/** Ask the existing AI Question Generator to make questions on a topic (it saves a normal quiz). */
export function generateFor(topic, subject = 'UPSC') {
  if (!hasAI()) { toast('Add an AI key (or sign in) in Settings first'); return C.setTab('settings'); }
  C.aiGenerator({ topic, subject, source: 'topic', types: ['mcq', 'statement'], count: 10 });
}
/** Convert plain {front, back, extra} items into flashcards in a named deck (originals are never touched). */
export async function addCards(deckName, items, src = 'manual') {
  const m = await import('./flash.js'); return m.addCardsToDeck(deckName, items, src);
}
/** Compact list of weak topics from the existing analytics (used by planner + doubt solver). */
export function weakTopics(n = 6) { try { return C.buildProfile().topics.filter(t => t.total >= 2 && t.acc < 70).slice(0, n); } catch { return []; } }
export function recentMistakes(n = 20) {
  const out = []; for (const a of C.db.attempts.slice(0, 40)) for (const d of a.details || []) { if (d.status === 'wrong') out.push({ text: d.question, options: (d.options || []).slice().sort((x, y) => x.original - y.original).map(o => o.text), correct: d.correct, selected: d.selected, explanation: d.explanation || '', topic: d.topic || a.quizTitle || '', quiz: a.quizTitle }); if (out.length >= n) return out; }
  return out;
}
