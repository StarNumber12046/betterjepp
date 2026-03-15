import { create } from 'zustand'
import { ChartDataResponse } from '@/lib/api-types'

export interface AircraftPosition {
  lat: number
  lon: number
  heading: number
}

interface GeorefState {
  position: AircraftPosition | null
  chartGeoStatus: ChartDataResponse | null
  xplaneConnected: boolean
  msfsConnected: boolean
  windowFocused: boolean

  setPosition: (position: AircraftPosition | null) => void
  setChartGeoStatus: (status: ChartDataResponse | null) => void
  setXplaneConnected: (connected: boolean) => void
  setMsfsConnected: (connected: boolean) => void
  setWindowFocused: (focused: boolean) => void
  reset: () => void
}

export const useGeorefStore = create<GeorefState>()((set) => ({
  position: null,
  chartGeoStatus: null,
  xplaneConnected: false,
  msfsConnected: false,
  windowFocused: true,

  setPosition: (position) => set({ position }),
  setChartGeoStatus: (status) => set({ chartGeoStatus: status }),
  setXplaneConnected: (connected) => set({ xplaneConnected: connected }),
  setMsfsConnected: (connected) => set({ msfsConnected: connected }),
  setWindowFocused: (focused) => set({ windowFocused: focused }),
  reset: () =>
    set({
      position: null,
      chartGeoStatus: null,
      xplaneConnected: false,
      msfsConnected: false
    })
}))

export function initGeorefListeners() {
  window.api.onXplanePosition((position) => {
    useGeorefStore.getState().setPosition(position)
  })

  window.api.onXplaneConnected((connected) => {
    useGeorefStore.getState().setXplaneConnected(connected)
  })

  window.api.onMsfsPosition((position) => {
    useGeorefStore.getState().setPosition(position)
  })

  window.api.onMsfsConnected((connected) => {
    useGeorefStore.getState().setMsfsConnected(connected)
  })

  window.api.onWindowFocused((focused) => {
    useGeorefStore.getState().setWindowFocused(focused)
  })
}
