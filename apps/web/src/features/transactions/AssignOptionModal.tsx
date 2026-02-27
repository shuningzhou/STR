import { useState, useCallback } from 'react';
import { useUIStore } from '@/store/ui-store';
import { Modal, Button } from '@/components/ui';
import { useCreateTransaction } from '@/api/hooks';

export function AssignOptionModal() {
  const assignOptionModalOpen = useUIStore((s) => s.assignOptionModalOpen);
  const setAssignOptionModalOpen = useUIStore((s) => s.setAssignOptionModalOpen);
  const createTx = useCreateTransaction();

  const strategyId = assignOptionModalOpen?.strategyId ?? null;
  const transaction = assignOptionModalOpen?.transaction;

  const [error, setError] = useState<string | null>(null);

  const handleConfirm = useCallback(
    async () => {
      if (!strategyId || !transaction?.option) return;

      const opt = transaction.option;
      const cp = (opt.callPut ?? 'call').toLowerCase();
      const multiplier = (opt as { multiplier?: number }).multiplier ?? 100;
      const contracts = Math.abs(transaction.quantity ?? 0);
      const strike = opt.strike ?? 0;
      const sym = (transaction.instrumentSymbol ?? '').trim();
      const isSecuredPut = cp === 'put';

      if (contracts <= 0 || !sym) {
        setError('Invalid option position');
        return;
      }

      // option_assign: treated as stock buy/sell by itself (put = buy at strike, call = sell at strike)
      const shareQty = contracts * multiplier;
      const cashDelta = isSecuredPut
        ? -strike * shareQty
        : strike * shareQty;

      const timestamp = new Date().toISOString().slice(0, 19) + 'Z';

      try {
        await createTx.mutateAsync({
          strategyId,
          side: 'option_assign',
          cashDelta,
          currency: transaction.currency ?? 'USD',
          timestamp,
          instrumentSymbol: sym,
          option: opt,
          customData: {},
          quantity: contracts,
          price: strike,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create assign transaction');
        return;
      }

      setAssignOptionModalOpen(null);
    },
    [strategyId, transaction, createTx, setAssignOptionModalOpen]
  );

  const handleClose = useCallback(() => {
    setAssignOptionModalOpen(null);
    setError(null);
  }, [setAssignOptionModalOpen]);

  if (!assignOptionModalOpen || !strategyId || !transaction?.option) return null;

  const opt = transaction.option;
  const cp = (opt.callPut ?? 'call').toLowerCase();
  const contracts = Math.abs(transaction.quantity ?? 0);
  const strike = opt.strike ?? 0;
  const sym = transaction.instrumentSymbol ?? '';
  const isSecuredPut = cp === 'put';
  const shareQty = contracts * ((opt as { multiplier?: number }).multiplier ?? 100);
  const cashAmount = strike * shareQty;

  const modalTitle = `Assign ${sym} ${opt.callPut?.toUpperCase() ?? cp.toUpperCase()} ${(opt.expiration ?? '').slice(0, 10)} @ $${strike}`;
  const actionDesc = isSecuredPut
    ? `Buy ${shareQty.toLocaleString()} shares of ${sym} at $${strike}/share ($${cashAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} from wallet)`
    : `Sell ${shareQty.toLocaleString()} shares of ${sym} at $${strike}/share ($${cashAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} to wallet)`;

  return (
    <Modal title={modalTitle} onClose={handleClose} size="default">
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          {actionDesc}
        </p>
        {error && (
          <p style={{ fontSize: 13, color: 'var(--color-negative)', marginTop: 8 }}>
            {error}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
          Cancel
        </Button>
        <Button type="button" variant="primary" onClick={handleConfirm} className="flex-1">
          Assign
        </Button>
      </div>
    </Modal>
  );
}
