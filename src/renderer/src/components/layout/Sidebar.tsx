import { Plane, Building2, Settings } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { SidebarTab } from '@/types'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const topTabs: { id: SidebarTab; icon: typeof Plane; label: string }[] = [
  { id: 'flight', icon: Plane, label: 'Flight' },
  { id: 'airport', icon: Building2, label: 'Airport' }
]

const bottomTabs: { id: SidebarTab; icon: typeof Plane; label: string }[] = [
  { id: 'settings', icon: Settings, label: 'Settings' }
]

export function Sidebar() {
  const activeTab = useUIStore((s) => s.activeTab)
  const setActiveTab = useUIStore((s) => s.setActiveTab)

  return (
    <div className="w-12 bg-darker border-r border-border flex flex-col items-center py-2">
      <div className="flex flex-col items-center">
        {topTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <Tooltip key={tab.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-10 h-10 flex items-center justify-center rounded-lg transition-colors mb-1',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{tab.label}</TooltipContent>
            </Tooltip>
          )
        })}
      </div>

      <div className="flex-1" />

      <div className="flex flex-col items-center">
        {bottomTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <Tooltip key={tab.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-10 h-10 flex items-center justify-center rounded-lg transition-colors mb-1',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{tab.label}</TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}
