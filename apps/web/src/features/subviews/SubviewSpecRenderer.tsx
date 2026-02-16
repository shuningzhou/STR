/**
 * Renders a subview from its JSON spec.
 * Shared by LivePreview (editor) and SubviewCard (canvas).
 * Inputs are NOT auto-rendered; they appear only when referenced in layout via { "input": { "ref": "key" } }.
 */
import { useState, useEffect } from 'react';
import type { SubviewSpec, ContentItem } from '@str/shared';
import { runPythonFunction } from '@/lib/pyodide-executor';
import { Input } from '@/components/ui';

/** Widths for input types (px) */
const INPUT_WIDTHS: Record<string, number> = {
  time_range: 240,
  ticker_selector: 100,
  number_input: 120,
  select: 200,
  checkbox: 120,
};

/** Shared value box styles: right-aligned text, proper padding */
const VALUE_BOX_STYLE: React.CSSProperties = {
  textAlign: 'right',
  paddingLeft: 12,
  paddingRight: 12,
};

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

function InputControl({
  inputKey,
  cfg,
  inputs,
  onInputChange,
  context,
}: {
  inputKey: string;
  cfg: { type: string; title: string; default?: unknown; options?: { value: string; label: string }[] };
  inputs: Record<string, unknown>;
  onInputChange?: (key: string, value: string | number) => void;
  context: unknown;
}) {
  const inputType = cfg.type;
  const width = INPUT_WIDTHS[inputType] ?? 160;
  const isEditable = !!onInputChange;

  return (
    <div className="flex flex-col gap-1 shrink-0" style={{ width, minWidth: width }}>
      <label
        className="text-[11px] font-medium shrink-0"
        style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-label)' }}
      >
        {cfg.title}
      </label>
      {inputType === 'time_range' ? (
        isEditable ? (
          <div className="flex gap-1">
            <input
              type="date"
              value={
                (inputs[inputKey] as { start?: string })?.start ??
                new Date().toISOString().slice(0, 10)
              }
              onChange={(e) => {
                const tr = (inputs[inputKey] as { start?: string; end?: string }) ?? {};
                const next = { ...tr, start: e.target.value };
                onInputChange!(inputKey, JSON.stringify(next));
              }}
              className="flex-1 min-w-0 rounded-[var(--radius-medium)] border text-[13px] outline-none"
              style={{
                height: 'var(--control-height)',
                backgroundColor: 'var(--color-bg-input)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
                textAlign: 'right',
                paddingLeft: 8,
                paddingRight: 8,
              }}
            />
            <input
              type="date"
              value={
                (inputs[inputKey] as { end?: string })?.end ??
                new Date().toISOString().slice(0, 10)
              }
              onChange={(e) => {
                const tr = (inputs[inputKey] as { start?: string; end?: string }) ?? {};
                const next = { ...tr, end: e.target.value };
                onInputChange!(inputKey, JSON.stringify(next));
              }}
              className="flex-1 min-w-0 rounded-[var(--radius-medium)] border text-[13px] outline-none"
              style={{
                height: 'var(--control-height)',
                backgroundColor: 'var(--color-bg-input)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
                textAlign: 'right',
                paddingLeft: 8,
                paddingRight: 8,
              }}
            />
          </div>
        ) : (
          <div
            className="rounded-[var(--radius-medium)] border text-[13px]"
            style={{
              height: 'var(--control-height)',
              backgroundColor: 'var(--color-bg-input)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              ...VALUE_BOX_STYLE,
            }}
          >
            {(() => {
              const v = inputs[inputKey] as { start?: string; end?: string } | undefined;
              if (v && typeof v === 'object' && 'start' in v && 'end' in v) {
                return `${v.start} — ${v.end}`;
              }
              return '—';
            })()}
          </div>
        )
      ) : inputType === 'ticker_selector' ? (
        (() => {
          const txs = (context as { transactions?: { instrumentSymbol?: string }[] })?.transactions ?? [];
          const symbols = [
            'all',
            ...Array.from(
              new Set(
                txs
                  .map((tx) => tx?.instrumentSymbol)
                  .filter((s): s is string => typeof s === 'string' && s.length > 0)
              )
            ).sort(),
          ];
          return isEditable ? (
            <select
              value={String(inputs[inputKey] ?? (cfg.default ?? 'all'))}
              onChange={(e) => onInputChange!(inputKey, e.target.value)}
              className="rounded-[var(--radius-medium)] border text-[13px] w-full outline-none"
              style={{
                height: 'var(--control-height)',
                backgroundColor: 'var(--color-bg-input)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
                ...VALUE_BOX_STYLE,
              }}
            >
              {symbols.map((sym) => (
                <option key={sym} value={sym}>
                  {sym}
                </option>
              ))}
            </select>
          ) : (
            <div
              className="rounded-[var(--radius-medium)] border text-[13px]"
              style={{
                height: 'var(--control-height)',
                backgroundColor: 'var(--color-bg-input)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
                display: 'flex',
                alignItems: 'center',
                ...VALUE_BOX_STYLE,
              }}
            >
              {String(inputs[inputKey] ?? 'all')}
            </div>
          );
        })()
      ) : inputType === 'number_input' ? (
        isEditable ? (
          <Input
            type="number"
            value={String(inputs[inputKey] ?? (cfg as { default?: number }).default ?? 0)}
            onChange={(e) =>
              onInputChange!(inputKey, parseFloat(e.target.value) || 0)
            }
            style={{ width: '100%', ...VALUE_BOX_STYLE }}
          />
        ) : (
          <div
            className="rounded-[var(--radius-medium)] border text-[13px]"
            style={{
              height: 'var(--control-height)',
              backgroundColor: 'var(--color-bg-input)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              ...VALUE_BOX_STYLE,
            }}
          >
            {String(inputs[inputKey] ?? (cfg as { default?: number }).default ?? 0)}
          </div>
        )
      ) : inputType === 'select' ? (
        isEditable ? (
          <select
            value={String(inputs[inputKey] ?? (cfg as { default?: string }).default ?? '')}
            onChange={(e) => onInputChange!(inputKey, e.target.value)}
            className="rounded-[var(--radius-medium)] border text-[13px] w-full outline-none"
            style={{
              height: 'var(--control-height)',
              backgroundColor: 'var(--color-bg-input)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
              ...VALUE_BOX_STYLE,
            }}
          >
            {((cfg as { options?: { value: string; label: string }[] }).options ?? []).map(
              (opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              )
            )}
          </select>
        ) : (
          <div
            className="rounded-[var(--radius-medium)] border text-[13px]"
            style={{
              height: 'var(--control-height)',
              backgroundColor: 'var(--color-bg-input)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              ...VALUE_BOX_STYLE,
            }}
          >
            {String(inputs[inputKey] ?? (cfg as { default?: string }).default ?? '')}
          </div>
        )
      ) : inputType === 'checkbox' ? (
        isEditable ? (
          <label className="flex items-center gap-2 cursor-pointer h-[var(--control-height)]">
            <input
              type="checkbox"
              checked={Boolean(inputs[inputKey] ?? (cfg as { default?: boolean }).default)}
              onChange={(e) => onInputChange!(inputKey, e.target.checked ? 1 : 0)}
              className="rounded"
            />
          </label>
        ) : (
          <div
            className="rounded-[var(--radius-medium)] border text-[13px]"
            style={{
              height: 'var(--control-height)',
              backgroundColor: 'var(--color-bg-input)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              ...VALUE_BOX_STYLE,
            }}
          >
            {String(inputs[inputKey] ?? (cfg as { default?: boolean }).default ?? false)}
          </div>
        )
      ) : (
        <div
          className="rounded-[var(--radius-medium)] border text-[13px]"
          style={{
            height: 'var(--control-height)',
            backgroundColor: 'var(--color-bg-input)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
            display: 'flex',
            alignItems: 'center',
            ...VALUE_BOX_STYLE,
          }}
        >
          {String(inputs[inputKey] ?? '')}
        </div>
      )}
    </div>
  );
}

function ContentRenderer({
  item,
  resolved,
  spec,
  inputs,
  onInputChange,
  context,
}: {
  item: ContentItem;
  resolved: Record<string, string | number>;
  spec: SubviewSpec;
  inputs: Record<string, unknown>;
  onInputChange?: (key: string, value: string | number) => void;
  context: unknown;
}) {
  if ('input' in item) {
    const inp = item.input as { ref: string; padding?: PaddingValue };
    const ref = inp.ref;
    const cfg = spec.inputs?.[ref];
    if (!cfg) return <span className="text-xs text-red-500">[Unknown input: {ref}]</span>;
    const inner = (
      <InputControl
        key={ref}
        inputKey={ref}
        cfg={cfg as { type: string; title: string; default?: unknown; options?: { value: string; label: string }[] }}
        inputs={inputs}
        onInputChange={onInputChange}
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
    const display =
      typeof val === 'string' && val.startsWith('py:') ? resolved[val] ?? '…' : val;
    const n = item.number;
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
        {String(display)}
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
}

export function SubviewSpecRenderer({
  spec,
  pythonCode,
  context,
  inputs,
  onInputChange,
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
