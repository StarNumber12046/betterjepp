import { useUIStore, MIN_ZOOM, MAX_ZOOM } from '@/stores/uiStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun
} from 'lucide-react'

function Separator({ className }: { className?: string }) {
  return <div className={`bg-border ${className}`} />
}

export function TopBar() {
  const activeTab = useUIStore((s) => s.activeTab)
  const pdfZoom = useUIStore((s) => s.pdfZoom)
  const pdfRotation = useUIStore((s) => s.pdfRotation)
  const pdfPage = useUIStore((s) => s.pdfPage)
  const pdfNumPages = useUIStore((s) => s.pdfNumPages)
  const setPdfZoom = useUIStore((s) => s.setPdfZoom)
  const setPdfRotation = useUIStore((s) => s.setPdfRotation)
  const setPdfPage = useUIStore((s) => s.setPdfPage)
  const pdfDarkMode = useUIStore((s) => s.pdfDarkMode)
  const togglePdfDarkMode = useUIStore((s) => s.togglePdfDarkMode)

  if (pdfNumPages === 0 || activeTab === 'settings') {
    return null
  }

  return (
    <div className="absolute top-0 right-0 left-0 h-10 bg-background flex items-center justify-end px-4 z-10">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setPdfRotation(pdfRotation + 90)}
          className="h-7 w-7"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </Button>

        <Separator className="h-5 w-px mx-0.5" />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setPdfZoom(pdfZoom - 0.25)}
          disabled={pdfZoom <= MIN_ZOOM}
          className="h-7 w-7"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </Button>

        <Badge variant="secondary" className="h-6 px-1.5 text-xs min-w-10 text-center">
          {Math.round(pdfZoom * 100)}%
        </Badge>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setPdfZoom(pdfZoom + 0.25)}
          disabled={pdfZoom >= MAX_ZOOM}
          className="h-7 w-7"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>

        <Button variant="ghost" size="icon" onClick={() => setPdfZoom(1)} className="h-7 w-7">
          <Maximize className="w-3.5 h-3.5" />
        </Button>

        <Separator className="h-5 w-px mx-0.5" />

        <Button variant="ghost" size="icon" onClick={togglePdfDarkMode} className="h-7 w-7">
          {pdfDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </Button>

        {pdfNumPages > 1 && (
          <>
            <Separator className="h-5 w-px mx-0.5" />
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPdfPage(pdfPage - 1)}
                disabled={pdfPage <= 1}
                className="h-7 w-7"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs min-w-8 text-center">
                {pdfPage}/{pdfNumPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPdfPage(pdfPage + 1)}
                disabled={pdfPage >= pdfNumPages}
                className="h-7 w-7"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
