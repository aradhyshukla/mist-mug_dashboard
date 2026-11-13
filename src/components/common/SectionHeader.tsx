import { ChevronRight } from "lucide-react"

interface SectionHeaderProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function SectionHeader({
  title,
  description,
  actionLabel,
  onAction,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
      <div>
        <h2 className="text-2xl font-serif font-semibold text-ink tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-wood/70">{description}</p>
        )}
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 rounded-md border border-forest bg-forest px-4 py-2 text-sm font-semibold text-cream shadow-sm hover:bg-forest/90 transition-colors"
        >
          {actionLabel} <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
