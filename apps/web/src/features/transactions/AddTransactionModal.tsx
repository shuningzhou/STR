import { useState, useCallback, useMemo } from 'react';
import { useStrategyStore } from '@/store/strategy-store';
import { useUIStore } from '@/store/ui-store';
import { Modal, Button, Input, Label, SegmentControl } from '@/components/ui';

const SIDES = ['buy', 'sell'] as const;

export function AddTransactionModal() {
  const addTransactionModalOpen = useUIStore((s) => s.addTransactionModalOpen);
  const setAddTransactionModalOpen = useUIStore((s) => s.setAddTransactionModalOpen);
  const addTransaction = useStrategyStore((s) => s.addTransaction);
  const strategies = useStrategyStore((s) => s.strategies);

  const [symbol, setSymbol] = useState('');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  const strategyId = addTransactionModalOpen?.strategyId ?? null;
  const mode = addTransactionModalOpen?.mode ?? 'stock-etf';

  const strategy = useMemo(
    () => strategies.find((s) => s.id === strategyId),
    [strategies, strategyId]
  );

  const title = mode === 'stock-etf'
    ? 'Add Stock/ETF Transaction'
    : 'Add Transaction';

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!strategyId) return;

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

      try {
        addTransaction(strategyId, {
          side,
          cashDelta,
          timestamp,
          instrumentId: `inst-${sym}`,
          instrumentSymbol: sym,
          instrumentName: sym,
          option: null,
          customData: {},
          quantity: qty,
          price: pr,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add transaction');
        return;
      }

      setSymbol('');
      setQuantity('');
      setPrice('');
      setDate(new Date().toISOString().slice(0, 10));
      setSide('buy');
      setAddTransactionModalOpen(null);
    },
    [strategyId, symbol, side, quantity, price, date, addTransaction, setAddTransactionModalOpen]
  );

  const handleClose = useCallback(() => {
    setAddTransactionModalOpen(null);
    setSymbol('');
    setQuantity('');
    setPrice('');
    setDate(new Date().toISOString().slice(0, 10));
    setSide('buy');
    setError(null);
  }, [setAddTransactionModalOpen]);

  if (!addTransactionModalOpen || !strategyId) return null;

  return (
    <Modal title={title} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        {mode === 'stock-etf' && (
          <p
            className="text-[13px] mb-4"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Add a stock or ETF transaction to <strong>{strategy?.name}</strong>
          </p>
        )}

        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 10 }}>
            <Label htmlFor="tx-symbol">Symbol</Label>
            <Input
              id="tx-symbol"
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
            <Label htmlFor="tx-side">Side</Label>
            <SegmentControl
              value={side}
              options={SIDES}
              onChange={(v) => setSide(v)}
              className="flex-1 min-w-0 mt-1"
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <Label htmlFor="tx-quantity">Quantity</Label>
            <Input
              id="tx-quantity"
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
            <Label htmlFor="tx-price">Price</Label>
            <Input
              id="tx-price"
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
            <Label htmlFor="tx-date">Date</Label>
            <Input
              id="tx-date"
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
            Add
          </Button>
        </div>
      </form>
    </Modal>
  );
}
