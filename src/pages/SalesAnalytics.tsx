// Mist & Mug — Sales Dashboard
// Sales Analytics page: real analytics from imported data.

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Upload } from "lucide-react"
import { Button } from "../components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Card, CardHeader } from "../components/ui/card"
import { Separator } from "../components/ui/separator"
import { SectionHeader } from "../components/common/SectionHeader"
import { KPICards } from "../components/analytics/KPICards"
import { RevenueTrendChart } from "../components/analytics/RevenueTrendChart"
import { TopProductsChart } from "../components/analytics/TopProductsChart"
import { WeekdayWeekendChart } from "../components/analytics/WeekdayWeekendChart"
import { HourlyChart } from "../components/analytics/HourlyChart"
import { ProductPerformanceTable } from "../components/analytics/ProductPerformanceTable"
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

export default function SalesAnalytics() {
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
    dailyTrend,
    weeklyBreakdown,
    monthlyTrend,
    yearlyTrend,
    revenueByHour,
    topProductsByRevenue,
    weekdayWeekend,
  } = useAnalytics({ type: period, startDate, endDate })

  const trendData =
    period === "week"
      ? dailyTrend
      : period === "month"
      ? weeklyBreakdown
      : period === "year"
      ? monthlyTrend
      : yearlyTrend

  return (
    <div className="space-y-8 p-6 md:p-8 lg:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-ink tracking-tight">
            Sales Analytics
          </h1>
          <p className="mt-1 text-sm text-wood/60">
            View revenue trends and product performance across reporting
            periods.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/overview")} variant="outline">
            Back to Overview
          </Button>
          <Button onClick={() => navigate("/upload-data")} variant="outline">
            <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
            Upload Sales Data
          </Button>
        </div>
      </div>

      {/* Period selector */}
      <Card className="border-border">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
          <span className="text-sm font-semibold text-wood/70 uppercase tracking-wider">
            Reporting period
          </span>
          <Tabs
            value={period}
            onValueChange={(value) => setPeriod(value as ReportingPeriodType)}
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
        </CardHeader>
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
          <p className="text-sm text-wood/60">Loading analytics…</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-brick/80">
          <p>Error loading analytics: {error}</p>
        </div>
      ) : (
        <>
          <SectionHeader
            title="Analytics Overview"
            description="All figures are calculated from imported transaction data using actual historical prices."
          />

          <KPICards metrics={metrics} />

          <Separator className="my-6" />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <RevenueTrendChart
              data={trendData}
              title={
                period === "week"
                  ? "Daily Revenue Trend"
                  : period === "month"
                  ? "Weekly Revenue Breakdown"
                  : period === "year"
                  ? "Monthly Revenue Trend"
                  : "Yearly Revenue Trend"
              }
            />
            <TopProductsChart
              data={topProductsByRevenue}
              rankBy="revenue"
              title="Top-Selling Products (by Revenue)"
            />
            <WeekdayWeekendChart data={weekdayWeekend} />
            <HourlyChart data={revenueByHour} />
            <ProductPerformanceTable data={topProductsByRevenue} />
          </div>

          <p className="mt-6 text-xs text-wood/50 max-w-2xl">
            Import sales data via the Upload Data page to populate analytics.
            All calculations use actual historical transaction prices — no
            figures are invented.
          </p>
        </>
      )}
    </div>
  )
}
