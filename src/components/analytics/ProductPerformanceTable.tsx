// Mist & Mug — Sales Dashboard
// Product performance table.

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import type { ProductPerformance } from "../../types"

interface ProductPerformanceTableProps {
  data: ProductPerformance[]
  title?: string
}

export function ProductPerformanceTable({
  data,
  title = "Product Performance",
}: ProductPerformanceTableProps) {
  const hasData = data.length > 0

  const formatCurrency = (n: number) =>
    `₹${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

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
            <p className="text-sm text-wood/60">No data for the selected period.</p>
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
                    Revenue
                  </TableHead>
                  <TableHead className="text-right px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                    Qty Sold
                  </TableHead>
                  <TableHead className="text-right px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                    Orders
                  </TableHead>
                  <TableHead className="text-right px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                    Avg. Price
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((p) => (
                  <TableRow key={p.productName}>
                    <TableCell className="px-4 py-3 text-ink/80 font-serif font-medium">
                      {p.productName}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-ink/80 text-sm">
                      {p.category}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right text-ink/80 text-sm font-serif">
                      {formatCurrency(p.revenue)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right text-ink/80 text-sm">
                      {p.quantitySold}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right text-ink/80 text-sm">
                      {p.orders}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right text-ink/80 text-sm font-serif">
                      {formatCurrency(p.averageSellingPrice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
