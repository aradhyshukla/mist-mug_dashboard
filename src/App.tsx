import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Layout } from "./components/layout/Layout"
import Overview from "./pages/Overview"
import SalesAnalytics from "./pages/SalesAnalytics"
import UploadData from "./pages/UploadData"
import PerformanceTracker from "./pages/PerformanceTracker"
import Settings from "./pages/Settings"
import { Toaster } from "sonner"

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-paper text-ink">
        <Toaster
          position="bottom-right"
          richColors
          className="pointer-events-auto"
        />
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/overview" replace />} />
            <Route path="overview" element={<Overview />} />
            <Route path="sales-analytics" element={<SalesAnalytics />} />
            <Route path="upload-data" element={<UploadData />} />
            <Route path="performance-tracker" element={<PerformanceTracker />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  )
}



