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
    status: in_progress
  - id: phase7-transactions-ui
    content: "Phase 7: Transaction UI -- add/edit form modal, transaction list modal with pagination/sort/filter, currency display"
    status: pending
  - id: phase8-global-settings
    content: "Phase 8: Global settings UI -- viewing currency selector, dark/light toggle, theme customization panel in app bar"
    status: pending
  - id: phase9-backend-scaffold
    content: "Phase 9: Scaffold NestJS backend, shared types, Mongoose schemas, connect to MongoDB Atlas"
    status: pending
  - id: phase10-backend-api
    content: "Phase 10: Backend API -- Strategy CRUD, Transaction CRUD (with version bumping), Instrument CRUD, Wallet CRUD, Subview cache endpoints"
    status: pending
  - id: phase11-frontend-integration
    content: "Phase 11: Wire frontend to backend -- replace Zustand mock data with TanStack Query + API calls, persist layouts/transactions/strategies"
    status: pending
  - id: phase12-market-data
    content: "Phase 12: Market data -- FMP integration (backend), in-memory cache, instrument search, quote hooks, currency conversion"
    status: pending
  - id: phase13-auth
    content: "Phase 13: Auth -- email OTP via Resend, JWT tokens, guards, login page, protected routes"
    status: pending
  - id: phase14-deploy
    content: "Phase 14: Deployment -- production build scripts, Nginx config, SSL, .env management"
    status: pending
isProject: false
---

# Strategy-First Investment Tracking App -- Full Implementation Plan

## Monorepo Structure

```
Str/
├── packages/
│   └── shared/                  # Shared TypeScript types, enums, constants
│       ├── src/
│       │   ├── models/          # User, Strategy, Transaction, Instrument, Wallet, Subview types
│       │   ├── enums/           # TransactionType, AssetType, CacheStatus, SubviewType, etc.
│       │   ├── dto/             # Request/response DTOs shared between FE/BE
│       │   └── subview-templates/# Read-only subview template schemas and types
│       ├── package.json
│       └── tsconfig.json
├── apps/
│   ├── web/                     # Vite + React + TypeScript
│   │   ├── src/
│   │   │   ├── api/             # API client (axios + TanStack Query hooks)
│   │   │   ├── components/      # Shared UI components
│   │   │   ├── features/
│   │   │   │   ├── auth/        # Login, OTP verification pages
│   │   │   │   ├── strategy/    # Tab bar, strategy settings
│   │   │   │   ├── canvas/      # react-grid-layout canvas, subview cards
│   │   │   │   ├── transactions/# Transaction list, add/edit forms
│   │   │   │   └── subviews/    # Subview Editor, renderer (layout engine), gallery, JSON templates
│   │   │   ├── hooks/           # Custom hooks (useAuth, useStrategy, useCurrency)
│   │   │   ├── store/           # Zustand stores (auth, strategies, UI state)
│   │   │   ├── lib/             # Pyodide executor for subview Python, currency converter, utils
│   │   │   └── App.tsx
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   └── api/                     # NestJS backend
│       ├── src/
│       │   ├── auth/            # AuthModule: OTP generation, verification, JWT
│       │   ├── users/           # UserModule: CRUD, subscription status
│       │   ├── strategies/      # StrategyModule: CRUD, subview management
│       │   ├── transactions/    # TransactionModule: CRUD, version bumping
│       │   ├── instruments/     # InstrumentModule: CRUD, lookup
│       │   ├── wallets/         # WalletModule: CRUD per strategy
│       │   ├── market-data/     # MarketDataModule: FMP proxy, in-memory cache
│       │   ├── common/          # Guards, interceptors, filters, decorators
│       │   └── main.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── nest-cli.json
├── package.json                 # npm workspaces root
├── tsconfig.base.json           # Shared TS config
├── .env.example
├── run.sh                       # Single script to start both frontend + backend
└── README.md
```

Tool choices:

