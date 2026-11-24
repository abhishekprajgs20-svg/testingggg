// Detailed OMR evaluation after submission + export of the OMR sheet (as submitted / evaluated) as PNG or PDF.
import { C, setC, esc, $, $$, toast, download, slug } from './core.js';
const LET = i => String.fromCharCode(65 + i);
const fmtT = s => (s >= 3600 ? `${Math.floor(s / 3600)}h ${Math.floor(s % 3600 / 60)}m` : `${Math.floor(s / 60)}m ${s % 60}s`);
function evalRows(a) {
  const neg = Number(a.negative) || 0;
  return a.details.map((d, i) => { const opts = d.options.slice().sort((x, y) => x.original - y.original); const sel = d.selected, ok = d.status === 'correct', bad = d.status === 'wrong';
    return { n: i + 1, sel, cor: d.correct, status: d.status, marks: ok ? 1 : bad ? -neg : 0, topic: d.topic || '', nopt: Math.max(4, opts.length), text: d.question }; });
}
/** Draws the OMR sheet (A4 portrait pages) to canvases. mode: 'evaluated' shows the answer key; 'submitted' shows only the student's marks. */
export function drawSheets(a, mode = 'evaluated') {
  const rows = evalRows(a), total = Math.max(rows.length, Number(a.omrSheet) || 0); const W = 1240, H = 1754, PER_COL = 25, COLS = 4, PER_PAGE = PER_COL * COLS; const pages = Math.ceil(total / PER_PAGE); const out = [];
  for (let p = 0; p < pages; p++) {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    g.fillStyle = '#fff7ee'; g.fillRect(0, 0, W, H); g.strokeStyle = '#b05a2a'; g.lineWidth = 4; g.strokeRect(24, 24, W - 48, H - 48);
    g.fillStyle = '#7a3b17'; g.font = 'bold 40px sans-serif'; g.fillText('OMR ANSWER SHEET' + (mode === 'evaluated' ? ' — EVALUATED' : ' — AS SUBMITTED'), 60, 92);
    g.font = '26px sans-serif'; g.fillStyle = '#3a2a20'; g.fillText(String(a.quizTitle || '').slice(0, 70), 60, 134);
    g.font = '22px sans-serif'; g.fillText(`${new Date(a.date).toLocaleString()}   ·   Score ${a.score}/${a.total} (${a.percent}%)   ·   Correct ${a.correct}   Wrong ${a.wrong}   Blank ${a.blank}   ·   Page ${p + 1}/${pages}`, 60, 170);
    g.strokeStyle = '#b05a2a'; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(60, 192); g.lineTo(W - 60, 192); g.stroke(); g.setLineDash([]);
    const colW = (W - 120) / COLS, top = 238, rh = 56;
    for (let k = 0; k < PER_PAGE; k++) {
      const qi = p * PER_PAGE + k; if (qi >= total) break; const col = Math.floor(k / PER_COL), r = k % PER_COL; const x0 = 60 + col * colW, y = top + r * rh; const row = rows[qi];
      g.font = 'bold 22px sans-serif'; g.fillStyle = '#5a2e14'; g.textAlign = 'right'; g.fillText(String(qi + 1), x0 + 44, y + 8); g.textAlign = 'left';
      const n = row ? row.nopt : 4; const sp = Math.min(44, (colW - 130) / n), rad = sp < 38 ? 14 : 16;
      for (let o = 0; o < n; o++) {
        const cx = x0 + 80 + o * sp; const marked = row && row.sel === o, isKey = row && row.cor === o && mode === 'evaluated';
        g.beginPath(); g.arc(cx, y, rad, 0, Math.PI * 2);
        if (marked) { g.fillStyle = mode === 'evaluated' ? (row.status === 'correct' ? '#1f9d63' : '#d8434f') : '#2a2a2a'; g.fill(); }
        g.lineWidth = isKey && !marked ? 5 : 2.2; g.strokeStyle = isKey ? '#1f9d63' : '#b05a2a'; g.stroke();
        g.font = 'bold 15px sans-serif'; g.fillStyle = marked ? '#fff' : isKey ? '#1f9d63' : '#b05a2a'; g.textAlign = 'center'; g.fillText(LET(o), cx, y + 6); g.textAlign = 'left';
      }
      if (mode === 'evaluated' && row) { g.font = 'bold 20px sans-serif'; g.fillStyle = row.status === 'correct' ? '#1f9d63' : row.status === 'wrong' ? '#d8434f' : '#8a8a8a'; g.fillText(row.status === 'correct' ? '✓' : row.status === 'wrong' ? '✗' : '–', x0 + 80 + n * sp - 4, y + 7); }
    }
    g.font = '19px sans-serif'; g.fillStyle = '#6a5a4a'; g.fillText(mode === 'evaluated' ? 'Legend: green filled = your correct answer · red filled = your wrong answer · green ring = correct option · – = unattempted' : 'Dark bubble = option marked by the student.', 60, H - 52);
    out.push(cv);
  }
  return out;
}
const toBlob = (cv, type = 'image/png', q = 0.92) => new Promise(r => cv.toBlob(r, type, q));
async function exportPng(a, mode) { const cvs = drawSheets(a, mode); for (let i = 0; i < cvs.length; i++) await download(`${slug(a.quizTitle)}-omr-${mode}${cvs.length > 1 ? '-p' + (i + 1) : ''}.png`, await toBlob(cvs[i]), 'image/png'); }
async function exportPdf(a, mode, full) {
  const { jsPDF } = await C.getJsPDF(); const doc = new jsPDF({ unit: 'mm', format: 'a4' }); const cvs = drawSheets(a, mode);
  cvs.forEach((cv, i) => { if (i) doc.addPage(); doc.addImage(cv.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, 210, 297); });
  if (full) {
    const rows = evalRows(a); doc.addPage(); let y = 18; const safe = s => String(s ?? '').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[–—]/g, '-').replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.text('OMR evaluation - question-wise', 14, y); y += 7; doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.text(safe(`${a.quizTitle}  |  ${new Date(a.date).toLocaleString()}  |  Score ${a.score}/${a.total}  |  Negative marking ${a.negative}`), 14, y); y += 7;
    const head = () => { doc.setFont('helvetica', 'bold'); doc.text('Q', 14, y); doc.text('Marked', 26, y); doc.text('Correct', 48, y); doc.text('Result', 72, y); doc.text('Marks', 96, y); doc.text('Topic', 114, y); y += 2; doc.line(14, y, 196, y); y += 4; doc.setFont('helvetica', 'normal'); }; head();
    rows.forEach(r => { if (y > 280) { doc.addPage(); y = 16; head(); } doc.text(String(r.n), 14, y); doc.text(r.sel == null ? '-' : LET(r.sel), 26, y); doc.text(LET(r.cor), 48, y); doc.setTextColor(r.status === 'correct' ? 20 : r.status === 'wrong' ? 190 : 120, r.status === 'correct' ? 140 : r.status === 'wrong' ? 40 : 120, r.status === 'correct' ? 80 : r.status === 'wrong' ? 50 : 120); doc.text(r.status === 'correct' ? 'Correct' : r.status === 'wrong' ? 'Wrong' : 'Unattempted', 72, y); doc.setTextColor(20, 24, 36); doc.text((r.marks > 0 ? '+' : '') + r.marks, 96, y); doc.text(safe(r.topic).slice(0, 44), 114, y); y += 5.2; });
  }
  await download(`${slug(a.quizTitle)}-omr-${full ? 'full-evaluation' : mode}.pdf`, doc.output('blob'), 'application/pdf');
}
export function mount(host, a, ctx) {
  setC(ctx); if (!host) return; const rows = evalRows(a); const neg = Number(a.negative) || 0; const att = a.correct + a.wrong; const negMarks = +(a.wrong * neg).toFixed(2);
  const bySec = (a.sections || []).map(s => `<tr><td>${esc(s.name)}</td><td>${s.total}</td><td>${s.correct}</td><td>${s.wrong}</td><td>${s.blank}</td><td>${s.score}</td></tr>`).join('');
  let filter = 'all';
  const drawTable = () => { const list = rows.filter(r => filter === 'all' || r.status === filter); $('#oeBody', host).innerHTML = list.map(r => `<tr class="oe-${r.status}"><td>${r.n}</td><td>${r.sel == null ? '—' : LET(r.sel)}</td><td>${LET(r.cor)}</td><td>${r.status === 'correct' ? '✓ Correct' : r.status === 'wrong' ? '✗ Wrong' : '– Unattempted'}</td><td>${r.marks > 0 ? '+' : ''}${r.marks}</td><td>${esc(r.topic)}</td></tr>`).join('') || '<tr><td colspan="6">Nothing in this filter.</td></tr>'; $$('[data-oef]', host).forEach(b => b.classList.toggle('active', b.dataset.oef === filter)); };
  host.innerHTML = `<div class="panel-head"><div><h3>▦ OMR evaluation</h3><p>Detailed evaluation of your submitted OMR sheet. Export the sheet as an image or PDF.</p></div></div>
  <div class="stats-grid result-stats"><div class="stat-card"><small>ATTEMPTED</small><strong>${att}</strong></div><div class="stat-card"><small>CORRECT</small><strong class="green-text">${a.correct}</strong></div><div class="stat-card"><small>WRONG</small><strong class="red-text">${a.wrong}</strong></div><div class="stat-card"><small>UNATTEMPTED</small><strong>${a.blank}</strong></div><div class="stat-card"><small>NEGATIVE MARKS</small><strong>${negMarks ? '−' + negMarks : '0'}</strong></div><div class="stat-card"><small>ACCURACY</small><strong>${att ? Math.round(a.correct / att * 100) : 0}%</strong></div><div class="stat-card"><small>TIME</small><strong>${a.durationSec ? fmtT(a.durationSec) : '—'}</strong></div><div class="stat-card"><small>NET SCORE</small><strong>${a.score}/${a.total}</strong></div></div>
  ${bySec ? `<div class="oe-scroll"><table class="oe-table"><thead><tr><th>Section</th><th>Qs</th><th>Correct</th><th>Wrong</th><th>Blank</th><th>Marks</th></tr></thead><tbody>${bySec}</tbody></table></div>` : ''}
  <div class="u-row" style="margin:10px 0"><button class="primary" id="oePrev">▦ View OMR sheet</button><button class="secondary" id="oePng1">⇩ Evaluated sheet (PNG)</button><button class="secondary" id="oePng2">⇩ As-submitted sheet (PNG)</button><button class="secondary" id="oePdf1">⇩ OMR sheet (PDF)</button><button class="secondary" id="oePdf2">⇩ Full evaluation (PDF)</button></div>
  <div id="oePreview"></div>
  <div class="chips" style="margin:10px 0">${[['all', 'All'], ['correct', 'Correct'], ['wrong', 'Wrong'], ['blank', 'Unattempted']].map(([k, l]) => `<button class="chip" data-oef="${k}">${l}</button>`).join('')}</div>
  <div class="oe-scroll"><table class="oe-table"><thead><tr><th>Q</th><th>Marked</th><th>Correct</th><th>Result</th><th>Marks</th><th>Topic</th></tr></thead><tbody id="oeBody"></tbody></table></div>`;
  drawTable(); $$('[data-oef]', host).forEach(b => b.onclick = () => { filter = b.dataset.oef; drawTable(); });
  const run = async (btn, fn) => { const t = btn.textContent; btn.disabled = true; btn.textContent = 'Preparing…'; try { await fn(); } catch (e) { toast('Export failed: ' + e.message); } finally { btn.disabled = false; btn.textContent = t; } };
  $('#oePrev', host).onclick = () => { const box = $('#oePreview', host); if (box.innerHTML) { box.innerHTML = ''; return; } drawSheets(a, 'evaluated').forEach(cv => { cv.style.cssText = 'width:100%;height:auto;border-radius:10px;margin:6px 0;border:1px solid #b05a2a'; box.appendChild(cv); }); };
  $('#oePng1', host).onclick = e => run(e.target, () => exportPng(a, 'evaluated')); $('#oePng2', host).onclick = e => run(e.target, () => exportPng(a, 'submitted'));
  $('#oePdf1', host).onclick = e => run(e.target, () => exportPdf(a, 'evaluated', false)); $('#oePdf2', host).onclick = e => run(e.target, () => exportPdf(a, 'evaluated', true));
}
