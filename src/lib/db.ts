import Dexie, { type Table } from "dexie"
import type {
  Product,
  TransactionLine,
  UploadBatch,
  Settings,
} from "../types"

/**
 * Mist & Mug — IndexedDB schema (Dexie).
 *
 * Version 1 (Phase 1):
 *   - products        : editable product catalogue (string ids, stable)
 *   - transactionLines: individual sale lines (historical unit price per line)
 *   - uploadBatches   : imported sales files + validation results
 *   - settings        : café preferences / theme / data management
 *
 * Version 2 (Phase 2):
 *   - transactionLines: added transactionId, sourceLineId, lineUid (composite id),
 *     uploadBatchId, date, hour, dayOfWeek for reporting queries
 *   - uploadBatches:   added acceptedRows, rejectedRows, duplicateRows,
 *     earliestTransactionDate, latestTransactionDate
 *
 * Phase 3 extension: add a new `version(3).stores({ ... })` block (and any
 * `upgrade` hooks) here so existing IndexedDB data migrates safely.
 */
export class MistMugDB extends Dexie {
  products!: Table<Product, string>
  transactionLines!: Table<TransactionLine, number>
  uploadBatches!: Table<UploadBatch, string>
  settings!: Table<Settings, string>

  constructor() {
    super("MistMugDB")

    this.version(1).stores({
      products: "id, name, category, isActive, updatedAt",
      transactionLines: "++id, productId, occurredAt",
      uploadBatches: "id, uploadedAt, status",
      settings: "key",
    })

    this.version(2).stores({
      products: "id, name, category, isActive, updatedAt",
      transactionLines:
        "++id, lineUid, transactionId, sourceLineId, productId, category, occurredAt, date, hour, dayOfWeek, uploadBatchId",
      uploadBatches:
        "id, uploadedAt, status, earliestTransactionDate, latestTransactionDate",
      settings: "key",
    })

    this.version(2).upgrade(async (transaction: any) => {
      // Migrate existing v1 transactionLines to v2 shape
      const txnLines = transaction.transactionLines
      const existingLines = await txnLines.toArray()
      for (const line of existingLines) {
        const occurredAt = line.occurredAt || ""
        const date = occurredAt ? occurredAt.slice(0, 10) : ""
        const hour = occurredAt ? new Date(occurredAt).getHours() : 0
        const dayOfWeek = occurredAt ? new Date(occurredAt).getDay() : 0
        const transactionId = (line.transactionId as string) || `txn_unknown_${line.id}`
        const sourceLineId = (line.sourceLineId as string) || `line_${line.id}`
        const lineUid = `${transactionId}|${sourceLineId}`
        await txnLines.update(line.id, {
          lineUid,
          transactionId,
          sourceLineId,
          date,
          hour,
          dayOfWeek,
          uploadBatchId: (line.uploadBatchId as string) || "",
        })
      }

      // Migrate existing v1 uploadBatches to v2 shape
      const batches = transaction.uploadBatches
      const existingBatches = await batches.toArray()
      for (const batch of existingBatches) {
        await batches.update(batch.id, {
          acceptedRows: batch.recordsImported ?? 0,
          rejectedRows: 0,
          duplicateRows: 0,
          earliestTransactionDate: undefined,
          latestTransactionDate: undefined,
        })
      }
    })
  }
}

// Singleton database instance
export const db = new MistMugDB()

// Default café settings seed keys
export const DEFAULT_SETTINGS: Record<string, string> = {
  cafeName: "Mist & Mug",
  cafeTagline: "Coffee tastes different above the clouds.",
  cafeLocation: "2,005 M · Mussoorie",
  currency: "INR",
  theme: "light", // reserved for future theming
}
