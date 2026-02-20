import { useState, useCallback } from 'react';
import { useStrategyStore } from '@/store/strategy-store';
import { useUIStore } from '@/store/ui-store';
import { Modal, Button, Input, Label } from '@/components/ui';
import type { StrategyTransaction } from '@/store/strategy-store';

const INPUT_WIDTH = { width: 200 };

export function CloseOptionModal() {
  const closeOptionModalOpen = useUIStore((s) => s.closeOptionModalOpen);
  const setCloseOptionModalOpen = useUIStore((s) => s.setCloseOptionModalOpen);
  const addTransaction = useStrategyStore((s) => s.addTransaction);

  const strategyId = closeOptionModalOpen?.strategyId ?? null;
  const transaction = closeOptionModalOpen?.transaction;

  const totalQty = transaction?.quantity ?? 0;
  const [closeQty, setCloseQty] = useState(String(totalQty));
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!strategyId || !transaction?.option) return;

      const qty = parseFloat(closeQty);
      if (isNaN(qty) || qty <= 0) {
        setError('Quantity must be positive');
        return;
      }
      if (qty > totalQty) {
        setError(`Cannot close more than ${totalQty}`);
        return;
      }
      const pr = parseFloat(price);
      if (isNaN(pr) || pr < 0) {
        setError('Price (premium) must be non-negative');
        return;
      }

      const premium = -Math.round(qty * pr * 100) / 100; // buy to cover = negative cash
      const timestamp = `${date}T12:00:00Z`;

      try {
        addTransaction(strategyId, {
          side: 'buy_to_cover',
          cashDelta: premium,
          timestamp,
          instrumentSymbol: transaction.instrumentSymbol ?? '',
          option: transaction.option,
          customData: {},
          quantity: qty,
          price: pr,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to close option');
        return;
      }

      setCloseOptionModalOpen(null);
    },
    [strategyId, transaction, closeQty, totalQty, price, date, addTransaction, setCloseOptionModalOpen]
  );

  const handleClose = useCallback(() => {
    setCloseOptionModalOpen(null);
    setError(null);
  }, [setCloseOptionModalOpen]);

  if (!closeOptionModalOpen || !strategyId || !transaction?.option) return null;

  const opt = transaction.option;
  const exp = (opt.expiration ?? '').slice(0, 10);

  const field = (label: string, children: React.ReactNode) => (
    <div style={{ marginBottom: 10 }}>
      <Label>{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );

  return (
    <Modal title="Close Option" onClose={handleClose} size="default">
      <form onSubmit={handleSubmit}>
        <p className="text-[13px] mb-4" style={{ color: 'var(--color-text-muted)' }}>
          Close <strong>{transaction.instrumentSymbol}</strong> {opt.callPut?.toUpperCase()} {exp} @ {opt.strike} (total: {totalQty} contracts)
        </p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {field('Quantity to close', (
            <Input
              type="number"
              min="1"
              max={totalQty}
              step="1"
              value={closeQty}
              onChange={(e) => {
                setCloseQty(e.target.value);
                setError(null);
              }}
              placeholder={`1-${totalQty}`}
              error={error ?? undefined}
              style={INPUT_WIDTH}
            />
          ))}
          {field('Price (premium/contract)', (
            <Input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 2.50"
              style={INPUT_WIDTH}
            />
          ))}
          {field('Date', (
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={INPUT_WIDTH} />
          ))}
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1">
            Close
          </Button>
        </div>
      </form>
    </Modal>
  );
}
