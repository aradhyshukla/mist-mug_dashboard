// Mist & Mug — Sales Dashboard
// Revenue by hour bar chart.

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import type { HourData } from "../../types"

interface HourlyChartProps {
  data: HourData[]
}

export function HourlyChart({ data }: HourlyChartProps) {
  const hasData = data.length > 0

  // Fill all 24 hours with zeros for missing hours
  const fullData = Array.from({ length: 24 }, (_, i) => {
    const existing = data.find((d) => d.hour === i)
    return {
      hour: i,
      label: `${i}:00`,
      revenue: existing?.revenue ?? 0,
      orders: existing?.orders ?? 0,
    }
  })

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg font-serif font-semibold text-ink">
          Peak Sales Hours
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-wood/60">No data for the selected period.</p>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fullData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EADDC2" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#78928D" }}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#78928D" }}
                  axisLine={false}
                  tickFormatter={(val) => `₹${Math.round(val)}`}
                />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  formatter={(value) => `₹${(value ?? 0).toLocaleString()}`}
                  labelFormatter={(label) => `${label}:00`}
                />
                <Bar dataKey="revenue" fill="#F0B35A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
