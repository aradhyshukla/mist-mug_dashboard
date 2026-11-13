// Mist & Mug — Sales Dashboard
// Performance Tracker page: period-over-period comparison with metrics, charts, and tables.

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Upload } from "lucide-react"
import { Button } from "../components/ui/button"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs"
import { Card } from "../components/ui/card"
import { SectionHeader } from "../components/common/SectionHeader"
import {
  ComparisonMetricCard,
} from "../components/analytics/ComparisonMetricCard"
import { ComparisonChart } from "../components/analytics/ComparisonChart"
import { ProductComparisonTable } from "../components/analytics/ProductComparisonTable"
import { CategoryComparisonTable } from "../components/analytics/CategoryComparisonTable"
import { useAnalytics } from "../hooks/useAnalytics"
import {
  loadAllLines,
  loadLinesForPeriod,
  calculateMetricComparison,
  getProductComparison,
  getCategoryComparison,
} from "../lib/analytics"
import {
  getWeekStart,
  getMonthEnd,
  getAvailableYears,
  getPreviousPeriodDates,
} from "../lib/date-utils"
import type { ReportingPeriodType } from "../types"

const PERIODS: Array<{ value: ReportingPeriodType; label: string }> = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "alltime", label: "All Time" },
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
  const [showComparison, setShowComparison] = useState(true)

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

  // Previous period dates for comparison
  const prevPeriod = showComparison
    ? getPreviousPeriodDates(period, startDate, endDate)
    : null

  const {
    loading,
    error,
    metrics,
  } = useAnalytics({ type: period, startDate, endDate })

  // Load previous period data for comparison
  const [prevMetrics, setPrevMetrics] = useState<{
    revenue: number
    orders: number
    itemsSold: number
    averageOrderValue: number
  } | null>(null)
  const [prevProductComparison, setPrevProductComparison] = useState<
    ReturnType<typeof getProductComparison>
  >([])
  const [prevCategoryComparison, setPrevCategoryComparison] = useState<
    ReturnType<typeof getCategoryComparison>
  >([])
  const [comparisonLoading, setComparisonLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    const loadComparison = async () => {
      if (!showComparison || !prevPeriod) {
        setPrevMetrics(null)
        setPrevProductComparison([])
        setPrevCategoryComparison([])
        return
      }
      setComparisonLoading(true)
      try {
        const prevLines = await loadLinesForPeriod(
          prevPeriod.startDate,
          prevPeriod.endDate
        )
        const currLines = await loadLinesForPeriod(startDate, endDate)

        const comparison = calculateMetricComparison(currLines, prevLines)
        const productComp = getProductComparison(currLines, prevLines)
        const categoryComp = getCategoryComparison(currLines, prevLines)

        if (!mounted) return
        setPrevMetrics({
          revenue: comparison.revenue.previous,
          orders: comparison.orders.previous,
          itemsSold: comparison.itemsSold.previous,
          averageOrderValue: comparison.averageOrderValue.previous,
        })
        setPrevProductComparison(productComp)
        setPrevCategoryComparison(categoryComp)
      } catch (err) {
        console.error("Failed to load comparison data:", err)
      } finally {
        if (mounted) setComparisonLoading(false)
      }
    }
    void loadComparison()
    return () => {
      mounted = false
    }
  }, [showComparison, prevPeriod, startDate, endDate])

  const computeChangePercent = (
    _current: number,
    previous: number
  ): number | null => {
    if (previous > 0) return ((_current - previous) / previous) * 100
    return null
  }

  const computeValid = (
    _current: number,
    previous: number
  ): boolean => previous > 0

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

      {/* Comparison toggle */}
      {period !== "alltime" && periodOptions.length > 0 && (
        <div className="flex items-center gap-3 pb-2">
          <button
            onClick={() => setShowComparison((s) => !s)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors border ${
              showComparison
                ? "bg-forest text-cream border-forest"
                : "bg-cream text-wood border-border hover:bg-wood/10"
            }`}
          >
            {showComparison ? "▾" : "▸"} Compare with previous period
          </button>
          {showComparison && prevPeriod && (
            <span className="text-xs text-wood/60">
              Previous: {prevPeriod.startDate} to {prevPeriod.endDate}
            </span>
          )}
        </div>
      )}

      {loading || comparisonLoading ? (
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

          {/* KPI Comparison Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ComparisonMetricCard
              title="Total Revenue"
              current={metrics?.revenue ?? 0}
              previous={prevMetrics?.revenue ?? 0}
              absoluteDiff={
                metrics ? metrics.revenue - (prevMetrics?.revenue ?? 0) : 0
              }
              changePercent={computeChangePercent(
                metrics?.revenue ?? 0,
                prevMetrics?.revenue ?? 0
              )}
              valid={computeValid(
                metrics?.revenue ?? 0,
                prevMetrics?.revenue ?? 0
              )}
              format="currency"
              subtitle="INR · selected period"
            />
            <ComparisonMetricCard
              title="Unique Orders"
              current={metrics?.orders ?? 0}
              previous={prevMetrics?.orders ?? 0}
              absoluteDiff={
                metrics ? metrics.orders - (prevMetrics?.orders ?? 0) : 0
              }
              changePercent={computeChangePercent(
                metrics?.orders ?? 0,
                prevMetrics?.orders ?? 0
              )}
              valid={computeValid(
                metrics?.orders ?? 0,
                prevMetrics?.orders ?? 0
              )}
              format="number"
              subtitle="Unique transactions"
            />
            <ComparisonMetricCard
              title="Items Sold"
              current={metrics?.itemsSold ?? 0}
              previous={prevMetrics?.itemsSold ?? 0}
              absoluteDiff={
                metrics
                  ? metrics.itemsSold - (prevMetrics?.itemsSold ?? 0)
                  : 0
              }
              changePercent={computeChangePercent(
                metrics?.itemsSold ?? 0,
                prevMetrics?.itemsSold ?? 0
              )}
              valid={computeValid(
                metrics?.itemsSold ?? 0,
                prevMetrics?.itemsSold ?? 0
              )}
              format="number"
              subtitle="Line items sold"
            />
            <ComparisonMetricCard
              title="Avg. Order Value"
              current={metrics?.averageOrderValue ?? 0}
              previous={prevMetrics?.averageOrderValue ?? 0}
              absoluteDiff={
                metrics
                  ? metrics.averageOrderValue -
                    (prevMetrics?.averageOrderValue ?? 0)
                  : 0
              }
              changePercent={computeChangePercent(
                metrics?.averageOrderValue ?? 0,
                prevMetrics?.averageOrderValue ?? 0
              )}
              valid={computeValid(
                metrics?.averageOrderValue ?? 0,
                prevMetrics?.averageOrderValue ?? 0
              )}
              format="currency"
              subtitle="Revenue ÷ orders"
            />
          </div>

          {/* Comparison Charts */}
          {showComparison && (
            <SectionHeader
              title="Period Comparison"
              description="Current period vs previous comparable period."
            />
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <ComparisonChart
              title="Revenue Comparison"
              currentValue={metrics?.revenue ?? 0}
              previousValue={prevMetrics?.revenue ?? 0}
              currentLabel="Current"
              previousLabel="Previous"
              emptyMessage="No revenue data for comparison."
            />
            <ComparisonChart
              title="Order Volume Comparison"
              currentValue={metrics?.orders ?? 0}
              previousValue={prevMetrics?.orders ?? 0}
              currentLabel="Current"
              previousLabel="Previous"
              valueFormatter={(v) => `${Math.round(v)} orders`}
              emptyMessage="No order data for comparison."
            />
          </div>

          {/* Product Performance Changes */}
          <SectionHeader
            title="Product Performance Changes"
            description="Products ranked by absolute revenue change between periods."
          />
          <ProductComparisonTable
            data={prevProductComparison}
            title="Product Revenue Changes"
          />

          {/* Category Performance Changes */}
          <SectionHeader
            title="Category Performance Changes"
            description="Categories ranked by absolute revenue change between periods."
          />
          <CategoryComparisonTable
            data={prevCategoryComparison}
            title="Category Revenue Changes"
          />

          <p className="mt-6 text-xs text-wood/50 max-w-2xl">
            Metric cards remain empty until sales data is uploaded. No figures
            are imported.
          </p>
        </>
      )}
    </div>
  )
}
