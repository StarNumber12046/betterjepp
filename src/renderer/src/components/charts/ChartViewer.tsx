import { useState, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Loader2, MapPin } from 'lucide-react'
import { useChartsStore } from '@/stores/chartsStore'
import { useUIStore } from '@/stores/uiStore'
import { useGeorefStore } from '@/stores/georefStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { getApiBaseUrl } from '@/lib/api-client'
import type { CoordToPixelResponse } from '@/lib/api-types'

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

function GeorefStatusBadge() {
  const chartGeoStatus = useGeorefStore((s) => s.chartGeoStatus)

  if (!chartGeoStatus) return null

  return (
    <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2 py-1 rounded-md bg-background/80 backdrop-blur-sm border border-border text-xs">
      {chartGeoStatus.georeferenced ? (
        <>
          <MapPin className="w-3 h-3 text-green-500" />
          <span className="text-green-500">Georeferenced</span>
        </>
      ) : (
        <>
          <div className="w-2 h-2 rounded-full bg-muted-foreground" />
          <span className="text-muted-foreground">Not georeferenced</span>
        </>
      )}
    </div>
  )
}

function PositionArrow({
  pixelX,
  pixelY,
  heading,
  zoom,
  rotation
}: {
  pixelX: number
  pixelY: number
  heading: number
  zoom: number
  rotation: number
}) {
  const adjustedHeading = heading - rotation

  return (
    <div
      className="absolute pointer-events-none z-20"
      style={{
        left: pixelX * zoom,
        top: pixelY * zoom,
        transform: `translate(-50%, -50%) rotate(${adjustedHeading}deg) scale(${zoom})`
      }}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 4L24 28L16 22L8 28L16 4Z"
          fill="#3b82f6"
          stroke="#1e40af"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="16" cy="16" r="3" fill="#1e40af" />
      </svg>
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

  const georefEnabled = useSettingsStore((s) => s.settings.georefEnabled)
  const chartGeoStatus = useGeorefStore((s) => s.chartGeoStatus)
  const position = useGeorefStore((s) => s.position)
  const setChartGeoStatus = useGeorefStore((s) => s.setChartGeoStatus)

  const [containerWidth, setContainerWidth] = useState(800)
  const [pixelPosition, setPixelPosition] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!currentChart) {
      resetPdfView()
      setChartGeoStatus(null)
    }
  }, [currentChart, resetPdfView, setChartGeoStatus])

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

  useEffect(() => {
    if (!currentChart || !georefEnabled) {
      setChartGeoStatus(null)
      return
    }

    const fetchGeoStatus = async () => {
      try {
        const res = await fetch(
          `${getApiBaseUrl()}/api/v1/charts/${currentChart.icao}/geo/status/${currentChart.filename}`
        )
        if (res.ok) {
          const data = await res.json()
          setChartGeoStatus(data)
        } else {
          setChartGeoStatus(null)
        }
      } catch {
        setChartGeoStatus(null)
      }
    }

    fetchGeoStatus()
  }, [currentChart, georefEnabled, setChartGeoStatus])

  useEffect(() => {
    if (!currentChart || !chartGeoStatus?.georeferenced || !position || !georefEnabled) {
      setPixelPosition(null)
      return
    }

    const fetchPixel = async () => {
      try {
        const res = await fetch(
          `${getApiBaseUrl()}/api/v1/charts/${currentChart.icao}/geo/coord2pixel/${currentChart.filename}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude: position.lat, longitude: position.lon })
          }
        )
        if (res.ok) {
          const data: CoordToPixelResponse = await res.json()
          if (!data.error) {
            setPixelPosition({ x: data.x, y: data.y })
          } else {
            setPixelPosition(null)
          }
        }
      } catch {
        setPixelPosition(null)
      }
    }

    fetchPixel()
  }, [currentChart, chartGeoStatus, position, georefEnabled])

  if (!currentChart) {
    return <EmptyState />
  }

  const pdfUrl = `${getApiBaseUrl()}/api/v1/charts/${currentChart.icao}/export/${currentChart.filename}`

  return (
    <div id="chart-container" className="h-full flex flex-col bg-muted/30">
      <div className="flex-1 overflow-auto flex items-start justify-center p-6">
        <div className="relative">
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

          <GeorefStatusBadge />

          {chartGeoStatus?.georeferenced && pixelPosition && position && georefEnabled && (
            <PositionArrow
              pixelX={pixelPosition.x}
              pixelY={pixelPosition.y}
              heading={position.heading}
              zoom={pdfZoom}
              rotation={pdfRotation}
            />
          )}
        </div>
      </div>
    </div>
  )
}
