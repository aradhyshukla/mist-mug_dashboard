// Mist & Mug — Sales Dashboard
// Upload Data page: file import with validation preview and past uploads history.

import { useState, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Upload, CheckCircle2, AlertCircle, Loader2, Trash2 } from "lucide-react"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table"
import { ImportDialog } from "../components/import/ImportDialog"
import { db } from "../lib/db"
import type { UploadBatch } from "../types"
import { cn } from "../lib/utils"

export default function UploadData() {
  const navigate = useNavigate()
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  const [pastUploads, setPastUploads] = useState<UploadBatch[]>([])
  const [uploadsLoading, setUploadsLoading] = useState(true)

  const loadPastUploads = useCallback(async () => {
    setUploadsLoading(true)
    try {
      const rows = await db.uploadBatches
        .orderBy("uploadedAt")
        .reverse()
        .toArray()
      setPastUploads(rows)
    } finally {
      setUploadsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPastUploads()
  }, [loadPastUploads])

  const handleImportComplete = useCallback(() => {
    setImportDialogOpen(false)
    void loadPastUploads()
  }, [loadPastUploads])

  const handleRemoveBatch = async (batchId: string) => {
    if (
      !window.confirm(
        `Remove this upload batch? This will delete all transaction lines from this import. This cannot be undone.`
      )
    )
      return

    try {
      await db.transaction("rw", db.transactionLines, db.uploadBatches, async () => {
        await db.transactionLines.where("uploadBatchId").equals(batchId).delete()
        await db.uploadBatches.delete(batchId)
      })
      void loadPastUploads()
    } catch (err) {
      window.alert(
        `Failed to remove batch: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case "imported":
        return "bg-forest/10 text-forest"
      case "failed":
        return "bg-brick/10 text-brick"
      case "review":
        return "bg-wood/10 text-wood"
      case "pending":
        return "bg-wood/10 text-wood"
      default:
        return "bg-wood/10 text-wood"
    }
  }

  return (
    <div className="space-y-8 p-6 md:p-8 lg:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-ink tracking-tight">
            Upload Data
          </h1>
          <p className="mt-1 text-sm text-wood/60">
            Upload weekly sales files (CSV or Excel). Imported data powers
            Sales Analytics and Performance Tracker.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/overview")} variant="outline">
            Back to Overview
          </Button>
          <Button onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
            Import Weekly Sales
          </Button>
        </div>
      </div>

      {/* Import dialog */}
      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportComplete={handleImportComplete}
      />

      {/* Past Uploads */}
      <section>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-serif font-semibold text-ink tracking-tight">
              Past Uploads
            </h2>
            <p className="mt-1 text-sm text-wood/60">
              Import history with validation summaries.
            </p>
          </div>
        </div>
        <Card className="border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                      File
                    </TableHead>
                    <TableHead className="text-left px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                      Uploaded
                    </TableHead>
                    <TableHead className="text-left px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                      Period
                    </TableHead>
                    <TableHead className="text-center px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                      Accepted
                    </TableHead>
                    <TableHead className="text-center px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                      Rejected
                    </TableHead>
                    <TableHead className="text-center px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                      Duplicates
                    </TableHead>
                    <TableHead className="text-right px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                      Status
                    </TableHead>
                    <TableHead className="text-right px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploadsLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-wood" aria-hidden="true" />
                      </TableCell>
                    </TableRow>
                  ) : pastUploads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cream border border-border text-wood mb-3">
                            <Upload className="h-6 w-6" aria-hidden="true" />
                          </div>
                          <h3 className="mt-4 text-lg font-serif font-semibold text-ink">
                            No uploads yet
                          </h3>
                          <p className="mt-1 text-sm text-wood/70 max-w-xs">
                            Imported files will appear here with their status and record counts.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pastUploads.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell className="px-4 py-3 text-ink/80">
                          {batch.fileName}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-ink/80 text-sm">
                          {new Date(batch.uploadedAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-ink/80 text-sm">
                          {batch.reportingPeriodLabel || "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center text-ink/80 text-sm">
                          {batch.acceptedRows}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center text-ink/80 text-sm">
                          {batch.rejectedRows}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center text-ink/80 text-sm">
                          {batch.duplicateRows}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                              statusColor(batch.status)
                            )}
                          >
                            {batch.status === "imported" ? (
                              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                            ) : (
                              <AlertCircle className="h-3 w-3" aria-hidden="true" />
                            )}
                            {batch.status}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveBatch(batch.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      <p className="mt-2 text-xs text-wood/50 max-w-2xl">
        All imported records are stored locally in IndexedDB and persist across
        browser refreshes. Re-importing the same file will not double-count
        revenue — duplicate transaction lines are detected and skipped.
      </p>
    </div>
  )
}
