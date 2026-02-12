import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}

export function Modal({ title, children, onClose, className }: ModalProps) {
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
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />

      <div
        className={cn(
          'relative w-full max-w-sm rounded-[var(--radius-card)]',
          'border border-[var(--color-border)]',
          className
        )}
        style={{
          backgroundColor: 'var(--color-bg-card)',
          padding: 'var(--space-modal)',
          boxShadow: '0 4px 24px var(--color-shadow)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="modal-title"
          className="font-semibold"
          style={{
            fontSize: 'var(--font-size-title)',
            color: 'var(--color-text-primary)',
            marginBottom: 20,
          }}
        >
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