- **npm workspaces** for monorepo (simple, no extra tooling)
- **Zustand** for frontend state (lightweight, minimal boilerplate)
- **TanStack Query** for server state / data fetching
- **Recharts** for chart rendering (React-native, good variety of chart types)
- **Resend** for transactional email (modern API, great DX, free tier)
- **Mongoose** for MongoDB ODM

---

## 1. Project Scaffolding and Dev Environment

- Initialize npm workspaces root `package.json`
- Scaffold `apps/api` with NestJS CLI (`@nestjs/cli`)
- Scaffold `apps/web` with Vite React-TS template
- Create `packages/shared` with shared types
- Set up `tsconfig.base.json` with path aliases
- Create `run.sh` script that starts both backend and frontend dev servers concurrently (single command to launch everything)
- Create `.env.example` with all required env vars:
  - `MONGODB_URI`, `JWT_SECRET`, `RESEND_API_KEY`, `FMP_API_KEY`, `FRONTEND_URL`

---

## 2. Shared Types (packages/shared)

Core model interfaces and enums:

```typescript
// enums
enum TransactionType { BUY, SELL, SELL_SHORT, BUY_TO_COVER, DIVIDEND, DEPOSIT, WITHDRAWAL, FEE, INTEREST, OPTION_EXERCISE, OPTION_ASSIGN, OPTION_EXPIRE }
enum AssetType { STOCK, ETF, OPTION, BOND, CRYPTO, CASH, OTHER }
enum CacheStatus { VALID, INVALID }
enum SubscriptionStatus { FREE, ACTIVE, PAST_DUE, CANCELLED }

// Model interfaces: IUser, IStrategy, ISubview, ITransaction, IInstrument, IWallet
// Subview: JSON spec (type, name, description, maker, size, inputs, layout, python_code, functions) — see subviews.md
// DTOs: CreateTransactionDto, UpdateStrategyDto, LoginDto, VerifyOtpDto, etc.
```

---

## 3. Authentication System

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



**Backend implementation:**

- `AuthModule` with `AuthService`, `AuthController`
- OTP stored in User document: `{ otpCode, otpExpiresAt }` (expires in 10 min)
- Rate limiting: max 5 OTP requests per email per hour (use `@nestjs/throttler`)
- JWT strategy via `@nestjs/passport` + `passport-jwt`
- Access token (15 min) + Refresh token (7 days, httpOnly cookie)
- `JwtAuthGuard` applied globally, whitelist public routes with `@Public()` decorator

**Frontend:**

- Login page: email input -> OTP input (two-step form)
- Store access token in memory (Zustand), refresh token in httpOnly cookie
- Axios interceptor: auto-refresh on 401

---

## 4. Database Models (Mongoose Schemas)

**User:**

- `email` (unique, indexed), `subscriptionStatus`, `otpCode`, `otpExpiresAt`, `refreshToken`, `createdAt`

**Strategy:**

- `userId` (ref, indexed), `name`, `walletId` (ref), `customData` (Mixed/JSON), `transactionsVersion` (Number, default 0), `subviews` (embedded array of SubviewSchema), `createdAt`, `updatedAt`

**Subview (embedded in Strategy):**

- `id` (UUID), `position` ({x, y, w, h})
- Subview spec stored as JSON (see subviews.md): `type` (readonly | readwrite), `name`, `description`, `maker`, `size`, `inputs`, `layout`, `python_code`, `functions`
- `cacheData` (Mixed), `cachedAt`, `cacheVersion`, `cacheStatus` (enum: valid/invalid) -- used mainly by readonly subviews

**Wallet:**

- `strategyId` (ref, unique, indexed), `baseCurrency`, `balance`, `margin`, `collateralValue`, `collateralMarginRequirement`

**Transaction:**

