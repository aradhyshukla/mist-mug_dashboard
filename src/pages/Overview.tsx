// Mist & Mug — Sales Dashboard
// Overview page: cafe identity, product catalogue, quick upload,
// recent activity, and live sales snapshot from imported data.

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Coffee,
  Plus,
  Upload,
} from "lucide-react"
import { Button } from "../components/ui/button"
import {
  Card,
  CardContent,
  CardTitle,
} from "../components/ui/card"
import { Input } from "../components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"
import { Separator } from "../components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog"
import { Label } from "../components/ui/label"
import { Textarea } from "../components/ui/textarea"
import { EmptyState } from "../components/common/EmptyState"
import { MetricCard } from "../components/common/MetricCard"
import { useProducts } from "../hooks/useProducts"
import { useDatabase } from "../hooks/useDatabase"
import { cn } from "../lib/utils"
import { db } from "../lib/db"
import type { Product, ProductId, ProductInput, UploadBatch } from "../types"
import { calculateMetrics } from "../lib/analytics"

const CATEGORIES = ["All", "Coffee", "Tea", "Bakery", "Snacks", "Cold Beverages"]

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-forest text-cream",
  Inactive: "bg-wood text-cream",
}

export default function Overview() {
  const navigate = useNavigate()
  const {
    products,
    loading,
    addProduct,
    updateProduct,
    deactivateProduct,
    activateProduct,
  } = useProducts()
  const { ready, error } = useDatabase()

  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [showInactive, setShowInactive] = useState(false)

  // Add/edit dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductInput>({
    name: "",
    category: "",
    sku: "",
    description: "",
    currentPrice: 0,
    imageUrl: "",
  })

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
    const matchesCategory =
      categoryFilter === "All" || p.category === categoryFilter
    const matchesStatus = showInactive || p.isActive
    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.category || form.currentPrice <= 0) return
    if (editingId) {
      await updateProduct(editingId as ProductId, {
        name: form.name,
        category: form.category,
        sku: form.sku,
        description: form.description,
        currentPrice: form.currentPrice,
        imageUrl: form.imageUrl,
      })
    } else {
      await addProduct(form)
    }
    setDialogOpen(false)
    setEditingId(null)
    setForm({
      name: "",
      category: "",
      sku: "",
      description: "",
      currentPrice: 0,
      imageUrl: "",
    })
  }

  const handleEdit = (product: Product) => {
    setEditingId(product.id)
    setForm({
      name: product.name,
      category: product.category,
      sku: product.sku || "",
      description: product.description || "",
      currentPrice: product.currentPrice,
      imageUrl: product.imageUrl || "",
    })
    setDialogOpen(true)
  }

  const handleToggleStatus = async (id: string, currentlyActive: boolean) => {
    if (currentlyActive) await deactivateProduct(id as unknown as ProductId)
    else await activateProduct(id as unknown as ProductId)
  }

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center">
        <EmptyState
          icon={Upload}
          title="Loading dashboard…"
          description={
            error ? `Unable to load: ${error}` : "Preparing Mist & Mug. Please wait."
          }
        />
      </div>
    )
  }

  // Load recent uploads and transaction lines for the snapshot
  const [recentUploads, setRecentUploads] = useState<UploadBatch[]>([])
  const [snapshotMetrics, setSnapshotMetrics] = useState<{
    revenue: number
    orders: number
    itemsSold: number
    averageOrderValue: number
  } | null>(null)

  const loadSnapshot = async () => {
    const batches = await db.uploadBatches
      .orderBy("uploadedAt")
      .reverse()
      .limit(5)
      .toArray()
    setRecentUploads(batches)

    const lines = await db.transactionLines.toArray()
    if (lines.length > 0) {
      const m = calculateMetrics(lines)
      setSnapshotMetrics({
        revenue: m.revenue,
        orders: m.orders,
        itemsSold: m.itemsSold,
        averageOrderValue: m.averageOrderValue,
      })
    } else {
      setSnapshotMetrics(null)
    }
  }

  // Load snapshot when data changes (simple approach - reload on mount)
  // In a full implementation, we'd use a pub/sub or React Query
  const [loaded, setLoaded] = useState(false)
  if (!loaded) {
    void loadSnapshot()
    setLoaded(true)
  }

  const formatCurrency = (n: number) =>
    `₹${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  return (
    <div className="space-y-8 p-6 md:p-8 lg:p-10 max-w-7xl mx-auto">
      {/* Cafe identity */}
      <section className="border-b border-border pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-forest">
              <Coffee className="h-5 w-5 fill-gold" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-semibold text-ink tracking-tight">
                Mist &amp; Mug
              </h1>
              <p className="text-sm text-wood/70 font-hand italic">
                Coffee tastes different above the clouds.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-ink/70">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-forest" aria-hidden="true" />
              <span>Open · 2,005 M · Mussoorie</span>
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm text-wood/60 max-w-2xl">
          Welcome back. Manage your product catalogue below, upload weekly
          sales files, and track performance across weeks, months and years.
          Prices shown are current catalogue prices in INR.
        </p>
      </section>

      {/* Quick Upload */}
      <section>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-serif font-semibold text-ink tracking-tight">
              Quick Upload
            </h2>
            <p className="mt-1 text-sm text-wood/60 max-w-md">
              Import a weekly sales file to begin tracking revenue.
            </p>
          </div>
          <Button
            onClick={() => navigate("/upload-data")}
            className="lg:ml-auto"
          >
            <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
            Upload Weekly Sales
          </Button>
        </div>
        <Card className="border-border">
          <CardContent className="p-8 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-forest/10 text-forest mb-4">
              <UploadIcon className="h-8 w-8" />
            </div>
            <CardTitle className="text-lg font-serif font-semibold text-ink">
              No sales data uploaded yet
            </CardTitle>
            <p className="mt-2 text-sm text-wood/60">
              Click the button above to go to the Upload Data page. Imported
              data powers Sales Analytics and Performance Tracker.
            </p>
            <Button
              onClick={() => navigate("/upload-data")}
              className="mt-6"
            >
              Go to Upload Data
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Product catalog */}
      <section>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-serif font-semibold text-ink tracking-tight">
              Product Catalogue
            </h2>
            <p className="mt-1 text-sm text-wood/60">
              {products.length === 0
                ? "Starter catalogue not yet loaded."
                : `${products.length} product${
                    products.length === 1 ? "" : "s"
                  } in catalogue.`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-56">
              <Search
                className="absolute left-3 top-3 h-4 w-4 text-wood/50"
                aria-hidden="true"
              />
              <Input
                placeholder="Search products…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => setShowInactive((s) => !s)}
              variant={showInactive ? "default" : "outline"}
              size="sm"
            >
              {showInactive ? "Hide inactive" : "Show inactive"}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-wood" aria-hidden="true" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Upload}
            title="No products match your filters"
            description={
              search || categoryFilter !== "All"
                ? "Try clearing your search or category filter."
                : "Add your first product to get started."
            }
            actionLabel="Add Product"
            onAction={() => {
              setEditingId(null)
              setForm({
                name: "",
                category: "",
                sku: "",
                description: "",
                currentPrice: 0,
                imageUrl: "",
              })
              setDialogOpen(true)
            }}
          />
        ) : (
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
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
              <tbody className="divide-y divide-border">
                {filtered.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-cream/30 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md border border-border flex items-center justify-center bg-cream">
                          <Coffee className="h-5 w-5 text-wood/60" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="font-serif font-medium text-ink">
                            {product.name}
                          </p>
                          {product.sku && (
                            <p className="text-xs text-wood/50">
                              {product.sku}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-ink/80">
                      {product.category}
                    </td>
                    <td className="px-4 py-4 text-right font-serif font-medium text-ink">
                      ₹{product.currentPrice.toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          STATUS_COLORS[
                            product.isActive ? "Active" : "Inactive"
                          ]
                        )}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-current"
                          aria-hidden="true"
                        />
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(product)}
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
                          {product.isActive ? (
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 text-xs text-wood/50">
          Deactivating a product hides it from the catalogue but keeps its
          record. Hard deletion is reserved for a future phase.
        </div>
      </section>

      {/* Recent activity */}
      <section>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-serif font-semibold text-ink tracking-tight">
              Recent Activity
            </h2>
            <p className="mt-1 text-sm text-wood/60">
              Latest uploads and imports.
            </p>
          </div>
        </div>
        {recentUploads.length === 0 ? (
          <EmptyState
            icon={Upload}
            title="No uploads yet"
            description={
              "Once you upload a sales file, its date, reporting period and status will appear here."
            }
            actionLabel="Upload Weekly Sales"
            onAction={() => navigate("/upload-data")}
          />
        ) : (
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-cream/50">
                  <th className="text-left px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                    File
                  </th>
                  <th className="text-left px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                    Uploaded
                  </th>
                  <th className="text-left px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                    Period
                  </th>
                  <th className="text-center px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                    Accepted
                  </th>
                  <th className="text-center px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                    Rejected
                  </th>
                  <th className="text-right px-4 py-3 text-wood/70 font-semibold uppercase text-xs">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentUploads.map((batch) => (
                  <tr key={batch.id}>
                    <td className="px-4 py-3 text-ink/80">
                      {batch.fileName}
                    </td>
                    <td className="px-4 py-3 text-ink/80 text-sm">
                      {new Date(batch.uploadedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-ink/80 text-sm">
                      {batch.reportingPeriodLabel || "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-ink/80 text-sm">
                      {batch.acceptedRows}
                    </td>
                    <td className="px-4 py-3 text-center text-ink/80 text-sm">
                      {batch.rejectedRows}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                          batch.status === "imported"
                            ? "bg-forest/10 text-forest"
                            : "bg-wood/10 text-wood"
                        )}
                      >
                        {batch.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Quick sales snapshot */}
      <section>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-serif font-semibold text-ink tracking-tight">
              Quick Sales Snapshot
            </h2>
            <p className="mt-1 text-sm text-wood/60">
              Live figures from imported sales data.
            </p>
          </div>
        </div>
        {snapshotMetrics ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Revenue"
              value={formatCurrency(snapshotMetrics.revenue)}
              subtitle="Total sales (INR)"
            />
            <MetricCard
              title="Orders"
              value={snapshotMetrics.orders.toLocaleString()}
              subtitle="Unique transactions"
            />
            <MetricCard
              title="Items Sold"
              value={snapshotMetrics.itemsSold.toLocaleString()}
              subtitle="Line items sold"
            />
            <MetricCard
              title="Avg. Order Value"
              value={formatCurrency(snapshotMetrics.averageOrderValue)}
              subtitle="INR per order"
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard title="Revenue" value="—" subtitle="Total sales (INR)" />
              <MetricCard title="Orders" value="—" subtitle="Number of orders" />
              <MetricCard title="Items Sold" value="—" subtitle="Line items sold" />
              <MetricCard title="Avg. Order Value" value="—" subtitle="INR per order" />
            </div>
            <p className="mt-3 text-xs text-wood/50">
              Values are intentionally empty until sales data is uploaded. No
              figures are invented.
            </p>
          </>
        )}
      </section>

      {/* Add/edit product dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Product" : "Add Product"}
            </DialogTitle>
            <DialogDescription>
              Current selling price is in INR. Historical transaction prices are
              tracked separately and are not changed here.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Himalayan Masala Chai"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. Tea"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label>Current price (INR)</Label>
                <Input
                  type="number"
                  value={form.currentPrice}
                  onChange={(e) =>
                    setForm({ ...form, currentPrice: Number(e.target.value) || 0 })
                  }
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Optional description"
              />
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://…"
              />
              <p className="text-xs text-wood/50">
                Optional. Leave blank to show a default placeholder.
              </p>
            </div>
            <Separator />
            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingId ? "Save changes" : "Add product"}
                <Plus className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
      />
    </svg>
  )
}
