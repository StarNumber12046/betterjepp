import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.png?asset'
import { registerAllIpcHandlers } from './ipc'
import { xplaneService } from './xplane'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    titleBarStyle: 'hidden',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    xplaneService.setMainWindow(mainWindow!)
    xplaneService.start(49000, 49001).catch(console.error)
  })

  mainWindow.on('focus', () => {
    xplaneService.setWindowFocused(true)
  })

  mainWindow.on('blur', () => {
    xplaneService.setWindowFocused(false)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
  console.log(process.argv)
  if (process.argv.includes('--open-devtools')) {
    console.log('open devtools')
    mainWindow.webContents.openDevTools()
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')
  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Register IPC handlers
  registerAllIpcHandlers()

  // Auto-updater setup
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  // Check for updates on startup (only in production)
  if (!is.dev) {
    autoUpdater.checkForUpdates().catch((err) => console.error('Startup update check failed:', err))
  }

  ipcMain.handle('check-for-updates', async () => {
    try {
      const result = await autoUpdater.checkForUpdates()
      return {
        available: result?.updateInfo?.version !== app.getVersion(),
        version: result?.updateInfo?.version
      }
    } catch (error) {
      console.error('Update check failed:', error)
      return { available: false, error: String(error) }
    }
  })

  ipcMain.handle('download-update', async () => {
    try {
      await autoUpdater.downloadUpdate()
      return { success: true }
    } catch (error) {
      console.error('Update download failed:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('install-update', () => {
    autoUpdater.quitAndInstall()
  })

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update-available', info.version)
  })

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow?.webContents.send('update-downloaded', info.version)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
