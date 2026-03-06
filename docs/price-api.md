# Price API

Subviews that display holdings need current prices to compute gain and % of portfolio. The backend polls EODHD (stocks) and Massive (options) in the background and serves cached quotes from MongoDB. The frontend receives cached data only; no live fetch on request.

## Background Polling

- **EODHD (stocks/ETFs)**: Once after market close (4:35 PM ET), batch EOD for all open positions
- **Massive (options)**: Once after market close (4:35 PM ET), EOD (prev-day) for all open options, throttle 5 req/min
- **Position source**: Transactions only (open positions with net qty > 0)
- **Data**: End-of-day prices only for both stocks and options

## Endpoints

**Quotes (batch):** `GET /api/market-data/quotes?symbols=AAPL,VOO`

**Response:** `[{ "symbol": "AAPL", "price": 185.50, ... }, ...]`

**History (batch):** `GET /api/market-data/history?symbols=AAPL,VOO&from=2025-01-01&to=2026-02-18`

**Option quotes:** `GET /api/market-data/options/quote?contracts=AAPL250321C00150000,...`

**Symbol search:** `GET /api/market-data/search?q=AAPL`

## Cache-Control

- Quotes: `max-age=60` (short, 1 min)
- History: `max-age=3600` (long, 1 hour)

## API keys

Store in backend `.env` (gitignored):

| Key | Purpose |
|-----|---------|
| EODHD_API_TOKEN | EODHD -- stocks/ETFs quotes and history |
