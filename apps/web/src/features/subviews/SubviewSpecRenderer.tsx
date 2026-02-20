/**
 * Renders a subview from its JSON spec.
 * Shared by LivePreview (editor) and SubviewCard (canvas).
 * Inputs are NOT auto-rendered; they appear only when referenced in layout via { "input": { "ref": "key" } }.
 */
import { useState, useEffect } from 'react';
import { Pencil, Trash2, Repeat, X } from 'lucide-react';
import { getIconComponent } from '@/lib/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, LabelList } from 'recharts';

/** Custom bar shape: rounds top corners only when this segment is the top of the stack for this datum. */
function StackedBarShape({
  x,
  y,
  width,
  height,
  fill,
  payload,
  barSeries,
  seriesIndex,
  radius = 4,
}: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  payload?: Record<string, unknown>;
  barSeries: { name: string }[];
  seriesIndex: number;
  radius?: number;
}) {
  if (x == null || y == null || width == null || height == null || height <= 0) return null;
  const isTop =
    payload &&
    barSeries
      .slice(seriesIndex + 1)
      .every((s) => !(Number(payload[s.name]) || 0));
  if (!isTop) {
    return <rect x={x} y={y} width={width} height={height} fill={fill ?? 'var(--color-chart-1)'} />;
  }
  const r = Math.min(radius, width / 2, height / 2);
  const path = `M ${x + r},${y} L ${x + width - r},${y} Q ${x + width},${y} ${x + width},${y + r} L ${x + width},${y + height} L ${x},${y + height} L ${x},${y + r} Q ${x},${y} ${x + r},${y} Z`;
  return <path d={path} fill={fill ?? 'var(--color-chart-1)'} />;
}
import type { SubviewSpec, ContentItem, LayoutRow, LayoutCell } from '@str/shared';
import { runPythonFunction } from '@/lib/pyodide-executor';
import { InputControl } from './InputControl';
import { useUIStore } from '@/store/ui-store';
import type { StrategyTransaction } from '@/store/strategy-store';

/** Blend hex color with white or black. amount in [0,1]: 0 = all base, 1 = all blend */
function blendHex(hex: string, withColor: '#ffffff' | '#000000', amount: number): string {
  const parse = (h: string) => ({
    r: parseInt(h.slice(1, 3), 16),
    g: parseInt(h.slice(3, 5), 16),
    b: parseInt(h.slice(5, 7), 16),
  });
  const a = parse(hex);
  const b = parse(withColor);
  const lerp = (x: number, y: number) => Math.round(x * (1 - amount) + y * amount);
  const r = lerp(a.r, b.r);
  const g = lerp(a.g, b.g);
  const bl = lerp(a.b, b.b);
  return '#' + [r, g, bl].map((c) => c.toString(16).padStart(2, '0')).join('');
}

/** 12 main built-in colors with 5 variants each. Custom rgb/rgba/#hex also supported. */
const MAIN_COLORS: { name: string; hex: string }[] = [
  { name: 'red', hex: '#FF1200' },
  { name: 'orange', hex: '#FF8900' },
  { name: 'yellow', hex: '#FFDB00' },
  { name: 'lime', hex: '#DBFF00' },
  { name: 'green', hex: '#28c207' },
  { name: 'mint', hex: '#00FFA4' },
  { name: 'cyan', hex: '#00C8FF' },
  { name: 'blue', hex: '#0052FF' },
  { name: 'violet', hex: '#9200FF' },
  { name: 'magenta', hex: '#F600FF' },
  { name: 'grey', hex: '#696969' },
  { name: 'offwhite', hex: '#E2E2E2' },
];

export const BUILT_IN_COLORS: Record<string, string> = {};
for (const { name, hex } of MAIN_COLORS) {
  BUILT_IN_COLORS[`${name}-0`] = blendHex(hex, '#ffffff', 0.50); // lightest (50% white)
  BUILT_IN_COLORS[`${name}-1`] = blendHex(hex, '#ffffff', 0.30); // lighter (30% white)
  BUILT_IN_COLORS[`${name}-2`] = hex; // default
  BUILT_IN_COLORS[`${name}-3`] = blendHex(hex, '#000000', 0.20); // darker (20% black)
  BUILT_IN_COLORS[`${name}-4`] = blendHex(hex, '#000000', 0.40); // darkest (40% black)
  BUILT_IN_COLORS[name] = hex; // alias for default (name-2)
}
// No variants
BUILT_IN_COLORS['black'] = '#131313';
BUILT_IN_COLORS['offblack'] = '#202020';
BUILT_IN_COLORS['white'] = '#f2f2f2';

