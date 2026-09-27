import { app, BrowserWindow } from 'electron'
import path from 'path'
import { registerIpcHandlers } from './ipc'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    fullscreen: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Shortcut Fullscreen & Windowed Mode
  mainWindow.webContents.on('before-input-event', (event, input) => {
    const isF11 = input.key === 'F11'
    const isAltEnter = input.key === 'Enter' && input.alt
    const isAltF4 = input.key === 'F4' && input.alt

    if ((isF11 || isAltEnter) && input.type === 'keyDown') {
      if (mainWindow) mainWindow.setFullScreen(!mainWindow.isFullScreen())
      event.preventDefault()
    }

    if (isAltF4 && input.type === 'keyDown') {
      app.quit()  // Force keluar total dari aplikasi
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // Panggil IPC handler backend di sini
  registerIpcHandlers()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})