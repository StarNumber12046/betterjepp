import { useState, useEffect, useRef, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Loader2 } from 'lucide-react'
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

function PositionArrow({
  percentX,
  percentY,
  heading,
  rotation
}: {
  percentX: number
  percentY: number
  heading: number
  rotation: number
}) {
  const adjustedHeading = heading - rotation

  return (
    <div
      className="absolute pointer-events-none z-20"
      style={{
        left: `${percentX * 100}%`,
        top: `${percentY * 100}%`,
        transform: `translate(-50%, -50%) rotate(${adjustedHeading}deg)`
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
  const setPdfZoom = useUIStore((s) => s.setPdfZoom)
  const pdfRotation = useUIStore((s) => s.pdfRotation)
  const pdfPage = useUIStore((s) => s.pdfPage)
  const pdfDarkMode = useUIStore((s) => s.pdfDarkMode)
  const showPositionArrow = useUIStore((s) => s.showPositionArrow)
  const setPdfNumPages = useUIStore((s) => s.setPdfNumPages)
  const resetPdfView = useUIStore((s) => s.resetPdfView)

  const georefEnabled = useSettingsStore((s) => s.settings.georefEnabled)
  const chartGeoStatus = useGeorefStore((s) => s.chartGeoStatus)
  const position = useGeorefStore((s) => s.position)
  const setChartGeoStatus = useGeorefStore((s) => s.setChartGeoStatus)

  const [containerWidth, setContainerWidth] = useState(800)
  const [pixelPosition, setPixelPosition] = useState<{ x: number; y: number } | null>(null)
  const pageWrapperRef = useRef<HTMLDivElement>(null)

  // getScale is no longer needed since we use percentages

  useEffect(() => {
    if (!currentChart) {
      resetPdfView()
      setChartGeoStatus(null)
      return
    }

    const container = document.getElementById('chart-container')
    if (!container) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width - 48)
      }
    })
    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [currentChart])

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setPdfZoom(pdfZoom + delta)
    },
    [pdfZoom, setPdfZoom]
  )

  useEffect(() => {
    const container = document.getElementById('chart-container')
    if (!container) return
    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  useEffect(() => {
    if (!currentChart || !georefEnabled) {
      setChartGeoStatus(null)
      return
    }

    const fetchGeoStatus = async () => {
      try {
        const res = await fetch(
          `${getApiBaseUrl()}/api/v1/charts/${currentChart.icao}/data/${currentChart.filename}`
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
    console.log('[ChartViewer] Position effect:', {
      currentChart: !!currentChart,
      chartGeoStatus: chartGeoStatus?.georef?.georeferenced,
      position: position ? `${position.lat}, ${position.lon}, hdg=${position.heading}` : null,
      georefEnabled,
      pixelPosition
    })

    if (!currentChart || !chartGeoStatus?.georef?.georeferenced || !position || !georefEnabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPixelPosition(null)
      return
    }

    const fetchPixel = async () => {
      console.log('[ChartViewer] Fetching pixel for:', { lat: position.lat, lon: position.lon })
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
          console.log('[ChartViewer] Coord2Pixel response:', data)
          if (!data.error) {
            setPixelPosition({ x: data.x, y: data.y })
          } else {
            setPixelPosition(null)
          }
        }
      } catch (e) {
        console.log('[ChartViewer] Coord2Pixel error:', e)
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
            <div ref={pageWrapperRef} style={pdfDarkMode ? { filter: 'invert(1)' } : undefined}>
              <Page
                pageNumber={pdfPage}
                scale={pdfZoom}
                rotate={pdfRotation}
                width={containerWidth}
                className="shadow-lg"
              />
            </div>
          </Document>

          {showPositionArrow &&
            chartGeoStatus?.georef?.georeferenced &&
            pixelPosition &&
            position &&
            georefEnabled &&
            chartGeoStatus.width > 0 &&
            chartGeoStatus.height > 0 && (
              <>
                <PositionArrow
                  percentX={pixelPosition.x / chartGeoStatus.width}
                  percentY={pixelPosition.y / chartGeoStatus.height}
                  heading={position.heading ?? 0}
                  rotation={pdfRotation}
                />
              </>
            )}
        </div>
      </div>
    </div>
  )
}