- `strategyId` (ref, indexed), `instrumentId` (ref), `type` (enum), `quantity`, `price`, `cashDelta`, `timestamp`, `metadata` (Mixed), `fee`, `optionData` (Mixed -- expiration, strike, etc.), `createdAt`
- Compound index: `{ strategyId: 1, timestamp: -1 }` for efficient queries

**Instrument:**

- `symbol` (indexed), `assetType` (enum), `currency`, `contractMetadata` (Mixed), `marginRequirement`, unique compound index on `{ symbol, assetType }`

---

## 5. Backend API Endpoints


| Module | Endpoints |
| ------ | --------- |


**Auth:**

- `POST /auth/login` -- send OTP
- `POST /auth/verify` -- verify OTP, return tokens
- `POST /auth/refresh` -- refresh access token
- `POST /auth/logout` -- clear refresh token

**Strategies:**

- `GET /strategies` -- list user's strategies
- `POST /strategies` -- create strategy
- `PATCH /strategies/:id` -- update name, customData
- `DELETE /strategies/:id` -- delete strategy + cascade transactions
- `PATCH /strategies/:id/subviews` -- update subview layout (batch position updates)
- `POST /strategies/:id/subviews` -- add subview
- `PATCH /strategies/:id/subviews/:subviewId` -- update subview JSON spec (full replace or partial)
- `DELETE /strategies/:id/subviews/:subviewId` -- remove subview
- `PUT /strategies/:id/subviews/:subviewId/cache` -- save computed cache from frontend

**Transactions:**

- `GET /strategies/:id/transactions` -- list (paginated, sorted by timestamp desc)
- `POST /strategies/:id/transactions` -- add transaction (bumps `transactionsVersion`)
- `PATCH /transactions/:id` -- update transaction
- `DELETE /transactions/:id` -- delete transaction (bumps version)

**Instruments:**

- `GET /instruments/search?q=AAPL` -- search/autocomplete
- `GET /instruments/:id` -- get instrument details
- `POST /instruments` -- create (admin or auto-create on first transaction)

**Wallets:**

- `GET /strategies/:id/wallet` -- get wallet
- `PATCH /strategies/:id/wallet` -- update wallet settings

**Market Data:**

- `GET /market-data/quote/:symbol` -- real-time quote (proxied from FMP, cached in memory)
- `GET /market-data/history/:symbol` -- historical prices

---

## 6. Frontend -- Core Shell and Routing

The app has no dashboard page. The authenticated shell is simply a **tab bar** (strategies) with a **canvas area** as the tab content. Selecting a tab swaps the canvas.

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



**Layout (single page, no routing between strategies):**

- **Tab bar** across the top: shows all strategy tabs + "+" button to add a new strategy. No tabs initially -- empty state prompts user to create first strategy.
- **Canvas area** fills the rest of the viewport, showing the active strategy's content:
  - **Toolbar** (top-right of canvas): "+ Add Transaction" | Settings (gear) | "View All Transactions"
  - **Grid** (`react-grid-layout`): draggable/resizable subview cards
- User menu (top-right corner of tab bar): settings, logout

**Routes (minimal):**

- `/login` -- Auth flow (email + OTP)
- `/` -- App shell (tab bar + canvas) -- protected. Strategy selection is via tabs, not URL routing.
- Modal overlays for: transaction list, transaction form, strategy settings, subview gallery

---

## 7. Strategy Tab System

- **No tabs on first load** -- empty state with "Create your first strategy" CTA
- **Add tab**: opens modal with strategy name + base currency
- **Tab switching**: loads that strategy's subviews into the canvas
- **Tab context menu**: rename, delete (with confirmation)
- **State**: Zustand store holds `strategies[]`, `activeStrategyId`
- **Data loading**: TanStack Query -- `useStrategies()` fetches all, `useStrategy(id)` fetches one with subviews

---

## 8. Canvas and Subview Grid

**react-grid-layout setup:**

