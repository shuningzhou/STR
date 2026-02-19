import { useState } from 'react';
import { useStrategyStore } from '@/store/strategy-store';
import { useUIStore } from '@/store/ui-store';
import { Modal } from '@/components/ui';
import { SUBVIEW_TEMPLATES, type SubviewTemplate } from './templates';
import { SUBVIEW_CATEGORIES, type SubviewCategory } from '@str/shared';
import { cn } from '@/lib/utils';

const CATEGORY_LABELS: Record<SubviewCategory, string> = {
  example: 'Example',
  essential: 'Essential',
  'stock-etf': 'Stock and ETF',
  margin: 'Margin',
  option: 'Option',
  income: 'Income',
};

function getTemplateCategories(t: SubviewTemplate): SubviewCategory[] {
  return t.categories ?? [];
}

export function SubviewGalleryModal() {
  const [selectedCategory, setSelectedCategory] = useState<SubviewCategory | 'all'>('all');
  const activeStrategyId = useStrategyStore((s) => s.activeStrategyId);
  const addSubview = useStrategyStore((s) => s.addSubview);

  const { subviewGalleryModalOpen, setSubviewGalleryModalOpen, setSubviewSettingsOpen } = useUIStore();

  const filteredTemplates =
    selectedCategory === 'all'
      ? SUBVIEW_TEMPLATES
      : SUBVIEW_TEMPLATES.filter((t) => getTemplateCategories(t).includes(selectedCategory));

  const handleSelect = (templateId: string) => {
    if (!activeStrategyId) return;
    const template = SUBVIEW_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    const newSubview = addSubview(activeStrategyId, {
      name: template.name,
      defaultSize: template.defaultSize,
      spec: template.spec,
      templateId: templateId !== 'custom' ? templateId : undefined,
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
    <Modal title="Add view" onClose={handleClose} className="w-[1024px] max-w-[95vw]">
      <div className="flex gap-4 h-[420px] p-2">
        {/* Sidebar */}
        <nav
          className="shrink-0 w-40 flex flex-col gap-0.5 p-2 border rounded-[var(--radius-medium)]"
          style={{ backgroundColor: 'var(--color-bg-input)', borderColor: 'var(--color-border)' }}
        >
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'text-left py-2 pr-3 text-sm rounded-[var(--radius-small)] transition-colors',
              selectedCategory === 'all' && 'font-medium'
            )}
            style={{
              paddingLeft: 5,
              color: selectedCategory === 'all' ? 'var(--color-active)' : 'var(--color-text-primary)',
              backgroundColor: selectedCategory === 'all' ? 'var(--color-bg-hover)' : 'transparent',
            }}
          >
            All
          </button>
          {SUBVIEW_CATEGORIES.map((cat) => {
            const count = SUBVIEW_TEMPLATES.filter((t) => getTemplateCategories(t).includes(cat)).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'text-left py-2 pr-3 text-sm rounded-[var(--radius-small)] transition-colors flex justify-between items-center',
                  selectedCategory === cat && 'font-medium'
                )}
                style={{
                  paddingLeft: 5,
                  color: selectedCategory === cat ? 'var(--color-active)' : 'var(--color-text-primary)',
                  backgroundColor: selectedCategory === cat ? 'var(--color-bg-hover)' : 'transparent',
                }}
              >
                {CATEGORY_LABELS[cat]}
                <span className="text-xs opacity-70">({count})</span>
              </button>
            );
          })}
        </nav>

        {/* Content: table */}
        <div className="flex-1 min-w-0 overflow-auto border rounded-[var(--radius-medium)] p-2" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full min-w-[500px] border-collapse table-fixed">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-table-header-bg)', borderBottom: '1px solid var(--color-table-border)' }}>
                <th className="text-left text-xs font-medium pr-4 w-48" style={{ paddingLeft: 5, paddingTop: 5, paddingBottom: 5, color: 'var(--color-table-header-text)' }}>Name</th>
                <th className="text-left text-xs font-medium pr-4 pl-[5px]" style={{ paddingTop: 5, paddingBottom: 5, color: 'var(--color-table-header-text)' }}>Description</th>
                <th className="text-left text-xs font-medium pr-4 pl-[5px] w-24" style={{ paddingTop: 5, paddingBottom: 5, color: 'var(--color-table-header-text)' }}>Maker</th>
                <th className="text-left text-xs font-medium pr-4 pl-[5px] w-20" style={{ paddingTop: 5, paddingBottom: 5, color: 'var(--color-table-header-text)' }}>Size</th>
              </tr>
            </thead>
            <tbody>
              {filteredTemplates.map((t) => {
                const size = (t.spec as { defaultSize?: { w: number; h: number } })?.defaultSize ?? t.defaultSize;
                return (
                <tr
                  key={t.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelect(t.id)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelect(t.id)}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: '1px solid var(--color-table-border)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <td className="pr-4 font-medium text-xs truncate" style={{ paddingLeft: 5, paddingTop: 5, paddingBottom: 5, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }} title={t.name}>{t.name}</td>
                  <td className="pr-4 pl-[5px] text-xs truncate" style={{ paddingTop: 5, paddingBottom: 5, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }} title={t.description}>{t.description}</td>
                  <td className="pr-4 pl-[5px] text-xs shrink-0" style={{ paddingTop: 5, paddingBottom: 5, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{t.spec?.maker ?? '—'}</td>
                  <td className="pr-4 pl-[5px] text-xs shrink-0" style={{ paddingTop: 5, paddingBottom: 5, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{size.w}×{size.h}</td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}
