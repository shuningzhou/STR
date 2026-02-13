import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: 'var(--color-bg-primary)',
    color: 'var(--color-text-on-primary)',
  },
  secondary: {
    backgroundColor: 'var(--color-bg-input)',
    color: 'var(--color-text-primary)',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--color-text-primary)',
  },
  danger: {
    backgroundColor: 'var(--color-negative)',
    color: 'white',
  },
};

const variantHover: Record<ButtonVariant, Partial<React.CSSProperties>> = {
  primary: { backgroundColor: 'var(--color-bg-primary-hover)' },
  secondary: { backgroundColor: 'var(--color-bg-hover)' },
  ghost: { backgroundColor: 'var(--color-bg-hover)' },
  danger: { opacity: 0.9 },
};

const sizeStyles = {
  sm: 'px-3 text-xs',
  md: 'px-5 text-[13px]',
  lg: 'px-6 text-sm',
};

const buttonBaseStyle = {
  height: 'var(--control-height)',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', className, children, disabled, type = 'button', style, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center font-medium rounded-[var(--radius-button)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(base, sizeStyles[size], className)}
        style={{
          ...variantStyles[variant],
          ...buttonBaseStyle,
          ...style,
        }}
        onMouseEnter={(e) => {
          if (disabled) return;
          Object.assign(e.currentTarget.style, variantHover[variant]);
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, variantStyles[variant]);
        }}
        {...props}
        type={type}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
