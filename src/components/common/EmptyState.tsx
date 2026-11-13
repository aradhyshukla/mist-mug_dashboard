import { Clock, CloudUpload, FileText } from "lucide-react"
import { cn } from "../../lib/utils"

interface EmptyStateProps {
  icon: React.ElementType
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  accentColor?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  accentColor = "wood",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full bg-cream border border-border",
          `text-${accentColor}`
        )}
        aria-hidden="true"
      >
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-serif font-semibold text-ink">
        {title}
      </h3>
      <p className="mt-1 text-sm text-wood/70 max-w-xs">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          key="action"
          onClick={onAction}
          className="mt-6 inline-flex items-center gap-2 rounded-md border border-forest bg-forest px-4 py-2 text-xs font-semibold text-cream shadow-sm hover:bg-forest/90 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export const EMPTY_ICONS = {
  upload: CloudUpload,
  activity: Clock,
  data: FileText,
} as const
