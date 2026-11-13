// Mist & Mug — Sales Dashboard
// Shared TypeScript types for Phase 1 & Phase 2.
//
// Note on pricing: the historical transaction price (per unit, at time of sale)
// is stored separately from the current catalogue selling price. This keeps
// catalogue edits from rewriting history.

export type ProductId = string & { readonly __brand: "ProductId" }
export type UploadBatchId = string & { readonly __brand: "UploadBatchId" }
export type TransactionId = string & { readonly __brand: "TransactionId" }

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

/** A single line within a transaction. One transaction may contain many lines. */
export interface TransactionLine {
  /** Auto-generated stable primary key. */
  id: number
  /** Stable composite identifier: transaction_id + source line id. */
  lineUid: string
  /** Transaction identifier (not unique by itself — multiple lines per txn). */
  transactionId: TransactionId
  /** Line identifier within the transaction (from source or generated). */
  sourceLineId: string
  /** Product as known at time of sale (snapshot, not a live foreign key). */
  productId: ProductId
  productName: string
  category: ProductCategory
  quantity: number
  /** Historical unit price in INR at the time of sale. */
  unitPrice: number
  /** Historical line total in INR (quantity × unit_price, or source value). */
  lineTotal: number
  /** ISO timestamp of the transaction (date + time). */
  occurredAt: string // ISO
  /** Date portion only (YYYY-MM-DD), derived for fast reporting queries. */
  date: string
  /** Hour of day (0-23), derived for peak-hours analytics. */
  hour: number
  /** Day of week (0=Sunday … 6=Saturday). */
  dayOfWeek: number
  /** Upload batch this line came from. */
  uploadBatchId: UploadBatchId
}

export interface TransactionLineInput {
  transactionId: string
  sourceLineId: string
  productName: string
  category: string
  quantity: number
  unitPrice: number
  lineTotal?: number
  occurredAt: string // ISO
  uploadBatchId: UploadBatchId
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
  acceptedRows: number
  rejectedRows: number
  duplicateRows: number
  earliestTransactionDate?: string // ISO
  latestTransactionDate?: string // ISO
  validationIssues: ValidationIssue[]
}

export interface ValidationIssue {
  row: number
  field: string
  message: string
  severity: "error" | "warning"
}

/** A raw row as read from the uploaded file, before any mapping. */
export interface RawRow {
  [column: string]: string | number | undefined
  _row: number
}

/** A row after column mapping, before validation. */
export interface MappedRow {
  transactionId?: string
  sourceLineId?: string
  date?: string
  time?: string
  itemName?: string
  category?: string
  quantity?: number
  unitPrice?: number
  totalAmount?: number
  _row: number
  _raw: RawRow
}

/** A row that passed validation and is ready to import. */
export interface ValidatedRow {
  transactionId: string
  sourceLineId: string
  productName: string
  category: string
  quantity: number
  unitPrice: number
  lineTotal: number
  occurredAt: string
  _row: number
}

/** Mapping from expected field to source column name. */
export interface ColumnMapping {
  transactionId: string | null
  sourceLineId: string | null
  date: string | null
  time: string | null
  itemName: string | null
  category: string | null
  quantity: string | null
  unitPrice: string | null
  totalAmount: string | null
}

/** Known column aliases for each expected field. */
export const COLUMN_ALIASES: Record<string, string[]> = {
  transactionId: [
    "transaction_id", "transactionid", "transaction id", "txn_id", "txnid",
    "order_id", "orderid", "order id",
  ],
  sourceLineId: [
    "line_id", "lineid", "line id", "item_id", "itemid", "item id",
    "row_id", "rowid", "row id",
  ],
  date: ["date", "transaction_date", "transactiondate", "transaction date"],
  time: ["time", "transaction_time", "transactiontime", "transaction time"],
  itemName: [
    "item_name", "itemname", "item name", "product_name", "productname",
    "product name", "product", "item",
  ],
  category: ["category", "item_category", "itemcategory", "item category"],
  quantity: ["quantity", "qty", "units", "items_sold", "itemssold"],
  unitPrice: [
    "unit_price", "unitprice", "unit price", "price", "unitcost",
  ],
  totalAmount: [
    "total_amount", "totalamount", "total amount", "sales_amount",
    "salesamount", "sales amount", "amount", "total",
  ],
} as const

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

/** Result of parsing + mapping + validation before confirmation. */
export interface ImportPreview {
  totalRows: number
  acceptedRows: number
  rejectedRows: number
  duplicateRows: number
  accepted: ValidatedRow[]
  rejected: RejectedRow[]
  duplicates: DuplicateRow[]
  columnMapping: ColumnMapping
  detectedHeaders: string[]
  sampleRecords: MappedRow[]
}

export interface RejectedRow {
  row: number
  data: MappedRow
  errors: string[]
}

export interface DuplicateRow {
  row: number
  data: MappedRow
  existingLineUid: string
  reason: string
}

/** Result of a confirmed import. */
export interface ImportResult {
  batchId: UploadBatchId
  accepted: number
  rejected: number
  duplicates: number
  totalRows: number
  status: "imported" | "failed" | "review"
}

/** Aggregated data for a single day. */
export interface DayData {
  date: string // YYYY-MM-DD
  revenue: number
  orders: number
  itemsSold: number
}

/** Aggregated data for a single hour. */
export interface HourData {
  hour: number // 0-23
  revenue: number
  orders: number
}

/** Aggregated data for a single product. */
export interface ProductPerformance {
  productName: string
  category: string
  revenue: number
  quantitySold: number
  orders: number
  averageSellingPrice: number
}

/** Aggregated data for a category. */
export interface CategoryPerformance {
  category: string
  revenue: number
  quantitySold: number
  orders: number
}

/** Weekday vs weekend comparison. */
export interface WeekdayWeekendComparison {
  weekdayRevenue: number
  weekendRevenue: number
  weekdayOrders: number
  weekendOrders: number
  weekdayDays: number
  weekendDays: number
  averageWeekdayRevenue: number
  averageWeekendRevenue: number
  orderVolumeDifference: number
  percentageDifference: number | null
  valid: boolean // true if both weekday and weekend have data
}

/** Dashboard KPI metrics. */
export interface DashboardMetrics {
  revenue: number // INR
  orders: number // unique transactions
  itemsSold: number
  averageOrderValue: number // INR
  transactionIdsReliable: boolean
}

/** Period-over-period comparison. */
export interface PerformanceComparison {
  period: string
  revenue: number
  orders: number
  itemsSold: number
  changePercent: number | null
  valid: boolean
}

export type UploadStatus = UploadBatch["status"]
