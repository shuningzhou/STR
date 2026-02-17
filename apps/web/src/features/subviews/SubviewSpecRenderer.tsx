/**
 * Renders a subview from its JSON spec.
 * Shared by LivePreview (editor) and SubviewCard (canvas).
 * Inputs are NOT auto-rendered; they appear only when referenced in layout via { "input": { "ref": "key" } }.
 */
import { useState, useEffect } from 'react';
import type { SubviewSpec, ContentItem } from '@str/shared';
import { runPythonFunction } from '@/lib/pyodide-executor';
import { Input } from '@/components/ui';
import { InputControl } from './InputControl';

/** Font sizes for text/number content: xs, sm, md, lg, xl, xxl, xxxl */
const FONT_SIZES: Record<string, string> = {
  xs: 'var(--font-size-label)',     // 11px
  sm: 'var(--font-size-body)',      // 13px
  md: 'var(--font-size-title)',     // 15px
  lg: 'var(--font-size-heading)',   // 18px
  xl: 'var(--font-size-display)',   // 24px
  xxl: 'var(--font-size-xxl)',      // 32px
  xxxl: 'var(--font-size-xxxl)',    // 40px
};

type PaddingValue = number | { top?: number; right?: number; bottom?: number; left?: number };

function paddingToStyle(padding: PaddingValue | undefined): React.CSSProperties {
  if (padding == null) return {};
  if (typeof padding === 'number') return { padding };
  const s: React.CSSProperties = {};
  if (padding.top != null) s.paddingTop = padding.top;
  if (padding.right != null) s.paddingRight = padding.right;
  if (padding.bottom != null) s.paddingBottom = padding.bottom;
  if (padding.left != null) s.paddingLeft = padding.left;
  return s;
}

function ContentRenderer({
  item,
  resolved,
  spec,
  inputs,
  onInputChange,
  globalInputsConfig,
  globalInputValues,
  onGlobalInputChange,
  context,
}: {
  item: ContentItem;
  resolved: Record<string, string | number>;
  spec: SubviewSpec;
  inputs: Record<string, unknown>;
  onInputChange?: (key: string, value: string | number) => void;
  globalInputsConfig?: Record<string, { type: string; title: string; default?: unknown; options?: { value: string; label: string }[] }>;
  globalInputValues?: Record<string, unknown>;
  onGlobalInputChange?: (key: string, value: string | number) => void;
  context: unknown;
}) {
  if ('input' in item) {
    const inp = item.input as { ref: string; padding?: PaddingValue };
    const ref = inp.ref;
    const isGlobal = ref.startsWith('global.');
    const key = isGlobal ? ref.slice(7) : ref;
    const cfg = isGlobal
      ? globalInputsConfig?.[key]
      : spec.inputs?.[ref];
    const values = isGlobal ? (globalInputValues ?? {}) : inputs;
    const changeHandler = isGlobal ? onGlobalInputChange : onInputChange;
    if (!cfg) return <span className="text-xs text-red-500">[Unknown input: {ref}]</span>;
    const inner = (
      <InputControl
        key={ref}
        inputKey={key}
        cfg={cfg as { type: string; title: string; default?: unknown; options?: { value: string; label: string }[] }}
        inputs={values}
        onInputChange={changeHandler}
        context={context}
      />
    );
    return inp.padding != null ? <div style={paddingToStyle(inp.padding)}>{inner}</div> : inner;
  }
  if ('text' in item) {
    const val = item.text.value;
    const display =
      typeof val === 'string' && val.startsWith('py:') ? resolved[val] ?? '…' : val;
    const t = item.text;
    const size = t.size ? (FONT_SIZES[t.size] ?? 'var(--font-size-body)') : 'var(--font-size-body)';
    const inner = (
      <span
        style={{
          color: 'var(--color-text-primary)',
          fontSize: size,
          fontWeight: t.bold ? 600 : undefined,
          fontStyle: t.italic ? 'italic' : undefined,
          textAlign: (t.alignment as React.CSSProperties['textAlign']) ?? 'left',
        }}
      >
        {String(display)}
      </span>
    );
    return t.padding != null ? (
      <div style={paddingToStyle(t.padding)}>{inner}</div>
    ) : (
      inner
    );
  }
  if ('number' in item) {
    const val = item.number.value;
    const raw =
      typeof val === 'string' && val.startsWith('py:') ? resolved[val] ?? '…' : val;
    const n = item.number;
    const decimals = n.decimals ?? 2;
    const format = n.format;
    let display: string;
    const num = typeof raw === 'number' ? raw : parseFloat(String(raw));
    if (format != null && !Number.isNaN(num)) {
      const fixed = num.toFixed(decimals);
      display = format === '$' ? `$${fixed}` : `${fixed}%`;
    } else {
      display = String(raw);
    }
    const size = n.size ? (FONT_SIZES[n.size] ?? 'var(--font-size-body)') : 'var(--font-size-body)';
    const inner = (
      <span
        style={{
          color: 'var(--color-text-primary)',
          fontSize: size,
          fontWeight: n.bold ? 600 : 400,
          fontStyle: n.italic ? 'italic' : undefined,
          textAlign: (n.alignment as React.CSSProperties['textAlign']) ?? 'center',
        }}
      >
        {display}
      </span>
    );
    return n.padding != null ? (
      <div style={paddingToStyle(n.padding)}>{inner}</div>
    ) : (
      inner
    );
  }
  if ('Table' in item) {
    const p = item.Table.padding;
    const inner = (
      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        [Table: {item.Table.header.title}]
      </span>
    );
    return p != null ? <div style={paddingToStyle(p)}>{inner}</div> : inner;
  }
  if ('Chart' in item) {
    const p = item.Chart.padding;
    const inner = (
      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        [Chart: {item.Chart.type}]
      </span>
    );
    return p != null ? <div style={paddingToStyle(p)}>{inner}</div> : inner;
  }
  return null;
}

