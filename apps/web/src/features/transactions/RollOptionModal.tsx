import { useState, useCallback, useEffect } from 'react';
import { useStrategyStore } from '@/store/strategy-store';
import { useUIStore } from '@/store/ui-store';
import { Modal, Button, Input, Label, Select } from '@/components/ui';
import type { StrategyTransaction } from '@/store/strategy-store';

const CALL_PUT_OPTIONS = [
  { value: 'call', label: 'Call' },
  { value: 'put', label: 'Put' },
];

const INPUT_WIDTH = { width: 200 };

export function RollOptionModal() {
  const rollOptionModalOpen = useUIStore((s) => s.rollOptionModalOpen);
  const setRollOptionModalOpen = useUIStore((s) => s.setRollOptionModalOpen);
  const addTransaction = useStrategyStore((s) => s.addTransaction);

  const strategyId = rollOptionModalOpen?.strategyId ?? null;
  const transaction = rollOptionModalOpen?.transaction;

  const opt = transaction?.option;
  const [rollToExp, setRollToExp] = useState('');
  const [rollToStrike, setRollToStrike] = useState('');
  const [rollToCallPut, setRollToCallPut] = useState<'call' | 'put'>('call');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transaction) {
      setRollToExp('');
      setRollToStrike('');
      setRollToCallPut((opt?.callPut === 'put' ? 'put' : 'call') as 'call' | 'put');
      setPrice('');
      setDate(new Date().toISOString().slice(0, 10));
      setError(null);
    }
  }, [transaction, opt]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!strategyId || !transaction || !opt) return;

      const strike = parseFloat(rollToStrike);
      if (isNaN(strike) || strike < 0) {
        setError('Strike must be non-negative');
        return;
      }
      const pr = parseFloat(price);
      if (isNaN(pr)) {
        setError('Price (delta premium) is required');
        return;
      }

      const qty = transaction.quantity ?? 1;
      const cashDelta = Math.round(qty * pr * 100) / 100;
      const timestamp = `${date}T12:00:00Z`;

      try {
        addTransaction(strategyId, {
          side: 'option_roll',
          cashDelta,
          timestamp,
          instrumentSymbol: transaction.instrumentSymbol ?? '',
          option: opt,
          optionRoll: {
            option: opt,
            optionRolledTo: {
              expiration: rollToExp ? `${rollToExp}T00:00:00Z` : '',
              strike,
              callPut: rollToCallPut,
            },
          },
          customData: {},
          quantity: qty,
          price: pr,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to roll option');
        return;
      }

      setRollOptionModalOpen(null);
    },
    [strategyId, transaction, opt, rollToExp, rollToStrike, rollToCallPut, price, date, addTransaction, setRollOptionModalOpen]
  );

  const handleClose = useCallback(() => {
    setRollOptionModalOpen(null);
    setError(null);
  }, [setRollOptionModalOpen]);

  if (!rollOptionModalOpen || !strategyId || !transaction || !opt) return null;

  const field = (label: string, children: React.ReactNode) => (
    <div style={{ marginBottom: 10 }}>
      <Label>{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );

  const fromExp = (opt.expiration ?? '').slice(0, 10);

  return (
    <Modal title="Roll Option" onClose={handleClose} size="default">
      <form onSubmit={handleSubmit}>
        <p className="text-[13px] mb-4" style={{ color: 'var(--color-text-muted)' }}>
          Roll <strong>{transaction.instrumentSymbol}</strong> {opt.callPut?.toUpperCase()} {fromExp} @ {opt.strike} → new option
        </p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {field('To: Expiration', (
            <Input type="date" value={rollToExp} onChange={(e) => setRollToExp(e.target.value)} style={INPUT_WIDTH} />
          ))}
          {field('To: Strike', (
            <Input
              type="number"
              min="0"
              step="0.01"
              value={rollToStrike}
              onChange={(e) => setRollToStrike(e.target.value)}
              placeholder="e.g. 185"
              style={INPUT_WIDTH}
            />
          ))}
          {field('To: Call/Put', (
            <Select options={CALL_PUT_OPTIONS} value={rollToCallPut} onChange={(v) => setRollToCallPut(v as 'call' | 'put')} style={INPUT_WIDTH} />
          ))}
          {field('Date', (
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={INPUT_WIDTH} />
          ))}
          {field('Price (delta premium, + if credit)', (
            <Input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 0.50"
              error={error ?? undefined}
              style={INPUT_WIDTH}
            />
          ))}
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1">
            Roll
          </Button>
        </div>
      </form>
    </Modal>
  );
}
