// Mist & Mug — Sales Dashboard
// Analytics KPI cards.

import { MetricCard } from "../common/MetricCard"
import type { DashboardMetrics } from "../../types"

interface KPICardsProps {
  metrics: DashboardMetrics
}

export function KPICards({ metrics }: KPICardsProps) {
  const formatCurrency = (n: number) =>
    `₹${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  const formatNumber = (n: number) => n.toLocaleString()

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricCard
        title="Total Revenue"
        value={formatCurrency(metrics.revenue)}
        subtitle="INR · selected period"
      />
      <MetricCard
        title="Unique Orders"
        value={formatNumber(metrics.orders)}
        subtitle={metrics.transactionIdsReliable ? "Distinct transactions" : "Estimated"}
      />
      <MetricCard
        title="Items Sold"
        value={formatNumber(metrics.itemsSold)}
        subtitle="Line items sold"
      />
      <MetricCard
        title="Avg. Order Value"
        value={formatCurrency(metrics.averageOrderValue)}
        subtitle="Revenue ÷ orders"
      />
    </div>
  )
}
