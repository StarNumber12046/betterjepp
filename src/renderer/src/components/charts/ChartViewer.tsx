import { useState, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Loader2 } from 'lucide-react'
import { useChartsStore } from '@/stores/chartsStore'
import { useUIStore } from '@/stores/uiStore'
import { getApiBaseUrl } from '@/lib/api-client'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl

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
  const pdfDarkMode = useUIStore((s) => s.pdfDarkMode)
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
          <div style={pdfDarkMode ? { filter: 'invert(1)' } : undefined}>
            <Page
              pageNumber={pdfPage}
              scale={pdfZoom}
              rotate={pdfRotation}
              width={containerWidth}
              className="shadow-lg"
            />
          </div>
        </Document>
      </div>
    </div>
  )
}
