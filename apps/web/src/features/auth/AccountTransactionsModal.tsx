import { useState, useMemo, type ReactNode } from 'react';
import { Modal, Button, SegmentControl } from '@/components/ui';
import {
  useSnaptradeConnections,
  useAccountTransactions,
  useSyncAccount,
  type SnaptradeConnection,
  type SyncedTransaction,
} from '@/api/hooks';

type CurrencyFilter = 'all' | 'CAD' | 'USD';

interface Props {
  onClose: () => void;
}

export function AccountTransactionsModal({ onClose }: Props) {
  const { data: connections = [] } = useSnaptradeConnections();
  const [selectedConnId, setSelectedConnId] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyFilter>('all');

  const selectedConn = useMemo(
    () => connections.find((c: SnaptradeConnection) => c.authorizationId === selectedConnId),
    [connections, selectedConnId],
  );

  const accounts = useMemo(() => selectedConn?.accounts ?? [], [selectedConn]);

  const { data: txData, isLoading } = useAccountTransactions(selectedAccountId);
  const syncMut = useSyncAccount();

  const transactions = txData?.transactions ?? [];
  const rawHoldings = txData?.rawHoldings ?? null;

  const filterByCurrency = useMemo(() => {
    if (currencyFilter === 'all') return (_t: SyncedTransaction) => true;
    return (t: SyncedTransaction) => (t.currency || 'USD') === currencyFilter;
  }, [currencyFilter]);

  const filterPositionsByCurrency = useMemo(() => {
    if (currencyFilter === 'all') return () => true;
    return (p: { currency?: string }) => (p.currency || 'USD') === currencyFilter;
  }, [currencyFilter]);

  const filteredTxns = useMemo(() => {
    const base = [...transactions].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    return currencyFilter === 'all' ? base : base.filter(filterByCurrency);
  }, [transactions, currencyFilter, filterByCurrency]);

  const filteredRawHoldings = useMemo(() => {
    if (!rawHoldings) return null;
    const positions = rawHoldings.positions.filter(filterPositionsByCurrency);
    const cashByCurrency = rawHoldings.cashByCurrency ?? (rawHoldings.cash != null ? { USD: rawHoldings.cash } : {});
    const filteredCash =
      currencyFilter === 'all'
        ? cashByCurrency
        : currencyFilter in cashByCurrency
          ? { [currencyFilter]: cashByCurrency[currencyFilter] }
          : {};
    return { positions, cashByCurrency: filteredCash };
  }, [rawHoldings, currencyFilter, filterPositionsByCurrency]);

  const handleSync = () => {
    if (!selectedAccountId) return;
    syncMut.mutate({ accountId: selectedAccountId, fullResync: true });
  };

  const hasData = filteredTxns.length > 0 || (rawHoldings?.positions?.length ?? 0) > 0;

  return (
    <Modal title="Account Transactions" onClose={onClose} size="xl" className="max-h-[85vh]">
      <div className="flex flex-col h-full" style={{ gap: 'var(--space-gap)' }}>
        {/* Filters */}
        <div className="flex items-center shrink-0" style={{ gap: 'var(--space-gap)' }}>
          <select
            value={selectedConnId}
            onChange={(e) => {
              setSelectedConnId(e.target.value);
              setSelectedAccountId(null);
            }}
            className="rounded-[var(--radius-medium)] text-[13px]"
            style={{
              height: 'var(--control-height)',
              backgroundColor: 'var(--color-bg-input)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              padding: '0 12px',
              minWidth: 200,
            }}
          >
            <option value="">Select brokerage...</option>
            {connections.map((conn: SnaptradeConnection) => (
              <option key={conn.authorizationId} value={conn.authorizationId}>
                {conn.institutionName || 'Unknown'}
              </option>
            ))}
          </select>

          <select
            value={selectedAccountId ?? ''}
            onChange={(e) => setSelectedAccountId(e.target.value || null)}
            disabled={!selectedConnId}
            className="rounded-[var(--radius-medium)] text-[13px]"
            style={{
              height: 'var(--control-height)',
              backgroundColor: 'var(--color-bg-input)',
              color: selectedConnId ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
              padding: '0 12px',
              minWidth: 200,
            }}
          >
            <option value="">Select account...</option>
            {accounts.map((a) => (
              <option key={a.accountId} value={a.accountId}>
                {a.name || a.accountId}{a.number ? ` (${a.number})` : ''}
              </option>
            ))}
          </select>

          {selectedAccountId && (transactions.length > 0 || (rawHoldings?.positions?.length ?? 0) > 0) && (
            <div style={{ width: 140 }}>
              <SegmentControl<CurrencyFilter>
                value={currencyFilter}
                optionsWithLabels={[
                  { value: 'all', label: 'All' },
                  { value: 'CAD', label: 'CAD' },
                  { value: 'USD', label: 'USD' },
                ]}
                onChange={(v) => setCurrencyFilter(v)}
              />
            </div>
          )}

          {selectedAccountId && (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleSync}
              disabled={syncMut.isPending}
              className="min-w-[100px] px-4"
            >
              {syncMut.isPending ? 'Syncing...' : 'Sync'}
            </Button>
          )}
        </div>

        {/* Content */}
        {!selectedAccountId ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-body)', padding: '24px 0' }}>
            Select a brokerage and account to view transactions.
          </p>
        ) : isLoading ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-body)', padding: '24px 0' }}>
            Loading...
          </p>
        ) : !hasData ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-body)', padding: '24px 0' }}>
            No transactions found. Click Sync to fetch transactions from SnapTrade (requires orders data).
          </p>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 overflow-auto" style={{ gap: 'var(--space-section)' }}>
            <TableSection title="Holdings">
              <HoldingsTable holdings={filteredRawHoldings} />
            </TableSection>
            <TableSection title="Balance">
              <BalanceTable holdings={filteredRawHoldings} />
            </TableSection>
            <TableSection title="Transactions" count={filteredTxns.length}>
              <TxnTable transactions={filteredTxns} />
            </TableSection>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ── Table section (title above table) ──────────────── */

