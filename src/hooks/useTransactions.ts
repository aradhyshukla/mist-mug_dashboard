// Mist & Mug — Sales Dashboard
// Hook for transaction line data access.

import { useCallback, useEffect, useState } from "react"
import { db } from "../lib/db"
import type { TransactionLine } from "../types"

export function useTransactions() {
  const [lines, setLines] = useState<TransactionLine[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const all = await db.transactionLines
        .orderBy("occurredAt")
        .reverse()
        .toArray()
      setLines(all)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const removeBatch = useCallback(async (batchId: string) => {
    await db.transactionLines.where("uploadBatchId").equals(batchId).delete()
    setLines((prev) => prev.filter((l) => l.uploadBatchId !== batchId))
  }, [])

  return { lines, loading, load, removeBatch }
}
