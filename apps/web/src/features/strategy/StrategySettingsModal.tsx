import React, { useState, useCallback, useEffect } from 'react';
import { Trash2, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import type { StrategyInputConfig } from '@/store/strategy-store';
import { IconPicker } from '@/components/IconPicker';
import { useStrategyStore } from '@/store/strategy-store';
import { useStrategies, useUpdateStrategy, useDeleteStrategy, useMoveStrategy } from '@/api/hooks';
import { useUIStore } from '@/store/ui-store';
import { Modal, Button, Input, Label, Select, SegmentControl } from '@/components/ui';

const CURRENCIES = ['USD', 'CAD'] as const;

const INPUT_TYPES = [
  { value: 'time_range', label: 'Time range' },
  { value: 'ticker_selector', label: 'Ticker' },
  { value: 'number_input', label: 'Number' },
  { value: 'select', label: 'Select' },
  { value: 'segment', label: 'Segment' },
  { value: 'chart_nav', label: 'Chart nav' },
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
    case 'segment':
      return '';
    case 'chart_nav':
      return 0;
    case 'checkbox':
      return false;
    default:
      return undefined;
  }
}

export function StrategySettingsModal() {
  const [name, setName] = useState('');
  const [baseCurrency, setBaseCurrency] = useState<'USD' | 'CAD'>('USD');
  const [marginAccountEnabled, setMarginAccountEnabled] = useState(false);
  const [collateralEnabled, setCollateralEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data: strategies = [] } = useStrategies();
  const activeStrategyId = useStrategyStore((s) => s.activeStrategyId);
  const updateStrategyMut = useUpdateStrategy();
  const deleteStrategyMut = useDeleteStrategy();
  const moveStrategyMut = useMoveStrategy();

  const { strategySettingsModalOpen, setStrategySettingsModalOpen } = useUIStore();

  const strategy = strategies.find((s) => s.id === activeStrategyId);

  const [icon, setIcon] = useState<string | undefined>('');

  useEffect(() => {
    if (strategy) {
      setName(strategy.name);
      setBaseCurrency((strategy.baseCurrency as 'USD' | 'CAD') || 'USD');
      setMarginAccountEnabled(strategy.marginAccountEnabled ?? false);
      setCollateralEnabled(strategy.collateralEnabled ?? false);
      setIcon(strategy.icon ?? '');
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
      updateStrategyMut.mutate({
        id: strategy.id,
        name: trimmed,
        baseCurrency,
        icon: icon || undefined,
        marginAccountEnabled,
        collateralEnabled,
      });
      setStrategySettingsModalOpen(false);
    },
    [name, baseCurrency, icon, marginAccountEnabled, collateralEnabled, strategy, updateStrategyMut, setStrategySettingsModalOpen]
  );

  const handleDelete = useCallback(() => {
    if (!strategy) return;
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    deleteStrategyMut.mutate(strategy.id);
    setStrategySettingsModalOpen(false);
  }, [strategy, deleteConfirm, deleteStrategyMut, setStrategySettingsModalOpen]);

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
    if (type === 'select' || type === 'segment') {
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
    updateStrategyMut.mutate({ id: strategy.id, inputs: nextInputs, inputValues: nextValues });
    setError(null);
  }, [strategy, updateStrategyMut]);

  const handleRemoveInput = useCallback(
    (inputId: string) => {
      if (!strategy) return;
      const next = (strategy.inputs ?? []).filter((i) => i.id !== inputId);
      const nextValues = { ...(strategy.inputValues ?? {}) };
      delete nextValues[inputId];
      updateStrategyMut.mutate({ id: strategy.id, inputs: next, inputValues: nextValues });
    },
    [strategy, updateStrategyMut]
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
        updateStrategyMut.mutate({ id: strategy.id, inputs: nextInputs, inputValues: nextValues });
      } else if (updates.type != null && updates.type !== current.type) {
        merged.default = defaultForType(updates.type);
        const nextValues = { ...(strategy.inputValues ?? {}) };
        nextValues[merged.id] =
          typeof merged.default === 'object' && merged.default != null
            ? JSON.stringify(merged.default)
            : (merged.default as string | number);
        updateStrategyMut.mutate({
          id: strategy.id,
          inputs: inputs.map((i) => (i.id === inputId ? merged : i)),
          inputValues: nextValues,
        });
      } else if (updates.title != null) {
        updateStrategyMut.mutate({
          id: strategy.id,
          inputs: inputs.map((i) => (i.id === inputId ? merged : i)),
        });
      }
      setError(null);
    },
    [strategy, updateStrategyMut]
  );

  if (!strategySettingsModalOpen || !strategy) return null;

  const strategyInputs = strategy.inputs ?? [];

  return (
    <Modal title="Strategy settings" onClose={handleClose} className="w-[520px] max-w-[95vw]">
      <form onSubmit={handleSubmit}>
        {/* Name and Icon on same row */}
        <div style={{ marginBottom: 20 }} className="flex gap-3 items-end">
          <div className="flex-1 min-w-0">
            <Label htmlFor="strategy-name-edit">Name</Label>
            <div className="mt-1">
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
          </div>
          <div style={{ minWidth: 160 }}>
            <IconPicker
              value={icon || undefined}
              onChange={(v) => setIcon(v ?? '')}
              label="Icon"
              placeholder="Default"
              showColorPicker={false}
              defaultIcon="LayoutDashboard"
            />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <Label>Base currency</Label>
          <div className="flex flex-wrap items-center gap-4 mt-1">
            <div style={{ width: 150 }}>
              <SegmentControl
                value={baseCurrency}
                options={CURRENCIES}
                onChange={(c) => setBaseCurrency(c)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="strategy-margin"
                checked={marginAccountEnabled}
                onChange={(e) => setMarginAccountEnabled(e.target.checked)}
              />
              <Label htmlFor="strategy-margin" className="!mb-0 cursor-pointer">
                Margin
              </Label>
            </div>
            {marginAccountEnabled && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="strategy-collateral"
                  checked={collateralEnabled}
                  onChange={(e) => setCollateralEnabled(e.target.checked)}
                />
                <Label htmlFor="strategy-collateral" className="!mb-0 cursor-pointer">
                  Collateral
                </Label>
              </div>
            )}
          </div>
        </div>

        {/* Strategy order */}
        {strategies.length > 1 && (
          <div style={{ marginBottom: 20 }}>
            <Label>Order in sidebar</Label>
            <div
              className="flex flex-col gap-1 mt-1"
              style={{
                padding: 12,
                borderRadius: 'var(--radius-medium)',
                backgroundColor: 'var(--palette-grey-4)',
                border: '1px solid var(--palette-grey-3)',
              }}
            >
              {strategies.map((st, idx) => {
                const canMoveUp = idx > 0;
                const canMoveDown = idx < strategies.length - 1;
                return (
                  <React.Fragment key={st.id}>
                    {idx > 0 && (
                      <div style={{ height: 0, borderTop: '1px solid var(--palette-grey-3)' }} aria-hidden />
                    )}
                    <div
                      className="flex items-center gap-2"
                    style={{
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-medium)',
                      backgroundColor: st.id === strategy?.id ? 'var(--color-bg-input)' : undefined,
                    }}
                  >
                    <span className="text-xs font-medium truncate flex-1 min-w-0" style={{ color: 'var(--color-text-primary)' }}>
                      {st.name}
                    </span>
                    <div className="flex shrink-0">
                      <button
                        type="button"
                        className="p-1 rounded transition-colors"
                        style={{
                          color: canMoveUp ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
                          opacity: canMoveUp ? 1 : 0.4,
                        }}
                        onClick={() => canMoveUp && moveStrategyMut.mutate({ id: st.id, direction: 'up' })}
                        disabled={!canMoveUp}
                        title="Move up"
                      >
                        <ChevronUp size={14} strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        className="p-1 rounded transition-colors"
                        style={{
                          color: canMoveDown ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
                          opacity: canMoveDown ? 1 : 0.4,
                        }}
                        onClick={() => canMoveDown && moveStrategyMut.mutate({ id: st.id, direction: 'down' })}
                        disabled={!canMoveDown}
                        title="Move down"
                      >
                        <ChevronDown size={14} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Inputs section */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 10 }}>
            <Label>Inputs</Label>
          </div>
          <div
            className="grid gap-x-2 gap-y-2"
            style={{
              padding: 12,
              borderRadius: 'var(--radius-medium)',
              backgroundColor: 'var(--palette-grey-4)',
              border: '1px solid var(--palette-grey-3)',
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
            {strategyInputs.map((inp, idx) => (
              <React.Fragment key={inp.id}>
                {idx > 0 && (
                  <div style={{ gridColumn: '1 / -1', height: 0, borderTop: '1px solid var(--palette-grey-3)' }} aria-hidden />
                )}
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
