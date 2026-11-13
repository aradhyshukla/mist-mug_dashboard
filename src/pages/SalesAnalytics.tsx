import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Upload, BarChart3, Clock, Activity, PieChart, Calendar } from "lucide-react"
import { Button } from "../components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Separator } from "../components/ui/separator"
import { SectionHeader } from "../components/common/SectionHeader"
import { EMPTY_ICONS, EmptyState } from "../components/common/EmptyState"
import { MetricCard } from "../components/common/MetricCard"

const PERIODS = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "alltime", label: "All Time" },
]

// Each analytics card is a visual shell only. No calculations are performed
// in Phase 1; real data arrives from uploaded batches in Phase 2.
const PLACEHOLDERS = [
  {
    title: "Revenue Trend",
    icon: Activity,
    description: "Daily revenue over the selected reporting period.",
  },
  {
    title: "Top-Selling Products",
    icon: BarChart3,
    description: "Ranked by units sold within the period.",
  },
  {
    title: "Peak Sales Hours",
    icon: Clock,
    description: "Hour-of-day distribution of orders.",
  },
  {
    title: "Weekday vs Weekend",
    icon: Calendar,
    description: "Comparison of weekend and weekday sales.",
  },
  {
    title: "Product Performance",
    icon: PieChart,
    description: "Revenue share by product category.",
  },
  {
    title: "Sales Breakdown",
    icon: BarChart3,
    description: "Payment and channel breakdown (when available).",
  },
]

export default function SalesAnalytics() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<"week" | "month" | "year" | "alltime">("week")

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
        <Button
          onClick={() => navigate("/upload-data")}
          className="lg:ml-auto"
          variant="outline"
        >
          <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
          Upload Sales Data
        </Button>
      </div>

      {/* Period selector */}
      <Card className="border-border">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
          <CardTitle className="text-sm font-semibold text-wood/70 uppercase tracking-wider">
            Reporting period
          </CardTitle>
          <Tabs
            value={period}
            onValueChange={setPeriod as (value: string) => void}
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

      {/* Snapshot metrics (empty until data imported) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Revenue" value="â€”" subtitle="INR Â· selected period" />
        <MetricCard title="Orders" value="â€”" subtitle="Count" />
        <MetricCard title="Items Sold" value="â€”" subtitle="Units" />
        <MetricCard title="Avg. Order Value" value="â€”" subtitle="INR" />
      </div>

      <Separator className="my-6" />

      {/* Analytics placeholders */}
      <SectionHeader
        title="Analytics Views"
        description="Select a reporting period above. Each view populates once sales data has been imported."
      />
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {PLACEHOLDERS.map((ph) => {
          const Icon = ph.icon
          return (
            <Card key={ph.title} className="border-border">
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cream/50 text-wood mb-3">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="font-serif font-semibold text-ink">{ph.title}</h3>
                <p className="mt-2 text-xs text-wood/60 leading-relaxed">
                  {ph.description}
                </p>
                <div className="mt-6 h-24 w-full rounded-lg border border-dashed border-border bg-cream/30 flex items-center justify-center">
                  <EmptyState
                    icon={EMPTY_ICONS.activity}
                    title="No data"
                    description="Import sales data to populate"
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <p className="mt-6 text-xs text-wood/50 max-w-2xl">
        No analytical calculations are performed in Phase 1. All views above are
        layout placeholders. Figures will be computed from uploaded batches once
        the import engine lands in Phase 2.
      </p>
    </div>
  )
}


