import { SquarePlus, Settings, Database, Wallet, Pencil, PencilOff } from 'lucide-react';
import { useStrategyStore } from '@/store/strategy-store';
import { useUIStore } from '@/store/ui-store';
import { CanvasGrid } from '@/features/canvas/CanvasGrid';
import { OPTIMIZED_CANVAS_WIDTH } from '@/features/canvas/canvas-grid-config';
import { StrategyInputsBar } from '@/features/canvas/StrategyInputsBar';

const floatingButton =
  'w-9 h-9 flex items-center justify-center rounded-[var(--radius-button)] cursor-pointer transition-colors';

export function CanvasArea() {
  const activeStrategyId = useStrategyStore((s) => s.activeStrategyId);
  const strategies = useStrategyStore((s) => s.strategies);
  const activeStrategy = useStrategyStore((s) =>
    s.strategies.find((st) => st.id === s.activeStrategyId)
  );
  const {
    canvasEditMode,
    toggleCanvasEditMode,
    setStrategySettingsModalOpen,
    setSubviewGalleryModalOpen,
    setTransactionListPanelOpen,
    setWalletSettingsModalOpen,
  } = useUIStore();
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

  const handleOpenTransactionList = () => {
    if (activeStrategyId) {
      setTransactionListPanelOpen(activeStrategyId);
    }
  };

  const handleOpenWallet = () => {
    if (activeStrategyId) {
      setWalletSettingsModalOpen(activeStrategyId);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Strategy inputs bar - top bar (similar to tool buttons bar) */}
      {activeStrategyId && (
        <StrategyInputsBar strategy={activeStrategy} />
      )}

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Canvas content - full width, scrolls independently */}
        <div
          className="flex-1 flex flex-col min-h-0 min-w-0 overflow-auto"
          style={{
            padding: 'var(--space-section)',
            backgroundColor: 'var(--color-bg-page)',
          }}
        >
          {activeStrategyId ? (
            <>
            {hasSubviews ? (
              <div
                className="flex-1 min-h-[150px] shrink-0"
                style={{ minWidth: OPTIMIZED_CANVAS_WIDTH, width: '100%' }}
              >
                <CanvasGrid strategyId={activeStrategyId} isEditMode={canvasEditMode} />
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
            )}
            </>
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

        {/* Tool buttons: fixed column on the right (only when strategy selected) */}
        {activeStrategyId && (
          <div
            className="flex flex-col gap-2 shrink-0 py-4 pr-4 pl-2"
            style={{
              backgroundColor: 'var(--color-bg-page)',
              borderLeft: '1px solid var(--color-border)',
            }}
          >
            <button
              type="button"
              className={floatingButton}
              style={{
                color: canvasEditMode ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                opacity: canvasEditMode ? 1 : 0.7,
              }}
              onClick={toggleCanvasEditMode}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title={canvasEditMode ? 'Edit mode: drag, resize, and edit cards' : 'View mode: click to edit'}
            >
              {canvasEditMode ? <Pencil size={18} strokeWidth={1.5} /> : <PencilOff size={18} strokeWidth={1.5} />}
            </button>
            <button
              type="button"
              className={floatingButton}
              style={{
                color: 'var(--color-text-primary)',
              }}
              onClick={handleOpenGallery}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Add view"
            >
              <SquarePlus size={18} strokeWidth={2} />
            </button>
            <button
              type="button"
              className={floatingButton}
              style={{
                color: 'var(--color-text-primary)',
              }}
              onClick={handleGearClick}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Strategy settings (rename, delete)"
            >
              <Settings size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className={floatingButton}
              style={{
                color: 'var(--color-text-primary)',
              }}
              onClick={handleOpenTransactionList}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="View All Transactions"
            >
              <Database size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className={floatingButton}
              style={{
                color: 'var(--color-text-primary)',
              }}
              onClick={handleOpenWallet}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Wallet settings"
            >
              <Wallet size={18} strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
