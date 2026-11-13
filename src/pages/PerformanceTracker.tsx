import { useState } from "react"
import { Activity, BarChart3, Clock, Target } from "lucide-react"
import { Button } from "../components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs"
import { Card, CardContent } from "../components/ui/card"
import { SectionHeader } from "../components/common/SectionHeader"
import { EMPTY_ICONS, EmptyState } from "../components/common/EmptyState"
import { MetricCard } from "../components/common/MetricCard"
import { useNavigate } from "react-router-dom"

const METRICS = [
  { title: "Total Revenue", key: "revenue" },
  { title: "Total Orders", key: "orders" },
  { title: "Items Sold", key: "itemsSold" },
  { title: "Avg. Order Value", key: "aov" },
]

const CHARTS = [
  {
    title: "Revenue over time",
    icon: Activity,
    description: "Daily revenue trend for the selected period.",
  },
  {
    title: "Orders by hour",
    icon: BarChart3,
    description: "Peak sales hours across the week.",
  },
  {
    title: "Product performance",
    icon: Target,
    description: "Top products by revenue and volume.",
  },
  {
    title: "Weekday pattern",
    icon: Clock,
    description: "Sales distribution across weekdays vs weekends.",
  },
]

export default function PerformanceTracker() {
  const navigate = useNavigate()
  const [tab, setTab] = useState("overview")

  return (
    <div className="space-y-8 p-6 md:p-8 lg:p-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-ink tracking-tight">
            Performance Tracker
          </h1>
          <p className="mt-1 text-sm text-wood/60">
            Track how the cafÃ© performs against goals. Populated from imported
            sales data.
          </p>
        </div>
        <Button onClick={() => navigate("/upload-data")} variant="outline">
          Upload Sales Data
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {METRICS.map((m) => (
              <MetricCard
                key={m.key}
                title={m.title}
                value="â€”"
                subtitle="No sales data yet"
              />
            ))}
          </div>
          <p className="mt-4 text-xs text-wood/50 max-w-2xl">
            Metric cards remain empty until sales data is uploaded. No figures
            are invented.
          </p>
        </TabsContent>

        <TabsContent value="metrics" className="mt-6">
          <SectionHeader
            title="Metric definitions"
            description="Each metric is calculated from imported transaction lines in Phase 2."
          />
          <Card className="border-border">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-sm text-ink/80">Revenue</span>
                <span className="text-sm text-wood/50">Sum of line totals</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-sm text-ink/80">Orders</span>
                <span className="text-sm text-wood/50">Distinct transactions</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-sm text-ink/80">Items Sold</span>
                <span className="text-sm text-wood/50">Sum of quantities</span>
              </div>
              <div className="flex items-center justify-between pb-3">
                <span className="text-sm text-ink/80">Avg. Order Value</span>
                <span className="text-sm text-wood/50">Revenue Ã· orders</span>
              </div>
              <p className="text-xs text-wood/50 mt-2">
                Historical transaction prices (per line) are used, never the
                current catalogue price.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="mt-6">
          <SectionHeader
            title="Chart views"
            description="Recharts-powered charts. Placeholders render until data is available."
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {CHARTS.map((ch) => {
              const Icon = ch.icon
              return (
                <Card key={ch.title} className="border-border">
                  <CardContent className="p-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-cream/50 text-wood mb-3">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h3 className="font-serif font-semibold text-ink">
                      {ch.title}
                    </h3>
                    <p className="mt-2 text-xs text-wood/60 leading-relaxed">
                      {ch.description}
                    </p>
                    <div className="mt-6 h-28 w-full rounded-lg border border-dashed border-border bg-cream/30 flex items-center justify-center">
                      <EmptyState
                        icon={EMPTY_ICONS.activity}
                        title="No data"
                        description="Import sales data"
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}


