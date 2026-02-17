# Price API

Subviews that display holdings need current prices to compute gain and % of portfolio. Until the backend is built, the frontend uses mock prices.

## Backend API (when implemented)

**Endpoint:** `GET /api/prices?symbols=AAPL,VOO,...`

**Response:** `{ "AAPL": 185.50, "VOO": 405.00 }`

**Backend responsibilities:**
- Pull from FMP (US/CAD stocks, ETFs) and Massive (option chains)
- Cache results for 30 seconds

## API keys

Store in backend `.env` (gitignored). For development, keys are stored here until backend is built:

| Key | Value | Purpose |
|-----|-------|---------|
| FMP_API_KEY | 7uytlL2tq2H33ehZ7mIthDCHtYZVadxu | FMP – stocks/ETFs only |
| MASSIVE_API_KEY | Wy7ZafKrI9h0jmeLJXFPTptFmK3iexeE | Massive – option chain data |
