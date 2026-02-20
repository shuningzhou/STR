import { useEffect, useMemo } from 'react';
import { X, Pencil, Trash2, Plus } from 'lucide-react';
import { useStrategyStore } from '@/store/strategy-store';
import { useUIStore } from '@/store/ui-store';
import { Button } from '@/components/ui';
import type { StrategyTransaction } from '@/store/strategy-store';
const PANEL_WIDTH = 1100;
const CELL_PADDING = 5;

export function TransactionListPanel() {
  const transactionListPanelOpen = useUIStore((s) => s.transactionListPanelOpen);
  const setTransactionListPanelOpen = useUIStore((s) => s.setTransactionListPanelOpen);
  const setAddTransactionModalOpen = useUIStore((s) => s.setAddTransactionModalOpen);
  const setDeleteTransactionConfirmOpen = useUIStore((s) => s.setDeleteTransactionConfirmOpen);
  const setEditTransactionModalOpen = useUIStore((s) => s.setEditTransactionModalOpen);
  const strategies = useStrategyStore((s) => s.strategies);

  const strategyId = transactionListPanelOpen;
  const strategy = useMemo(
    () => strategies.find((s) => s.id === strategyId),
    [strategies, strategyId]
  );
  const transactions = strategy?.transactions ?? [];

  const sortedTransactions = useMemo(
    () => [...transactions].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')),
    [transactions]
  );

  const handleClose = () => setTransactionListPanelOpen(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const handleAdd = () => {
    if (strategyId) {
      setAddTransactionModalOpen({ strategyId, mode: 'full' });
    }
  };

  const handleEdit = (tx: StrategyTransaction) => {
    setEditTransactionModalOpen({ strategyId: strategyId!, transaction: tx, mode: 'full' });
  };

  const handleDelete = (txId: number) => {
    setDeleteTransactionConfirmOpen({ strategyId: strategyId!, transactionId: txId });
  };

  const formatDate = (ts: string) => ts?.slice(0, 10) ?? '—';
  const formatCurrency = (n: number) =>
    n >= 0 ? `$${n.toFixed(2)}` : `-$${Math.abs(n).toFixed(2)}`;
  const formatOption = (tx: StrategyTransaction) =>
    tx.option
      ? `${tx.option.expiration?.slice(0, 10) ?? '—'} ${tx.option.strike} ${(tx.option.callPut ?? '').toUpperCase()}`
      : '—';
  const formatOptionRoll = (tx: StrategyTransaction) => {
    const r = tx.optionRoll;
    if (!r?.option || !r?.optionRolledTo) return '—';
    const from = `${r.option.expiration?.slice(0, 10) ?? ''} ${r.option.strike} ${(r.option.callPut ?? '').toUpperCase()}`.trim();
    const to = `${r.optionRolledTo.expiration?.slice(0, 10) ?? ''} ${r.optionRolledTo.strike} ${(r.optionRolledTo.callPut ?? '').toUpperCase()}`.trim();
    return `${from} → ${to}`;
  };
  const formatCustomData = (tx: StrategyTransaction) => {
    const d = tx.customData;
    if (!d || Object.keys(d).length === 0) return '—';
    try {
      const s = JSON.stringify(d);
      return s.length > 40 ? `${s.slice(0, 40)}…` : s;
    } catch {
      return '…';
    }
  };

  if (!strategyId) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        role="button"
        tabIndex={-1}
        aria-label="Close transaction list"
        className="fixed inset-0 z-20 bg-black/60"
        style={{
          opacity: transactionListPanelOpen ? 1 : 0,
          pointerEvents: transactionListPanelOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
        onClick={handleClose}
      />

      {/* Slide-out panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-20 flex flex-col border-l"
        style={{
          width: PANEL_WIDTH,
          maxWidth: '95vw',
          backgroundColor: 'var(--palette-offblack)',
          borderColor: 'var(--color-border)',
          boxShadow: '-4px 0 24px var(--color-shadow)',
          transform: transactionListPanelOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-list-title"
      >
        {/* Header — same height as subview top bar */}
        <div
          className="flex items-center shrink-0 px-4 border-b gap-2"
          style={{
            borderColor: 'var(--color-border)',
            minHeight: 'var(--subview-top-bar-height)',
            height: 'var(--subview-top-bar-height)',
          }}
        >
          <h2
            id="transaction-list-title"
            className="font-semibold truncate flex-1 min-w-0"
            style={{
              fontSize: 'var(--font-size-body)',
              color: 'var(--color-text-primary)',
              paddingLeft: 5,
            }}
          >
            Transactions — {strategy?.name ?? 'Strategy'}
          </h2>
          <button
            type="button"
            className="w-5 h-5 shrink-0 flex items-center justify-center rounded-[var(--radius-medium)] transition-colors"
            style={{
              backgroundColor: 'var(--color-active)',
              color: 'var(--color-text-on-primary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-primary-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-active)';
            }}
            onClick={handleAdd}
            title="Add Transaction"
          >
            <Plus size={10} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="w-5 h-5 shrink-0 flex items-center justify-center rounded-[var(--radius-medium)] hover:bg-[var(--color-bg-hover)] transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Close"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        {/* Transaction list — styled like subview Stock & ETF table */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {sortedTransactions.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 px-4 text-center"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <p className="text-sm font-medium mb-1">No transactions yet</p>
              <p className="text-xs mb-4">Add your first transaction to get started</p>
              <Button type="button" variant="secondary" size="sm" onClick={handleAdd}>
                Add Transaction
              </Button>
            </div>
          ) : (
            <div
              className="subview-table-container flex flex-col min-w-full w-full overflow-hidden flex-1 min-h-0"
              style={{
                borderTop: '1px solid var(--color-table-border)',
                borderBottom: '1px solid var(--color-table-border)',
                backgroundColor: 'var(--color-bg-input)',
              }}
            >
              <div className="overflow-auto min-h-0 min-w-0 flex-1 subview-table-body w-full">
                <table
                  className="w-full border-collapse"
                  style={{ tableLayout: 'auto', width: '100%', fontSize: 12, minWidth: 840 }}
                >
                  <colgroup>
                    <col style={{ width: 36 }} />
                    <col style={{ width: 90 }} />
                    <col style={{ width: 60 }} />
                    <col style={{ width: 50 }} />
                    <col style={{ width: 48 }} />
                    <col style={{ width: 58 }} />
                    <col style={{ width: 72 }} />
                    <col style={{ width: 140 }} />
                    <col style={{ width: 200 }} />
                    <col style={{ width: 80 }} />
                    <col style={{ width: 56 }} />
                  </colgroup>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr style={{ backgroundColor: 'var(--color-table-header-bg)' }}>
                      {[
                        ['Id', 'text-right'],
                        ['Date', 'text-left'],
                        ['Symbol', 'text-left'],
                        ['Side', 'text-left'],
                        ['Qty', 'text-right'],
                        ['Price', 'text-right'],
                        ['Amount', 'text-right'],
                        ['Option', 'text-left'],
                        ['Option Roll', 'text-left'],
                        ['Custom', 'text-left'],
                      ].map(([label]) => (
                        <th
                          key={String(label)}
                          className="font-medium"
                          style={{
                            color: 'var(--color-table-header-text)',
                            borderBottom: '1px solid var(--color-table-border)',
                            borderRight: '1px solid var(--color-table-border)',
                            padding: CELL_PADDING,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {label}
                        </th>
                      ))}
                      <th
                        style={{
                          borderBottom: '1px solid var(--color-table-border)',
                          padding: CELL_PADDING,
                          whiteSpace: 'nowrap',
                        }}
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTransactions.map((tx) => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid var(--color-table-border)' }}>
                        <td
                          className="text-right"
                          style={{
                            color: 'var(--color-text-primary)',
                            borderRight: '1px solid var(--color-table-border)',
                            padding: CELL_PADDING,
                          }}
                        >
                          {tx.id}
                        </td>
                        <td
                          style={{
                            color: 'var(--color-text-primary)',
                            borderRight: '1px solid var(--color-table-border)',
                            padding: CELL_PADDING,
                          }}
                        >
                          {formatDate(tx.timestamp)}
                        </td>
                        <td
                          className="truncate"
                          style={{
                            color: 'var(--color-text-primary)',
                            borderRight: '1px solid var(--color-table-border)',
                            padding: CELL_PADDING,
                          }}
                        >
                          {tx.instrumentSymbol ?? '—'}
                        </td>
                        <td
                          style={{
                            color: 'var(--color-text-primary)',
                            borderRight: '1px solid var(--color-table-border)',
                            padding: CELL_PADDING,
                          }}
                        >
                          {tx.side}
                        </td>
                        <td
                          className="text-right"
                          style={{
                            color: 'var(--color-text-primary)',
                            borderRight: '1px solid var(--color-table-border)',
                            padding: CELL_PADDING,
                          }}
                        >
                          {tx.quantity}
                        </td>
                        <td
                          className="text-right"
                          style={{
                            color: 'var(--color-text-primary)',
                            borderRight: '1px solid var(--color-table-border)',
                            padding: CELL_PADDING,
                          }}
                        >
                          ${tx.price.toFixed(2)}
                        </td>
                        <td
                          className="text-right"
                          style={{
                            color:
                              tx.cashDelta < 0
                                ? 'var(--color-negative)'
                                : 'var(--color-positive, var(--color-active))',
                            borderRight: '1px solid var(--color-table-border)',
                            padding: CELL_PADDING,
                          }}
                        >
                          {formatCurrency(tx.cashDelta)}
                        </td>
                        <td
                          style={{
                            color: 'var(--color-text-primary)',
                            borderRight: '1px solid var(--color-table-border)',
                            padding: CELL_PADDING,
                            whiteSpace: 'nowrap',
                            minWidth: 140,
                          }}
                          title={formatOption(tx)}
                        >
                          {formatOption(tx)}
                        </td>
                        <td
                          style={{
                            color: 'var(--color-text-primary)',
                            borderRight: '1px solid var(--color-table-border)',
                            padding: CELL_PADDING,
                            whiteSpace: 'nowrap',
                            minWidth: 200,
                          }}
                          title={formatOptionRoll(tx)}
                        >
                          {formatOptionRoll(tx)}
                        </td>
                        <td
                          className="truncate max-w-[80px]"
                          style={{
                            color: 'var(--color-text-primary)',
                            borderRight: '1px solid var(--color-table-border)',
                            padding: CELL_PADDING,
                          }}
                          title={formatCustomData(tx)}
                        >
                          {formatCustomData(tx)}
                        </td>
                        <td style={{ paddingTop: CELL_PADDING, paddingBottom: CELL_PADDING, paddingLeft: 10, paddingRight: 10, whiteSpace: 'nowrap', textAlign: 'center' }}>
                          <div className="inline-flex shrink-0" style={{ gap: 10 }}>
                            <button
                              type="button"
                              className="p-1 rounded"
                              style={{ color: 'var(--color-text-secondary)' }}
                              onClick={() => handleEdit(tx)}
                              title="Edit"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              type="button"
                              className="p-1 rounded"
                              style={{ color: 'var(--color-text-secondary)' }}
                              onClick={() => handleDelete(tx.id)}
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
