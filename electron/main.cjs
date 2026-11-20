const { app, BrowserWindow, session, shell } = require('electron');
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

app.whenReady().then(() => {
  // Keep generated exports easy to find on Windows.
  session.defaultSession.on('will-download', (_event, item) => {
    item.setSavePath(uniqueDownloadPath(item.getFilename()));
  });
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
