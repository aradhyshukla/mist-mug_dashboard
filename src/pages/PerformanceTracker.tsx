// Mist & Mug — Sales Dashboard
// Performance Tracker page: real metrics and charts from imported data.

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs"
import { Card } from "../components/ui/card"
import { SectionHeader } from "../components/common/SectionHeader"
import { MetricCard } from "../components/common/MetricCard"
import { useAnalytics } from "../hooks/useAnalytics"
import { loadAllLines } from "../lib/analytics"
import { getWeekStart, getMonthEnd, getAvailableYears } from "../lib/date-utils"
import type { ReportingPeriodType } from "../types"

const PERIODS: Array<{ value: ReportingPeriodType; label: string }> = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "alltime", label: "All Time" },
]

const METRICS = [
  { title: "Total Revenue", key: "revenue" },
  { title: "Unique Orders", key: "orders" },
  { title: "Items Sold", key: "itemsSold" },
  { title: "Avg. Order Value", key: "aov" },
]

export default function PerformanceTracker() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<ReportingPeriodType>("week")
  const [periodOptions, setPeriodOptions] = useState<Array<{
    id: string
    label: string
    startDate: string
    endDate: string
  }>>([])
  const [selectedOption, setSelectedOption] = useState<{
    id: string
    label: string
    startDate: string
    endDate: string
  } | null>(null)

  // Load all lines to determine available dates and generate period options
  useEffect(() => {
    let mounted = true
    loadAllLines().then((lines) => {
      if (!mounted) return
      const dates = lines.map((l) => l.date)
      const years = getAvailableYears(dates)

      const opts: Array<{
        id: string
        label: string
        startDate: string
        endDate: string
      }> = []

      if (period === "alltime" && dates.length > 0) {
        const sorted = [...dates].sort()
        opts.push({
          id: "alltime",
          label: "All Time",
          startDate: sorted[0],
          endDate: sorted[sorted.length - 1],
        })
      } else if (period === "year") {
        for (const y of years) {
          opts.push({
            id: `year_${y}`,
            label: String(y),
            startDate: `${y}-01-01`,
            endDate: `${y}-12-31`,
          })
        }
      } else if (period === "month") {
        for (const y of years) {
          for (let m = 0; m < 12; m++) {
            const start = `${y}-${String(m + 1).padStart(2, "0")}-01`
            opts.push({
              id: `month_${y}_${m}`,
              label: new Date(y, m, 1).toLocaleString("en-US", {
                month: "long",
                year: "numeric",
              }),
              startDate: start,
              endDate: getMonthEnd(start),
            })
          }
        }
      } else if (period === "week" && dates.length > 0) {
        const sorted = [...dates].sort()
        const firstStart = getWeekStart(sorted[0])
        const lastStart = getWeekStart(sorted[sorted.length - 1])
        let current = new Date(firstStart)
        const last = new Date(lastStart)
        while (current <= last) {
          const ws = current.toISOString().slice(0, 10)
          opts.push({
            id: `week_${ws}`,
            label: `Week of ${ws}`,
            startDate: ws,
            endDate: new Date(current.getTime() + 6 * 24 * 60 * 60 * 1000)
              .toISOString()
              .slice(0, 10),
          })
          current.setDate(current.getDate() + 7)
        }
      }

      setPeriodOptions(opts)
      if (opts.length > 0 && !selectedOption) {
        setSelectedOption(opts[0])
      }
    })
    return () => {
      mounted = false
    }
  }, [period, selectedOption])

  const startDate = selectedOption?.startDate ?? ""
  const endDate = selectedOption?.endDate ?? ""

  const {
    loading,
    error,
    metrics,
  } = useAnalytics({ type: period, startDate, endDate })

  return (
    <div className="space-y-8 p-6 md:p-8 lg:p-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-ink tracking-tight">
            Performance Tracker
          </h1>
          <p className="mt-1 text-sm text-wood/60">
            Track how the café performs against goals. Populated from imported
            sales data.
          </p>
        </div>
        <Button onClick={() => navigate("/upload-data")} variant="outline">
          Upload Sales Data
        </Button>
      </div>

      {/* Period selector */}
      <Card className="border-border">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="text-sm font-semibold text-wood/70 uppercase tracking-wider">
              Reporting period
            </span>
            <Tabs
              value={period}
              onValueChange={(value) =>
                setPeriod(value as ReportingPeriodType)
              }
              className="w-full sm:w-auto"
            >
              <TabsList>
                {PERIODS.map((p) => (
                  <TabsTrigger key={p.value} value={p.value}>
                    {p.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </Card>

      {/* Specific period selector */}
      {periodOptions.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {periodOptions.map((opt) => (
            <Button
              key={opt.id}
              onClick={() => setSelectedOption(opt)}
              variant={selectedOption?.id === opt.id ? "default" : "outline"}
              size="sm"
            >
              {opt.label}
            </Button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <p className="text-sm text-wood/60">Loading performance data…</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-brick/80">
          <p>Error loading performance data: {error}</p>
        </div>
      ) : (
        <>
          <SectionHeader
            title="Performance Metrics"
            description="All figures are calculated from imported transaction data using actual historical prices."
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {METRICS.map((m) => {
              let value = "—"
              let subtitle = "No sales data yet"
              if (metrics) {
                switch (m.key) {
                  case "revenue":
                    value = `₹${metrics.revenue.toLocaleString()}`
                    subtitle = "INR · selected period"
                    break
                  case "orders":
                    value = metrics.orders.toLocaleString()
                    subtitle = "Unique transactions"
                    break
                  case "itemsSold":
                    value = metrics.itemsSold.toLocaleString()
                    subtitle = "Line items sold"
                    break
                  case "aov":
                    value = `₹${metrics.averageOrderValue.toLocaleString()}`
                    subtitle = "Revenue ÷ orders"
                    break
                }
              }
              return (
                <MetricCard
                  key={m.key}
                  title={m.title}
                  value={value}
                  subtitle={subtitle}
                />
              )
            })}
          </div>

          <p className="mt-6 text-xs text-wood/50 max-w-2xl">
            Metric cards remain empty until sales data is uploaded. No figures
            are imported.
          </p>
        </>
      )}
    </div>
  )
}
