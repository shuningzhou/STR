import { Pencil } from 'lucide-react';
import type { Subview } from '@/store/strategy-store';
import { useStrategyStore } from '@/store/strategy-store';
import { useUIStore } from '@/store/ui-store';
import { cn } from '@/lib/utils';
import { getPipelineInputs } from '@/features/pipeline/pipelineInputs';
import { Input } from '@/components/ui';

interface SubviewCardProps {
  subview: Subview;
  strategyId: string;
}

export function SubviewCard({ subview, strategyId }: SubviewCardProps) {
  const setSubviewSettingsOpen = useUIStore((s) => s.setSubviewSettingsOpen);
  const updateSubviewInputValue = useStrategyStore((s) => s.updateSubviewInputValue);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSubviewSettingsOpen({ strategyId, subviewId: subview.id });
  };

  const pipelineInputs = getPipelineInputs(subview.pipeline);
  const inputValues = subview.inputValues ?? {};

  return (
    <div
      className={cn(
        'h-full flex flex-col rounded-[var(--radius-card)] overflow-hidden relative',
        'border border-[var(--color-border)]'
      )}
      style={{
        backgroundColor: 'var(--color-bg-card)',
      }}
    >
      {/* Top bar - only this area is draggable */}
      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-center"
        style={{ minHeight: 36, top: 0 }}
      >
        <div
          className="subview-drag-handle flex-1 flex items-center cursor-grab active:cursor-grabbing min-w-0"
          style={{ paddingTop: 6, paddingLeft: 10, paddingBottom: 2, paddingRight: 4 }}
        >
          <span
            className="text-[13px] font-medium truncate max-w-[150px]"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {subview.name}
          </span>
        </div>
        <button
          type="button"
          onClick={handleMenuClick}
          className="w-8 h-8 shrink-0 flex items-center justify-center rounded-[var(--radius-medium)] transition-colors"
          style={{
            marginRight: 5,
            color: 'var(--color-text-secondary)',
          }}
          onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
          e.currentTarget.style.color = 'var(--color-text-primary)';
        }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }}
          title="Subview settings"
        >
          <Pencil size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* Pipeline inputs (when filter has input-type conditions) + body */}
      <div className="flex-1 flex flex-col min-h-0 pt-12">
        {pipelineInputs.length > 0 && (
          <div
            className="flex flex-wrap gap-2 p-2 shrink-0"
            style={{ gap: 'var(--space-gap)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {pipelineInputs.map((inp) => (
              <div key={inp.inputKey} className="flex flex-col gap-0.5 min-w-[80px]">
                <label
                  className="text-[11px] font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {inp.label}
                </label>
                <Input
                  value={String(inputValues[inp.inputKey] ?? inp.defaultValue)}
                  onChange={(e) => {
                    const v = e.target.value;
                    updateSubviewInputValue(strategyId, subview.id, inp.inputKey, v);
                  }}
                  className="text-[11px]"
                  style={{ height: 26 }}
                />
              </div>
            ))}
          </div>
        )}
        <div
          className={cn(
            'flex-1 flex items-center justify-center p-4 min-h-[60px] gap-1',
            pipelineInputs.length === 0 && 'flex'
          )}
          style={{ color: 'var(--color-text-muted)' }}
        >
          {pipelineInputs.length === 0 ? (
            <>
              <span className="text-xs">Click</span>
              <Pencil size={14} strokeWidth={1.5} className="shrink-0" />
              <span className="text-xs">to get started</span>
            </>
          ) : (
            <span className="text-xs">Chart area (Phase 6)</span>
          )}
        </div>
      </div>
    </div>
  );
}
