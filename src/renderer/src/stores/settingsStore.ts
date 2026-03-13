import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AppSettings, DEFAULT_SETTINGS } from '@/types'
import { updateApiBaseUrl } from '@/lib/api-client'

interface SettingsState {
  settings: AppSettings
  setApiUrl: (url: string) => void
  setSimbriefPilotId: (id: string) => void
  setExportDir: (dir: string) => void
  setPanelWidth: (width: number) => void
  setGeorefEnabled: (enabled: boolean) => void
  setXplaneSendPort: (port: number) => void
  setXplaneListenPort: (port: number) => void
  loadSettings: (settings: Partial<AppSettings>) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,

      setApiUrl: (url: string) => {
        set((state) => ({
          settings: { ...state.settings, apiUrl: url }
        }))
        updateApiBaseUrl(url)
      },

      setSimbriefPilotId: (id: string) => {
        set((state) => ({
          settings: { ...state.settings, simbriefPilotId: id }
        }))
      },

      setExportDir: (dir: string) => {
        set((state) => ({
          settings: { ...state.settings, exportDir: dir }
        }))
      },

      setPanelWidth: (width: number) => {
        set((state) => ({
          settings: { ...state.settings, panelWidth: width }
        }))
      },

      setGeorefEnabled: (enabled: boolean) => {
        set((state) => ({
          settings: { ...state.settings, georefEnabled: enabled }
        }))
        window.api.setGeorefEnabled(enabled)
      },

      setXplaneSendPort: (port: number) => {
        set((state) => ({
          settings: { ...state.settings, xplaneSendPort: port }
        }))
      },

      setXplaneListenPort: (port: number) => {
        set((state) => ({
          settings: { ...state.settings, xplaneListenPort: port }
        }))
      },

      loadSettings: (newSettings: Partial<AppSettings>) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        }))
        if (newSettings.apiUrl) {
          updateApiBaseUrl(newSettings.apiUrl)
        }
        if (newSettings.georefEnabled !== undefined) {
          window.api.setGeorefEnabled(newSettings.georefEnabled)
        }
      }
    }),
    {
      name: 'betterjepp-settings',
      onRehydrateStorage: () => (state) => {
        if (state?.settings.apiUrl) {
          updateApiBaseUrl(state.settings.apiUrl)
        }
      }
    }
  )
)

export function initializeSettings() {
  const settings = useSettingsStore.getState().settings
  updateApiBaseUrl(settings.apiUrl)
}
