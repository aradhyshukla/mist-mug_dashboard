// Mist & Mug — Sales Dashboard
// Date and time utilities for Phase 2.
//
// All date handling is deterministic and explicit. We parse dates from
// multiple formats, handle Excel date serials, and always work with
// local dates (no timezone conversion) for reporting consistency.

import type { ReportingPeriodType } from "../types"

/** Parse a date string into a local Date object, or return null if invalid. */
export function parseDate(value: string | number | undefined): Date | null {
  if (value === undefined || value === null || value === "") return null

  // Excel date serial: number of days since 1899-12-30
  if (typeof value === "number") {
    return excelSerialToDate(value)
  }

  const str = String(value).trim()
  if (!str) return null

  // Try Excel serial date from string (e.g., "46328" from SheetJS String() conversion)
  const serialStrMatch = str.match(/^(\d{1,5}(\.\d+)?)$/)
  if (serialStrMatch) {
    const serial = Number(serialStrMatch[1])
    // Excel serial dates are positive integers typically in range 1 to 2958465
    if (serial >= 1 && serial <= 2958465 && Number.isInteger(serial)) {
      const date = excelSerialToDate(serial)
      if (date) return date
    }
  }

  // Try ISO format first (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    const [, y, m, d] = isoMatch
    const date = new Date(Number(y), Number(m) - 1, Number(d))
    if (isValidLocalDate(date)) return date
  }

  // Try common formats: DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY, etc.
  const slashMatch = str.match(/^(\d{1,2})[/](\d{1,2})[/](\d{4})$/)
  if (slashMatch) {
    const [, a, b, y] = slashMatch
    // Prefer DD/MM/YYYY (common in India/UK), fallback to MM/DD/YYYY
    const day = Number(a)
    const month = Number(b)
    const year = Number(y)
    if (day > 12 && month <= 12) {
      // Must be DD/MM
      const date = new Date(year, month - 1, day)
      if (isValidLocalDate(date)) return date
    }
    if (month > 12 && day <= 12) {
      // Must be MM/DD
      const date = new Date(year, day - 1, month)
      if (isValidLocalDate(date)) return date
    }
    // Ambiguous — try DD/MM first
    const date1 = new Date(year, month - 1, day)
    if (isValidLocalDate(date1)) return date1
    const date2 = new Date(year, day - 1, month)
    if (isValidLocalDate(date2)) return date2
    return null
  }

  const dashMatch = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (dashMatch) {
    const [, a, b, y] = dashMatch
    const day = Number(a)
    const month = Number(b)
    const year = Number(y)
    const date1 = new Date(year, month - 1, day)
    if (isValidLocalDate(date1)) return date1
    const date2 = new Date(year, day - 1, month)
    if (isValidLocalDate(date2)) return date2
    return null
  }

  // Fallback to native Date.parse
  const fallback = new Date(str)
  if (isValidLocalDate(fallback)) return fallback

  return null
}

/** Convert Excel serial date to a local Date. */
export function excelSerialToDate(serial: number): Date | null {
  // Excel epoch: 1899-12-30
  const excelEpoch = new Date(1899, 11, 30)
  const ms = excelEpoch.getTime() + serial * 24 * 60 * 60 * 1000
  const date = new Date(ms)
  if (isValidLocalDate(date)) return date
  return null
}

/** Check that a Date is valid and not the invalid date. */
function isValidLocalDate(date: Date): boolean {
  return !isNaN(date.getTime()) && date.getFullYear() >= 1900
}

/** Format a Date as YYYY-MM-DD (local date, no timezone shift). */
export function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Parse an ISO string (YYYY-MM-DD or full ISO) into YYYY-MM-DD local date. */
export function parseISOToDateString(iso: string): string | null {
  if (!iso) return null
  // Handle YYYY-MM-DD directly
  const simple = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (simple) return `${simple[1]}-${simple[2]}-${simple[3]}`
  // Handle full ISO: take the date part before T
  const datePart = iso.split("T")[0]
  if (datePart.match(/^\d{4}-\d{2}-\d{2}/)) return datePart
  return null
}

