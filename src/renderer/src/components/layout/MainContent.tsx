import { useUIStore } from '@/stores/uiStore'
import { FlightPanel } from '@/components/panels/FlightPanel'
import { AirportPanel } from '@/components/panels/AirportPanel'
import { SettingsPanel } from '@/components/panels/SettingsPanel'
import { ChartViewer } from '@/components/charts/ChartViewer'

export function MainContent() {
  const activeTab = useUIStore((s) => s.activeTab)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {activeTab === 'settings' ? (
        <SettingsPanel />
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden pt-10">
          <ChartViewer />
        </div>
      )}
    </div>
  )
}

export function PanelContent() {
  const activeTab = useUIStore((s) => s.activeTab)

  switch (activeTab) {
    case 'flight':
      return <FlightPanel />
    case 'airport':
      return <AirportPanel />
    case 'settings':
      return null
    default:
      return null
  }
}
