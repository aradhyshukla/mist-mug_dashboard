// Mist & Mug — Sales Dashboard
// Column mapping UI for import preview.

import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import type { ColumnMapping } from "../../types"

const FIELD_LABELS: Record<string, string> = {
  transactionId: "Transaction ID",
  sourceLineId: "Line ID",
  date: "Date",
  time: "Time",
  itemName: "Item / Product Name",
  category: "Category",
  quantity: "Quantity",
  unitPrice: "Unit Price",
  totalAmount: "Total Amount",
}

interface ColumnMappingProps {
  mapping: ColumnMapping
  onMappingChange: (mapping: ColumnMapping) => void
}

export function ColumnMapping({
  mapping,
  onMappingChange,
}: ColumnMappingProps) {
  const fields: Array<keyof ColumnMapping> = [
    "transactionId",
    "sourceLineId",
    "date",
    "time",
    "itemName",
    "category",
    "quantity",
    "unitPrice",
    "totalAmount",
  ]

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Column Mapping</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-wood/60">
          Map each required field to a column in your file. Leave as "None" if
          the field is not present.
        </p>
        <div className="grid gap-3">
          {fields.map((field) => (
            <div key={field} className="flex items-center gap-3">
              <Label className="w-32 text-sm font-medium text-ink/80">
                {FIELD_LABELS[field]}
              </Label>
              <Input
                value={String(mapping[field] ?? "<none>")}
                onChange={(e) => {
                  const val = e.target.value
                  const next: ColumnMapping = { ...mapping }
                  next[field as keyof ColumnMapping] =
                    val === "<none>" ? null : val
                  onMappingChange(next)
                }}
                className="w-48"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