function TableSection({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <div className="flex flex-col shrink-0" style={{ gap: 'var(--space-gap)' }}>
      <div className="flex items-center justify-between">
        <h3
          className="font-medium"
          style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)', margin: 0 }}
        >
          {title}
        </h3>
        {count != null && (
          <span className="tabular-nums" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

/* ── 1. Holdings table ─────────────────────────────── */

interface HoldingsData {
  positions: Array<{
    symbol: string;
    quantity: number;
    averagePrice?: number;
    currency?: string;
    isOption?: boolean;
    category?: string;
  }>;
  cash?: number;
  cashByCurrency?: Record<string, number>;
}

function HoldingsTable({ holdings }: { holdings: HoldingsData | null }) {
  if (!holdings) {
    return (
      <div
        className="rounded-[var(--radius-medium)] shrink-0"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', padding: 12 }}>No data (click Sync first)</div>
      </div>
    );
  }
  const sorted = [...holdings.positions].sort((a, b) => a.symbol.localeCompare(b.symbol));

  return (
    <div
      className="rounded-[var(--radius-medium)] shrink-0 overflow-hidden"
      style={{ border: '1px solid var(--color-border)' }}
    >
      <table className="w-full text-[11px]" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{
                color: 'var(--color-text-muted)',
                fontSize: 10,
                borderBottom: '1px solid var(--color-border)',
                position: 'sticky',
                top: 0,
                backgroundColor: 'var(--palette-offblack)',
                zIndex: 1,
              }}
            >
              <th className="text-left font-medium py-1.5 px-2">Symbol</th>
              <th className="text-left font-medium py-1.5 px-2">Category</th>
              <th className="text-right font-medium py-1.5 px-2">Quantity</th>
              <th className="text-right font-medium py-1.5 px-2">Avg Price</th>
              <th className="text-right font-medium py-1.5 px-2">Est. Value</th>
              <th className="text-center font-medium py-1.5 px-2">Ccy</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const avgPrice = p.averagePrice ?? 0;
              const qty = p.quantity ?? 0;
              const isOption = p.isOption || !['stock', 'etf', 'stock_etf'].includes(p.category ?? 'stock');
              const multiplier = isOption ? 100 : 1;
              const estValue = avgPrice * Math.abs(qty) * multiplier * (qty >= 0 ? 1 : -1);
              return (
                <tr
                  key={p.symbol}
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <td className="py-1 px-2 font-medium whitespace-nowrap">{p.symbol}</td>
                  <td className="py-1 px-2">
                    <span
                      className="inline-block rounded px-1.5 py-0.5 text-[9px] font-medium"
                      style={{ backgroundColor: 'rgba(0, 122, 255, 0.15)', color: 'var(--color-accent)' }}
                    >
                      {formatCategory(p.category) || '—'}
                    </span>
                  </td>
                  <td
                    className="py-1 px-2 text-right tabular-nums font-medium"
                    style={{
                      color: qty >= 0 ? 'var(--color-text-primary)' : 'var(--color-negative)',
                    }}
                  >
                    {formatQty(p.quantity)}
                  </td>
                  <td className="py-1 px-2 text-right tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
                    {avgPrice ? `$${formatNum(avgPrice)}` : '—'}
                  </td>
                  <td
                    className="py-1 px-2 text-right tabular-nums"
                    style={{
                      color: estValue >= 0 ? 'var(--color-text-primary)' : 'var(--color-negative)',
                    }}
                  >
                    {avgPrice && qty ? `$${formatNum(estValue)}` : '—'}
                  </td>
                  <td className="py-1 px-2 text-center" style={{ color: 'var(--color-text-muted)', fontSize: 10 }}>
                    {p.currency || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
    </div>
  );
}

/* ── 2. Balance table ───────────────────────────────── */

function BalanceTable({ holdings }: { holdings: HoldingsData | null }) {
  const cashByCurrency = holdings?.cashByCurrency ?? (holdings?.cash != null ? { USD: holdings.cash } : {});

  if (!holdings || Object.keys(cashByCurrency).length === 0) {
    return (
      <div
        className="rounded-[var(--radius-medium)] shrink-0"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', padding: 12 }}>No data (click Sync first)</div>
      </div>
    );
  }

  const entries = Object.entries(cashByCurrency).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div
      className="rounded-[var(--radius-medium)] shrink-0 overflow-hidden"
      style={{ border: '1px solid var(--color-border)' }}
    >
      <table className="w-full text-[11px]" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr
            style={{
              color: 'var(--color-text-muted)',
              fontSize: 10,
              borderBottom: '1px solid var(--color-border)',
              backgroundColor: 'var(--palette-offblack)',
            }}
          >
            <th className="text-left font-medium py-1.5 px-2">Currency</th>
            <th className="text-right font-medium py-1.5 px-2">Cash</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([ccy, amt]) => (
            <tr
              key={ccy}
              style={{
                borderBottom: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              <td className="py-1 px-2 font-medium">{ccy}</td>
              <td
                className="py-1 px-2 text-right tabular-nums font-medium"
                style={{
                  color: amt >= 0 ? 'var(--color-text-primary)' : 'var(--color-negative)',
                }}
              >
                ${formatNum(amt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Shared transaction table ──────────────────────── */

function TxnTable({ transactions }: { transactions: SyncedTransaction[] }) {
  if (transactions.length === 0) {
    return (
      <p style={{ color: 'var(--color-text-muted)', fontSize: 12, padding: '16px 0' }}>
        No transactions.
      </p>
    );
  }

  return (
    <div
      className="rounded-[var(--radius-medium)] overflow-hidden shrink-0"
      style={{ border: '1px solid var(--color-border)' }}
    >
      <table className="w-full text-[11px]" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr
            style={{
              color: 'var(--color-text-muted)',
              fontSize: 10,
              borderBottom: '1px solid var(--color-border)',
              position: 'sticky',
              top: 0,
              backgroundColor: 'var(--palette-offblack)',
              zIndex: 1,
            }}
          >
            <th className="text-left font-medium py-1.5 px-2">Date</th>
            <th className="text-left font-medium py-1.5 px-2">Side</th>
            <th className="text-left font-medium py-1.5 px-2">Symbol</th>
            <th className="text-left font-medium py-1.5 px-2">Option</th>
            <th className="text-right font-medium py-1.5 px-2">Qty</th>
            <th className="text-right font-medium py-1.5 px-2">Price</th>
            <th className="text-right font-medium py-1.5 px-2">Cash Delta</th>
            <th className="text-center font-medium py-1.5 px-2">Ccy</th>
            <th className="text-left font-medium py-1.5 px-2">Category</th>
            <th className="text-left font-medium py-1.5 px-2">Custom Data</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr
              key={tx._id}
              style={{
                borderBottom: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              <td className="py-1 px-2 whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>
                {tx.timestamp?.slice(0, 10) ?? '—'}
              </td>
              <td className="py-1 px-2">
                <span
                  className="inline-block rounded-[var(--radius-medium)] px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap"
                  style={{ backgroundColor: sideColor(tx.side), color: 'var(--color-text-primary)' }}
                >
                  {tx.side}
                </span>
              </td>
              <td className="py-1 px-2 font-medium whitespace-nowrap">{tx.instrumentSymbol || '—'}</td>
              <td className="py-1 px-2 whitespace-nowrap" style={{ color: 'var(--color-text-secondary)', fontSize: 10 }}>
                {formatOption(tx.option)}
              </td>
              <td className="py-1 px-2 text-right tabular-nums">
                {tx.quantity ? formatNum(tx.quantity) : '—'}
              </td>
              <td className="py-1 px-2 text-right tabular-nums">
                {tx.price ? `$${formatNum(tx.price)}` : '—'}
              </td>
              <td
                className="py-1 px-2 text-right tabular-nums"
                style={{
                  color: tx.cashDelta > 0
                    ? 'var(--color-positive)'
                    : tx.cashDelta < 0
                      ? 'var(--color-negative)'
                      : 'var(--color-text-secondary)',
                }}
              >
                {tx.cashDelta ? `$${formatNum(tx.cashDelta)}` : '—'}
              </td>
              <td className="py-1 px-2 text-center" style={{ color: 'var(--color-text-muted)', fontSize: 10 }}>
                {tx.currency || '—'}
              </td>
              <td className="py-1 px-2" style={{ color: 'var(--color-text-secondary)', fontSize: 10 }}>
                {formatCategory(tx.category) || '—'}
              </td>
              <td className="py-1 px-2" style={{ color: 'var(--color-text-muted)', fontSize: 9, maxWidth: 200, whiteSpace: 'pre-line', lineHeight: 1.4 }}>
                {formatCustomData(tx.customData)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────── */

function formatOption(option: SyncedTransaction['option']): string {
  if (!option) return '—';
  const parts: string[] = [];
  if (option.strike) parts.push(`$${option.strike}`);
  if (option.callPut) parts.push(option.callPut.toUpperCase());
  if (option.expiration) parts.push(option.expiration.slice(0, 10));
  return parts.join(' ') || '—';
}

function formatOptionLeg(leg: unknown): string {
  if (!leg || typeof leg !== 'object') return '';
  const L = leg as Record<string, unknown>;
  const strike = L.strike ?? '';
  const cp = String(L.callPut ?? '').charAt(0).toUpperCase();
  const exp = (String(L.expiration ?? '').slice(0, 10));
  return strike ? `$${strike}${cp} ${exp}` : '';
}

function formatCustomData(customData?: Record<string, unknown> | null): string {
  if (!customData || Object.keys(customData).length === 0) return '—';
  const lines: string[] = [];
  if (customData.chainId) lines.push(`chain: ${String(customData.chainId)}`);
  if (customData.closeLeg) lines.push(`close: ${formatOptionLeg(customData.closeLeg)}`);
  if (customData.openLeg) lines.push(`open: ${formatOptionLeg(customData.openLeg)}`);
  return lines.length > 0 ? lines.join('\n') : JSON.stringify(customData).slice(0, 80);
}

function sideColor(side: string): string {
  switch (side) {
    case 'buy': return 'rgba(40, 194, 7, 0.15)';
    case 'sell': return 'rgba(255, 59, 48, 0.15)';
    case 'dividend': return 'rgba(0, 122, 255, 0.15)';
    case 'deposit': return 'rgba(40, 194, 7, 0.10)';
    case 'withdrawal': return 'rgba(255, 59, 48, 0.10)';
    case 'refund': return 'rgba(0, 122, 255, 0.10)';
    case 'funds_conversion': return 'rgba(255, 165, 0, 0.10)';
    default: return 'rgba(255, 255, 255, 0.05)';
  }
}

function formatCategory(cat: string | undefined): string {
  if (!cat) return '';
  if (cat === 'stock' || cat === 'etf' || cat === 'stock_etf') return 'Stock & ETF';
  if (cat === 'transfer') return 'Transfer';
  if (cat === 'unknown') return 'Unknown';
  return cat;
}

function formatNum(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatQty(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}
