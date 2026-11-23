// QUIZINOX v4.0 — TEACH ME MODE (QUIZINOX Teacher)
// A dedicated AI teacher that knows the whole learning journey: quizzes, attempts, mistakes
// and revision history. It teaches any topic from zero to advanced, adapts the explanation
// to the student's level, gives examples, asks 3–5 questions, re-explains on wrong answers
// and finally verifies understanding.
export default function teacherPage(C) {
  const { $, $$, esc, toast, confirmBox } = C;
  const store = () => { const d = C.db; if (!d.teacher || typeof d.teacher !== 'object') d.teacher = { sessions: [] }; if (!Array.isArray(d.teacher.sessions)) d.teacher.sessions = []; return d.teacher; };
  const persist = () => C.save();
  const LEVELS = ['auto', 'beginner', 'intermediate', 'advanced'];
  const LEVEL_LABEL = { auto: '🤖 Auto (judge from my data)', beginner: '🌱 Beginner — zero se', intermediate: '🌿 Intermediate', advanced: '🌳 Advanced' };
  let S = null; // active session (object) or null
  let busy = false, abort = null;

  const weakOf = () => { try { const p = C.buildProfile(); const w = p.topics.filter(t => t.total >= 2 && t.acc < 70).slice(0, 6); const ws = p.subjects.filter(t => t.correct + t.wrong >= 4 && t.acc < 65).slice(0, 4); return { w, ws, perf: p }; } catch { return { w: [], ws: [], perf: null }; } };
  const profileCtx = () => {
    const { w, ws, perf } = weakOf();
    const nb = Object.values(C.db.notebook?.items || {}).filter(i => i.state === 'open').length;
    const parts = [];
    if (perf?.attempts) parts.push(`${perf.attempts} attempts, ${perf.overall.acc}% accuracy overall`);
    if (ws.length) parts.push('weak subjects: ' + ws.map(x => `${x.key} (${x.acc}%)`).join(', '));
    if (w.length) parts.push('weak topics: ' + w.map(x => `${x.key} (${x.acc}%)`).join(', '));
    parts.push(`open mistakes in notebook: ${nb}, revision due: ${C.dueItems().length}`);
    return parts.join('. ') || 'new student — no history yet';
  };

  /* ---------------- session lifecycle ---------------- */
  function newSession(topic, level) {
    return { id: C.uid(), topic, level, at: Date.now(), msgs: [], phase: 'concept', questions: [], answers: {}, score: null, verdict: null, concept: '', examples: [] };
  }
  const pushMsg = (role, kind, text) => { S.msgs.push({ role, kind, text, at: Date.now() }); if (S.msgs.length > 120) S.msgs = S.msgs.slice(-120); };

  async function aiAsk(prompt, { json = false, maxTokens = 2600, temp = 0.45 } = {}) {
    busy = true; abort = new AbortController(); draw();
    try {
      const r = await C.AI.aiCall(prompt, { json, maxTokens, temperature: temp, signal: abort.signal, system: 'You are QUIZINOX Teacher, an expert, patient and encouraging personal tutor for competitive exams (UPSC etc.). You know the student\'s real performance data. Be accurate, never invent facts. Reply in ' + (C.db.settings.tutorLang || 'English') + '.', onStatus: m => { const e = $('#tmStatus'); if (e) e.textContent = m; } });
      return r;
    } finally { busy = false; abort = null; }
  }

  async function startTeaching(topic, level) {
    S = newSession(topic, level);
    persist(); draw();
    const levelNote = level === 'auto' ? 'Judge the student\'s level from their performance data and teach one notch above it.' : `Teach at ${level} level.`;
    const r = await aiAsk(`STUDENT PROFILE (real data from the app):\n${profileCtx()}\n\nTASK — Teach the topic "${topic}" (first lesson: the core CONCEPT).\n${levelNote}\nStructure: (1) one-line big picture, (2) the concept explained step by step with short headings, (3) 3 "must remember" points, (4) common confusion to avoid. Keep it focused (under 450 words). Use markdown.`, { maxTokens: 2400 });
    S.concept = r.text; S.phase = 'concept'; pushMsg('ai', 'concept', r.text);
    persist(); draw();
  }

  async function giveExample() {
    S.phase = 'example';
    pushMsg('user', 'action', '🙋 Give me an example');
    const r = await aiAsk(`We are teaching "${S.topic}". The concept already explained:\n"""\n${S.concept.slice(0, 3000)}\n"""\nTASK — Give a concrete, memorable EXAMPLE (or two) that makes the concept stick: one everyday/real-life analogy and one exam-relevant example (Indian context where apt). Then a 1-line "why this matters for exams". Reply in markdown, under 300 words.`, { maxTokens: 1600 });
    S.examples.push(r.text); pushMsg('ai', 'example', r.text);
    persist(); draw();
  }

  async function startQuiz() {
    S.phase = 'quiz'; S.qi = 0;
    pushMsg('user', 'action', '✍️ Test me — start the questions');
    const n = S.level === 'beginner' ? 3 : S.level === 'advanced' ? 5 : 4;
    try {
      const r = await aiAsk(`TOPIC: "${S.topic}" (taught concept + examples below).\n"""\n${S.concept.slice(0, 2500)}\n"""\nTASK — Write ${n} exam-style MCQs that check real understanding of this topic (application, not just recall). Difficulty matched to a ${S.level === 'auto' ? 'mid-level' : S.level} student. Exactly 4 options each, ONE correct, short explanation.\nReturn ONLY JSON: {"questions":[{"question":"","options":["","","",""],"correct":"A","explanation":""}]}`, { json: true, maxTokens: 2800, temp: 0.6 });
      const obj = C.AI.parseJsonLoose(r.text);
      S.questions = (obj.questions || []).map(q => {
        const opts = (q.options || []).map(String); let c = q.correct; if (typeof c === 'string') c = Math.max(0, 'ABCDE'.indexOf(c.toUpperCase().replace(/[^A-E]/g, '').charAt(0)));
        return { question: String(q.question || ''), options: opts, correct: Number(c) || 0, explanation: String(q.explanation || '') };
      }).filter(q => q.question && q.options.length >= 2);
      if (!S.questions.length) throw new Error('AI returned no questions');
    } catch (e) { S.phase = 'example'; pushMsg('ai', 'err', 'Could not build questions: ' + e.message); }
    persist(); draw();
  }

  async function answerQ(i, opt) {
    if (S.answers[i] != null || busy) return;
    const q = S.questions[i];
    const right = opt === q.correct;
    S.answers[i] = { sel: opt, right };
    persist(); draw();
    if (!right) {
      // wrong answer → re-teach that concept, differently & simpler
      const r = await aiAsk(`While testing on "${S.topic}", the student answered a question WRONG.\nQuestion: ${q.question}\nOptions: ${q.options.map((o, j) => 'ABCD'[j] + '. ' + o).join(' | ')}\nCorrect: ${'ABCD'[q.correct]}. ${q.options[q.correct] || ''}\nStudent chose: ${'ABCD'[opt]}.\nTASK — Re-explain the exact concept behind this question from scratch, SIMPLER and DIFFERENTLY than before (new angle/analogy), point out the trap in the wrong option, and give one memory hook. Under 250 words, markdown.`, { maxTokens: 1500, temp: 0.35 });
      pushMsg('ai', 'reteach', r.text);
      persist(); draw();
    } else {
      pushMsg('ai', 'praise', pick(['✅ Correct — solid understanding.', '✅ Right! The concept is settling in.', '✅ Exactly right — well done.', '✅ Correct. You are getting this.']));
      persist(); draw();
    }
  }
  const pick = a => a[Math.floor(Math.random() * a.length)];

  async function verify() {
    S.phase = 'verify';
    pushMsg('user', 'action', '🏁 Verify my understanding');
    const right = Object.values(S.answers).filter(a => a.right).length, tot = S.questions.length || 1;
    const r = await aiAsk(`TOPIC taught: "${S.topic}". Concept:\n"""\n${S.concept.slice(0, 2000)}\n"""\nStudent's quiz: ${right}/${tot} correct.\nWrong-answer re-teaching happened: ${Object.values(S.answers).filter(a => !a.right).length} time(s).\nTASK — Final understanding check: (1) give a VERDICT in one line (e.g. "Strong grasp — ready to advance" / "Getting there — one more revision needed"), (2) an understanding score out of 10 with one-line justification, (3) the NEXT step for this student (what to learn next around this topic, linked to their profile: ${profileCtx().slice(0, 400)}), (4) one final quick recall question (with its answer hidden right below). Reply in markdown, under 250 words.`, { maxTokens: 1400, temp: 0.3 });
    S.score = Math.round(right / tot * 100);
    S.verdict = r.text; S.phase = 'done';
    pushMsg('ai', 'verify', r.text);
    store().sessions.unshift({ ...S, msgs: S.msgs.slice(-60) });
    if (store().sessions.length > 25) store().sessions.length = 25;
    persist(); draw();
  }

  /* ---------------- rendering ---------------- */
  function draw() {
    if (S) return drawLesson();
    drawHome();
  }

  function drawHome() {
    const sessions = store().sessions;
    const { w, ws } = weakOf();
    C.view.innerHTML = `
    <div class="page-title"><div><div class="eyebrow">YOUR PERSONAL AI TEACHER</div><h1>Teach Me Mode</h1><p>A teacher that knows your quizzes, attempts, mistakes and revision history. It teaches any topic from zero to advanced: concept → example → questions → re-teach on mistakes → final understanding check.</p></div>
    ${sessions.length ? `<button class="secondary" id="tmHist">🕘 Past lessons (${sessions.length})</button>` : ''}</div>
    <div class="two-col"><div class="panel">
      <h3>🎓 Start a lesson</h3>
      <label>Topic (kuch bhi — zero se advanced)</label>
      <input id="tmTopic" placeholder="e.g. Fundamental Rights · Photosynthesis · Balance of Payments…" style="width:100%"/>
      <label style="margin-top:10px">Your level</label>
      <select id="tmLevel" style="width:100%">${LEVELS.map(l => `<option value="${l}">${LEVEL_LABEL[l]}</option>`).join('')}</select>
      <div class="dialog-actions"><button class="primary full" id="tmStart">▶ Teach me</button></div>
      <div class="muted" id="tmStatus"></div>
    </div>
    <div class="panel"><h3>🧭 Your weak concepts (from real data)</h3>
      ${w.length || ws.length ? `<p class="muted">Ye topics tumhare attempts se nikle hain — in par teacher se padho:</p>
      <div class="chips">${[...ws.map(x => x.key), ...w.map(x => x.key)].map(k => `<button class="chip" data-wtopic="${esc(k)}">◎ ${esc(k)}</button>`).join('')}</div>`
      : `<div class="empty-mini"><span>🧭</span><b>No weak concepts detected yet</b><small>Attempt a few quizzes — the teacher will spot weak concepts and list them here.</small></div>`}
      <div class="notice compact" style="margin-top:12px">The teacher reads: attempt accuracy, subject/topic performance, your mistake notebook and revision state. Explanations adapt to your level automatically.</div>
    </div></div>
    ${sessions.length ? `<div class="panel"><div class="panel-head"><div><h3>Recent lessons</h3><p>Tap to review</p></div></div>${sessions.slice(0, 8).map(s => `<button class="quiz-row" data-sh="${s.id}" style="width:100%;text-align:left"><span class="quiz-symbol">🎓</span><span class="quiz-info"><b>${esc(s.topic)}</b><small>${new Date(s.at).toLocaleString()} · ${s.score != null ? s.score + '% score' : 'in progress'}</small></span></button>`).join('')}</div>` : ''}`;
    $('#tmStart').onclick = () => {
      const t = $('#tmTopic').value.trim();
      if (t.length < 3) return toast('Type the topic first');
      if (!C.AI.aiReady()) { toast('Add an AI key (or sign in) in Settings first'); return C.setTab('settings'); }
      startTeaching(t, $('#tmLevel').value);
    };
    $('#tmTopic').onkeydown = e => { if (e.key === 'Enter') $('#tmStart').click(); };
    $$('[data-wtopic]').forEach(b => b.onclick = () => { $('#tmTopic').value = b.dataset.wtopic; $('#tmStart').click(); });
    $('#tmHist')?.addEventListener('click', () => { S = null; drawHome(); });
    $$('[data-sh]').forEach(b => b.onclick = () => { const s = sessions.find(x => x.id === b.dataset.sh); if (s) { S = s; draw(); } });
  }

  const stepHtml = () => {
    const steps = [['concept', 'Concept'], ['example', 'Example'], ['quiz', 'Questions'], ['verify', 'Verify']];
    const idx = { concept: 0, example: 1, quiz: 2, verify: 3, done: 3 }[S.phase] ?? 0;
    return `<div class="v4-step-row" style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:12px">${steps.map(([k, l], i) => `<div class="v4-step ${i === idx ? 'on' : ''} ${i < idx || S.phase === 'done' ? 'ok' : ''}"><span class="n">${i < idx || S.phase === 'done' ? '✓' : i + 1}</span> ${l}</div>`).join('')}</div>`;
  };

  function drawLesson() {
    const answered = Object.keys(S.answers).length;
    const curQ = S.phase === 'quiz' && S.questions.length ? Math.min(S.qi || 0, S.questions.length - 1) : null;
    C.view.innerHTML = `
    <div class="page-title"><div><div class="eyebrow">TEACH ME MODE · ${esc(S.topic.toUpperCase().slice(0, 40))}</div><h1>🎓 ${esc(S.topic)}</h1><p>Level: ${esc(S.level)} · started ${new Date(S.at).toLocaleString()}${S.score != null ? ` · understanding ${S.score}%` : ''}</p></div>
    <div class="title-actions row"><button class="secondary" id="tmNew">＋ New lesson</button>${S.phase !== 'done' ? '<button class="textbtn danger-text" id="tmQuit">End lesson</button>' : ''}</div></div>
    ${S.phase === 'done' && S.score != null ? `<div class="v4-verdict" style="margin-bottom:14px"><b>Lesson complete — understanding score: ${S.score}%</b><div class="muted">${Object.values(S.answers).filter(a => a.right).length}/${S.questions.length} questions correct</div></div>` : ''}
    ${stepHtml()}
    <div class="panel v4-lesson" id="tmLog">
      ${S.msgs.map((m, i) => {
        if (m.kind === 'action') return `<div class="v4-bubble me"><div class="who">YOU</div>${esc(m.text)}</div>`;
        if (m.kind === 'praise') return `<div class="v4-bubble ai"><div class="who">TEACHER</div>${esc(m.text)}</div>`;
        if (m.kind === 'err') return `<div class="v4-bubble ai"><span class="red-text">✕ ${esc(m.text)}</span></div>`;
        const who = m.kind === 'concept' ? '📖 CONCEPT' : m.kind === 'example' ? '💡 EXAMPLE' : m.kind === 'reteach' ? '🔁 RE-EXPLAINED' : m.kind === 'verify' ? '🏁 FINAL CHECK' : 'TEACHER';
        return `<div class="v4-bubble ai"><div class="who">${who}</div>${C.md(m.text)}</div>`;
      }).join('')}
      ${busy ? '<div class="v4-bubble ai"><span class="ai-dots"><i></i><i></i><i></i></span> <small id="tmStatus">Thinking…</small></div>' : ''}
      ${S.phase === 'quiz' && S.questions.length && curQ != null ? quizHtml(curQ) : ''}
    </div>
    <div class="v4-toolbar" style="margin-top:12px">
      ${S.phase === 'concept' && !busy ? '<button class="secondary" id="tmEx">💡 Give me an example</button><button class="primary" id="tmQuiz">✍️ Now test me</button>' : ''}
      ${S.phase === 'example' && !busy ? '<button class="secondary" id="tmEx2">💡 One more example</button><button class="primary" id="tmQuiz">✍️ Now test me</button>' : ''}
      ${S.phase === 'quiz' && S.questions.length && answered >= S.questions.length && !busy ? '<button class="primary" id="tmVerify">🏁 Verify my understanding</button>' : ''}
      ${S.phase === 'done' ? '<button class="secondary" id="tmAgain">↻ Teach me another topic</button><button class="secondary" id="tmPractice">◷ Practise this topic as a quiz</button>' : ''}
    </div>`;
    const log = $('#tmLog'); log.scrollIntoView({ block: 'end' });
    window.scrollTo(0, document.body.scrollHeight);
    $('#tmNew').onclick = () => { S = null; draw(); };
    $('#tmQuit')?.addEventListener('click', async () => { if (await confirmBox('End this lesson?', 'Progress of this lesson will be kept in history if it has content.', 'End')) { store().sessions.unshift({ ...S, msgs: S.msgs.slice(-60) }); if (store().sessions.length > 25) store().sessions.length = 25; S = null; persist(); draw(); } });
    $('#tmEx')?.addEventListener('click', giveExample);
    $('#tmEx2')?.addEventListener('click', giveExample);
    $('#tmQuiz')?.addEventListener('click', startQuiz);
    $('#tmVerify')?.addEventListener('click', verify);
    $('#tmAgain')?.addEventListener('click', () => { S = null; draw(); });
    $('#tmPractice')?.addEventListener('click', () => C.aiGenerator({ topic: S.topic, source: 'topic', types: ['mcq', 'statement'], count: 10 }));
    $$('[data-opt]').forEach(b => b.onclick = () => answerQ(Number(b.dataset.qi), Number(b.dataset.opt)));
  }

  const quizHtml = qi => {
    const q = S.questions[qi]; const a = S.answers[qi];
    const locked = a != null;
    return `<div class="v4-mcq"><b>Q${qi + 1}. ${esc(q.question)}</b>
      ${q.options.map((o, j) => `<button class="opt ${locked ? (j === q.correct ? 'correct' : a.sel === j ? 'wrong' : '') : ''}" data-qi="${qi}" data-opt="${j}" ${locked ? 'disabled' : ''}>${'ABCD'[j]}. ${esc(o)}</button>`).join('')}
      ${locked ? `<p class="explanation-text">${esc(q.explanation || '')}</p>` : ''}
      <small class="muted">${Object.keys(S.answers).length}/${S.questions.length} answered</small></div>`;
  };

  draw();
}
