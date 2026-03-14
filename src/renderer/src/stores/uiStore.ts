import { create } from 'zustand'
import { SidebarTab } from '@/types'

interface UIState {
  activeTab: SidebarTab
  panelCollapsed: boolean
  pdfZoom: number
  pdfRotation: number
  pdfPage: number
  pdfNumPages: number
  pdfDarkMode: boolean
  showPositionArrow: boolean
  isSearchOpen: boolean

  setActiveTab: (tab: SidebarTab) => void
  togglePanel: () => void
  setPanelCollapsed: (collapsed: boolean) => void
  setPdfZoom: (zoom: number) => void
  setPdfRotation: (rotation: number) => void
  setPdfPage: (page: number) => void
  setPdfNumPages: (num: number) => void
  togglePdfDarkMode: () => void
  togglePositionArrow: () => void
  resetPdfView: () => void
  setSearchOpen: (open: boolean) => void
}

const DEFAULT_ZOOM = 1.0
const MIN_ZOOM = 0.25
const MAX_ZOOM = 3.0

export const useUIStore = create<UIState>()((set, get) => ({
  activeTab: 'airport',
  panelCollapsed: false,
  pdfZoom: DEFAULT_ZOOM,
  pdfRotation: 0,
  pdfPage: 1,
  pdfNumPages: 0,
  pdfDarkMode: false,
  showPositionArrow: true,
  isSearchOpen: false,

  setActiveTab: (tab: SidebarTab) => {
    set({ activeTab: tab })
  },

  togglePanel: () => {
    set((state) => ({ panelCollapsed: !state.panelCollapsed }))
  },

  setPanelCollapsed: (collapsed: boolean) => {
    set({ panelCollapsed: collapsed })
  },

  setPdfZoom: (zoom: number) => {
    const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom))
    set({ pdfZoom: clampedZoom })
  },

  setPdfRotation: (rotation: number) => {
    set({ pdfRotation: ((rotation % 360) + 360) % 360 })
  },

  setPdfPage: (page: number) => {
    const state = get()
    const clampedPage = Math.max(1, Math.min(state.pdfNumPages || 1, page))
    set({ pdfPage: clampedPage })
  },

  setPdfNumPages: (num: number) => {
    set({ pdfNumPages: num, pdfPage: 1 })
  },

  togglePdfDarkMode: () => {
    set((state) => ({ pdfDarkMode: !state.pdfDarkMode }))
  },

  togglePositionArrow: () => {
    set((state) => ({ showPositionArrow: !state.showPositionArrow }))
  },

  resetPdfView: () => {
    set({
      pdfZoom: DEFAULT_ZOOM,
      pdfRotation: 0,
      pdfPage: 1
    })
  },

  setSearchOpen: (open: boolean) => {
    set({ isSearchOpen: open })
  }
}))

export { MIN_ZOOM, MAX_ZOOM }
