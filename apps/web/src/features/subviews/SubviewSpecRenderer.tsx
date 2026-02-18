/**
 * Renders a subview from its JSON spec.
 * Shared by LivePreview (editor) and SubviewCard (canvas).
 * Inputs are NOT auto-rendered; they appear only when referenced in layout via { "input": { "ref": "key" } }.
 */
import { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { SubviewSpec, ContentItem } from '@str/shared';
import { runPythonFunction } from '@/lib/pyodide-executor';
import { InputControl } from './InputControl';
import { useUIStore } from '@/store/ui-store';
import type { StrategyTransaction } from '@/store/strategy-store';

/** 24 built-in colors; custom rgb/rgba/#hex also supported */
export const BUILT_IN_COLORS: Record<string, string> = {
  red: '#dc2626',
  orange: '#ea580c',
  yellow: '#ca8a04',
  lime: '#65a30d',
  green: '#16a34a',
  teal: '#0d9488',
  cyan: '#0891b2',
  blue: '#2563eb',
  indigo: '#4f46e5',
  purple: '#7c3aed',
  pink: '#db2777',
  gray: '#6b7280',
  crimson: '#b91c1c',
  amber: '#f59e0b',
  emerald: '#059669',
  sky: '#0ea5e9',
  violet: '#8b5cf6',
  fuchsia: '#d946ef',
  rose: '#e11d48',
  slate: '#64748b',
  zinc: '#71717a',
  stone: '#78716c',
  brown: '#92400e',
  navy: '#1e3a8a',
};

/** Resolve color: built-in name -> hex; rgb/rgba/hsl/hsla/#hex passed through */
function resolveColor(color: string | undefined): string | undefined {
  if (!color) return undefined;
  const lower = color.trim().toLowerCase();
  if (BUILT_IN_COLORS[lower]) return BUILT_IN_COLORS[lower];
  // Custom: rgb, rgba, hsl, hsla, #hex
  if (/^(rgb|rgba|hsl|hsla)\(|^#[0-9a-fA-F]/.test(color)) return color;
  return undefined;
}

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

/** Get nested value by dot path, e.g. "option.expiration" */
function getNested(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let v: unknown = obj;
  for (const p of parts) {
    v = v != null && typeof v === 'object' && p in v ? (v as Record<string, unknown>)[p] : undefined;
  }
  return v;
}

/** Humanize column key for display when columnLabels not specified in spec */
function humanizeColumnKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\s+/, '')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Format cell value; format from spec.columnFormats or inferred for numbers */
function formatCellValue(
  val: unknown,
  key: string,
  format?: 'currency' | 'percent' | 'number'
): string {
  if (val == null || val === '') return '—';
  if (typeof val === 'number') {
    if (format === 'currency') return `$${val.toFixed(2)}`;
    if (format === 'percent') return `${val.toFixed(1)}%`;
    if (Number.isInteger(val)) return String(val);
    return val.toFixed(2);
  }
  return String(val);
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
  strategyId,
  onEditTransaction,
  textColor,
  setDeleteTransactionConfirmOpen,
}: {
  item: ContentItem;
  resolved: Record<string, unknown>;
  spec: SubviewSpec;
  inputs: Record<string, unknown>;
  onInputChange?: (key: string, value: string | number) => void;
  globalInputsConfig?: Record<string, { type: string; title: string; default?: unknown; options?: { value: string; label: string }[] }>;
  globalInputValues?: Record<string, unknown>;
  onGlobalInputChange?: (key: string, value: string | number) => void;
  context: unknown;
  strategyId?: string;
  onEditTransaction?: (transaction: Record<string, unknown>) => void;
  /** Resolved text color for text/number content (from cell.textColor) */
  textColor?: string;
  setDeleteTransactionConfirmOpen?: (value: { strategyId: string; transactionId: number } | null) => void;
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
    if (!cfg) {
      const specInputKeys = spec.inputs ? Object.keys(spec.inputs).join(', ') : '(no spec.inputs)';
      return (
        <span className="text-xs text-red-500" title={`spec.inputs keys: ${specInputKeys}`}>
          [Unknown input: {ref}]
        </span>
      );
    }
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
    const textAlign = (t.alignment as React.CSSProperties['textAlign']) ?? 'left';
    const inner = (
      <div style={{ width: '100%', minWidth: 0, textAlign }}>
        <span
          style={{
            color: textColor ?? 'var(--color-text-primary)',
            fontSize: size,
            fontWeight: t.bold ? 600 : undefined,
            fontStyle: t.italic ? 'italic' : undefined,
          }}
        >
          {String(display)}
        </span>
      </div>
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
      typeof val === 'string' && val.startsWith('py:') ? (resolved[val] as string | number) ?? '…' : val;
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
    const textAlign = (n.alignment as React.CSSProperties['textAlign']) ?? 'center';
    const inner = (
      <div style={{ width: '100%', minWidth: 0, textAlign }}>
        <span
          style={{
            color: textColor ?? 'var(--color-text-primary)',
            fontSize: size,
            fontWeight: n.bold ? 600 : 400,
            fontStyle: n.italic ? 'italic' : undefined,
          }}
        >
          {display}
        </span>
      </div>
    );
    return n.padding != null ? (
      <div style={paddingToStyle(n.padding)}>{inner}</div>
    ) : (
      inner
    );
  }
  if ('Table' in item) {
    const tbl = item.Table;
    const p = tbl.padding;
    const source = tbl.source;
    const data = (resolved[source] as Record<string, unknown>[]) ?? [];
    const columns = tbl.columns;
    const isReadWrite = spec.type === 'readwrite';

    const cellPadding = 5;
    const inner = (
      <div className="subview-table-container flex flex-col min-w-full w-full overflow-hidden" style={{ borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-input)', width: '100%', minWidth: '100%' }}>
        <div className="overflow-auto min-h-0 min-w-0 flex-1 subview-table-body w-full" style={{ maxHeight: 200, width: '100%' }}>
          <table className="w-full border-collapse text-[12px]" style={{ tableLayout: 'fixed', width: '100%' }}>
            <colgroup>
              {columns.map((col) => (
                <col key={col} />
              ))}
              {isReadWrite && tbl.rowActions && tbl.rowActions.length > 0 && (
                <col key="actions" style={{ width: 56 }} />
              )}
            </colgroup>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr style={{ backgroundColor: 'var(--color-bg-hover)' }}>
                {columns.map((col, i) => (
                  <th key={col} className="text-left font-medium" style={{ color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)', borderRight: i < columns.length - 1 || (isReadWrite && tbl.rowActions?.length) ? '1px solid var(--color-border)' : undefined, padding: cellPadding }}>
                    {(tbl.columnLabels as Record<string, string> | undefined)?.[col] ?? humanizeColumnKey(col)}
                  </th>
                ))}
                {isReadWrite && tbl.rowActions && tbl.rowActions.length > 0 && (
                  <th style={{ borderBottom: '1px solid var(--color-border)', padding: cellPadding, whiteSpace: 'nowrap' }} />
                )}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (tbl.rowActions?.length ? 1 : 0)} className="text-center" style={{ color: 'var(--color-text-muted)', padding: cellPadding }}>
                    {(tbl as { emptyMessage?: string }).emptyMessage ?? 'No data'}
                  </td>
                </tr>
              ) : (
                data.map((row, ri) => (
                  <tr key={ri} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {columns.map((col, i) => (
                      <td key={col} style={{ color: 'var(--color-text-primary)', borderRight: i < columns.length - 1 || (isReadWrite && tbl.rowActions?.length) ? '1px solid var(--color-border)' : undefined, padding: cellPadding }}>
                        {formatCellValue(getNested(row as Record<string, unknown>, col), col, (tbl.columnFormats as Record<string, 'currency' | 'percent' | 'number'> | undefined)?.[col])}
                      </td>
                    ))}
                    {isReadWrite && tbl.rowActions && tbl.rowActions.length > 0 && (
                      <td style={{ padding: cellPadding, whiteSpace: 'nowrap' }}>
                        <div className="flex gap-1 shrink-0">
                          {tbl.rowActions.map((ra, rai) => {
                            const handleClick = () => {
                              const rowData = row as Record<string, unknown>;
                              const txId = rowData.id as number | undefined;
                              if (ra.handler === 'editTransactionModal' && strategyId && onEditTransaction && txId != null) {
                                onEditTransaction(rowData);
                              } else if (ra.handler === 'deleteTransaction' && strategyId && txId != null && setDeleteTransactionConfirmOpen) {
                                setDeleteTransactionConfirmOpen({ strategyId, transactionId: txId });
                              }
                            };
                            return (
                              <button
                                key={rai}
                                type="button"
                                className="p-1 rounded"
                                style={{ color: 'var(--color-text-secondary)' }}
                                onClick={handleClick}
                                title={ra.title}
                              >
                                {ra.icon?.toLowerCase() === 'pencil' && <Pencil size={12} />}
                                {ra.icon?.toLowerCase() === 'trash' && <Trash2 size={12} />}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
    return p != null ? <div style={paddingToStyle(p)}>{inner}</div> : inner;
  }
  if ('Chart' in item) {
    const chart = item.Chart;
    const p = chart.padding;
    const source = chart.source;
    const data = resolved[source] as { items?: { label: string; value: number }[] } | undefined;
    const items = data?.items ?? [];

    let inner: React.ReactNode;
    if (chart.type === 'pie' && items.length > 0) {
      const CHART_COLORS = [
        'var(--color-chart-1)',
        'var(--color-chart-2)',
        'var(--color-chart-3)',
        'var(--color-chart-4)',
        'var(--color-chart-5)',
      ];
      inner = (
        <div className="w-full min-h-[180px]" style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={items}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius="75%"
                label={({ label, value }) => `${label} ${value}%`}
              >
                {items.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v}%`, '% of portfolio']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    } else if (chart.type === 'pie' && items.length === 0) {
      inner = (
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          No holdings
        </span>
      );
    } else {
      inner = (
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          [Chart: {chart.type}]
        </span>
      );
    }
    return p != null ? <div style={paddingToStyle(p)}>{inner}</div> : inner;
  }
  if ('separator' in item) {
    const sep = item.separator as { orientation?: 'horizontal' | 'vertical'; padding?: PaddingValue };
    const isVertical = sep.orientation === 'vertical';
    const lineStyle: React.CSSProperties = {
      flex: isVertical ? 'none' : 1,
      backgroundColor: 'var(--color-border)',
      minWidth: isVertical ? 1 : undefined,
      width: isVertical ? 1 : '100%',
      minHeight: isVertical ? '100%' : 1,
      height: isVertical ? '100%' : 1,
    };
    const wrapperStyle: React.CSSProperties = isVertical
      ? { display: 'flex', height: '100%', minHeight: 24, alignItems: 'stretch' }
      : { display: 'flex', width: '100%', alignItems: 'center' };
    const inner = <div style={wrapperStyle}><div style={lineStyle} /></div>;
    return sep.padding != null ? <div style={paddingToStyle(sep.padding)}>{inner}</div> : inner;
  }
  return null;
}

/** Cell alignment. Defined for flex-col: justifyContent=vertical, alignItems=horizontal.
 * When contentDirection is 'row' (flex-row), axes swap so we swap justifyContent/alignItems. */
const ALIGNMENT_MAP_COL: Record<string, React.CSSProperties> = {
  'center left': { justifyContent: 'center', alignItems: 'flex-start' },
  'center middle': { justifyContent: 'center', alignItems: 'center' },
  'center right': { justifyContent: 'center', alignItems: 'flex-end' },
  'stretch center': { justifyContent: 'center', alignItems: 'stretch' },
};

function getAlignmentStyles(alignment: string, isRow: boolean): React.CSSProperties {
  const base = ALIGNMENT_MAP_COL[alignment] ?? ALIGNMENT_MAP_COL['center middle'];
  if (!isRow) return base;
  return { justifyContent: base.alignItems, alignItems: base.justifyContent };
}

export interface SubviewSpecRendererProps {
  spec: SubviewSpec;
  pythonCode: string;
  context: unknown;
  inputs: Record<string, unknown>;
  /** When provided, inputs are editable; onChange(key, value) where value is string | number (time_range stored as JSON string) */
  onInputChange?: (key: string, value: string | number) => void;
  /** Strategy-scoped inputs; subviews reference via global.xxx; passed to Python as inputs.global */
  globalInputsConfig?: Record<string, { type: string; title: string; default?: unknown; options?: { value: string; label: string }[]; min?: number; max?: number }>;
  /** [{id, type}] so subview Python can resolve inputs by id (e.g. find time_range by type, use its id to get value) */
  globalInputConfig?: Array<{ id: string; type: string }>;
  globalInputValues?: Record<string, unknown>;
  onGlobalInputChange?: (key: string, value: string | number) => void;
  /** For readwrite tables: strategyId to edit/delete transactions */
  strategyId?: string;
}

export function SubviewSpecRenderer({
  spec,
  pythonCode,
  context,
  inputs,
  onInputChange,
  globalInputsConfig,
  globalInputConfig,
  globalInputValues,
  onGlobalInputChange,
  strategyId,
}: SubviewSpecRendererProps) {
  const [resolved, setResolved] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const setEditTransactionModalOpen = useUIStore((s) => s.setEditTransactionModalOpen);
  const setDeleteTransactionConfirmOpen = useUIStore((s) => s.setDeleteTransactionConfirmOpen);

  const handleEditTransaction = (row: Record<string, unknown>) => {
    if (!strategyId) return;
    const tx: StrategyTransaction = {
      id: row.id as number,
      side: (row.side as string) ?? '',
      cashDelta: (row.cashDelta as number) ?? 0,
      timestamp: (row.timestamp as string) ?? '',
      instrumentSymbol: (row.instrumentSymbol as string) ?? '',
      option: (row.option as StrategyTransaction['option']) ?? null,
      customData: (row.customData as Record<string, unknown>) ?? {},
      quantity: (row.quantity as number) ?? 0,
      price: (row.price as number) ?? 0,
    };
    setEditTransactionModalOpen({ strategyId, transaction: tx, mode: 'stock-etf' });
  };

  // Explicitly track transactions so table refreshes when they change (addTransaction)
  const contextTxLen = (context as { transactions?: unknown[] })?.transactions?.length ?? 0;

  useEffect(() => {
    if (!spec || !pythonCode) return;
    let cancelled = false;
    const pyRefs = new Set<string>();
    const tableSources = new Set<string>();
    const chartSources = new Set<string>();
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
          if ('Table' in c) {
            const src = (c as { Table: { source: string } }).Table.source;
            if (typeof src === 'string' && src.startsWith('py:')) tableSources.add(src);
          }
          if ('Chart' in c) {
            const src = (c as { Chart: { source: string } }).Chart.source;
            if (typeof src === 'string' && src.startsWith('py:')) chartSources.add(src);
          }
        }
      }
    }
    setLoading(true);
    (async () => {
      const mergedInputs: Record<string, unknown> = {
        ...inputs,
        global: globalInputValues ?? inputs.global ?? {},
      };
      if (globalInputConfig != null) mergedInputs.globalInputConfig = globalInputConfig;
      const next: Record<string, unknown> = {};
      for (const ref of pyRefs) {
        if (cancelled) return;
        const fn = ref.slice(3);
        const result = await runPythonFunction(pythonCode, fn, context, mergedInputs);
        if (result.success) {
          const v = result.value;
          next[ref] = typeof v === 'string' || typeof v === 'number' ? v : String(v);
        } else {
          next[ref] = `Error: ${result.error}`;
        }
      }
      for (const ref of tableSources) {
        if (cancelled) return;
        if (next[ref] != null) continue;
        const fn = ref.slice(3);
        const result = await runPythonFunction(pythonCode, fn, context, mergedInputs);
        if (result.success && Array.isArray(result.value)) {
          next[ref] = result.value;
        } else {
          next[ref] = [];
        }
      }
      for (const ref of chartSources) {
        if (cancelled) return;
        if (next[ref] != null) continue;
        const fn = ref.slice(3);
        const result = await runPythonFunction(pythonCode, fn, context, mergedInputs);
        if (result.success && result.value != null) {
          next[ref] = result.value;
        } else {
          next[ref] = { items: [] };
        }
      }
      if (!cancelled) {
        setResolved(next);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [spec, pythonCode, context, inputs, globalInputConfig, globalInputValues, contextTxLen]);

  return (
    <div
      className="subview-spec-root flex-1 flex flex-col min-h-0 min-w-full w-full relative z-0"
      style={{ paddingTop: 'var(--subview-top-bar-height)', paddingLeft: 0, paddingRight: 0, paddingBottom: 0 }}
    >
      <div
        className="subview-spec-content flex-1 flex flex-col min-h-0 min-w-full w-full overflow-auto"
        role="region"
        aria-label="Subview content"
        style={{ padding: 0 }}
      >
        <div className="subview-spec-layout flex flex-col gap-0 min-w-full w-full" style={{ padding: 0, width: '100%', minWidth: '100%' }}>
          {spec.layout.map((row, ri) => {
              const hasWeightedCell = row.some((c: { weight?: number }) => c.weight != null);
              return (
              <div
                key={ri}
                className="flex flex-wrap gap-x-2 gap-y-1 min-w-full w-full"
                style={{
                  width: '100%',
                  minWidth: '100%',
                  alignItems: hasWeightedCell ? 'stretch' : 'flex-start',
                }}
              >
                {row.map((cell, ci) => (
                  <div
                    key={ci}
                    className={`subview-layout-cell flex gap-1 flex-wrap ${cell.contentDirection === 'row' ? 'flex-row' : 'flex-col'} ${cell.weight != null ? 'min-w-0 flex-1' : 'shrink-0'}`}
                    style={{
                      ...(cell.weight != null ? { flex: cell.weight } : { flex: '0 0 auto' }),
                      ...getAlignmentStyles(cell.alignment ?? 'center middle', cell.contentDirection === 'row'),
                      ...(cell.padding != null ? paddingToStyle(cell.padding) : { padding: 0 }),
                      boxSizing: 'border-box',
                      ...(cell.showBorder
                        ? {
                            border: resolveColor(cell.backgroundColor)
                              ? '2px solid rgba(255,255,255,0.5)'
                              : '1px solid var(--color-border)',
                          }
                        : {}),
                      ...(resolveColor(cell.backgroundColor) ? { backgroundColor: resolveColor(cell.backgroundColor) } : {}),
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
                        strategyId={strategyId}
                        onEditTransaction={handleEditTransaction}
                        textColor={resolveColor(cell.textColor)}
                        setDeleteTransactionConfirmOpen={strategyId ? setDeleteTransactionConfirmOpen : undefined}
                      />
                    ))}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
