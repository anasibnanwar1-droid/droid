const { app, BrowserWindow, shell } = require('electron')
const { spawn } = require('node:child_process')
const path = require('node:path')

const isDev = !app.isPackaged
const DEV_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
let backend = null

// Spawn the local Node backend (WebSocket + SQLite + git + droid manager).
// Uses system Node so node:sqlite (Node >= 22.5) is available regardless of
// Electron's bundled Node version.
function startBackend() {
  const repoRoot = path.join(__dirname, '..')
  if (isDev) {
    backend = spawn(
      'node',
      ['--experimental-sqlite', '--import', 'tsx', path.join(repoRoot, 'server', 'index.ts')],
      { cwd: repoRoot, stdio: 'inherit', env: process.env },
    )
  } else {
    backend = spawn('node', ['--experimental-sqlite', path.join(process.resourcesPath, 'server.cjs')], {
      stdio: 'inherit',
      env: process.env,
    })
  }
  backend.on('error', (err) => console.error('[droid] backend failed to start:', err))
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1040,
    minHeight: 640,
    backgroundColor: '#0d0c0b',
    show: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 14 },
    vibrancy: 'sidebar',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.once('ready-to-show', () => win.show())
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) win.loadURL(DEV_URL)
  else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
}

app.whenReady().then(() => {
  startBackend()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('quit', () => {
  if (backend) backend.kill()
})
