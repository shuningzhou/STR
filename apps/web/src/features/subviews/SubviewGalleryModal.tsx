import { useStrategyStore } from '@/store/strategy-store';
import { useUIStore } from '@/store/ui-store';
import { Modal } from '@/components/ui';
import { SUBVIEW_TEMPLATES } from './templates';
import { cn } from '@/lib/utils';

export function SubviewGalleryModal() {
  const activeStrategyId = useStrategyStore((s) => s.activeStrategyId);
  const addSubview = useStrategyStore((s) => s.addSubview);

  const { subviewGalleryModalOpen, setSubviewGalleryModalOpen, setSubviewSettingsOpen } = useUIStore();

  const handleSelect = (templateId: string) => {
    if (!activeStrategyId) return;
    const template = SUBVIEW_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    const newSubview = addSubview(activeStrategyId, {
      name: template.name,
      defaultSize: template.defaultSize,
      spec: template.spec,
    });
    setSubviewGalleryModalOpen(false);
    if (templateId === 'custom') {
      setSubviewSettingsOpen({
        strategyId: activeStrategyId,
        subviewId: newSubview.id,
      });
    }
  };

  const handleClose = () => setSubviewGalleryModalOpen(false);

  if (!subviewGalleryModalOpen || !activeStrategyId) return null;

  return (
    <Modal title="Add subview" onClose={handleClose} className="max-w-md">
      <p
        className="text-sm mb-5"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Choose a template to add to your canvas
      </p>

      <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
        {SUBVIEW_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleSelect(t.id)}
            className={cn(
              'text-left p-3 rounded-[var(--radius-medium)] border transition-colors',
              'hover:border-[var(--color-active)]'
            )}
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-bg-input)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-input)';
            }}
          >
            <div
              className="font-medium text-sm"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {t.name}
            </div>
            <div
              className="text-xs mt-0.5"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {t.description}
            </div>
            <div
              className="text-xs mt-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {t.defaultSize.w}×{t.defaultSize.h} cols
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
}
