/**
 * Renders a subview from its JSON spec.
 * Shared by LivePreview (editor) and SubviewCard (canvas).
 */
import { useState, useEffect } from 'react';
import type { SubviewSpec, ContentItem } from '@str/shared';
import { runPythonFunction } from '@/lib/pyodide-executor';

function ContentRenderer({
  item,
  resolved,
}: {
  item: ContentItem;
  resolved: Record<string, string | number>;
}) {
  if ('text' in item) {
    const val = item.text.value;
    const display =
      typeof val === 'string' && val.startsWith('py:') ? resolved[val] ?? '…' : val;
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
    const display =
      typeof val === 'string' && val.startsWith('py:') ? resolved[val] ?? '…' : val;
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

export interface SubviewSpecRendererProps {
  spec: SubviewSpec;
  pythonCode: string;
  context: unknown;
  inputs: Record<string, unknown>;
  /** When true, render inputs row (for editor preview). When false, hide (canvas uses simplified display for now) */
  showInputs?: boolean;
}

export function SubviewSpecRenderer({
  spec,
  pythonCode,
  context,
  inputs,
  showInputs = true,
}: SubviewSpecRendererProps) {
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

  return (
    <div
      className="flex-1 flex flex-col min-h-0 relative z-0"
      style={{ paddingTop: 'var(--subview-top-bar-height)' }}
    >
      {/* Subview content: inputs + layout; all elements contained here */}
      <div
        className="flex-1 flex flex-col min-h-0 min-w-0 overflow-auto"
        role="region"
        aria-label="Subview content"
      >
        {showInputs && spec.inputs && Object.keys(spec.inputs).length > 0 && (
          <div
            className="flex flex-wrap gap-2 p-2 shrink-0"
            style={{ gap: 'var(--space-gap)' }}
          >
            {Object.entries(spec.inputs).map(([key, cfg]) => (
              <div key={key} className="flex flex-col gap-0.5 min-w-[80px]">
                <label
                  className="text-[11px] font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
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
          <div
            className="flex-1 flex items-center justify-center shrink-0"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <span className="text-xs">Loading…</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-2 min-h-0 min-w-0 p-4">
            {spec.layout.map((row, ri) => (
              <div key={ri} className="flex gap-2 flex-1 min-h-0 min-w-0" style={{ width: '100%' }}>
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
