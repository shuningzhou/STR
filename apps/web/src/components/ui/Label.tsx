import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  className?: string;
  /** Cursor-style: uppercase muted label */
  uppercase?: boolean;
  /** When true, no bottom margin (for inline row layout) */
  inline?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ children, className, uppercase = true, inline, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn('block shrink-0', className)}
        style={{
          fontSize: 'var(--font-size-label)',
          fontWeight: 'var(--font-weight-label)',
          letterSpacing: uppercase ? 'var(--letter-spacing-label)' : undefined,
          textTransform: uppercase ? 'uppercase' : undefined,
          color: 'var(--color-text-muted)',
          marginBottom: inline ? 0 : 2,
        }}
        {...props}
      >
        {children}
      </label>
    );
  }
);

Label.displayName = 'Label';
