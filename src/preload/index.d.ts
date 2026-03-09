import { ElectronAPI } from '@electron-toolkit/preload'

interface AppSettings {
  apiUrl: string
  simbriefPilotId: string
  exportDir: string
  panelWidth: number
}

interface ExportResult {
  success: boolean
  path?: string
  error?: string
}

interface Api {
  minimizeWindow: () => void
  maximizeWindow: () => void
  closeWindow: () => void
  getSettings: () => Promise<AppSettings>
  saveSettings: (settings: Partial<AppSettings>) => Promise<boolean>
  selectDirectory: () => Promise<string | null>
  exportChart: (data: {
    pdfData: number[]
    exportDir: string
    icao: string
    chartName: string
  }) => Promise<ExportResult>
  getDefaultExportDir: () => Promise<string>
  checkForUpdates: () => Promise<{ available: boolean; version?: string; error?: string }>
  downloadUpdate: () => Promise<{ success: boolean; error?: string }>
  installUpdate: () => void
  onUpdateAvailable: (callback: (version: string) => void) => void
  onUpdateDownloaded: (callback: (version: string) => void) => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
