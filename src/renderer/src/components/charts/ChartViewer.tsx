import { useState, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import {
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react'
import { useChartsStore } from '@/stores/chartsStore'
import { useUIStore, MIN_ZOOM, MAX_ZOOM } from '@/stores/uiStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getApiBaseUrl } from '@/lib/api-client'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

function PdfControls() {
  const pdfZoom = useUIStore((s) => s.pdfZoom)
  const pdfRotation = useUIStore((s) => s.pdfRotation)
  const pdfPage = useUIStore((s) => s.pdfPage)
  const pdfNumPages = useUIStore((s) => s.pdfNumPages)
  const setPdfZoom = useUIStore((s) => s.setPdfZoom)
  const setPdfRotation = useUIStore((s) => s.setPdfRotation)
  const setPdfPage = useUIStore((s) => s.setPdfPage)

  return (
    <div className="flex items-center gap-1 bg-card/90 backdrop-blur-sm rounded-lg p-1 shadow-lg border border-border">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setPdfRotation(pdfRotation + 90)}
        className="h-8 w-8"
      >
        <RotateCw className="w-4 h-4" />
      </Button>

      <Separator className="h-6 w-px bg-border mx-1" />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setPdfZoom(pdfZoom - 0.25)}
        disabled={pdfZoom <= MIN_ZOOM}
        className="h-8 w-8"
      >
        <ZoomOut className="w-4 h-4" />
      </Button>

      <Badge variant="secondary" className="h-6 px-2 text-xs min-w-12 text-center">
        {Math.round(pdfZoom * 100)}%
      </Badge>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setPdfZoom(pdfZoom + 0.25)}
        disabled={pdfZoom >= MAX_ZOOM}
        className="h-8 w-8"
      >
        <ZoomIn className="w-4 h-4" />
      </Button>

      <Button variant="ghost" size="icon" onClick={() => setPdfZoom(1)} className="h-8 w-8">
        <Maximize className="w-4 h-4" />
      </Button>

      {pdfNumPages > 1 && (
        <>
          <Separator className="h-6 w-px bg-border mx-1" />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPdfPage(pdfPage - 1)}
              disabled={pdfPage <= 1}
              className="h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs min-w-12 text-center">
              {pdfPage} / {pdfNumPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPdfPage(pdfPage + 1)}
              disabled={pdfPage >= pdfNumPages}
              className="h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

function Separator({ className }: { className?: string }) {
  return <div className={className} />
}

function EmptyState() {
  const currentIcao = useChartsStore((s) => s.currentIcao)

  return (
    <div className="h-full flex items-center justify-center text-muted-foreground">
      <div className="text-center max-w-md p-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <svg
            className="w-10 h-10 text-muted-foreground/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-2 text-foreground">Select a Chart</h3>
        {currentIcao ? (
          <p className="text-sm">Choose a chart from the panel on the left to view it here.</p>
        ) : (
          <p className="text-sm">
            Search for an airport ICAO code to browse available charts, or use SimBrief to access
            your flight plan airports.
          </p>
        )}
      </div>
    </div>
  )
}

export function ChartViewer() {
  const currentChart = useChartsStore((s) => s.currentChart)
  const pdfZoom = useUIStore((s) => s.pdfZoom)
  const pdfRotation = useUIStore((s) => s.pdfRotation)
  const pdfPage = useUIStore((s) => s.pdfPage)
  const setPdfNumPages = useUIStore((s) => s.setPdfNumPages)
  const resetPdfView = useUIStore((s) => s.resetPdfView)

  const [containerWidth, setContainerWidth] = useState(800)

  useEffect(() => {
    if (!currentChart) {
      resetPdfView()
    }
  }, [currentChart, resetPdfView])

  useEffect(() => {
    const handleResize = () => {
      const container = document.getElementById('chart-container')
      if (container) {
        setContainerWidth(container.clientWidth - 48)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!currentChart) {
    return <EmptyState />
  }

  const pdfUrl = `${getApiBaseUrl()}/api/v1/charts/${currentChart.icao}/export/${currentChart.filename}`

  return (
    <div id="chart-container" className="h-full flex flex-col bg-muted/30">
      <div className="absolute top-4 right-4 z-10">
        <PdfControls />
      </div>

      <div className="flex-1 overflow-auto flex items-start justify-center p-6">
        <Document
          file={pdfUrl}
          onLoadSuccess={({ numPages }) => setPdfNumPages(numPages)}
          loading={
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          }
          error={
            <div className="flex items-center justify-center py-20 text-destructive">
              <p>Failed to load chart</p>
            </div>
          }
        >
          <Page
            pageNumber={pdfPage}
            scale={pdfZoom}
            rotate={pdfRotation}
            width={containerWidth}
            className="shadow-lg"
          />
        </Document>
      </div>

      <div className="h-12 border-t border-border flex items-center justify-center px-4 gap-4 bg-card">
        <span className="text-sm text-muted-foreground">{currentChart.proc_id}</span>
        <Badge variant="outline" className="text-xs">
          {currentChart.type_name}
        </Badge>
      </div>
    </div>
  )
}
