import { useMemo } from 'react';
import { Pencil } from 'lucide-react';
import type { Strategy, Subview } from '@/store/strategy-store';
import { useStrategyStore } from '@/store/strategy-store';
import { useUIStore } from '@/store/ui-store';
import { cn } from '@/lib/utils';
import { getPipelineInputs } from '@/features/pipeline/pipelineInputs';
import { Input } from '@/components/ui';
import { SubviewSpecRenderer } from '@/features/subviews/SubviewSpecRenderer';
import { SEED_CONTEXT, SEED_INPUTS } from '@/lib/subview-seed-data';

interface SubviewCardProps {
  subview: Subview;
  strategyId: string;
  strategy?: Strategy | null;
  isEditMode?: boolean;
}

/** Normalize input value (parse time_range JSON, etc.) */
function normalizeInputValue(key: string, val: unknown): unknown {
  if (key === 'timeRange' && typeof val === 'string') {
    try {
      const parsed = JSON.parse(val) as { start?: string; end?: string };
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {
      return val;
    }
  }
  return val;
}

/** Build inputs for Python from inputValues + SEED_INPUTS defaults */
function buildInputs(inputValues: Record<string, string | number>): Record<string, unknown> {
  const base = { ...SEED_INPUTS } as Record<string, unknown>;
  for (const [key, val] of Object.entries(inputValues)) {
    base[key] = normalizeInputValue(key, val);
  }
  return base;
}

/** Build strategy inputs config and values for global.xxx refs */
function buildGlobalInputs(strategy: Strategy | null | undefined): {
  config: Record<string, { type: string; title: string; default?: unknown; options?: { value: string; label: string }[]; min?: number; max?: number }>;
  values: Record<string, unknown>;
} {
  const config: Record<string, { type: string; title: string; default?: unknown; options?: { value: string; label: string }[]; min?: number; max?: number }> = {};
  const values: Record<string, unknown> = {};
  const inputs = strategy?.inputs ?? [];
  const inputValues = strategy?.inputValues ?? {};
  for (const inp of inputs) {
    config[inp.id] = {
      type: inp.type,
      title: inp.title,
      default: inp.default,
      options: inp.options,
      min: inp.min,
      max: inp.max,
    };
    const raw = inputValues[inp.id] ?? inp.default;
    values[inp.id] = normalizeInputValue(inp.id, raw);
  }
  return { config, values };
}

export function SubviewCard({ subview, strategyId, strategy, isEditMode = true }: SubviewCardProps) {
  const setSubviewSettingsOpen = useUIStore((s) => s.setSubviewSettingsOpen);
  const updateSubviewInputValue = useStrategyStore((s) => s.updateSubviewInputValue);
  const updateStrategyInputValue = useStrategyStore((s) => s.updateStrategyInputValue);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSubviewSettingsOpen({ strategyId, subviewId: subview.id });
  };

  const pipelineInputs = getPipelineInputs(subview.pipeline);
  const inputValues = subview.inputValues ?? {};

  const specInputs = useMemo(
    () => (subview.spec ? buildInputs(inputValues) : null),
    [subview.spec, inputValues]
  );

  const globalInputs = useMemo(
    () => buildGlobalInputs(strategy),
    [strategy]
  );

  const hasSpec = !!subview.spec;

  return (
    <div
      className={cn(
        'h-full flex flex-col rounded-[var(--radius-card)] overflow-hidden relative',
        'border border-[var(--color-border)]'
      )}
      style={{
        backgroundColor: 'var(--color-bg-card)',
        padding: 'var(--subview-card-padding)',
      }}
    >
      {/* Top bar - draggable, no background; above content */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center"
        style={{ minHeight: 'var(--subview-top-bar-height)', height: 'var(--subview-top-bar-height)' }}
      >
        <div
          className={cn(
            'subview-drag-handle flex-1 flex items-center min-w-0 h-full',
            isEditMode && 'cursor-grab active:cursor-grabbing'
          )}
          style={{ paddingLeft: 10, paddingRight: 4 }}
        >
          <span
            className="text-[13px] font-medium truncate max-w-[150px]"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {subview.name}
          </span>
        </div>
        {isEditMode && (
          <button
            type="button"
            onClick={handleMenuClick}
            className="w-8 h-8 shrink-0 flex items-center justify-center self-center rounded-[var(--radius-medium)] transition-colors"
            style={{
              marginRight: 5,
              color: 'var(--color-text-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
            title="Subview settings"
          >
            <Pencil size={16} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Spec-based body or pipeline placeholder */}
      {hasSpec && subview.spec && specInputs ? (
        <SubviewSpecRenderer
          spec={subview.spec}
          pythonCode={subview.spec.python_code}
          context={SEED_CONTEXT}
          inputs={specInputs}
          onInputChange={(key, value) =>
            updateSubviewInputValue(strategyId, subview.id, key, value)
          }
          globalInputsConfig={globalInputs.config}
          globalInputValues={globalInputs.values}
          onGlobalInputChange={(key, value) =>
            updateStrategyInputValue(strategyId, key, value)
          }
        />
      ) : (
        <div className="flex-1 flex flex-col min-h-0" style={{ paddingTop: 'var(--subview-top-bar-height)' }}>
          {pipelineInputs.length > 0 && (
            <div
              className="flex flex-wrap gap-2 p-2 shrink-0"
              style={{ gap: 'var(--space-gap)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {pipelineInputs.map((inp) => (
                <div key={inp.inputKey} className="flex flex-col gap-0.5 min-w-[80px]">
                  <label
                    className="text-[11px] font-medium"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {inp.label}
                  </label>
                  <Input
                    value={String(inputValues[inp.inputKey] ?? inp.defaultValue)}
                    onChange={(e) => {
                      const v = e.target.value;
                      updateSubviewInputValue(strategyId, subview.id, inp.inputKey, v);
                    }}
                    className="text-[11px]"
                    style={{ height: 26 }}
                  />
                </div>
              ))}
            </div>
          )}
          <div
            className={cn(
              'flex-1 flex items-center justify-center p-4 min-h-[60px] gap-1',
              pipelineInputs.length === 0 && 'flex'
            )}
            style={{ color: 'var(--color-text-muted)' }}
          >
            {pipelineInputs.length === 0 ? (
              isEditMode ? (
                <>
                  <span className="text-xs">Click</span>
                  <Pencil size={14} strokeWidth={1.5} className="shrink-0" />
                  <span className="text-xs">to get started</span>
                </>
              ) : (
                <span className="text-xs">No spec configured</span>
              )
            ) : (
              <span className="text-xs">Legacy pipeline</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