/** Cell alignment: cells use flex-col, so justifyContent=vertical, alignItems=horizontal */
const ALIGNMENT_MAP: Record<string, React.CSSProperties> = {
  'left center': { justifyContent: 'center', alignItems: 'flex-start' },
  'center middle': { justifyContent: 'center', alignItems: 'center' },
  'right top': { justifyContent: 'flex-start', alignItems: 'flex-end' },
  'stretch center': { justifyContent: 'center', alignItems: 'stretch' },
};

export interface SubviewSpecRendererProps {
  spec: SubviewSpec;
  pythonCode: string;
  context: unknown;
  inputs: Record<string, unknown>;
  /** When provided, inputs are editable; onChange(key, value) where value is string | number (time_range stored as JSON string) */
  onInputChange?: (key: string, value: string | number) => void;
  /** Strategy-scoped inputs; subviews reference via global.xxx; passed to Python as inputs.global */
  globalInputsConfig?: Record<string, { type: string; title: string; default?: unknown; options?: { value: string; label: string }[]; min?: number; max?: number }>;
  globalInputValues?: Record<string, unknown>;
  onGlobalInputChange?: (key: string, value: string | number) => void;
}

export function SubviewSpecRenderer({
  spec,
  pythonCode,
  context,
  inputs,
  onInputChange,
  globalInputsConfig,
  globalInputValues,
  onGlobalInputChange,
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
      const mergedInputs =
        globalInputValues != null && Object.keys(globalInputValues).length > 0
          ? { ...inputs, global: globalInputValues }
          : inputs;
      const next: Record<string, string | number> = {};
      for (const ref of pyRefs) {
        const fn = ref.slice(3);
        const result = await runPythonFunction(pythonCode, fn, context, mergedInputs);
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
  }, [spec, pythonCode, context, inputs, globalInputValues]);

  return (
    <div
      className="flex-1 flex flex-col min-h-0 relative z-0"
      style={{ paddingTop: 'var(--subview-top-bar-height)' }}
    >
      <div
        className="flex-1 flex flex-col min-h-0 min-w-0 overflow-auto"
        role="region"
        aria-label="Subview content"
        style={{ paddingLeft: 10, paddingRight: 10 }}
      >
        {loading ? (
          <div
            className="flex-1 flex items-center justify-center shrink-0"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <span className="text-xs">Loading…</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2 min-w-0 shrink-0 p-4">
            {spec.layout.map((row, ri) => (
              <div key={ri} className="flex gap-2 shrink-0 min-w-0" style={{ width: '100%' }}>
                {row.map((cell, ci) => (
                  <div
                    key={ci}
                    className={`flex flex-col gap-1 flex flex-wrap ${cell.weight != null ? 'min-w-0 flex-1' : 'shrink-0'}`}
                    style={{
                      ...(cell.weight != null ? { flex: cell.weight } : { flex: '0 0 auto' }),
                      ...ALIGNMENT_MAP[cell.alignment],
                      ...(cell.padding != null ? paddingToStyle(cell.padding) : {}),
                    }}
                  >
                    {cell.content.map((contentItem, ii) => (
                      <ContentRenderer
                        key={ii}
                        item={contentItem}
                        resolved={resolved}
                        spec={spec}
                        inputs={inputs}
                        onInputChange={onInputChange}
                        globalInputsConfig={globalInputsConfig}
                        globalInputValues={globalInputValues}
                        onGlobalInputChange={onGlobalInputChange}
                        context={context}
                      />
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
