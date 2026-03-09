import { useState, useEffect, useRef } from 'react'
import { Plane, X } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { useChartsStore } from '@/stores/chartsStore'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

export function Search() {
  const isSearchOpen = useUIStore((s) => s.isSearchOpen)
  const setSearchOpen = useUIStore((s) => s.setSearchOpen)
  const setCurrentIcao = useChartsStore((s) => s.setCurrentIcao)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (isSearchOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isSearchOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        setSearchOpen(false)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSearchOpen, setSearchOpen])

  const handleSelect = (icao: string) => {
    setCurrentIcao(icao)
    setSearchOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      const icao = query.trim().toUpperCase()
      if (icao.length >= 3 && icao.length <= 4) {
        handleSelect(icao)
      }
    }
  }

  if (!isSearchOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24"
      onClick={() => setSearchOpen(false)}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setSearchOpen(false)}
      />

      <Card
        className="relative w-full max-w-md mx-4 bg-card border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Plane className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Jump to Airport</span>
            </div>
            <button
              onClick={() => setSearchOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <Input
            ref={inputRef}
            placeholder="Enter ICAO code (e.g., KJFK, EGLL)"
            value={query}
            onChange={(e) => setQuery(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            className="h-10 bg-background border-border uppercase"
            maxLength={4}
            autoFocus
          />

          <div className="mt-3 text-xs text-muted-foreground text-center">
            Press <kbd className="px-1.5 py-0.5 rounded bg-accent">Enter</kbd> to jump,{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-accent">Esc</kbd> to close
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
