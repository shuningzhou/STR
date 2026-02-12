import { useState, useCallback } from 'react';
import { useStrategyStore } from '@/store/strategy-store';
import { useUIStore } from '@/store/ui-store';
import { Modal, Button, Input, Label, SegmentControl } from '@/components/ui';

const CURRENCIES = ['USD', 'CAD'] as const;

export function AddStrategyModal() {
  const [name, setName] = useState('');
  const [baseCurrency, setBaseCurrency] = useState<'USD' | 'CAD'>('USD');
  const [error, setError] = useState<string | null>(null);

  const addStrategy = useStrategyStore((s) => s.addStrategy);
  const { addStrategyModalOpen, setAddStrategyModalOpen } = useUIStore();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = name.trim();
      if (!trimmed) {
        setError('Name is required');
        return;
      }
      setError(null);
      addStrategy(trimmed, baseCurrency);
      setName('');
      setBaseCurrency('USD');
      setAddStrategyModalOpen(false);
    },
    [addStrategy, baseCurrency, name, setAddStrategyModalOpen]
  );

  const handleClose = useCallback(() => {
    setAddStrategyModalOpen(false);
    setName('');
    setBaseCurrency('USD');
    setError(null);
  }, [setAddStrategyModalOpen]);

  if (!addStrategyModalOpen) return null;

  return (
    <Modal title="Create strategy" onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        {/* Content: strategy name group + base currency row */}
        <div style={{ marginBottom: 20 }}>
          {/* Strategy name group: label + field, gap 2 */}
          <div style={{ marginBottom: 10 }}>
            <Label htmlFor="strategy-name">Strategy name</Label>
            <Input
              id="strategy-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Growth Portfolio"
              autoFocus
              error={error ?? undefined}
            />
          </div>

          {/* Base currency: label + selector on same row */}
          <div className="flex items-center gap-3">
            <Label htmlFor="base-currency" inline>Base currency</Label>
            <SegmentControl
              value={baseCurrency}
              options={CURRENCIES}
              onChange={(c) => setBaseCurrency(c)}
              className="flex-1 min-w-0"
            />
          </div>
        </div>

        {/* Footer: Cancel + Create, gap 20 from content */}
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
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}
