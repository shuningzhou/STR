import { useState, useCallback } from 'react';
import { useStrategyStore } from '@/store/strategy-store';
import { useUIStore } from '@/store/ui-store';
import { Modal, Button, Input, Label, SegmentControl } from '@/components/ui';
import { IconPicker } from '@/components/IconPicker';

const CURRENCIES = ['USD', 'CAD'] as const;

export function AddStrategyModal() {
  const [name, setName] = useState('');
  const [baseCurrency, setBaseCurrency] = useState<'USD' | 'CAD'>('USD');
  const [icon, setIcon] = useState<string | undefined>(undefined);
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
      addStrategy(trimmed, baseCurrency, icon);
      setName('');
      setBaseCurrency('USD');
      setIcon(undefined);
      setAddStrategyModalOpen(false);
    },
    [addStrategy, baseCurrency, icon, name, setAddStrategyModalOpen]
  );

  const handleClose = useCallback(() => {
    setAddStrategyModalOpen(false);
    setName('');
    setBaseCurrency('USD');
    setIcon(undefined);
    setError(null);
  }, [setAddStrategyModalOpen]);

  if (!addStrategyModalOpen) return null;

  return (
    <Modal title="Create strategy" onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        {/* Name and Icon on same row */}
        <div style={{ marginBottom: 20 }} className="flex gap-3 items-end">
          <div className="flex-1 min-w-0">
            <Label htmlFor="strategy-name">Name</Label>
            <div className="mt-1">
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
          </div>
          <div style={{ minWidth: 160 }}>
            <IconPicker value={icon} onChange={(v) => setIcon(v)} label="Icon" placeholder="Default" showColorPicker={false} defaultIcon="LayoutDashboard" />
          </div>
        </div>

        {/* Base currency: label + selector on same row */}
        <div style={{ marginBottom: 20 }} className="flex items-center gap-3">
          <Label htmlFor="base-currency" inline>Base currency</Label>
          <div style={{ width: 150 }}>
            <SegmentControl
              value={baseCurrency}
              options={CURRENCIES}
              onChange={(c) => setBaseCurrency(c)}
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
