import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Star,
  MoreVertical,
  Download,
  Loader2,
  PinIcon,
  MapPin,
  Plane,
  Clock,
  Fuel,
  Wrench
} from 'lucide-react'
import { api } from '@/lib/api-client'
import { useChartsStore, categorizeChart } from '@/stores/chartsStore'
import { ChartCategory, CHART_CATEGORY_COLORS } from '@/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { ChartInfo, Airport } from '@/lib/api-types'

type AirportView = 'charts' | 'info'

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
          ? 'bg-chart-list-selected border-r border-t border-b border-primary/30'
          : `hover:bg-[${borderColor}] bg-chart-list border-r-0 border-t-0 border-b-0`
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
        <div className="font-medium text-sm whitespace-nowrap">{chart.proc_id}</div>
        <div className="text-xs text-muted-foreground whitespace-nowrap">
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
            <PinIcon className="w-4 h-4 mr-2" />
            Pin Chart
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
  const [activeView, setActiveView] = useState<AirportView>('charts')

  const { data, isLoading, error } = api.useQuery('get', '/api/v1/charts/{icao}', {
    params: { path: { icao: currentIcao } }
  })

  const { data: airportData, isLoading: airportLoading } = api.useQuery(
    'get',
    '/api/v1/airports/{icao}',
    {
      params: { path: { icao: currentIcao } }
    }
  )

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
  }, [data, categoryFilter, searchQuery, pinnedCharts, currentIcao])

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
        <div className="flex gap-1 p-1 bg-pill rounded-lg mb-3">
          <button
            onClick={() => setActiveView('charts')}
            className={cn(
              'flex-1 h-7 text-xs rounded-md font-medium transition-colors',
              activeView === 'charts'
                ? 'bg-chart-list-selected text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Charts
          </button>
          <button
            onClick={() => setActiveView('info')}
            className={cn(
              'flex-1 h-7 text-xs rounded-md font-medium transition-colors',
              activeView === 'info'
                ? 'bg-chart-list-selected text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Info
          </button>
        </div>
        {activeView === 'charts' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search charts..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9 bg-pill"
            />
          </div>
        )}
      </div>

      {activeView === 'info' ? (
        <AirportInfoView airport={airportData} isLoading={airportLoading} />
      ) : (
        <>
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
                      isActive ? 'text-white' : 'bg-transparent hover:bg-sky-950'
                    )}
                    style={isActive ? { backgroundColor: color } : { color: color }}
                  >
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex-1 overflow-x-auto overflow-y-auto scrollbar-hide">
            <div className="p-2 min-w-max">
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
                          currentChart?.filename === chart.filename &&
                          currentChart?.icao === chart.icao
                        }
                        onClick={() => setCurrentChart(chart)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function AirportInfoView({
  airport,
  isLoading
}: {
  airport: Airport | undefined
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!airport) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Airport info not available</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="text-center py-4 border-b border-border">
        <h3 className="font-semibold text-lg">{airport.name}</h3>
        <p className="text-sm text-muted-foreground">
          {airport.city}
          {airport.state ? `, ${airport.state}` : ''}, {airport.country_code}
        </p>
      </div>

      <div className="p-2 space-y-1">
        <InfoRow
          icon={<MapPin className="w-4 h-4" />}
          label="Coordinates"
          value={`${airport.latitude.toFixed(4)}, ${airport.longitude.toFixed(4)}`}
        />
        <InfoRow
          icon={<Clock className="w-4 h-4" />}
          label="Timezone"
          value={airport.timezone || 'N/A'}
        />
        <InfoRow
          icon={<Plane className="w-4 h-4" />}
          label="Longest RWY"
          value={airport.longest_runway_ft ? `${airport.longest_runway_ft} ft` : 'N/A'}
        />
        <InfoRow icon={<Plane className="w-4 h-4" />} label="IATA" value={airport.iata || 'N/A'} />
        {airport.fuel_types && airport.fuel_types.length > 0 && (
          <InfoRow
            icon={<Fuel className="w-4 h-4" />}
            label="Fuel Types"
            value={airport.fuel_types.join(', ')}
          />
        )}
        {airport.oxygen && airport.oxygen.length > 0 && (
          <InfoRow
            icon={<Fuel className="w-4 h-4" />}
            label="Oxygen"
            value={airport.oxygen.join(', ')}
          />
        )}
        {airport.repair_types && airport.repair_types.length > 0 && (
          <InfoRow
            icon={<Wrench className="w-4 h-4" />}
            label="Repairs"
            value={airport.repair_types.join(', ')}
          />
        )}
        <InfoRow
          icon={<MapPin className="w-4 h-4" />}
          label="Airport Use"
          value={airport.airport_use}
        />
        <InfoRow icon={<MapPin className="w-4 h-4" />} label="Customs" value={airport.customs} />
        <InfoRow
          icon={<MapPin className="w-4 h-4" />}
          label="Beacon"
          value={airport.beacon ? 'Yes' : 'No'}
        />
        <InfoRow
          icon={<Fuel className="w-4 h-4" />}
          label="Jet A1 Start"
          value={airport.jet_start_unit ? 'Available' : 'N/A'}
        />
        <InfoRow
          icon={<MapPin className="w-4 h-4" />}
          label="Mag Var"
          value={airport.magnetic_variation ? `${airport.magnetic_variation}°` : 'N/A'}
        />
      </div>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value
}: {
  icon: React.ReactNode
  label: string
  value: string | undefined
}) {
  if (!value) return null
  return (
    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
      <span className="text-muted-foreground flex-shrink-0">{icon}</span>
      <span className="text-xs text-muted-foreground flex-shrink-0 w-24">{label}</span>
      <span className="text-sm font-medium truncate">{value}</span>
    </div>
  )
}
