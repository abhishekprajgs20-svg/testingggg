import * as Store from './storage.js';
// QUIZINOX AI engine (v2.8) — multi-provider + login accounts + web-chat bridge
//  • Providers: Google Gemini (free OR paid keys), Groq, OpenRouter (free models), OpenAI, Claude (Anthropic),
//    Mistral, Cerebras, Hugging Face, DeepSeek, any OpenAI-compatible endpoint, plus Puter (account login, no key).
//  • Several keys per provider: when one key fails the next key is used automatically.
//  • When every key/model of one provider fails, the SAME request moves on to the next provider
//    (so a long job such as "generate 50 questions" simply continues on another AI).
//  • Per-key / per-model pacing that stays below the published free limits (can be switched off).
//  • Small local response cache so repeated questions never spend quota again.
// Nothing here runs unless the user taps an AI button.

/* ---------------- provider catalogue ---------------- */
export const GEMINI_MODELS = {
  'gemini-3-pro-preview': { rpm: 5, rpd: 50, name: 'Gemini 3 Pro (preview)', note: 'Newest & smartest — free quota may be 0 on free keys' },
  'gemini-3-flash-preview': { rpm: 10, rpd: 250, name: 'Gemini 3 Flash (preview)', note: 'Newest fast model' },
  'gemini-2.5-pro': { rpm: 5, rpd: 100, name: 'Gemini 2.5 Pro', note: 'Smart, small free quota' },
  'gemini-2.5-flash': { rpm: 10, rpd: 250, name: 'Gemini 2.5 Flash', note: 'Best balance (recommended)' },
  'gemini-2.5-flash-lite': { rpm: 15, rpd: 1000, name: 'Gemini 2.5 Flash-Lite', note: 'Highest free daily quota' },
  'gemini-2.0-flash': { rpm: 15, rpd: 200, name: 'Gemini 2.0 Flash', note: 'Older, fast' },
  'gemini-2.0-flash-lite': { rpm: 30, rpd: 200, name: 'Gemini 2.0 Flash-Lite', note: 'Older, very fast' },
  'gemini-flash-latest': { rpm: 10, rpd: 250, name: 'Gemini Flash (latest alias)', note: 'Always the newest Flash' },
  'gemini-flash-lite-latest': { rpm: 15, rpd: 1000, name: 'Gemini Flash-Lite (latest alias)', note: 'Always the newest Flash-Lite' },
  'gemma-3-27b-it': { rpm: 30, rpd: 14400, name: 'Gemma 3 27B', note: 'Open model, big free quota (plain text)' },
};
const m = (name, note = '') => ({ name, note });
export const PROVIDERS = {
  gemini: { name: 'Google Gemini', kind: 'gemini', free: 'Free tier + paid', keyUrl: 'aistudio.google.com/apikey', prefix: /^AIza/, default: 'gemini-2.5-flash', chain: ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'], models: GEMINI_MODELS },
  groq: { name: 'Groq', kind: 'openai', base: 'https://api.groq.com/openai/v1', json: true, rpm: 25, free: 'Free tier', keyUrl: 'console.groq.com/keys', prefix: /^gsk_/, default: 'llama-3.3-70b-versatile', chain: ['llama-3.3-70b-versatile', 'openai/gpt-oss-20b', 'llama-3.1-8b-instant'],
    models: { 'llama-3.3-70b-versatile': m('Llama 3.3 70B', 'Smart & fast'), 'openai/gpt-oss-120b': m('GPT-OSS 120B', 'Strong open model'), 'openai/gpt-oss-20b': m('GPT-OSS 20B', 'Fast'), 'meta-llama/llama-4-scout-17b-16e-instruct': m('Llama 4 Scout 17B'), 'qwen/qwen3-32b': m('Qwen 3 32B'), 'moonshotai/kimi-k2-instruct': m('Kimi K2'), 'llama-3.1-8b-instant': m('Llama 3.1 8B', 'Very fast, small') } },
  openrouter: { name: 'OpenRouter (free models)', kind: 'openai', base: 'https://openrouter.ai/api/v1', rpm: 15, free: 'Free models (":free")', keyUrl: 'openrouter.ai/keys', prefix: /^sk-or-/, default: 'meta-llama/llama-3.3-70b-instruct:free', chain: ['meta-llama/llama-3.3-70b-instruct:free', 'google/gemma-3-27b-it:free', 'openai/gpt-oss-20b:free', 'mistralai/mistral-small-3.2-24b-instruct:free'],
    models: { 'meta-llama/llama-3.3-70b-instruct:free': m('Llama 3.3 70B (free)'), 'google/gemma-3-27b-it:free': m('Gemma 3 27B (free)'), 'openai/gpt-oss-20b:free': m('GPT-OSS 20B (free)'), 'openai/gpt-oss-120b:free': m('GPT-OSS 120B (free)'), 'deepseek/deepseek-r1-0528:free': m('DeepSeek R1 (free)'), 'qwen/qwen3-235b-a22b:free': m('Qwen3 235B (free)'), 'mistralai/mistral-small-3.2-24b-instruct:free': m('Mistral Small 3.2 (free)') } },
  mistral: { name: 'Mistral', kind: 'openai', base: 'https://api.mistral.ai/v1', json: true, rpm: 30, free: 'Free "Experiment" plan', keyUrl: 'console.mistral.ai/api-keys', default: 'mistral-small-latest', chain: ['mistral-small-latest', 'open-mistral-nemo'],
    models: { 'mistral-small-latest': m('Mistral Small'), 'mistral-medium-latest': m('Mistral Medium'), 'mistral-large-latest': m('Mistral Large'), 'open-mistral-nemo': m('Mistral Nemo'), 'ministral-8b-latest': m('Ministral 8B') } },
  cerebras: { name: 'Cerebras', kind: 'openai', base: 'https://api.cerebras.ai/v1', json: true, rpm: 25, free: 'Free tier', keyUrl: 'cloud.cerebras.ai', prefix: /^csk-/, default: 'llama-3.3-70b', chain: ['llama-3.3-70b', 'gpt-oss-120b', 'llama3.1-8b'],
    models: { 'llama-3.3-70b': m('Llama 3.3 70B'), 'gpt-oss-120b': m('GPT-OSS 120B'), 'qwen-3-32b': m('Qwen 3 32B'), 'llama3.1-8b': m('Llama 3.1 8B') } },
  huggingface: { name: 'Hugging Face', kind: 'openai', base: 'https://router.huggingface.co/v1', rpm: 15, free: 'Free monthly credits', keyUrl: 'huggingface.co/settings/tokens', prefix: /^hf_/, default: 'meta-llama/Llama-3.3-70B-Instruct', chain: ['meta-llama/Llama-3.3-70B-Instruct', 'Qwen/Qwen2.5-72B-Instruct'],
    models: { 'meta-llama/Llama-3.3-70B-Instruct': m('Llama 3.3 70B'), 'Qwen/Qwen2.5-72B-Instruct': m('Qwen 2.5 72B'), 'openai/gpt-oss-120b': m('GPT-OSS 120B'), 'deepseek-ai/DeepSeek-V3': m('DeepSeek V3') } },
  openai: { name: 'OpenAI (GPT)', kind: 'openai', base: 'https://api.openai.com/v1', json: true, free: 'Paid (no free API tier)', keyUrl: 'platform.openai.com/api-keys', prefix: /^sk-(proj-)?[A-Za-z0-9_-]{30,}$/, default: 'gpt-4o-mini', chain: ['gpt-4o-mini'],
    models: { 'gpt-4o-mini': m('GPT-4o mini', 'Cheap & fast'), 'gpt-4o': m('GPT-4o'), 'gpt-4.1-mini': m('GPT-4.1 mini'), 'gpt-4.1': m('GPT-4.1'), 'gpt-5-mini': m('GPT-5 mini'), 'gpt-5': m('GPT-5') } },
  anthropic: { name: 'Claude (Anthropic)', kind: 'anthropic', free: 'Paid (no free API tier)', keyUrl: 'console.anthropic.com/settings/keys', prefix: /^sk-ant-/, default: 'claude-haiku-4-5', chain: ['claude-haiku-4-5'],
    models: { 'claude-haiku-4-5': m('Claude Haiku 4.5', 'Fast & cheap'), 'claude-sonnet-4-5': m('Claude Sonnet 4.5', 'Smart'), 'claude-opus-4-1': m('Claude Opus 4.1', 'Most capable') } },
  deepseek: { name: 'DeepSeek', kind: 'openai', base: 'https://api.deepseek.com/v1', json: true, free: 'Very cheap (no free tier)', keyUrl: 'platform.deepseek.com/api_keys', default: 'deepseek-chat', chain: ['deepseek-chat'],
    models: { 'deepseek-chat': m('DeepSeek V3 (chat)'), 'deepseek-reasoner': m('DeepSeek R1 (reasoner)') } },
  custom: { name: 'Custom (OpenAI-compatible)', kind: 'openai', base: '', free: 'Any OpenAI-style endpoint (Ollama, LM Studio, Together…)', keyUrl: '', default: '', chain: [], models: {} },
};
export const PUTER_MODELS = { '': 'Puter default', 'gpt-4o-mini': 'GPT-4o mini', 'gpt-4o': 'GPT-4o', 'gpt-5-nano': 'GPT-5 nano', 'gpt-5-mini': 'GPT-5 mini', 'claude-sonnet-4-5': 'Claude Sonnet 4.5', 'gemini-2.5-flash': 'Gemini 2.5 Flash', 'deepseek-chat': 'DeepSeek chat' };
export const DEFAULT_ORDER = ['gemini', 'groq', 'openrouter', 'mistral', 'cerebras', 'huggingface', 'openai', 'anthropic', 'deepseek', 'custom'];

/* ---------------- v2.8: login accounts (via Puter) + web-chat bridge ---------------- */
// One Puter sign-in unlocks GPT, Claude, Gemini, DeepSeek, Grok, Llama, Mistral… Every vendor below is a separate
// "AI account" the user can switch on/off, re-order and give its own model.
export const LOGIN_VENDORS = {
  chatgpt:  { name: 'ChatGPT (OpenAI GPT)', icon: '🟢', match: /openai|gpt|^o\d/i, default: 'gpt-5-mini', on: true,
    models: { 'gpt-5-nano': 'GPT-5 nano', 'gpt-5-mini': 'GPT-5 mini', 'gpt-4o-mini': 'GPT-4o mini', 'gpt-4o': 'GPT-4o' } },
  claude:   { name: 'Claude (Anthropic)', icon: '🟠', match: /claude|anthropic/i, default: 'claude-sonnet-4-5', on: true,
    models: { 'claude-haiku-4-5': 'Claude Haiku 4.5', 'claude-sonnet-4-5': 'Claude Sonnet 4.5' } },
  gemini:   { name: 'Gemini (Google)', icon: '🔵', match: /gemini|google/i, default: 'gemini-2.5-flash', on: true,
    models: { 'gemini-2.5-flash': 'Gemini 2.5 Flash', 'gemini-2.5-flash-lite': 'Gemini 2.5 Flash-Lite' } },
  deepseek: { name: 'DeepSeek', icon: '🐋', match: /deepseek/i, default: 'deepseek-chat', on: false,
    models: { 'deepseek-chat': 'DeepSeek Chat', 'deepseek-reasoner': 'DeepSeek Reasoner' } },
  grok:     { name: 'Grok (xAI)', icon: '⚫', match: /grok|x-ai/i, default: 'x-ai/grok-4.3', on: false, models: { 'x-ai/grok-4.3': 'Grok 4.3' } },
  llama:    { name: 'Llama (Meta)', icon: '🦙', match: /llama|meta/i, default: '', on: false, models: {} },
  mistral:  { name: 'Mistral', icon: '🌬️', match: /mistral/i, default: 'mistral-large-latest', on: false, models: { 'mistral-large-latest': 'Mistral Large', 'mistral-small-latest': 'Mistral Small' } },
  other:    { name: 'Any other AI (type model id)', icon: '✨', match: /./, default: '', on: false, models: {} },
};
export const LOGIN_ORDER_DEFAULT = Object.keys(LOGIN_VENDORS);
/** Where the response should come from. 'default' = the original v2.7 behaviour (unchanged). */
export const SOURCES = {
  default: 'Use the settings above (unchanged)',
  'login-api': 'Login accounts first — API keys as backup',
  'api-login': 'API keys first — login accounts as backup',
  login: 'Login accounts only (no API key)',
  api: 'API keys only',
  web: 'Web chat — ChatGPT / Gemini / Claude website (copy & paste)',
};
/** Chat websites the user can log in to with their own (even paid) account. */
export const WEB_CHATS = {
  chatgpt: { name: 'ChatGPT', url: 'https://chatgpt.com/' },
  gemini: { name: 'Gemini', url: 'https://gemini.google.com/app' },
  claude: { name: 'Claude', url: 'https://claude.ai/new' },
  grok: { name: 'Grok', url: 'https://grok.com/' },
  deepseek: { name: 'DeepSeek', url: 'https://chat.deepseek.com/' },
  perplexity: { name: 'Perplexity', url: 'https://www.perplexity.ai/' },
  copilot: { name: 'Microsoft Copilot', url: 'https://copilot.microsoft.com/' },
  mistral: { name: 'Le Chat (Mistral)', url: 'https://chat.mistral.ai/chat' },
  meta: { name: 'Meta AI', url: 'https://www.meta.ai/' },
  qwen: { name: 'Qwen', url: 'https://chat.qwen.ai/' },
  other: { name: 'Other website', url: '' },
};

// ---- backwards-compatible names used by older code ----
export const MODELS = GEMINI_MODELS;
export const FALLBACK_CHAIN = PROVIDERS.gemini.chain;
export const SAFETY = 0.8;
const DEFAULT_LIMIT = { rpm: 20, rpd: Infinity, name: '' };
const USAGE_KEY = 'quizinox_ai_usage_v2';
const CACHE_KEY = 'quizinox_ai_cache_v1';
const CACHE_MAX = 600;
const REQUEST_TIMEOUT = 90000;
const MAX_WAIT_FOR_SLOT = 30000;
const MAX_ROUTES = 60;

let ctx = { getSettings: () => ({}), saveSettings: () => {} };
export function initAI(c) { ctx = { ...ctx, ...c }; }
export class AIError extends Error { constructor(message, code = 'error') { super(message); this.code = code; } }

export const providerOf = k => (k && PROVIDERS[k.provider] ? k.provider : 'gemini');
export const providerName = p => (p === 'puter' ? 'Login account' : p === 'web' ? 'Web chat' : PROVIDERS[p]?.name || p);
export function limitsFor(model, provider = 'gemini') {
  const P = PROVIDERS[provider] || PROVIDERS.gemini;
  return { ...DEFAULT_LIMIT, rpm: P.rpm || DEFAULT_LIMIT.rpm, name: model, ...(P.models?.[model] || {}) };
}
export const safeCap = n => Math.max(1, Math.floor(n * SAFETY));
export function pacificDay(d = new Date()) {
  try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d); }
  catch { return d.toISOString().slice(0, 10); }
}
export function hash(str) {
  let h1 = 2166136261, h2 = 2246822519; const s = String(str);
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619); h2 = Math.imul(h2 ^ c, 3266489917); }
  return (h1 >>> 0).toString(36) + (h2 >>> 0).toString(36);
}
/** Guess the provider from the shape of a pasted key. */
export function detectProvider(key, fallback = 'gemini') {
  const k = String(key || '').trim();
  for (const id of ['anthropic', 'openrouter', 'groq', 'cerebras', 'huggingface', 'gemini']) if (PROVIDERS[id].prefix?.test(k)) return id;
  if (PROVIDERS.openai.prefix.test(k)) return 'openai';
  return fallback;
}

