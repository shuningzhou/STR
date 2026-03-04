import { useState, useCallback } from 'react';
import { useStrategies, useCreateTransaction } from '@/api/hooks';
import { useUIStore } from '@/store/ui-store';
import { Modal, Button, Input, Label, Select } from '@/components/ui';

const SPREAD_TYPE_OPTIONS = [
  { value: 'call', label: 'Call Credit Spread' },
  { value: 'put', label: 'Put Credit Spread' },
];

export function AddVerticalSpreadModal() {
  const addTransactionModalOpen = useUIStore((s) => s.addTransactionModalOpen);
  const setAddTransactionModalOpen = useUIStore((s) => s.setAddTransactionModalOpen);
  const createTx = useCreateTransaction();
  const { data: strategies = [] } = useStrategies();

  const strategyId = addTransactionModalOpen?.strategyId ?? null;
  const mode = addTransactionModalOpen?.mode ?? 'stock-etf';
  const isVerticalSpread = mode === 'vertical-spread';

  const [spreadType, setSpreadType] = useState<'call' | 'put'>('call');
  const [symbol, setSymbol] = useState('');
  const [expiration, setExpiration] = useState('');
  const [shortStrike, setShortStrike] = useState('');
  const [longStrike, setLongStrike] = useState('');
  const [quantity, setQuantity] = useState('');
  const [shortPremium, setShortPremium] = useState('');
  const [longPremium, setLongPremium] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  const strategy = strategies.find((s) => s.id === strategyId);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!strategyId || !strategy) return;

      const sym = symbol.trim().toUpperCase();
      if (!sym) {
        setError('Symbol is required');
        return;
      }
      if (!expiration) {
        setError('Expiration is required');
        return;
      }
      const shortStr = parseFloat(shortStrike);
      const longStr = parseFloat(longStrike);
      if (isNaN(shortStr) || isNaN(longStr) || shortStr < 0 || longStr < 0) {
        setError('Strikes must be non-negative');
        return;
      }
      if (spreadType === 'call' && shortStr >= longStr) {
        setError('Call credit: short strike must be less than long strike');
        return;
      }
      if (spreadType === 'put' && shortStr <= longStr) {
        setError('Put credit: short strike must be greater than long strike');
        return;
      }
      const qty = parseFloat(quantity);
      if (isNaN(qty) || qty <= 0) {
        setError('Quantity must be positive');
        return;
      }
      const shortPr = parseFloat(shortPremium);
      const longPr = parseFloat(longPremium);
      if (isNaN(shortPr) || isNaN(longPr) || shortPr < 0 || longPr < 0) {
        setError('Premiums must be non-negative');
        return;
      }
      if (shortPr <= longPr) {
        setError('Credit spread requires short premium > long premium');
        return;
      }

      setError(null);
      const timestamp = `${date}T12:00:00Z`;
      const spreadId = crypto.randomUUID();
      const multiplier = 100;
      const expIso = `${expiration}T00:00:00Z`;
      const customData = { spreadId };

      try {
        const shortPremiumTotal = Math.round(qty * shortPr * multiplier * 100) / 100;
        const longPremiumTotal = Math.round(qty * longPr * multiplier * 100) / 100;

        await createTx.mutateAsync({
          strategyId,
          side: 'sell',
          cashDelta: shortPremiumTotal,
          currency: strategy.baseCurrency ?? 'USD',
          timestamp,
          instrumentSymbol: sym,
          option: {
            expiration: expIso,
            strike: shortStr,
            callPut: spreadType,
          },
          customData,
          quantity: qty,
          price: shortPr,
        });

        await createTx.mutateAsync({
          strategyId,
          side: 'buy',
          cashDelta: -longPremiumTotal,
          currency: strategy.baseCurrency ?? 'USD',
          timestamp,
          instrumentSymbol: sym,
          option: {
            expiration: expIso,
            strike: longStr,
            callPut: spreadType,
          },
          customData,
          quantity: qty,
          price: longPr,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add spread');
        return;
      }

      setAddTransactionModalOpen(null);
    },
    [
      strategyId,
      strategy,
      symbol,
      expiration,
      shortStrike,
      longStrike,
      quantity,
      shortPremium,
      longPremium,
      date,
      spreadType,
      createTx,
      setAddTransactionModalOpen,
    ]
  );

  const handleClose = useCallback(() => {
    setAddTransactionModalOpen(null);
    setError(null);
  }, [setAddTransactionModalOpen]);

  if (!addTransactionModalOpen || !strategyId || !isVerticalSpread) return null;

  const field = (label: string, children: React.ReactNode) => (
    <div style={{ marginBottom: 10 }}>
      <Label>{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );

  const netCredit = (() => {
    const q = parseFloat(quantity);
    const s = parseFloat(shortPremium);
    const l = parseFloat(longPremium);
    if (isNaN(q) || isNaN(s) || isNaN(l) || q <= 0) return null;
    return ((s - l) * q * 100).toFixed(2);
  })();

  return (
    <Modal title="Add Credit Vertical Spread" onClose={handleClose} size="default">
      <form onSubmit={handleSubmit}>
        <p className="text-[13px] mb-4" style={{ color: 'var(--color-text-muted)' }}>
          Add spread to <strong>{strategy?.name}</strong>
        </p>
        <div className="grid grid-cols-[1fr_1fr] gap-4" style={{ marginBottom: 20 }}>
          {field('Type', (
            <Select
              options={SPREAD_TYPE_OPTIONS}
              value={spreadType}
              onChange={(v) => setSpreadType(v as 'call' | 'put')}
              className="w-full"
            />
          ))}
          {field('Underlying', (
            <Input
              type="text"
              value={symbol}
              onChange={(e) => {
                setSymbol(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder="e.g. SPY, AAPL"
              className="w-full"
              autoFocus
            />
          ))}
          {field('Expiration', (
            <Input type="date" value={expiration} onChange={(e) => setExpiration(e.target.value)} className="w-full" />
          ))}
          {field('Contracts', (
            <Input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setError(null);
              }}
              placeholder="1"
              className="w-full"
            />
          ))}
          {field('Long strike', (
            <Input
              type="number"
              min="0"
              step="0.01"
              value={longStrike}
              onChange={(e) => setLongStrike(e.target.value)}
              placeholder={spreadType === 'call' ? 'Higher (e.g. 105)' : 'Lower (e.g. 90)'}
              className="w-full"
            />
          ))}
          {field('Long leg premium ($/share)', (
            <Input
              type="number"
              min="0"
              step="0.01"
              value={longPremium}
              onChange={(e) => setLongPremium(e.target.value)}
              placeholder="e.g. 1.00"
              className="w-full"
            />
          ))}
          {field('Short strike', (
            <Input
              type="number"
              min="0"
              step="0.01"
              value={shortStrike}
              onChange={(e) => setShortStrike(e.target.value)}
              placeholder={spreadType === 'call' ? 'Lower (e.g. 100)' : 'Higher (e.g. 95)'}
              className="w-full"
            />
          ))}
          {field('Short leg premium ($/share)', (
            <Input
              type="number"
              min="0"
              step="0.01"
              value={shortPremium}
              onChange={(e) => setShortPremium(e.target.value)}
              placeholder="e.g. 2.50"
              error={error ?? undefined}
              className="w-full"
            />
          ))}
          {field('Trade date', (
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full" />
          ))}
        </div>
        {netCredit != null && (
          <p className="text-[13px] mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Net credit: <strong>${netCredit}</strong>
          </p>
        )}
        <div className="flex gap-3" style={{ marginTop: 'var(--space-modal)' }}>
          <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1">
            Add Spread
          </Button>
        </div>
      </form>
    </Modal>
  );
}
