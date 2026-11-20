// Fetch text from a URL in a way that works on Android (native HTTP), Windows (Electron main process) and browsers (CORS permitting).
export async function fetchText(url, { timeout = 20000 } = {}) {
  if (!/^https?:\/\//i.test(url)) throw new Error('Only http(s) addresses are supported.');
  if (typeof navigator !== 'undefined' && !navigator.onLine) throw new Error('You are offline. Downloaded articles stay available; fetching needs internet.');
  if (window.quizinoxNet?.fetchText) { const r = await window.quizinoxNet.fetchText(url); if (!r.ok) throw new Error(r.error || `HTTP ${r.status}`); return r.text; }
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), timeout);
  try { const res = await fetch(url, { signal: ctl.signal, headers: { Accept: 'application/rss+xml, application/xml, text/xml, text/html, */*' } }); if (!res.ok) throw new Error(`HTTP ${res.status}`); return await res.text(); }
  catch (e) { throw new Error(e.name === 'AbortError' ? 'The source took too long to respond.' : /Failed to fetch|NetworkError|Load failed/i.test(e.message) ? 'The source blocked the request (browser CORS) or is unreachable. The Android and Windows apps can fetch it; in a plain browser use “Paste article”.' : e.message); }
  finally { clearTimeout(t); }
}
