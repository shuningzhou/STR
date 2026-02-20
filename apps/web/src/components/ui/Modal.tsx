import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
  /** 'lg' = wider modal (max-w-2xl) for forms with many fields */
  size?: 'default' | 'lg';
  /** Optional content to render in the top right of the header (e.g. currency badge) */
  headerRight?: React.ReactNode;
}

export function Modal({ title, children, onClose, className, size = 'default', headerRight }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden
      />

      <div
        className={cn(
          'relative w-full rounded-[var(--radius-card)]',
          size === 'lg' ? 'max-w-[772px]' : 'max-w-[484px]', // default 384+100, lg 672+100
          'border border-[var(--color-border)]',
          className
        )}
        style={{
          backgroundColor: 'var(--palette-offblack)',
          padding: 'var(--space-modal)',
          boxShadow: '0 4px 24px var(--color-shadow)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-modal)',
            gap: 12,
          }}
        >
          <h2
            id="modal-title"
            className="font-semibold"
            style={{
              fontSize: 'var(--font-size-title)',
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            {title}
          </h2>
          {headerRight}
        </div>
        {children}
      </div>
    </div>
  );
}
