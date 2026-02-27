/** Convert option fields to OCC ticker format: O:AAPL260117C00175000 */
export function toOccTicker(symbol: string, expiration: string, strike: number, callPut: string): string {
  const dateOnly = expiration.slice(0, 10).replace(/-/g, '').slice(2); // YYMMDD
  const cp = callPut.toUpperCase().startsWith('C') ? 'C' : 'P';
  const strikeStr = Math.round(strike * 1000).toString().padStart(8, '0');
  return `O:${symbol.toUpperCase()}${dateOnly}${cp}${strikeStr}`;
}

/** Parse SnapTrade option symbol "MTRX $34 C 2026-03-21" → { underlying, strike, callPut, expiration } */
export function parseOptionHoldingSymbol(sym: string): { underlying: string; strike: number; callPut: string; expiration: string } | null {
  const match = sym.match(/^(.+?)\s+\$([\d.]+)\s+([CP])\s+(\d{4}-\d{2}-\d{2})$/);
  if (!match) return null;
  return {
    underlying: match[1].trim(),
    strike: parseFloat(match[2]),
    callPut: match[3] === 'C' ? 'call' : 'put',
    expiration: match[4],
  };
}
