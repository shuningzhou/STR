import { useState, useCallback, useEffect } from 'react';
import { useUIStore } from '@/store/ui-store';
import { Modal, Button, Input, Label, Select } from '@/components/ui';
import type { StrategyTransaction } from '@/store/strategy-store';
import { useCreateTransaction } from '@/api/hooks';

const CALL_PUT_OPTIONS = [
  { value: 'call', label: 'Call' },
  { value: 'put', label: 'Put' },
];

const RECEIVE_PAY_OPTIONS = [
  { value: 'receive', label: 'Receive' },
  { value: 'pay', label: 'Pay' },
];

export function RollOptionModal() {
  const rollOptionModalOpen = useUIStore((s) => s.rollOptionModalOpen);
  const setRollOptionModalOpen = useUIStore((s) => s.setRollOptionModalOpen);
  const createTx = useCreateTransaction();

  const strategyId = rollOptionModalOpen?.strategyId ?? null;
  const transaction = rollOptionModalOpen?.transaction;

  const opt = transaction?.option;
  const [rollToExp, setRollToExp] = useState('');
  const [rollToStrike, setRollToStrike] = useState('');
  const [rollToCallPut, setRollToCallPut] = useState<'call' | 'put'>('call');
  const [receivePay, setReceivePay] = useState<'receive' | 'pay'>('receive');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transaction) {
      setRollToExp('');
      setRollToStrike('');
      setRollToCallPut((opt?.callPut === 'put' ? 'put' : 'call') as 'call' | 'put');
      setReceivePay('receive');
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      setError(null);
    }
  }, [transaction, opt]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!strategyId || !transaction || !opt) return;

      const strike = parseFloat(rollToStrike);
      if (isNaN(strike) || strike < 0) {
        setError('Strike must be non-negative');
        return;
      }
      const amt = parseFloat(amount);
      if (isNaN(amt) || amt < 0) {
        setError('Amount is required and must be positive');
        return;
      }

      const qty = transaction.quantity ?? 1;
      const originalPremium = Math.abs(transaction.cashDelta ?? 0);
      // Amount = net cash from roll, added/deducted in wallet. Receive X => new = original + X (wallet +X). Pay X => new = original − X (wallet −X).
      const newOptionPremium =
        receivePay === 'receive'
          ? Math.round((originalPremium + amt) * 100) / 100
          : Math.round((originalPremium - amt) * 100) / 100;
      const newOptionPricePerShare = qty > 0 ? Math.round((newOptionPremium / (qty * 100)) * 100) / 100 : 0;
      const timestamp = `${date}T12:00:00Z`;
      const symbol = transaction.instrumentSymbol ?? '';

      // Original option's premium (what we received when we sold it)
      const closePremium = -Math.round(originalPremium * 100) / 100;
      const closePricePerShare = qty > 0 ? Math.abs(originalPremium) / (qty * 100) : 0;

      const optionRolledTo = {
        expiration: rollToExp ? `${rollToExp}T00:00:00Z` : '',
        strike,
        callPut: rollToCallPut,
      };

      try {
        // 1. Buy to cover - close the original option (same premium as when we sold it)
        await createTx.mutateAsync({
          strategyId,
          side: 'buy_to_cover',
          cashDelta: closePremium,
          timestamp,
          instrumentSymbol: symbol,
          option: opt,
          customData: {},
          quantity: qty,
          price: closePricePerShare,
        });
        // 2. Sell - open the new option (premium = roll receive/pay amount)
        await createTx.mutateAsync({
          strategyId,
          side: 'sell',
          cashDelta: newOptionPremium,
          timestamp,
          instrumentSymbol: symbol,
          option: optionRolledTo,
          customData: {},
          quantity: qty,
          price: newOptionPricePerShare,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to roll option');
        return;
      }

      setRollOptionModalOpen(null);
    },
    [strategyId, transaction, opt, rollToExp, rollToStrike, rollToCallPut, receivePay, amount, date, createTx, setRollOptionModalOpen]
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
  const modalTitle = `Roll ${transaction.instrumentSymbol} ${opt.callPut?.toUpperCase()} ${fromExp} @ ${opt.strike}`;

  return (
    <Modal title={modalTitle} onClose={handleClose} size="default">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4" style={{ marginBottom: 'var(--space-modal)' }}>
          {field('To: Expiration', (
            <Input type="date" value={rollToExp} onChange={(e) => setRollToExp(e.target.value)} className="w-full" />
          ))}
          {field('To: Strike', (
            <Input
              type="number"
              min="0"
              step="0.01"
              value={rollToStrike}
              onChange={(e) => setRollToStrike(e.target.value)}
              placeholder="e.g. 185"
              className="w-full"
            />
          ))}
          {field('To: Call/Put', (
            <Select options={CALL_PUT_OPTIONS} value={rollToCallPut} onChange={(v) => setRollToCallPut(v as 'call' | 'put')} className="w-full" />
          ))}
          {field('Date', (
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full" />
          ))}
          {field('Receive / Pay', (
            <Select options={RECEIVE_PAY_OPTIONS} value={receivePay} onChange={(v) => setReceivePay(v as 'receive' | 'pay')} className="w-full" />
          ))}
          {field('Net amount ($)', (
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 10 (net receive or pay)"
              error={error ?? undefined}
              className="w-full"
            />
          ))}
        </div>
        <div className="flex gap-3" style={{ marginTop: 'var(--space-modal)' }}>
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
