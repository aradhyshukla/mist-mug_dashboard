// Mist & Mug — Sales Dashboard
// Revenue trend line chart.

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import type { DayData } from "../../types"

interface RevenueTrendChartProps {
  data: DayData[]
  title?: string
  emptyMessage?: string
}

export function RevenueTrendChart({
  data,
  title = "Revenue Trend",
  emptyMessage = "No data for the selected period.",
}: RevenueTrendChartProps) {
  const hasData = data.length > 0

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg font-serif font-semibold text-ink">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-wood/60">{emptyMessage}</p>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EADDC2" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#78928D" }}
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
                  labelFormatter={(label) => label}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6E422B"
                  strokeWidth={2}
                  dot={{ fill: "#F0B35A", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: "#F0B35A" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
