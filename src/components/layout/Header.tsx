import { Clock, Coffee } from "lucide-react"

export function Header({ onToggleMenu }: { onToggleMenu: () => void }) {
  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-paper/80 backdrop-blur-md px-4"
      aria-label="Top bar"
    >
      <button
        onClick={onToggleMenu}
        className="mr-3 inline-flex items-center justify-center p-2 text-gold border border-gold/50 rounded-md hover:bg-gold/10"
        aria-label="Toggle navigation"
      >
        <Coffee className="h-5 w-5 fill-gold" aria-hidden="true" />
      </button>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-gold" aria-hidden="true" />
          <span className="text-xs font-semibold text-ink uppercase tracking-wider">
            Open
          </span>
        </div>
        <span className="text-xs text-ink/70">2,005 M · Mussoorie</span>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-border bg-cream">
          <Clock className="h-3.5 w-3.5 text-wood" aria-hidden="true" />
          <span className="text-xs text-ink" id="live-clock"></span>
        </div>
      </div>
    </header>
  )
}

