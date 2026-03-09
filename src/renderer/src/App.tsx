import { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Titlebar } from '@/components/layout/Titlebar'
import { TopBar } from '@/components/layout/TopBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { CollapsiblePanel } from '@/components/layout/CollapsiblePanel'
import { MainContent, PanelContent } from '@/components/layout/MainContent'
import { Search } from '@/components/Search'
import { useChartsStore } from '@/stores/chartsStore'
import { rawFetch } from '@/lib/api-client'

function AppContent() {
  const setChartTypes = useChartsStore((s) => s.setChartTypes)

  useEffect(() => {
    const loadChartTypes = async () => {
      try {
        const result = await rawFetch.GET('/api/v1/chart-types')
        if (result.data) {
          setChartTypes(result.data.types || [])
        }
      } catch (error) {
        console.error('Failed to load chart types:', error)
      }
    }
    loadChartTypes()
  }, [setChartTypes])

  return (
    <div className="h-full flex flex-col">
      <Titlebar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex overflow-hidden relative">
          <TopBar />
          <CollapsiblePanel>
            <PanelContent />
          </CollapsiblePanel>
          <MainContent />
        </div>
      </div>
      <Search />
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
