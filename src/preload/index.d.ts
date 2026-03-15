import { ElectronAPI } from '@electron-toolkit/preload'

interface AppSettings {
  apiUrl: string
  simbriefPilotId: string
  exportDir: string
  panelWidth: number
  georefEnabled: boolean
  xplaneSendPort: number
  xplaneListenPort: number
}

interface ExportResult {
  success: boolean
  path?: string
  error?: string
}

interface AircraftPosition {
  lat: number
  lon: number
  heading: number
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
  installUpdate: () => Promise<void>
  onUpdateAvailable: (callback: (version: string) => void) => void
  onUpdateDownloaded: (callback: (version: string) => void) => void
  setGeorefEnabled: (enabled: boolean) => Promise<boolean>
  setXplanePorts: (sendPort: number, listenPort: number) => Promise<boolean>
  getXplaneConnected: () => Promise<boolean>
  getMsfsConnected: () => Promise<boolean>
  onXplanePosition: (callback: (position: AircraftPosition) => void) => void
  onXplaneConnected: (callback: (connected: boolean) => void) => void
  onMsfsPosition: (callback: (position: AircraftPosition) => void) => void
  onMsfsConnected: (callback: (connected: boolean) => void) => void
  onWindowFocused: (callback: (focused: boolean) => void) => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
