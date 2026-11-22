// QUIZINOX AI Assistant (v3.1): one assistant for every section.
// - Floating ✦ AI button + "Ask AI" chip on every page (not in the translator, not during a quiz).
// - Page-aware: it can read a short summary of what is on the current page (your own data) as context.
// - Response modes (same family as the UPSC Doubt Solver), length, language, voice input.
// - History: every conversation is saved per section (new / open / delete / clear); other AI answers in the app are logged too.
// Uses the existing AI engine and keys only — no separate settings.
import { RESPONSE_MODES, LENGTHS } from './ai-modes.js';
let X = null, panel = null, st = { tab: 'home', view: 'chat', convId: '', mode: 'detailed', length: 'normal', lang: 'English', useCtx: true, busy: false, filter: '' };
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(16).slice(2));
const safe = (f, d = null) => { try { return f(); } catch { return d; } };
const store = () => { const d = X.db; if (!d.aiChats || typeof d.aiChats !== 'object') d.aiChats = {}; d.aiChats.convs ||= []; d.aiChats.log ||= []; d.aiChats.prefs ||= {}; return d.aiChats; };
const SYSTEM = 'You are QUIZINOX AI, a careful, friendly study assistant inside a quiz & exam-preparation app (mainly UPSC / competitive exams). Be accurate; if unsure of a fact, say so instead of guessing. Never invent statistics, dates, article numbers or book titles. Use short headings, bullets and tables where helpful.';