- Responsive breakpoints: lg (1200px), md (996px), sm (768px)
- Columns: 12 (lg), 8 (md), 4 (sm)
- Row height: 80px
- Subview cards: draggable, resizable, with min/max constraints
- On layout change: debounced PATCH to `/strategies/:id/subviews` with new positions
- Empty canvas: large "+" button or click-anywhere to open subview gallery

**Subview Card component:**

- Header: subview name, edit (pencil) icon, remove (x) icon
- Body: rendered chart/data (from `SubviewRenderer`)
- Loading state: skeleton placeholder
- Error state: retry button

---

## 9. Subview System (JSON + Python) — see subviews.md

The subview system is **unified**: both readonly and readwrite subviews use the same JSON structure. See `subviews.md` for the full spec. Summary:

**Two types:**
- `readonly` — display only (no actions, no side effects, no modals, no writes)
- `readwrite` — allows actions to edit transactions/wallet; **only official premade subviews** (authored via Subview Editor, not hardcoded)

**JSON structure (required fields):**
- `type`, `name`, `description`, `maker` ("official" or user nickname for readonly)
- `size` — string like `"2x1"`, `"4x2"` (initial placement hint)
- `inputs` (optional) — controls with defined types/schemas: `time_range`, `ticker_selector`, `number_input`, `select`, `checkbox` (see subviews.md)
- `layout` — 2D array of rows → cells with `weight`, `alignment`, `content` (text, number, Table, Chart, etc.)
- `python_code` — all Python function definitions for this subview
- `functions` — array of function names used (referenced via `py:functionName` in content)

**Function calling:** Use `py:` prefix in content, e.g. `{ "number": { "value": "py:calc_win_rate" } }`. Without `py:` → literal value.

**Readonly restrictions:** No `actions` field; functions return immutable values; no side effects.

**Readwrite restrictions/allowances:** Only when `type === "readwrite"`; actions use predefined handler names (`addTransactionModal`, `editTransactionModal`, `closeTransactionModal`, `rollTransactionModal`, etc.); row/header actions in Table content.

**Python rules:** Functions accept `(context, inputs)`; return serializable values; no I/O. `context.transactions` has **resolved** instrument data (instrumentSymbol, instrumentName); `context.wallet`; `inputs` from controls (see subviews.md for input type schemas).

---

## 10. Subview Gallery

Gallery shows:
- **Official subviews** (`maker: "official"`) — readonly and readwrite templates authored via Subview Editor (Equity Curve, Win Rate, Open Options Positions, etc.)
- **User-created readonly subviews** — users can create and add their own JSON + Python subviews (readwrite remains official-only)

---

## 11. Subview Editor UX (for creating/editing subviews)

*Editor and rendering are developed together (Phase 5). The Live Preview uses the same renderer as canvas cards.*

The **Subview Editor** is the tool for authoring all subviews — official read-write and user-created readonly. No subviews are hand-coded in React.

Split-panel modal (desktop):

| Panel | Content |
|-------|---------|
| Left (tabs) | **JSON**, **Python**, **Transactions** (seed data), **Wallet** (seed data) — Monaco editors, toolbar buttons |
| Right | **Live Preview** — same renderer as canvas; MiniCanvasPreview with identical grid config |

**Seed data** for testing (injected): `context` with 10–20 fake transactions + wallet; `inputs` with timeRange, ticker.

**Mobile:** Stacked tabs (JSON → Python → Preview).

**Actions:** Save (validates → backend), Cancel/Discard. Status bar: "Valid JSON" / "Python syntax ok" / "Preview updated".

---

## 12. Subview Rendering and Caching

*Shared by editor Live Preview and canvas SubviewCard. Same layout engine, Pyodide executor, and content rendering.*

**Readwrite subviews:** Render from JSON + Python; no caching (always fresh).

**Readonly subviews** use caching. Staleness check:

```typescript
const isStale =
  subview.cacheStatus === 'invalid' ||
  subview.cacheVersion !== strategy.transactionsVersion ||
  (subview.cachedAt && Date.now() - subview.cachedAt > TTL);
```

