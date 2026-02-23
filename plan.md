---
name: Strategy Investment App
overview: Full-stack SaaS investment tracking app with strategy tabs, customizable drag-and-drop subview canvases, JSON+Python subview system (readonly and readwrite; see subviews.md), email OTP auth, and transaction-driven analytics -- built as a TypeScript monorepo with Vite+React frontend and NestJS backend on MongoDB Atlas.
todos:
  - id: phase1-scaffold
    content: "Phase 1: Scaffold monorepo (npm workspaces), Vite+React frontend, shared types package, run.sh, Tailwind + shadcn/ui setup, theming (dark/light + custom palette)"
    status: completed
  - id: phase2-tabs-ui
    content: "Phase 2: Strategy tab bar UI -- add/rename/delete tabs, empty state, Zustand store with mock data (no backend yet)"
    status: completed
  - id: phase3-canvas-ui
    content: "Phase 3: Canvas area with react-grid-layout -- draggable/resizable subview cards, toolbar, layout state in Zustand, empty canvas state"
    status: completed
  - id: phase4-gallery-ui
    content: "Phase 4: Subview template gallery modal -- click empty space to open, pre-built templates, add subview to canvas"
    status: completed
  - id: phase5-subview-editor-rendering
    content: "Phase 5: Subview Editor + Rendering -- Editor modal (JSON, Python, Transactions, Wallet tabs, Live Preview). Same renderer used in editor preview and on canvas. Zod validation, Pyodide, seed data. Canvas renders JSON+Python subviews. Caching for readonly."
    status: completed
  - id: phase7-transactions-ui
    content: "Phase 7: Transaction UI -- add/edit form modal, transaction list modal with pagination/sort/filter, currency display"
    status: pending
  - id: phase8-global-settings
    content: "Phase 8: Global settings UI -- viewing currency selector, dark/light toggle, theme customization panel in app bar"
    status: pending
  - id: phase9-backend-scaffold
    content: "Phase 9: Scaffold NestJS backend, shared types, Mongoose schemas, connect to MongoDB Atlas"
    status: completed
  - id: phase10-backend-api
    content: "Phase 10: Backend API -- Strategy CRUD, Transaction CRUD (with version bumping), Instrument CRUD, Wallet CRUD, Subview cache endpoints"
    status: completed
  - id: phase11-frontend-integration
    content: "Phase 11: Wire frontend to backend -- replace Zustand mock data with TanStack Query + API calls, persist layouts/transactions/strategies"
    status: completed
  - id: phase12-market-data
    content: "Phase 12: Market data -- EODHD integration (backend), MongoDB cache, instrument search, batch quote/history hooks"
    status: completed
  - id: phase13-auth
    content: "Phase 13: Auth -- email OTP via Resend, JWT tokens, guards, login page, protected routes"
    status: pending
  - id: phase14-deploy
    content: "Phase 14: Deployment -- production build scripts, Nginx config, SSL, .env management"
    status: pending
isProject: false
---

# Strategy-First Investment Tracking App

## Current Project State

**Completed:** Phases 1-5 (frontend scaffold, tabs, canvas, gallery, subview editor/rendering) and Phases 9-12 (backend scaffold, API, frontend-backend integration, EODHD market data).

**The app today:** A working full-stack app where users create strategy tabs, each with a drag-and-drop canvas of subview cards. Subviews are authored as JSON + Python specs and rendered via a generic layout engine + Pyodide. The backend (NestJS + MongoDB) provides CRUD for strategies, transactions, wallets, instruments, and market data via EODHD. Frontend uses TanStack Query for all server state.

**Not yet implemented:**
- Phase 7: Transaction UI (add/edit form modal, transaction list)
- Phase 8: Global settings UI (viewing currency, theme panel)
- Phase 13: Auth (email OTP, JWT, protected routes) -- currently uses `x-user-id` header with `'default-user'` fallback
- Phase 14: Deployment

