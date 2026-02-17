import { useState, useCallback } from 'react';
import { useStrategyStore } from '@/store/strategy-store';
import { useUIStore } from '@/store/ui-store';
import { Modal, Button, Input, Label } from '@/components/ui';

export function DepositWithdrawModal() {
  const depositWithdrawModalOpen = useUIStore((s) => s.depositWithdrawModalOpen);
  const setDepositWithdrawModalOpen = useUIStore((s) => s.setDepositWithdrawModalOpen);
  const addTransaction = useStrategyStore((s) => s.addTransaction);
  const strategies = useStrategyStore((s) => s.strategies);

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  const strategyId = depositWithdrawModalOpen?.strategyId ?? null;
  const mode = depositWithdrawModalOpen?.mode ?? 'deposit';

  const strategy = strategies.find((s) => s.id === strategyId);
  const currency = strategy?.baseCurrency ?? 'USD';
  const title = mode === 'deposit' ? 'Deposit' : 'Withdraw';

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!strategyId) return;

      const amt = parseFloat(amount);
      if (isNaN(amt) || amt <= 0) {
        setError('Amount must be a positive number');
        return;
      }

      setError(null);
      const cashDelta = mode === 'deposit' ? amt : -amt;
      const timestamp = `${date}T12:00:00Z`;

      try {
        addTransaction(strategyId, {
          side: mode,
          cashDelta,
          timestamp,
          instrumentId: 'cash',
          instrumentSymbol: currency,
          instrumentName: currency,
          option: null,
          customData: {},
          quantity: 0,
          price: 0,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed');
        return;
      }

      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      setDepositWithdrawModalOpen(null);
    },
    [strategyId, mode, amount, date, addTransaction, setDepositWithdrawModalOpen]
  );

  const handleClose = useCallback(() => {
    setDepositWithdrawModalOpen(null);
    setAmount('');
    setDate(new Date().toISOString().slice(0, 10));
    setError(null);
  }, [setDepositWithdrawModalOpen]);

  if (!depositWithdrawModalOpen || !strategyId) return null;

  return (
    <Modal title={title} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <p
          className="text-[13px] mb-4"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {mode === 'deposit' ? 'Add' : 'Remove'} cash to/from <strong>{strategy?.name}</strong> wallet
        </p>

        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 10 }}>
            <Label htmlFor="dw-amount">Amount ({currency})</Label>
            <Input
              id="dw-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError(null);
              }}
              placeholder="e.g. 1000"
              error={error ?? undefined}
              autoFocus
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <Label htmlFor="dw-date">Date</Label>
            <Input
              id="dw-date"
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
            {title}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
