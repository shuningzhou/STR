import { Pencil } from 'lucide-react';
import type { SubviewSpec } from '@str/shared';
import { cn } from '@/lib/utils';
import { SubviewSpecRenderer } from '../SubviewSpecRenderer';

interface LivePreviewProps {
  spec: SubviewSpec | null;
  pythonCode: string;
  context: unknown;
  inputs: Record<string, unknown>;
}

/**
 * Renders a subview from its JSON spec — same structure as SubviewCard on canvas.
 * Live Preview is a mini canvas: the card looks identical to the real canvas card.
 */
export function LivePreview({ spec, pythonCode, context, inputs }: LivePreviewProps) {
  if (!spec) {
    return (
      <div
        className="flex items-center justify-center h-32 rounded-[var(--radius-card)] border"
        style={{ backgroundColor: 'var(--color-bg-input)', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}
      >
        Fix JSON to see preview
      </div>
    );
  }

  return (
    <div
      className={cn(
        'h-full flex flex-col rounded-[var(--radius-card)] overflow-hidden relative',
        'border border-[var(--color-border)]'
      )}
      style={{
        backgroundColor: 'var(--color-bg-card)',
        padding: 'var(--subview-card-padding)',
      }}
    >
      {/* Top bar — draggable, no background; above content */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center"
        style={{ minHeight: 'var(--subview-top-bar-height)', height: 'var(--subview-top-bar-height)' }}
      >
        <div
          className="subview-drag-handle flex-1 flex items-center cursor-grab active:cursor-grabbing min-w-0 h-full"
          style={{ paddingLeft: 10, paddingRight: 4 }}
        >
          <span
            className="text-[13px] font-medium truncate max-w-[150px]"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {spec.name}
          </span>
        </div>
        <div
          className="w-8 h-8 shrink-0 flex items-center justify-center self-center rounded-[var(--radius-medium)]"
          style={{ marginRight: 5, color: 'var(--color-text-secondary)' }}
          title="Preview (edit in main editor)"
          aria-hidden
        >
          <Pencil size={16} strokeWidth={1.5} />
        </div>
      </div>

      {/* Body — layout from JSON spec, matches SubviewCard pt-12 */}
      <SubviewSpecRenderer
        spec={spec}
        pythonCode={pythonCode}
        context={context}
        inputs={inputs}
        showInputs
      />
    </div>
  );
}
