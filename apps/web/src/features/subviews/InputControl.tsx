/**
 * Renders a single input control by type (time_range, ticker_selector, etc.).
 * Shared by SubviewSpecRenderer and StrategyInputsBar.
 */
import { useEffect } from 'react';
import { Input } from '@/components/ui';

export const INPUT_WIDTHS: Record<string, number> = {
  time_range: 240,
  ticker_selector: 100,
  number_input: 100,
  select: 120,
  checkbox: 75,
};

const VALUE_BOX_STYLE: React.CSSProperties = {
  textAlign: 'right',
  paddingLeft: 5,
  paddingRight: 5,
};

export interface InputControlProps {
  inputKey: string;
  cfg: { type: string; title: string; default?: unknown; options?: { value: string; label: string }[] };
  inputs: Record<string, unknown>;
  onInputChange?: (key: string, value: string | number) => void;
  context: unknown;
  /** When true, hide the label and show title as tooltip on hover (unless showTitleInCompact) */
  compact?: boolean;
  /** When compact, show the title label. Used for top bar inputs with topbarShowTitle: true */
  showTitleInCompact?: boolean;
}

export function InputControl({
  inputKey,
  cfg,
  inputs,
  onInputChange,
  context,
  compact = false,
  showTitleInCompact = false,
}: InputControlProps) {
  const inputType = cfg.type;
  const width = INPUT_WIDTHS[inputType] ?? 160;
  const isEditable = !!onInputChange;

  // Persist corrected range when start > end (enforce start <= end)
  useEffect(() => {
    if (inputType !== 'time_range' || !onInputChange) return;
    const tr = (inputs[inputKey] as { start?: string; end?: string }) ?? {};
    const start = tr.start ?? '';
    const end = tr.end ?? '';
    if (start && end && start > end) {
      onInputChange(inputKey, JSON.stringify({ start: end, end: start }));
    }
  }, [inputType, inputKey, inputs, onInputChange]);

  const content = inputType === 'time_range' ? (
        isEditable ? (
          (() => {
            const tr = (inputs[inputKey] as { start?: string; end?: string }) ?? {};
            const start = tr.start ?? new Date().toISOString().slice(0, 10);
            const end = tr.end ?? new Date().toISOString().slice(0, 10);
            const normalizedEnd = end < start ? start : end;
            const normalizedStart = start > normalizedEnd ? normalizedEnd : start;
            return (
          <div className="flex gap-1">
            <input
              type="date"
              value={normalizedStart}
              max={normalizedEnd}
              onChange={(e) => {
                const nextStart = e.target.value;
                const tr = (inputs[inputKey] as { start?: string; end?: string }) ?? {};
                const nextEnd = nextStart > (tr.end ?? nextStart) ? nextStart : (tr.end ?? nextStart);
                onInputChange!(inputKey, JSON.stringify({ start: nextStart, end: nextEnd }));
              }}
              className="flex-1 min-w-0 rounded-[var(--radius-medium)] border text-[13px] outline-none"
              style={{
                height: 'var(--control-height)',
                backgroundColor: 'var(--color-bg-input)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
                textAlign: 'right',
                paddingLeft: 5,
                paddingRight: 5,
              }}
            />
            <input
              type="date"
              value={normalizedEnd}
              min={normalizedStart}
              onChange={(e) => {
                const nextEnd = e.target.value;
                const tr = (inputs[inputKey] as { start?: string; end?: string }) ?? {};
                const nextStart = nextEnd < (tr.start ?? nextEnd) ? nextEnd : (tr.start ?? nextEnd);
                onInputChange!(inputKey, JSON.stringify({ start: nextStart, end: nextEnd }));
              }}
              className="flex-1 min-w-0 rounded-[var(--radius-medium)] border text-[13px] outline-none"
              style={{
                height: 'var(--control-height)',
                backgroundColor: 'var(--color-bg-input)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
                textAlign: 'right',
                paddingLeft: 5,
                paddingRight: 5,
              }}
            />
          </div>
            );
          })()
        ) : (
          <div
            className="rounded-[var(--radius-medium)] border text-[13px]"
            style={{
              height: 'var(--control-height)',
              backgroundColor: 'var(--color-bg-input)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              ...VALUE_BOX_STYLE,
            }}
          >
            {(() => {
              const v = inputs[inputKey] as { start?: string; end?: string } | undefined;
              if (v && typeof v === 'object' && 'start' in v && 'end' in v) {
                const a = v.start ?? '';
                const b = v.end ?? '';
                const lo = a && b && a > b ? b : a;
                const hi = a && b && a > b ? a : b;
                return lo && hi ? `${lo} — ${hi}` : '—';
              }
              return '—';
            })()}
          </div>
        )
      ) : inputType === 'ticker_selector' ? (
        (() => {
          const txs = (context as { transactions?: { instrumentSymbol?: string }[] })?.transactions ?? [];
          const symbols = [
            'all',
            ...Array.from(
              new Set(
                txs
                  .map((tx) => tx?.instrumentSymbol)
                  .filter((s): s is string => typeof s === 'string' && s.length > 0)
              )
            ).sort(),
          ];
          return isEditable ? (
            <select
              value={String(inputs[inputKey] ?? (cfg.default ?? 'all'))}
              onChange={(e) => onInputChange!(inputKey, e.target.value)}
              className="rounded-[var(--radius-medium)] border text-[13px] w-full outline-none"
              style={{
                height: 'var(--control-height)',
                backgroundColor: 'var(--color-bg-input)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
                ...VALUE_BOX_STYLE,
              }}
            >
              {symbols.map((sym) => (
                <option key={sym} value={sym}>
                  {sym}
                </option>
              ))}
            </select>
          ) : (
            <div
              className="rounded-[var(--radius-medium)] border text-[13px]"
              style={{
                height: 'var(--control-height)',
                backgroundColor: 'var(--color-bg-input)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
                display: 'flex',
                alignItems: 'center',
                ...VALUE_BOX_STYLE,
              }}
            >
              {String(inputs[inputKey] ?? 'all')}
            </div>
          );
        })()
      ) : inputType === 'number_input' ? (
        isEditable ? (
          <input
            type="number"
            value={String(inputs[inputKey] ?? (cfg as { default?: number }).default ?? 0)}
            onChange={(e) =>
              onInputChange!(inputKey, parseFloat(e.target.value) || 0)
            }
            className="number-input-with-gap w-full rounded-[var(--radius-medium)] text-[13px] outline-none"
            style={{
              backgroundColor: 'var(--color-bg-input)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              paddingLeft: 5,
              paddingRight: 6,
              height: 'var(--control-height)',
              textAlign: 'right',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-active)';
              e.currentTarget.style.boxShadow = '0 0 0 1px var(--color-active)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        ) : (
          <div
            className="rounded-[var(--radius-medium)] border text-[13px]"
            style={{
              height: 'var(--control-height)',
              backgroundColor: 'var(--color-bg-input)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              ...VALUE_BOX_STYLE,
            }}
          >
            {String(inputs[inputKey] ?? (cfg as { default?: number }).default ?? 0)}
          </div>
        )
      ) : inputType === 'select' ? (
        isEditable ? (
          <select
            value={String(inputs[inputKey] ?? (cfg as { default?: string }).default ?? '')}
            onChange={(e) => onInputChange!(inputKey, e.target.value)}
            className="rounded-[var(--radius-medium)] border text-[13px] w-full outline-none"
            style={{
              height: 'var(--control-height)',
              backgroundColor: 'var(--color-bg-input)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
              ...VALUE_BOX_STYLE,
            }}
          >
            {((cfg as { options?: { value: string; label: string }[] }).options ?? []).map(
              (opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              )
            )}
          </select>
        ) : (
          <div
            className="rounded-[var(--radius-medium)] border text-[13px]"
            style={{
              height: 'var(--control-height)',
              backgroundColor: 'var(--color-bg-input)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              ...VALUE_BOX_STYLE,
            }}
          >
            {String(inputs[inputKey] ?? (cfg as { default?: string }).default ?? '')}
          </div>
        )
      ) : inputType === 'checkbox' ? (
        isEditable ? (
          <label className="flex items-center gap-2 cursor-pointer h-[var(--control-height)]">
            <input
              type="checkbox"
              checked={Boolean(inputs[inputKey] ?? (cfg as { default?: boolean }).default)}
              onChange={(e) => onInputChange!(inputKey, e.target.checked ? 1 : 0)}
              className="rounded"
            />
          </label>
        ) : (
          <div
            className="rounded-[var(--radius-medium)] border text-[13px]"
            style={{
              height: 'var(--control-height)',
              backgroundColor: 'var(--color-bg-input)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              ...VALUE_BOX_STYLE,
            }}
          >
            {String(inputs[inputKey] ?? (cfg as { default?: boolean }).default ?? false)}
          </div>
        )
      ) : (
        <div
          className="rounded-[var(--radius-medium)] border text-[13px]"
          style={{
            height: 'var(--control-height)',
            backgroundColor: 'var(--color-bg-input)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
            display: 'flex',
            alignItems: 'center',
            ...VALUE_BOX_STYLE,
          }}
        >
          {String(inputs[inputKey] ?? '')}
        </div>
      );

  const showLabel = !compact || showTitleInCompact;

  return (
    <div
      className={`flex shrink-0 ${showLabel ? 'flex-row items-center' : 'flex-col'} ${compact && !showTitleInCompact ? 'gap-0' : ''}`}
      style={{ minWidth: showLabel ? undefined : width, ...(showLabel ? { gap: 5 } : { width, gap: 2 }) }}
    >
      <div
        {...(compact && !showTitleInCompact ? { title: cfg.title } : {})}
        className={compact ? 'flex flex-col gap-1' : ''}
        style={
          showLabel
            ? inputType === 'checkbox'
              ? { width: 'auto', minWidth: 0 }
              : { width, minWidth: width }
            : { width }
        }
      >
        {content}
      </div>
      {showLabel && (
        <label
          className="text-[11px] font-medium shrink-0 whitespace-nowrap"
          style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-label)' }}
        >
          {cfg.title}
        </label>
      )}
    </div>
  );
}
