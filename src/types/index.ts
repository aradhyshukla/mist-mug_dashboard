// Mist & Mug — Sales Dashboard
// Shared TypeScript types for Phase 1.
//
// Note on pricing: the historical transaction price (per unit, at time of sale)
// is stored separately from the current catalog selling price. This keeps
// catalog edits from rewriting history.

export type ProductId = string & { readonly __brand: "ProductId" }
export type UploadBatchId = string & { readonly __brand: "UploadBatchId" }

export type ProductCategory = string

export interface Product {
  id: ProductId
  name: string
  category: ProductCategory
  sku?: string
  description?: string
  /** Current catalogue selling price in INR. Editable in the dashboard. */
  currentPrice: number
  imageUrl?: string
  isActive: boolean
  createdAt: string // ISO
  updatedAt: string // ISO
}

export interface ProductInput {
  name: string
  category: ProductCategory
  sku?: string
  description?: string
  currentPrice: number
  imageUrl?: string
}

export interface TransactionLine {
  lineId: string
  /** Product as known at time of sale (snapshot, not a live foreign key). */
  productId: ProductId
  productName: string
  category: ProductCategory
  quantity: number
  /** Historical unit price in INR at the time of sale. */
  unitPrice: number
  lineTotal: number
  /** ISO timestamp of the transaction. */
  occurredAt: string
}

export interface UploadBatch {
  id: UploadBatchId
  fileName: string
  fileSize: number
  uploadedAt: string // ISO
  status: "pending" | "imported" | "failed" | "review"
  reportingPeriodLabel?: string
  recordsParsed: number
  recordsImported: number
  validationIssues: ValidationIssue[]
}

export interface ValidationIssue {
  row: number
  field: string
  message: string
  severity: "error" | "warning"
}

export type ReportingPeriodType = "week" | "month" | "year" | "alltime"

export interface ReportingPeriod {
  id: string
  type: ReportingPeriodType
  label: string
  startDate: string // ISO
  endDate: string // ISO
}

export interface Settings {
  key: string
  value: string
  updatedAt: string
}

export interface DashboardMetrics {
  revenue: number // INR
  orders: number
  itemsSold: number
  averageOrderValue: number // INR
}

export interface PerformanceComparison {
  period: string
  revenue: number
  orders: number
  changePercent: number
}

export type UploadStatus = UploadBatch["status"]
