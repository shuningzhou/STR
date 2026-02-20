import { cn } from '@/lib/utils';

interface SegmentControlOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentControlPropsBase<T extends string> {
  value: T;
  onChange: (value: T) => void;
  className?: string;
  /** When true, reduces height for top bar / compact layouts */
  compact?: boolean;
}

type SegmentControlProps<T extends string> =
  | (SegmentControlPropsBase<T> & { options: readonly T[]; optionsWithLabels?: never })
  | (SegmentControlPropsBase<T> & { options?: never; optionsWithLabels: readonly SegmentControlOption<T>[] });

export function SegmentControl<T extends string>({
  value,
  options,
  optionsWithLabels,
  onChange,
  className,
  compact = false,
}: SegmentControlProps<T>) {
  const items = optionsWithLabels
    ? optionsWithLabels.map((o) => ({ value: o.value, label: o.label }))
    : (options ?? []).map((v) => ({ value: v, label: v }));
  const height = compact ? 24 : undefined;
  return (
    <div
      className={cn('flex rounded-[var(--radius-medium)]', className)}
      style={{
        backgroundColor: 'var(--color-bg-input)',
        minHeight: height ?? 'var(--control-height)',
        padding: compact ? 2 : 4,
      }}
    >
      {items.map(({ value: optValue, label }) => {
        const isSelected = value === optValue;
        return (
          <button
            key={optValue}
            type="button"
            onClick={() => onChange(optValue)}
            className={cn(
              'flex-1 flex items-center justify-center font-medium transition-colors rounded-[4px]',
              compact ? 'min-h-[20px] text-[11px]' : 'min-h-[calc(var(--control-height)-8px)] text-[13px]'
            )}
            style={{
              backgroundColor: isSelected ? 'var(--color-active)' : 'transparent',
              color: isSelected ? 'var(--color-text-active)' : 'var(--color-text-secondary)',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
            }}
            onMouseLeave={(e) => {
              if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
