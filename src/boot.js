// Loads saved data from large on-device storage first, then starts the app.
import { initStorage } from './storage.js';
// Everything the app saves lives in large storage: quizzes, unfinished attempt, AI usage counters and saved AI answers.
const KEYS = ['quizinox_local_v1', 'quizinox_play_v1', 'quizinox_ai_usage_v2', 'quizinox_ai_cache_v1'];
initStorage(KEYS)
  .catch(() => { /* app still starts with an empty workspace */ })
  .then(() => import('./main.js'))
  .catch(err => { document.getElementById('app').innerHTML = `<div style="padding:24px;color:#ff9eac;font:14px system-ui">QUIZINOX could not start: ${String(err && err.message || err)}</div>`; });
