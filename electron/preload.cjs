const { contextBridge, ipcRenderer } = require('electron');
// Only one narrow capability is exposed: fetching text from an http(s) URL for the Current Affairs Hub.
contextBridge.exposeInMainWorld('quizinoxNet', { fetchText: url => ipcRenderer.invoke('quizinox:fetch-text', String(url)) });
// Keep the renderer isolated; expose no Node APIs to the app.
window.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('desktop-app');
});
