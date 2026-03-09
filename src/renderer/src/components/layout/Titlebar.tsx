import { Minus, Square, X } from 'lucide-react'

function WindowControls() {
  const handleMinimize = () => window.api.minimizeWindow()
  const handleMaximize = () => window.api.maximizeWindow()
  const handleClose = () => window.api.closeWindow()

  return (
    <div className="flex h-full">
      <button
        onClick={handleMinimize}
        className="h-full px-4 hover:bg-white/10 flex items-center justify-center transition-colors"
      >
        <Minus className="w-4 h-4" />
      </button>
      <button
        onClick={handleMaximize}
        className="h-full px-4 hover:bg-white/10 flex items-center justify-center transition-colors"
      >
        <Square className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={handleClose}
        className="h-full px-4 hover:bg-red-500 flex items-center justify-center transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function Titlebar() {
  return (
    <div
      className="h-10 bg-darker flex items-center px-4 select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div
        className="flex items-center gap-2"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <span className="font-semibold text-base text-primary">Charts</span>
      </div>

      <div className="flex-1" />

      <div style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <WindowControls />
      </div>
    </div>
  )
}
