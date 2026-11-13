import { useEffect, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { Header } from "./Header"
import { Sidebar } from "./Sidebar"

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [location])

  const mainClass =
    "flex-1 h-full overflow-y-auto bg-paper" +
    (typeof window !== "undefined" && window.innerWidth >= 1024
      ? " lg:pl-64"
      : "")

  return (
    <div className="flex h-screen bg-paper">
      <Header onToggleMenu={() => setSidebarOpen((o) => !o)} />
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className={mainClass}>
        <Outlet />
      </main>
    </div>
  )
}
