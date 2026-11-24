// Shared helpers for the Study Suite. Reuses the UPSC core (glass UI helpers, AI wrapper, markdown) and the same app context.
import { C, setC, esc, $, $$, uid, pct, DAY, dayKey, head, bar, chip, tabsHtml, ui, empty, mdx, hasAI, ask, toast, SYSTEM_UPSC, weakTopics, recentMistakes, generateFor, fmtMin } from '../upsc/core.js';
import { attachMic, speak, stopSpeak } from '../voice.js';
export { C, setC, esc, $, $$, uid, pct, DAY, dayKey, head, bar, chip, tabsHtml, ui, empty, mdx, hasAI, ask, toast, SYSTEM_UPSC, weakTopics, recentMistakes, generateFor, fmtMin, attachMic, speak, stopSpeak };
/** One module's saved state inside db.studio (part of the normal local store → included in backup/restore). */
export const S = (k, def) => { const d = C.db; if (!d.studio || typeof d.studio !== 'object') d.studio = {}; if (!d.studio[k] || typeof d.studio[k] !== 'object') d.studio[k] = typeof def === 'function' ? def() : def; return d.studio[k]; };
export const save = () => C.save();
export const mic = (btn, target, lang) => attachMic(btn, target, { AI: C.AI, toast, lang: lang || (() => 'English') });
export const when = t => new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
/** JSON from the AI through the existing engine (providers/keys/fallback). */
export async function askJSON(prompt, o = {}) { const r = await ask(prompt, { json: true, system: SYSTEM_UPSC, maxTokens: 4000, ...o }); const j = C.AI.parseJsonLoose(r.text); return { j, r }; }
export const modelTag = r => { try { return `${C.AI.providerName(r.provider)} · ${C.AI.modelLabel(r.provider, r.model)}`; } catch { return ''; } };
/** Read a user file: PDF → text, TXT/MD → text, image → compressed data URL. */
export async function readAny(file, onProgress) {
  const n = file.name || 'file'; const lower = n.toLowerCase();
  if (/\.pdf$/i.test(lower) || file.type === 'application/pdf') { const pdf = await C.getPdfEngines(); const text = pdf.genericText(await pdf.extractPages(file, onProgress)); return { kind: 'text', name: n, text }; }
  if (file.type?.startsWith('image/')) return { kind: 'image', name: n, dataUrl: await compressImage(file) };
  return { kind: 'text', name: n, text: await file.text() };
}
export function compressImage(fileOrBlob, max = 1000, q = 0.72) {
  return new Promise((res, rej) => { const img = new Image(); const url = URL.createObjectURL(fileOrBlob); img.onload = () => { const r = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(img.width * r)); c.height = Math.max(1, Math.round(img.height * r)); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', q)); }; img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Could not read the image')); }; img.src = url; });
}
export const download = (name, data, mime) => C.saveFile(name, data, mime).then(r => toast(`Saved (${r.where}) ✓`));
export const slug = s => C.slug(s || 'file');
/** Plain text of a long source cut into ~size-char chunks on paragraph boundaries. */
export function chunkText(t, size = 9000) { const parts = String(t || '').split(/\n{2,}/); const out = []; let cur = ''; for (const p of parts) { if ((cur + '\n\n' + p).length > size && cur) { out.push(cur); cur = ''; } cur += (cur ? '\n\n' : '') + p; while (cur.length > size * 1.4) { out.push(cur.slice(0, size)); cur = cur.slice(size); } } if (cur.trim()) out.push(cur); return out; }
export const needAI = () => { if (hasAI()) return true; toast('Add an AI key (or sign in) under Settings → AI first'); return false; };
export const aiBanner = () => (hasAI() ? '' : '<div class="notice compact" style="margin:8px 0">✦ AI is not set up — this part needs an API key (Settings → AI). Everything else here works offline.</div>');
