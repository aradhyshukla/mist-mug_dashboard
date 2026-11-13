// Mist & Mug — Sales Dashboard
// Comparison bar chart: current period vs previous period.

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"

interface ComparisonChartProps {
  title: string
  currentValue: number
  previousValue: number
  currentLabel: string
  previousLabel: string
  valueFormatter?: (v: number) => string
  emptyMessage?: string
}

export function ComparisonChart({
  title,
  currentValue,
  previousValue,
  currentLabel = "Current",
  previousLabel = "Previous",
  valueFormatter = (v: number) => `₹${Math.round(v)}`,
  emptyMessage = "No data available for comparison.",
}: ComparisonChartProps) {
  const hasData = currentValue > 0 || previousValue > 0

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
              <BarChart
                data={[
                  { name: previousLabel, value: previousValue },
                  { name: currentLabel, value: currentValue },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#EADDC2" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#78928D" }}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#78928D" }}
                  axisLine={false}
                  tickFormatter={valueFormatter}
                />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  formatter={(value: unknown) =>
                    valueFormatter(typeof value === "number" ? value : 0)
                  }
                  labelFormatter={(label) => label}
                />
                <Legend />
                <Bar dataKey="value" fill="#6E422B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
