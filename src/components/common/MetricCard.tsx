import { cn } from "../../lib/utils"

interface MetricCardProps {
  title: string
  value: React.ReactNode
  subtitle?: string
  trend?: { label: string; change: number; positive: boolean }
}

export function MetricCard({ title, value, subtitle, trend }: MetricCardProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-wood/70 uppercase tracking-wider">
          {title}
        </p>
        {trend && (
          <span
            className={cn(
              "text-xs font-semibold flex items-center gap-1",
              trend.positive ? "text-forest" : "text-brick"
            )}
          >
            {trend.change > 0 ? "+" : ""}{trend.change}% {trend.label}
          </span>
        )}
      </div>
      <div className="mt-2">
        <p className="text-3xl font-serif font-semibold text-ink tracking-tight">
          {value}
        </p>
        {subtitle && <p className="text-xs text-wood/60">{subtitle}</p>}
      </div>
    </div>
  )
}
