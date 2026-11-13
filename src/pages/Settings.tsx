// Mist & Mug — Sales Dashboard
// Settings page: café profile, display, product management, data management.

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Coffee,
  Palette,
  Database,
  CloudUpload,
  Download,
  Save,
  Edit2,
  Trash2,
  Upload,
} from "lucide-react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Separator } from "../components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { db } from "../lib/db"
import { DEFAULT_SETTINGS } from "../lib/db"
import type { Product } from "../types"
import { useProducts } from "../hooks/useProducts"
import {
  exportTransactionsToCSV,
  exportProductsToCSV,
  exportUploadBatchesToCSV,
  downloadStringAsFile,
  importBackupFromJSON,
} from "../lib/analytics"

const SETTING_KEYS: Array<{
  key: string
  label: string
  placeholder: string
}> = [
  { key: "cafeName", label: "Café name", placeholder: "Mist & Mug" },
  { key: "cafeTagline", label: "Tagline / description", placeholder: "Coffee tastes different above the clouds." },
  { key: "cafeLocation", label: "Location", placeholder: "2,005 M · Mussoorie" },
  { key: "cafeContact", label: "Contact (phone/email)", placeholder: "" },
] as const

const DISPLAY_SETTINGS: Array<{
  key: string
  label: string
  options: Array<{ value: string; label: string }>
}> = [
  {
    key: "theme",
    label: "Theme",
    options: [
      { value: "light", label: "Light (brand)" },
      { value: "dark", label: "Dark" },
    ],
  },
  {
    key: "currencyFormat",
    label: "Currency formatting",
    options: [
      { value: "INR", label: "Indian Rupee (₹)" },
      { value: "USD", label: "US Dollar ($)" },
      { value: "EUR", label: "Euro (€)" },
    ],
  },
  {
    key: "dateFormat",
    label: "Date formatting",
    options: [
      { value: "DMY", label: "DD/MM/YYYY" },
      { value: "MDY", label: "MM/DD/YYYY" },
      { value: "ISO", label: "YYYY-MM-DD" },
    ],
  },
] as const

