# Mist & Mug — Sales Dashboard

A premium, responsive, data-driven café management dashboard built as a completely separate application (not embedded in or linked to the customer-facing website at mist-and-mug.onrender.com).

## Tech stack
- React + TypeScript, Vite
- Tailwind CSS + shadcn/ui
- Recharts, Lucide icons
- IndexedDB via Dexie (persistent local storage, no external API)
- React Router
- Sonner toasts


## Navigation (5 sections)
1. Overview — café identity, editable product catalogue, quick upload, recent activity, quick sales snapshot
2. Sales Analytics — Week / Month / Year / All Time period selector + empty-state chart placeholders
3. Upload Data — file drop zone, browse, validation summary, past uploads table (importing labelled unavailable until Phase 2)
4. Performance Tracker — empty metric cards + chart placeholders
5. Settings — café preferences, theme, data management

## Scripts
- `npm run dev` — start dev server
- `npm run build` — TypeScript check + production build
