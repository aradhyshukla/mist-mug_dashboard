// Mist & Mug — Sales Dashboard
// Top-selling products bar chart.

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
import type { ProductPerformance } from "../../types"

interface TopProductsChartProps {
  data: ProductPerformance[]
  rankBy: "quantity" | "revenue"
  title?: string
}

export function TopProductsChart({
  data,
  rankBy,
  title = "Top-Selling Products",
}: TopProductsChartProps) {
  const hasData = data.length > 0
  const dataKey = rankBy === "quantity" ? "quantitySold" : "revenue"
  const valueFormatter = rankBy === "quantity"
    ? (val: number) => `${Math.round(val)} units`
    : (val: number) => `₹${Math.round(val)}`

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
            <p className="text-sm text-wood/60">No data for the selected period.</p>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EADDC2" />
                <XAxis
                  dataKey="productName"
                  tick={{ fontSize: 10, fill: "#78928D" }}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#78928D" }}
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
                <Bar dataKey={dataKey} fill="#F0B35A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
