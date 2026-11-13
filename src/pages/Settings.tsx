import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Coffee, Palette, Database, CloudUpload } from "lucide-react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Separator } from "../components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { db } from "../lib/db"
import { DEFAULT_SETTINGS } from "../lib/db"
import type { Settings } from "../types"

const SETTING_KEYS = [
  { key: "cafeName", label: "CafÃ© name", icon: Coffee },
  { key: "cafeTagline", label: "Tagline", icon: null as any },
  { key: "cafeLocation", label: "Location", icon: null as any },
  { key: "currency", label: "Currency", icon: null as any },
] as const

export default function Settings() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    ;(async () => {
      const rows = await db.settings.toArray()
      const map: Record<string, string> = {}
      for (const row of rows) map[row.key] = row.value
      // Fall back to defaults for any missing keys
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
        // Restore defaults
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest/10 text-forest mx-auto mb-3">
            <CloudUpload className="h-5 w-5 animate-spin" aria-hidden="true" />
          </div>
          <p className="text-sm text-wood/60">Loading settingsâ€¦</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6 md:p-8 lg:p-10 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-ink tracking-tight">
            Settings
          </h1>
          <p className="mt-1 text-sm text-wood/60">
            CafÃ© preferences and data management. Stored locally in IndexedDB.
          </p>
        </div>
        <Button onClick={() => navigate("/overview")} variant="outline">
          Back to Overview
        </Button>
      </div>

      {/* CafÃ© preferences */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Coffee className="h-5 w-5 text-forest" aria-hidden="true" />
            <CardTitle className="text-lg font-serif font-semibold text-ink">CafÃ© preferences</CardTitle>
          </div>
          <CardDescription>
            Changes are saved to IndexedDB immediately.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          <form onSubmit={handleSave} className="space-y-4">
            {SETTING_KEYS.map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  value={settings[key] || ""}
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
                  âœ“ Saved
                </span>
              )}
              <Button type="submit" disabled={saving} className="w-auto">
                {saving ? "Savingâ€¦" : "Save preferences"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card className="border-border">
        <CardHeader className="flex items-center gap-2 pb-3">
          <Palette className="h-5 w-5 text-wood" aria-hidden="true" />
          <CardTitle className="text-lg font-serif font-semibold text-ink">
            Theme
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-3">
            <p className="text-sm text-ink/80">
              Colour scheme follows the Mist & Mug brand palette (forest, wood,
              coffee, gold, paper). A user-selectable theme toggle is reserved
              for a future phase.
            </p>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-cream/50">
              <span className="text-xs text-wood/60">Current theme</span>
              <span className="ml-auto text-xs font-semibold text-ink">
                Light (brand)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data management */}
      <Card className="border-border">
        <CardHeader className="flex items-center gap-2 pb-3">
          <Database className="h-5 w-5 text-brick" aria-hidden="true" />
          <CardTitle className="text-lg font-serif font-semibold text-ink">
            Data management
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-4">
            <p className="text-sm text-ink/80">
              All data lives in IndexedDB on this device. No external API or
              account is involved.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-lg border border-border bg-cream/50">
                <span className="text-xs text-wood/60 block">Products</span>
                <span className="text-xs font-semibold text-ink">
                  {settings.cafeName || "â€”"}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-cream/50">
                <span className="text-xs text-wood/60 block">Storage</span>
                <span className="text-xs font-semibold text-ink">
                  IndexedDB (local)
                </span>
              </div>
            </div>
            <Separator />
            <Button
              onClick={clearAllData}
              variant="destructive"
              className="w-full sm:w-auto"
            >
              Clear all local data
            </Button>
            <p className="mt-2 text-xs text-wood/50">
              Resets products, uploads and settings. Starter settings restored.
            </p>
          </div>
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-wood/50 max-w-2xl">
        Authentication, cloud sync and paid services are not part of this
        dashboard. Data never leaves your device.
      </p>
    </div>
  )
}


