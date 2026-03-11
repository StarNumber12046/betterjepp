import createFetchClient from 'openapi-fetch'
import createClient from 'openapi-react-query'
import type { paths } from './api-types'

const DEFAULT_BASE_URL = 'http://localhost:8080'

let baseUrl = DEFAULT_BASE_URL
let fetchClient = createFetchClient<paths>({ baseUrl })
let apiClient = createClient(fetchClient)

export function updateApiBaseUrl(url: string) {
  baseUrl = url || DEFAULT_BASE_URL
  fetchClient = createFetchClient<paths>({ baseUrl })
  apiClient = createClient(fetchClient)
}

export function getApiBaseUrl(): string {
  return baseUrl
}

export async function downloadChartPdf(
  icao: string,
  filename: string,
  chartName: string
): Promise<void> {
  console.log('[Export] Starting export for', icao, filename, chartName)
  const url = `${baseUrl}/api/v1/charts/${icao}/export/${filename}`
  console.log('[Export] Fetching from URL:', url)
  const response = await fetch(url)
  if (!response.ok) {
    console.error('[Export] Failed to fetch PDF:', response.status, response.statusText)
    throw new Error('Failed to download chart')
  }
  const blob = await response.blob()
  console.log('[Export] Got blob, size:', blob.size)
  const arrayBuffer = await blob.arrayBuffer()
  const pdfData = Array.from(new Uint8Array(arrayBuffer))
  console.log('[Export] PDF data length:', pdfData.length)

  const { useSettingsStore } = await import('@/stores/settingsStore')
  const exportDir = useSettingsStore.getState().settings.exportDir
  console.log('[Export] Export dir from store:', exportDir)

  if (!exportDir) {
    throw new Error('Export directory not configured. Please set it in Settings.')
  }

  const result = await window.api.exportChart({
    pdfData,
    exportDir,
    icao,
    chartName
  })

  console.log('[Export] Result:', result)

  if (!result.success) {
    throw new Error(result.error || 'Failed to export chart')
  }
}

export const api = apiClient
export const rawFetch = fetchClient
