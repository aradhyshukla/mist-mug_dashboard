// Mist & Mug — Sales Dashboard
// Import engine: CSV (Papa Parse) + XLSX (SheetJS) parsing, normalization,
// validation, duplicate detection, and preview generation.
//
// All calculations are deterministic. No AI, no silent data changes.

import Papa from "papaparse"
import * as XLSX from "xlsx"
import type {
  RawRow,
  MappedRow,
  ValidatedRow,
  ColumnMapping,
  ImportPreview,
  RejectedRow,
  DuplicateRow,
  UploadBatchId,
} from "../types"
import { COLUMN_ALIASES } from "../types"
import {
  parseDate,
  combineDateTime,
  parseISOToDateString,
} from "./date-utils"
import { db } from "./db"

// Expected canonical fields
const EXPECTED_FIELDS: Array<keyof ColumnMapping> = [
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

// Tolerance for quantity × unit_price vs total_amount check (2% or ₹2, whichever is greater)
const TOTAL_TOLERANCE = 0.02
const TOTAL_TOLERANCE_ABS = 2

/**
 * Read a file and return raw rows (array of objects keyed by header).
 * Returns { headers, rows } where rows have a _row property (1-based).
 */
export async function readFile(
  file: File
): Promise<{ headers: string[]; rows: RawRow[] }> {
  const ext = file.name.toLowerCase().split(".").pop() ?? ""

  if (ext === "csv") {
    return readCsv(file)
  }
  if (ext === "xlsx" || ext === "xls") {
    return readXlsx(file)
  }

  throw new Error(`Unsupported file type: .${ext}`)
}

/** Parse CSV with Papa Parse. */
function readCsv(file: File): Promise<{ headers: string[]; rows: RawRow[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (h: string) => h.trim(),
      complete: (result) => {
        const headers = result.meta.fields?.filter(Boolean) ?? []
        const rows = (result.data as RawRow[]).map((row, idx) => ({
          ...row,
          _row: idx + 2, // header is row 1, data starts at row 2
        }))
        resolve({ headers, rows })
      },
      error: (err) => reject(new Error(`CSV parse error: ${err.message}`)),
    })
  })
}

/** Parse XLSX with SheetJS. */
function readXlsx(file: File): Promise<{ headers: string[]; rows: RawRow[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer
        const workbook = XLSX.read(arrayBuffer, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          blankrows: false,
        }) as unknown[][]

        if (json.length === 0) {
          resolve({ headers: [], rows: [] })
          return
        }

        const headerRow = json[0] as (string | undefined)[]
        const headers = headerRow.map((h) => (h ?? "").toString().trim())

        const rows: RawRow[] = []
        for (let i = 1; i < json.length; i++) {
          const rowValues = json[i] as (string | number | undefined)[]
          const row: RawRow = { _row: i + 2 }
          for (let j = 0; j < headers.length; j++) {
            const colName = headers[j]
            if (colName) {
              row[colName] = rowValues[j]
            }
          }
          rows.push(row)
        }

        resolve({ headers, rows })
      } catch (err) {
        reject(
          new Error(
            `XLSX parse error: ${err instanceof Error ? err.message : String(err)}`
          )
        )
      }
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsArrayBuffer(file)
  })
}

/** Normalize a header name: lowercase, trim, replace spaces/underscores/dashes. */
function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/[_\s\-]+/g, "")
}

/**
 * Build a column mapping from detected headers using alias matching.
 */
export function buildColumnMapping(
  headers: string[]
): ColumnMapping {
  const mapping: ColumnMapping = {
    transactionId: null,
    sourceLineId: null,
    date: null,
    time: null,
    itemName: null,
    category: null,
    quantity: null,
    unitPrice: null,
    totalAmount: null,
  }

  const normalizedHeaders = headers.map((h) => normalizeHeader(h))

  for (const field of EXPECTED_FIELDS) {
    const aliases = COLUMN_ALIASES[field].map((a) => normalizeHeader(a))
    let bestMatch: string | null = null

    for (let i = 0; i < headers.length; i++) {
      const nh = normalizedHeaders[i]
      if (aliases.includes(nh)) {
        bestMatch = headers[i]
        break
      }
      for (const alias of aliases) {
        if (nh.includes(alias) || alias.includes(nh)) {
          bestMatch = headers[i]
          break
        }
      }
      if (bestMatch) break
    }

    mapping[field] = bestMatch
  }

  return mapping
}

/**
 * Apply a column mapping to raw rows, producing mapped rows.
 */
