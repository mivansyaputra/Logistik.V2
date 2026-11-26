// Fenace Madrasah - pembungkus Electron (offline, portable)
const { app, BrowserWindow, Menu, session, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Data disimpan di folder "FenaceData" di sebelah file .exe (ikut terbawa saat dipindah/flashdisk).
// Kalau folder itu tidak bisa ditulis, otomatis pakai lokasi bawaan Windows (AppData).
function pilihFolderData() {
  const dasar = process.env.PORTABLE_EXECUTABLE_DIR || (app.isPackaged ? path.dirname(process.execPath) : __dirname);
  const target = path.join(dasar, 'FenaceData');
  try {
    fs.mkdirSync(target, { recursive: true });
    fs.accessSync(target, fs.constants.W_OK);
    return target;
  } catch (e) {
    return null;
  }
}
const folderData = pilihFolderData();
if (folderData) app.setPath('userData', folderData);

if (!app.requestSingleInstanceLock()) { app.quit(); }

let win;
function buatJendela() {
  win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 980, minHeight: 640,
    backgroundColor: '#03120d',
    title: 'Fenace Madrasah',
    icon: path.join(__dirname, 'icon.ico'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false }
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'index.html'));
  win.once('ready-to-show', () => win.show());
  // tautan luar dibuka di browser, bukan di dalam aplikasi
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/i.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file:')) { e.preventDefault(); if (/^https?:/i.test(url)) shell.openExternal(url); } });
  win.on('closed', () => { win = null; });
}

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

app.whenReady().then(() => {
  // izinkan kamera (foto nota) saja; izin lain ditolak
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => cb(perm === 'media'));
  buatJendela();
  if (!folderData) {
    dialog.showMessageBox({ type: 'info', message: 'Folder di sebelah aplikasi tidak bisa ditulis.', detail: 'Data disimpan di folder bawaan Windows (AppData). Pindahkan aplikasi ke folder yang bisa ditulis agar datanya ikut terbawa.' });
  }
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) buatJendela(); });
});
app.on('window-all-closed', () => app.quit());
