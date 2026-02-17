import React, { useState, useCallback, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';
import type { StrategyInputConfig } from '@/store/strategy-store';
import { useStrategyStore } from '@/store/strategy-store';
import { useUIStore } from '@/store/ui-store';
import { Modal, Button, Input, Label, SegmentControl, Select } from '@/components/ui';

const CURRENCIES = ['USD', 'CAD'] as const;

const INPUT_TYPES = [
  { value: 'time_range', label: 'Time range' },
  { value: 'ticker_selector', label: 'Ticker' },
  { value: 'number_input', label: 'Number' },
  { value: 'select', label: 'Select' },
  { value: 'checkbox', label: 'Checkbox' },
] as const;

function defaultForType(type: StrategyInputConfig['type']): unknown {
  switch (type) {
    case 'time_range': {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
    }
    case 'ticker_selector':
      return 'all';
    case 'number_input':
      return 0;
    case 'select':
      return '';
    case 'checkbox':
      return false;
    default:
      return undefined;
  }
}

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

  const handleAddInput = useCallback(() => {
    if (!strategy) return;
    const id = `input_${Date.now()}`;
    const type: StrategyInputConfig['type'] = 'time_range';
    const cfg: StrategyInputConfig = {
      id,
      title: id,
      type,
      default: defaultForType(type),
    };
    if (type === 'number_input') {
      (cfg as StrategyInputConfig & { min?: number; max?: number }).min = 0;
      (cfg as StrategyInputConfig & { min?: number; max?: number }).max = 100;
    }
    if (type === 'select') {
      (cfg as StrategyInputConfig & { options?: { value: string; label: string }[] }).options = [
        { value: 'a', label: 'Option A' },
        { value: 'b', label: 'Option B' },
      ];
    }
    const nextInputs = [...(strategy.inputs ?? []), cfg];
    let rawVal: unknown = defaultForType(type);
    let val: string | number =
      typeof rawVal === 'object' && rawVal != null
        ? JSON.stringify(rawVal)
        : (rawVal as string | number);
    const nextValues: Record<string, string | number> = {
      ...(strategy.inputValues ?? {}),
      [id]: val,
    };
    updateStrategy(strategy.id, { inputs: nextInputs, inputValues: nextValues });
    setError(null);
  }, [strategy, updateStrategy]);

  const handleRemoveInput = useCallback(
    (inputId: string) => {
      if (!strategy) return;
      const next = (strategy.inputs ?? []).filter((i) => i.id !== inputId);
      const nextValues = { ...(strategy.inputValues ?? {}) };
      delete nextValues[inputId];
      updateStrategy(strategy.id, { inputs: next, inputValues: nextValues });
    },
    [strategy, updateStrategy]
  );

  const handleUpdateInput = useCallback(
    (inputId: string, updates: Partial<Pick<StrategyInputConfig, 'id' | 'title' | 'type'>>) => {
      if (!strategy) return;
      const inputs = strategy.inputs ?? [];
      const idx = inputs.findIndex((i) => i.id === inputId);
      if (idx < 0) return;
      const current = inputs[idx];
      const merged = { ...current, ...updates };
      if (updates.id != null && updates.id !== inputId) {
        const existingIds = inputs.map((i) => (i.id === inputId ? updates.id! : i.id));
        if (existingIds.filter((x) => x === updates.id).length > 1) {
          setError(`Input ID "${updates.id}" already exists`);
          return;
        }
        const nextInputs = inputs.map((i) => (i.id === inputId ? merged : i));
        const nextValues = { ...(strategy.inputValues ?? {}) };
        nextValues[updates.id] = nextValues[inputId];
        delete nextValues[inputId];
        if (merged.type !== current.type) {
          merged.default = defaultForType(merged.type);
          nextValues[merged.id] =
            typeof merged.default === 'object' && merged.default != null
              ? JSON.stringify(merged.default)
              : (merged.default as string | number);
        }
        updateStrategy(strategy.id, { inputs: nextInputs, inputValues: nextValues });
      } else if (updates.type != null && updates.type !== current.type) {
        merged.default = defaultForType(updates.type);
        const nextValues = { ...(strategy.inputValues ?? {}) };
        nextValues[merged.id] =
          typeof merged.default === 'object' && merged.default != null
            ? JSON.stringify(merged.default)
            : (merged.default as string | number);
        updateStrategy(strategy.id, {
          inputs: inputs.map((i) => (i.id === inputId ? merged : i)),
          inputValues: nextValues,
        });
      } else if (updates.title != null) {
        updateStrategy(strategy.id, {
          inputs: inputs.map((i) => (i.id === inputId ? merged : i)),
        });
      }
      setError(null);
    },
    [strategy, updateStrategy]
  );

  if (!strategySettingsModalOpen || !strategy) return null;

  const strategyInputs = strategy.inputs ?? [];

  return (
    <Modal title="Strategy settings" onClose={handleClose} className="w-[520px] max-w-[95vw]">
      <form onSubmit={handleSubmit}>
        {/* Content: strategy name + base currency on same row */}
        <div className="flex items-end gap-4" style={{ marginBottom: 20 }}>
          <div className="flex-1 min-w-0">
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
          <div style={{ width: 200, flexShrink: 0 }}>
            <Label htmlFor="base-currency-edit">Base currency</Label>
            <SegmentControl
              value={baseCurrency}
              options={CURRENCIES}
              onChange={(c) => setBaseCurrency(c)}
              className="w-full"
            />
          </div>
        </div>

        {/* Strategy inputs section */}
        <div style={{ marginBottom: 20 }}>
          <div
            className="flex items-center justify-between"
            style={{ marginBottom: 10 }}
          >
            <Label>Strategy inputs</Label>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Subviews reference via global.&lt;id&gt;
            </span>
          </div>
          <div
            className="grid gap-x-2 gap-y-2"
            style={{
              padding: 12,
              borderRadius: 'var(--radius-medium)',
              backgroundColor: 'var(--color-bg-hover)',
              border: '1px solid var(--color-border)',
              gridTemplateColumns: '120px 120px 150px 32px',
              width: 'fit-content',
              minWidth: 442,
              alignItems: 'center',
            }}
          >
            {/* Header row */}
            <div style={{ gridColumn: 1 }}>
              <Label className="text-[11px]">ID (unique)</Label>
            </div>
            <div style={{ gridColumn: 2 }}>
              <Label className="text-[11px]">Title</Label>
            </div>
            <div style={{ gridColumn: 3 }}>
              <Label className="text-[11px]">Type</Label>
            </div>
            <div style={{ gridColumn: 4 }} />
            {strategyInputs.map((inp) => (
              <React.Fragment key={inp.id}>
                <div style={{ gridColumn: 1 }}>
                  <Input
                    defaultValue={inp.id}
                    onBlur={(e) => {
                      const v = e.target.value.trim().toLowerCase().replace(/\s+/g, '_');
                      if (v && v !== inp.id) handleUpdateInput(inp.id, { id: v });
                    }}
                    placeholder="e.g. timeRange"
                    style={{ height: 28, fontSize: 12 }}
                  />
                </div>
                <div style={{ gridColumn: 2 }}>
                  <Input
                    value={inp.title}
                    onChange={(e) => handleUpdateInput(inp.id, { title: e.target.value })}
                    placeholder="e.g. Time Range"
                    style={{ height: 28, fontSize: 12 }}
                  />
                </div>
                <div style={{ gridColumn: 3 }}>
                  <Select
                    value={inp.type}
                    onChange={(v) => handleUpdateInput(inp.id, { type: v as StrategyInputConfig['type'] })}
                    options={[...INPUT_TYPES]}
                    style={{ height: 28, fontSize: 12 }}
                  />
                </div>
                <div style={{ gridColumn: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleRemoveInput(inp.id)}
                    className="p-1 rounded hover:bg-[var(--color-bg-input)] transition-colors"
                    style={{ color: 'var(--color-text-muted)' }}
                    title="Remove input"
                  >
                    <Trash2 size={16} strokeWidth={2} />
                  </button>
                </div>
              </React.Fragment>
            ))}
            {/* Add input button - spans full row including trash column */}
            <div style={{ gridColumn: '1 / -1', paddingTop: 8 }}>
              <Button
                type="button"
                variant="primary"
                onClick={handleAddInput}
                className="w-full gap-2"
              >
                <Plus size={14} strokeWidth={2} />
                Add input
              </Button>
            </div>
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
