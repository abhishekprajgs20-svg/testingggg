// QUIZINOX translation engine (v3.1): resilient bulk translation for Android + Windows + browser.
// - Android: native HTTP (CapacitorHttp) → no WebView CORS / "http" errors.
// - Several free endpoints are rotated; every chunk is retried with exponential back-off + jitter.
// - Work is split into small chunks, concurrency adapts to rate-limits (429/5xx), progress is reported,
//   and finished chunks are never lost (callers can save partial results and resume).
import { Capacitor, CapacitorHttp } from '@capacitor/core';

const SEP = 'ZXQLINESEPZX';
const SEP_RE = /\s*Z\s*X\s*Q\s*L\s*I\s*N\s*E\s*S\s*E\s*P\s*Z\s*X\s*/i;
const cache = new Map();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const native = () => { try { return Capacitor.isNativePlatform(); } catch { return false; } };

class HttpError extends Error { constructor(m, status) { super(m); this.status = status; } }

const ENDPOINTS = [
  (tl, sl, q) => ({ url: 'https://translate.googleapis.com/translate_a/single', params: { client: 'gtx', sl, tl, dt: 't', q }, parse: d => (Array.isArray(d?.[0]) ? d[0].map(x => x?.[0] || '').join('') : null) }),
  (tl, sl, q) => ({ url: 'https://translate.google.com/translate_a/single', params: { client: 'gtx', sl, tl, dt: 't', q }, parse: d => (Array.isArray(d?.[0]) ? d[0].map(x => x?.[0] || '').join('') : null) }),
];
const MYMEMORY = (tl, sl, q) => ({ url: 'https://api.mymemory.translated.net/get', params: { q: q.slice(0, 480), langpair: `${sl === 'auto' ? 'en' : sl}|${tl}` }, parse: d => d?.responseData?.translatedText || null });
const toQuery = p => Object.entries(p).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');

async function request(spec, timeoutMs) {
  if (native()) {
    const res = await Promise.race([CapacitorHttp.get({ url: spec.url, params: spec.params, readTimeout: timeoutMs, connectTimeout: 15000, headers: { Accept: 'application/json, text/plain, */*' } }), sleep(timeoutMs + 3000).then(() => { throw new HttpError('Translation timed out', 0); })]);
    if (res.status >= 400) throw new HttpError('Translation service HTTP ' + res.status, res.status);
    let d = res.data; if (typeof d === 'string') { try { d = JSON.parse(d); } catch { throw new HttpError('Unexpected translation response', 0); } }
    return d;
  }
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const url = `${spec.url}?${toQuery(spec.params)}`;
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) throw new HttpError('Translation service HTTP ' + r.status, r.status);
    return await r.json();
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(e.name === 'AbortError' ? 'Translation timed out' : 'Network blocked or unreachable (' + (e.message || 'fetch failed') + ')', 0);
  } finally { clearTimeout(t); }
}

const state = { bad: new Map() }; // endpoint index -> cool-down until
async function translateChunk(input, tl, sl, attemptsMax = 7) {
  const key = `${sl}|${tl}|${input}`; const hit = cache.get(key); if (hit != null) return hit;
  let last; const order = [0, 1];
  for (let k = 0; k < attemptsMax; k++) {
    const live = order.filter(i => (state.bad.get(i) || 0) < Date.now()); const idx = (live.length ? live : order)[k % (live.length || order.length)];
    const useMy = k >= attemptsMax - 2 && input.length <= 480; const spec = useMy ? MYMEMORY(tl, sl, input) : ENDPOINTS[idx](tl, sl, input);
    try {
      const d = await request(spec, native() ? 30000 : 25000); const out = spec.parse(d);
      if (out == null || (input.trim() && !String(out).trim())) throw new HttpError('Empty translation response', 0);
      cache.set(key, out); if (cache.size > 800) cache.delete(cache.keys().next().value); return out;
    } catch (e) {
      last = e; if (!useMy && (e.status === 429 || e.status >= 500 || e.status === 403 || e.status === 0)) state.bad.set(idx, Date.now() + (e.status === 429 ? 20000 : 6000));
      if (e.status === 400 && input.length < 3) break;
      await sleep(Math.min(9000, 500 * 2 ** k) + Math.random() * 400);
    }
  }
  throw last || new Error('Translation failed');
}

