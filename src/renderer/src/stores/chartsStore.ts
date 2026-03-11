import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ChartInfo, ChartType } from '@/lib/api-types'
import { PinnedChart, ChartCategory, ChartFlight } from '@/types'

interface ChartsState {
  currentIcao: string
  currentChart: ChartInfo | null
  chartTypes: ChartType[]
  pinnedCharts: PinnedChart[]
  categoryFilter: ChartCategory
  flightFilter: ChartFlight
  searchQuery: string

  setCurrentIcao: (icao: string) => void
  setCurrentChart: (chart: Partial<ChartInfo> | null) => void
  setChartTypes: (types: ChartType[]) => void
  getTypeName: (code: string) => string
  pinChart: (chart: PinnedChart) => void
  unpinChart: (icao: string, filename: string) => void
  isPinned: (icao: string, filename: string) => boolean
  setCategoryFilter: (category: ChartCategory) => void
  setFlightFilter: (flight: ChartFlight) => void
  setSearchQuery: (query: string) => void
}

export const useChartsStore = create<ChartsState>()(
  persist(
    (set, get) => ({
      currentIcao: '',
      currentChart: null,
      chartTypes: [],
      pinnedCharts: [],
      categoryFilter: 'all',
      flightFilter: 'all',
      searchQuery: '',

      setCurrentIcao: (icao: string) => {
        set({ currentIcao: icao.toUpperCase(), currentChart: null })
      },

      setCurrentChart: (chart: Partial<ChartInfo> | null) => {
        set({ currentChart: chart as ChartInfo | null })
      },

      setChartTypes: (types: ChartType[]) => {
        set({ chartTypes: types })
      },

      getTypeName: (code: string) => {
        const types = get().chartTypes
        const found = types.find((t) => t.code === code)
        return found?.type || code
      },

      pinChart: (chart: PinnedChart) => {
        const pinned = get().pinnedCharts
        const exists = pinned.some((p) => p.icao === chart.icao && p.filename === chart.filename)
        if (!exists) {
          set({ pinnedCharts: [...pinned, chart] })
        }
      },

      unpinChart: (icao: string, filename: string) => {
        set((state) => ({
          pinnedCharts: state.pinnedCharts.filter(
            (p) => !(p.icao === icao && p.filename === filename)
          )
        }))
      },

      isPinned: (icao: string, filename: string) => {
        return get().pinnedCharts.some((p) => p.icao === icao && p.filename === filename)
      },

      setCategoryFilter: (category: ChartCategory) => {
        set({ categoryFilter: category })
      },

      setFlightFilter: (flight: ChartFlight) => {
        set({ flightFilter: flight })
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query })
      }
    }),
    {
      name: 'betterjepp-charts',
      partialize: (state) => ({
        pinnedCharts: state.pinnedCharts,
        chartTypes: state.chartTypes
      })
    }
  )
)

export function categorizeChart(chart: { chart_type?: string; type_name?: string }): ChartCategory {
  const type = chart.chart_type?.toUpperCase() || ''
  const typeName = chart.type_name?.toUpperCase() || ''

  if (
    type === 'AD' ||
    type === 'AP' ||
    typeName.includes('TAXI') ||
    typeName.includes('AIRPORT DIAGRAM')
  ) {
    return 'taxi'
  }
  if (typeName.includes('SID') || typeName.includes('DP') || typeName.includes('DEPARTURE')) {
    return 'departure'
  }
  if (typeName.includes('STAR') || typeName.includes('ARRIVAL')) {
    return 'arrival'
  }
  if (
    typeName.includes('ILS') ||
    typeName.includes('RNAV (GPS)') ||
    typeName.includes('VOR') ||
    typeName.includes('NDB') ||
    typeName.includes('APPROACH') ||
    typeName.includes('APP')
  ) {
    return 'approach'
  }
  return 'other'
}

export function isVfrChart(chart: { chart_type?: string }): boolean {
  const chartType = chart.chart_type?.toUpperCase() || ''
  return chartType.startsWith('6')
}
