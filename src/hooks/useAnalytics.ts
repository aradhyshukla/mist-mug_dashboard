// Mist & Mug — Sales Dashboard
// Hook for analytics calculations based on selected reporting period.

import { useCallback, useEffect, useMemo, useState } from "react"
import type {
  TransactionLine,
  DashboardMetrics,
  DayData,
  HourData,
  ProductPerformance,
  CategoryPerformance,
  WeekdayWeekendComparison,
  PerformanceComparison,
} from "../types"
import {
  loadLinesForPeriod,
  calculateMetrics,
  getDailyTrend,
  getWeeklyBreakdown,
  getMonthlyTrend,
  getYearlyTrend,
  getRevenueByHour,
  getTopProducts,
  getCategoryPerformance,
  getWeekdayWeekendComparison,
} from "../lib/analytics"

interface UseAnalyticsProps {
  type: "week" | "month" | "year" | "alltime"
  startDate: string
  endDate: string
}

export function useAnalytics({ type, startDate, endDate }: UseAnalyticsProps) {
  const [lines, setLines] = useState<TransactionLine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const all = await loadLinesForPeriod(startDate, endDate)
      setLines(all)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [type, startDate, endDate])

  useEffect(() => {
    void load()
  }, [load])

  const metrics = useMemo(() => calculateMetrics(lines), [lines])

  const dailyTrend = useMemo(() => getDailyTrend(lines), [lines])
  const weeklyBreakdown = useMemo(() => getWeeklyBreakdown(lines), [lines])
  const monthlyTrend = useMemo(() => getMonthlyTrend(lines), [lines])
  const yearlyTrend = useMemo(() => getYearlyTrend(lines), [lines])
  const revenueByHour = useMemo(() => getRevenueByHour(lines), [lines])
  const topProductsByQty = useMemo(
    () => getTopProducts(lines, "quantity", 10),
    [lines]
  )
  const topProductsByRevenue = useMemo(
    () => getTopProducts(lines, "revenue", 10),
    [lines]
  )
  const categoryPerformance = useMemo(
    () => getCategoryPerformance(lines),
    [lines]
  )
  const weekdayWeekend = useMemo(
    () => getWeekdayWeekendComparison(lines),
    [lines]
  )

  return {
    lines,
    loading,
    error,
    metrics,
    dailyTrend,
    weeklyBreakdown,
    monthlyTrend,
    yearlyTrend,
    revenueByHour,
    topProductsByQty,
    topProductsByRevenue,
    categoryPerformance,
    weekdayWeekend,
    reload: load,
  }
}

export type {
  DashboardMetrics,
  DayData,
  HourData,
  ProductPerformance,
  CategoryPerformance,
  WeekdayWeekendComparison,
  PerformanceComparison,
}
