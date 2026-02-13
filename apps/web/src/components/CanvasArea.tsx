import { Receipt, SquarePlus, Settings, List } from 'lucide-react';
import { useStrategyStore } from '@/store/strategy-store';
import { useUIStore } from '@/store/ui-store';
import { CanvasGrid } from '@/features/canvas/CanvasGrid';

const floatingButton =
  'w-9 h-9 flex items-center justify-center rounded-[var(--radius-button)] cursor-pointer transition-colors';

export function CanvasArea() {
  const activeStrategyId = useStrategyStore((s) => s.activeStrategyId);
  const strategies = useStrategyStore((s) => s.strategies);
  const activeStrategy = useStrategyStore((s) =>
    s.strategies.find((st) => st.id === s.activeStrategyId)
  );
  const { setStrategySettingsModalOpen, setSubviewGalleryModalOpen } = useUIStore();
  const hasStrategies = strategies.length > 0;

  const hasSubviews = (activeStrategy?.subviews?.length ?? 0) > 0;

  const handleGearClick = () => {
    if (activeStrategyId) {
      setStrategySettingsModalOpen(true);
    }
  };

  const handleOpenGallery = () => {
    if (activeStrategyId) {
      setSubviewGalleryModalOpen(true);
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
            onClick={handleOpenGallery}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-card)';
            }}
            title="Add subview"
          >
            <SquarePlus size={18} strokeWidth={2} />
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
            title="Add Transaction"
          >
            <Receipt size={18} strokeWidth={1.5} />
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

      {/* Canvas content - extra right padding when tool buttons visible so subviews don't go under them */}
      <div
        className="flex-1 flex flex-col min-h-0 overflow-auto relative"
        style={{
          padding: 'var(--space-section)',
          paddingRight: activeStrategyId ? 60 : 'var(--space-section)',
          backgroundColor: 'var(--color-bg-page)',
        }}
      >
        {activeStrategyId ? (
          hasSubviews ? (
            <div className="flex-1 min-h-[400px]">
              <CanvasGrid strategyId={activeStrategyId} />
            </div>
          ) : (
            <div
              className="flex-1 flex flex-col items-center justify-center text-center cursor-pointer"
              onClick={(e) => {
                if (!(e.target as HTMLElement).closest('button')) handleOpenGallery();
              }}
            >
              <p
                className="text-lg font-semibold"
                style={{ color: 'var(--color-text-primary)', marginBottom: 15 }}
              >
                Empty canvas
              </p>
                <p
                className="text-sm flex items-center justify-center gap-1 flex-wrap"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Click anywhere or the
                <SquarePlus
                  size={16}
                  strokeWidth={2}
                  className="shrink-0 inline-block"
                  style={{ color: 'var(--color-text-primary)' }}
                />
                button to open the template gallery
              </p>
            </div>
          )
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p
              className="text-xl font-semibold"
              style={{ color: 'var(--color-text-primary)', marginBottom: 15 }}
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
