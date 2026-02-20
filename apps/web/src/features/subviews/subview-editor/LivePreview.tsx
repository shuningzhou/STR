import { useMemo } from 'react';
import { Pencil } from 'lucide-react';
import { getIconComponent } from '@/lib/icons';
import type { SubviewSpec } from '@str/shared';
import type { Strategy } from '@/store/strategy-store';
import { cn } from '@/lib/utils';
import { SubviewSpecRenderer, resolveColor } from '../SubviewSpecRenderer';
import { InputControl } from '../InputControl';

function normalizeInputValue(inp: { id: string; type: string }, val: unknown): unknown {
  if (inp.type === 'time_range' && typeof val === 'string') {
    try {
      const parsed = JSON.parse(val) as { start?: string; end?: string };
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {
      return val;
    }
  }
  return val;
}

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
    values[inp.id] = normalizeInputValue(inp, raw);
  }
  return { config, values };
}

interface LivePreviewProps {
  spec: SubviewSpec | null;
  pythonCode: string;
  context: unknown;
  inputs: Record<string, unknown>;
  onInputChange?: (key: string, value: unknown) => void;
  strategy?: Strategy | null;
  onGlobalInputChange?: (key: string, value: string | number) => void;
}

/**
 * Renders a subview from its JSON spec — same structure as SubviewCard on canvas.
 * Live Preview is a mini canvas: the card looks identical to the real canvas card.
 */
export function LivePreview({ spec, pythonCode, context, inputs, onInputChange, strategy, onGlobalInputChange }: LivePreviewProps) {
  const globalInputs = useMemo(() => buildGlobalInputs(strategy), [strategy]);

  type SpecLike = { icon?: string; iconColor?: string; titleColor?: string; inputs?: Record<string, { topbar?: number; topbarShowTitle?: boolean; type?: string; title?: string; default?: unknown; options?: { value: string; label: string }[]; min?: number; max?: number }> };
  const specLike = spec as (SubviewSpec & SpecLike) | null;
  const specIcon = specLike?.icon;
  const iconColorRaw = specLike?.iconColor ?? 'var(--color-text-primary)';
  const specIconColor = resolveColor(iconColorRaw) ?? iconColorRaw;
  const specTitleColor = specIcon ? specIconColor : (resolveColor(specLike?.titleColor) ?? specLike?.titleColor ?? 'var(--color-text-primary)');
  const IconComp = specIcon ? getIconComponent(specIcon) : null;

  const topbarInputs = useMemo(() => {
    const inputs = specLike?.inputs ?? {};
    return Object.entries(inputs)
      .filter(([, cfg]) => cfg?.topbar != null)
      .sort(([, a], [, b]) => (a?.topbar ?? 0) - (b?.topbar ?? 0))
      .map(([key, cfg]) => ({ key, cfg }));
  }, [specLike?.inputs]);

  if (!spec) {
    return (
      <div
        className="flex items-center justify-center h-32 rounded-[var(--radius-card)] border"
        style={{ backgroundColor: 'var(--color-bg-input)', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}
      >
        Fix JSON to see preview
      </div>
    );
  }

  return (
    <div
      className={cn(
        'h-full flex flex-col rounded-[var(--radius-card)] overflow-hidden relative',
        'border border-[var(--color-border)]'
      )}
      style={{
        backgroundColor: 'var(--color-bg-card)',
        padding: 0,
      }}
    >
      {/* Top bar — matches SubviewCard exactly */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center w-full"
        style={{ minHeight: 'var(--subview-top-bar-height)', height: 'var(--subview-top-bar-height)', paddingLeft: 5, paddingRight: 5 }}
      >
        <div
          className="subview-drag-handle flex-1 flex items-center gap-2 cursor-grab active:cursor-grabbing min-w-0 h-full"
          style={{ paddingLeft: 5, paddingRight: 4 }}
        >
          {IconComp && (
            <IconComp
              size={16}
              strokeWidth={1.5}
              className="shrink-0"
              style={{ color: specIconColor }}
            />
          )}
          <span
            className="min-w-0 flex-1 truncate text-[13px] font-medium"
            style={{ color: specTitleColor }}
          >
            {spec.name}
          </span>
        </div>
        {topbarInputs.length > 0 && (
          <div
            className="flex flex-wrap items-center justify-end shrink-0"
            style={{ gap: 5, marginRight: 5, marginLeft: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            {topbarInputs.map(({ key, cfg }, i) => (
              <span key={key} className="flex items-end" style={{ gap: 5 }}>
                {i > 0 && (
                  <div
                    style={{
                      width: 1,
                      alignSelf: 'stretch',
                      backgroundColor: 'var(--color-border)',
                    }}
                    aria-hidden
                  />
                )}
                <InputControl
                  compact
                  showTitleInCompact={cfg.topbarShowTitle !== false}
                  inputKey={key}
                  cfg={{
                    type: cfg.type ?? 'select',
                    title: cfg.title ?? key,
                    default: cfg.default,
                    options: cfg.options,
                    min: cfg.min,
                    max: cfg.max,
                  }}
                  inputs={inputs}
                  onInputChange={onInputChange}
                  context={context}
                />
              </span>
            ))}
          </div>
        )}
        <div
          className="w-6 h-6 shrink-0 flex items-center justify-center self-center rounded-[var(--radius-medium)]"
          style={{ marginRight: 5, color: 'var(--color-text-secondary)' }}
          title="Preview (edit in main editor)"
          aria-hidden
        >
          <Pencil size={12} strokeWidth={1.5} />
        </div>
      </div>

      {/* Body — layout from JSON spec */}
      <SubviewSpecRenderer
        spec={spec}
        pythonCode={pythonCode}
        context={context}
        inputs={inputs}
        onInputChange={onInputChange}
        globalInputsConfig={globalInputs.config}
        globalInputConfig={strategy?.inputs?.map((i) => ({ id: i.id, type: i.type }))}
        globalInputValues={globalInputs.values}
        onGlobalInputChange={onGlobalInputChange}
      />
    </div>
  );
}