/** Default branding/accent green (green-2 from built-in colors) */
export const BRANDING_GREEN = BUILT_IN_COLORS['green-2'];
/** Hover state for branding (green-3, darker) */
export const BRANDING_GREEN_HOVER = BUILT_IN_COLORS['green-3'];

/** Resolve color: built-in name -> hex; rgb/rgba/hsl/hsla/#hex passed through */
export function resolveColor(color: string | undefined): string | undefined {
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

/** Format cell value; format from spec.columnFormats or inferred for numbers. Currency uses text (e.g. "123.45 USD") not $ sign. */
function formatCellValue(
  val: unknown,
  key: string,
  format?: 'currency' | 'percent' | 'number',
  currency?: string
): string {
  if (val == null || val === '') return '—';
  if (typeof val === 'number') {
    if (format === 'currency') return `${val.toFixed(2)} ${currency ?? 'USD'}`;
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
  setRollOptionModalOpen,
  setCloseOptionModalOpen,
  isEditMode = true,
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
  setRollOptionModalOpen?: (value: { strategyId: string; transaction: StrategyTransaction } | null) => void;
  setCloseOptionModalOpen?: (value: { strategyId: string; transaction: StrategyTransaction } | null) => void;
  isEditMode?: boolean;
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
      <div style={{ minWidth: 0, flex: '0 0 auto', textAlign }}>
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
    const currency = (context as { wallet?: { baseCurrency?: string } })?.wallet?.baseCurrency ?? 'USD';
    let display: string;
    const num = typeof raw === 'number' ? raw : parseFloat(String(raw));
    if (format != null && !Number.isNaN(num)) {
      const fixed = num.toFixed(decimals);
      display = format === '$' ? `${fixed} ${currency}` : `${fixed}%`;
    } else {
      display = String(raw);
    }
    const size = n.size ? (FONT_SIZES[n.size] ?? 'var(--font-size-body)') : 'var(--font-size-body)';
    const textAlign = (n.alignment as React.CSSProperties['textAlign']) ?? 'center';
    const inner = (
      <div style={{ minWidth: 0, flex: '0 0 auto', textAlign }}>
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
      <div className="subview-table-container flex flex-col min-w-full w-full" style={{ borderTop: '1px solid var(--color-table-border)', borderBottom: '1px solid var(--color-table-border)', backgroundColor: 'transparent', width: '100%', minWidth: '100%' }}>
        <div className="subview-table-body w-full" style={{ width: '100%' }}>
          <table className="subview-spec-table border-collapse text-[12px]" style={{ tableLayout: 'auto', width: 'max-content', minWidth: '100%' }}>
            <colgroup>
              {columns.map((col) => (
                <col key={col} />
              ))}
              {isReadWrite && tbl.rowActions && tbl.rowActions.length > 0 && (() => {
                const visibleCount = isEditMode ? tbl.rowActions.length : tbl.rowActions.filter((ra) => ra.handler !== 'editTransactionModal' && ra.handler !== 'deleteTransaction').length;
                const actionsColWidth = visibleCount === 0 ? 1 : 10 + 10 + visibleCount * 12 + (visibleCount - 1) * 10;
                return <col key="actions" style={{ width: actionsColWidth, minWidth: actionsColWidth }} />;
              })()}
            </colgroup>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr style={{ backgroundColor: 'var(--color-table-header-bg)' }}>
                {columns.map((col, i) => (
                  <th key={col} className="font-medium" style={{ color: 'var(--color-table-header-text)', borderBottom: '1px solid var(--color-table-border)', borderRight: i < columns.length - 1 || (isReadWrite && tbl.rowActions?.length) ? '1px solid var(--color-table-border)' : undefined, padding: cellPadding, whiteSpace: 'nowrap', textAlign: 'right' }}>
                    {(tbl.columnLabels as Record<string, string> | undefined)?.[col] ?? humanizeColumnKey(col)}
                  </th>
                ))}
                {isReadWrite && tbl.rowActions && tbl.rowActions.length > 0 && (
                  <th style={{ borderBottom: '1px solid var(--color-table-border)', padding: cellPadding, whiteSpace: 'nowrap' }} />
                )}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (tbl.rowActions?.length ? 1 : 0)} style={{ color: 'var(--color-text-muted)', padding: cellPadding, textAlign: 'right' }}>
                    {(tbl as { emptyMessage?: string }).emptyMessage ?? 'No data'}
                  </td>
                </tr>
              ) : (
                data.map((row, ri) => (
                  <tr key={ri} style={{ borderBottom: '1px solid var(--color-table-border)' }}>
                    {columns.map((col, i) => {
                      const cellVal = getNested(row as Record<string, unknown>, col);
                      const cellColors = (tbl as { columnCellColors?: Record<string, Record<string, string>> }).columnCellColors;
                      const colorMap = cellColors?.[col];
                      const resolvedColor = colorMap && typeof cellVal === 'string' ? resolveColor(colorMap[cellVal]) : undefined;
                      return (
                        <td key={col} style={{ color: resolvedColor ?? 'var(--color-text-primary)', borderRight: i < columns.length - 1 || (isReadWrite && tbl.rowActions?.length) ? '1px solid var(--color-table-border)' : undefined, padding: cellPadding, whiteSpace: 'nowrap', textAlign: 'right' }}>
                          {formatCellValue(cellVal, col, (tbl.columnFormats as Record<string, 'currency' | 'percent' | 'number'> | undefined)?.[col], (context as { wallet?: { baseCurrency?: string } })?.wallet?.baseCurrency)}
                        </td>
                      );
                    })}
                    {isReadWrite && tbl.rowActions && tbl.rowActions.length > 0 && (() => {
                      const visibleRowActions = isEditMode
                        ? tbl.rowActions
                        : tbl.rowActions.filter((ra) => ra.handler !== 'editTransactionModal' && ra.handler !== 'deleteTransaction');
                      if (visibleRowActions.length === 0) {
                        return <td style={{ padding: cellPadding }} />;
                      }
                      return (
                      <td style={{ paddingTop: cellPadding, paddingBottom: cellPadding, paddingLeft: 10, paddingRight: 10, whiteSpace: 'nowrap' }}>
                        <div className="flex" style={{ gap: 10 }}>
                          {visibleRowActions.map((ra, rai) => {
                            const handleClick = () => {
                              const rowData = row as Record<string, unknown>;
                              const txId = rowData.id as number | undefined;
                              const toTx = (): StrategyTransaction => ({
                                id: rowData.id as number,
                                side: (rowData.side as string) ?? '',
                                cashDelta: (rowData.cashDelta as number) ?? 0,
                                timestamp: (rowData.timestamp as string) ?? '',
                                instrumentSymbol: (rowData.instrumentSymbol as string) ?? '',
                                option: (rowData.option as StrategyTransaction['option']) ?? null,
                                customData: (rowData.customData as Record<string, unknown>) ?? {},
                                quantity: (rowData.quantity as number) ?? 0,
                                price: (rowData.price as number) ?? 0,
                              });
                              if (ra.handler === 'editTransactionModal' && strategyId && onEditTransaction && txId != null) {
                                onEditTransaction(rowData);
                              } else if (ra.handler === 'deleteTransaction' && strategyId && txId != null && setDeleteTransactionConfirmOpen) {
                                setDeleteTransactionConfirmOpen({ strategyId, transactionId: txId });
                              } else if (ra.handler === 'rollOptionModal' && strategyId && setRollOptionModalOpen) {
                                const tx = toTx();
                                if (tx.option) setRollOptionModalOpen({ strategyId, transaction: tx });
                              } else if (ra.handler === 'closeOptionModal' && strategyId && setCloseOptionModalOpen) {
                                setCloseOptionModalOpen({ strategyId, transaction: toTx() });
                              }
                            };
                            const icon = ra.icon?.toLowerCase();
                            return (
                              <button
                                key={rai}
                                type="button"
                                className="rounded"
                                style={{ color: 'var(--color-text-secondary)', padding: 0 }}
                                onClick={handleClick}
                                title={ra.title}
                              >
                                {icon === 'pencil' && <Pencil size={12} />}
                                {icon === 'trash' && <Trash2 size={12} />}
                                {icon === 'repeat' && <Repeat size={12} />}
                                {icon === 'x' && <X size={12} />}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    );})()}
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
    const data = resolved[source] as
      | {
          items?: { label: string; value: number }[];
          labels?: string[];
          series?: { name: string; data: number[] }[];
          colors?: { value?: string; depositWithdraw?: string; loan?: string; holdingsValue?: string } & Record<string, string>;
        }
      | undefined;
    const items = data?.items ?? [];
    const dataColors = data?.colors;
    const barLabels = data?.labels ?? [];
    const barSeries = data?.series ?? [];

    let inner: React.ReactNode;
    if (chart.type === 'pie' && items.length > 0) {
      const PIE_PALETTE = [
        resolveColor('blue-2') ?? '#0052FF',
        resolveColor('green-2') ?? '#28c207',
        resolveColor('yellow-2') ?? '#FFDB00',
        resolveColor('red-2') ?? '#FF1200',
        resolveColor('violet-1') ?? '#B84DFF',
        resolveColor('magenta-2') ?? '#F600FF',
        resolveColor('mint-2') ?? '#00FFA4',
      ];
      inner = (
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, width: '100%', height: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 8, right: 8, bottom: 36, left: 8 }}>
              <Pie
                data={items}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="48%"
                innerRadius="55%"
                outerRadius="92%"
                paddingAngle={1}
                label={({ value, x, y }) => {
                  if (value < 2) return null;
                  return (
                    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fill="var(--color-text-primary)" fontSize={12} fontWeight={500}>
                      {value}%
                    </text>
                  );
                }}
                labelLine={false}
              >
                {items.map((_, i) => (
                  <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number, _: unknown, props: { payload?: { label?: string } }) => [`${v}%`, props.payload?.label ?? '']}
                contentStyle={{ backgroundColor: 'rgba(19, 19, 19, 0.85)', color: 'white', border: 'none', borderRadius: 4 }}
                itemStyle={{ color: 'white' }}
                labelStyle={{ color: 'white' }}
              />
              <Legend
                layout="horizontal"
                align="center"
                verticalAlign="bottom"
                wrapperStyle={{ paddingTop: 4 }}
                formatter={(value, entry) => (
                  <span style={{ color: 'var(--color-text-primary)', fontSize: 12 }}>
                    {value} ({entry.payload?.value ?? 0}%)
                  </span>
                )}
                iconType="square"
                iconSize={10}
              />
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
    } else if (chart.type === 'line' && items.length > 0) {
      const lineColor = resolveColor(dataColors?.value) ?? resolveColor((chart as { color?: string }).color) ?? 'var(--color-chart-1)';
      const hasDepositWithdraw = items.some((i) => 'depositWithdraw' in i && (i as { depositWithdraw?: number }).depositWithdraw != null);
      const hasLoan = items.some((i) => 'loan' in i && (i as { loan?: number }).loan != null);
      const hasHoldingsValue = items.some((i) => 'holdingsValue' in i && (i as { holdingsValue?: number }).holdingsValue != null);
      const dwColor = resolveColor(dataColors?.depositWithdraw) ?? resolveColor('orange-2');
      const loanColor = resolveColor(dataColors?.loan) ?? resolveColor('red-2');
      const holdingsColor = resolveColor(dataColors?.holdingsValue) ?? resolveColor('blue-1');

      const LineTooltip = ({ active, payload, label }: { active?: boolean; payload?: { dataKey?: string; value?: number }[]; label?: string }) => {
        if (!active || !payload?.length) return null;
        const portfolioPayload = payload.find((p) => p.dataKey === 'value');
        const dwPayload = payload.find((p) => p.dataKey === 'depositWithdraw');
        const loanPayload = payload.find((p) => p.dataKey === 'loan');
        const holdingsPayload = payload.find((p) => p.dataKey === 'holdingsValue');
        return (
          <div
            style={{
              padding: '6px 10px',
              backgroundColor: 'rgba(19, 19, 19, 0.85)',
              color: 'white',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            <div style={{ color: 'white' }}>Date: {label}</div>
            <div style={{ color: 'white' }}>Portfolio: ${Number(portfolioPayload?.value ?? 0).toLocaleString()}</div>
            {dwPayload != null && (
              <div style={{ color: 'white' }}>Deposit: ${Number(dwPayload.value ?? 0).toLocaleString()}</div>
            )}
            {loanPayload != null && (
              <div style={{ color: 'white' }}>Loan: ${Number(loanPayload.value ?? 0).toLocaleString()}</div>
            )}
            {holdingsPayload != null && (
              <div style={{ color: 'white' }}>Holdings: ${Number(holdingsPayload.value ?? 0).toLocaleString()}</div>
            )}
          </div>
        );
      };

      inner = (
        <div className="w-full flex-1 min-h-0" style={{ position: 'relative', minHeight: 80 }}>
          <div style={{ position: 'absolute', inset: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={items} margin={{ top: 5, right: 5, left: 5, bottom: 5 }} isAnimationActive={false}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="var(--color-text-muted)" />
                <YAxis tick={{ fontSize: 10 }} stroke="var(--color-text-muted)" tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<LineTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="value" stroke={lineColor} strokeWidth={2} dot={{ r: 2, fill: lineColor }} isAnimationActive={false} name="Portfolio" />
                {hasDepositWithdraw && (
                  <Line type="monotone" dataKey="depositWithdraw" stroke={dwColor} strokeWidth={2} dot={{ r: 2, fill: dwColor }} isAnimationActive={false} name="Deposit" />
                )}
                {hasLoan && (
                  <Line type="monotone" dataKey="loan" stroke={loanColor} strokeWidth={2} dot={{ r: 2, fill: loanColor }} isAnimationActive={false} name="Loan" />
                )}
                {hasHoldingsValue && (
                  <Line type="monotone" dataKey="holdingsValue" stroke={holdingsColor} strokeWidth={2} dot={{ r: 2, fill: holdingsColor }} isAnimationActive={false} name="Holdings" />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    } else if (chart.type === 'line' && items.length === 0) {
      inner = (
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          No data
        </span>
      );
    } else if (chart.type === 'bar' && barLabels.length > 0 && barSeries.length > 0) {
      const barData = barLabels.map((label, i) => {
        const row: Record<string, string | number> = { label };
        for (const s of barSeries) {
          row[s.name] = s.data[i] ?? 0;
        }
        return row;
      });
      const CHART_BAR_COLORS = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)', 'var(--color-chart-5)'];
      const BarTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name?: string; value?: number; fill?: string }[]; label?: string }) => {
        if (!active || !payload?.length) return null;
        const total = payload.reduce((sum, p) => sum + (Number(p.value) || 0), 0);
        return (
          <div
            style={{
              padding: '6px 10px',
              backgroundColor: 'rgba(19, 19, 19, 0.85)',
              color: 'white',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            <div style={{ color: 'white' }}>{label}</div>
            {payload.map((p) => (Number(p.value) || 0) > 0 && (
              <div key={p.name ?? ''} style={{ color: 'white' }}>{p.name}: ${Number(p.value).toLocaleString()}</div>
            ))}
            <div style={{ color: 'white' }}>Total: ${total.toLocaleString()}</div>
          </div>
        );
      };
      inner = (
        <div className="w-full flex-1 min-h-0" style={{ position: 'relative', minHeight: 80 }}>
          <div style={{ position: 'absolute', inset: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 24, right: 5, left: 5, bottom: 5 }} isAnimationActive={false}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="var(--color-text-muted)" />
                <YAxis tick={{ fontSize: 10 }} stroke="var(--color-text-muted)" tickFormatter={(v) => `$${Number(v).toLocaleString()}`} />
                <Tooltip content={<BarTooltip />} cursor={false} />
                <Legend />
                {barSeries.map((s, i) => {
                  const seriesColor = resolveColor((dataColors as Record<string, string>)?.[s.name]) ?? CHART_BAR_COLORS[i % CHART_BAR_COLORS.length];
                  const hoverFill = /^#[0-9a-fA-F]{6}$/.test(seriesColor) ? blendHex(seriesColor, '#ffffff', 0.2) : seriesColor;
                  const isTopBar = i === barSeries.length - 1;
                  return (
                    <Bar
                      key={s.name}
                      dataKey={s.name}
                      stackId="stack"
                      fill={seriesColor}
                      name={s.name}
                      isAnimationActive={false}
                      activeBar={{ fill: hoverFill }}
                      shape={(props) => (
                        <StackedBarShape {...props} barSeries={barSeries} seriesIndex={i} payload={(props as { payload?: Record<string, unknown> }).payload} />
                      )}
                    >
                      {isTopBar && (
                        <LabelList
                          position="top"
                          valueAccessor={(entry) => {
                            const payload = (entry as { payload?: Record<string, unknown> }).payload;
                            const total = barSeries.reduce((sum, ser) => sum + (Number(payload?.[ser.name]) || 0), 0);
                            return total > 0 ? `$${total.toLocaleString()}` : '';
                          }}
                          fill={resolveColor('yellow-2') ?? 'var(--color-chart-1)'}
                          style={{ fontSize: 12, fontWeight: 500 }}
                        />
                      )}
                    </Bar>
                  );
                })}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    } else if (chart.type === 'bar') {
      inner = (
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          No data
        </span>
      );
    } else if (chart.type === 'timeline') {
      const timelineData = data as { events?: { date: string; dateShort?: string; ticker?: string; tickers?: string[]; color?: string; tickerColor?: string; tickerColors?: Record<string, string> }[] } | undefined;
      const events = timelineData?.events ?? [];
      if (events.length === 0) {
        inner = (
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            No option expirations
          </span>
        );
      } else {
        const parseDate = (d: string) => {
          const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (m) return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10)).getTime();
          return Date.now();
        };
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const minDate = new Date(Math.min(...events.map((e) => parseDate(e.date))));
        const maxDate = new Date(Math.max(...events.map((e) => parseDate(e.date))));
        const startYear = minDate.getFullYear();
        const startMonth = minDate.getMonth();
        let endYear = maxDate.getFullYear();
        let endMonth = maxDate.getMonth();
        endMonth += 1;
        if (endMonth > 11) {
          endMonth = 0;
          endYear += 1;
        }
        const rangeStart = new Date(startYear, startMonth, 1).getTime();
        const rangeEnd = new Date(endYear, endMonth + 1, 0).getTime();
        const rangeMs = Math.max(rangeEnd - rangeStart, 1);

        const crossesYear = startYear < endYear;
        const axisMarksRaw: { label: string; key: string }[] = [];
        let y = startYear;
        let m = startMonth;
        while (y < endYear || (y === endYear && m <= endMonth)) {
          const label = crossesYear ? monthNames[m] : `${monthNames[m]} ${y}`;
          axisMarksRaw.push({ label, key: `${y}-${m + 1}` });
          if (m === 11) {
            axisMarksRaw.push({ label: String(y + 1), key: `yr-${y + 1}` });
            y += 1;
            m = 0;
          } else {
            m += 1;
          }
        }
        const markCount = axisMarksRaw.length;
        const axisMarks = axisMarksRaw.map((mark, i) => ({
          ...mark,
          left: markCount > 1 ? (i / (markCount - 1)) * 100 : 50,
        }));

        inner = (
          <div className="w-full h-full flex flex-col justify-center" style={{ minHeight: 56 }}>
            <div className="w-full relative flex-shrink-0" style={{ minHeight: 56 }}>
            {/* Timeline axis */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                height: 2,
                backgroundColor: resolveColor('grey-1') ?? 'var(--color-text-primary)',
              }}
            />
            {/* Month/year markers */}
            {axisMarks.map(({ key, label, left }) => (
              <div
                key={key}
                style={{
                  position: 'absolute',
                  left: `${left}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 1,
                  height: 12,
                  backgroundColor: resolveColor('grey-1') ?? 'var(--color-text-primary)',
                }}
              />
            ))}
            {axisMarks.map(({ key, label, left }) => (
              <div
                key={`label-${key}`}
                style={{
                  position: 'absolute',
                  left: `${left}%`,
                  top: 'calc(50% + 10px)',
                  transform: 'translateX(-50%)',
                  fontSize: 10,
                  color: resolveColor('offwhite-2') ?? 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </div>
            ))}
            {/* Event markers - position proportional to day within month */}
            {events.map((e, i) => {
              const match = e.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
              const y = match ? parseInt(match[1], 10) : 0;
              const mo = match ? parseInt(match[2], 10) : 1;
              const day = match ? parseInt(match[3], 10) : 1;
              const monthKey = `${y}-${mo}`;
              const segIdx = axisMarks.findIndex((a) => a.key === monthKey);
              const daysInMonth = new Date(y, mo, 0).getDate();
              const segmentStart = segIdx >= 0 ? axisMarks[segIdx].left : 0;
              const segmentEnd = segIdx >= 0 && segIdx + 1 < axisMarks.length ? axisMarks[segIdx + 1].left : 100;
              const left =
                segIdx >= 0 ? segmentStart + (day / daysInMonth) * (segmentEnd - segmentStart) : ((parseDate(e.date) - rangeStart) / rangeMs) * 100;
              const fillColor = resolveColor(e.color) ?? 'var(--color-chart-2)';
              const tickerColors = e.tickerColors as Record<string, string> | undefined;
              const getTickerColor = (t: string) =>
                resolveColor(tickerColors?.[t] ?? e.tickerColor) ?? fillColor;
              const strokeColor = /^#[0-9a-fA-F]{6}$/.test(fillColor) ? blendHex(fillColor, '#ffffff', 0.4) : fillColor;
              const tickers = e.tickers ?? (e.ticker ? [e.ticker] : []);
              const circleSize = 14;
              const tickerHeight = Math.max(tickers.length * 14, 1);
              const gap = 4;
              return (
                <div
                  key={`${e.date}-${tickers.join(',')}-${i}`}
                  style={{
                    position: 'absolute',
                    left: `${left}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      marginBottom: gap,
                    }}
                  >
                    {tickers.map((t) => (
                      <span key={t} style={{ fontSize: 11, fontWeight: 500, color: getTickerColor(t), lineHeight: 1.2 }}>
                        {t}
                      </span>
                    ))}
                  </div>
                  <div
                    style={{
                      width: circleSize,
                      height: circleSize,
                      borderRadius: '50%',
                      backgroundColor: fillColor,
                      border: `2px solid ${strokeColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 8,
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.95)',
                    }}
                  >
                    {e.dateShort ?? e.date.slice(8, 10) ?? e.date}
                  </div>
                  <div style={{ height: tickerHeight + gap }} aria-hidden />
                </div>
              );
            })}
            </div>
          </div>
        );
      }
    } else {
      inner = (
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          [Chart: {chart.type}]
        </span>
      );
    }
    const chartPadding =
      chart.type === 'timeline'
        ? { ...(typeof p === 'object' && p != null ? p : {}), left: 20, right: 20 }
        : p;
    const isScalingChart =
      (chart.type === 'line' && items.length > 0) ||
      (chart.type === 'bar' && barLabels.length > 0) ||
      (chart.type === 'timeline' && (data as { events?: unknown[] })?.events?.length > 0) ||
      (chart.type === 'pie' && items.length > 0);
    const chartWrapperStyle = isScalingChart
      ? {
          ...paddingToStyle(chartPadding),
          flex: 1,
          minHeight: 0,
          display: 'flex' as const,
          flexDirection: 'column' as const,
          ...(chart.type === 'pie' && { overflow: 'hidden' as const, minHeight: 120 }),
        }
      : paddingToStyle(chartPadding);
    return p != null ? <div style={chartWrapperStyle}>{inner}</div> : inner;
  }
  if ('icon' in item) {
    const ic = item.icon as { name: string; color?: string; size?: number; padding?: PaddingValue };
    const IconComp = getIconComponent(ic.name);
    const size = ic.size ?? 16;
    const color = ic.color ? (resolveColor(ic.color) ?? ic.color) : (textColor ?? 'var(--color-text-primary)');
    const inner = IconComp ? (
      <IconComp size={size} strokeWidth={1.5} style={{ color, flexShrink: 0 }} />
    ) : (
      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>[{ic.name}]</span>
    );
    return ic.padding != null ? (
      <div style={paddingToStyle(ic.padding)}>{inner}</div>
    ) : (
      inner
    );
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

/** Cell alignment (legacy). flex-col: justifyContent=vertical, alignItems=horizontal.
 * When contentDirection is 'row', axes swap. */
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

/** Flex object → CSSProperties. Passes through camelCase keys (justifyContent, alignItems, flex, etc.). */
function flexToStyle(flex: Record<string, unknown> | undefined): React.CSSProperties {
  if (!flex || typeof flex !== 'object') return {};
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(flex)) {
    if (v == null) continue;
    if (typeof v === 'string' || typeof v === 'number') out[k] = v;
  }
  return out as React.CSSProperties;
}

/** Get cells from row (array or { cells }) */
function getRowCells(row: LayoutRow): LayoutCell[] {
  if (Array.isArray(row)) return row;
  if (row && typeof row === 'object' && 'cells' in row && Array.isArray((row as { cells: LayoutCell[] }).cells)) {
    return (row as { cells: LayoutCell[] }).cells;
  }
  return [];
}

/** Get row-level flex from row */
function getRowFlex(row: LayoutRow): Record<string, unknown> | undefined {
  return Array.isArray(row) ? undefined : row.flex;
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
  /** For option tables: pass 'option'; for dividend: pass 'dividend' */
  editTransactionMode?: 'stock-etf' | 'option' | 'dividend';
  /** When false, edit and delete row actions are hidden */
  isEditMode?: boolean;
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
  editTransactionMode = 'stock-etf',
  isEditMode = true,
}: SubviewSpecRendererProps) {
  const [resolved, setResolved] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const setEditTransactionModalOpen = useUIStore((s) => s.setEditTransactionModalOpen);
  const setDeleteTransactionConfirmOpen = useUIStore((s) => s.setDeleteTransactionConfirmOpen);
  const setRollOptionModalOpen = useUIStore((s) => s.setRollOptionModalOpen);
  const setCloseOptionModalOpen = useUIStore((s) => s.setCloseOptionModalOpen);

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
    setEditTransactionModalOpen({ strategyId, transaction: tx, mode: editTransactionMode });
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
      for (const cell of getRowCells(row)) {
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
        <div className="subview-spec-layout flex flex-col gap-0 min-w-full w-full flex-1 min-h-0" style={{ padding: 0, width: '100%', minWidth: '100%' }}>
          {spec.layout.map((row: LayoutRow, ri: number) => {
            const cells = getRowCells(row);
            const rowFlex = getRowFlex(row);
            const hasWeightedCell = cells.some((c) => c.weight != null || (c.flex && ('flex' in c.flex || 'flexGrow' in c.flex)));
            const hasScalingChart = cells.some((c) =>
              c.content?.some((item) => {
                if ('Chart' in item) {
                  const t = (item as { Chart: { type?: string } }).Chart?.type;
                  return t === 'line' || t === 'bar' || t === 'timeline' || t === 'pie';
                }
                return false;
              })
            );
            const rowBaseStyle: React.CSSProperties = {
              width: '100%',
              minWidth: '100%',
              flex: hasWeightedCell && hasScalingChart ? 1 : undefined,
              minHeight: hasWeightedCell && hasScalingChart ? 0 : undefined,
              alignItems: hasWeightedCell ? 'stretch' : 'flex-start',
              ...flexToStyle(rowFlex),
            };
            return (
              <div
                key={ri}
                className="flex flex-wrap gap-x-2 gap-y-1 min-w-full w-full"
                style={rowBaseStyle}
              >
                {cells.map((cell: LayoutCell, ci) => {
                  const useFlex = cell.flex && Object.keys(cell.flex).length > 0;
                  const flexStyles = useFlex ? flexToStyle(cell.flex) : {};
                  if (useFlex && !('flexDirection' in flexStyles)) {
                    (flexStyles as Record<string, string>).flexDirection = cell.contentDirection === 'row' ? 'row' : 'column';
                  }
                  if (useFlex && (flexStyles.flex === 1 || flexStyles.flex === '1' || (flexStyles as Record<string, unknown>).flexGrow === 1)) {
                    (flexStyles as Record<string, unknown>).minHeight = 0;
                    (flexStyles as Record<string, unknown>).minWidth = 0;
                  }
                  const legacyFlex = cell.weight != null ? { flex: cell.weight } : { flex: '0 0 auto' as const };
                  const legacyAlign = getAlignmentStyles(cell.alignment ?? 'center middle', cell.contentDirection === 'row');
                  const legacyDir = cell.contentDirection === 'row' ? 'flex-row' : 'flex-col';
                  const legacyClass = cell.weight != null ? 'min-w-0 flex-1' : 'shrink-0';
                  return (
                  <div
                    key={ci}
                    className={`subview-layout-cell flex gap-1 flex-wrap ${useFlex ? '' : `${legacyDir} ${legacyClass}`}`}
                    style={{
                      ...(useFlex ? flexStyles : { ...legacyFlex, ...legacyAlign }),
                      ...(cell.padding != null ? paddingToStyle(cell.padding) : { padding: 0 }),
                      boxSizing: 'border-box',
                      ...(cell.showBorder
                        ? {
                            border: resolveColor(cell.backgroundColor)
                              ? '2px solid rgba(242, 242, 242, 0.5)' // white from palette
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
                        setRollOptionModalOpen={strategyId ? setRollOptionModalOpen : undefined}
                        setCloseOptionModalOpen={strategyId ? setCloseOptionModalOpen : undefined}
                        isEditMode={isEditMode}
                      />
                    ))}
                  </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
