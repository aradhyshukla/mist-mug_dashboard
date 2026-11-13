// Mist & Mug — Sales Dashboard
// Weekday vs weekend comparison.

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
import type { WeekdayWeekendComparison } from "../../types"

interface WeekdayWeekendChartProps {
  data: WeekdayWeekendComparison
}

export function WeekdayWeekendChart({ data }: WeekdayWeekendChartProps) {
  const hasData = data.valid

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg font-serif font-semibold text-ink">
          Weekday vs Weekend
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-wood/60">
              Not enough data to compare weekdays and weekends.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-lg border border-border bg-cream/50">
                <p className="text-xs text-wood/60 uppercase font-semibold">
                  Weekday Revenue
                </p>
                <p className="text-xl font-serif font-semibold text-forest">
                  ₹{data.weekdayRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-wood/50 mt-1">
                  {data.weekdayDays} day{data.weekdayDays !== 1 ? "s" : ""} observed
                </p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-cream/50">
                <p className="text-xs text-wood/60 uppercase font-semibold">
                  Weekend Revenue
                </p>
                <p className="text-xl font-serif font-semibold text-wood">
                  ₹{data.weekendRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-wood/50 mt-1">
                  {data.weekendDays} day{data.weekendDays !== 1 ? "s" : ""} observed
                </p>
              </div>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: "Weekdays", revenue: data.weekdayRevenue, orders: data.weekdayOrders },
                  { name: "Weekends", revenue: data.weekendRevenue, orders: data.weekendOrders },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EADDC2" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#78928D" }}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#78928D" }}
                    axisLine={false}
                    tickFormatter={(val) => `₹${Math.round(val)}`}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    formatter={(value) => `₹${(value ?? 0).toLocaleString()}`}
                  />
                  <Bar dataKey="revenue" fill="#6E422B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {data.percentageDifference !== null && (
              <div className="mt-4 p-3 rounded-lg border border-border bg-cream/50">
                <p className="text-xs text-wood/60">
                  Average revenue per weekday:{" "}
                  <span className="text-forest font-semibold">
                    ₹{data.averageWeekdayRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>{" "}
                  vs per weekend day:{" "}
                  <span className="text-wood font-semibold">
                    ₹{data.averageWeekendRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </p>
                <p className="text-xs text-wood/60 mt-1">
                  Order volume difference:{data.orderVolumeDifference > 0 ? "+" : ""}{data.orderVolumeDifference}
                </p>
                <p className="text-xs text-wood/60 mt-1">
                  Percentage difference:{data.percentageDifference !== null
                    ? (data.percentageDifference > 0 ? "+" : "") +
                      data.percentageDifference.toFixed(1) + "%"
                    : "N/A"}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
