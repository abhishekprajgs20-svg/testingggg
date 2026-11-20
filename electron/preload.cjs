const { contextBridge } = require('electron');
// Keep the renderer isolated; expose no Node APIs to the app.
window.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('desktop-app');
});
