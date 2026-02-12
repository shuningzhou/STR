import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            'w-full rounded-[var(--radius-medium)] text-[13px] transition-colors outline-none',
            'placeholder:text-[var(--color-text-muted)]',
            className
          )}
          style={{
            backgroundColor: 'var(--color-bg-input)',
            color: 'var(--color-text-primary)',
            border: '1px solid transparent',
            paddingLeft: 4,
            paddingRight: 16,
            height: 'var(--control-height)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'transparent';
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
