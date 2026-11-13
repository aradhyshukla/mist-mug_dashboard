// Mist & Mug — Sales Dashboard
// Import preview: validation results with confirm action.

import {
  CheckCircle2,
  Loader2,
} from "lucide-react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Separator } from "../ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"
import type { ImportPreview, RejectedRow, DuplicateRow } from "../../types"

interface ImportPreviewProps {
  preview: ImportPreview
  onConfirm: () => void
  onEditMapping: () => void
  onCancel: () => void
  confirming: boolean
}

export function ImportPreview({
  preview,
  onConfirm,
  onEditMapping,
  onCancel,
  confirming,
}: ImportPreviewProps) {
  const canConfirm = preview.acceptedRows > 0

  return (
    <Card className="border-border max-w-3xl">
      <CardHeader>
        <CardTitle>Import Preview</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-b border-border bg-cream/50">
          <div className="text-center">
            <div className="text-2xl font-serif font-semibold text-ink">
              {preview.totalRows}
            </div>
            <div className="text-xs text-wood/60 uppercase">Total Rows</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-serif font-semibold text-forest">
              {preview.acceptedRows}
            </div>
            <div className="text-xs text-forest/70 uppercase">Accepted</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-serif font-semibold text-brick">
              {preview.rejectedRows}
            </div>
            <div className="text-xs text-brick/70 uppercase">Rejected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-serif font-semibold text-wood">
              {preview.duplicateRows}
            </div>
            <div className="text-xs text-wood/70 uppercase">Duplicates</div>
          </div>
        </div>

        <Separator />

        {preview.rejected.length > 0 && (
          <div className="p-4">
            <h3 className="text-sm font-semibold text-brick mb-2">
              Rejected Rows ({preview.rejected.length})
            </h3>
            <div className="overflow-x-auto max-h-40 overflow-y-auto border border-border rounded mb-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left text-xs text-wood/70">Row</TableHead>
                    <TableHead className="text-left text-xs text-wood/70">Errors</TableHead>
                    <TableHead className="text-left text-xs text-wood/70">Item</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.rejected.map((r: RejectedRow) => (
                    <TableRow key={`${r.row}-rejected`}>
                      <TableCell className="text-xs text-ink/80">{r.row}</TableCell>
                      <TableCell className="text-xs text-brick/80">
                        {r.errors.join("; ")}
                      </TableCell>
                      <TableCell className="text-xs text-ink/60 truncate max-w-xs">
                        {r.data.itemName || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {preview.duplicates.length > 0 && (
          <div className="p-4">
            <h3 className="text-sm font-semibold text-wood mb-2">
              Duplicate Rows ({preview.duplicates.length})
            </h3>
            <p className="text-xs text-wood/60 mb-2">
              These lines already exist in the database and will be skipped.
            </p>
            <div className="overflow-x-auto max-h-40 overflow-y-auto border border-border rounded mb-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left text-xs text-wood/70">Row</TableHead>
                    <TableHead className="text-left text-xs text-wood/70">Transaction</TableHead>
                    <TableHead className="text-left text-xs text-wood/70">Item</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.duplicates.map((d: DuplicateRow) => (
                    <TableRow key={`${d.row}-duplicate`}>
                      <TableCell className="text-xs text-ink/80">{d.row}</TableCell>
                      <TableCell className="text-xs text-ink/60 truncate max-w-xs">
                        {d.data.transactionId || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-ink/60 truncate max-w-xs">
                        {d.data.itemName || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-border">
          <h3 className="text-sm font-semibold text-ink mb-2">
            Sample Records (first 10)
          </h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left text-xs text-wood/70">Row</TableHead>
                  <TableHead className="text-left text-xs text-wood/70">Transaction</TableHead>
                  <TableHead className="text-left text-xs text-wood/70">Item</TableHead>
                  <TableHead className="text-left text-xs text-wood/70">Date</TableHead>
                  <TableHead className="text-right text-xs text-wood/70">Qty</TableHead>
                  <TableHead className="text-right text-xs text-wood/70">Unit Price</TableHead>
                  <TableHead className="text-right text-xs text-wood/70">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.sampleRecords.map((r: any) => (
                  <TableRow key={r.row}>
                    <TableCell className="text-xs text-ink/80">{r.row}</TableCell>
                    <TableCell className="text-xs text-ink/60 truncate max-w-xs">
                      {r.transactionId || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-ink/60 truncate max-w-xs">
                      {r.itemName || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-ink/60">{r.date || "—"}</TableCell>
                    <TableCell className="text-right text-xs text-ink/60">
                      {r.quantity !== undefined ? r.quantity : "—"}
                    </TableCell>
                    <TableCell className="text-right text-xs text-ink/60">
                      {r.unitPrice !== undefined ? r.unitPrice.toFixed(2) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-xs text-ink/60">
                      {r.totalAmount !== undefined ? r.totalAmount.toFixed(2) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
      <div className="p-4 border-t border-border flex items-center justify-between bg-cream/30">
        <div className="flex items-center gap-3 text-xs text-wood/60">
          {confirming ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-forest" aria-hidden="true" />
          )}
          <span>
            {preview.acceptedRows} record{preview.acceptedRows !== 1 ? "s" : ""} ready to import
          </span>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onEditMapping} disabled={confirming}>
            Edit Mapping
          </Button>
          <Button variant="destructive" onClick={onCancel} disabled={confirming}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={onConfirm}
            disabled={!canConfirm || confirming}
          >
            {confirming ? "Importing…" : "Confirm Import"}
          </Button>
        </div>
      </div>
    </Card>
  )
}
