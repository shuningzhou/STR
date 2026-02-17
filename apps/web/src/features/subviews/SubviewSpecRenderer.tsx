/**
 * Renders a subview from its JSON spec.
 * Shared by LivePreview (editor) and SubviewCard (canvas).
 * Inputs are NOT auto-rendered; they appear only when referenced in layout via { "input": { "ref": "key" } }.
 */
import { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { SubviewSpec, ContentItem } from '@str/shared';
import { runPythonFunction } from '@/lib/pyodide-executor';
import { Input } from '@/components/ui';
import { InputControl } from './InputControl';
import { useUIStore } from '@/store/ui-store';
import { useStrategyStore } from '@/store/strategy-store';
import type { StrategyTransaction } from '@/store/strategy-store';

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

/** Format cell value for display */
function formatCellValue(val: unknown, key: string): string {
  if (val == null || val === '') return '—';
  if (typeof val === 'number') {
    if (key === 'cashDelta' || key === 'price') return `$${val.toFixed(2)}`;
    if (Number.isInteger(val)) return String(val);
    return val.toFixed(2);
  }
  return String(val);
}

const COLUMN_LABELS: Record<string, string> = {
  date: 'Date',
  instrumentSymbol: 'Symbol',
  side: 'Side',
  quantity: 'Qty',
  price: 'Price',
  cashDelta: 'Amount',
  timestamp: 'Date',
};

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
  onDeleteTransaction,
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
  onDeleteTransaction?: (transactionId: number) => void;
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
    const tbl = item.Table;
    const p = tbl.padding;
    const source = tbl.source;
    const data = (resolved[source] as Record<string, unknown>[]) ?? [];
    const columns = tbl.columns;
    const isReadWrite = spec.type === 'readwrite';

    const cellPadding = 5;
    const inner = (
      <div className="subview-table-container flex flex-col min-w-full w-full border overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-input)', width: '100%', minWidth: '100%' }}>
        <div className="overflow-y-scroll min-h-0 flex-1 subview-table-body w-full" style={{ maxHeight: 200, width: '100%' }}>
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
                  <th key={col} className="text-left font-medium" style={{ color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)', padding: cellPadding }}>
                    {COLUMN_LABELS[col] ?? col}
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
                  <td colSpan={columns.length + (tbl.rowActions?.length ? 1 : 0)} className="text-center" style={{ color: 'var(--color-text-muted)', padding: cellPadding, borderRight: '1px solid var(--color-border)' }}>
                    No transactions
                  </td>
                </tr>
              ) : (
                data.map((row, ri) => (
                  <tr key={ri} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {columns.map((col) => (
                      <td key={col} style={{ color: 'var(--color-text-primary)', borderRight: '1px solid var(--color-border)', padding: cellPadding }}>
                        {formatCellValue(getNested(row as Record<string, unknown>, col), col)}
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
                              } else if (ra.handler === 'deleteTransaction' && strategyId && onDeleteTransaction && txId != null) {
                                if (window.confirm(`Delete this transaction?`)) {
                                  onDeleteTransaction(txId);
                                }
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
  globalInputValues,
  onGlobalInputChange,
  strategyId,
}: SubviewSpecRendererProps) {
  const [resolved, setResolved] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const setEditTransactionModalOpen = useUIStore((s) => s.setEditTransactionModalOpen);
  const removeTransaction = useStrategyStore((s) => s.removeTransaction);

  const handleEditTransaction = (row: Record<string, unknown>) => {
    if (!strategyId) return;
    const tx: StrategyTransaction = {
      id: row.id as number,
      side: (row.side as string) ?? '',
      cashDelta: (row.cashDelta as number) ?? 0,
      timestamp: (row.timestamp as string) ?? '',
      instrumentId: (row.instrumentId as string) ?? '',
      instrumentSymbol: (row.instrumentSymbol as string) ?? '',
      instrumentName: (row.instrumentName as string) ?? '',
      option: (row.option as StrategyTransaction['option']) ?? null,
      customData: (row.customData as Record<string, unknown>) ?? {},
      quantity: (row.quantity as number) ?? 0,
      price: (row.price as number) ?? 0,
    };
    setEditTransactionModalOpen({ strategyId, transaction: tx });
  };

  const handleDeleteTransaction = (transactionId: number) => {
    if (!strategyId) return;
    removeTransaction(strategyId, transactionId);
  };

  // Explicitly track transactions so table refreshes when they change (addTransaction)
  const contextTxLen = (context as { transactions?: unknown[] })?.transactions?.length ?? 0;

  useEffect(() => {
    if (!spec || !pythonCode) return;
    let cancelled = false;
    const pyRefs = new Set<string>();
    const tableSources = new Set<string>();
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
        }
      }
    }
    setLoading(true);
    (async () => {
      const mergedInputs =
        globalInputValues != null && Object.keys(globalInputValues).length > 0
          ? { ...inputs, global: globalInputValues }
          : inputs;
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
      if (!cancelled) {
        setResolved(next);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [spec, pythonCode, context, inputs, globalInputValues, contextTxLen]);

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
        {loading ? (
          <div
            className="flex-1 flex items-center justify-center shrink-0"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <span className="text-xs">Loading…</span>
          </div>
        ) : (
          <div className="subview-spec-layout flex flex-col gap-0 min-w-full w-full" style={{ padding: 0, width: '100%', minWidth: '100%' }}>
            {spec.layout.map((row, ri) => (
              <div key={ri} className="flex gap-0 min-w-full w-full" style={{ width: '100%', minWidth: '100%' }}>
                {row.map((cell, ci) => (
                  <div
                    key={ci}
                    className={`subview-layout-cell flex flex-col gap-1 flex flex-wrap ${cell.weight != null ? 'min-w-0 flex-1' : 'shrink-0'}`}
                    style={{
                      ...(cell.weight != null ? { flex: cell.weight } : { flex: '0 0 auto' }),
                      ...ALIGNMENT_MAP[cell.alignment],
                      ...(cell.padding != null ? paddingToStyle(cell.padding) : { padding: 0 }),
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
                        onDeleteTransaction={handleDeleteTransaction}
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
