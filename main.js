const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    icon: path.join(__dirname, 'icon.png'),
    title: 'BPM Metronome App',
    show: false // Don't show until ready
  });

  // Load the app
  mainWindow.loadFile('index.html');

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Repertory',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.executeJavaScript('addNewRepertorio()');
          }
        },
        {
          label: 'Add Music',
          accelerator: 'CmdOrCtrl+M',
          click: () => {
            mainWindow.webContents.executeJavaScript('openAddMusicModal()');
          }
        },
        { type: 'separator' },
        {
          label: 'Export Repertory',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              const currentId = window.currentRepertorioId || 'default';
              exportSingleRepertorio(currentId);
            `);
          }
        },
        {
          label: 'Import Repertory',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              const currentId = window.currentRepertorioId || 'default';
              importSingleRepertorio(currentId);
            `);
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Playback',
      submenu: [
        {
          label: 'Play/Pause Metronome',
          accelerator: 'Space',
          click: () => {
            mainWindow.webContents.executeJavaScript('toggleMetronome()');
          }
        },
        {
          label: 'Play All',
          accelerator: 'CmdOrCtrl+Space',
          click: () => {
            mainWindow.webContents.executeJavaScript('toggleMasterPlay()');
          }
        },
        { type: 'separator' },
        {
          label: 'Next Preset',
          accelerator: 'CmdOrCtrl+Right',
          click: () => {
            mainWindow.webContents.executeJavaScript('nextPreset()');
          }
        },
        {
          label: 'Previous Preset',
          accelerator: 'CmdOrCtrl+Left',
          click: () => {
            mainWindow.webContents.executeJavaScript('previousPreset()');
          }
        },
        { type: 'separator' },
        {
          label: 'Tap BPM',
          accelerator: 'T',
          click: () => {
            mainWindow.webContents.executeJavaScript('calcBPM()');
          }
        },
        {
          label: 'Reset BPM',
          accelerator: 'R',
          click: () => {
            mainWindow.webContents.executeJavaScript('resetBPM()');
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About BPM Metronome App',
              message: 'BPM Metronome App',
              detail: 'A powerful BPM calculator and metronome with ambient pads.\n\nVersion 1.0.0\nBuilt with Electron'
            });
          }
        }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(() => {
  createWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    require('electron').shell.openExternal(navigationUrl);
  });
});
