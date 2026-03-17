import { Star } from 'lucide-react'
import { useChartsStore, categorizeChart } from '@/stores/chartsStore'
import { CHART_CATEGORY_COLORS } from '@/types'
import { cn } from '@/lib/utils'

export function PinnedChartsBar() {
  const currentChart = useChartsStore((s) => s.currentChart)
  const pinnedCharts = useChartsStore((s) => s.pinnedCharts)
  const setCurrentChart = useChartsStore((s) => s.setCurrentChart)

  const chartsByIcao = pinnedCharts.reduce(
    (acc, chart) => {
      if (!acc[chart.icao]) acc[chart.icao] = []
      acc[chart.icao].push(chart)
      return acc
    },
    {} as Record<string, (typeof pinnedCharts)[number][]>
  )

  const icaos = Object.keys(chartsByIcao)

  return (
    <div className="h-16 border-t border-border bg-card px-4 flex items-center overflow-x-auto whitespace-nowrap gap-2">
      {pinnedCharts.length === 0 ? (
        <span className="text-sm text-muted-foreground flex items-center gap-2">
          <Star className="w-4 h-4" />
          No pinned charts
        </span>
      ) : (
        icaos.map((icao) => (
          <div key={icao} className="flex items-center gap-2">
            <div className="flex-shrink-0 h-11 px-3 rounded-md border border-primary bg-background flex items-center text-xs font-semibold">
              {icao}
            </div>

            {chartsByIcao[icao].map((chart) => {
              const category = categorizeChart({
                chart_type: '',
                type_name: chart.type_name,
                category: chart.category
              })

              const borderColor = CHART_CATEGORY_COLORS[category]
              const isActive =
                currentChart?.icao === chart.icao && currentChart?.filename === chart.filename

              return (
                <button
                  key={`${chart.icao}-${chart.filename}`}
                  onClick={() => {
                    setCurrentChart({
                      chart_type: '',
                      icao: chart.icao,
                      filename: chart.filename,
                      proc_id: chart.proc_id,
                      type_name: chart.type_name
                    })
                  }}
                  className={cn(
                    'relative flex-shrink-0 h-11 px-3 rounded-md text-left transition-colors border border-primary flex flex-col justify-center overflow-hidden',
                    isActive ? 'bg-accent' : 'hover:bg-muted'
                  )}
                >
                  <div
                    className="absolute top-0 left-0 w-full h-[3px]"
                    style={{ backgroundColor: borderColor }}
                  />

                  <div className="text-xs font-medium truncate max-w-[120px] leading-tight">
                    {chart.proc_id}
                  </div>

                  <div className="text-[10px] text-muted-foreground truncate max-w-[120px] leading-tight">
                    {chart.type_name}
                  </div>
                </button>
              )
            })}
          </div>
        ))
      )}
    </div>
  )
}
