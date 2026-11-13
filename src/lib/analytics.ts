// Mist & Mug — Sales Dashboard
// Analytics engine: deterministic calculations for KPIs, trends, products,
// weekday/weekend comparisons, and period-over-period analysis.
//
// All calculations use actual historical transaction prices from imported
// data. No AI, no invented insights, no fabricated numbers.

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
  isWeekend,
  isDateInRange,
  getWeekStart,
} from "./date-utils"
import { db } from "./db"

/** Filter transaction lines by a date range [startDate, endDate] inclusive. */
export function filterByDateRange(
  lines: TransactionLine[],
  startDate: string,
  endDate: string
): TransactionLine[] {
  return lines.filter((l) => isDateInRange(l.date, startDate, endDate))
}

/** Get unique transaction IDs from lines. */
export function getUniqueTransactionIds(
  lines: TransactionLine[]
): Set<string> {
  return new Set(lines.map((l) => l.transactionId))
}

/** Calculate KPI metrics for a set of lines. */
export function calculateMetrics(
  lines: TransactionLine[]
): DashboardMetrics {
  const revenue = lines.reduce((sum, l) => sum + l.lineTotal, 0)
  const itemsSold = lines.reduce((sum, l) => sum + l.quantity, 0)
  const uniqueOrders = getUniqueTransactionIds(lines).size
  const averageOrderValue =
    uniqueOrders > 0 ? revenue / uniqueOrders : 0

  return {
    revenue,
    orders: uniqueOrders,
    itemsSold,
    averageOrderValue,
    transactionIdsReliable: uniqueOrders > 0,
  }
}

