export interface PinnedChart {
  icao: string
  filename: string
  proc_id: string
  type_name: string
  category: string
}

export interface AppSettings {
  apiUrl: string
  simbriefPilotId: string
  exportDir: string
  panelWidth: number
  georefEnabled: boolean
  xplaneSendPort: number
  xplaneListenPort: number
}

export type ChartCategory = 'all' | 'taxi' | 'departure' | 'arrival' | 'approach' | 'other'

export type ChartFlight = 'all' | 'vfr' | 'ifr'

export const CHART_FLIGHT_COLORS: Record<ChartFlight, string> = {
  all: 'var(--color-indigo-500)',
  vfr: 'var(--color-green-500)',
  ifr: 'var(--color-blue-500)'
}

export type SidebarTab = 'flight' | 'airport' | 'settings' | 'search'

export const DEFAULT_SETTINGS: AppSettings = {
  apiUrl: 'http://localhost:8080',
  simbriefPilotId: '',
  exportDir: '',
  panelWidth: 280,
  georefEnabled: true,
  xplaneSendPort: 49000,
  xplaneListenPort: 49001
}

export const DEFAULT_PANEL_WIDTH = 280
export const MIN_PANEL_WIDTH = 200
export const MAX_PANEL_WIDTH = 400

export const CHART_CATEGORY_COLORS: Record<ChartCategory, string> = {
  all: 'var(--color-indigo-500)',
  taxi: 'var(--color-cyan-500)',
  departure: 'var(--color-red-500)',
  arrival: 'var(--color-green-500)',
  approach: 'var(--color-orange-400)',
  other: 'var(--color-purple-500)'
}

export const CHART_CATEGORY_CSS_VARS: Record<ChartCategory, string> = {
  all: 'chart-cat-all',
  taxi: 'chart-cat-taxi',
  departure: 'chart-cat-departure',
  arrival: 'chart-cat-arrival',
  approach: 'chart-cat-approach',
  other: 'chart-cat-other'
}
