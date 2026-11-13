import { useEffect, useState } from "react"
import { db, DEFAULT_SETTINGS } from "../lib/db"
import { STARTER_PRODUCTS } from "../lib/seed"
import type { Product } from "../types"

let initialized = false

export function useDatabase() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialized) {
      setReady(true)
      return
    }
    ;(async () => {
      try {
        await db.open()
        await seedIfEmpty()
        initialized = true
        setReady(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
    })()
  }, [])

  return { db, ready, error }
}

async function seedIfEmpty() {
  const productCount = await db.products.count()
  if (productCount === 0) {
    await db.products.bulkAdd(STARTER_PRODUCTS)
  }

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    const existing = await db.settings.get(key)
    if (!existing) {
      await db.settings.add({ key, value, updatedAt: new Date().toISOString() })
    }
  }
}

export type { Product }

