import { Plus, Settings, List } from 'lucide-react';
import { useUIStore } from '@/store/ui-store';

const floatingButton =
  'w-11 h-11 flex items-center justify-center rounded-full cursor-pointer transition-colors shadow-sm';

export function CanvasArea() {
  const { activeStrategyId } = useUIStore();

  return (
    <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
      {/* Floating buttons: top-right of canvas */}
      <div
        className="absolute top-4 right-4 z-10 flex flex-col gap-2"
        style={{ backgroundColor: 'transparent' }}
      >
        <button
          type="button"
          className={floatingButton}
          style={{
            backgroundColor: 'var(--color-bg-card)',
            color: 'var(--color-text-primary)',
            boxShadow: '0 1px 3px var(--color-shadow)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-card)';
          }}
          title="Add Transaction"
        >
          <Plus size={20} strokeWidth={2} />
        </button>
        <button
          type="button"
          className={floatingButton}
          style={{
            backgroundColor: 'var(--color-bg-card)',
            color: 'var(--color-text-primary)',
            boxShadow: '0 1px 3px var(--color-shadow)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-card)';
          }}
          title="Settings"
        >
          <Settings size={20} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          className={floatingButton}
          style={{
            backgroundColor: 'var(--color-bg-card)',
            color: 'var(--color-text-primary)',
            boxShadow: '0 1px 3px var(--color-shadow)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-card)';
          }}
          title="View All Transactions"
        >
          <List size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* Canvas content */}
      <div
        className="flex-1 flex items-center justify-center overflow-auto"
        style={{
          padding: 'var(--space-section)',
          backgroundColor: 'var(--color-bg-page)',
        }}
      >
        {activeStrategyId ? (
          <div className="text-center">
            <p
              className="text-lg font-semibold mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Canvas
            </p>
            <p
              className="text-sm"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Click empty space to add a subview
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p
              className="text-lg font-semibold mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              No strategy selected
            </p>
            <p
              className="text-sm"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Select a strategy in the sidebar or create one
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