**Known tech debt:**
- `useStrategyPrices` uses raw `useEffect` + `fetch` instead of React Query, causing duplicate quote requests across SubviewCards. Should be refactored to use `useQuotes`.

---

## Rules & Conventions

### Architecture Rules

1. **Monorepo** -- npm workspaces: `apps/web` (Vite+React), `apps/api` (NestJS), `packages/shared` (shared types). Single `run.sh` starts both.
2. **API prefix** -- All backend routes use global prefix `/api` (set in `main.ts`). Endpoint examples in this doc omit the prefix for brevity (e.g. `GET /strategies` = `GET /api/strategies`).
3. **Market data provider** -- **EODHD** (stocks/ETFs) — env var: `EODHD_API_TOKEN`. Provider: `apps/api/src/market-data/providers/eodhd-provider.ts`. **Massive** (options, via Polygon.io) — env var: `MASSIVE_API_KEY`. Provider: `apps/api/src/market-data/providers/massive-provider.ts`.
4. **Auth (current)** -- No real auth. `UserIdMiddleware` reads `x-user-id` header, falls back to `'default-user'`. JWT/OTP planned (Phase 13).

### Subview System Rules

5. **Generic rendering** -- The layout engine, Pyodide executor, and content renderer have zero subview-specific branching. All behavior is driven by JSON + Python. Never add subview-specific logic to the renderer.
6. **Two types only** -- `"readonly"` (display only, no actions, no side effects) and `"readwrite"` (actions allowed, official/premade only).
7. **Inputs not auto-rendered** -- Place inputs in layout via `{ "input": { "ref": "key" } }`. The `ref` must match a key in `spec.inputs`.
8. **Function calling convention** -- `py:` prefix for Python calls in JSON (e.g. `"py:calc_win_rate"`). Without `py:` = literal value.
9. **Python rules** -- Functions accept `(context, inputs)`, return serializable values, no I/O. `context.transactions` has resolved instrument data (`instrumentSymbol`, `instrumentName`). `context.wallet` has wallet. `context.currentPrices` has live prices. `context.priceHistory` has historical EOD prices.
10. **Strategy-scoped inputs** -- Referenced as `global.<id>` in layout. In Python: `inputs.global['<id>']`. Subview-own inputs: `inputs['<key>']`.
11. **Subview top bar inputs** -- Add `topbar: number` to input config to show in card top bar. Lower values = further left. `topbarShowTitle: false` hides label.
12. **Shared renderer** -- Editor Live Preview and canvas SubviewCard share the same layout engine, Pyodide executor, and content renderer (`SubviewSpecRenderer`). Changes to one must update both `SubviewCard` and `LivePreview`.
13. **Official vs user subviews** -- Official (`maker: "official"`): readonly + readwrite templates. User-created: readonly only (readwrite remains official-only).

### Canvas / Grid Rules

14. **Grid config** (`canvas-grid-config.ts`) -- 48 columns, 5px row height, 12px margins. Reference width: 1200px. Optimized canvas width: 1400px.
15. **Layout constraints** -- minW: 4, minH: 7, maxW: 48, maxH: 80 grid units.
16. **Sizes in pixels** -- `defaultSize` and `preferredSize` in subview spec are absolute pixels. Conversion via `pixelsToGrid()` / `gridToPixels()`.
17. **Layout change guard** -- `onLayoutChange` only calls `batchUpdatePositions` when layout actually changes (via `layoutsEqual`), preventing spurious PATCH on mount.

### Color System Rules

