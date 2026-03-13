import { create } from 'zustand'
import { GeoRefStatus } from '@/lib/api-types'

export interface AircraftPosition {
  lat: number
  lon: number
  heading: number
}

interface GeorefState {
  position: AircraftPosition | null
  chartGeoStatus: GeoRefStatus | null
  xplaneConnected: boolean
  windowFocused: boolean

  setPosition: (position: AircraftPosition | null) => void
  setChartGeoStatus: (status: GeoRefStatus | null) => void
  setXplaneConnected: (connected: boolean) => void
  setWindowFocused: (focused: boolean) => void
  reset: () => void
}

export const useGeorefStore = create<GeorefState>()((set) => ({
  position: null,
  chartGeoStatus: null,
  xplaneConnected: false,
  windowFocused: true,

  setPosition: (position) => set({ position }),
  setChartGeoStatus: (status) => set({ chartGeoStatus: status }),
  setXplaneConnected: (connected) => set({ xplaneConnected: connected }),
  setWindowFocused: (focused) => set({ windowFocused: focused }),
  reset: () =>
    set({
      position: null,
      chartGeoStatus: null,
      xplaneConnected: false
    })
}))

export function initGeorefListeners() {
  window.api.onXplanePosition((position) => {
    useGeorefStore.getState().setPosition(position)
  })

  window.api.onXplaneConnected((connected) => {
    useGeorefStore.getState().setXplaneConnected(connected)
  })

  window.api.onWindowFocused((focused) => {
    useGeorefStore.getState().setWindowFocused(focused)
  })
}
