import { useUIStore } from '@/store/ui-store';
import { Modal, Button } from '@/components/ui';
import { useDeleteTransaction } from '@/api/hooks';

function formatDate(ts: string) {
  return ts?.slice(0, 10) ?? '—';
}

function formatAmount(n: number) {
  return n >= 0 ? `$${n.toFixed(2)}` : `-$${Math.abs(n).toFixed(2)}`;
}

function formatOptionLabel(tx: { option?: { expiration?: string; strike?: number; callPut?: string } | null }) {
  const opt = tx.option;
  if (!opt) return null;
  const exp = opt.expiration?.slice(0, 10) ?? '—';
  const strike = opt.strike ?? '—';
  const cp = (opt.callPut ?? 'call').toUpperCase();
  return `${exp} ${strike} ${cp}`;
}

export function DeleteTransactionConfirmModal() {
  const deleteTransactionConfirmOpen = useUIStore((s) => s.deleteTransactionConfirmOpen);
  const setDeleteTransactionConfirmOpen = useUIStore((s) => s.setDeleteTransactionConfirmOpen);
  const deleteTx = useDeleteTransaction();

  const strategyId = deleteTransactionConfirmOpen?.strategyId ?? null;
  const transaction = deleteTransactionConfirmOpen?.transaction ?? null;
  const transactions = deleteTransactionConfirmOpen?.transactions ?? null;

  const toDelete = transactions && transactions.length > 0 ? transactions : transaction ? [transaction] : [];

  const handleConfirm = async () => {
    if (strategyId == null || toDelete.length === 0) {
      setDeleteTransactionConfirmOpen(null);
      return;
    }
    for (const tx of toDelete) {
      await deleteTx.mutateAsync({ id: String(tx.id), strategyId });
    }
    setDeleteTransactionConfirmOpen(null);
  };

  const handleClose = () => {
    setDeleteTransactionConfirmOpen(null);
  };

  if (!deleteTransactionConfirmOpen || strategyId == null || toDelete.length === 0) return null;

  const isSpread = toDelete.length > 1;
  const optionLabel = toDelete.length === 1 ? formatOptionLabel(toDelete[0]) : null;

  return (
    <Modal title={isSpread ? 'Delete spread' : 'Delete transaction'} onClose={handleClose}>
      <div
        className="text-[13px]"
        style={{ color: 'var(--color-text-secondary)', marginBottom: 20 }}
      >
        <p style={{ marginBottom: 8 }}>
          {isSpread
            ? `Delete this spread (${toDelete.length} transactions)? This action cannot be undone.`
            : 'Delete this transaction? This action cannot be undone.'}
        </p>
        <div
          className="rounded-[var(--radius-medium)] p-3"
          style={{
            backgroundColor: 'var(--color-bg-subtle)',
            border: '1px solid var(--color-border)',
          }}
        >
          {toDelete.map((tx, i) => (
            <div key={tx.id ?? i} className="flex flex-wrap gap-x-4 gap-y-1" style={{ marginBottom: i < toDelete.length - 1 ? 8 : 0 }}>
              <span>{formatDate(tx.timestamp)}</span>
              <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {tx.instrumentSymbol ?? '—'}
              </span>
              <span>{tx.side}</span>
              <span>{tx.quantity}</span>
              <span>${(tx.price ?? 0).toFixed(2)}</span>
              <span style={{ color: tx.cashDelta < 0 ? 'var(--color-negative)' : 'var(--color-positive)' }}>
                {formatAmount(tx.cashDelta)}
              </span>
              {formatOptionLabel(tx) && <span>{formatOptionLabel(tx)}</span>}
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={handleClose}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={handleConfirm}
          className="flex-1"
        >
          Delete
        </Button>
      </div>
    </Modal>
  );
}