**Rendering flow:** (1) If cached and fresh → render from `cacheData`. (2) If stale → run Python with real context/inputs, render, save cache via `PUT .../cache`.

**Charts:** Line, bar, pie schemas defined in subviews.md. Python returns `{ labels, series }` for line/bar; `{ items: [{ label, value }] }` for pie. Expand to more chart types later.

**Python execution:** Runs in **browser** via Pyodide. No backend Python service.

---

## 13. Transaction Management

**Add Transaction form:**

- Instrument search (autocomplete, hits `/instruments/search`)
- Type dropdown (buy, sell, sell_short, etc.)
- Quantity, Price, Fee fields
- Cash delta: auto-calculated or manual override
- Timestamp: date+time picker, defaults to now
- Option data: conditional fields (strike, expiration, contract type) when instrument is option
- Metadata: optional JSON editor for custom fields

**Transaction list view:**

- Paginated table with sorting (by date, instrument, type, P&L)
- Inline edit capability
- Bulk delete
- Filter by instrument, type, date range
- Export to CSV

---

## 14. Market Data Integration (FMP)

**Backend MarketDataService:**

- FMP API client with API key from env
- Endpoints: `/quote/{symbol}`, `/historical-price-full/{symbol}`
- In-memory cache using `node-cache` or simple Map with TTL:
  - Quotes: 15-second TTL (near real-time)
  - Historical: 1-hour TTL
- Rate limiting awareness (FMP has request limits per plan)
- Symbol mapping for Canadian stocks (TSX: prefix)

**Frontend usage:**

- `useQuote(symbol)` hook -- polls via TanStack Query with `refetchInterval: 15000`
- Used in Open Positions subview, portfolio value calculations

---

## 15. Currency Conversion (UI-Only)

- **Global setting** -- viewing currency dropdown lives in the top-level app bar (next to user menu), applies to all strategy tabs
- All monetary values displayed go through `convertCurrency(amount, fromCurrency, toCurrency, rates)`
- Exchange rates fetched from FMP (`/fx?pairs=...`) and cached
- Conversion is purely presentational -- stored data always in original currency
- Zustand store: `viewingCurrency` is a global value (not per-strategy), persisted to localStorage so it survives page reload

---

## 16. UI Design Approach

**All UI must follow the existing design system** (see `apps/web/src/index.css`). Use the same design tokens for gaps, sizes, radii, and colors so new components visually match what's already built.

**Design tokens (use these):**

- **Spacing:** `--space-modal` (20px), `--space-gap` (8px), `--space-section` (24px), `--space-sidebar` (16px)
- **Controls:** `--control-height` (32px) for inputs, buttons, segments
- **Radii:** `--radius-card` (8px), `--radius-medium` (6px), `--radius-button` (8px)
- **Card styling:** `padding: var(--space-modal)`, `boxShadow: 0 4px 24px var(--color-shadow)`, `border: 1px solid var(--color-border)`
- **SubviewCard:** Title area padding (top 6px, left 10px); pencil icon `marginRight: 5px`
- **Filter-style layouts:** field 150px, operator 75px, segment 100px, value 150px; card padding 20px; gap 8px

**Design language** (soft, rounded, shadow-driven -- per reference image):

