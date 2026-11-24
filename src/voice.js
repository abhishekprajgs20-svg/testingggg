// Voice input (v3.2) for Android (Capacitor WebView), Windows (Electron) and browsers.
// Browser/Chrome with a working speech API → live recognition. Otherwise → record the microphone and transcribe with the
// user's own AI key (see aiTranscribe). Microphone permission is requested by the OS/WebView when you first press the button.
import { isNative } from './native.js';
const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
const electron = typeof window !== 'undefined' && !!window.quizinoxNet;
export const voiceSupported = () => !!(SR || (navigator.mediaDevices?.getUserMedia && window.MediaRecorder));
/** Turns `btn` into a mic button that appends dictated text to `target` (textarea/input). */
export function attachMic(btn, target, { AI, toast, lang = () => 'English', onText } = {}) {
  if (!btn) return; if (!voiceSupported()) { btn.disabled = true; btn.title = 'Voice input is not supported on this device'; return; }
  let rec = null, stream = null, chunks = [], timer = null, mr = null, busy = false; const idle = '🎤';
  const set = (txt, cls) => { btn.textContent = txt; btn.classList.toggle('mic-on', cls === 'on'); btn.classList.toggle('mic-busy', cls === 'busy'); };
  const put = t => { t = String(t || '').trim(); if (!t) return toast?.('No speech detected'); const el = typeof target === 'function' ? target() : target; if (!el) return; el.value = (el.value ? el.value.replace(/\s+$/, '') + ' ' : '') + t; el.dispatchEvent(new Event('input', { bubbles: true })); onText?.(t); };
  const stopAll = () => { clearTimeout(timer); try { stream?.getTracks().forEach(t => t.stop()); } catch { /* */ } stream = null; };
  const useRecorder = isNative() || electron || !SR; const L = () => (/hindi/i.test(lang()) ? 'hi-IN' : 'en-IN');
  btn.type = 'button'; btn.textContent = idle; btn.title = 'Voice input — tap to speak, tap again to stop';
  btn.onclick = async () => {
    if (busy) return;
    if (!useRecorder) {
      if (rec) { rec.stop(); return; }
      rec = new SR(); rec.lang = L(); rec.interimResults = false; rec.continuous = true;
      rec.onresult = e => put([...e.results].slice(e.resultIndex).map(r => r[0].transcript).join(' '));
      rec.onerror = e => { toast?.(e.error === 'not-allowed' ? 'Microphone permission was denied — allow it in the browser/app settings' : e.error === 'no-speech' ? 'No speech detected' : 'Voice input failed (' + e.error + ')'); };
      rec.onend = () => { rec = null; set(idle); }; try { rec.start(); set('⏹', 'on'); } catch { rec = null; set(idle); } return;
    }
    if (mr && mr.state === 'recording') { mr.stop(); return; }
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
    catch (e) { return toast?.(e.name === 'NotAllowedError' || e.name === 'SecurityError' ? 'Microphone permission denied — allow “Microphone” for QUIZINOX in your device settings, then try again.' : e.name === 'NotFoundError' ? 'No microphone was found on this device.' : 'Could not start the microphone: ' + e.message); }
    chunks = []; const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']; const type = types.find(t => window.MediaRecorder.isTypeSupported?.(t));
    try { mr = new MediaRecorder(stream, type ? { mimeType: type } : undefined); } catch (e) { stopAll(); return toast?.('Recording is not supported here: ' + e.message); }
    mr.ondataavailable = e => { if (e.data?.size) chunks.push(e.data); };
    mr.onstop = async () => {
      stopAll(); const blob = new Blob(chunks, { type: mr.mimeType || type || 'audio/webm' }); set('⏳', 'busy'); busy = true;
      try { if (!AI) throw new Error('AI is not available'); put(await AI.aiTranscribe(blob, { lang: lang() })); }
      catch (e) { toast?.(e.message || 'Transcription failed'); } finally { busy = false; set(idle); }
    };
    mr.start(); set('⏹', 'on'); toast?.('Listening… tap ⏹ when you finish'); timer = setTimeout(() => { if (mr?.state === 'recording') mr.stop(); }, 120000);
  };
}
export const speak = (text, lang = 'en-IN') => { try { if (!window.speechSynthesis) return false; window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(String(text).replace(/[*#`_>|]/g, ' ').slice(0, 1800)); u.lang = lang; window.speechSynthesis.speak(u); return true; } catch { return false; } };
export const stopSpeak = () => { try { window.speechSynthesis?.cancel(); } catch { /* */ } };
