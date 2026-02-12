import { cn } from '@/lib/utils';

interface SegmentControlProps<T extends string> {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentControl<T extends string>({
  value,
  options,
  onChange,
  className,
}: SegmentControlProps<T>) {
  return (
    <div
      className={cn('flex p-0.5 rounded-[var(--radius-medium)]', className)}
      style={{ backgroundColor: 'var(--color-bg-input)', minHeight: 'var(--control-height)' }}
    >
      {options.map((opt) => {
        const isSelected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className="flex-1 min-h-[calc(var(--control-height)-4px)] rounded-[6px] text-[13px] font-medium transition-colors flex items-center justify-center"
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
            {opt}
          </button>
        );
      })}
    </div>
  );
}
