import { useCallback, useEffect, useState } from "react"
import { db } from "../lib/db"
import type { Product, ProductInput, ProductId } from "../types"

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const all = await db.products.orderBy("updatedAt").reverse().toArray()
      setProducts(all)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const addProduct = useCallback(async (input: ProductInput): Promise<Product> => {
    const now = new Date().toISOString()
    const id: ProductId = `prod_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 7)}` as ProductId
    const product: Product = {
      id,
      name: input.name.trim(),
      category: input.category.trim(),
      sku: input.sku?.trim() || undefined,
      description: input.description?.trim() || undefined,
      currentPrice: Number(input.currentPrice) || 0,
      imageUrl: input.imageUrl?.trim() || undefined,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }
    await db.products.add(product)
    setProducts((prev) => [product, ...prev])
    return product
  }, [])

  const updateProduct = useCallback(
    async (id: ProductId, input: Partial<ProductInput>) => {
      const now = new Date().toISOString()
      await db.products.update(id, {
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.category !== undefined && { category: input.category.trim() }),
        ...(input.sku !== undefined && { sku: input.sku.trim() || undefined }),
        ...(input.description !== undefined && {
          description: input.description.trim() || undefined,
        }),
        ...(input.currentPrice !== undefined && {
          currentPrice: Number(input.currentPrice),
        }),
        ...(input.imageUrl !== undefined && {
          imageUrl: input.imageUrl.trim() || undefined,
        }),
        updatedAt: now,
      })
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, ...input, updatedAt: now } : p
        )
      )
    },
    []
  )

  const deactivateProduct = useCallback(async (id: ProductId) => {
    await db.products.update(id, { isActive: false, updatedAt: new Date().toISOString() })
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: false } : p))
    )
  }, [])

  const activateProduct = useCallback(async (id: ProductId) => {
    await db.products.update(id, { isActive: true, updatedAt: new Date().toISOString() })
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: true } : p))
    )
  }, [])

  const deleteProduct = useCallback(async (id: ProductId) => {
    await db.products.delete(id)
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const getProduct = useCallback(
    async (id: ProductId): Promise<Product | undefined> => {
      return db.products.get(id)
    },
    []
  )

  return {
    products,
    loading,
    load,
    addProduct,
    updateProduct,
    deactivateProduct,
    activateProduct,
    deleteProduct,
    getProduct,
  }
}

