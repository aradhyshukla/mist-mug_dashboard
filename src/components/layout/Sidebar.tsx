import { NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  BarChart3,
  Upload,
  Activity,
  Settings,
  Menu,
  Coffee,
} from "lucide-react"
import { cn } from "../../lib/utils"

type NavItem = {
  to: string
  label: string
  icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { to: "/overview", label: "Overview", icon: LayoutDashboard },
  { to: "/sales-analytics", label: "Sales Analytics", icon: BarChart3 },
  { to: "/upload-data", label: "Upload Data", icon: Upload },
  { to: "/performance-tracker", label: "Performance Tracker", icon: Activity },
  { to: "/settings", label: "Settings", icon: Settings },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Backdrop (mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-64 border-r border-border bg-forest text-cream transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:relative lg:translate-x-0 lg:static lg:w-64 lg:shadow-none"
        )}
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 px-6 py-6 border-b border-border">
            <Coffee className="h-6 w-6 fill-gold" aria-hidden="true" />
            <span className="font-serif font-semibold text-xl tracking-tight">
              Mist &amp; Mug
            </span>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive: active }) =>
                    cn(
                      "flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-gold text-coffee font-semibold shadow-sm"
                        : "text-paper hover:bg-wood/30 hover:text-gold"
                    )
                  }
                  onClick={onClose}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="text-xs text-paper/60 leading-relaxed">
              Phase 2 · Sales import &amp; analytics engine
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

/* Mobile top-bar toggle (rendered by Header) */
export function MobileMenuToggle({ onToggle }: { onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="inline-flex items-center justify-center p-2 text-gold border border-gold/50 rounded-md hover:bg-gold/10 lg:hidden"
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}

