// QUIZINOX v3.0 — UPSC Preparation Centre: tiny always-loaded helpers (dashboard summary + CSS).
// Everything else is lazy-loaded from ./index.js. All data lives in db.upsc inside the existing local store.
import './upsc.css';
export const dayKey = d => new Date(d).toLocaleDateString('en-CA');
export const UPSC_TABS = ['upsc', 'syllabus', 'memlab', 'flash', 'planner', 'ca', 'doubt'];
export const UPSC_NAV = [
  ['upsc', '🏛', 'UPSC Overview'], ['syllabus', '🗺', 'Syllabus Tracker'], ['memlab', '🧩', 'Memorisation Lab'],
  ['flash', '🃏', 'Flashcards'], ['planner', '📅', 'AI Study Planner'], ['ca', '📰', 'Current Affairs Hub'], ['doubt', '💬', 'AI Doubt Solver'],
];
export const UPSC_LABELS = { upsc: 'UPSC Preparation Centre', syllabus: 'Micro-level syllabus tracker', memlab: 'Memorisation Lab', flash: 'Spaced-repetition flashcards', planner: 'AI study planner & scheduler', ca: 'Current Affairs Hub', doubt: 'QUIZINOX AI · Doubt Solver' };
/** Merge a backup's UPSC data into the current one without overwriting what already exists. */
export function mergeUpsc(cur, inc) {
  if (!inc || typeof inc !== 'object') return cur || {};
  const out = cur && typeof cur === 'object' ? cur : {};
  const byId = (a, b) => { const m = new Map((a || []).map(x => [x.id, x])); (b || []).forEach(x => { if (x && !m.has(x.id)) m.set(x.id, x); }); return [...m.values()]; };
  for (const k of ['syllabus', 'mem', 'overview']) out[k] = { ...(inc[k] || {}), ...(out[k] || {}) };
  if (inc.flash) { const f = out.flash || (out.flash = { decks: [], cards: [] }); f.decks = byId(f.decks, inc.flash.decks); f.cards = byId(f.cards, inc.flash.cards); f.settings = { ...(inc.flash.settings || {}), ...(f.settings || {}) }; }
  if (inc.planner) { const p = out.planner || (out.planner = { tasks: [], sessions: [], settings: {} }); p.tasks = byId(p.tasks, inc.planner.tasks); p.sessions = byId(p.sessions, inc.planner.sessions); p.plans = byId(p.plans, inc.planner.plans); p.settings = { ...(inc.planner.settings || {}), ...(p.settings || {}) }; }
  if (inc.ca) { const c = out.ca || (out.ca = { articles: [], state: {}, sources: null }); c.articles = byId(c.articles, inc.ca.articles); c.state = { ...(inc.ca.state || {}), ...(c.state || {}) }; c.sources ||= inc.ca.sources || null; c.updated = Math.max(c.updated || 0, inc.ca.updated || 0); }
  if (inc.doubt) { const d = out.doubt || (out.doubt = { convs: [] }); d.convs = byId(d.convs, inc.doubt.convs); }
  if (inc.memCustom) out.memCustom = byId(out.memCustom, inc.memCustom);
  return out;
}
/** Numbers for the dashboard. Reads only saved data — nothing is invented. */
export function upscSummary(db) {
  const u = db.upsc || {}, now = Date.now(), today = dayKey(now);
  const cards = u.flash?.cards || [];
  const tasks = (u.planner?.tasks || []).filter(t => t.date === today);
  const sess = (u.planner?.sessions || []).filter(s => s.date === today);
  const ca = u.ca?.articles || [], st = u.ca?.state || {};
  const syl = u.stats?.syl || null, mem = u.stats?.mem || null;
  return {
    syl, mem,
    flashDue: cards.filter(c => (c.due || 0) <= now).length, flashTotal: cards.length,
    tasksDone: tasks.filter(t => t.done).length, tasksTotal: tasks.length, tasks,
    studyMin: Math.round(sess.reduce((n, s) => n + (s.actualSec || 0), 0) / 60),
    caTotal: ca.length, caUnread: ca.filter(a => !st[a.id]?.read).length, caUpdated: u.ca?.updated || 0,
    used: !!(syl || cards.length || tasks.length || ca.length || mem || (u.doubt?.convs || []).length),
  };
}
export function upscHomeHtml(db, esc) {
  const s = upscSummary(db); const bar = p => `<div class="u-bar"><i style="width:${Math.max(0, Math.min(100, p))}%"></i></div>`;
  const pct = s.syl ? s.syl.pct : 0, mp = s.mem && s.mem.total ? Math.round(s.mem.mastered / s.mem.total * 100) : 0;
  return `<div class="section-head"><div><div class="eyebrow">UPSC PREPARATION CENTRE</div><h2>Your UPSC overview</h2></div><button class="textbtn" data-tab="upsc">Open centre →</button></div>
  <div class="u-home">
   <button class="u-home-card" data-tab="syllabus"><small>SYLLABUS</small><strong>${pct}%</strong>${bar(pct)}<span>${s.syl ? `${s.syl.done} done · ${s.syl.prog} in progress · ${s.syl.total} micro-topics` : 'Start tracking your syllabus'}</span></button>
   <button class="u-home-card" data-tab="planner"><small>TODAY'S TASKS</small><strong>${s.tasksDone}/${s.tasksTotal}</strong>${bar(s.tasksTotal ? s.tasksDone / s.tasksTotal * 100 : 0)}<span>${s.studyMin ? `${s.studyMin} min studied today` : 'No study time logged today'}</span></button>
   <button class="u-home-card" data-tab="flash"><small>FLASHCARDS DUE</small><strong>${s.flashDue}</strong>${bar(s.flashTotal ? (s.flashTotal - s.flashDue) / s.flashTotal * 100 : 0)}<span>${s.flashTotal ? `${s.flashTotal} cards in total` : 'Create or import your first deck'}</span></button>
   <button class="u-home-card" data-tab="memlab"><small>MEMORISATION</small><strong>${mp}%</strong>${bar(mp)}<span>${s.mem ? `${s.mem.mastered} mastered of ${s.mem.total} facts` : 'Explore the Memorisation Lab'}</span></button>
   <button class="u-home-card" data-tab="ca"><small>CURRENT AFFAIRS</small><strong>${s.caUnread}</strong><span>${s.caTotal ? `unread of ${s.caTotal} saved · updated ${new Date(s.caUpdated).toLocaleDateString()}` : 'Nothing downloaded yet — fetch from your sources'}</span></button>
   <button class="u-home-card u-accent" data-tab="doubt"><small>QUIZINOX AI</small><strong>💬</strong><span>Ask your personal UPSC tutor a doubt</span></button>
  </div>`;
}