- **Off-white page background** (~#f2f2f2 light / #0f172a dark) with white/dark cards floating on top
- **Large border-radius** everywhere: 12-16px on cards/panels, pill-shaped buttons and inputs
- **Subtle box-shadows** for depth instead of hard borders
- **Monochromatic palette**: black primary actions, gray text hierarchy, minimal color usage
- **Green/red** only for positive/negative financial indicators
- **Generous whitespace and padding** -- cards have 20-24px padding, clear visual breathing room
- **Light mode as default** (dark mode available via toggle)
- **Clean sans-serif typography** (Inter) with strong size/weight hierarchy

**Tooling:**

- **Tailwind CSS** for styling (utility-first, fast iteration)
- **shadcn/ui** for component primitives (buttons, modals, dropdowns, inputs, tabs)
- **Both dark and light mode** supported, toggle in the app bar
- Responsive: desktop-first, collapse grid columns on tablet/mobile
- Animations: Framer Motion for tab transitions, modal open/close

**Customizable Color Palette:**

Semantic tokens (CSS variables on `:root` / `.dark`):

- `--color-bg-page` -- page/app background (off-white / dark slate)
- `--color-bg-card` -- card/panel surface (white / dark)
- `--color-bg-hover` -- hover/subtle backgrounds
- `--color-border` -- subtle borders (used sparingly)
- `--color-shadow` -- box-shadow color
- `--color-text-primary` -- main text (near-black / off-white)
- `--color-text-secondary` -- muted/label text
- `--color-accent` -- primary actions (black / white)
- `--color-accent-hover` -- hover state for accent
- `--color-positive` -- profit, gains (green)
- `--color-negative` -- loss, drawdown (red)
- `--color-chart-1` through `--color-chart-5` -- chart series colors

**Customization:**

- Theme settings panel (accessible from user menu) lets user override any token via color pickers
- Custom palette stored in Zustand + localStorage (no backend persistence needed)
- Reset to default button per-token and for entire theme
- Tailwind configured to reference these CSS variables so all components automatically respect the palette

---

## 17. Running and Deployment

**Local development -- single command:**

`./run.sh` starts both servers concurrently:

- Backend: `npm run dev` in `apps/api` (NestJS, e.g. port 3001)
- Frontend: `npm run dev` in `apps/web` (Vite, e.g. port 5173, proxies `/api` to backend)
- Uses `concurrently` npm package to run both in one terminal with color-coded output
- Ctrl+C stops both

**Production deployment (Digital Ocean droplet, future):**

- Build frontend: `npm run build` in `apps/web` -> static files
- Build backend: `npm run build` in `apps/api` -> compiled JS
- Serve frontend static files via Nginx, proxy `/api` to Node process
- SSL via Let's Encrypt + Certbot
- Environment variables via `.env` file on the droplet

---

## Implementation Phases (UI-First Approach)

**Phase 1 -- Scaffold:** Monorepo, Vite+React, Tailwind + shadcn/ui, theming, run.sh
**Phase 2 -- Strategy Tabs UI:** Tab bar, add/rename/delete, empty state (mock data in Zustand)
**Phase 3 -- Canvas UI:** react-grid-layout, subview cards, toolbar, layout persistence in Zustand
**Phase 4 -- Subview Gallery UI:** Template gallery modal, pre-built read-only templates, add to canvas
**Phase 5 -- Subview Editor + Rendering:** Editor modal (JSON, Python, Transactions, Wallet tabs) with Live Preview. Subview rendering is shared: the same layout engine and Pyodide executor power both the editor preview and canvas cards. Zod validation. Seed data for testing. Canvas renders JSON+Python subviews. Caching for readonly. Official read-write and user-created readonly subviews are all built via the editor.
**Phase 7 -- Transaction UI:** Add/edit form, transaction list modal, pagination/sort/filter
**Phase 8 -- Global Settings UI:** Viewing currency, dark/light toggle, theme customization panel
**Phase 9 -- Backend Scaffold:** NestJS, Mongoose schemas, MongoDB Atlas connection
**Phase 10 -- Backend API:** Strategy, Transaction, Instrument, Wallet, Subview cache endpoints
**Phase 11 -- Frontend-Backend Integration:** Replace mock data with TanStack Query + real API
**Phase 12 -- Market Data:** FMP backend integration, instrument search, quotes, currency conversion
**Phase 13 -- Auth:** Email OTP (Resend), JWT, login page, route protection (done last)
**Phase 14 -- Deployment:** Production builds, Nginx, SSL