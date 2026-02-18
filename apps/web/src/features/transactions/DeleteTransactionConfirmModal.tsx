import { useStrategyStore } from '@/store/strategy-store';
import { useUIStore } from '@/store/ui-store';
import { Modal, Button } from '@/components/ui';

export function DeleteTransactionConfirmModal() {
  const deleteTransactionConfirmOpen = useUIStore((s) => s.deleteTransactionConfirmOpen);
  const setDeleteTransactionConfirmOpen = useUIStore((s) => s.setDeleteTransactionConfirmOpen);
  const removeTransaction = useStrategyStore((s) => s.removeTransaction);

  const strategyId = deleteTransactionConfirmOpen?.strategyId ?? null;
  const transactionId = deleteTransactionConfirmOpen?.transactionId ?? null;

  const handleConfirm = () => {
    if (strategyId != null && transactionId != null) {
      removeTransaction(strategyId, transactionId);
    }
    setDeleteTransactionConfirmOpen(null);
  };

  const handleClose = () => {
    setDeleteTransactionConfirmOpen(null);
  };

  if (!deleteTransactionConfirmOpen || strategyId == null || transactionId == null) return null;

  return (
    <Modal title="Delete transaction" onClose={handleClose}>
      <p
        className="text-[13px]"
        style={{ color: 'var(--color-text-secondary)', marginBottom: 20 }}
      >
        Delete this transaction? This action cannot be undone.
      </p>
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