/* ---------- page context & quick prompts ---------- */
const accLine = p => `${p.overall.total} questions answered over ${p.attempts} attempts, overall accuracy ${p.overall.acc}%`;
const weak = (arr, n = 5) => arr.filter(t => t.total >= 2).sort((a, b) => a.acc - b.acc).slice(0, n).map(t => `${t.key} (${t.acc}% of ${t.total})`).join('; ') || 'none yet';
function perf() { const p = safe(() => X.buildProfile()); if (!p || !p.overall.total) return 'No quiz attempts yet.'; return `${accLine(p)}. Weakest subjects: ${weak(p.subjects, 4)}. Weakest topics: ${weak(p.topics, 6)}. Recent scores: ${(p.trend || []).join(', ')}. Repeated mistakes: ${p.repeated.slice(0, 4).map(r => r.topic).join('; ') || 'none'}.`; }
function upscCtx(tab) {
  const u = X.db.upsc || {}, now = Date.now(); const bits = [];
  if (u.stats?.syl) bits.push(`Syllabus: ${u.stats.syl.pct}% complete (${u.stats.syl.done}/${u.stats.syl.total} micro-topics, ${u.stats.syl.prog} in progress)`);
  const cards = u.flash?.cards || []; if (cards.length) bits.push(`Flashcards: ${cards.length} cards, ${cards.filter(c => c.due <= now).length} due`);
  const tasks = (u.planner?.tasks || []); if (tasks.length) { const t0 = new Date().toLocaleDateString('en-CA'); bits.push(`Planner: ${tasks.filter(t => t.date === t0).length} tasks today, ${tasks.filter(t => !t.done && t.date < t0).length} overdue; today: ${tasks.filter(t => t.date === t0).map(t => t.title).slice(0, 8).join('; ')}`); }
  if (u.stats?.mem) bits.push(`Memorisation Lab: ${u.stats.mem.mastered}/${u.stats.mem.total} facts mastered`);
  const arts = u.ca?.articles || []; if (tab === 'ca' && arts.length) bits.push('Recent current-affairs headlines: ' + arts.slice(0, 10).map(a => a.headline).join(' | '));
  return (bits.join('. ') || 'No UPSC module data yet.') + ' ' + perf();
}
const SECTIONS = {
  home: { ctx: () => `${perf()} Revision due: ${safe(() => X.dueItems().length, 0)}. Quizzes in library: ${X.db.quizzes.length}.`, q: ['What should I study today?', 'Analyse my overall progress', 'Make me a 7-day plan from my weak areas', 'How can I improve my accuracy?'] },
  quizzes: { ctx: () => 'Quizzes: ' + X.db.quizzes.slice(0, 30).map(q => `${q.title} (${q.questions.length} Qs, ${q.subject || 'General'})`).join('; '), q: ['Which quiz should I attempt first?', 'Suggest what quizzes I am missing for UPSC Prelims', 'How do I organise my quiz library?'] },
  create: { ctx: () => { const c = safe(() => X.getEditor && X.getEditor()); return c ? `Quiz being edited: "${c.title}" with ${c.questions?.length || 0} questions. Sample: ${(c.questions || []).slice(0, 4).map(q => q.text).join(' | ')}` : 'Creating a quiz.'; }, q: ['Review the questions I have written', 'Suggest better options / distractors', 'What question types should I add?', 'Write explanations for my questions'] },
  revision: { ctx: () => `Revision items: ${Object.keys(X.db.revision || {}).length}, due now: ${safe(() => X.dueItems().length, 0)}. Topics of due items: ${safe(() => X.dueItems().slice(0, 12).map(r => r.topic || r.subject).join('; '), '')}`, q: ['How should I revise the due items?', 'Make mnemonics for my weak topics', 'Plan my revision for this week'] },
  search: { ctx: () => `Question bank size: ${X.db.quizzes.reduce((n, q) => n + q.questions.length, 0)} questions across ${X.db.quizzes.length} quizzes.`, q: ['Suggest search keywords for a topic', 'How do I find PYQs on a topic?'] },
  reports: { ctx: perf, q: ['Explain my analytics in simple words', 'Where am I losing marks?', 'Is my negative marking hurting me?', 'Give me a 7-day improvement plan'] },
  mocks: { ctx: () => `Mock/section tests: ${X.db.quizzes.filter(q => q.kind).map(q => q.title).slice(0, 15).join('; ') || 'none yet'}. ${perf()}`, q: ['How should I design my next mock?', 'How to manage time in Prelims?', 'Suggest a section-wise timing split'] },
  notebook: { ctx: () => `Mistake notebook entries: ${Object.keys(X.db.notebook?.items || {}).length}. ${perf()}`, q: ['Why do I keep repeating these mistakes?', 'Give me a plan to fix repeated mistakes'] },
  achievements: { ctx: () => `Attempts: ${X.db.attempts.length}. ${perf()}`, q: ['What is the next achievement I should aim for?', 'Motivate me with a small daily goal'] },
  analyser: { ctx: perf, q: ['Explain my weakest subject from basics', 'Test me on my weak topics'] },
  predictor: { ctx: perf, q: ['Which topics should I prioritise for Prelims?', 'What is the smartest way to use the next 30 days?'] },
  ai: { ctx: () => `AI connected: ${safe(() => X.AI.aiReady(), false) ? 'yes' : 'no'}.`, q: ['What can I do with AI in QUIZINOX?', 'Suggest a good prompt for generating UPSC questions'] },
  tools: { ctx: () => 'File Studio: PDF/TXT tools, converters, import/export.', q: ['Which tool should I use for my file?', 'How do I convert a coaching PDF into a quiz?'] },
  settings: { ctx: () => `AI source mode: ${X.db.settings.aiMode || 'auto'}; ${(X.db.settings.aiKeys || []).length} AI keys configured (keys are never shared with the AI).`, q: ['Which AI provider/model should I use?', 'How do I avoid hitting free limits?', 'What should I back up?'] },
  upsc: { ctx: () => upscCtx('upsc'), q: ['What should be my overall UPSC strategy now?', 'Which books should I add or drop?', 'What should I do this week?'] },
  syllabus: { ctx: () => upscCtx('syllabus'), q: ['Which syllabus topics should I do next?', 'How should I order the remaining syllabus?', 'Which resources cover my pending topics?'] },
  memlab: { ctx: () => upscCtx('memlab'), q: ['Give me mnemonics for what I am memorising', 'How should I memorise protected areas?', 'What other lists should I add?'] },
  flash: { ctx: () => upscCtx('flash'), q: ['How can I make better flashcards?', 'Which decks should I create for UPSC?', 'Review my study routine for cards'] },
  planner: { ctx: () => upscCtx('planner'), q: ['Is my plan realistic? What should I change?', 'Rebalance my week', 'What should I add or remove?'] },
  ca: { ctx: () => upscCtx('ca'), q: ['Summarise today\'s headlines for UPSC', 'Link these headlines to the syllabus', 'What current-affairs sources should I add?'] },
  doubt: { ctx: () => upscCtx('doubt'), q: ['Explain a concept I am stuck on'] },
};
const secOf = tab => SECTIONS[tab] || { ctx: perf, q: ['What can you help me with here?', 'Suggest what I should do next'] };
const labelOf = tab => ({ home: 'Home', quizzes: 'Quiz library', create: 'Create quiz', revision: 'Revision', search: 'Question search', reports: 'Analytics', mocks: 'Mock & Sections', notebook: 'Mistake Notebook', achievements: 'Achievements', analyser: 'Analyser', predictor: 'Predictor', ai: 'AI Studio', tools: 'File Studio', settings: 'Settings', upsc: 'UPSC Overview', syllabus: 'Syllabus Tracker', memlab: 'Memorisation Lab', flash: 'Flashcards', planner: 'Study Planner', ca: 'Current Affairs', doubt: 'Doubt Solver' }[tab] || tab);