/* ---------------- settings helpers ---------------- */
const S = () => ctx.getSettings() || {};
export function selectedModel(p) {
  const s = S(); const P = PROVIDERS[p]; if (!P) return '';
  if (p === 'gemini') return s.aiModels?.gemini || s.aiModel || P.default;
  return s.aiModels?.[p] || P.default;
}
export const primaryProvider = () => (PROVIDERS[S().aiPrimary] ? S().aiPrimary : 'gemini');
export function providerOrder() {
  const o = (Array.isArray(S().aiOrder) ? S().aiOrder : []).filter(p => PROVIDERS[p]);
  for (const p of DEFAULT_ORDER) if (!o.includes(p)) o.push(p);
  return o;
}
export const providerEnabled = p => S().aiDisabled?.[p] !== true;
export function getKeys() { return (S().aiKeys || []).filter(k => k && k.key); }
export const keysOf = p => getKeys().filter(k => providerOf(k) === p);
const usable = k => k.enabled !== false && k.status !== 'invalid';
function updateKey(id, patch) { const k = (S().aiKeys || []).find(x => x.id === id); if (k) { Object.assign(k, patch); ctx.saveSettings(); } }
export const puterLinked = () => !!S().puterLinked;
export const aiSource = () => (SOURCES[S().aiSource] ? S().aiSource : 'default');
export function loginOrder() {
  const o = (Array.isArray(S().aiLogin?.order) ? S().aiLogin.order : []).filter(id => LOGIN_VENDORS[id]);
  for (const id of LOGIN_ORDER_DEFAULT) if (!o.includes(id)) o.push(id);
  return o;
}
export const loginEnabled = id => { const e = S().aiLogin?.enabled; return e && id in e ? !!e[id] : !!LOGIN_VENDORS[id]?.on; };
export const loginModel = id => S().aiLogin?.models?.[id] ?? LOGIN_VENDORS[id]?.default ?? '';
/** Login accounts that will actually be used (switched on and with a model). */
export const activeLogins = () => loginOrder().filter(id => loginEnabled(id) && loginModel(id));
export function webSite(id = S().aiWeb?.site || 'chatgpt') {
  const w = WEB_CHATS[id] || WEB_CHATS.chatgpt; return { id: WEB_CHATS[id] ? id : 'chatgpt', name: w.name, url: id === 'other' ? (S().aiWeb?.customUrl || '') : w.url };
}
/** True when at least one way of reaching an AI exists (a usable key or a linked login). */
export function aiReady() {
  const src = aiSource();
  if (src === 'web') return true;
  if (src !== 'default') {
    const keysOk2 = src !== 'login' && getKeys().some(k => usable(k) && providerEnabled(providerOf(k)));
    const loginOk2 = src !== 'api' && puterLinked() && activeLogins().length > 0;
    return keysOk2 || loginOk2;
  }
  const mode = S().aiMode || 'auto';
  const keysOk = mode !== 'login' && getKeys().some(k => usable(k) && providerEnabled(providerOf(k)));
  const loginOk = mode !== 'api' && puterLinked();
  return keysOk || loginOk;
}
export function modelLabel(provider, model) { if (provider === 'web') return WEB_CHATS[model]?.name || 'Web chat'; return PROVIDERS[provider]?.models?.[model]?.name || (provider === 'puter' ? (PUTER_MODELS[model] || model || 'Puter AI') : model); }