export function applyMapping(
  rows: RawRow[],
  mapping: ColumnMapping
): MappedRow[] {
  return rows.map((row) => {
    const mapped: MappedRow = {
      _row: row._row,
      _raw: row,
    }

    const get = (field: keyof ColumnMapping): string | undefined => {
      const col = mapping[field]
      if (!col) return undefined
      const val = row[col]
      return val === undefined || val === null ? undefined : String(val)
    }

    mapped.transactionId = get("transactionId")
    mapped.sourceLineId = get("sourceLineId")
    mapped.date = get("date")
    mapped.time = get("time")
    mapped.itemName = get("itemName")
    mapped.category = get("category")

    const qtyStr = get("quantity")
    mapped.quantity = qtyStr ? Number(qtyStr) : undefined

    const priceStr = get("unitPrice")
    mapped.unitPrice = priceStr ? Number(priceStr) : undefined

    const totalStr = get("totalAmount")
    mapped.totalAmount = totalStr ? Number(totalStr) : undefined

    return mapped
  })
}

/**
 * Validate a mapped row and produce a ValidatedRow or rejection reasons.
 */
export function validateMappedRow(
  row: MappedRow,
  existingLineUids: Set<string>
): {
  valid: boolean
  validated?: ValidatedRow
  errors: string[]
  isDuplicate: boolean
  existingLineUid?: string
} {
  const errors: string[] = []
  const _row = row._row

  // --- Required fields ---
  if (!row.transactionId || !row.transactionId.trim()) {
    errors.push("transaction_id is missing or empty")
  }
  if (!row.itemName || !row.itemName.trim()) {
    errors.push("item_name is missing or empty")
  }

  // --- Date parsing ---
  let occurredAt: string | null = null
  if (row.date) {
    const parsed = parseDate(row.date)
    if (!parsed) {
      errors.push(`Invalid date: ${row.date}`)
    } else {
      const timePart = row.time ? String(row.time).trim() : ""
      occurredAt = combineDateTime(row.date, timePart)
    }
  } else {
    errors.push("date is missing or empty")
  }

  // --- Numeric fields ---
  const quantity = row.quantity ?? undefined
  const unitPrice = row.unitPrice ?? undefined
  const totalAmount = row.totalAmount ?? undefined

  if (quantity === undefined || isNaN(quantity) || quantity <= 0) {
    errors.push("quantity must be a positive number")
  }
  if (unitPrice === undefined || isNaN(unitPrice) || unitPrice < 0) {
    errors.push("unit_price must be a non-negative number")
  }
  if (totalAmount !== undefined && (isNaN(totalAmount) || totalAmount < 0)) {
    errors.push("total_amount must be a non-negative number")
  }

  // --- Line identity ---
  const txnId = row.transactionId ? row.transactionId.trim() : ""
  const srcLineId = row.sourceLineId ? row.sourceLineId.trim() : `line_${_row}`
  const lineUid = `${txnId}|${srcLineId}`

  const isDuplicate = existingLineUids.has(lineUid)

  // --- Consistency check: quantity × unit_price vs total_amount ---
  if (
    quantity !== undefined &&
    !isNaN(quantity) &&
    quantity > 0 &&
    unitPrice !== undefined &&
    !isNaN(unitPrice)
  ) {
    const calculated = quantity * unitPrice
    if (totalAmount !== undefined && !isNaN(totalAmount)) {
      const diff = Math.abs(totalAmount - calculated)
      const tolerance = Math.max(TOTAL_TOLERANCE * calculated, TOTAL_TOLERANCE_ABS)
      if (diff > tolerance) {
        errors.push(
          `total_amount (${totalAmount}) does not match quantity × unit_price (${calculated.toFixed(2)})`
        )
      }
    }
  }

  // --- Calculate missing line total ---
  let lineTotal = 0
  if (totalAmount !== undefined && !isNaN(totalAmount)) {
    lineTotal = totalAmount
  } else if (
    quantity !== undefined &&
    !isNaN(quantity) &&
    unitPrice !== undefined &&
    !isNaN(unitPrice)
  ) {
    lineTotal = quantity * unitPrice
  } else {
    errors.push("Cannot calculate line total: missing quantity, unit_price, and total_amount")
  }

  const valid = errors.length === 0

  return {
    valid,
    ...(valid && occurredAt && {
      validated: {
        transactionId: txnId as TransactionId,
        sourceLineId: srcLineId,
        productName: row.itemName!.trim(),
        category: row.category ? row.category.trim() : "Uncategorised",
        quantity: quantity || 0,
        unitPrice: unitPrice || 0,
        lineTotal,
        occurredAt,
        _row,
      },
    }),
    errors,
    isDuplicate,
    existingLineUid: isDuplicate ? lineUid : undefined,
  }
}

/**
 * Run full validation on mapped rows against existing database lines.
 * Returns ImportPreview.
 */