/** Combine a date string (YYYY-MM-DD) and time string (HH:mm or HH:mm:ss) into ISO. */
export function combineDateTime(
  dateStr: string | undefined,
  timeStr: string | undefined
): string | null {
  if (!dateStr) return null
  const datePart = parseISOToDateString(dateStr)
  if (!datePart) return null
  const timePart = timeStr ? String(timeStr).trim() : "00:00:00"
  return `${datePart}T${timePart}`
}

/** Get the start of week (Sunday) for a given date, as YYYY-MM-DD. */
export function getWeekStart(dateStr: string): string {
  const date = parseDate(dateStr)
  if (!date) return dateStr
  const day = date.getDay() // 0=Sunday
  const startMs = date.getTime() - day * 24 * 60 * 60 * 1000
  return formatDate(new Date(startMs))
}

/** Get the start of month for a given date, as YYYY-MM-DD. */
export function getMonthStart(dateStr: string): string {
  const date = parseDate(dateStr)
  if (!date) return dateStr
  return formatDate(new Date(date.getFullYear(), date.getMonth(), 1))
}

/** Get the end of month for a given date, as YYYY-MM-DD. */
export function getMonthEnd(dateStr: string): string {
  const date = parseDate(dateStr)
  if (!date) return dateStr
  return formatDate(
    new Date(date.getFullYear(), date.getMonth() + 1, 0)
  )
}

/** Get all weeks that intersect a given month. Returns array of {start, end, label}. */
export function getWeeksInMonth(year: number, month: number) {
  // month is 0-indexed
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const weekStart = getWeekStart(formatDate(firstDay))

  const weeks: Array<{ start: string; end: string; label: string }> = []
  let current = new Date(weekStart)
  const end = new Date(getWeekStart(formatDate(lastDay)))
  end.setDate(end.getDate() + 6) // end of that week

  while (current <= end) {
    // Only include the portion within the month
    const overlapStart = new Date(Math.max(current.getTime(), firstDay.getTime()))
    const overlapEnd = new Date(
      Math.min(current.getTime() + 6 * 24 * 60 * 60 * 1000, lastDay.getTime())
    )
    if (overlapStart <= overlapEnd) {
      weeks.push({
        start: formatDate(overlapStart),
        end: formatDate(overlapEnd),
        label: `Week of ${formatDate(current)}`,
      })
    }
    current.setDate(current.getDate() + 7)
  }
  return weeks
}

/** Get the ISO week number for a date. */
export function getWeekNumber(dateStr: string): number {
  const date = parseDate(dateStr)
  if (!date) return 0
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  )
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

/** Get all available years from a set of date strings. */
export function getAvailableYears(dateStrings: string[]): number[] {
  const years = new Set<number>()
  for (const ds of dateStrings) {
    const d = parseDate(ds)
    if (d) years.add(d.getFullYear())
  }
  return Array.from(years).sort((a, b) => a - b)
}

/** Check if a date is a weekend (Saturday=6, Sunday=0). */
export function isWeekend(dateStr: string): boolean {
  const date = parseDate(dateStr)
  if (!date) return false
  const day = date.getDay()
  return day === 0 || day === 6
}

/** Get all dates in a week (Monday start for reporting). */
export function getWeekDates(weekStart: string): string[] {
  const dates: string[] = []
  const start = parseDate(weekStart)
  if (!start) return dates
  for (let i = 0; i < 7; i++) {
    dates.push(formatDate(new Date(start.getTime() + i * 24 * 60 * 60 * 1000)))
  }
  return dates
}

/** Get month label (e.g., "January 2024"). */
export function getMonthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  })
}

/** Get day name (e.g., "Monday"). */
export function getDayName(dateStr: string): string {
  const date = parseDate(dateStr)
  if (!date) return ""
  return date.toLocaleString("en-US", { weekday: "long" })
}

