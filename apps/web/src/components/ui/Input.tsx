import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  className?: string;
}

const inputBaseStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-bg-input)',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border)',
  paddingLeft: 8,
  paddingRight: 16,
  height: 'var(--control-height)',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className, style, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            'w-full rounded-[var(--radius-medium)] text-[13px] transition-colors outline-none',
            'placeholder:text-[var(--color-text-muted)]',
            className
          )}
          style={{ ...inputBaseStyle, ...style }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-active)';
            e.currentTarget.style.boxShadow = '0 0 0 1px var(--color-active)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          {...props}
        />
        {error && (
          <p
            className="mt-1.5 text-[11px]"
            style={{ color: 'var(--color-negative)' }}
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