export async function validateRows(
  mappedRows: MappedRow[],
  detectedHeaders: string[]
): Promise<ImportPreview> {
  // Get existing line UIDs from database for duplicate detection
  const existingLines = await db.transactionLines.toArray()
  const existingLineUids = new Set(
    existingLines.map((l) => l.lineUid as unknown as string)
  )

  const accepted: ValidatedRow[] = []
  const rejected: RejectedRow[] = []
  const duplicates: DuplicateRow[] = []

  for (const row of mappedRows) {
    const result = validateMappedRow(row, existingLineUids)

    if (result.isDuplicate) {
      duplicates.push({
        row: row._row,
        data: row,
        existingLineUid: result.existingLineUid || "unknown",
        reason: "Duplicate transaction line (same transaction_id + line_id)",
      })
      existingLineUids.add(result.existingLineUid || "unknown")
    } else if (result.valid && result.validated) {
      accepted.push(result.validated)
      existingLineUids.add(
        `${String(result.validated.transactionId)}|${result.validated.sourceLineId}`
      )
    } else {
      rejected.push({
        row: row._row,
        data: row,
        errors: result.errors,
      })
    }
  }

  return {
    totalRows: mappedRows.length,
    acceptedRows: accepted.length,
    rejectedRows: rejected.length,
    duplicateRows: duplicates.length,
    accepted,
    rejected,
    duplicates,
    columnMapping: {
      transactionId: null,
      sourceLineId: null,
      date: null,
      time: null,
      itemName: null,
      category: null,
      quantity: null,
      unitPrice: null,
      totalAmount: null,
    },
    detectedHeaders,
    sampleRecords: mappedRows.slice(0, 10),
  }
}

/**
 * Execute a confirmed import atomically.
 * Saves valid rows and batch metadata. All-or-nothing.
 */
export async function executeImport(
  batchId: UploadBatchId,
  fileName: string,
  fileSize: number,
  accepted: ValidatedRow[],
  rejected: RejectedRow[],
  duplicates: DuplicateRow[]
): Promise<ImportResult> {
  const now = new Date().toISOString()

  // Build transaction line records for DB
  const lineRecords: any[] = accepted.map((v) => {
    const date = parseISOToDateString(v.occurredAt) || ""
    const d = parseDate(v.occurredAt)
    const hour = d ? d.getHours() : 0
    const dayOfWeek = d ? d.getDay() : 0
    return {
      lineUid: `${v.transactionId}|${v.sourceLineId}`,
      transactionId: v.transactionId as unknown as TransactionId,
      sourceLineId: v.sourceLineId,
      productId: "" as unknown as ProductId,
      productName: v.productName,
      category: v.category,
      quantity: v.quantity,
      unitPrice: v.unitPrice,
      lineTotal: v.lineTotal,
      occurredAt: v.occurredAt,
      date,
      hour,
      dayOfWeek,
      uploadBatchId: batchId,
    }
  })

  // Determine date range
  const dates = accepted
    .map((a) => parseISOToDateString(a.occurredAt))
    .filter((d): d is string => d !== null)
    .sort()
  const earliest = dates.length > 0 ? dates[0] : undefined
  const latest = dates.length > 0 ? dates[dates.length - 1] : undefined

  // Validation issues from rejected rows
  const validationIssues: ValidationIssue[] = []
  for (const r of rejected) {
    for (const err of r.errors) {
      validationIssues.push({
        row: r.row,
        field: "row",
        message: err,
        severity: "error",
      })
    }
  }

  const batch: UploadBatch = {
    id: batchId,
    fileName,
    fileSize,
    uploadedAt: now,
    status: rejected.length > 0 ? "review" : "imported",
    reportingPeriodLabel: earliest && latest ? `${earliest} to ${latest}` : undefined,
    recordsParsed: accepted.length + rejected.length + duplicates.length,
    recordsImported: accepted.length,
    acceptedRows: accepted.length,
    rejectedRows: rejected.length,
    duplicateRows: duplicates.length,
    earliestTransactionDate: earliest,
    latestTransactionDate: latest,
    validationIssues,
  }

  // Atomic write: all lines + batch in one transaction
  await db.transaction("rw", db.transactionLines, db.uploadBatches, async () => {
    if (lineRecords.length > 0) {
      await db.transactionLines.bulkAdd(lineRecords as any)
    }
    await db.uploadBatches.put(batch as any)
  })

  return {
    batchId,
    accepted: accepted.length,
    rejected: rejected.length,
    duplicates: duplicates.length,
    totalRows: accepted.length + rejected.length + duplicates.length,
    status: batch.status as ImportResult["status"],
  }
}

/**
 * Generate a stable batch ID from filename and timestamp.
 */
export function generateBatchId(fileName: string): UploadBatchId {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_")
  return `batch_${Date.now()}_${safe}` as UploadBatchId
}

/**
 * Get all unique line UIDs currently in the database (for duplicate detection).
 */
export async function getExistingLineUids(): Promise<Set<string>> {
  const lines = await db.transactionLines.toArray()
  return new Set(lines.map((l) => l.lineUid as unknown as string))
}

// Type imports needed for the file (imported at bottom to avoid circular issues)
import type {
  UploadBatch,
  ValidationIssue,
  ImportResult,
  TransactionId,
  ProductId,
} from "../types"
