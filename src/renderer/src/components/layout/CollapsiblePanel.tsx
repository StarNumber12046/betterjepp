import { useState, useCallback, useRef, useEffect } from 'react'
import { PanelLeftClose, PanelLeft } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { DEFAULT_PANEL_WIDTH, MAX_PANEL_WIDTH } from '@/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const CONTENT_MIN_WIDTH = 280

interface CollapsiblePanelProps {
  children: React.ReactNode
}

export function CollapsiblePanel({ children }: CollapsiblePanelProps) {
  const panelCollapsed = useUIStore((s) => s.panelCollapsed)
  const setPanelCollapsed = useUIStore((s) => s.setPanelCollapsed)
  const panelWidth = useSettingsStore((s) => s.settings.panelWidth)
  const setPanelWidth = useSettingsStore((s) => s.setPanelWidth)

  const [isResizing, setIsResizing] = useState(false)
  const [localWidth, setLocalWidth] = useState(panelWidth || DEFAULT_PANEL_WIDTH)
  const widthRef = useRef(localWidth)

  useEffect(() => {
    widthRef.current = localWidth
  }, [localWidth])

  useEffect(() => {
    if (!isResizing) {
      setLocalWidth(panelWidth || DEFAULT_PANEL_WIDTH)
    }
  }, [panelWidth, isResizing])

  const startResizing = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsResizing(true)

      const handleMouseMove = (e: MouseEvent) => {
        const newWidth = Math.max(80, Math.min(MAX_PANEL_WIDTH, e.clientX - 48))
        widthRef.current = newWidth
        setLocalWidth(newWidth)
      }

      const handleMouseUp = () => {
        setIsResizing(false)
        setPanelWidth(widthRef.current)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [setPanelWidth]
  )

  const toggleCollapse = () => {
    setPanelCollapsed(!panelCollapsed)
  }

  if (panelCollapsed) {
    return (
      <div className="w-10 bg-card border-r border-border flex flex-col items-center py-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapse}
              className="text-muted-foreground hover:text-foreground"
            >
              <PanelLeft className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Expand Panel</TooltipContent>
        </Tooltip>
      </div>
    )
  }

  const contentWidth = Math.max(localWidth, CONTENT_MIN_WIDTH)

  return (
    <div
      className={cn(
        'relative bg-card border-r border-border shrink-0',
        isResizing && 'select-none'
      )}
      style={{ width: localWidth }}
    >
      {/* Scroll container — full size of the outer box */}
      <div className="absolute inset-0 overflow-x-auto overflow-y-hidden scrollbar-hide">
        {/* Inner content — at least CONTENT_MIN_WIDTH wide, full height */}
        <div style={{ width: contentWidth, height: '100%' }}>{children}</div>
      </div>

      {/* Resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors z-10"
        onMouseDown={startResizing}
      />

      {/* Collapse button */}
      <div className="absolute right-2 top-2 z-20">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapse}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <PanelLeftClose className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Collapse Panel</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