/** Check if a date string is within a range [start, end] inclusive. */
export function isDateInRange(dateStr: string, start: string, end: string): boolean {
  return dateStr >= start && dateStr <= end
}

/** Generate reporting periods for the UI. */
export function generateReportingPeriods(
  type: ReportingPeriodType,
  dateStrings: string[]
): Array<{ id: string; label: string; startDate: string; endDate: string }> {
  const years = getAvailableYears(dateStrings)
  if (years.length === 0) return []

  const periods: Array<{
    id: string
    label: string
    startDate: string
    endDate: string
  }> = []

  // Pre-compute sorted valid dates for week and alltime modes
  const sortedDates = dateStrings
    .map((ds) => parseDate(ds))
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime())

  if (type === "year") {
    for (const y of years) {
      periods.push({
        id: `year_${y}`,
        label: String(y),
        startDate: `${y}-01-01`,
        endDate: `${y}-12-31`,
      })
    }
  } else if (type === "month") {
    for (const y of years) {
      for (let m = 0; m < 12; m++) {
        const start = `${y}-${String(m + 1).padStart(2, "0")}-01`
        const end = getMonthEnd(start)
        periods.push({
          id: `month_${y}_${m}`,
          label: getMonthLabel(y, m),
          startDate: start,
          endDate: end,
        })
      }
    }
  } else if (type === "week") {
    // Generate weeks for each year, but only show weeks that have data
    if (sortedDates.length === 0) return []

    const firstWeekStart = getWeekStart(formatDate(sortedDates[0]))
    const lastWeekStart = getWeekStart(formatDate(sortedDates[sortedDates.length - 1]))

    let current = new Date(firstWeekStart)
    const lastStart = new Date(lastWeekStart)

    while (current <= lastStart) {
      const ws = formatDate(current)
      const we = formatDate(
        new Date(current.getTime() + 6 * 24 * 60 * 60 * 1000)
      )
      periods.push({
        id: `week_${ws}`,
        label: `Week of ${ws}`,
        startDate: ws,
        endDate: we,
      })
      current.setDate(current.getDate() + 7)
    }
  } else if (type === "alltime") {
    const first = formatDate(sortedDates && sortedDates.length > 0 ? sortedDates[0] : new Date())
    const last = formatDate(
      sortedDates && sortedDates.length > 0
        ? sortedDates[sortedDates.length - 1]
        : new Date()
    )
    periods.push({
      id: "alltime",
      label: "All Time",
      startDate: first,
      endDate: last,
    })
  }

  return periods
}

/** Add N days to a date string (YYYY-MM-DD), return YYYY-MM-DD. */
export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr)
  if (!d) return dateStr
  return formatDate(new Date(d.getTime() + days * 24 * 60 * 60 * 1000))
}

/** Subtract N days from a date string (YYYY-MM-DD), return YYYY-MM-DD. */
export function subtractDays(dateStr: string, days: number): string {
  return addDays(dateStr, -days)
}

/**
 * Get the previous comparable period dates for a given period.
 * - Week: previous 7-day window ending the day before current start
 * - Month: same number of days, ending the day before current start
 * - Year: same number of days, ending the day before current start
 * - All Time: no previous period
 */
export function getPreviousPeriodDates(
  type: "week" | "month" | "year" | "alltime",
  startDate: string,
  endDate: string
): { startDate: string; endDate: string } | null {
  if (type === "alltime") return null

  const end = subtractDays(startDate, 1) // day before current period starts

  // Calculate the length of the current period in days
  const currentStart = new Date(startDate)
  const currentEnd = new Date(endDate)
  const periodDays =
    Math.round((currentEnd.getTime() - currentStart.getTime()) / (24 * 60 * 60 * 1000)) + 1

  const prevStart = subtractDays(end, periodDays - 1)

  return { startDate: prevStart, endDate: end }
}
