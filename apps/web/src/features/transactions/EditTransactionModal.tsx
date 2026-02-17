import { useState, useCallback, useEffect } from 'react';
import { useStrategyStore } from '@/store/strategy-store';
import { useUIStore } from '@/store/ui-store';
import { Modal, Button, Input, Label, SegmentControl } from '@/components/ui';

const SIDES = ['buy', 'sell'] as const;

export function EditTransactionModal() {
  const editTransactionModalOpen = useUIStore((s) => s.editTransactionModalOpen);
  const setEditTransactionModalOpen = useUIStore((s) => s.setEditTransactionModalOpen);
  const updateTransaction = useStrategyStore((s) => s.updateTransaction);
  const strategies = useStrategyStore((s) => s.strategies);

  const [symbol, setSymbol] = useState('');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const strategyId = editTransactionModalOpen?.strategyId ?? null;
  const transaction = editTransactionModalOpen?.transaction;

  const strategy = strategies.find((s) => s.id === strategyId);

  useEffect(() => {
    if (transaction) {
      setSymbol(transaction.instrumentSymbol ?? '');
      setSide((transaction.side === 'sell' ? 'sell' : 'buy') as 'buy' | 'sell');
      setQuantity(String(transaction.quantity ?? ''));
      setPrice(String(transaction.price ?? ''));
      setDate((transaction.timestamp ?? '').slice(0, 10));
      setError(null);
    }
  }, [transaction]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!strategyId || !transaction) return;

      const sym = symbol.trim().toUpperCase();
      if (!sym) {
        setError('Symbol is required');
        return;
      }
      const qty = parseFloat(quantity);
      if (isNaN(qty) || qty <= 0) {
        setError('Quantity must be a positive number');
        return;
      }
      const pr = parseFloat(price);
      if (isNaN(pr) || pr < 0) {
        setError('Price must be a non-negative number');
        return;
      }

      setError(null);
      const cashDelta = Math.round(-qty * pr * (side === 'buy' ? 1 : -1) * 100) / 100;
      const timestamp = `${date}T12:00:00Z`;

      updateTransaction(strategyId, transaction.id, {
        side,
        cashDelta,
        timestamp,
        instrumentId: `inst-${sym}`,
        instrumentSymbol: sym,
        instrumentName: sym,
        quantity: qty,
        price: pr,
      });

      setEditTransactionModalOpen(null);
    },
    [strategyId, transaction, symbol, side, quantity, price, date, updateTransaction, setEditTransactionModalOpen]
  );

  const handleClose = useCallback(() => {
    setEditTransactionModalOpen(null);
    setError(null);
  }, [setEditTransactionModalOpen]);

  if (!editTransactionModalOpen || !strategyId || !transaction) return null;

  return (
    <Modal title="Edit Transaction" onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <p
          className="text-[13px] mb-4"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Edit transaction in <strong>{strategy?.name}</strong>
        </p>

        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 10 }}>
            <Label htmlFor="edit-tx-symbol">Symbol</Label>
            <Input
              id="edit-tx-symbol"
              type="text"
              value={symbol}
              onChange={(e) => {
                setSymbol(e.target.value);
                setError(null);
              }}
              placeholder="e.g. AAPL, VOO"
              autoFocus
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <Label htmlFor="edit-tx-side">Side</Label>
            <SegmentControl
              value={side}
              options={SIDES}
              onChange={(v) => setSide(v)}
              className="flex-1 min-w-0 mt-1"
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <Label htmlFor="edit-tx-quantity">Quantity</Label>
            <Input
              id="edit-tx-quantity"
              type="number"
              min="0.0001"
              step="any"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setError(null);
              }}
              placeholder="e.g. 10"
              error={error ?? undefined}
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <Label htmlFor="edit-tx-price">Price</Label>
            <Input
              id="edit-tx-price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                setError(null);
              }}
              placeholder="e.g. 180.50"
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <Label htmlFor="edit-tx-date">Date</Label>
            <Input
              id="edit-tx-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3" style={{ marginTop: 20 }}>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1">
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
