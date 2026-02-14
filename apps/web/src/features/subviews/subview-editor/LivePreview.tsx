import { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import type { SubviewSpec, ContentItem } from '@str/shared';
import { runPythonFunction } from '@/lib/pyodide-executor';
import { cn } from '@/lib/utils';

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
function ContentRenderer({
  item,
  resolved,
}: {
  item: ContentItem;
  resolved: Record<string, string | number>;
}) {
  if ('text' in item) {
    const val = item.text.value;
    const display = typeof val === 'string' && val.startsWith('py:')
      ? resolved[val] ?? '…'
      : val;
    return (
      <span
        className="text-[13px]"
        style={{
          color: 'var(--color-text-primary)',
          textAlign: (item.text.alignment as React.CSSProperties['textAlign']) ?? 'left',
        }}
      >
        {String(display)}
      </span>
    );
  }
  if ('number' in item) {
    const val = item.number.value;
    const display = typeof val === 'string' && val.startsWith('py:')
      ? resolved[val] ?? '…'
      : val;
    return (
      <span
        className="text-[13px] font-medium"
        style={{
          color: 'var(--color-text-primary)',
          textAlign: (item.number.alignment as React.CSSProperties['textAlign']) ?? 'center',
        }}
      >
        {String(display)}
      </span>
    );
  }
  if ('Table' in item) {
    return (
      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        [Table: {item.Table.header.title}]
      </span>
    );
  }
  if ('Chart' in item) {
    return (
      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        [Chart: {item.Chart.type}]
      </span>
    );
  }
  return null;
}

const ALIGNMENT_MAP: Record<string, React.CSSProperties> = {
  'left center': { justifyContent: 'flex-start', alignItems: 'center' },
  'center middle': { justifyContent: 'center', alignItems: 'center' },
  'right top': { justifyContent: 'flex-end', alignItems: 'flex-start' },
  'stretch center': { justifyContent: 'stretch', alignItems: 'center' },
};

export function LivePreview({ spec, pythonCode, context, inputs }: LivePreviewProps) {
  const [resolved, setResolved] = useState<Record<string, string | number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!spec || !pythonCode) return;
    const pyRefs = new Set<string>();
    for (const row of spec.layout) {
      for (const cell of row) {
        for (const c of cell.content) {
          if ('number' in c) {
            const v = c.number.value;
            if (typeof v === 'string' && v.startsWith('py:')) pyRefs.add(v);
          }
          if ('text' in c) {
            const v = c.text.value;
            if (typeof v === 'string' && v.startsWith('py:')) pyRefs.add(v);
          }
        }
      }
    }
    setLoading(true);
    (async () => {
      const next: Record<string, string | number> = {};
      for (const ref of pyRefs) {
        const fn = ref.slice(3);
        const result = await runPythonFunction(pythonCode, fn, context, inputs);
        if (result.success) {
          const v = result.value;
          next[ref] = typeof v === 'string' || typeof v === 'number' ? v : String(v);
        } else {
          next[ref] = `Error: ${result.error}`;
        }
      }
      setResolved(next);
      setLoading(false);
    })();
  }, [spec, pythonCode, context, inputs]);

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
      }}
    >
      {/* Top bar — matches SubviewCard exactly; subview-drag-handle enables drag */}
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
            {spec.name}
          </span>
        </div>
        <div
          className="w-8 h-8 shrink-0 flex items-center justify-center rounded-[var(--radius-medium)]"
          style={{ marginRight: 5, color: 'var(--color-text-secondary)' }}
          title="Preview (edit in main editor)"
          aria-hidden
        >
          <Pencil size={16} strokeWidth={1.5} />
        </div>
      </div>

      {/* Body — layout from JSON spec, matches SubviewCard pt-12 */}
      <div className="flex-1 flex flex-col min-h-0 pt-12">
        {spec.inputs && Object.keys(spec.inputs).length > 0 && (
          <div
            className="flex flex-wrap gap-2 p-2 shrink-0"
            style={{ gap: 'var(--space-gap)' }}
          >
            {Object.entries(spec.inputs).map(([key, cfg]) => (
              <div key={key} className="flex flex-col gap-0.5 min-w-[80px]">
                <label className="text-[11px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  {cfg.title}
                </label>
                <div
                  className="rounded-[var(--radius-medium)] border px-2 text-[11px] truncate"
                  style={{
                    height: 'var(--control-height)',
                    backgroundColor: 'var(--color-bg-input)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {(() => {
                    const v = inputs[key];
                    if (v && typeof v === 'object' && 'start' in v && 'end' in v) {
                      return `${(v as { start: string }).start} — ${(v as { end: string }).end}`;
                    }
                    return String(v ?? 'all');
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--color-text-muted)' }}>
            <span className="text-xs">Loading…</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-2 min-h-0 p-4">
            {spec.layout.map((row, ri) => (
              <div key={ri} className="flex gap-2 flex-1 min-h-0" style={{ width: '100%' }}>
                {row.map((cell, ci) => (
                  <div
                    key={ci}
                    className="flex flex-col gap-1 min-w-0 flex-1"
                    style={{
                      flex: cell.weight,
                      ...ALIGNMENT_MAP[cell.alignment],
                    }}
                  >
                    {cell.content.map((item, ii) => (
                      <ContentRenderer key={ii} item={item} resolved={resolved} />
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
