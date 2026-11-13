// Mist & Mug — Sales Dashboard
// Import dialog: full flow from file selection to confirmed import.

import { useState, useCallback } from "react"
import { Loader2, CheckCircle2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Button } from "../ui/button"
import { Separator } from "../ui/separator"
import { FileDropZone } from "./FileDropZone"
import { ColumnMapping } from "./ColumnMapping"
import { ImportPreview } from "./ImportPreview"
import type { ColumnMapping as ColumnMappingType, ImportPreview as ImportPreviewType } from "../../types"
import {
  readFile,
  buildColumnMapping,
  applyMapping,
  validateRows,
  executeImport,
  generateBatchId,
} from "../../lib/import"

type ImportStep = "file" | "mapping" | "preview" | "importing" | "done"

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete?: () => void
}

export function ImportDialog({
  open,
  onOpenChange,
  onImportComplete,
}: ImportDialogProps) {
  const [step, setStep] = useState<ImportStep>("file")
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<any[]>([])
  const [mapping, setMapping] = useState<ColumnMappingType>({
    transactionId: null,
    sourceLineId: null,
    date: null,
    time: null,
    itemName: null,
    category: null,
    quantity: null,
    unitPrice: null,
    totalAmount: null,
  })
  const [preview, setPreview] = useState<ImportPreviewType | null>(null)
  const [confirming, setConfirming] = useState(false)

  const handleFileSelected = useCallback(async (selectedFile: File) => {
    setFile(selectedFile)
    try {
      const { headers: h, rows } = await readFile(selectedFile)
      setHeaders(h)
      setRawRows(rows)
      setMapping(buildColumnMapping(h))
      setStep("mapping")
    } catch (err) {
      window.alert(
        `Failed to read file: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }, [])

  const handleMappingChange = useCallback((next: ColumnMappingType) => {
    setMapping(next)
  }, [])

  const handleGeneratePreview = useCallback(async () => {
    const mapped = applyMapping(rawRows, mapping)
    const prev = await validateRows(mapped, headers)
    setPreview(prev)
    setStep("preview")
  }, [rawRows, mapping, headers])

  const handleConfirm = useCallback(async () => {
    if (!preview || !file) return
    setConfirming(true)
    try {
      const batchId = generateBatchId(file.name)
      await executeImport(
        batchId,
        file.name,
        file.size,
        preview.accepted,
        preview.rejected,
        preview.duplicates
      )
      setStep("done")
      setConfirming(false)
      onImportComplete?.()
    } catch (err) {
      setConfirming(false)
      window.alert(
        `Import failed: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }, [preview, file, onImportComplete])

  const handleRestart = () => {
    setFile(null)
    setHeaders([])
    setRawRows([])
    setMapping({
      transactionId: null,
      sourceLineId: null,
      date: null,
      time: null,
      itemName: null,
      category: null,
      quantity: null,
      unitPrice: null,
      totalAmount: null,
    })
    setPreview(null)
    setConfirming(false)
    setStep("file")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === "done"
              ? "Import Complete"
              : step === "importing"
              ? "Importing…"
              : "Import Sales Data"}
          </DialogTitle>
          <DialogDescription>
            {step === "done"
              ? "Your sales data has been imported successfully."
              : step === "file"
              ? "Upload a weekly sales file (CSV or Excel) to begin."
              : step === "mapping"
              ? "Map your file columns to the required fields."
              : step === "preview"
              ? "Review validation results before importing."
              : "Please wait while your data is imported."}
          </DialogDescription>
        </DialogHeader>

        {step === "file" && (
          <FileDropZone
            acceptedExtensions={["csv", "xlsx", "xls"]}
            onFileSelected={handleFileSelected}
          />
        )}

        {step === "mapping" && (
          <>
            <Separator className="my-4" />
            <ColumnMapping
              mapping={mapping}
              onMappingChange={handleMappingChange}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleRestart}>
                Start Over
              </Button>
              <Button onClick={handleGeneratePreview}>
                Continue to Preview
              </Button>
            </div>
          </>
        )}

        {step === "preview" && preview && (
          <>
            <Separator className="my-4" />
            <ImportPreview
              preview={preview}
              onConfirm={handleConfirm}
              onEditMapping={() => setStep("mapping")}
              onCancel={handleRestart}
              confirming={confirming}
            />
          </>
        )}

        {step === "importing" && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-forest mb-4" aria-hidden="true" />
            <p className="text-wood/70">Importing your data…</p>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-forest mb-4" aria-hidden="true" />
            <h3 className="font-serif font-semibold text-ink">Import Complete</h3>
            <p className="mt-1 text-sm text-wood/60">
              {preview?.acceptedRows} record{preview?.acceptedRows !== 1 ? "s" : ""} imported.
            </p>
            <div className="flex justify-end gap-3 pt-6">
              <Button variant="outline" onClick={handleRestart}>
                Import Another
              </Button>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
