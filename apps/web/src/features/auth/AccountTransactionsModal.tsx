import { useState, useMemo } from 'react';
import { Modal, Button, SegmentControl } from '@/components/ui';
import {
  useSnaptradeConnections,
  useAccountTransactions,
  useRebuildAccount,
  type SnaptradeConnection,
  type AdjustedTransaction,
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
  const rebuildMut = useRebuildAccount();

  const rawTransactions = txData?.rawTransactions ?? [];
  const adjustedTransactions = txData?.adjustedTransactions ?? [];
  const rawHoldings = txData?.rawHoldings ?? null;
  const derivedHoldings = txData?.derivedHoldings ?? { positions: [], cashByCurrency: {} };

  const filterByCurrency = useMemo(() => {
    if (currencyFilter === 'all') return (t: AdjustedTransaction) => true;
    return (t: AdjustedTransaction) => (t.currency || 'USD') === currencyFilter;
  }, [currencyFilter]);

  const filterPositionsByCurrency = useMemo(() => {
    if (currencyFilter === 'all') return () => true;
    return (p: { currency?: string }) => (p.currency || 'USD') === currencyFilter;
  }, [currencyFilter]);

  const rawTxns = useMemo(() => {
    const base = [...rawTransactions].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    return currencyFilter === 'all' ? base : base.filter(filterByCurrency);
  }, [rawTransactions, currencyFilter, filterByCurrency]);

  const adjustedTxns = useMemo(() => {
    const base = [...adjustedTransactions].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    return currencyFilter === 'all' ? base : base.filter(filterByCurrency);
  }, [adjustedTransactions, currencyFilter, filterByCurrency]);

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

  const filteredDerivedHoldings = useMemo(() => {
    const positions = (derivedHoldings.positions ?? []).filter(filterPositionsByCurrency);
    const cashByCurrency = derivedHoldings.cashByCurrency ?? {};
    const filteredCash =
      currencyFilter === 'all'
        ? cashByCurrency
        : currencyFilter in cashByCurrency
          ? { [currencyFilter]: cashByCurrency[currencyFilter] }
          : {};
    return { positions, cashByCurrency: filteredCash };
  }, [derivedHoldings, currencyFilter, filterPositionsByCurrency]);

  const handleRebuild = () => {
    if (!selectedAccountId) return;
    rebuildMut.mutate(selectedAccountId);
  };

  const hasData = rawTxns.length > 0 || adjustedTxns.length > 0;

  return (
    <Modal title="Account Transactions" onClose={onClose} size="2xl" className="!max-w-[96vw] !min-h-[88vh]">
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

          {selectedAccountId && (rawTransactions.length > 0 || adjustedTransactions.length > 0) && (
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
              onClick={handleRebuild}
              disabled={rebuildMut.isPending}
              className="shrink-0 min-w-[140px] px-6"
            >
              {rebuildMut.isPending ? 'Sanitizing...' : 'Sanitize'}
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
            No transactions found. Click Sanitize to fetch and sanitize transactions from SnapTrade.
          </p>
        ) : (
          <div className="grid grid-cols-2 flex-1 min-h-0" style={{ gap: 16 }}>
            {/* Raw column */}
            <div className="flex flex-col min-h-0" style={{ gap: 'var(--space-gap)' }}>
              <div className="flex items-center justify-between shrink-0">
                <h3
                  className="font-medium"
                  style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)', margin: 0 }}
                >
                  Raw Transactions
                </h3>
                <span className="tabular-nums" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  {rawTxns.length}
                </span>
              </div>
              <HoldingsSummary holdings={filteredRawHoldings} label="SnapTrade holdings" />
              <TxnTable transactions={rawTxns} showSynthetic={false} />
            </div>

            {/* Adjusted column */}
            <div className="flex flex-col min-h-0" style={{ gap: 'var(--space-gap)' }}>
              <div className="flex items-center justify-between shrink-0">
                <h3
                  className="font-medium"
                  style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)', margin: 0 }}
                >
                  Adjusted Transactions
                </h3>
                <span className="tabular-nums" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  {adjustedTxns.length}
                </span>
              </div>
              <HoldingsSummary holdings={filteredDerivedHoldings} label="Derived from adjusted txns" />
              <TxnTable transactions={adjustedTxns} showSynthetic />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ── Holdings summary ──────────────────────────────── */

interface HoldingsSummaryProps {
  holdings: {
    positions: Array<{
      symbol: string;
      quantity: number;
      averagePrice?: number;
      currency?: string;
      isOption?: boolean;
    }>;
    cash?: number;
    cashByCurrency?: Record<string, number>;
  } | null;
  label: string;
}

function HoldingsSummary({ holdings, label }: HoldingsSummaryProps) {
  if (!holdings) {
    return (
      <div
        className="rounded-[var(--radius-medium)] px-3 py-2 shrink-0"
        style={{ backgroundColor: 'var(--color-bg-input)', border: '1px solid var(--color-border)' }}
      >
        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>No data (run Sanitize first)</div>
      </div>
    );
  }
  const sorted = [...holdings.positions].sort((a, b) => a.symbol.localeCompare(b.symbol));
  const cashByCurrency = holdings.cashByCurrency ?? (holdings.cash != null ? { USD: holdings.cash } : {});
  return (
    <div
      className="rounded-[var(--radius-medium)] px-3 py-2 shrink-0"
      style={{ backgroundColor: 'var(--color-bg-input)', border: '1px solid var(--color-border)' }}
    >
      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</div>
      <ul
        className="list-none m-0 p-0"
        style={{ fontSize: 11, color: 'var(--color-text-primary)', lineHeight: 1.6 }}
      >
        {sorted.map((p) => (
          <li key={p.symbol} className="flex justify-between gap-4">
            <span>
              {p.symbol}
              {p.isOption && (
                <span
                  className="ml-1 px-1 rounded text-[9px]"
                  style={{ backgroundColor: 'rgba(0, 122, 255, 0.15)', color: 'var(--color-accent)' }}
                >
                  opt
                </span>
              )}
            </span>
            <span className="tabular-nums font-medium shrink-0">
              {formatQty(p.quantity)}
            </span>
          </li>
        ))}
      </ul>
      <div style={{ fontSize: 11, color: 'var(--color-text-primary)', marginTop: 4, paddingTop: 4, borderTop: '1px solid var(--color-border)' }}>
        {Object.keys(cashByCurrency).length === 0 ? (
          'Cash: —'
        ) : (
          Object.entries(cashByCurrency).map(([ccy, amt]) => (
            <div key={ccy}>
              Cash ({ccy}): <span className="tabular-nums font-medium">${formatNum(amt)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ── Shared transaction table ──────────────────────── */

function TxnTable({
  transactions,
  showSynthetic,
}: {
  transactions: AdjustedTransaction[];
  showSynthetic: boolean;
}) {
  if (transactions.length === 0) {
    return (
      <p style={{ color: 'var(--color-text-muted)', fontSize: 12, padding: '16px 0' }}>
        No transactions.
      </p>
    );
  }

  return (
    <div
      className="flex-1 min-h-0 overflow-auto rounded-[var(--radius-medium)]"
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
            {showSynthetic && <th className="text-center font-medium py-1.5 px-2">Syn</th>}
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr
              key={tx._id}
              style={{
                borderBottom: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                backgroundColor: tx.synthetic ? 'rgba(40, 194, 7, 0.05)' : 'transparent',
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
              {showSynthetic && (
                <td className="py-1 px-2 text-center">
                  {tx.synthetic && (
                    <span
                      className="inline-block rounded-[var(--radius-pill)] px-1.5 py-0.5 text-[9px] font-semibold"
                      style={{ backgroundColor: 'rgba(40, 194, 7, 0.15)', color: 'var(--color-accent)' }}
                    >
                      syn
                    </span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────── */

function formatOption(option: AdjustedTransaction['option']): string {
  if (!option) return '—';
  const parts: string[] = [];
  if (option.strike) parts.push(`$${option.strike}`);
  if (option.callPut) parts.push(option.callPut.toUpperCase());
  if (option.expiration) parts.push(option.expiration.slice(0, 10));
  return parts.join(' ') || '—';
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

function formatNum(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatQty(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}