export default function Settings() {
  const navigate = useNavigate()
  const {
    products,
    loading: productsLoading,
    updateProduct,
  } = useProducts()

  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [editProductId, setEditProductId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{
    name: string
    category: string
    currentPrice: number
    isActive: boolean
  } | null>(null)

  useEffect(() => {
    ;(async () => {
      const rows = await db.settings.toArray()
      const map: Record<string, string> = {}
      for (const row of rows) map[row.key] = row.value
      for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
        if (!(k in map)) map[k] = v
      }
      setSettings(map)
      setLoading(false)
    })()
  }, [])

  const saveSetting = async (key: string, value: string) => {
    await db.settings.put({
      key,
      value,
      updatedAt: new Date().toISOString(),
    })
    setSettings((prev) => ({ ...prev, [key]: value }))
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      for (const [key, value] of Object.entries(settings)) {
        await saveSetting(key, value)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDisplaySave = async (key: string, value: string) => {
    await saveSetting(key, value)
  }

  const clearAllData = async () => {
    if (
      !window.confirm(
        "This will clear all products, transactions, uploads and settings from IndexedDB. This cannot be undone. Continue?"
      )
    )
      return
    try {
      await db.transaction("rw", db.products, db.transactionLines, db.uploadBatches, db.settings, async () => {
        await db.products.clear()
        await db.transactionLines.clear()
        await db.uploadBatches.clear()
        await db.settings.clear()
        for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
          await db.settings.add({ key: k, value: v, updatedAt: new Date().toISOString() })
        }
      })
      window.alert("All data cleared. Starter settings restored.")
      window.location.reload()
    } catch (err) {
      window.alert("Failed to clear data.")
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditProductId(product.id)
    setEditForm({
      name: product.name,
      category: product.category,
      currentPrice: product.currentPrice,
      isActive: product.isActive,
    })
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editProductId || !editForm) return
    try {
      await updateProduct(editProductId as any, {
        name: editForm.name.trim(),
        category: editForm.category.trim(),
        currentPrice: Number(editForm.currentPrice) || 0,
      })
      await db.products.update(editProductId, {
        isActive: editForm.isActive,
        updatedAt: new Date().toISOString(),
      })
      setEditProductId(null)
      setEditForm(null)
    } catch (err) {
      window.alert("Failed to save product.")
    }
  }

  const handleToggleStatus = async (id: string, currentlyActive: boolean) => {
    try {
      await db.products.update(id, {
        isActive: !currentlyActive,
        updatedAt: new Date().toISOString(),
      })
    } catch (err) {
      window.alert("Failed to update product status.")
    }
  }

  const handleCancelEdit = () => {
    setEditProductId(null)
    setEditForm(null)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest/10 text-forest mx-auto mb-3">
            <CloudUpload className="h-5 w-5 animate-spin" aria-hidden="true" />
          </div>
          <p className="text-sm text-wood/60">Loading settings…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6 md:p-8 lg:p-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-ink tracking-tight">
            Settings
          </h1>
          <p className="mt-1 text-sm text-wood/60">
            Café preferences, display options, product management and data
            management. Stored locally in IndexedDB.
          </p>
        </div>
        <Button onClick={() => navigate("/overview")} variant="outline">
          Back to Overview
        </Button>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-border">
        {["profile", "display", "products", "data"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? "border-forest text-forest"
                : "border-transparent text-wood/60 hover:text-wood hover:bg-cream/50"
            }`}
          >
            {tab === "profile" ? "Café Profile" : tab === "display" ? "Display" : tab === "products" ? "Product Management" : "Data Management"}
          </button>
        ))}
      </div>

      {/* Café Profile */}
      {activeTab === "profile" && (
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Coffee className="h-5 w-5 text-forest" aria-hidden="true" />
              <CardTitle className="text-lg font-serif font-semibold text-ink">Café Profile</CardTitle>
            </div>
            <CardDescription>
              Changes are saved to IndexedDB immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <form onSubmit={handleSave} className="space-y-4">
              {SETTING_KEYS.map(({ key, label, placeholder }) => (
                <div key={key} className="space-y-1">
                  <Label htmlFor={key}>{label}</Label>
                  <Input
                    id={key}
                    value={settings[key] || ""}
                    placeholder={placeholder}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    disabled={saving}
                  />
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between gap-3">
                {saved && (
                  <span className="text-xs text-forest font-semibold flex items-center gap-1">
                    ✓ Saved
                  </span>
                )}
                <Button type="submit" disabled={saving} className="w-auto">
                  {saving ? "Saving…" : "Save preferences"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Display */}
      {activeTab === "display" && (
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-wood" aria-hidden="true" />
              <CardTitle className="text-lg font-serif font-semibold text-ink">Display</CardTitle>
            </div>
            <CardDescription>
              Appearance and formatting preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="space-y-4">
              {DISPLAY_SETTINGS.map(({ key, label, options }) => (
                <div key={key} className="space-y-1">
                  <Label htmlFor={key}>{label}</Label>
                  <Input
                    id={key}
                    value={settings[key] || options[0].value}
                    onChange={(e) =>
                      handleDisplaySave(key, e.target.value)
                    }
                    disabled={saving}
                  />
                  <p className="text-xs text-wood/50">
                    Current: {settings[key] || options[0].value}
                  </p>
                </div>
              ))}
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-cream/50">
                <span className="text-xs text-wood/60">Currency symbol</span>
                <span className="ml-auto text-xs font-semibold text-ink">
                  {settings.currencyFormat === "INR" ? "₹" : settings.currencyFormat === "USD" ? "$" : "€"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Management */}
      {activeTab === "products" && (
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-wood" aria-hidden="true" />
              <CardTitle className="text-lg font-serif font-semibold text-ink">Product Management</CardTitle>
            </div>
            <CardDescription>
              Edit product names, categories, prices and availability.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {productsLoading ? (
              <div className="flex h-64 items-center justify-center">
                <p className="text-sm text-wood/60">Loading products…</p>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-wood/60">No products in catalogue.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm divide-y divide-border">
                  <thead>
                    <tr className="border-b border-border bg-cream/50">
                      <th className="text-left px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                        Product
                      </th>
                      <th className="text-left px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                        Category
                      </th>
                      <th className="text-right px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                        Price (INR)
                      </th>
                      <th className="text-left px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                        Status
                      </th>
                      <th className="text-right px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="hover:bg-cream/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-serif font-medium text-ink">
                            {product.name}
                          </p>
                          {product.sku && (
                            <p className="text-xs text-wood/50">
                              {product.sku}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-ink/80">
                          {product.category}
                        </td>
                        <td className="px-4 py-3 text-right text-ink/80 text-sm font-serif">
                          ₹{product.currentPrice.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              product.isActive
                                ? "bg-forest text-cream"
                                : "bg-wood text-cream"
                            }`}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full bg-current"
                              aria-hidden="true"
                            />
                            {product.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditProduct(product)}
                              className="h-8 px-2"
                            >
                              <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleToggleStatus(product.id, product.isActive)
                              }
                              className="h-8 px-2"
                            >
                              {product.isActive ? "Deactivate" : "Activate"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {editForm && editProductId && (
              <div className="mt-6 p-4 rounded-lg border border-border bg-cream/50">
                <h3 className="text-sm font-semibold text-ink mb-3">
                  Edit Product
                </h3>
                <form onSubmit={handleSaveProduct} className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Product name</Label>
                      <Input
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Category</Label>
                      <Input
                        value={editForm.category}
                        onChange={(e) =>
                          setEditForm({ ...editForm, category: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Current price (INR)</Label>
                    <Input
                      type="number"
                      value={editForm.currentPrice}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          currentPrice: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Availability</Label>
                    <select
                      value={editForm.isActive ? "active" : "inactive"}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          isActive: e.target.value === "active",
                        })
                      }
                      className="border border-border rounded-md px-3 py-2 text-sm text-ink bg-white"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                      Save changes
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Data Management */}
      {activeTab === "data" && (
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-brick" aria-hidden="true" />
              <CardTitle className="text-lg font-serif font-semibold text-ink">Data Management</CardTitle>
            </div>
            <CardDescription>
              Export, backup and reset your application data.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-6">
            <div className="space-y-4">
              <p className="text-sm text-ink/80">
                All data lives in IndexedDB on this device. No external API or
                account is involved.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-lg border border-border bg-cream/50">
                  <span className="text-xs text-wood/60 block">Products</span>
                  <span className="text-xs font-semibold text-ink">
                    {products.length}
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-border bg-cream/50">
                  <span className="text-xs text-wood/60 block">Storage</span>
                  <span className="text-xs font-semibold text-ink">
                    IndexedDB (local)
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-wood/70 uppercase tracking-wider">
                Export & Backup
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Button
                  onClick={async () => {
                    const lines = await db.transactionLines.toArray()
                    const csv = exportTransactionsToCSV(lines)
                    const now = new Date().toISOString().slice(0, 10)
                    downloadStringAsFile(
                      csv,
                      `mist-mug-sales-${now}.csv`
                    )
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                  Export Sales
                </Button>
                <Button
                  onClick={() => {
                    const csv = exportProductsToCSV(products)
                    const now = new Date().toISOString().slice(0, 10)
                    downloadStringAsFile(
                      csv,
                      `mist-mug-products-${now}.csv`
                    )
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                  Export Products
                </Button>
                <Button
                  onClick={async () => {
                    const batches = await db.uploadBatches.toArray()
                    const csv = exportUploadBatchesToCSV(batches)
                    const now = new Date().toISOString().slice(0, 10)
                    downloadStringAsFile(
                      csv,
                      `mist-mug-uploads-${now}.csv`
                    )
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                  Backup All
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-wood/70 uppercase tracking-wider">
                Restore from Backup
              </h3>
              <input
                type="file"
                accept=".json"
                id="backup-import"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const text = await file.text()
                  const backup = importBackupFromJSON(text)
                  if (!backup) {
                    window.alert("Invalid backup file.")
                    return
                  }
                  if (
                    !window.confirm(
                      "This will replace all current data with the backup. Continue?"
                    )
                  )
                    return
                  try {
                    await db.transaction("rw", db.products, db.transactionLines, db.uploadBatches, db.settings, async () => {
                      await db.products.clear()
                      await db.transactionLines.clear()
                      await db.uploadBatches.clear()
                      await db.settings.clear()
                      if (backup.products) {
                        await db.products.bulkAdd(backup.products)
                      }
                      if (backup.transactions) {
                        await db.transactionLines.bulkAdd(backup.transactions)
                      }
                      if (backup.uploads) {
                        await db.uploadBatches.bulkAdd(backup.uploads)
                      }
                      if (backup.settings) {
                        for (const s of backup.settings) {
                          await db.settings.put(s)
                        }
                      }
                    })
                    window.alert("Backup restored. Reloading…")
                    window.location.reload()
                  } catch (err) {
                    window.alert("Failed to restore backup.")
                  }
                }}
              />
              <Button
                onClick={() => document.getElementById("backup-import")?.click()}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
                Import Backup
              </Button>
              <p className="mt-2 text-xs text-wood/50">
                Restores products, transactions, uploads and settings from a
                previously exported backup file.
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-wood/70 uppercase tracking-wider">
                Reset
              </h3>
              <Button
                onClick={clearAllData}
                variant="destructive"
                className="w-full sm:w-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                Reset Database
              </Button>
              <p className="mt-2 text-xs text-wood/50">
                Resets products, uploads and settings. Starter settings restored.
              </p>
            </div>

            <Separator />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
