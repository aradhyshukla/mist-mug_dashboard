# Mist & Mug — Sales Dashboard (Phase 1)

A premium, responsive, data-driven café management dashboard built as a completely separate application (not embedded in or linked to the customer-facing website at mist-and-mug.onrender.com).

## Tech stack
- React + TypeScript, Vite
- Tailwind CSS + shadcn/ui
- Recharts, Lucide icons
- IndexedDB via Dexie (persistent local storage, no external API)
- React Router
- Sonner toasts

## Branding
Visual identity reproduced from the reference café site: the Mist & Mug color palette (forest `#142E25`, wood `#6E422B`, coffee `#2A1812`, gold `#F0B35A`, paper `#F3E8D3`, cream `#FBF4E6`, brick `#A6533F`), Fraunces/Inter/Caveat typography, warm café atmosphere, button styling, and spacing — applied to an original dashboard design language (not the customer-facing navigation/content).

## Navigation (5 sections)
1. Overview — café identity, editable product catalogue, quick upload, recent activity, quick sales snapshot
2. Sales Analytics — Week / Month / Year / All Time period selector + empty-state chart placeholders
3. Upload Data — file drop zone, browse, validation summary, past uploads table (importing labelled unavailable until Phase 2)
4. Performance Tracker — empty metric cards + chart placeholders
5. Settings — café preferences, theme, data management

## Data
- TypeScript types: `Product`, `TransactionLine`, `UploadBatch`, `ValidationIssue`, `ReportingPeriod`, `DashboardMetrics`, `PerformanceComparison`
- Historical transaction price kept separate from current catalogue price
- Dexie IndexedDB schema v1 with migration hooks ready for Phase 2
- Clearly-labelled fictional starter catalogue (12 products) used only until real data is imported
- Products have stable IDs; add / edit / deactivate persists after refresh

## Non-negotiable rules honoured
- No AI Insights section
- No AI-generated recommendations
- No investor PPT
- No connection to the customer website
- No invented sales figures (meaningful empty states instead)
- No unfinished features claimed as functional

## Scripts
- `npm run dev` — start dev server
- `npm run build` — TypeScript check + production build

## Phase 2 (reserved)
- Real sales file import engine (CSV/Excel)
- Analytical calculations & populated charts (revenue trends, top products, peak hours, weekday/weekend, product performance, breakdowns)
- Hard delete, user-selectable theme, cloud sync, authentication