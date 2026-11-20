// QUIZINOX v2.6 — large on-device storage.
// Old versions kept everything in the browser's tiny "localStorage" (about 5 MB on
// Android and Windows). This module keeps the data in IndexedDB instead, which can
// use hundreds of MB or more (a share of the phone/PC free space). The app still
// reads synchronously from an in-memory copy; writes go to disk in the background.

const DB_NAME = 'quizinox_data', DB_STORE = 'kv', DB_VERSION = 1;
let idb = null;               // IDBDatabase, or null when IndexedDB is unavailable
const cache = new Map();      // key -> string value (in-memory copy)
const pending = new Map();    // key -> latest unwritten value (null = delete)
let writing = false, onError = () => {}, onSaved = () => {};
let lastBytes = {};           // key -> bytes on disk (approx, UTF-16 length * 2 not needed — we use string length)

function openDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) return reject(new Error('no-indexeddb'));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => { const d = req.result; if (!d.objectStoreNames.contains(DB_STORE)) d.createObjectStore(DB_STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('blocked'));
  });
}
function idbGet(key) {
  return new Promise((resolve, reject) => { const r = idb.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).get(key); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
}
function idbWrite(key, value) {
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(DB_STORE, 'readwrite'); const os = tx.objectStore(DB_STORE);
    if (value == null) os.delete(key); else os.put(value, key);
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error || new Error('aborted'));
  });
}

/**
 * Load the given keys into memory. Moves any data still sitting in the old
 * localStorage into IndexedDB (one time), then frees the old space.
 */
export async function initStorage(keys, { error, saved } = {}) {
  if (error) onError = error; if (saved) onSaved = saved;
  try { idb = await openDb(); } catch { idb = null; }
  for (const key of keys) {
    let val = null;
    if (idb) { try { val = await idbGet(key); } catch { val = null; } }
    let legacy = null; try { legacy = localStorage.getItem(key); } catch { /* */ }
    if (val == null && legacy != null) {
      val = legacy;
      if (idb) {
        try { await idbWrite(key, legacy); localStorage.removeItem(key); } // migrated → free the 5 MB area
        catch { /* keep legacy copy, try again next launch */ }
      }
    } else if (val != null && legacy != null && idb) {
      try { localStorage.removeItem(key); } catch { /* */ }
    }
    if (val != null) { cache.set(key, String(val)); lastBytes[key] = String(val).length; }
  }
  // Ask the system not to auto-clear our data when the device is low on space.
  try { if (navigator.storage?.persist && !(await navigator.storage.persisted?.())) await navigator.storage.persist(); } catch { /* */ }
  return { engine: idb ? 'indexeddb' : 'localstorage' };
}

export const engine = () => (idb ? 'indexeddb' : 'localstorage');
export function getItem(key) { return cache.has(key) ? cache.get(key) : null; }

async function flush() {
  if (writing) return; writing = true;
  try {
    while (pending.size) {
      const [key, value] = pending.entries().next().value; pending.delete(key);
      try {
        if (idb) await idbWrite(key, value);
        else if (value == null) localStorage.removeItem(key); else localStorage.setItem(key, value);
        lastBytes[key] = value == null ? 0 : value.length; onSaved(key);
      } catch (e) { onError(e, key); }
    }
  } finally { writing = false; }
}
/** Save a string value. Memory is updated immediately; disk write is queued. */
export function setItem(key, value) { value = String(value); cache.set(key, value); pending.set(key, value); queueMicrotask(flush); }
export function removeItem(key) { cache.delete(key); pending.set(key, null); queueMicrotask(flush); }
/** Resolves once every queued write has reached disk. */
export async function whenSaved() { while (writing || pending.size) { await flush(); await new Promise(r => setTimeout(r, 20)); } }

/** Approximate size of a saved key in KB. */
export function sizeKB(key) { const v = cache.get(key); return v ? Math.round(v.length / 1024) : 0; }
/** { usedMB, quotaMB } for the whole app, when the system reports it. */
export async function estimate() {
  try { const e = await navigator.storage?.estimate?.(); if (e && e.quota) return { usedMB: (e.usage || 0) / 1048576, quotaMB: e.quota / 1048576 }; } catch { /* */ }
  return null;
}
export function isQuotaError(e) { return !!e && (e.name === 'QuotaExceededError' || e.code === 22 || /quota/i.test(e.message || '')); }
export function onStorageEvents({ error, saved } = {}) { if (error) onError = error; if (saved) onSaved = saved; }
