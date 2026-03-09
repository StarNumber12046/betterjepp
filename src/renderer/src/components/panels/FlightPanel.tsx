import { Plane, RefreshCw, MapPin, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchSimBriefOfp, SimBriefOFP } from '@/lib/simbrief-client'
import { useSettingsStore } from '@/stores/settingsStore'
import { useChartsStore } from '@/stores/chartsStore'
import { useUIStore } from '@/stores/uiStore'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

function AirportLink({ icao, name }: { icao: string; name?: string }) {
  const setCurrentIcao = useChartsStore((s) => s.setCurrentIcao)
  const setActiveTab = useUIStore((s) => s.setActiveTab)

  const handleClick = () => {
    setCurrentIcao(icao)
    setActiveTab('airport')
  }

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors group"
    >
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-muted-foreground" />
        <span className="font-mono font-semibold">{icao}</span>
        {name && (
          <span className="text-sm text-muted-foreground truncate max-w-[120px]">{name}</span>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  )
}

function FlightInfo({ ofp }: { ofp: SimBriefOFP }) {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Current Flight</h3>
        {ofp.atc.callsign && <Badge variant="secondary">{ofp.atc.callsign}</Badge>}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="font-mono font-semibold text-primary">
          {ofp.origin?.icao_code || '---'}
        </span>
        <Plane className="w-4 h-4 text-muted-foreground" />
        <span className="font-mono font-semibold text-primary">
          {ofp.destination?.icao_code || '---'}
        </span>
      </div>

      {ofp.aircraft && (
        <div className="text-sm text-muted-foreground">
          {ofp.aircraft.icaocode} - {ofp.aircraft.name}
        </div>
      )}

      {ofp.general?.route && (
        <div className="text-xs text-muted-foreground break-all">{ofp.general.route}</div>
      )}

      <Separator />

      <div>
        <h4 className="text-sm font-medium mb-2">Quick Access</h4>
        <div className="space-y-1">
          {ofp.origin?.icao_code && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Origin</div>
              <AirportLink icao={ofp.origin.icao_code} name={ofp.origin.name} />
            </div>
          )}
          {ofp.destination?.icao_code && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Destination</div>
              <AirportLink icao={ofp.destination.icao_code} name={ofp.destination.name} />
            </div>
          )}
          {ofp.alternates && ofp.alternates.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Alternates</div>
              {ofp.alternates.map((alt, i) => (
                <AirportLink key={i} icao={alt.icao_code} name={alt.name} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ pilotId }: { pilotId?: string }) {
  return (
    <div className="p-4 text-center text-muted-foreground">
      <Plane className="w-12 h-12 mx-auto mb-3 opacity-50" />
      <p className="font-medium">No Flight Data</p>
      {!pilotId ? (
        <p className="text-sm mt-1">
          Set your SimBrief Pilot ID in Settings to view your flight plan.
        </p>
      ) : (
        <p className="text-sm mt-1">
          No active flight plan found. Create a flight plan in SimBrief to see it here.
        </p>
      )}
    </div>
  )
}

export function FlightPanel() {
  const pilotId = useSettingsStore((s) => s.settings.simbriefPilotId)
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['simbrief', pilotId],
    queryFn: () => fetchSimBriefOfp(pilotId!),
    enabled: !!pilotId,
    staleTime: 5 * 60 * 1000,
    retry: 1
  })

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold">Flight</h2>
        {pilotId && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 w-8"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            <div className="h-6 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
        ) : error ? (
          <EmptyState pilotId={pilotId} />
        ) : data ? (
          <FlightInfo ofp={data} />
        ) : (
          <EmptyState pilotId={pilotId} />
        )}
      </div>
    </div>
  )
}
