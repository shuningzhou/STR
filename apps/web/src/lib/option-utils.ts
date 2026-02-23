/** Convert option fields to OCC ticker format: O:AAPL260117C00175000 */
export function toOccTicker(symbol: string, expiration: string, strike: number, callPut: string): string {
  const dateOnly = expiration.slice(0, 10).replace(/-/g, '').slice(2); // YYMMDD
  const cp = callPut.toUpperCase().startsWith('C') ? 'C' : 'P';
  const strikeStr = Math.round(strike * 1000).toString().padStart(8, '0');
  return `O:${symbol.toUpperCase()}${dateOnly}${cp}${strikeStr}`;
}