/* ---------------- usage bookkeeping (separate small storage key) ---------------- */
function loadUsage() { try { const u = JSON.parse(Store.getItem(USAGE_KEY) || '{}'); return u && typeof u === 'object' ? u : {}; } catch { return {}; } }
function saveUsage(u) { try { Store.setItem(USAGE_KEY, JSON.stringify(u)); } catch { /* ignore */ } }
function slot(u, keyId, model) {
  const day = pacificDay();
  u[keyId] ||= {};
  const s = (u[keyId][model] ||= { day, count: 0, recent: [], cooldownUntil: 0, dayBlocked: '' });
  if (s.day !== day) { s.day = day; s.count = 0; s.dayBlocked = ''; }
  const cutoff = Date.now() - 60000; s.recent = (s.recent || []).filter(t => t > cutoff);
  return s;
}
function patchSlot(keyId, model, fn) { const u = loadUsage(); fn(slot(u, keyId, model)); saveUsage(u); }
export function resetUsageFlags() { const u = loadUsage(); for (const k of Object.values(u)) for (const s of Object.values(k)) { s.cooldownUntil = 0; s.dayBlocked = ''; } saveUsage(u); }
export function forgetKeyUsage(keyId) { const u = loadUsage(); delete u[keyId]; saveUsage(u); }

