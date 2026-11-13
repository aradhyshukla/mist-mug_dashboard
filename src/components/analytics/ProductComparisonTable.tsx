// Mist & Mug — Sales Dashboard
// Product comparison table: shows product-level changes between periods.

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import type { ProductComparison } from "../../lib/analytics"

interface ProductComparisonTableProps {
  data: ProductComparison[]
  title?: string
  emptyMessage?: string
}

const formatCurrency = (n: number) =>
  `₹${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

const getChangeIndicator = (
  changePercent: number | null
): { element: React.ReactNode; className: string } => {
  if (!changePercent) {
    return {
      element: <Minus className="h-3.5 w-3.5 text-wood" aria-hidden="true" />,
      className: "text-wood",
    }
  }
  if (changePercent > 0) {
    return {
      element: <ArrowUpRight className="h-3.5 w-3.5 text-forest" aria-hidden="true" />,
      className: "text-forest",
    }
  }
  return {
    element: <ArrowDownRight className="h-3.5 w-3.5 text-brick" aria-hidden="true" />,
    className: "text-brick",
  }
}

export function ProductComparisonTable({
  data,
  title = "Product Performance Changes",
  emptyMessage = "No product data available for comparison.",
}: ProductComparisonTableProps) {
  const hasData = data.length > 0

  // Sort by absolute revenue change descending
  const sorted = [...data].sort(
    (a, b) => Math.abs(b.revenueChange) - Math.abs(a.revenueChange)
  )

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg font-serif font-semibold text-ink">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-wood/60">{emptyMessage}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                    Product
                  </TableHead>
                  <TableHead className="text-left px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                    Category
                  </TableHead>
                  <TableHead className="text-right px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                    Current Revenue
                  </TableHead>
                  <TableHead className="text-right px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                    Previous Revenue
                  </TableHead>
                  <TableHead className="text-right px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                    Change
                  </TableHead>
                  <TableHead className="text-right px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                    % Change
                  </TableHead>
                  <TableHead className="text-right px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                    Current Qty
                  </TableHead>
                  <TableHead className="text-right px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                    Previous Qty
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((p) => {
                  const { element, className: pctClass } =
                    getChangeIndicator(p.revenueChangePercent)
                  return (
                    <TableRow key={p.productName}>
                      <TableCell className="px-4 py-3 text-ink/80 font-serif font-medium">
                        {p.productName}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-ink/80 text-sm">
                        {p.category}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right text-ink/80 text-sm font-serif">
                        {formatCurrency(p.currentRevenue)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right text-ink/80 text-sm font-serif">
                        {formatCurrency(p.previousRevenue)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right text-ink/80 text-sm font-serif">
                        {p.revenueChange >= 0 ? "+" : ""}{formatCurrency(p.revenueChange)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right text-sm font-semibold">
                        <div className="flex items-center gap-1">
                          {element}
                          <span className={pctClass}>
                            {p.revenueChangePercent !== null
                              ? (p.revenueChangePercent > 0 ? "+" : "") +
                                p.revenueChangePercent.toFixed(1) + "%"
                              : "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right text-ink/80 text-sm">
                        {p.currentQuantity}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right text-ink/80 text-sm">
                        {p.previousQuantity}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