18. **Built-in color system only** -- Use built-in names (e.g. `green-2`, `red-1`, `grey-4`) in subview content, gauges, dynamic text. Python helpers return built-in names, not hex. Resolved via `resolveColor()`.
19. **12 main colors, 5 variants each** -- red, orange, yellow, lime, green, mint, cyan, blue, violet, magenta, grey, offwhite. Variants: `-0` (lightest), `-1` (lighter), `-2` (base), `-3` (darker), `-4` (darkest). Plus `black` (#131313), `offblack` (#202020), `white` (#f2f2f2) with no variants.
20. **Branding green** -- `green-2` (#28c207) is the accent/branding color. `green-3` for hover.
21. **Custom colors allowed** -- `resolveColor()` passes through `rgb()`, `rgba()`, `hsl()`, `hsla()`, and `#hex` values.

### Cache-Control TTL Rules

22. **Four TTL levels** -- Apply per endpoint based on data change frequency:
    - **short** = 1 min (`max-age=60`) -- live data (quotes)
    - **medium** = 15 min (`max-age=900`) -- semi-frequent updates
    - **long** = 1 hour (`max-age=3600`) -- stable data (history, margin-requirements)
    - **extra-long** = 12 hours (`max-age=43200`) -- rarely changing data
23. **React Query must match** -- `staleTime` and `refetchInterval` (in ms) should match the server-side TTL.

### UI Design Rules

24. **Design tokens** (from `apps/web/src/index.css`) -- All UI must use existing CSS variables:
    - Spacing: `--space-modal` (20px), `--space-gap` (8px), `--space-section` (24px), `--space-sidebar` (16px)
    - Controls: `--control-height` (32px)
    - Radii: `--radius-card` (8px), `--radius-medium` (6px), `--radius-button` (8px), `--radius-pill` (9999px)
    - Typography: label 11px, body 13px, title 15px, heading 18px, display 24px, xxl 32px, xxxl 40px
25. **Subview card constants** -- `--subview-card-padding: 5px`, `--subview-top-bar-height: 40px`. Top bar: drag handle + title (truncate 150px), pencil icon 8x8 marginRight 5px. Content: `paddingTop` = top bar height, `paddingLeft/Right: 10px`.
26. **Input widths (px)** -- `time_range: 240`, `ticker_selector: 100`, `number_input: 120`, `select: 200`, `checkbox: 120` (fallback 160).
27. **Dark mode only (current)** -- `applyTheme()` removes `light` class. Theme customization in Zustand + localStorage.
28. **Design language** -- Dark background (#131313), floating cards, large border-radius, subtle box-shadows, monochromatic palette, green/red only for financial indicators, generous whitespace, system sans-serif font.

### Data Flow Rules

29. **Context pipeline** -- `SubviewCard` assembles context: `strategy`, `transactions`, `currentPrices` (from `useStrategyPrices`), `instrumentMarginReqs`, `priceHistory` (from `usePriceHistory` batch API). All injected into Pyodide as `context`.
30. **Batch APIs** -- Quotes: `GET /market-data/quotes?symbols=...`. History: `GET /market-data/history?symbols=...&from=&to=`. Option quotes: `GET /market-data/options/quote?contracts=...`.

### Tooling Rules

31. **Tailwind CSS** for styling, **shadcn/ui** for component primitives.
32. **Recharts** for charts.
33. **Zustand** for client state, **TanStack Query** for server state.
34. **Pyodide** for Python in browser. No backend Python.
35. **Mongoose** for MongoDB ODM.

---

## Monorepo Structure

```
STR/
├── packages/
│   └── shared/                  # Shared TypeScript types, enums, constants
│       ├── src/
│       │   ├── models/          # Strategy, Transaction, Instrument, Wallet, Subview types
│       │   ├── enums/           # TransactionType, AssetType, CacheStatus, etc.
│       │   ├── dto/             # Request/response DTOs shared between FE/BE
│       │   └── subview-templates/# Read-only subview template schemas and types
│       ├── package.json
│       └── tsconfig.json
├── apps/
│   ├── web/                     # Vite + React + TypeScript
│   │   ├── src/
│   │   │   ├── api/             # API client (TanStack Query hooks, market-data-api, etc.)
│   │   │   ├── components/      # Shared UI components
│   │   │   ├── features/
│   │   │   │   ├── auth/        # Login, OTP verification pages (planned)
│   │   │   │   ├── strategy/    # Tab bar, strategy settings
│   │   │   │   ├── canvas/      # react-grid-layout canvas, subview cards
│   │   │   │   ├── transactions/# Transaction list, add/edit forms
│   │   │   │   └── subviews/    # Subview Editor, renderer, gallery, JSON templates
│   │   │   ├── hooks/           # Custom hooks (useStrategyPrices, etc.)
│   │   │   ├── store/           # Zustand stores (strategies, theme, UI state)
│   │   │   ├── lib/             # Pyodide executor, price-service, utils
│   │   │   └── App.tsx
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   └── api/                     # NestJS backend
│       ├── src/
│       │   ├── strategies/      # StrategyModule: CRUD, subview management
│       │   ├── transactions/    # TransactionModule: CRUD, version bumping
│       │   ├── instruments/     # InstrumentModule: CRUD, margin-requirements
│       │   ├── wallets/         # WalletModule: CRUD per strategy
│       │   ├── market-data/     # MarketDataModule: EODHD (stocks), Massive (options), MongoDB cache
│       │   ├── common/          # UserIdMiddleware, RequestLoggerMiddleware
│       │   └── main.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── nest-cli.json
├── package.json                 # npm workspaces root
├── tsconfig.base.json           # Shared TS config
├── run.sh                       # Single script to start both frontend + backend
├── subviews.md                  # Full subview JSON+Python spec
└── plan.md                      # This file
```

**Environment variables** (`apps/api/.env`):
- `MONGODB_URI` -- MongoDB Atlas connection string
- `PORT` -- API port (default 3001)
- `EODHD_API_TOKEN` -- EODHD market data API token (stocks/ETFs)
- `MASSIVE_API_KEY` -- Massive/Polygon.io API key (option quotes)

---

## 1. Authentication System (Planned -- Phase 13)

**Flow:**

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Resend
    participant MongoDB

    User->>Frontend: Enter email
    Frontend->>API: POST /auth/login {email}
    API->>MongoDB: Upsert user, generate OTP + expiry
    API->>Resend: Send OTP email
    API-->>Frontend: 200 OK
    User->>Frontend: Enter 6-digit code
    Frontend->>API: POST /auth/verify {email, code}
    API->>MongoDB: Verify OTP, check expiry
    API-->>Frontend: JWT access token + refresh token (httpOnly cookie)
    Frontend->>API: Subsequent requests with Bearer token
```

**Backend:** `AuthModule` with OTP in User doc (10 min expiry), rate limiting (`@nestjs/throttler`), JWT via `passport-jwt`, access token (15 min) + refresh token (7 days, httpOnly cookie), `JwtAuthGuard` globally with `@Public()` decorator.

**Frontend:** Login page (email -> OTP two-step), access token in memory (Zustand), refresh in httpOnly cookie, axios interceptor for auto-refresh on 401.

---

## 2. Database Models (Mongoose Schemas)

**Strategy** (`strategies` collection):

- `userId` (string, indexed), `name`, `baseCurrency` (default 'USD'), `icon`
- `initialBalance` (number, default 0), `marginAccountEnabled`, `collateralEnabled`
- `loanInterest`, `marginRequirement`, `collateralSecurities`, `collateralCash`, `collateralRequirement`
- `inputs` (embedded array of `StrategyInputConfig`: id, title, type, default, options, min, max)
- `inputValues` (Mixed, default {})
- `transactionsVersion` (number, default 0)
- `subviews` (embedded array of SubviewDoc)

**SubviewDoc** (embedded in Strategy):

- `id`, `name`, `position` ({x, y, w, h}), `templateId`, `spec` (Mixed -- full JSON subview spec)
- `icon`, `iconColor`, `inputValues` (Mixed)
- `cacheData` (Mixed), `cachedAt`, `cacheVersion` (default 0), `cacheStatus` (default 'invalid')

**Wallet** (`wallets` collection):

- `strategyId` (string, unique, indexed), `baseCurrency` (default 'USD')
- `initialBalance` (default 0), `marginAccountEnabled`, `collateralEnabled`
- `loanInterest`, `marginRequirement`, `collateralSecurities`, `collateralCash`, `collateralRequirement`

**Transaction** (`transactions` collection):

- `strategyId` (indexed), `userId`, `instrumentId`, `instrumentSymbol`
- `type` (enum), `side`, `quantity`, `price`, `cashDelta`, `fee`, `timestamp`
- `option` ({expiration, strike, callPut, contracts}), `customData` (Mixed)
- `createdAt`, `updatedAt`

**Instrument** (`instruments` collection):

- `symbol` (indexed), `name`, `assetType`, `currency`, `exchange`
- `marginRequirement`, `contractMetadata` (Mixed)

---

## 3. Backend API Endpoints

All routes prefixed with `/api`.

**Strategies:**

- `GET /strategies` -- list user's strategies
- `POST /strategies` -- create strategy
- `PATCH /strategies/:id` -- update strategy fields
- `DELETE /strategies/:id` -- delete strategy
- `POST /strategies/:id/subviews` -- add subview
- `PATCH /strategies/:id/subviews` -- batch update subview positions
- `PATCH /strategies/:id/subviews/:subviewId` -- update single subview
- `DELETE /strategies/:id/subviews/:subviewId` -- remove subview
- `PUT /strategies/:id/subviews/:subviewId/cache` -- save computed cache

**Transactions:**

- `GET /strategies/:strategyId/transactions` -- list transactions
- `POST /strategies/:strategyId/transactions` -- add (bumps `transactionsVersion`)
- `PATCH /transactions/:id` -- update
- `DELETE /transactions/:id` -- delete (bumps version)

**Instruments:**

- `GET /instruments/search?q=AAPL` -- search/autocomplete
- `GET /instruments/margin-requirements?symbols=AAPL,VOO` -- batch margin reqs (Cache-Control: long)
- `GET /instruments/:id` -- get single instrument
- `POST /instruments` -- upsert instrument

**Wallets:**

- `GET /strategies/:strategyId/wallet` -- get wallet
- `PATCH /strategies/:strategyId/wallet` -- update wallet settings

**Market Data:**

- `GET /market-data/quotes?symbols=AAPL,VOO` -- batch quotes (Cache-Control: short, 1 min)
- `GET /market-data/options/quote?contracts=...` -- option quotes
- `GET /market-data/history?symbols=AAPL,VOO&from=...&to=...` -- batch history (Cache-Control: long, 1 hour)
- `GET /market-data/history/:symbol?from=...&to=...` -- single symbol history (Cache-Control: long)
- `GET /market-data/search?q=...` -- symbol search

**Auth (planned):**

- `POST /auth/login` -- send OTP
- `POST /auth/verify` -- verify OTP, return tokens
- `POST /auth/refresh` -- refresh access token
- `POST /auth/logout` -- clear refresh token

---

## 4. Frontend Architecture

### Core Shell

The app has no dashboard page. The authenticated shell is a **tab bar** (strategies) + **canvas area** as tab content.

```mermaid
flowchart TD
    App --> AuthGuard
    AuthGuard -->|unauthenticated| LoginPage
    AuthGuard -->|authenticated| AppShell
    AppShell --> StrategyTabBar
    AppShell --> ActiveTabContent["Canvas Area (active strategy)"]
    StrategyTabBar --> TabItem1["Strategy Tab 1"]
    StrategyTabBar --> TabItem2["Strategy Tab 2"]
    StrategyTabBar --> AddTabBtn["+  Add Strategy"]
    ActiveTabContent --> Toolbar["Toolbar: + Transaction | Settings | View Transactions"]
    ActiveTabContent --> GridLayout["react-grid-layout Canvas"]
    GridLayout --> SubviewCard1["Subview Card"]
    GridLayout --> SubviewCard2["Subview Card"]
    GridLayout --> EmptySpace["Click to Add Subview"]
    EmptySpace --> SubviewGallery["Template Gallery Modal"]
```

**Layout:** Single page, no routing between strategies. Tab bar across top (empty state: "Create your first strategy" CTA). Canvas fills viewport with toolbar + grid. User menu top-right.

**Routes:** `/login` (auth), `/` (app shell, protected). Modals for: transaction list/form, strategy settings, subview gallery/editor.

### Strategy Tab System

- Add tab: modal with name + base currency
- Tab switching: loads strategy's subviews into canvas
- Tab context menu: rename, delete (with confirmation)
- State: Zustand `strategies[]`, `activeStrategyId`; TanStack Query `useStrategies()`, `useStrategy(id)`

### Frontend Hooks

- `useQuotes(symbols)` -- batch quotes via React Query (60s stale/refetch)
- `useOptionQuotes(contracts)` -- option quotes via React Query (30 min stale/refetch)
- `usePriceHistory(symbols, from, to)` -- batch history via React Query
- `useStrategyPrices(transactions)` -- extracts stock/ETF symbols, fetches prices (tech debt: uses raw fetch, not React Query)

---

## 5. Subview System (JSON + Python)

See `subviews.md` for the full spec. Summary:

**Two types:** `readonly` (display only) and `readwrite` (actions allowed, official only).

**JSON structure:** `type`, `name`, `description`, `maker`, `defaultSize` (pixels), `inputs` (optional controls), `layout` (2D array of rows/cells with content), `python_code`, `functions`.

**Function calling:** `py:` prefix in content = Python call. Without prefix = literal value.

**Python:** Functions accept `(context, inputs)`. Return serializable values. No I/O. Context includes `transactions` (with resolved instrument data), `wallet`, `currentPrices`, `priceHistory`.

**Readonly restrictions:** No `actions`. Immutable returns. No side effects.

**Readwrite:** Official only. Actions use predefined handlers (`addTransactionModal`, `editTransactionModal`, etc.). Row/header actions in Table content.

---

## 6. Subview Gallery & Editor

**Gallery:** Shows official subviews (readonly + readwrite) and user-created readonly subviews.

**Editor:** Split-panel modal. Left: tabbed editors (JSON, Python, Transactions seed, Wallet seed) with Monaco. Right: Live Preview using the same renderer as canvas cards. Seed data injected for testing. Save validates and persists. Status bar shows validation state.

---

## 7. Subview Rendering and Caching

Editor Live Preview and canvas SubviewCard share the same layout engine, Pyodide executor, and content renderer.

**Readwrite:** Always fresh (no caching).

**Readonly caching:** Staleness check:

```typescript
const isStale =
  subview.cacheStatus === 'invalid' ||
  subview.cacheVersion !== strategy.transactionsVersion ||
  (subview.cachedAt && Date.now() - subview.cachedAt > TTL);
```

Flow: (1) cached + fresh = render from `cacheData`. (2) stale = run Python, render, save cache via `PUT .../cache`.

**Charts:** Line, bar, pie. Python returns data per chart schema in subviews.md.

**Python execution:** Runs in browser via Pyodide. No backend Python service.

---

## 8. Transaction Management

**Add form:** Instrument search (autocomplete), type dropdown, quantity/price/fee, cash delta (auto or override), timestamp (default now), option fields (conditional), metadata JSON editor.

**List view:** Paginated table, sort by date/instrument/type, inline edit, bulk delete, filter by instrument/type/date range, export CSV.

---

## 9. Market Data Integration

**Backend (`MarketDataModule`):**

- **EODHD** (`eodhd-provider.ts`) with `EODHD_API_TOKEN` — stocks/ETFs, history, symbol search
- **Massive** (`massive-provider.ts`) with `MASSIVE_API_KEY` — option quotes (via Polygon.io)
- Provider registry: EODHD for stocks/ETFs, Massive for options
- MongoDB-backed cache (`quote-cache`, `price-history` collections)
- Batch endpoints: quotes, history, option quotes, search

**Frontend usage:**

- `useQuotes(symbols)` -- polls via TanStack Query with 60s stale/refetch (matches server Cache-Control: short)
- `usePriceHistory(symbols, from, to)` -- batch history via single React Query call
- `useStrategyPrices(transactions)` -- extracts symbols, fetches prices for context pipeline

---

## 10. Currency Conversion (UI-Only -- Planned)

- **Global setting** -- viewing currency dropdown in app bar, applies to all strategies
- All displayed monetary values go through `convertCurrency(amount, from, to, rates)`
- Exchange rates fetched from backend and cached
- Purely presentational -- stored data always in original currency
- Zustand `viewingCurrency` global, persisted to localStorage

---

## 11. UI Design

**All UI must follow the existing design system** (see `apps/web/src/index.css`).

**Subview Card Styling (constant across canvas + editor):**

- Card constants: `--subview-card-padding: 5px`, `--subview-top-bar-height: 40px`
- Top bar: fixed height, drag handle + title (truncate 150px), pencil icon (8x8, marginRight 5px), padding left 10px right 4px
- Content: `paddingTop` = top bar height, `paddingLeft/Right: 10px`, `overflow-auto`
- Input widths: `time_range: 240`, `ticker_selector: 100`, `number_input: 120`, `select: 200`, `checkbox: 120` (fallback 160)
- Input styling: right-aligned, `paddingLeft/Right: 12`, height `var(--control-height)`, `rounded-[var(--radius-medium)]`
- Input labels: 11px, font-medium, `--color-text-secondary`
- `time_range`: two date inputs side-by-side, `gap-1`
- `ticker_selector`: `<select>` from `context.transactions[].instrumentSymbol` + "all"
- Text/number sizing: xs(11) sm(13) md(15) lg(18) xl(24) xxl(32) xxxl(40)px; optional `bold`, `italic`

**Design language:**

- Dark background (#131313), floating cards (#202020), large border-radius, subtle box-shadows
- Monochromatic palette; green/red only for financial indicators
- Built-in color system via `resolveColor()` -- no hardcoded hex in subview Python
- Dark mode only (current); light mode planned
- Generous whitespace (20-24px card padding)
- System sans-serif font with strong size/weight hierarchy

**Customizable Color Palette:**

Semantic CSS variables (`:root`): `--color-bg-page`, `--color-bg-card`, `--color-bg-hover`, `--color-border`, `--color-shadow`, `--color-text-primary`, `--color-text-secondary`, `--color-accent`, `--color-accent-hover`, `--color-positive`, `--color-negative`, `--color-chart-1` through `--color-chart-5`.

Theme settings panel: override any token via color picker. Custom palette in Zustand + localStorage. Reset per-token or all.

**Tooling:** Tailwind CSS + shadcn/ui. Responsive: desktop-first, collapse columns on tablet/mobile. Animations: Framer Motion.

---

## 12. Running and Deployment

**Local development:**

`./run.sh` starts both servers concurrently:
- Backend: `npm run dev` in `apps/api` (NestJS, port 3001)
- Frontend: `npm run dev` in `apps/web` (Vite, port 5173, proxies `/api` to backend)
- Uses `concurrently`; Ctrl+C stops both

**Production deployment (planned):**

- Build frontend: `npm run build` in `apps/web` -> static files
- Build backend: `npm run build` in `apps/api` -> compiled JS
- Nginx serves static + proxies `/api` to Node
- SSL via Let's Encrypt + Certbot
- Environment variables via `.env` on droplet