/** Shared prompt builder (also used by the AI Studio doubt box). */
export function answerPrompt({ q, mode = 'detailed', length = 'normal', lang = 'English', context = '', history = '' }) {
  return `${history ? 'Earlier in this conversation:\n' + history + '\n\n' : ''}${context ? `Context from the student's app (real data, use it where relevant):\n"""\n${context.slice(0, 4000)}\n"""\n\n` : ''}Mode: ${RESPONSE_MODES[mode]?.[0] || 'Detailed'}. ${RESPONSE_MODES[mode]?.[1] || ''}\n${LENGTHS[length]?.[1] || ''}\nReply in ${lang}${lang === 'Hinglish' ? ' (Hindi written in Roman script mixed with English)' : ''}. If the question asks for advice or suggestions (what to do, what to add, which books/resources), give concrete prioritised recommendations and say why.\n\nStudent's message: ${q}`;
}
export const SYSTEM_PROMPT = SYSTEM;

/* ---------- history store ---------- */
const convs = () => store().convs;
const cur = () => convs().find(c => c.id === st.convId);
const newConv = tab => { const c = { id: uid(), tab, section: labelOf(tab), title: 'New chat', msgs: [], at: Date.now() }; convs().unshift(c); if (convs().length > 250) convs().length = 250; st.convId = c.id; X.save(); return c; };
function logAnswer(prompt, r, opts) {
  if (opts?.json || opts?.noLog) return; const l = store().log; const m = String(prompt).match(/(?:Student's (?:message|doubt|question)|Question|Doubt):\s*([\s\S]{3,400})$/i);
  l.unshift({ id: uid(), at: Date.now(), tab: X.db.activeTab || 'home', section: labelOf(X.db.activeTab || 'home'), prompt: (m ? m[1] : String(prompt)).replace(/\s+/g, ' ').slice(0, 220), text: String(r.text || '').slice(0, 7000), model: safe(() => `${X.AI.providerName(r.provider)} · ${X.AI.modelLabel(r.provider, r.model)}`, '') });
  if (l.length > 300) l.length = 300; X.save();
}
export function initAssist(ctx) {
  X = ctx; X.AI.setAiLogger(logAnswer);
  if (!document.getElementById('aiFab')) { const b = document.createElement('button'); b.id = 'aiFab'; b.className = 'ai-fab'; b.title = 'Ask AI about this page'; b.innerHTML = '<span>✦</span><b>AI</b>'; b.onclick = () => openAssist(); document.body.appendChild(b); }
  const target = X.view; let t = null; const run = () => { clearTimeout(t); t = setTimeout(decorate, 120); };
  new MutationObserver(run).observe(target, { childList: true }); run();
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && panel) closeAssist(); });
}
function decorate() {
  if (X.isPlaying()) return; const tab = X.db.activeTab || 'home'; if ($('#view .ask-ai-btn')) return; if ($('#view .player-wrap,#view .omr-wrap')) return;
  const mk = () => { const b = document.createElement('button'); b.className = 'secondary ask-ai-btn'; b.textContent = '✦ Ask AI'; b.title = 'Ask AI about this page'; b.onclick = () => openAssist(); return b; };
  const hero = $('#view .u-hero-actions') || $('#view .u-hero'); const h1 = $('#view h1'); const head = $('#view .section-head') || $('#view .panel-head');
  if (hero) hero.appendChild(mk()); else if (h1) { const b = mk(); b.style.margin = '0 0 10px'; h1.after(b); } else if (head) head.appendChild(mk());
}
export function openAssist(o = {}) {
  if (!X) return; closeAssist(); st.tab = o.tab || X.db.activeTab || 'home'; st.view = 'chat'; st.extraCtx = o.ctx || ''; if (o.ctx) st.convId = ''; const pref = store().prefs; Object.assign(st, { mode: pref.mode || st.mode, length: pref.length || st.length, lang: pref.lang || st.lang });
  const existing = convs().find(c => c.tab === st.tab && c.id === st.convId); if (!existing) { const last = convs().find(c => c.tab === st.tab && Date.now() - c.at < 36e5 && c.msgs.length); st.convId = last ? last.id : ''; }
  panel = document.createElement('div'); panel.className = 'ai-panel'; panel.innerHTML = '<div class="ai-backdrop"></div><section class="ai-sheet" role="dialog" aria-label="QUIZINOX AI"></section>'; document.body.appendChild(panel); document.body.classList.add('ai-open');
  $('.ai-backdrop', panel).onclick = closeAssist; draw(); if (o.prompt) setTimeout(() => send(o.prompt), 50);
}
export function closeAssist() { panel?.remove(); panel = null; document.body.classList.remove('ai-open'); }
function draw() {
  if (!panel) return; const sheet = $('.ai-sheet', panel), sec = secOf(st.tab);
  if (st.view === 'history') return drawHistory(sheet);
  const c = cur(); const msgs = c?.msgs || []; const ready = safe(() => X.AI.aiReady(), false);
  sheet.innerHTML = `<header><div><small>✦ QUIZINOX AI</small><b>${esc(labelOf(st.tab))}</b></div><div class="ai-h-btns"><button data-a="hist" title="History">🕘</button><button data-a="new" title="New chat">＋</button><button data-a="x" title="Close">✕</button></div></header>
  <div class="ai-log" id="aiLog">${msgs.length ? msgs.map(msgHtml).join('') : `<div class="ai-empty"><div style="font-size:30px">✦</div><b>Ask anything about ${esc(labelOf(st.tab))}</b><small>I can see a short summary of this page${st.useCtx ? '' : ' (currently switched off)'} to give personal advice.${ready ? '' : '<br><span class="red-text">AI is not set up — add a key or sign in under Settings → AI.</span>'}</small><div class="ai-chips">${sec.q.map(q => `<button data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div></div>`}${st.busy ? '<div class="ai-msg a"><span class="ai-dots"><i></i><i></i><i></i></span> <small id="aiSt">Thinking…</small></div>' : ''}</div>
  <div class="ai-controls"><select id="aiMode">${Object.entries(RESPONSE_MODES).map(([k, v]) => `<option value="${k}" ${st.mode === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select><select id="aiLen">${Object.entries(LENGTHS).map(([k, v]) => `<option value="${k}" ${st.length === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select><select id="aiLang">${['English', 'Hindi', 'Hinglish'].map(l => `<option ${st.lang === l ? 'selected' : ''}>${l}</option>`).join('')}</select><label class="ai-ctx"><input type="checkbox" id="aiCtx" ${st.useCtx ? 'checked' : ''}/> Use page data</label></div>
  <div class="ai-input"><textarea id="aiIn" rows="1" placeholder="Ask, or choose a mode above… (Enter to send)"></textarea><button id="aiMic" title="Voice input">🎤</button><button class="ai-send" id="aiSend">${st.busy ? '■' : '➤'}</button></div>`;
  const log = $('#aiLog', sheet); log.scrollTop = log.scrollHeight;
  $$('[data-a]', sheet).forEach(b => b.onclick = () => { const a = b.dataset.a; if (a === 'x') closeAssist(); else if (a === 'new') { st.convId = ''; draw(); } else { st.view = 'history'; draw(); } });
  $$('[data-q]', sheet).forEach(b => b.onclick = () => send(b.dataset.q));
  $('#aiMode', sheet).onchange = e => { st.mode = e.target.value; store().prefs.mode = st.mode; X.save(); }; $('#aiLen', sheet).onchange = e => { st.length = e.target.value; store().prefs.length = st.length; X.save(); }; $('#aiLang', sheet).onchange = e => { st.lang = e.target.value; store().prefs.lang = st.lang; X.save(); };
  $('#aiCtx', sheet).onchange = e => { st.useCtx = e.target.checked; };
  const inp = $('#aiIn', sheet); inp.oninput = () => { inp.style.height = 'auto'; inp.style.height = Math.min(120, inp.scrollHeight) + 'px'; }; inp.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
  $('#aiSend', sheet).onclick = () => (st.busy ? abort?.abort() : send()); mic($('#aiMic', sheet), inp);
  $$('[data-cp]', sheet).forEach(b => b.onclick = async () => { try { await navigator.clipboard.writeText(msgs[+b.dataset.cp].text); X.toast('Copied ✓'); } catch { X.toast('Copy is not allowed here'); } });
  $$('[data-rg]', sheet).forEach(b => b.onclick = () => { const i = +b.dataset.rg; const q = [...msgs.slice(0, i)].reverse().find(m => m.role === 'user'); if (!q) return; c.msgs = msgs.slice(0, i); X.save(); send(q.text, true); });
  $$('[data-nt]', sheet).forEach(b => b.onclick = () => { X.db.notes ||= []; const m = msgs[+b.dataset.nt]; (X.db.aiChats.saved ||= []).unshift({ id: uid(), at: Date.now(), section: labelOf(st.tab), text: m.text }); X.save(); X.toast('Saved to AI history → Saved answers ✓'); });
  if (!msgs.length) inp.focus();
}
const msgHtml = (m, i) => m.role === 'user' ? `<div class="ai-msg u">${esc(m.text)}</div>` : `<div class="ai-msg a ${m.err ? 'err' : ''}">${m.err ? `<span class="red-text">✕ ${esc(m.text)}</span>` : X.md(m.text)}<div class="ai-tools"><button data-cp="${i}">Copy</button>${m.err ? '' : `<button data-nt="${i}">★ Save</button>`}<button data-rg="${i}">↻ Regenerate</button>${m.model ? `<small>${esc(m.model)}</small>` : ''}</div></div>`;
let abort = null;
async function send(text, regen = false) {
  if (st.busy || !panel) return; const inp = $('#aiIn', panel); const q = (text ?? inp?.value ?? '').trim(); if (!q) return; if (inp) inp.value = '';
  let c = cur(); if (!c) c = newConv(st.tab); if (!regen) { c.msgs.push({ role: 'user', text: q }); if (c.title === 'New chat') c.title = q.slice(0, 48); } c.at = Date.now(); st.busy = true; abort = new AbortController(); X.save(); draw();
  const hist = c.msgs.filter(m => !m.err).slice(-7, -1).map(m => `${m.role === 'user' ? 'Student' : 'Assistant'}: ${m.text.slice(0, 900)}`).join('\n');
  const ctxText = st.useCtx ? ((st.extraCtx ? st.extraCtx + '\n' : '') + safe(() => secOf(st.tab).ctx(), '')) : '';
  try { const r = await X.AI.aiCall(answerPrompt({ q, mode: st.mode, length: st.length, lang: st.lang, context: ctxText, history: hist }), { json: false, system: SYSTEM, maxTokens: st.length === 'long' ? 3200 : st.length === 'short' ? 700 : 1800, temperature: 0.5, signal: abort.signal, noLog: true, onStatus: m => { const e = $('#aiSt'); if (e) e.textContent = m; } }); c.msgs.push({ role: 'ai', text: r.text, model: `${X.AI.providerName(r.provider)} · ${X.AI.modelLabel(r.provider, r.model)}`, mode: st.mode }); }
  catch (e) { c.msgs.push({ role: 'ai', err: true, text: e.code === 'abort' ? 'Stopped.' : e.message }); }
  st.busy = false; abort = null; X.save(); if (panel) draw();
}
function mic(btn, inp) { const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) { btn.disabled = true; btn.title = 'Voice input is not supported here'; return; } let rec = null; btn.onclick = () => { if (rec) { rec.stop(); return; } rec = new SR(); rec.lang = st.lang === 'Hindi' ? 'hi-IN' : 'en-IN'; rec.onresult = e => { inp.value += (inp.value ? ' ' : '') + [...e.results].map(r => r[0].transcript).join(' '); inp.oninput(); }; rec.onerror = e => X.toast(e.error === 'not-allowed' ? 'Microphone permission denied' : 'Voice input failed'); rec.onend = () => { rec = null; btn.textContent = '🎤'; }; btn.textContent = '⏹'; try { rec.start(); } catch { rec = null; btn.textContent = '🎤'; } }; }
/* ---------- history ---------- */
const when = t => new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
function drawHistory(sheet) {
  const S = store(); const tab = st.hTab || 'chats'; const sections = [...new Set([...S.convs.map(c => c.section), ...S.log.map(l => l.section)])];
  const f = st.filter; const cs = S.convs.filter(c => c.msgs.length && (!f || c.section === f)), ls = S.log.filter(l => !f || l.section === f), sv = (S.saved || []).filter(s => !f || s.section === f);
  sheet.innerHTML = `<header><div><small>✦ QUIZINOX AI</small><b>History</b></div><div class="ai-h-btns"><button data-a="back" title="Back to chat">‹</button><button data-a="x" title="Close">✕</button></div></header>
  <div class="ai-controls"><select id="hTab"><option value="chats" ${tab === 'chats' ? 'selected' : ''}>Chats (${S.convs.filter(c => c.msgs.length).length})</option><option value="log" ${tab === 'log' ? 'selected' : ''}>Other AI answers (${S.log.length})</option><option value="saved" ${tab === 'saved' ? 'selected' : ''}>Saved (${(S.saved || []).length})</option></select><select id="hSec"><option value="">All sections</option>${sections.map(x => `<option ${f === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div>
  <div class="ai-log" id="hList">${tab === 'chats' ? (cs.map(c => `<div class="ai-h-item"><button data-open="${c.id}"><b>${esc(c.title)}</b><small>${esc(c.section)} · ${c.msgs.length} msgs · ${when(c.at)}</small></button><button data-del="${c.id}" title="Delete">🗑</button></div>`).join('') || '<div class="ai-empty"><small>No saved chats yet.</small></div>') : tab === 'log' ? (ls.map(l => `<div class="ai-h-item"><button data-view="${l.id}"><b>${esc(l.prompt || 'AI answer')}</b><small>${esc(l.section)} · ${when(l.at)}</small></button><button data-dl="${l.id}" title="Delete">🗑</button></div>`).join('') || '<div class="ai-empty"><small>AI answers from other parts of the app (tutor, doubt box…) are kept here.</small></div>') : (sv.map(l => `<div class="ai-h-item"><button data-vs="${l.id}"><b>${esc(String(l.text).slice(0, 80))}</b><small>${esc(l.section)} · ${when(l.at)}</small></button><button data-ds="${l.id}" title="Delete">🗑</button></div>`).join('') || '<div class="ai-empty"><small>Use ★ Save under an answer.</small></div>')}</div>
  <div class="ai-input"><button class="ai-wide" id="hNew">＋ New chat</button><button class="ai-wide danger" id="hClear">Clear ${tab === 'chats' ? 'all chats' : tab === 'log' ? 'this log' : 'saved'}</button></div>`;
  $$('[data-a]', sheet).forEach(b => b.onclick = () => { if (b.dataset.a === 'x') closeAssist(); else { st.view = 'chat'; draw(); } });
  $('#hTab', sheet).onchange = e => { st.hTab = e.target.value; draw(); }; $('#hSec', sheet).onchange = e => { st.filter = e.target.value; draw(); };
  $$('[data-open]', sheet).forEach(b => b.onclick = () => { const c = convs().find(x => x.id === b.dataset.open); st.convId = c.id; st.tab = c.tab; st.view = 'chat'; draw(); });
  $$('[data-del]', sheet).forEach(b => b.onclick = () => { S.convs = S.convs.filter(c => c.id !== b.dataset.del); if (st.convId === b.dataset.del) st.convId = ''; X.save(); draw(); });
  $$('[data-dl]', sheet).forEach(b => b.onclick = () => { S.log = S.log.filter(c => c.id !== b.dataset.dl); X.save(); draw(); });
  $$('[data-ds]', sheet).forEach(b => b.onclick = () => { S.saved = (S.saved || []).filter(c => c.id !== b.dataset.ds); X.save(); draw(); });
  const show = (title, text) => { const { el } = X.modal(`<div class="eyebrow">AI ANSWER</div><h2>${esc(title.slice(0, 90))}</h2><div class="ai-answer">${X.md(text)}</div><div class="dialog-actions"><button class="secondary" id="vCopy">⎘ Copy</button></div>`, { wide: true }); $('#vCopy', el).onclick = async () => { try { await navigator.clipboard.writeText(text); X.toast('Copied ✓'); } catch { X.toast('Copy not allowed'); } }; };
  $$('[data-view]', sheet).forEach(b => b.onclick = () => { const l = S.log.find(x => x.id === b.dataset.view); show(l.prompt || 'AI answer', l.text); });
  $$('[data-vs]', sheet).forEach(b => b.onclick = () => { const l = S.saved.find(x => x.id === b.dataset.vs); show(l.section, l.text); });
  $('#hNew', sheet).onclick = () => { st.convId = ''; st.view = 'chat'; draw(); };
  $('#hClear', sheet).onclick = async () => { if (await X.confirmBox('Clear history?', 'This deletes the saved AI history of this list from this device.', 'Clear', true)) { if (tab === 'chats') { S.convs = []; st.convId = ''; } else if (tab === 'log') S.log = []; else S.saved = []; X.save(); draw(); } };
}
/** Recent doubts list for the AI Studio doubt box. */
export function recentFor(sectionLabel, n = 6) { return store().log.filter(l => l.section === sectionLabel).slice(0, n); }
export function clearLog(sectionLabel) { const S = store(); S.log = S.log.filter(l => l.section !== sectionLabel); X.save(); }
export function showAnswer(id) { const l = store().log.find(x => x.id === id); if (!l) return; const { el } = X.modal(`<div class="eyebrow">AI ANSWER</div><h2>${esc((l.prompt || 'AI answer').slice(0, 90))}</h2><div class="ai-answer">${X.md(l.text)}</div><div class="muted">${esc(l.model || '')} · ${when(l.at)}</div>`, { wide: true }); return el; }
