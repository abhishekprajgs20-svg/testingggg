// QUIZINOX v4.0 — EXAM COUNTDOWN ROADMAP
// Add unlimited exams / any dated targets. Each gets a live countdown and a dynamic roadmap
// (syllabus → revision → mocks → practice) spread over the remaining days. Completing tasks
// recalibrates the remaining plan. AI can generate a personalised, syllabus-aware roadmap.
export default function roadmapPage(C) {
  const { $, $$, esc, toast, modal, confirmBox } = C;
  const store = () => { const d = C.db; if (!d.roadmap || typeof d.roadmap !== 'object') d.roadmap = { exams: [] }; if (!Array.isArray(d.roadmap.exams)) d.roadmap.exams = []; return d.roadmap; };
  const persist = () => C.save();
  const DAY = 86400000;
  const dayKey = d => new Date(d).toLocaleDateString('en-CA');
  let openId = null;

  const daysLeft = e => Math.ceil((new Date(e.date + 'T09:00:00') - new Date()) / DAY);
  const mkTask = (label, date, phase) => ({ id: C.uid(), label, date, phase, done: false, doneAt: null });
  const uid0 = () => C.uid();

  /* ---------- local roadmap generator: remaining days → phases → dated tasks ---------- */
  function localRoadmap(exam) {
    const left = Math.max(1, daysLeft(exam));
    const today = new Date(); today.setHours(9, 0, 0, 0);
    const dPlus = n => { const d = new Date(today.getTime() + n * DAY); return dayKey(d); };
    const tasks = [];
    const add = (label, dayOff, phase) => tasks.push(mkTask(label, dPlus(dayOff), phase));
    const pctSpan = (p0, p1, labels, phase) => { const a = Math.floor(left * p0), b = Math.max(a + 1, Math.round(left * p1)); labels.forEach((l, i) => add(l, Math.min(b - 1, a + Math.round((b - a - 1) * (labels.length === 1 ? 0 : i / (labels.length - 1)))), phase)); };

    if (left >= 60) {
      pctSpan(0, .45, ['Finish core syllabus — block 1', 'Finish core syllabus — block 2', 'Finish core syllabus — block 3'], 'Syllabus');
      pctSpan(.45, .68, ['Subject-wise consolidation 1', 'Subject-wise consolidation 2'], 'Consolidation');
      pctSpan(.68, .86, ['Full revision cycle 1', 'Full revision cycle 2'], 'Revision');
      pctSpan(.86, .96, ['Mock test 1 + analysis', 'Mock test 2 + analysis', 'Mock test 3 + analysis'], 'Mock tests');
      add('Final rapid revision of weak topics', left - 2, 'Final stretch');
      add('Exam day — light revision + documents ready ✓', left - 1, 'Final stretch');
    } else if (left >= 21) {
      pctSpan(0, .4, ['Finish priority syllabus topics', 'Finish remaining syllabus topics'], 'Syllabus');
      pctSpan(.4, .65, ['First full revision pass'], 'Revision');
      pctSpan(.65, .85, ['Mock test + analysis', 'Second revision pass'], 'Mocks & revision');
      pctSpan(.85, .95, ['Practice weak areas (QUIZINOX analytics)', 'PYQ practice sprint'], 'Practice');
      add('Final revision + exam readiness check', left - 1, 'Final stretch');
    } else if (left >= 7) {
      add('Finish the most important remaining topics', 0, 'Syllabus');
      add('Full revision — pass 1', 1, 'Revision');
      add('Mock test in Exam/OMR mode + deep analysis', 2, 'Mock tests');
      add('Full revision — pass 2', 3, 'Revision');
      add('Revise mistake notebook + difficult questions', 4, 'Revision');
      add('One timed practice set + PYQs', 5, 'Practice');
      add('Light revision only — stay fresh', Math.max(0, left - 1), 'Final stretch');
    } else {
      for (let i = 0; i < left; i++) {
        const plan = ['Revise highest-weight topics', 'Mistake notebook + flashcards', 'One timed mock / section test', 'PYQ sprint + weak topics', 'Light recall + formulas/facts', 'Rest + exam logistics ready', 'Exam day ✓'];
        add(plan[Math.min(i, plan.length - 1)], i, i >= left - 2 ? 'Final stretch' : i % 3 === 2 ? 'Mock & practice' : 'Revision');
      }
    }
    return dedupeTasks(tasks);
  }
  function dedupeTasks(tasks) {
    const seen = new Set(); return tasks.filter(t => { const k = t.date + '|' + t.label; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => a.date.localeCompare(b.date));
  }
  /** Rebalance: mark done tasks stay; remaining open tasks are re-spread over the days left. */
  function rebalance(exam) {
    const left = Math.max(1, daysLeft(exam));
    const today = dayKey(new Date());
    const open = exam.tasks.filter(t => !t.done);
    const done = exam.tasks.filter(t => t.done);
    const fresh = localRoadmap(exam).filter(t => !open.some(o => o.label === t.label));
    const pool = [...open.filter(t => t.date >= today), ...fresh].slice(0, Math.max(open.length, Math.min(40, left * 3)));
    // spread pool evenly across remaining days
    pool.sort((a, b) => a.date.localeCompare(b.date));
    pool.forEach((t, i) => { t.date = dayKey(new Date(Date.now() + Math.max(0, Math.round((i + 0.5) / pool.length * left) - 1) * DAY)); });
    exam.tasks = dedupeTasks([...done, ...pool]);
    exam.adjusted = Date.now();
  }

  function render() {
    const exams = store().exams.slice().sort((a, b) => a.date.localeCompare(b.date));
    const open = exams.find(e => e.id === openId);
    if (openId && !open) openId = null;
    C.view.innerHTML = `
    <div class="page-title"><div><div class="eyebrow">COUNTDOWN · PLAN · ADAPT</div><h1>Exam Roadmap</h1><p>Add as many exams or dated targets as you like — each gets a live countdown and a dynamic roadmap of syllabus, revision, mocks and practice that adjusts as you finish tasks.</p></div>
    <button class="primary" id="rAdd">＋ Add exam / date</button></div>
    ${exams.length ? `<div class="stats-grid">${exams.map(e => {
      const dl = daysLeft(e); const done = (e.tasks || []).filter(t => t.done).length, tot = (e.tasks || []).length;
      const pctDone = tot ? Math.round(done / tot * 100) : 0;
      const cls = dl <= 7 ? 'red-text' : dl <= 30 ? 'amber-text' : 'green-text';
      return `<button class="stat-card" data-open="${e.id}" style="text-align:left;cursor:pointer"><small>${esc(e.name.toUpperCase().slice(0, 34))}</small><strong class="${cls}">${dl > 0 ? dl + 'd' : dl === 0 ? 'TODAY' : 'done'}</strong><span>${new Date(e.date + 'T09:00:00').toLocaleDateString()} · ${done}/${tot} tasks (${pctDone}%)</span></button>`;
    }).join('')}</div>` : `<div class="v4-empty"><span class="big">🗓</span><b>No exams yet</b><small>Add your first exam date — the roadmap builds itself from the days remaining.</small></div>`}
    <div id="rMain">${open ? examHtml(open) : ''}</div>`;
    $('#rAdd').onclick = () => addDialog();
    $$('[data-open]').forEach(b => b.onclick = () => { openId = b.dataset.open; render(); window.scrollTo(0, 0); });
    if (open) wireExam(open);
  }

  const examHtml = e => {
    const dl = daysLeft(e);
    const tasks = (e.tasks || []).slice().sort((a, b) => a.date.localeCompare(b.date));
    const today = dayKey(new Date());
    const done = tasks.filter(t => t.done).length;
    const phases = [...new Set(tasks.map(t => t.phase))];
    const upcoming = tasks.filter(t => !t.done);
    // countdown digits
    const abs = Math.abs(dl);
    const dD = Math.floor(abs / 1) , wks = Math.floor(abs / 7);
    const cds = dl >= 0 ? [['DAYS', abs], ['WEEKS', wks], ['TASKS LEFT', upcoming.length]] : [['DAYS OVER', abs], ['WEEKS', wks], ['TASKS LEFT', upcoming.length]];
    return `<div class="panel" style="margin-top:16px">
    <div class="panel-head"><div><h3>🗓 ${esc(e.name)}</h3><p>Exam date: <b>${new Date(e.date + 'T09:00:00').toLocaleDateString()}</b> · ${dl > 0 ? `<b class="${dl <= 7 ? 'red-text' : dl <= 30 ? 'amber-text' : 'green-text'}">${dl} day${dl === 1 ? '' : 's'} left</b>` : dl === 0 ? '<b class="red-text">EXAM TODAY — all the best!</b>' : 'date has passed'} · roadmap ${e.ai ? '✦ AI-generated' : 'auto-generated'}${e.adjusted ? ` · adjusted ${new Date(e.adjusted).toLocaleDateString()}` : ''}</p></div>
    <div class="title-actions row"><button class="secondary" id="rAi">✦ AI roadmap</button><button class="secondary" id="rRe">↻ Rebalance</button><button class="textbtn" id="rEdit">Edit</button><button class="textbtn danger-text" id="rDel">Delete</button></div></div>
    <div class="v4-digits">${cds.map(([l, v]) => `<div class="v4-digit"><b>${v}</b><small>${l}</small></div>`).join('')}</div>
    <div class="v4-prog" style="margin-top:14px"><i style="width:${tasks.length ? Math.round(done / tasks.length * 100) : 0}%"></i></div>
    <p class="muted">${done}/${tasks.length} tasks complete — finish tasks and the remaining plan re-spreads itself over the days left.</p>
    ${e.syllabusNote ? `<details class="u-det"><summary>Syllabus / focus note</summary><div class="u-body">${esc(e.syllabusNote)}</div></details>` : ''}
    <div class="v4-toolbar"><button class="secondary" id="rAddTask">＋ Add task</button><button class="secondary" id="rMock">◷ Take a timed mock now</button></div>
    ${phases.map(ph => {
      const list = tasks.filter(t => t.phase === ph);
      return `<h4 style="margin:16px 0 6px"><span class="v4-phase">${esc(ph)}</span> ${list.filter(t => t.done).length}/${list.length}</h4>
      <div class="v4-timeline">${list.map(t => `
        <label class="v4-task ${t.done ? 'done' : ''} ${!t.done && t.date < today ? 'amber-text' : ''}">
          <input type="checkbox" data-tid="${t.id}" ${t.done ? 'checked' : ''}/>
          <span>${esc(t.label)}<small>${new Date(t.date + 'T09:00:00').toLocaleDateString()}${!t.done && t.date < today ? ' · overdue' : ''}${t.doneAt ? ' · done ' + new Date(t.doneAt).toLocaleDateString() : ''}</small></span>
          <button class="mini delete" data-tdel="${t.id}" title="Remove">×</button>
        </label>`).join('')}</div>`;
    }).join('') || '<div class="empty-mini"><b>No tasks</b><small>Tap “✦ AI roadmap” or “↻ Rebalance” to generate the plan.</small></div>'}</div>`;
  };

  function wireExam(e) {
    $$('[data-tid]').forEach(c => c.onchange = () => {
      const t = e.tasks.find(x => x.id === c.dataset.tid); if (!t) return;
      t.done = c.checked; t.doneAt = c.checked ? Date.now() : null;
      if (c.checked) rebalance(e);
      persist(); render();
    });
    $$('[data-tdel]').forEach(b => b.onclick = async () => { if (await confirmBox('Remove task?', '', 'Remove', true)) { e.tasks = e.tasks.filter(x => x.id !== b.dataset.tdel); persist(); render(); } });
    $('#rDel').onclick = async () => { if (await confirmBox('Delete this exam?', `“${e.name}” and its roadmap will be removed.`, 'Delete', true)) { store().exams = store().exams.filter(x => x.id !== e.id); openId = null; persist(); render(); } };
    $('#rEdit').onclick = () => addDialog(e);
    $('#rRe').onclick = () => { rebalance(e); persist(); render(); toast('Roadmap rebalanced over the days left ✓'); };
    $('#rMock').onclick = () => C.setTab('mocks');
    $('#rAddTask').onclick = () => {
      const { el, close } = modal(`<h2>Add task</h2><label>Task<input id="rtLabel" placeholder="e.g. Revise Polity — constitutional bodies"/></label><div class="form-grid"><label>Date<input id="rtDate" type="date" value="${e.date >= dayKey(new Date()) ? dayKey(new Date()) : e.date}" min="${dayKey(new Date())}" max="${e.date}"/></label><label>Phase<input id="rtPhase" value="Syllabus"/></label></div><div class="dialog-actions"><button class="primary" id="rtOk">Add</button></div>`);
      $('#rtOk', el).onclick = () => { const l = $('#rtLabel', el).value.trim(); if (!l) return; e.tasks.push(mkTask(l, $('#rtDate', el).value || dayKey(new Date()), $('#rtPhase', el).value.trim() || 'General')); persist(); close(); render(); };
    };
    $('#rAi').onclick = async () => {
      if (!C.AI.aiReady()) { toast('Add an AI key (or sign in) in Settings first'); return C.setTab('settings'); }
      const b = $('#rAi'); b.disabled = true; b.textContent = 'AI is planning…';
      try {
        const weak = (() => { try { return C.buildProfile().topics.filter(t => t.total >= 2).sort((a, b) => a.acc - b.acc).slice(0, 8).map(t => `${t.key} (${t.acc}%)`); } catch { return []; } })();
        const left = Math.max(1, daysLeft(e));
        const r = await C.AI.aiCall(`You are an expert exam coach. Create a personalised day-wise roadmap for this student.\nExam: "${e.name}" on ${e.date} — ${left} days left.\nSyllabus / focus note: ${e.syllabusNote || 'not provided — assume a standard syllabus'}.\nStudent's weak topics from real quiz data: ${weak.join('; ') || 'no data yet'}.\nRules: tasks must fit inside the ${left} remaining days; cover syllabus completion, revision cycles, mock tests and practice; weak topics get extra practice slots; be realistic (3-6 tasks/day max); start from tomorrow.\nReturn ONLY JSON: {"phases":["Syllabus","Revision","Mock tests","Practice"],"tasks":[{"dayOffset":1,"label":"...","phase":"Syllabus"}]}\ndayOffset 1 = tomorrow, up to ${left} = exam day. Give ${Math.min(60, Math.max(12, left * 3))} tasks.`, { json: true, maxTokens: 3800, temperature: 0.4, onStatus: m => { b.textContent = m; } });
        const data = C.AI.parseJsonLoose(r.text);
        const today = new Date(); today.setHours(9, 0, 0, 0);
        e.tasks = dedupeTasks((data.tasks || []).map(t => mkTask(String(t.label || '').slice(0, 140), dayKey(today.getTime() + Math.max(0, Math.min(left, Number(t.dayOffset) || 1)) * DAY), String(t.phase || 'Plan'))));
        e.ai = true; e.aiModel = C.AI.modelLabel(r.provider, r.model); e.adjusted = Date.now();
        persist(); render(); toast('AI roadmap generated ✓');
      } catch (err) { toast('✕ ' + err.message, 4500); }
      finally { b.disabled = false; b.textContent = '✦ AI roadmap'; }
    };
  }

  function addDialog(exam) {
    const isNew = !exam;
    const e = exam || { id: uid0(), name: '', date: dayKey(Date.now() + 60 * DAY), syllabusNote: '', tasks: [] };
    const { el, close } = modal(`<div class="eyebrow">EXAM ROADMAP</div><h2>${isNew ? 'Add exam / dated target' : 'Edit exam'}</h2>
      <div class="form-grid"><label>Name<input id="reName" value="${esc(e.name)}" placeholder="e.g. UPSC CSE Prelims 2027 · CA Final · Semester exam"/></label>
      <label>Exam date<input id="reDate" type="date" value="${e.date}" min="${dayKey(new Date())}"/></label></div>
      <label>Syllabus / focus note (optional — makes the AI roadmap personal)<textarea id="reNote" rows="3" placeholder="e.g. Polity + Modern History + Economy pending; CSAT needs practice…">${esc(e.syllabusNote || '')}</textarea></label>
      <div class="dialog-actions"><button class="primary" id="reOk">${isNew ? '＋ Add & build roadmap' : 'Save'}</button></div>`);
    $('#reOk', el).onclick = () => {
      const name = $('#reName', el).value.trim(); if (!name) return toast('Give the exam a name');
      e.name = name; e.date = $('#reDate', el).value || e.date; e.syllabusNote = $('#reNote', el).value.trim();
      if (isNew) { e.tasks = localRoadmap(e); store().exams.push(e); openId = e.id; }
      persist(); close(); render();
      toast(isNew ? 'Exam added — roadmap built ✓' : 'Saved ✓');
    };
    setTimeout(() => $('#reName', el)?.focus(), 30);
  }

  render();
}
