// Mist & Mug — Sales Dashboard
// Comparison metric card: shows current vs previous period with growth indicator.

import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import { Card, CardContent, CardHeader } from "../ui/card"

interface ComparisonMetricCardProps {
  title: string
  current: number
  previous: number
  absoluteDiff: number
  changePercent: number | null
  valid: boolean
  format?: "currency" | "number" | "decimal"
  subtitle?: string
}

export function ComparisonMetricCard({
  title,
  current,
  previous,
  absoluteDiff,
  changePercent,
  valid,
  format = "number",
  subtitle,
}: ComparisonMetricCardProps) {
  const formatValue = (v: number) => {
    if (format === "currency") return `₹${v.toLocaleString()}`
    if (format === "decimal") return v.toFixed(2)
    return v.toLocaleString()
  }

  const isPositive = absoluteDiff > 0
  const isNegative = absoluteDiff < 0

  const getIndicator = () => {
    if (!valid) return <Minus className="h-4 w-4 text-wood" aria-hidden="true" />
    if (isPositive) return (
      <ArrowUpRight className="h-4 w-4 text-forest" aria-hidden="true" />
    )
    if (isNegative) return (
      <ArrowDownRight className="h-4 w-4 text-brick" aria-hidden="true" />
    )
    return <Minus className="h-4 w-4 text-wood" aria-hidden="true" />
  }

  const getChangeText = () => {
    if (!valid) return "N/A"
    const sign = changePercent! > 0 ? "+" : changePercent! < 0 ? "" : ""
    return `${sign}${changePercent!.toFixed(1)}%`
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-wood/70 uppercase tracking-wider">
              {title}
            </p>
            {subtitle && <p className="text-xs text-wood/60">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-1 text-xs">
            {getIndicator()}
            <span
              className={`font-semibold ${
                !valid
                  ? "text-wood"
                  : isPositive
                  ? "text-forest"
                  : isNegative
                  ? "text-brick"
                  : "text-wood"
              }`}
            >
              {getChangeText()}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-wood/60">Current period</span>
            <span className="text-ink font-serif font-medium">{formatValue(current)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-wood/60">Previous period</span>
            <span className="text-ink font-serif font-medium">{formatValue(previous)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-wood/60">Absolute difference</span>
            <span
              className={`font-serif font-medium ${
                absoluteDiff > 0
                  ? "text-forest"
                  : absoluteDiff < 0
                  ? "text-brick"
                  : "text-wood"
              }`}
            >
              {absoluteDiff >= 0 ? "+" : ""}{formatValue(absoluteDiff)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
