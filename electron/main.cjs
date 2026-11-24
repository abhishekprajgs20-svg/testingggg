const { app, BrowserWindow, session, shell, ipcMain, net } = require('electron');
const path = require('node:path');

app.setName('QUIZINOX');
app.setAppUserModelId('com.quizinox.desktop');

function uniqueDownloadPath(fileName) {
  const downloads = app.getPath('downloads');
  const ext = path.extname(fileName);
  const stem = path.basename(fileName, ext);
  let candidate = path.join(downloads, fileName);
  let n = 2;
  const fs = require('node:fs');
  while (fs.existsSync(candidate)) candidate = path.join(downloads, `${stem} (${n++})${ext}`);
  return candidate;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 980,
    minHeight: 680,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0a0f1b',
    title: 'QUIZINOX',
    icon: path.join(__dirname, '..', 'build', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
      backgroundThrottling: false
    }
  });
  win.once('ready-to-show', () => win.show());
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  win.webContents.setWindowOpenHandler(({ url }) => {
    try { const h = new URL(url).hostname; if (h === 'puter.com' || h.endsWith('.puter.com')) return { action: 'allow' }; } catch { /* ignore */ }
    if (url.startsWith('https://') || url.startsWith('http://')) shell.openExternal(url);
    return { action: 'deny' };
  });
  return win;
}

// Current Affairs Hub: fetch RSS/article text from the main process (no browser CORS limits). http(s) only, text only, size-capped.
ipcMain.handle('quizinox:fetch-text', async (_e, url) => {
  try {
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) return { ok: false, error: 'Only http(s) addresses are allowed.' };
    const res = await net.fetch(url, { headers: { 'User-Agent': 'QUIZINOX/3.0 (+reader)', Accept: 'application/rss+xml, application/xml, text/xml, text/html, */*' }, signal: AbortSignal.timeout(20000) });
    if (!res.ok) return { ok: false, status: res.status, error: `HTTP ${res.status}` };
    const text = await res.text();
    return { ok: true, text: text.slice(0, 3000000) };
  } catch (e) { return { ok: false, error: String((e && e.message) || e) }; }
});

app.whenReady().then(() => {
  // Voice input: allow the microphone (and nothing else) for the app window.
  session.defaultSession.setPermissionRequestHandler((_wc, permission, cb, details) => cb(permission === 'media' && (!details || !details.mediaTypes || details.mediaTypes.every(t => t === 'audio'))));
  session.defaultSession.setPermissionCheckHandler((_wc, permission) => permission === 'media');
  // Keep generated exports easy to find on Windows.
  session.defaultSession.on('will-download', (_event, item) => {
    item.setSavePath(uniqueDownloadPath(item.getFilename()));
  });
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
