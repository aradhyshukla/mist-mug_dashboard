import Dexie, { type Table } from "dexie"
import type {
  Product,
  TransactionLine,
  UploadBatch,
  Settings,
} from "../types"

/**
 * Mist & Mug â€” IndexedDB schema (Dexie).
 *
 * Version 1 (Phase 1):
 *   - products        : editable product catalogue (string ids, stable)
 *   - transactionLines: individual sale lines (historical unit price per line)
 *   - uploadBatches   : imported sales files + validation results
 *   - settings        : cafÃ© preferences / theme / data management
 *
 * Phase 2 extension: add a new `version(2).stores({ ... })` block (and any
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
  }
}

// Singleton database instance
export const db = new MistMugDB()

// Default cafÃ© settings seed keys
export const DEFAULT_SETTINGS: Record<string, string> = {
  cafeName: "Mist & Mug",
  cafeTagline: "Coffee tastes different above the clouds.",
  cafeLocation: "2,005 M Â· Mussoorie",
  currency: "INR",
  theme: "light", // reserved for future theming
}

