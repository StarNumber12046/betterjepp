import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

interface ExportResult {
  success: boolean
  path?: string
  error?: string
}

const api = {
  minimizeWindow: (): void => ipcRenderer.send('window-minimize'),
  maximizeWindow: (): void => ipcRenderer.send('window-maximize'),
  closeWindow: (): void => ipcRenderer.send('window-close'),

  getSettings: (): Promise<{
    apiUrl: string
    simbriefPilotId: string
    exportDir: string
    panelWidth: number
    georefEnabled: boolean
    xplaneSendPort: number
    xplaneListenPort: number
  }> => ipcRenderer.invoke('get-settings'),

  saveSettings: (settings: {
    apiUrl?: string
    simbriefPilotId?: string
    exportDir?: string
    panelWidth?: number
    georefEnabled?: boolean
    xplaneSendPort?: number
    xplaneListenPort?: number
  }): Promise<boolean> => ipcRenderer.invoke('save-settings', settings),

  selectDirectory: (): Promise<string | null> => ipcRenderer.invoke('select-directory'),

  exportChart: (data: {
    pdfData: number[]
    exportDir: string
    icao: string
    chartName: string
  }): Promise<ExportResult> => ipcRenderer.invoke('export-chart', data),

  getDefaultExportDir: (): Promise<string> => ipcRenderer.invoke('get-default-export-dir'),

  checkForUpdates: (): Promise<{ available: boolean; version?: string; error?: string }> =>
    ipcRenderer.invoke('check-for-updates'),

  downloadUpdate: (): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('download-update'),

  installUpdate: (): Promise<void> => ipcRenderer.invoke('install-update'),

  onUpdateAvailable: (callback: (version: string) => void) => {
    ipcRenderer.on('update-available', (_event, version) => callback(version))
  },

  onUpdateDownloaded: (callback: (version: string) => void) => {
    ipcRenderer.on('update-downloaded', (_event, version) => callback(version))
  },

  setGeorefEnabled: (enabled: boolean): Promise<boolean> =>
    ipcRenderer.invoke('set-georef-enabled', enabled),

  setXplanePorts: (sendPort: number, listenPort: number): Promise<boolean> =>
    ipcRenderer.invoke('set-xplane-ports', sendPort, listenPort),

  getXplaneConnected: (): Promise<boolean> => ipcRenderer.invoke('get-xplane-connected'),

  onXplanePosition: (
    callback: (position: { lat: number; lon: number; heading: number }) => void
  ) => {
    ipcRenderer.on('xplane-position', (_event, position) => callback(position))
  },

  onXplaneConnected: (callback: (connected: boolean) => void) => {
    ipcRenderer.on('xplane-connected', (_event, connected) => callback(connected))
  },

  onWindowFocused: (callback: (focused: boolean) => void) => {
    ipcRenderer.on('window-focused', (_event, focused) => callback(focused))
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
