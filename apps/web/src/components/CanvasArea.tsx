import { Plus, Settings, List } from 'lucide-react';
import { useStrategyStore } from '@/store/strategy-store';
import { useUIStore } from '@/store/ui-store';

const floatingButton =
  'w-9 h-9 flex items-center justify-center rounded-[var(--radius-button)] cursor-pointer transition-colors';

export function CanvasArea() {
  const activeStrategyId = useStrategyStore((s) => s.activeStrategyId);
  const strategies = useStrategyStore((s) => s.strategies);
  const { setStrategySettingsModalOpen } = useUIStore();
  const hasStrategies = strategies.length > 0;

  const handleGearClick = () => {
    if (activeStrategyId) {
      setStrategySettingsModalOpen(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
      {/* Floating buttons: top-right of canvas (only when strategy selected) */}
      {activeStrategyId && (
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
            border: '1px solid var(--color-border)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-card)';
          }}
          title="Add Transaction"
        >
          <Plus size={18} strokeWidth={2} />
        </button>
        <button
          type="button"
          className={floatingButton}
          style={{
            backgroundColor: 'var(--color-bg-card)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
          }}
          onClick={handleGearClick}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-card)';
          }}
          title="Strategy settings (rename, delete)"
        >
          <Settings size={18} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          className={floatingButton}
          style={{
            backgroundColor: 'var(--color-bg-card)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-card)';
          }}
          title="View All Transactions"
        >
          <List size={18} strokeWidth={1.5} />
        </button>
      </div>
      )}

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
              className="text-xl font-semibold mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {hasStrategies ? 'No strategy selected' : 'Create your first strategy'}
            </p>
            <p
              className="text-sm"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {hasStrategies
                ? 'Select a strategy in the sidebar or create one'
                : 'Click Add Strategy in the sidebar to get started'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