/** Local pacing caps for one key on one model. Paid Gemini keys and "guard off" skip the free-tier caps. */
function capsFor(k, model) {
  if (S().aiGuard === false) return { rpm: Infinity, rpd: Infinity };
  if (k.tier === 'paid') return { rpm: 120, rpd: Infinity };
  const L = limitsFor(model, providerOf(k));
  return { rpm: safeCap(L.rpm), rpd: L.rpd === Infinity ? Infinity : safeCap(L.rpd) };
}
export function keyAvailability(k, model) {
  const u = loadUsage(); const s = slot(u, k.id, model); const C = capsFor(k, model); const now = Date.now();
  if (k.enabled === false) return { ok: false, reason: 'disabled', used: s.count };
  if (k.status === 'invalid') return { ok: false, reason: 'invalid', used: s.count };
  if (s.dayBlocked === pacificDay() || s.count >= C.rpd) return { ok: false, reason: 'daily', used: s.count };
  if (s.cooldownUntil > now) return { ok: false, reason: 'cooldown', wait: s.cooldownUntil - now, used: s.count };
  if (s.recent.length >= C.rpm) return { ok: false, reason: 'minute', wait: s.recent[0] + 60000 - now + 300, used: s.count };
  return { ok: true, used: s.count };
}
/** Per key: today's request count per model, for the Settings screen. */
export function usageSummary() {
  const u = loadUsage(); const day = pacificDay();
  return getKeys().map(k => {
    const models = {}; let total = 0;
    for (const [mm, s] of Object.entries(u[k.id] || {})) { if (s.day !== day) continue; models[mm] = s.count; total += s.count; }
    return { id: k.id, total, models };
  });
}
export function todayTotal() { return usageSummary().reduce((n, k) => n + k.total, 0); }
/** Requests still possible today on `model` of `provider` across healthy keys (Infinity when uncapped). */
export function remainingToday(model, provider = 'gemini') {
  const u = loadUsage(); const day = pacificDay(); let n = 0;
  for (const k of keysOf(provider)) {
    if (!usable(k)) continue; const C = capsFor(k, model); if (C.rpd === Infinity) return Infinity;
    const s = u[k.id]?.[model]; if (s && s.day === day && s.dayBlocked === day) continue;
    n += Math.max(0, C.rpd - (s && s.day === day ? s.count : 0));
  }
  return n;
}
export const remainingLabel = (model, provider = 'gemini') => { const n = remainingToday(model, provider); return n === Infinity ? 'plenty' : String(n); };

/* ---------------- response cache ---------------- */
function loadCache() { try { return JSON.parse(Store.getItem(CACHE_KEY) || '{}') || {}; } catch { return {}; } }
export function cacheGet(key) { const c = loadCache(); return c[key]?.v ?? null; }
export function cacheSet(key, v) {
  const c = loadCache(); c[key] = { v, t: Date.now() };
  const keys = Object.keys(c); if (keys.length > CACHE_MAX) keys.sort((a, b) => c[a].t - c[b].t).slice(0, keys.length - CACHE_MAX).forEach(k => delete c[k]);
  try { Store.setItem(CACHE_KEY, JSON.stringify(c)); } catch { /* keep the existing saved answers */ }
}
export function clearCache() { try { Store.removeItem(CACHE_KEY); } catch { /* */ } }