/**
 * Translate an array of strings. Never throws for a single bad string: it halves the batch, then
 * falls back to one-by-one, and finally keeps the original text for that item (reported in stats.kept).
 */
export async function translateTexts(texts, tl, { sl = 'auto', onProgress = () => {}, signal } = {}) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error('Internet connection required. Already-translated languages still work offline.');
  const out = new Array(texts.length); const ids = [];
  texts.forEach((x, i) => { if (String(x ?? '').trim() && !/^[\d\s.,:;%+\-–—()/]+$/.test(String(x))) ids.push(i); else out[i] = x; });
  // pack into small chunks (≈1400 chars, ≤12 items) — big chunks are what triggers rate-limits and truncation
  const chunks = []; let cur = [], n = 0;
  for (const i of ids) { const len = String(texts[i]).length + SEP.length + 4; if (cur.length && (n + len > 1400 || cur.length >= 12)) { chunks.push(cur); cur = []; n = 0; } cur.push(i); n += len; }
  if (cur.length) chunks.push(cur);
  const stats = { total: ids.length, done: 0, kept: 0, retries: 0 };
  async function run(g, depth = 0) {
    if (signal?.aborted) throw Object.assign(new Error('Stopped'), { code: 'abort' });
    try {
      if (g.length === 1) { const t = await translateChunk(String(texts[g[0]]).slice(0, 4500), tl, sl); out[g[0]] = t; }
      else {
        const val = await translateChunk(g.map(i => texts[i]).join('\n' + SEP + '\n'), tl, sl); const parts = val.split(SEP_RE);
        if (parts.length !== g.length) throw new HttpError('Batch formatting changed', -1);
        g.forEach((i, j) => { out[i] = parts[j].trim() || texts[i]; });
      }
      stats.done += g.length; onProgress(stats);
    } catch (e) {
      if (e.code === 'abort') throw e;
      if (g.length > 1) { const m = Math.ceil(g.length / 2); await run(g.slice(0, m), depth + 1); await run(g.slice(m), depth + 1); }
      else { out[g[0]] = texts[g[0]]; stats.kept++; stats.done++; stats.lastError = e.message; onProgress(stats); if (stats.kept > Math.max(3, ids.length * 0.25)) throw e; }
    }
  }
  // adaptive concurrency: start at 3 (native) / 2 (web); drop to 1 when the service pushes back
  let conc = native() ? 3 : 2, next = 0, failures = 0;
  const worker = async () => { while (next < chunks.length) { const my = chunks[next++]; const before = stats.kept; await run(my); if (stats.kept > before) { failures++; conc = 1; await sleep(1200); } await sleep(120 + Math.random() * 120); if (failures && conc === 1) { /* stay gentle */ } } };
  const workers = Array.from({ length: Math.min(conc, chunks.length) }, () => worker()); await Promise.all(workers);
  out.stats = stats; return out;
}
export const translateStats = () => ({ cache: cache.size });

/** For the standalone TXT/PDF translator tool (runs in an iframe): robust call that also returns the detected language. */
export async function gtRaw(q, sl, tl, signal) {
  let last;
  for (let k = 0; k < 7; k++) {
    if (signal?.aborted) throw new Error('STOPPED');
    const idx = k % 2; const spec = ENDPOINTS[idx](tl, sl, q);
    try { const d = await request(spec, native() ? 30000 : 25000); const text = spec.parse(d); if (text == null) throw new HttpError('Unexpected translation response', 0); return { text, det: Array.isArray(d) ? d[2] : undefined }; }
    catch (e) { last = e; await sleep(Math.min(9000, 500 * 2 ** k) + Math.random() * 400); }
  }
  throw last || new Error('Translation failed');
}
