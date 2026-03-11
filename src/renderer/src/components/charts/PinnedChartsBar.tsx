import { Star } from 'lucide-react'
import { useChartsStore, categorizeChart } from '@/stores/chartsStore'
import { CHART_CATEGORY_COLORS } from '@/types'
import { cn } from '@/lib/utils'

export function PinnedChartsBar() {
  const currentChart = useChartsStore((s) => s.currentChart)
  const pinnedCharts = useChartsStore((s) => s.pinnedCharts)
  const setCurrentChart = useChartsStore((s) => s.setCurrentChart)

  return (
    <div className="h-16 border-t border-border flex items-center px-4 gap-2 bg-card overflow-x-auto">
      {pinnedCharts.length === 0 ? (
        <span className="text-sm text-muted-foreground flex items-center gap-2">
          <Star className="w-4 h-4" />
          No pinned charts
        </span>
      ) : (
        pinnedCharts.map((chart) => {
          const category = categorizeChart({
            chart_type: '',
            type_name: chart.type_name
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
                'flex-shrink-0 px-3 py-1.5 rounded-md text-left transition-colors border-t-2',
                isActive ? 'bg-accent' : 'hover:bg-muted'
              )}
              style={{ borderTopColor: borderColor }}
            >
              <div className="text-xs font-medium truncate max-w-[100px]">{chart.proc_id}</div>
              <div className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                {chart.type_name}
              </div>
            </button>
          )
        })
      )}
    </div>
  )
}