/* ---------------- helpers ---------------- */
const sleep = (ms, signal) => new Promise((res, rej) => {
  const t = setTimeout(res, ms);
  signal?.addEventListener('abort', () => { clearTimeout(t); rej(new AIError('Cancelled', 'abort')); }, { once: true });
});
function parseQuotaError(body, headers) {
  const det = body?.error?.details || []; let delay = 0, daily = false;
  for (const x of Array.isArray(det) ? det : []) {
    if (x.retryDelay) delay = parseFloat(x.retryDelay) * 1000 || 0;
    for (const v of x.violations || []) if (/PerDay/i.test(v.quotaId || '') || /per_?day/i.test(v.quotaMetric || '')) daily = true;
  }
  const msg = errMessage(body, '');
  if (/per day|daily|tokens per day|\bTPD\b|\bRPD\b|free-models-per-day/i.test(msg)) daily = true;
  const mm = msg.match(/retry in ([\d.]+)\s*s/i); if (!delay && mm) delay = parseFloat(mm[1]) * 1000;
  const ra = Number(headers?.get?.('retry-after')); if (!delay && ra > 0) delay = ra * 1000;
  if (delay > 10 * 60000) daily = true;
  return { delay, daily };
}
function errMessage(body, fallback) {
  const e = body?.error;
  return (typeof e === 'string' ? e : e?.message) || body?.message || body?.detail || (typeof e?.error === 'string' ? e.error : '') || fallback;
}
/** Robust JSON extraction: strips code fences / <think> blocks and repairs a truncated {"questions":[...]} array. */
export function parseJsonLoose(raw) {
  const t = String(raw || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
  try { return JSON.parse(t); } catch { /* continue */ }
  const i = t.search(/[[{]/); if (i < 0) throw new AIError('AI did not return JSON', 'parse');
  const j = Math.max(t.lastIndexOf('}'), t.lastIndexOf(']'));
  if (j > i) { try { return JSON.parse(t.slice(i, j + 1)); } catch { /* continue */ } }
  let end = t.lastIndexOf('}'), tries = 0;
  while (end > i && tries++ < 40) {
    for (const tail of [']}', ']', '}']) { try { return JSON.parse(t.slice(i, end + 1) + tail); } catch { /* next */ } }
    end = t.lastIndexOf('}', end - 1);
  }
  throw new AIError('AI response was cut off or not valid JSON. Try fewer questions.', 'parse');
}
const JSON_NUDGE = '\n\nReturn ONLY valid JSON — no markdown fences, no commentary.';
const stripThink = t => String(t || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

/* ---------------- low-level requests (each returns a normalised result) ---------------- */
// → { ok, status, text, truncated, blocked, message, retryMs, daily, body }
async function fetchJson(url, init, signal) {
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort('timeout'), REQUEST_TIMEOUT);
  const onAbort = () => ctrl.abort('user'); signal?.addEventListener('abort', onAbort, { once: true });
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    let body = null; try { body = await res.json(); } catch { /* non-JSON */ }
    return { res, body };
  } catch (e) {
    if (signal?.aborted) throw new AIError('Cancelled', 'abort');
    if (ctrl.signal.aborted) throw new AIError('AI request timed out', 'timeout');
    throw new AIError('Network error while contacting the AI service', 'network');
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', onAbort); }
}
function finish(res, body, extra = {}) {
  const out = { ok: res.ok, status: res.status, body, message: errMessage(body, `Error ${res.status}`), ...extra };
  if (!res.ok && res.status === 429) { const q = parseQuotaError(body, res.headers); out.retryMs = q.delay; out.daily = q.daily; }
  return out;
}
async function geminiSend(key, model, prompt, { json, maxTokens, temperature, signal, system }) {
  const plain = /^gemma/i.test(model); // Gemma: no JSON mode, no system instruction
  const generationConfig = { temperature, maxOutputTokens: maxTokens };
  if (json && !plain) generationConfig.responseMimeType = 'application/json';
  if (/^gemini-2\.5-flash/.test(model) || /^gemini-flash/.test(model)) generationConfig.thinkingConfig = { thinkingBudget: 0 }; // spend free tokens on the answer, not on "thinking"
  const text = (plain && system ? `${system}\n\n` : '') + prompt + (json && plain ? JSON_NUDGE : '');
  const payload = { contents: [{ role: 'user', parts: [{ text }] }], generationConfig };
  if (system && !plain) payload.systemInstruction = { parts: [{ text: system }] };
  const { res, body } = await fetchJson(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(payload) }, signal);
  if (!res.ok) return finish(res, body, { badKey: res.status === 400 && /api key|API_KEY/i.test(errMessage(body, '') + JSON.stringify(body?.error?.details || '')) });
  const cand = body?.candidates?.[0];
  const out = (cand?.content?.parts || []).map(p => p.text || '').join('');
  const reason = cand?.finishReason || body?.promptFeedback?.blockReason;
  return { ok: true, status: 200, text: out, truncated: cand?.finishReason === 'MAX_TOKENS', blocked: !out && /SAFETY|PROHIBITED|BLOCK|RECITATION/i.test(reason || ''), body };
}
async function openaiSend(provider, key, model, prompt, { json, maxTokens, temperature, signal, system }) {
  const P = PROVIDERS[provider]; const base = (provider === 'custom' ? S().customBaseUrl || '' : P.base).replace(/\/+$/, '');
  if (!base) throw new AIError('Set the base URL of your custom AI endpoint in Settings.', 'nokey');
  const newStyle = provider === 'openai' && /^(o\d|gpt-5)/i.test(model); // reasoning-style models: no temperature, other token field
  const messages = [...(system ? [{ role: 'system', content: system }] : []), { role: 'user', content: prompt + (json ? JSON_NUDGE : '') }];
  const payload = { model, messages };
  if (newStyle) payload.max_completion_tokens = Math.max(maxTokens, 4000); else { payload.max_tokens = maxTokens; payload.temperature = temperature; }
  if (json && P.json) payload.response_format = { type: 'json_object' };
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` };
  if (provider === 'openrouter') { headers['HTTP-Referer'] = 'https://quizinox.app'; headers['X-Title'] = 'QUIZINOX'; }
  const { res, body } = await fetchJson(`${base}/chat/completions`, { method: 'POST', headers, body: JSON.stringify(payload) }, signal);
  if (!res.ok) return finish(res, body);
  if (body?.error) return { ok: false, status: Number(body.error.code) || 502, message: errMessage(body, 'Provider error'), body };
  const c = body?.choices?.[0]; let t = c?.message?.content; if (Array.isArray(t)) t = t.map(x => x?.text || '').join('');
  t = stripThink(t);
  return { ok: true, status: 200, text: t || '', truncated: c?.finish_reason === 'length', blocked: !t && c?.finish_reason === 'content_filter', body };
}
async function anthropicSend(key, model, prompt, { json, maxTokens, temperature, signal, system }) {
  const payload = { model, max_tokens: maxTokens, temperature: Math.min(1, temperature), messages: [{ role: 'user', content: prompt + (json ? JSON_NUDGE : '') }] };
  if (system) payload.system = system;
  const { res, body } = await fetchJson('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify(payload) }, signal);
  if (!res.ok) return finish(res, body);
  const t = (body?.content || []).map(x => x?.text || '').join('');
  return { ok: true, status: 200, text: t, truncated: body?.stop_reason === 'max_tokens', blocked: !t && body?.stop_reason === 'refusal', body };
}
/* Puter.js — "log in with your Puter account" instead of an API key (experimental). */
let puterLoading = null;
function loadPuter() {
  if (globalThis.puter) return Promise.resolve(globalThis.puter);
  if (puterLoading) return puterLoading;
  puterLoading = new Promise((resolve, reject) => {
    const s = document.createElement('script'); s.src = 'https://js.puter.com/v2/'; s.async = true;
    s.onload = () => resolve(globalThis.puter);
    s.onerror = () => { puterLoading = null; s.remove(); reject(new AIError('Could not load Puter (internet needed).', 'network')); };
    document.head.appendChild(s);
  });
  return puterLoading;
}
export async function puterSignIn() { const p = await loadPuter(); if (!p.auth.isSignedIn()) await p.auth.signIn(); const ok = !!p.auth.isSignedIn(); if (ok) { ctx.getSettings().puterLinked = true; ctx.saveSettings(); } return ok; }
export async function puterSignOut() { try { const p = await loadPuter(); await p.auth.signOut(); } catch { /* */ } ctx.getSettings().puterLinked = false; ctx.saveSettings(); }
export async function puterIsSignedIn() { try { const p = await loadPuter(); return !!p.auth.isSignedIn(); } catch { return false; } }
async function puterSend(model, prompt, { json, maxTokens, temperature, signal, system }) {
  const p = await loadPuter();
  if (!p.auth.isSignedIn()) return { ok: false, status: 401, message: 'Puter is signed out. Sign in again in Settings.', signedOut: true };
  const messages = [...(system ? [{ role: 'system', content: system }] : []), { role: 'user', content: prompt + (json ? JSON_NUDGE : '') }];
  const opts = { temperature, max_tokens: maxTokens }; if (model) opts.model = model;
  const job = p.ai.chat(messages, opts);
  const guard = new Promise((_, rej) => { const t = setTimeout(() => rej(new AIError('AI request timed out', 'timeout')), REQUEST_TIMEOUT); signal?.addEventListener('abort', () => { clearTimeout(t); rej(new AIError('Cancelled', 'abort')); }, { once: true }); });
  try {
    const r = await Promise.race([job, guard]);
    let t = typeof r === 'string' ? r : r?.message?.content ?? r?.text ?? ''; if (Array.isArray(t)) t = t.map(x => x?.text || '').join('');
    return { ok: true, status: 200, text: stripThink(t), truncated: false, blocked: false };
  } catch (e) {
    if (e instanceof AIError) throw e;
    const msg = e?.error?.message || e?.message || (typeof e === 'string' ? e : 'Puter request failed');
    return { ok: false, status: /limit|insufficient|funds|quota/i.test(msg) ? 429 : 500, message: msg, daily: /insufficient|funds|quota/i.test(msg) };
  }
}
const WEB_JSON_NUDGE = '\n\nReturn ONLY valid JSON, inside a single code block so it is easy to copy. No commentary.';
async function webSend(site, prompt, { json, signal, system }) {
  if (!ctx.askWeb) throw new AIError('The web-chat bridge is not available in this build.', 'nokey');
  const full = (system ? `${system}\n\n` : '') + prompt + (json ? WEB_JSON_NUDGE : '');
  const text = await ctx.askWeb({ site: webSite(site), prompt: full, json, signal });
  return { ok: true, status: 200, text: stripThink(text), truncated: false, blocked: false };
}
function send(provider, key, model, prompt, o) {
  if (provider === 'web') return webSend(model, prompt, o);
  const kind = PROVIDERS[provider]?.kind;
  if (provider === 'puter') return puterSend(model, prompt, o);
  if (kind === 'gemini') return geminiSend(key, model, prompt, o);
  if (kind === 'anthropic') return anthropicSend(key, model, prompt, o);
  return openaiSend(provider, key, model, prompt, o);
}

/* ---------------- route planning ---------------- */
function keyCandidates(provider) { if (provider === 'web') return [{ id: 'web', label: 'Web chat', key: 'web', provider: 'web' }]; return provider === 'puter' ? [{ id: 'puter', label: 'Puter login', key: 'puter', provider: 'puter' }] : keysOf(provider).filter(usable); }
function buildRoutes(preferModel) {
  const s = S(); const mode = s.aiMode || 'auto'; const src = aiSource(); const routes = []; const seen = new Set();
  const configuredPool = Array.isArray(s.aiMultiProviders) ? [...new Set(s.aiMultiProviders)].filter(p => PROVIDERS[p] && providerEnabled(p) && keyCandidates(p).length) : [];
  const multiPoolActive = s.aiMultiProviderEnabled === true && mode !== 'login' && configuredPool.length >= 2;
  const add = (provider, model) => { const id = provider + '|' + model; if (!seen.has(id) && routes.length < MAX_ROUTES) { seen.add(id); routes.push({ provider, model }); } };
  const addApi = () => {
    const allOrder = [primaryProvider(), ...providerOrder()].filter((p, i, a) => a.indexOf(p) === i).filter(p => providerEnabled(p) && keyCandidates(p).length);
    let list = s.aiCross === false ? allOrder.slice(0, 1) : allOrder;
    // Optional multi-provider pool: rotate the first provider for every new AI job,
    // while retaining the existing per-key least-used rotation and error fallbacks.
    const selected = configuredPool;
    if (multiPoolActive) {
      const start = Math.max(0, Number(s.aiProviderCursor) || 0) % selected.length;
      const rotated = selected.slice(start).concat(selected.slice(0, start));
      s.aiProviderCursor = (start + 1) % selected.length;
      try { ctx.saveSettings(); } catch { /* provider rotation must not break the request */ }
      const extraFallbacks = s.aiCross === false ? [] : allOrder.filter(p => !selected.includes(p));
      list = s.aiCross === false ? rotated.slice(0, 1) : [...rotated, ...extraFallbacks];
    }
    list.forEach((p, i) => {
      const P = PROVIDERS[p]; const first = (i === 0 && preferModel) || selectedModel(p);
      if (first) add(p, first);
      if (s.aiAutoFallback !== false) P.chain.forEach(mm => add(p, mm));
    });
  };
  // v2.8 login accounts: every switched-on vendor becomes one route, in the user's order (all through the one Puter sign-in)
  const addLogin = () => { if (puterLinked()) activeLogins().forEach(id => add('puter', loginModel(id))); };
  if (src === 'login') addLogin();
  else if (src === 'api') addApi();
  else if (src === 'login-api') { if (multiPoolActive) { addApi(); addLogin(); } else { addLogin(); addApi(); } }
  else if (src === 'api-login') { addApi(); addLogin(); }
  else if (src === 'web') add('web', webSite().id);
  else { // 'default' — legacy order is unchanged unless the optional multi-provider API pool is active
    if (multiPoolActive && mode !== 'login') addApi();
    if (mode !== 'api' && !multiPoolActive && puterLinked()) add('puter', s.puterModel || '');
    if (mode !== 'login' && !multiPoolActive) addApi();
  }
  return routes;
}

/**
 * Main entry. Returns { text, model, provider, keyLabel, truncated }.
 * opts: json, maxTokens, temperature, model (preferred for the first provider), signal, onStatus(msg), system
 */
async function aiCallCore(prompt, opts = {}) {
  const { json = true, maxTokens = 2048, temperature = json ? 0.6 : 0.4, model, signal, onStatus = () => {}, system } = opts;
  if (typeof navigator !== 'undefined' && !navigator.onLine) throw new AIError('No internet connection. AI needs internet — all offline features still work.', 'offline');
  const mode = S().aiMode || 'auto';
  if (!aiReady()) throw new AIError(aiSource() === 'login' ? 'Sign in to Puter and switch on at least one AI account in Settings → AI accounts.' : aiSource() === 'login-api' || aiSource() === 'api-login' ? 'Add an AI API key or sign in (Settings → AI accounts) first.' : mode === 'login' ? 'Sign in to Puter in Settings → AI, or switch to "API keys".' : 'Add an AI API key (or sign in) in Settings → AI.', 'nokey');
  const routes = buildRoutes(model);
  if (!routes.length) throw new AIError('No AI provider is enabled. Check Settings → AI.', 'nokey');
  const st = { lastErr: null, sawLimit: false, minWait: Infinity, tried: 0 };
  const o = { json, maxTokens, temperature, signal, system };

  const runRoute = async (route, allowWait) => {
    const { provider, model: m } = route; const P = provider === 'puter' ? { name: 'Login account', kind: 'puter' } : provider === 'web' ? { name: 'Web chat', kind: 'web' } : PROVIDERS[provider];
    const cands = keyCandidates(provider); if (!cands.length) return null;
    let overload = 0, guard = 0;
    while (guard++ < cands.length * 3 + 6) {
      if (signal?.aborted) throw new AIError('Cancelled', 'abort');
      const avail = cands.map(k => ({ k, a: provider === 'puter' || provider === 'web' ? keyAvailability({ ...k, tier: 'paid' }, m || 'default') : keyAvailability(k, m) }));
      const ready = avail.filter(x => x.a.ok).sort((x, y) => x.a.used - y.a.used);
      if (!ready.length) {
        if (avail.some(x => ['daily', 'minute', 'cooldown'].includes(x.a.reason))) st.sawLimit = true;
        const waits = avail.filter(x => x.a.reason === 'minute' || x.a.reason === 'cooldown').map(x => x.a.wait);
        const w = waits.length ? Math.min(...waits) : Infinity; st.minWait = Math.min(st.minWait, w);
        if (allowWait && w <= MAX_WAIT_FOR_SLOT) { onStatus(`Staying inside the free limit — waiting ${Math.ceil(w / 1000)}s…`); await sleep(w, signal); continue; }
        return null;
      }
      const { k } = ready[0]; const slotModel = m || 'default';
      patchSlot(k.id, slotModel, s => { s.recent.push(Date.now()); s.count++; });
      onStatus(`Asking ${P.name} · ${modelLabel(provider, m) || 'default model'}${cands.length > 1 ? ` · key "${k.label || 'key'}"` : ''}…`);
      let r;
      try { r = await send(provider, k.key, m, prompt, o); }
      catch (e) {
        if (e.code === 'abort') throw e;
        if (e.code === 'nokey') { st.lastErr = e; return null; }
        st.lastErr = e;
        if (typeof navigator !== 'undefined' && !navigator.onLine) throw new AIError('Internet connection lost.', 'offline');
        patchSlot(k.id, slotModel, s => { s.cooldownUntil = Date.now() + 8000; });
        if (++overload >= 2) return null; continue;
      }
      if (r.ok) {
        if (!r.text) {
          if (r.blocked) throw new AIError(`${P.name} declined to answer this request (safety filter). Try rephrasing.`, 'blocked');
          st.lastErr = new AIError('Empty AI response', 'empty'); patchSlot(k.id, slotModel, s => { s.cooldownUntil = Date.now() + 4000; }); if (++overload >= 2) return null; continue;
        }
        if (provider !== 'puter' && provider !== 'web' && (k.status !== 'ok' || k.lastError)) updateKey(k.id, { status: 'ok', lastError: '', checkedAt: Date.now() });
        return { text: r.text, model: m, provider, keyLabel: k.label, truncated: !!r.truncated };
      }
      const msg = r.message || `${P.name} error ${r.status}`;
      if (r.signedOut) { ctx.getSettings().puterLinked = false; ctx.saveSettings(); st.lastErr = new AIError(msg, 'invalid'); return null; }
      if (r.status === 429 || r.status === 402) {
        st.sawLimit = true; const daily = r.status === 402 || r.daily;
        patchSlot(k.id, slotModel, s => { if (daily) s.dayBlocked = pacificDay(); else s.cooldownUntil = Date.now() + Math.max(r.retryMs || 0, 20000); });
        if (provider !== 'puter') updateKey(k.id, { status: 'limited', lastError: daily ? `Daily/credit limit reached on ${m}` : `Rate-limited on ${m}` });
        st.lastErr = new AIError(`${P.name} free limit reached.`, 'limit'); continue;
      }
      if (r.badKey || r.status === 401 || r.status === 403) {
        if (provider !== 'puter') updateKey(k.id, { status: 'invalid', lastError: (r.badKey ? 'API key not valid' : msg).slice(0, 160) });
        st.lastErr = new AIError(`${P.name} key rejected: ${msg}`, 'invalid'); continue;
      }
      if (r.status === 404) { st.lastErr = new AIError(`Model "${m}" is not available on ${P.name}.`, 'model'); onStatus(`Model ${m} unavailable — trying another…`); return null; }
      if (r.status >= 500) {
        overload++; patchSlot(k.id, slotModel, s => { s.cooldownUntil = Date.now() + 15000; });
        st.lastErr = new AIError(`${P.name} is overloaded right now.`, 'overload'); if (overload >= 2) return null; continue;
      }
      st.lastErr = new AIError(`${P.name}: ${msg}`, 'bad'); return null; // other 4xx: try the next model / provider
    }
    return null;
  };

  const pass = async allowWait => {
    for (const route of routes) {
      const r = await runRoute(route, allowWait); st.tried++;
      if (r) return r;
    }
    return null;
  };
  let result = await pass(false);
  if (!result && st.sawLimit && st.minWait <= MAX_WAIT_FOR_SLOT) result = await pass(true); // short per-minute limits: wait, then retry
  if (result) {
    if (result.provider !== routes[0]?.provider) onStatus(`Switched to ${providerName(result.provider)} ✓`);
    return result;
  }
  if (st.sawLimit) throw new AIError('Every AI key/provider has hit its free limit for now. Wait a minute (daily limits reset the next day), or add another key / provider in Settings → AI.', 'limit');
  throw st.lastErr || new AIError('AI request failed', 'error');
}

/** Test one key with a tiny request (uses 1 request of quota). */
export async function testKey(id, model) {
  const k = getKeys().find(x => x.id === id); if (!k) throw new AIError('Key not found', 'nokey');
  const provider = providerOf(k); const m = model || selectedModel(provider);
  if (!m) return { ok: false, message: 'Choose or type a model name for this provider first.' };
  patchSlot(k.id, m, s => { s.recent.push(Date.now()); s.count++; });
  let r; try { r = await send(provider, k.key, m, 'Reply with the single word OK', { json: false, maxTokens: 16, temperature: 0 }); }
  catch (e) { return { ok: false, message: e.message }; }
  if (r.ok) { updateKey(k.id, { status: 'ok', lastError: '', checkedAt: Date.now() }); return { ok: true, model: m, provider }; }
  const msg = r.message || `HTTP ${r.status}`;
  if (r.status === 429 || r.status === 402) { patchSlot(k.id, m, s => { if (r.daily || r.status === 402) s.dayBlocked = pacificDay(); else s.cooldownUntil = Date.now() + Math.max(r.retryMs || 0, 20000); }); updateKey(k.id, { status: 'limited', lastError: r.daily ? 'Daily free limit reached' : 'Rate-limited' }); return { ok: false, limited: true, message: 'Key works but its free limit / credit is used up right now.' }; }
  if (r.status === 404) return { ok: false, message: `Model ${m} not available for this key — choose another model.` };
  if (r.badKey || r.status === 400 || r.status === 401 || r.status === 403) { updateKey(k.id, { status: 'invalid', lastError: msg.slice(0, 160) }); return { ok: false, message: msg }; }
  return { ok: false, message: msg };
}
export async function testPuter() {
  const r = await puterSend(S().puterModel || '', 'Reply with the single word OK', { json: false, maxTokens: 16, temperature: 0 });
  return r.ok ? { ok: true } : { ok: false, message: r.message };
}

/** Ask a provider which models a key can use (fills the "all models" dropdown). */
export async function listModels(provider, keyId) {
  const k = (keyId ? getKeys().find(x => x.id === keyId) : keysOf(provider).find(usable)) || keysOf(provider)[0];
  if (!k) throw new AIError('Add a key for this provider first.', 'nokey');
  const P = PROVIDERS[provider]; let list = [];
  if (P.kind === 'gemini') {
    const out = []; let token = '';
    for (let page = 0; page < 5; page++) {
      const { res, body } = await fetchJson(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=200${token ? `&pageToken=${encodeURIComponent(token)}` : ''}`, { headers: { 'x-goog-api-key': k.key } });
      if (!res.ok) throw new AIError(errMessage(body, `Could not list models (${res.status})`), 'bad');
      for (const x of body.models || []) if ((x.supportedGenerationMethods || []).includes('generateContent')) out.push({ id: String(x.name).replace(/^models\//, ''), name: x.displayName || x.name });
      token = body.nextPageToken || ''; if (!token) break;
    }
    list = out.filter(x => !/embedding|aqa|imagen|veo|tts|image-generation|live|robotics/i.test(x.id));
  } else if (P.kind === 'anthropic') {
    const { res, body } = await fetchJson('https://api.anthropic.com/v1/models?limit=100', { headers: { 'x-api-key': k.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' } });
    if (!res.ok) throw new AIError(errMessage(body, `Could not list models (${res.status})`), 'bad');
    list = (body.data || []).map(x => ({ id: x.id, name: x.display_name || x.id }));
  } else {
    const base = (provider === 'custom' ? S().customBaseUrl || '' : P.base).replace(/\/+$/, ''); if (!base) throw new AIError('Set the custom base URL first.', 'nokey');
    const { res, body } = await fetchJson(`${base}/models`, { headers: { Authorization: `Bearer ${k.key}` } });
    if (!res.ok) throw new AIError(errMessage(body, `Could not list models (${res.status})`), 'bad');
    list = (body.data || body.models || []).map(x => ({ id: x.id || x.name, name: x.name || x.id, free: provider === 'openrouter' ? (x.pricing && Number(x.pricing.prompt) === 0 && Number(x.pricing.completion) === 0) || /:free$/.test(x.id) : undefined }))
      .filter(x => x.id && !/embed|whisper|tts|guard|moderation|dall|image|audio|realtime|rerank|transcribe|vision-preview/i.test(x.id));
  }
  list.sort((a, b) => (b.free ? 1 : 0) - (a.free ? 1 : 0) || String(a.id).localeCompare(String(b.id)));
  const s = ctx.getSettings(); s.aiModelLists = { ...(s.aiModelLists || {}), [provider]: list }; ctx.saveSettings();
  return list;
}
/** Static + fetched models for the dropdown of one provider. */
export function modelOptions(provider) {
  const P = PROVIDERS[provider]; const out = new Map();
  for (const [id, v] of Object.entries(P?.models || {})) out.set(id, { id, name: v.name, note: v.note || '' });
  for (const x of S().aiModelLists?.[provider] || []) if (!out.has(x.id)) out.set(x.id, { id: x.id, name: x.name || x.id, note: x.free ? 'free' : '' });
  return [...out.values()];
}

/* ---------------- v2.8 helpers for the "AI accounts" settings ---------------- */
export async function testLogin(id) {
  const m = loginModel(id); if (!m) return { ok: false, message: 'Type a model id for this AI first.' };
  const r = await puterSend(m, 'Reply with the single word OK', { json: false, maxTokens: 16, temperature: 0 });
  return r.ok ? { ok: true, model: m } : { ok: false, message: r.message };
}
/** Every chat model the signed-in Puter account can use (ids only, to keep settings small). */
export async function listPuterModels() {
  const p = await loadPuter(); let list = [];
  try { list = await p.ai.listModels(); } catch (e) { throw new AIError(e?.message || 'Could not load the Puter model list', 'bad'); }
  const ids = [...new Set((Array.isArray(list) ? list : []).map(x => (typeof x === 'string' ? x : x?.id)).filter(Boolean))].sort();
  const st = ctx.getSettings(); st.aiLogin = { ...(st.aiLogin || {}), modelList: ids }; ctx.saveSettings();
  return ids;
}
export function loginModelOptions(id) {
  const V = LOGIN_VENDORS[id]; const out = new Map(Object.entries(V?.models || {}));
  for (const mid of S().aiLogin?.modelList || []) if (id === 'other' || V.match.test(mid)) if (!out.has(mid)) out.set(mid, mid);
  return [...out].map(([mid, name]) => ({ id: mid, name }));
}

/* v3.1 — every AI answer can be logged centrally (AI history in every section). The logger is set by the app. */
let aiLogger = null;
export const setAiLogger = fn => { aiLogger = fn; };
export async function aiCall(prompt, opts = {}) {
  const r = await aiCallCore(prompt, opts);
  try { aiLogger && aiLogger(prompt, r, opts); } catch { /* logging must never break an AI call */ }
  return r;
}