/** Get daily revenue trend for a set of lines (Week mode). */
export function getDailyTrend(lines: TransactionLine[]): DayData[] {
  const byDay = new Map<
    string,
    { revenue: number; orders: Set<string>; items: number }
  >()
  for (const l of lines) {
    const existing = byDay.get(l.date) || {
      revenue: 0,
      orders: new Set<string>(),
      items: 0,
    }
    existing.revenue += l.lineTotal
    existing.orders.add(l.transactionId)
    existing.items += l.quantity
    byDay.set(l.date, existing)
  }

  return Array.from(byDay.entries())
    .map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders.size,
      itemsSold: data.items,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Get weekly breakdown for a set of lines (Month mode). */
export function getWeeklyBreakdown(lines: TransactionLine[]): DayData[] {
  const byWeek = new Map<
    string,
    { revenue: number; orders: Set<string>; items: number }
  >()
  for (const l of lines) {
    const weekStart = getWeekStart(l.date)
    const existing = byWeek.get(weekStart) || {
      revenue: 0,
      orders: new Set<string>(),
      items: 0,
    }
    existing.revenue += l.lineTotal
    existing.orders.add(l.transactionId)
    existing.items += l.quantity
    byWeek.set(weekStart, existing)
  }

  return Array.from(byWeek.entries())
    .map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders.size,
      itemsSold: data.items,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Get monthly trend for a set of lines (Year mode). */
export function getMonthlyTrend(lines: TransactionLine[]): DayData[] {
  const byMonth = new Map<
    string,
    { revenue: number; orders: Set<string>; items: number }
  >()
  for (const l of lines) {
    const monthKey = l.date.slice(0, 7) // YYYY-MM
    const existing = byMonth.get(monthKey) || {
      revenue: 0,
      orders: new Set<string>(),
      items: 0,
    }
    existing.revenue += l.lineTotal
    existing.orders.add(l.transactionId)
    existing.items += l.quantity
    byMonth.set(monthKey, existing)
  }

  return Array.from(byMonth.entries())
    .map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders.size,
      itemsSold: data.items,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Get yearly trend for All Time mode. */
export function getYearlyTrend(lines: TransactionLine[]): DayData[] {
  const byYear = new Map<
    string,
    { revenue: number; orders: Set<string>; items: number }
  >()
  for (const l of lines) {
    const year = l.date.slice(0, 4)
    const existing = byYear.get(year) || {
      revenue: 0,
      orders: new Set<string>(),
      items: 0,
    }
    existing.revenue += l.lineTotal
    existing.orders.add(l.transactionId)
    existing.items += l.quantity
    byYear.set(year, existing)
  }

  return Array.from(byYear.entries())
    .map(([date, data]) => ({
      date: `${date}-01-01`,
      revenue: data.revenue,
      orders: data.orders.size,
      itemsSold: data.items,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Get revenue by hour (0-23). */
export function getRevenueByHour(lines: TransactionLine[]): HourData[] {
  const byHour = new Map<number, { revenue: number; orders: Set<string> }>()
  for (const l of lines) {
    const existing = byHour.get(l.hour) || { revenue: 0, orders: new Set<string>() }
    existing.revenue += l.lineTotal
    existing.orders.add(l.transactionId)
    byHour.set(l.hour, existing)
  }

  return Array.from(byHour.entries())
    .map(([hour, data]) => ({
      hour,
      revenue: data.revenue,
      orders: data.orders.size,
    }))
    .sort((a, b) => a.hour - b.hour)
}

/** Get top-selling products ranked by quantity or revenue. */
export function getTopProducts(
  lines: TransactionLine[],
  rankBy: "quantity" | "revenue",
  limit: 5 | 10
): ProductPerformance[] {
  const byProduct = new Map<
    string,
    {
      productName: string
      category: string
      revenue: number
      quantitySold: number
      orders: Set<string>
    }
  >()

  for (const l of lines) {
    const existing =
      byProduct.get(l.productName) || {
        productName: l.productName,
        category: l.category,
        revenue: 0,
        quantitySold: 0,
        orders: new Set<string>(),
      }
    existing.revenue += l.lineTotal
    existing.quantitySold += l.quantity
    existing.orders.add(l.transactionId)
    byProduct.set(l.productName, existing)
  }

  const results: ProductPerformance[] = Array.from(byProduct.values()).map(
    (p) => ({
      productName: p.productName,
      category: p.category,
      revenue: p.revenue,
      quantitySold: p.quantitySold,
      orders: p.orders.size,
      averageSellingPrice:
        p.quantitySold > 0 ? p.revenue / p.quantitySold : 0,
    })
  )

  results.sort((a, b) => {
    if (rankBy === "quantity") {
      return b.quantitySold - a.quantitySold || b.revenue - a.revenue
    }
    return b.revenue - a.revenue || b.quantitySold - a.quantitySold
  })

  return results.slice(0, limit)
}

/** Get category performance. */
export function getCategoryPerformance(
  lines: TransactionLine[]
): CategoryPerformance[] {
  const byCategory = new Map<
    string,
    { revenue: number; quantitySold: number; orders: Set<string> }
  >()

  for (const l of lines) {
    const existing =
      byCategory.get(l.category) || {
        revenue: 0,
        quantitySold: 0,
        orders: new Set<string>(),
      }
    existing.revenue += l.lineTotal
    existing.quantitySold += l.quantity
    existing.orders.add(l.transactionId)
    byCategory.set(l.category, existing)
  }

  return Array.from(byCategory.entries()).map(([category, data]) => ({
    category,
    revenue: data.revenue,
    quantitySold: data.quantitySold,
    orders: data.orders.size,
  }))
}

/** Weekday vs weekend comparison. Monday-Friday = weekday, Saturday-Sunday = weekend. */
export function getWeekdayWeekendComparison(
  lines: TransactionLine[]
): WeekdayWeekendComparison {
  let weekdayRevenue = 0
  let weekendRevenue = 0
  let weekdayOrders = 0
  let weekendOrders = 0
  const weekdayDays = new Set<string>()
  const weekendDays = new Set<string>()

  for (const l of lines) {
    if (isWeekend(l.date)) {
      weekendRevenue += l.lineTotal
      weekendDays.add(l.date)
    } else {
      weekdayRevenue += l.lineTotal
      weekdayDays.add(l.date)
    }
  }

  // Count unique orders by day type
  const weekdayTxns = new Set<string>()
  const weekendTxns = new Set<string>()
  for (const l of lines) {
    if (isWeekend(l.date)) {
      weekendTxns.add(l.transactionId)
    } else {
      weekdayTxns.add(l.transactionId)
    }
  }
  weekdayOrders = weekdayTxns.size
  weekendOrders = weekendTxns.size

  const averageWeekdayRevenue = weekdayDays.size > 0 ? weekdayRevenue / weekdayDays.size : 0
  const averageWeekendRevenue = weekendDays.size > 0 ? weekendRevenue / weekendDays.size : 0

  const orderVolumeDifference = weekdayOrders - weekendOrders

  let percentageDifference: number | null = null
  let valid = false

  if (weekdayDays.size > 0 && weekendDays.size > 0) {
    valid = true
    const avgDiff = averageWeekdayRevenue - averageWeekendRevenue
    const baseline =
      averageWeekdayRevenue > 0 ? averageWeekdayRevenue : averageWeekendRevenue
    if (baseline > 0) {
      percentageDifference = (avgDiff / baseline) * 100
    }
  }

  return {
    weekdayRevenue,
    weekendRevenue,
    weekdayOrders,
    weekendOrders,
    weekdayDays: weekdayDays.size,
    weekendDays: weekendDays.size,
    averageWeekdayRevenue,
    averageWeekendRevenue,
    orderVolumeDifference,
    percentageDifference,
    valid,
  }
}

/** Calculate period-over-period comparison. */
export function calculateComparison(
  currentLines: TransactionLine[],
  previousLines: TransactionLine[]
): PerformanceComparison {
  const current = calculateMetrics(currentLines)
  const previous = calculateMetrics(previousLines)

  let changePercent: number | null = null
  let valid = false

  if (previous.revenue > 0) {
    changePercent = ((current.revenue - previous.revenue) / previous.revenue) * 100
    valid = true
  } else if (current.revenue > 0) {
    changePercent = null
    valid = false
  }

  return {
    period: "comparison",
    revenue: current.revenue,
    orders: current.orders,
    itemsSold: current.itemsSold,
    changePercent,
    valid,
  }
}

/** Load all transaction lines from database. */
export async function loadAllLines(): Promise<TransactionLine[]> {
  return db.transactionLines.toArray()
}

/** Load lines for a specific upload batch. */
export async function loadLinesByBatch(batchId: string): Promise<TransactionLine[]> {
  return db.transactionLines.where("uploadBatchId").equals(batchId).toArray()
}

/** Get distinct upload batch IDs. */
export async function getDistinctBatchIds(): Promise<string[]> {
  const lines = await db.transactionLines.toArray()
  return Array.from(new Set(lines.map((l) => l.uploadBatchId).filter(Boolean)))
}

/** Get lines for a reporting period. */
export async function loadLinesForPeriod(
  startDate: string,
  endDate: string
): Promise<TransactionLine[]> {
  return db.transactionLines.where("date").between(startDate, endDate).toArray()
}

/** Calculate the percentage change from previous to current. */
export function calculatePercentChange(
  current: number,
  previous: number
): { changePercent: number | null; valid: boolean } {
  if (previous > 0) {
    return {
      changePercent: ((current - previous) / previous) * 100,
      valid: true,
    }
  }
  return { changePercent: null, valid: false }
}

/** Compare current vs previous period for all KPI metrics. */
export interface MetricComparison {
  revenue: {
    current: number
    previous: number
    absoluteDiff: number
    changePercent: number | null
    valid: boolean
  }
  orders: {
    current: number
    previous: number
    absoluteDiff: number
    changePercent: number | null
    valid: boolean
  }
  itemsSold: {
    current: number
    previous: number
    absoluteDiff: number
    changePercent: number | null
    valid: boolean
  }
  averageOrderValue: {
    current: number
    previous: number
    absoluteDiff: number
    changePercent: number | null
    valid: boolean
  }
}

export function calculateMetricComparison(
  currentLines: TransactionLine[],
  previousLines: TransactionLine[]
): MetricComparison {
  const current = calculateMetrics(currentLines)
  const previous = calculateMetrics(previousLines)

  const revenueDiff = current.revenue - previous.revenue
  const ordersDiff = current.orders - previous.orders
  const itemsDiff = current.itemsSold - previous.itemsSold
  const aovDiff = current.averageOrderValue - previous.averageOrderValue

  const revenuePct = calculatePercentChange(current.revenue, previous.revenue)
  const ordersPct = calculatePercentChange(current.orders, previous.orders)
  const itemsPct = calculatePercentChange(current.itemsSold, previous.itemsSold)
  const aovPct = calculatePercentChange(
    current.averageOrderValue,
    previous.averageOrderValue
  )

  return {
    revenue: {
      current: current.revenue,
      previous: previous.revenue,
      absoluteDiff: revenueDiff,
      changePercent: revenuePct.changePercent,
      valid: revenuePct.valid,
    },
    orders: {
      current: current.orders,
      previous: previous.orders,
      absoluteDiff: ordersDiff,
      changePercent: ordersPct.changePercent,
      valid: ordersPct.valid,
    },
    itemsSold: {
      current: current.itemsSold,
      previous: previous.itemsSold,
      absoluteDiff: itemsDiff,
      changePercent: itemsPct.changePercent,
      valid: itemsPct.valid,
    },
    averageOrderValue: {
      current: current.averageOrderValue,
      previous: previous.averageOrderValue,
      absoluteDiff: aovDiff,
      changePercent: aovPct.changePercent,
      valid: aovPct.valid,
    },
  }
}

/** Product comparison between current and previous periods. */
export interface ProductComparison {
  productName: string
  category: string
  currentRevenue: number
  previousRevenue: number
  revenueChange: number
  revenueChangePercent: number | null
  currentQuantity: number
  previousQuantity: number
  quantityChange: number
  quantityChangePercent: number | null
  currentOrders: number
  previousOrders: number
}

export function getProductComparison(
  currentLines: TransactionLine[],
  previousLines: TransactionLine[]
): ProductComparison[] {
  const currentByProduct = aggregateByProduct(currentLines)
  const previousByProduct = aggregateByProduct(previousLines)

  const allProductNames = new Set([
    ...Array.from(currentByProduct.keys()),
    ...Array.from(previousByProduct.keys()),
  ])

  const results: ProductComparison[] = Array.from(allProductNames).map(
    (name) => {
      const cur = currentByProduct.get(name) || {
        revenue: 0,
        quantity: 0,
        orders: 0,
        category: "",
      }
      const prev = previousByProduct.get(name) || {
        revenue: 0,
        quantity: 0,
        orders: 0,
        category: "",
      }
      const category = cur.category || prev.category || "Uncategorised"

      const revenueChange = cur.revenue - prev.revenue
      const quantityChange = cur.quantity - prev.quantity

      const revenuePct = calculatePercentChange(cur.revenue, prev.revenue)
      const quantityPct = calculatePercentChange(cur.quantity, prev.quantity)

      return {
        productName: name,
        category,
        currentRevenue: cur.revenue,
        previousRevenue: prev.revenue,
        revenueChange,
        revenueChangePercent: revenuePct.changePercent,
        currentQuantity: cur.quantity,
        previousQuantity: prev.quantity,
        quantityChange,
        quantityChangePercent: quantityPct.changePercent,
        currentOrders: cur.orders,
        previousOrders: prev.orders,
      }
    }
  )

  return results
}

/** Category comparison between current and previous periods. */
export interface CategoryComparison {
  category: string
  currentRevenue: number
  previousRevenue: number
  revenueChange: number
  revenueChangePercent: number | null
  currentQuantity: number
  previousQuantity: number
  quantityChange: number
  quantityChangePercent: number | null
  currentOrders: number
  previousOrders: number
}

export function getCategoryComparison(
  currentLines: TransactionLine[],
  previousLines: TransactionLine[]
): CategoryComparison[] {
  const currentByCategory = aggregateByCategory(currentLines)
  const previousByCategory = aggregateByCategory(previousLines)

  const allCategories = new Set([
    ...Array.from(currentByCategory.keys()),
    ...Array.from(previousByCategory.keys()),
  ])

  const results: CategoryComparison[] = Array.from(allCategories).map(
    (cat) => {
      const cur = currentByCategory.get(cat) || {
        revenue: 0,
        quantity: 0,
        orders: 0,
      }
      const prev = previousByCategory.get(cat) || {
        revenue: 0,
        quantity: 0,
        orders: 0,
      }

      const revenueChange = cur.revenue - prev.revenue
      const quantityChange = cur.quantity - prev.quantity

      const revenuePct = calculatePercentChange(cur.revenue, prev.revenue)
      const quantityPct = calculatePercentChange(cur.quantity, prev.quantity)

      return {
        category: cat,
        currentRevenue: cur.revenue,
        previousRevenue: prev.revenue,
        revenueChange,
        revenueChangePercent: revenuePct.changePercent,
        currentQuantity: cur.quantity,
        previousQuantity: prev.quantity,
        quantityChange,
        quantityChangePercent: quantityPct.changePercent,
        currentOrders: cur.orders,
        previousOrders: prev.orders,
      }
    }
  )

  return results
}

/** Internal helper: aggregate transaction lines by product. */
function aggregateByProduct(
  lines: TransactionLine[]
): Map<
  string,
  { revenue: number; quantity: number; orders: number; category: string }
> {
  const byProduct = new Map<
    string,
    { revenue: number; quantity: number; orders: Set<string>; category: string }
  >()

  for (const l of lines) {
    const existing =
      byProduct.get(l.productName) || {
        revenue: 0,
        quantity: 0,
        orders: new Set<string>(),
        category: l.category,
      }
    existing.revenue += l.lineTotal
    existing.quantity += l.quantity
    existing.orders.add(l.transactionId)
    existing.category = l.category
    byProduct.set(l.productName, existing)
  }

  const result = new Map<
    string,
    { revenue: number; quantity: number; orders: number; category: string }
  >()
  for (const [name, data] of byProduct.entries()) {
    result.set(name, {
      revenue: data.revenue,
      quantity: data.quantity,
      orders: data.orders.size,
      category: data.category,
    })
  }
  return result
}

/** Internal helper: aggregate transaction lines by category. */
function aggregateByCategory(
  lines: TransactionLine[]
): Map<
  string,
  { revenue: number; quantity: number; orders: number }
> {
  const byCategory = new Map<
    string,
    { revenue: number; quantity: number; orders: Set<string> }
  >()

  for (const l of lines) {
    const existing =
      byCategory.get(l.category) || {
        revenue: 0,
        quantity: 0,
        orders: new Set<string>(),
      }
    existing.revenue += l.lineTotal
    existing.quantity += l.quantity
    existing.orders.add(l.transactionId)
    byCategory.set(l.category, existing)
  }

  const result = new Map<
    string,
    { revenue: number; quantity: number; orders: number }
  >()
  for (const [cat, data] of byCategory.entries()) {
    result.set(cat, {
      revenue: data.revenue,
      quantity: data.quantity,
      orders: data.orders.size,
    })
  }
  return result
}
