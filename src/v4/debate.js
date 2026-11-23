// QUIZINOX v4.0 — DISCUSSION ROOM (Debate With AI)
// Six discussion modes: Debate, Group Discussion, UPSC Interview, Pros & Cons, Ethical
// Dilemma, Mains Answer. Type OR speak arguments (Web Speech API — works in Chrome/Android
// WebView; the app asks for the microphone permission at first use). At the end the AI
// judges factual accuracy, logic, rebuttal handling and argument quality, and gives a verdict.
export default function debatePage(C) {
  const { $, $$, esc, toast, modal, confirmBox } = C;
  const store = () => { const d = C.db; if (!d.debate || typeof d.debate !== 'object') d.debate = { sessions: [] }; if (!Array.isArray(d.debate.sessions)) d.debate.sessions = []; return d.debate; };
  const persist = () => C.save();

  const MODES = {
    debate: { icon: '⚖', name: 'Debate', desc: 'AI takes one side, you take the other. Present arguments, AI counters, you improve.', userSide: true, rounds: 6, system: 'You are a sharp but fair debate opponent in a competitive-exam practice app. Take the side assigned to you and defend it with strong, factual arguments. Counter the student\'s points directly. Keep replies under 180 words, persuasive and structured.' },
    gd: { icon: '👥', name: 'Group Discussion (simulated)', desc: 'A simulated panel GD: AI plays 3 members with different personalities; you steer the discussion.', userSide: false, rounds: 6, system: 'You are simulating a 3-member panel for a group discussion practice (personalities: aggressive fact-dropper, calm balancer, devils-advocate). React as all three briefly, then hand the floor back to the student. Keep the GD moving; stay realistic and under 200 words total.' },
    interview: { icon: '🎙', name: 'UPSC Interview Discussion', desc: 'Mock interview: AI is the board, asks layered questions and probes your answers like the real PT.', userSide: false, rounds: 8, system: 'You are a UPSC personality-test board member. Ask one layered question at a time (based on the student\'s answers and the topic), listen, then probe deeper or note what was good/missing. Be formal, observant and constructive. Under 160 words per turn.' },
    proscons: { icon: '⚖️', name: 'Pros & Cons Analysis', desc: 'Balanced analysis of any issue — build both sides, then a reasoned conclusion.', userSide: false, rounds: 4, system: 'You are an analytical coach. For the chosen issue, help the student build the strongest PROS and CONS lists, then a balanced conclusion. Challenge one-sided thinking. Under 180 words per turn.' },
    ethics: { icon: '🧭', name: 'Ethical Dilemma', desc: 'GS-IV style dilemmas: choose, justify, face the consequences, refine your stand.', userSide: false, rounds: 5, system: 'You are an ethics (GS-IV) coach. Present dilemmas, push the student to justify their choice with ethical frameworks (utilitarian, deontological, virtue, admin ethics), and complicate the scenario one step at a time. Under 180 words per turn.' },
    mains: { icon: '📝', name: 'Mains Answer Discussion', desc: 'Structure a 250-word GS answer together: intro → body → conclusion, then improve it.', userSide: false, rounds: 5, system: 'You are a UPSC Mains answer-writing mentor. Help the student build a strong answer: demand directives, structure (intro-body-conclusion), dimensions, examples and a way-forward. Critique drafts honestly. Under 200 words per turn.' },
  };
  const SUGGESTED = ['Should India adopt simultaneous elections?', 'Is a cashless economy truly inclusive?', 'Should AI development be globally regulated?', 'One nation, one election — boon or burden?', 'Is social media a threat to democracy?', 'Should civics be compulsory in schools?'];

  let S = null, busy = false, abort = null, rec = null;

  /* ---------------- session ---------------- */
  function newSession(mode, topic, side) {
    return { id: C.uid(), mode, topic, side: side || '', at: Date.now(), msgs: [], round: 0, done: false, scores: null, verdict: null };
  }
  const modeOf = () => MODES[S.mode];

  async function aiTurn(userText) {
    busy = true; abort = new AbortController(); draw();
    const m = modeOf();
    const hist = S.msgs.slice(-8).map(x => `${x.role === 'you' ? 'Student' : 'AI'}: ${x.text.slice(0, 500)}`).join('\n');
    let task;
    if (S.round === 0 && S.msgs.filter(x => x.role === 'you').length === 0) {
      task = m.userSide
        ? `The student will argue FOR/AGAINST (their side: ${S.side}). Your side is the OPPOSITE. Open the discussion: state your position on "${S.topic}" with your strongest opening argument, then invite the student's rebuttal.`
        : `Topic: "${S.topic}". Open this ${m.name} session properly (introduce the frame / first question / first position as fits the mode) and invite the student's response.`;
    } else {
      task = `The student just said:\n"""\n${userText.slice(0, 1200)}\n"""\nRespond in character for the "${m.name}" mode: counter / probe / build on it, and keep the discussion moving.`;
    }
    try {
      const r = await C.AI.aiCall(`${task}\n\nEarlier discussion:\n${hist || '(just starting)'}\n\nStudent profile context: ${(() => { try { const p = C.buildProfile(); return p.attempts ? `${p.attempts} attempts · ${p.overall.acc}% accuracy` : 'new student'; } catch { return 'n/a'; } })()}.\nReply in ${C.db.settings.tutorLang || 'English'}.`, { json: false, maxTokens: 900, temperature: 0.65, signal: abort.signal, system: m.system, onStatus: s => { const e = $('#dbStatus'); if (e) e.textContent = s; } });
      S.round++; S.msgs.push({ role: 'ai', text: r.text, at: Date.now() });
    } catch (e) {
      if (e.code !== 'abort') S.msgs.push({ role: 'ai', text: '⚠ ' + e.message, err: true, at: Date.now() });
    } finally { busy = false; abort = null; }
    persist(); draw();
  }

  async function evaluate() {
    busy = true; draw();
    S.done = true;
    const hist = S.msgs.slice(-40).map(x => `${x.role === 'you' ? 'Student' : 'AI'}: ${x.text.slice(0, 600)}`).join('\n');
    try {
      const r = await C.AI.aiCall(`You are the AI JUDGE of a "${modeOf().name}" practice session.\nTopic: "${S.topic}"${S.side ? `\nStudent's side: ${S.side}` : ''}\nFull discussion:\n"""\n${hist}\n"""\nEvaluate the STUDENT only. Score each criterion 1-10 and give a one-line justification each. Then a 3-4 line overall assessment and a final verdict line (who performed better and why), plus 2 concrete improvements.\nReturn ONLY JSON: {"scores":{"Factual accuracy":8,"Logical reasoning":7,"Argument quality":8,"Handling counterpoints":7,"Structure & clarity":8},"overall":"...","verdict":"...","improvements":["",""]}`, { json: true, maxTokens: 1400, temperature: 0.3 });
      const d = C.AI.parseJsonLoose(r.text);
      S.scores = d.scores || {}; S.overall = d.overall || ''; S.verdict = d.verdict || ''; S.improvements = d.improvements || [];
    } catch (e) { S.msgs.push({ role: 'ai', text: 'Evaluation failed: ' + e.message, err: true }); }
    finally { busy = false; }
    store().sessions.unshift({ ...S, msgs: S.msgs.slice(-40) });
    if (store().sessions.length > 20) store().sessions.length = 20;
    persist(); draw();
  }

  /* ---------------- voice ---------------- */
  function attachMic(btn, inp) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { btn.disabled = true; btn.title = 'Voice input not supported in this browser — typing works everywhere'; return; }
    btn.onclick = async () => {
      if (rec) { rec.stop(); return; }
      // ask for microphone permission first (mobile + desktop)
      try { await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { toast('Microphone permission needed for voice input — allow it and tap again'); return; }
      rec = new SR();
      rec.lang = (C.db.settings.tutorLang === 'Hindi' || C.db.settings.tutorLang === 'Hinglish') ? 'hi-IN' : 'en-IN';
      rec.continuous = false; rec.interimResults = false;
      rec.onresult = e => { const t = [...e.results].map(x => x[0].transcript).join(' '); inp.value = (inp.value ? inp.value + ' ' : '') + t; };
      rec.onerror = e => { toast(e.error === 'not-allowed' ? 'Microphone blocked — allow mic permission' : 'Voice input failed: ' + e.error); };
      rec.onend = () => { rec = null; btn.classList.remove('rec'); btn.textContent = '🎤'; };
      btn.classList.add('rec'); btn.textContent = '⏹';
      try { rec.start(); } catch { rec = null; btn.classList.remove('rec'); btn.textContent = '🎤'; }
    };
  }

  /* ---------------- rendering ---------------- */
  function draw() { S ? drawRoom() : drawHome(); }

  function drawHome() {
    const sessions = store().sessions;
    C.view.innerHTML = `
    <div class="page-title"><div><div class="eyebrow">THINK · ARGUE · WIN</div><h1>Discussion Room</h1><p>Debate and discuss with AI — six modes. Bolke ya type karke arguments do; AI counter karega. Session ke end mein AI judge factual accuracy, logic aur argument quality score karega.</p></div></div>
    <div class="v4-sel-list">${Object.entries(MODES).map(([k, m]) => `<button class="v4-sel" data-mode="${k}"><b>${m.icon} ${m.name}</b><small>${m.desc}</small></button>`).join('')}</div>
    <div class="panel" style="margin-top:16px"><h3>💬 Suggested topics</h3><div class="chips">${SUGGESTED.map(t => `<button class="chip" data-stopic="${esc(t)}">${esc(t)}</button>`).join('')}</div></div>
    ${sessions.length ? `<div class="panel"><div class="panel-head"><div><h3>Past sessions</h3></div></div>${sessions.slice(0, 6).map(s => { const avg = S ? 0 : avgScore(s); return `<button class="quiz-row" data-sh="${s.id}" style="width:100%;text-align:left"><span class="quiz-symbol">${MODES[s.mode].icon}</span><span class="quiz-info"><b>${esc(s.topic)}</b><small>${MODES[s.mode].name} · ${new Date(s.at).toLocaleString()}${s.done ? ` · judge avg ${avg}/10` : ''}</small></span></button>`; }).join('')}</div>` : ''}`;
    $$('[data-mode]').forEach(b => b.onclick = () => startDialog(b.dataset.mode));
    $$('[data-stopic]').forEach(b => b.onclick = () => startDialog('debate', b.dataset.stopic));
    $$('[data-sh]').forEach(b => b.onclick = () => { const s = sessions.find(x => x.id === b.dataset.sh); if (s) { S = s; draw(); } });
  }
  const avgScore = s => { const v = Object.values(s.scores || {}); return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : '—'; };

  function startDialog(mode, presetTopic = '') {
    const m = MODES[mode];
    const { el, close } = modal(`<div class="eyebrow">${m.icon} ${m.name.toUpperCase()}</div><h2>Start a session</h2><p>${m.desc}</p>
      <label>Topic / question<input id="dbTopic" value="${esc(presetTopic)}" placeholder="e.g. Should India adopt simultaneous elections?"/></label>
      ${m.userSide ? `<label>Your side<select id="dbSide"><option value="FOR">FOR (support)</option><option value="AGAINST">AGAINST (oppose)</option></select></label>` : ''}
      <div class="muted">🎤 Voice input is available inside the room — the app will ask for microphone permission once. ${m.rounds} suggested exchanges; end anytime.</div>
      <div class="dialog-actions"><button class="primary" id="dbGo">▶ Start</button></div>`);
    $('#dbGo', el).onclick = () => {
      const topic = $('#dbTopic', el).value.trim();
      if (topic.length < 5) return toast('Type the topic first');
      if (!C.AI.aiReady()) { toast('Add an AI key (or sign in) in Settings first'); return C.setTab('settings'); }
      S = newSession(mode, topic, m.userSide ? $('#dbSide', el).value : '');
      close(); draw();
      aiTurn(''); // AI opens
    };
    $('#dbTopic', el).onkeydown = e => { if (e.key === 'Enter') $('#dbGo', el).click(); };
    setTimeout(() => $('#dbTopic', el)?.focus(), 30);
  }

  function drawRoom() {
    const m = modeOf();
    const dots = Array.from({ length: m.rounds }, (_, i) => `<i style="width:9px;height:9px;border-radius:50%;display:inline-block;background:${i < S.round ? 'var(--accent,#6ea8fe)' : 'rgba(140,150,170,.3)'};margin-right:4px"></i>`).join('');
    C.view.innerHTML = `
    <div class="page-title"><div><div class="eyebrow">${m.icon} ${m.name.toUpperCase()} · ${S.done ? 'JUDGED' : 'ROUND ' + Math.min(S.round + 1, m.rounds)}</div><h1>${esc(S.topic)}</h1><p>${S.side ? `You argue <b>${S.side}</b> · AI takes the opposite side · ` : ''}<span>${dots}</span></p></div>
    <div class="title-actions row"><button class="secondary" id="dbEnd">${S.done ? '🏁 View judgement' : '🏁 End & get judged'}</button><button class="textbtn danger-text" id="dbLeave">Leave</button></div></div>
    ${S.done && S.scores ? judgeHtml() : ''}
    <div class="panel v4-lesson" id="dbLog">
      ${S.msgs.map(x => x.role === 'you' ? `<div class="v4-bubble me"><div class="who">YOU${S.side ? ' · ' + S.side : ''}</div>${esc(x.text)}</div>` : `<div class="v4-bubble ai"><div class="who">${m.icon} AI${x.err ? ' · ERROR' : ''}</div>${x.err ? `<span class="red-text">${esc(x.text)}</span>` : C.md(x.text)}</div>`).join('')}
      ${busy ? `<div class="v4-bubble ai"><span class="ai-dots"><i></i><i></i><i></i></span> <small id="dbStatus">Thinking…</small></div>` : ''}
    </div>
    ${!S.done ? `<div class="panel" style="margin-top:12px"><div class="v4-toolbar" style="margin:0">
      <input id="dbIn" placeholder="Type your argument… (or tap 🎤 and speak)" style="flex:1;min-width:200px"/>
      <button class="secondary v4-mic" id="dbMic" title="Speak your argument">🎤</button>
      <button class="primary" id="dbSend">Send ➤</button></div>
      <small class="muted">💡 Be specific · use evidence · answer the counterpoint directly. Voice works on Android app & Chrome/Edge desktop.</small></div>` : ''}`;
    const log = $('#dbLog'); log.scrollIntoView({ block: 'end' });
    window.scrollTo(0, document.body.scrollHeight);
    $('#dbLeave').onclick = async () => { if (await confirmBox('Leave this session?', 'Unsaved discussion will be kept in history.', 'Leave')) { if (S.msgs.length && !S.done) { store().sessions.unshift({ ...S, msgs: S.msgs.slice(-40) }); if (store().sessions.length > 20) store().sessions.length = 20; persist(); } S = null; draw(); } };
    $('#dbEnd').onclick = async () => { if (S.msgs.filter(x => x.role === 'you').length < 1) return toast('Give at least one argument first'); if (busy) return; if (!S.done) await evaluate(); else { const p = $('#judgePanel'); p?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } };
    const inp = $('#dbIn');
    if (inp) {
      const send = () => { const v = inp.value.trim(); if (!v || busy) return; inp.value = ''; S.msgs.push({ role: 'you', text: v, at: Date.now() }); persist(); draw(); aiTurn(v); };
      $('#dbSend').onclick = send;
      inp.onkeydown = e => { if (e.key === 'Enter') send(); };
      attachMic($('#dbMic'), inp);
      inp.focus();
    }
  }

  const judgeHtml = () => {
    const entries = Object.entries(S.scores || {});
    return `<div class="panel" id="judgePanel" style="margin-bottom:14px"><div class="panel-head"><div><h3>🏁 AI Judge</h3><p>Factual accuracy · logical reasoning · argument quality — evaluated on the full discussion</p></div></div>
    ${entries.length ? `<div class="v4-scorebar">${entries.map(([k, v]) => `<div class="row"><span>${esc(k)}</span><div class="bar"><i style="width:${Math.max(0, Math.min(100, Number(v) * 10))}%"></i></div><b>${v}/10</b></div>`).join('')}</div>` : '<div class="muted">Scores unavailable.</div>'}
    ${S.overall ? `<div class="v4-ai-out" style="margin-top:12px"><b>Overall assessment</b>${C.md(S.overall)}</div>` : ''}
    ${S.verdict ? `<div class="v4-verdict" style="margin-top:12px">🏆 <b>${esc(S.verdict)}</b></div>` : ''}
    ${(S.improvements || []).length ? `<div class="notice compact" style="margin-top:12px"><b>To improve:</b><ul>${S.improvements.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>` : ''}</div>`;
  };

  draw();
}
