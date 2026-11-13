import { useState, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { Button } from "../components/ui/button"
import { Label } from "../components/ui/label"
import { Separator } from "../components/ui/separator"
import { Card, CardContent } from "../components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table"
import {
  EMPTY_ICONS,
  EmptyState,
} from "../components/common/EmptyState"
import { db } from "../lib/db"
import { cn } from "../lib/utils"
import type { UploadBatch } from "../types"

const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls"]

export default function UploadData() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null)
  }

  const isAccepted = (f: File | null) =>
    !!f &&
    ACCEPTED_EXTENSIONS.some((ext) => f.name.toLowerCase().endsWith(ext))

  const handleImport = async () => {
    if (!file) return
    if (!isAccepted(file)) {
      window.alert("Please upload a CSV or Excel file.")
      return
    }
    setSubmitting(true)
    // Short delay so the "unavailable" state is readable
    await new Promise((r) => setTimeout(r, 1200))
    setSubmitting(false)
    window.alert(
      "Importing is not yet available in Phase 1. The file was read locally but not persisted. File importing lands in Phase 2."
    )
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-8 p-6 md:p-8 lg:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-ink tracking-tight">
            Upload Data
          </h1>
          <p className="mt-1 text-sm text-wood/60">
            Upload weekly sales files (CSV or Excel). Importing is unavailable
            until Phase 2.
          </p>
        </div>
        <Button onClick={() => navigate("/overview")} variant="outline">
          Back to Overview
        </Button>
      </div>

      {/* Upload zone */}
      <Card className="border-border">
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors w-full max-w-md",
                dragActive
                  ? "bg-gold/10 border-gold"
                  : "bg-cream border-border hover:bg-gold/5"
              )}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-forest/10 text-forest mb-3">
                <Upload className="h-7 w-7" aria-hidden="true" />
              </div>
              <p className="font-serif font-semibold text-ink">
                {dragActive ? "Drop file here" : "Drop a sales file here"}
              </p>
              <p className="text-xs text-wood/60">
                CSV Â· XLSX Â· XLS
              </p>
              <Button
                onClick={() => document.getElementById("file-input")?.click()}
                variant="default"
              >
                Browse files
              </Button>
              <input
                id="file-input"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <Separator className="w-full" />

            <div className="w-full max-w-md space-y-1">
              <Label htmlFor="validation-summary">Validation summary</Label>
              <div
                id="validation-summary"
                className="rounded-lg border border-border bg-cream/50 p-3 text-sm"
              >
                {file ? (
                  <div className="space-y-2">
                    <p className="text-ink/80">
                      {isAccepted(file) ? "File accepted" : "Unsupported file type"}
                    </p>
                    <p className="text-xs text-wood/60">
                      {file.name} â€¢ {formatSize(file.size)} â€¢{" "}
                      {file.type || "unknown type"}
                    </p>
                    {!isAccepted(file) && (
                      <p className="text-xs text-brick">
                        Only .csv, .xlsx and .xls files can be imported.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-wood/50">
                    No file selected. Drag a CSV/Excel file onto the zone or browse.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                onClick={handleImport}
                disabled={!file || !isAccepted(file) || submitting}
                className="w-full sm:w-auto"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
                    Reading fileâ€¦
                  </>
                ) : (
                  "Import file"
                )}
              </Button>
              <Button
                onClick={() => setFile(null)}
                variant="outline"
                disabled={!file || submitting}
              >
                Clear
              </Button>
              <p className="text-xs text-wood/50">
                Importing is disabled until Phase 2.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Past Uploads */}
      <section>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-serif font-semibold text-ink tracking-tight">
              Past Uploads
            </h2>
            <p className="mt-1 text-sm text-wood/60">
              Import history appears here after files are processed.
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
                    <TableHead className="text-right px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                      Status
                    </TableHead>
                    <TableHead className="text-right px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                      Records
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploadsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-wood" aria-hidden="true" />
                      </TableCell>
                    </TableRow>
                  ) : pastUploads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <EmptyState
                          icon={EMPTY_ICONS.upload}
                          title="No uploads yet"
                          description="Uploaded files will appear here with their status and record counts."
                        />
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
                          {batch.reportingPeriodLabel || "â€”"}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                              batch.status === "imported"
                                ? "bg-forest/10 text-forest"
                                : batch.status === "failed"
                                ? "bg-brick/10 text-brick"
                                : "bg-wood/10 text-wood"
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
                        <TableCell className="px-4 py-3 text-right text-ink/80 text-sm">
                          {batch.recordsImported} / {batch.recordsParsed}
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
        Actual importing is unavailable in Phase 1. No file is persisted and no
        success messages are shown. Importing becomes functional in Phase 2.
      </p>
    </div>
  )
}


