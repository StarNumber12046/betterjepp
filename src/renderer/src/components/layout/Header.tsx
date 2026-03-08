import { Activity, Search } from 'lucide-react'
import { getApiBaseUrl } from '@/lib/api-client'
import { Input } from '@/components/ui/input'
import { useChartsStore } from '@/stores/chartsStore'
import { useState, useEffect } from 'react'

export function Header() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const currentIcao = useChartsStore((s) => s.currentIcao)
  const setCurrentIcao = useChartsStore((s) => s.setCurrentIcao)
  const [searchValue, setSearchValue] = useState(currentIcao)

  useEffect(() => {
    setSearchValue(currentIcao)
  }, [currentIcao])

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await fetch(`${getApiBaseUrl()}/health`)
        setIsConnected(true)
      } catch {
        setIsConnected(false)
      }
    }
    checkConnection()
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const icao = searchValue.trim().toUpperCase()
    if (icao && icao.length >= 3 && icao.length <= 4) {
      setCurrentIcao(icao)
    }
  }

  return (
    <header className="h-12 bg-card border-b border-border flex items-center px-4 gap-4">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-lg text-primary">Charts</span>
      </div>

      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search ICAO (e.g., KJFK, EGLL)"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value.toUpperCase())}
            className="pl-9 uppercase"
            maxLength={4}
          />
        </div>
      </form>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Activity
            className={`w-3.5 h-3.5 ${
              isConnected === null
                ? 'text-muted-foreground'
                : isConnected
                  ? 'text-green-500'
                  : 'text-red-500'
            }`}
          />
          <span>
            {isConnected === null ? 'Checking...' : isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </header>
  )
}
