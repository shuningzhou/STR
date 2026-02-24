import { useState, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import {
  useSnaptradeConnections,
  useAccountTransactions,
  useRebuildAccount,
  type SnaptradeConnection,
} from '@/api/hooks';

interface Props {
  onClose: () => void;
}

export function AccountTransactionsModal({ onClose }: Props) {
  const { data: connections = [] } = useSnaptradeConnections();
  const [selectedConnId, setSelectedConnId] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const selectedConn = useMemo(
    () => connections.find((c: SnaptradeConnection) => c.authorizationId === selectedConnId),
    [connections, selectedConnId],
  );

  const accounts = useMemo(() => selectedConn?.accounts ?? [], [selectedConn]);

  const { data: transactions = [], isLoading } = useAccountTransactions(selectedAccountId);
  const rebuildMut = useRebuildAccount();

  const sorted = useMemo(
    () => [...transactions].sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    [transactions],
  );

  const handleRebuild = () => {
    if (!selectedAccountId) return;
    rebuildMut.mutate(selectedAccountId);
  };

  return (
    <Modal title="Account Transactions" onClose={onClose} size="xl">
      <div className="flex flex-col" style={{ gap: 'var(--space-gap)' }}>
        {/* Filters */}
        <div className="flex items-center" style={{ gap: 'var(--space-gap)' }}>
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

          {selectedAccountId && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleRebuild}
              disabled={rebuildMut.isPending}
              className="gap-1 shrink-0"
            >
              <RefreshCw size={14} strokeWidth={1.5} className={rebuildMut.isPending ? 'animate-spin' : ''} />
              {rebuildMut.isPending ? 'Rebuilding...' : 'Rebuild'}
            </Button>
          )}
        </div>

        {/* Table */}
        {!selectedAccountId ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-body)', padding: '24px 0' }}>
            Select a brokerage and account to view adjusted transactions.
          </p>
        ) : isLoading ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-body)', padding: '24px 0' }}>
            Loading...
          </p>
        ) : sorted.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-body)', padding: '24px 0' }}>
            No transactions found. Click Rebuild to fetch and sanitize transactions from SnapTrade.
          </p>
        ) : (
          <div className="overflow-auto" style={{ maxHeight: 480 }}>
            <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr
                  style={{
                    color: 'var(--color-text-muted)',
                    fontSize: 11,
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <th className="text-left font-medium py-2 px-2">Date</th>
                  <th className="text-left font-medium py-2 px-2">Side</th>
                  <th className="text-left font-medium py-2 px-2">Symbol</th>
                  <th className="text-right font-medium py-2 px-2">Qty</th>
                  <th className="text-right font-medium py-2 px-2">Price</th>
                  <th className="text-right font-medium py-2 px-2">Cash Delta</th>
                  <th className="text-center font-medium py-2 px-2">Synthetic</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((tx) => (
                  <tr
                    key={tx._id}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      backgroundColor: tx.synthetic ? 'rgba(40, 194, 7, 0.05)' : 'transparent',
                    }}
                  >
                    <td className="py-1.5 px-2" style={{ color: 'var(--color-text-secondary)' }}>
                      {tx.timestamp?.slice(0, 10) ?? '—'}
                    </td>
                    <td className="py-1.5 px-2">
                      <span
                        className="inline-block rounded-[var(--radius-medium)] px-1.5 py-0.5 text-[11px] font-medium"
                        style={{
                          backgroundColor: sideColor(tx.side),
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        {tx.side}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 font-medium">{tx.instrumentSymbol || '—'}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums">
                      {tx.quantity ? formatNum(tx.quantity) : '—'}
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums">
                      {tx.price ? `$${formatNum(tx.price)}` : '—'}
                    </td>
                    <td
                      className="py-1.5 px-2 text-right tabular-nums"
                      style={{ color: tx.cashDelta > 0 ? 'var(--color-positive)' : tx.cashDelta < 0 ? 'var(--color-negative)' : 'var(--color-text-secondary)' }}
                    >
                      {tx.cashDelta ? `$${formatNum(tx.cashDelta)}` : '—'}
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      {tx.synthetic && (
                        <span
                          className="inline-block rounded-[var(--radius-pill)] px-2 py-0.5 text-[10px] font-semibold"
                          style={{
                            backgroundColor: 'rgba(40, 194, 7, 0.15)',
                            color: 'var(--color-accent)',
                          }}
                        >
                          synthetic
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}

function sideColor(side: string): string {
  switch (side) {
    case 'buy': return 'rgba(40, 194, 7, 0.15)';
    case 'sell': return 'rgba(255, 59, 48, 0.15)';
    case 'dividend': return 'rgba(0, 122, 255, 0.15)';
    case 'deposit': return 'rgba(40, 194, 7, 0.10)';
    case 'withdrawal': return 'rgba(255, 59, 48, 0.10)';
    default: return 'rgba(255, 255, 255, 0.05)';
  }
}

function formatNum(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
