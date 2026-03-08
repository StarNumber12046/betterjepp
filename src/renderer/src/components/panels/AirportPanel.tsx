import { useState, useEffect, useMemo } from 'react'
import { Search, Star, MoreVertical, Download, HardDrive, Loader2 } from 'lucide-react'
import { api } from '@/lib/api-client'
import { useChartsStore, categorizeChart } from '@/stores/chartsStore'
import { ChartCategory, CHART_CATEGORY_COLORS } from '@/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { ChartInfo } from '@/lib/api-types'

const categories: { id: ChartCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'taxi', label: 'Taxi' },
  { id: 'departure', label: 'Dep' },
  { id: 'arrival', label: 'Arr' },
  { id: 'approach', label: 'Appr' },
  { id: 'other', label: 'Other' }
]

function ChartListItem({
  chart,
  isSelected,
  onClick
}: {
  chart: ChartInfo
  isSelected: boolean
  onClick: () => void
}) {
  const pinnedCharts = useChartsStore((s) => s.pinnedCharts)
  const pinChart = useChartsStore((s) => s.pinChart)
  const unpinChart = useChartsStore((s) => s.unpinChart)

  const isPinned = pinnedCharts.some((p) => p.icao === chart.icao && p.filename === chart.filename)
  const category = categorizeChart(chart)
  const borderColor = CHART_CATEGORY_COLORS[category]

  const handlePinToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isPinned) {
      unpinChart(chart.icao, chart.filename)
    } else {
      pinChart({
        icao: chart.icao,
        filename: chart.filename,
        proc_id: chart.proc_id,
        type_name: chart.type_name
      })
    }
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors group border-l-4',
        isSelected
          ? 'bg-primary/10 border-r border-t border-b border-primary/30'
          : 'hover:bg-accent border-r-0 border-t-0 border-b-0'
      )}
      style={{ borderLeftColor: borderColor }}
    >
      <button onClick={handlePinToggle} className="flex-shrink-0">
        <Star
          className={cn(
            'w-4 h-4 transition-colors',
            isPinned
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-yellow-400'
          )}
        />
      </button>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{chart.proc_id}</div>
        <div className="text-xs text-muted-foreground truncate">
          {chart.type_name || chart.chart_type}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </DropdownMenuItem>
          <DropdownMenuItem>
            <HardDrive className="w-4 h-4 mr-2" />
            Save Offline
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function AirportPanel() {
  const currentIcao = useChartsStore((s) => s.currentIcao)
  const currentChart = useChartsStore((s) => s.currentChart)
  const setCurrentChart = useChartsStore((s) => s.setCurrentChart)
  const categoryFilter = useChartsStore((s) => s.categoryFilter)
  const setCategoryFilter = useChartsStore((s) => s.setCategoryFilter)
  const searchQuery = useChartsStore((s) => s.searchQuery)
  const setSearchQuery = useChartsStore((s) => s.setSearchQuery)
  const pinnedCharts = useChartsStore((s) => s.pinnedCharts)

  const [localSearch, setLocalSearch] = useState(searchQuery)

  const { data, isLoading, error } = api.useQuery('get', '/api/v1/charts/{icao}', {
    params: { path: { icao: currentIcao } }
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [localSearch, setSearchQuery])

  const filteredCharts = useMemo(() => {
    if (!data?.charts) return []

    let charts = data.charts

    if (categoryFilter !== 'all') {
      charts = charts.filter((chart) => categorizeChart(chart) === categoryFilter)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      charts = charts.filter(
        (chart) =>
          chart.proc_id?.toLowerCase().includes(query) ||
          chart.type_name?.toLowerCase().includes(query)
      )
    }

    const pinnedIcaos = new Set(
      pinnedCharts.filter((p) => p.icao === currentIcao).map((p) => p.filename)
    )

    return charts.sort((a, b) => {
      const aPinned = pinnedIcaos.has(a.filename)
      const bPinned = pinnedIcaos.has(b.filename)
      if (aPinned && !bPinned) return -1
      if (!aPinned && bPinned) return 1
      return a.proc_id.localeCompare(b.proc_id)
    })
  }, [data?.charts, categoryFilter, searchQuery, pinnedCharts, currentIcao])

  if (!currentIcao) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground p-4 text-center">
        <div>
          <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No Airport Selected</p>
          <p className="text-sm mt-1">Search for an ICAO code to view charts</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold mb-3">{currentIcao}</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search charts..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="px-2 py-2 border-b border-border">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {categories.map((cat) => {
            const isActive = categoryFilter === cat.id
            const color = CHART_CATEGORY_COLORS[cat.id]

            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={cn(
                  'h-7 px-2 text-xs flex-shrink-0 rounded-md font-medium transition-colors',
                  isActive ? 'text-white' : 'bg-transparent hover:bg-accent'
                )}
                style={isActive ? { backgroundColor: color } : { color: color }}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Failed to load charts</p>
            </div>
          ) : filteredCharts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No charts found</p>
            </div>
          ) : (
            <>
              <div className="text-xs text-muted-foreground px-2 py-1">
                {filteredCharts.length} chart{filteredCharts.length !== 1 ? 's' : ''}
              </div>
              <div className="space-y-1">
                {filteredCharts.map((chart) => (
                  <ChartListItem
                    key={chart.filename}
                    chart={chart}
                    isSelected={
                      currentChart?.filename === chart.filename && currentChart?.icao === chart.icao
                    }
                    onClick={() => setCurrentChart(chart)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
