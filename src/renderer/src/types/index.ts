export interface PinnedChart {
  icao: string
  filename: string
  proc_id: string
  type_name: string
}

export interface AppSettings {
  apiUrl: string
  simbriefPilotId: string
  exportDir: string
  panelWidth: number
}

export type ChartCategory = 'all' | 'taxi' | 'departure' | 'arrival' | 'approach' | 'other'

export type SidebarTab = 'flight' | 'airport' | 'settings'

export const DEFAULT_SETTINGS: AppSettings = {
  apiUrl: 'http://localhost:8080',
  simbriefPilotId: '',
  exportDir: '',
  panelWidth: 280
}

export const DEFAULT_PANEL_WIDTH = 280
export const MIN_PANEL_WIDTH = 200
export const MAX_PANEL_WIDTH = 400

export const CHART_CATEGORY_COLORS: Record<ChartCategory, string> = {
  all: '#94a3b8',
  taxi: '#67e8f9',
  departure: '#fca5a5',
  arrival: '#86efac',
  approach: '#fdba74',
  other: '#c4b5fd'
}

export const CHART_CATEGORY_CSS_VARS: Record<ChartCategory, string> = {
  all: 'chart-cat-all',
  taxi: 'chart-cat-taxi',
  departure: 'chart-cat-departure',
  arrival: 'chart-cat-arrival',
  approach: 'chart-cat-approach',
  other: 'chart-cat-other'
}
