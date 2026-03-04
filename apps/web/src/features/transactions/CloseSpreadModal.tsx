import { useState, useCallback } from 'react';
import { useUIStore } from '@/store/ui-store';
import { Modal, Button, Input, Label } from '@/components/ui';
import { useCreateTransaction } from '@/api/hooks';

export function CloseSpreadModal() {
  const closeSpreadModalOpen = useUIStore((s) => s.closeSpreadModalOpen);
  const setCloseSpreadModalOpen = useUIStore((s) => s.setCloseSpreadModalOpen);
  const createTx = useCreateTransaction();

  const strategyId = closeSpreadModalOpen?.strategyId ?? null;
  const legs = closeSpreadModalOpen?.legs ?? [];

  const minQty = legs.length === 2 ? Math.min(legs[0]?.quantity ?? 0, legs[1]?.quantity ?? 0) : 0;

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  const shortLeg = legs.find((l) => (l.side as string)?.toLowerCase() === 'sell');
  const longLeg = legs.find((l) => (l.side as string)?.toLowerCase() === 'buy');

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!strategyId || !shortLeg?.option || !longLeg?.option || minQty <= 0) return;

      const amt = parseFloat(amount);
      if (isNaN(amt) || amt < 0) {
        setError('Amount must be a non-negative number');
        return;
      }

      const multiplier = 100;
      const shortBook = (shortLeg.cashDelta ?? 0) / ((shortLeg.quantity ?? 0) * multiplier) || 0;
      const longBook = -(longLeg.cashDelta ?? 0) / ((longLeg.quantity ?? 0) * multiplier) || 0;
      const netCreditPerShare = shortBook - longBook;

      if (netCreditPerShare <= 0) {
        setError('Invalid spread: net credit must be positive');
        return;
      }

      const longPremium = Math.round((amt * longBook) / netCreditPerShare * 100) / 100;
      const shortPremium = Math.round((amt * shortBook) / netCreditPerShare * 100) / 100;

      const spreadId = (shortLeg.customData as Record<string, unknown>)?.spreadId;
      const customData = spreadId ? { spreadId } : {};

      const timestamp = `${date}T12:00:00Z`;

      try {
        await createTx.mutateAsync({
          strategyId,
          side: 'buy_to_cover',
          cashDelta: -shortPremium,
          currency: shortLeg.currency ?? 'USD',
          timestamp,
          instrumentSymbol: shortLeg.instrumentSymbol ?? '',
          option: shortLeg.option,
          customData,
          quantity: minQty,
          price: shortPremium / (minQty * multiplier),
        });

        await createTx.mutateAsync({
          strategyId,
          side: 'sell_to_cover',
          cashDelta: longPremium,
          currency: longLeg.currency ?? 'USD',
          timestamp,
          instrumentSymbol: longLeg.instrumentSymbol ?? '',
          option: longLeg.option,
          customData,
          quantity: minQty,
          price: longPremium / (minQty * multiplier),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to close spread');
        return;
      }

      setCloseSpreadModalOpen(null);
    },
    [strategyId, shortLeg, longLeg, minQty, amount, date, createTx, setCloseSpreadModalOpen]
  );

  const handleClose = useCallback(() => {
    setCloseSpreadModalOpen(null);
    setError(null);
  }, [setCloseSpreadModalOpen]);

  if (!closeSpreadModalOpen || !strategyId || legs.length !== 2) return null;

  const field = (label: string, children: React.ReactNode) => (
    <div style={{ marginBottom: 10 }}>
      <Label>{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );

  return (
    <Modal title="Close Spread" onClose={handleClose} size="default">
      <form onSubmit={handleSubmit}>
        <p className="text-[13px] mb-4" style={{ color: 'var(--color-text-muted)' }}>
          Close {minQty} contract{minQty !== 1 ? 's' : ''}. Enter the total amount you pay to close.
        </p>
        <div className="grid grid-cols-2 gap-4" style={{ marginBottom: 'var(--space-modal)' }}>
          {field('Amount to close', (
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError(null);
              }}
              placeholder="e.g. 50.00"
              error={error ?? undefined}
              className="w-full"
            />
          ))}
          {field('Date', (
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full" />
          ))}
        </div>
        <div className="flex gap-3" style={{ marginTop: 'var(--space-modal)' }}>
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
