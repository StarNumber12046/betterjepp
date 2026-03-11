import { ipcMain, dialog, BrowserWindow, app } from 'electron'
import { join } from 'path'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { existsSync } from 'fs'

let settingsPath: string

export interface AppSettings {
  apiUrl: string
  simbriefPilotId: string
  exportDir: string
  panelWidth: number
}

const DEFAULT_SETTINGS: AppSettings = {
  apiUrl: 'http://localhost:8080',
  simbriefPilotId: '',
  exportDir: '',
  panelWidth: 280
}

async function loadSettings(): Promise<AppSettings> {
  try {
    if (existsSync(settingsPath)) {
      const content = await readFile(settingsPath, 'utf-8')
      const data = JSON.parse(content)
      return { ...DEFAULT_SETTINGS, ...data }
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
  return DEFAULT_SETTINGS
}

async function saveSettings(settings: AppSettings): Promise<void> {
  await writeFile(settingsPath, JSON.stringify(settings, null, 2))
}

export function registerSettingsHandlers() {
  app.whenReady().then(() => {
    settingsPath = join(app.getPath('userData'), 'settings.json')
  })

  ipcMain.handle('get-settings', async (): Promise<AppSettings> => {
    return loadSettings()
  })

  ipcMain.handle('save-settings', async (_, settings: Partial<AppSettings>) => {
    const current = await loadSettings()
    const updated = { ...current, ...settings }
    await saveSettings(updated)
    return true
  })
}

export function registerExportHandlers() {
  ipcMain.handle('select-directory', async () => {
    const window = BrowserWindow.getFocusedWindow()
    const result = await dialog.showOpenDialog(window!, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Export Directory'
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return result.filePaths[0]
  })

  ipcMain.handle(
    'export-chart',
    async (
      _,
      {
        pdfData,
        exportDir,
        icao,
        chartName
      }: {
        pdfData: number[]
        exportDir: string
        icao: string
        chartName: string
      }
    ) => {
      console.log('[Export] IPC received:', {
        exportDir,
        icao,
        chartName,
        pdfDataLength: pdfData?.length
      })
      try {
        const dir = join(exportDir, icao)
        console.log('[Export] Creating directory:', dir)

        await mkdir(dir, { recursive: true })

        const filePath = join(dir, `${chartName}.pdf`)
        console.log('[Export] Writing to file:', filePath)

        const buffer = Buffer.from(pdfData)
        await writeFile(filePath, buffer)

        console.log('[Export] Success! File saved to:', filePath)
        return { success: true, path: filePath }
      } catch (error) {
        console.error('[Export] Error:', error)
        return { success: false, error: String(error) }
      }
    }
  )

  ipcMain.handle('get-default-export-dir', () => {
    return app.getPath('documents')
  })
}

export function registerWindowControlHandlers() {
  ipcMain.on('window-minimize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    window?.minimize()
  })

  ipcMain.on('window-maximize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window?.isMaximized()) {
      window.unmaximize()
    } else {
      window?.maximize()
    }
  })

  ipcMain.on('window-close', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    window?.close()
  })
}

export function registerAllIpcHandlers() {
  registerSettingsHandlers()
  registerExportHandlers()
  registerWindowControlHandlers()
}
