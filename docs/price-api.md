# Price API

Subviews that display holdings need current prices to compute gain and % of portfolio. Until the backend is built, the frontend uses mock prices.

## Backend API (when implemented)

**Endpoint:** `GET /api/prices?symbols=AAPL,VOO,...`

**Response:** `{ "AAPL": 185.50, "VOO": 405.00 }`

**Backend responsibilities:**
- Pull from FMP (US/CAD stocks, ETFs) and Massive (option chains)
- Cache results for 30 seconds

## API keys

Store in backend `.env` (gitignored). Add keys for:

| Key | Purpose |
|-----|---------|
| FMP_API_KEY | FMP – stocks/ETFs quotes |
| MASSIVE_API_KEY | Massive – option chain data |
