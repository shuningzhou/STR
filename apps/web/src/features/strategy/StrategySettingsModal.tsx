import { useState, useCallback, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { useStrategyStore } from '@/store/strategy-store';
import { useUIStore } from '@/store/ui-store';
import { Modal, Button, Input, Label, SegmentControl } from '@/components/ui';

const CURRENCIES = ['USD', 'CAD'] as const;

export function StrategySettingsModal() {
  const [name, setName] = useState('');
  const [baseCurrency, setBaseCurrency] = useState<'USD' | 'CAD'>('USD');
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const strategies = useStrategyStore((s) => s.strategies);
  const activeStrategyId = useStrategyStore((s) => s.activeStrategyId);
  const updateStrategy = useStrategyStore((s) => s.updateStrategy);
  const deleteStrategy = useStrategyStore((s) => s.deleteStrategy);

  const { strategySettingsModalOpen, setStrategySettingsModalOpen } = useUIStore();

  const strategy = strategies.find((s) => s.id === activeStrategyId);

  useEffect(() => {
    if (strategy) {
      setName(strategy.name);
      setBaseCurrency((strategy.baseCurrency as 'USD' | 'CAD') || 'USD');
    }
    setDeleteConfirm(false);
    setError(null);
  }, [strategy, strategySettingsModalOpen]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!strategy) return;
      const trimmed = name.trim();
      if (!trimmed) {
        setError('Name is required');
        return;
      }
      setError(null);
      updateStrategy(strategy.id, { name: trimmed, baseCurrency });
      setStrategySettingsModalOpen(false);
    },
    [name, baseCurrency, strategy, updateStrategy, setStrategySettingsModalOpen]
  );

  const handleDelete = useCallback(() => {
    if (!strategy) return;
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    deleteStrategy(strategy.id);
    setStrategySettingsModalOpen(false);
  }, [strategy, deleteConfirm, deleteStrategy, setStrategySettingsModalOpen]);

  const handleClose = useCallback(() => {
    setStrategySettingsModalOpen(false);
    setDeleteConfirm(false);
    setError(null);
  }, [setStrategySettingsModalOpen]);

  if (!strategySettingsModalOpen || !strategy) return null;

  return (
    <Modal title="Strategy settings" onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        {/* Content: strategy name group + base currency group */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 10 }}>
            <Label htmlFor="strategy-name-edit">Strategy name</Label>
            <Input
              id="strategy-name-edit"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Growth Portfolio"
              error={error ?? undefined}
            />
          </div>

          <div className="flex items-center gap-3">
            <Label htmlFor="base-currency-edit" inline>Base currency</Label>
            <SegmentControl
              value={baseCurrency}
              options={CURRENCIES}
              onChange={(c) => setBaseCurrency(c)}
              className="flex-1 min-w-0"
            />
          </div>
        </div>

        {/* Footer: Cancel + Save */}
        <div className="flex gap-3" style={{ marginBottom: 20 }}>
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

      <div
        style={{
          paddingTop: 20,
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <Button
          type="button"
          variant={deleteConfirm ? 'danger' : 'secondary'}
          onClick={handleDelete}
          className="w-full gap-2"
        >
          <Trash2 size={16} strokeWidth={2} />
          {deleteConfirm ? 'Confirm delete' : 'Delete strategy'}
        </Button>
      </div>
    </Modal>
  );
}
