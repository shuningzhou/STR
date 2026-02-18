import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Layout } from 'react-grid-layout';
import type { SubviewSpec, InputConfig } from '@str/shared';
import { pixelsToGrid, gridToPixels, REFERENCE_WIDTH } from '@/features/canvas/canvas-grid-config';

/** Subview position for grid layout */
export interface SubviewPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Pipeline graph from React Flow (nodes, edges, viewport) */
export interface PipelineGraph {
  nodes: Array<{ id: string; type: string; position: { x: number; y: number }; data?: unknown }>;
  edges: Array<{ id: string; source: string; target: string }>;
  viewport?: { x: number; y: number; zoom: number };
}

/** Subview in a strategy */
export interface Subview {
  id: string;
  name: string;
  position: SubviewPosition;
  /** Template id when added from gallery; used to resolve latest spec from templates */
  templateId?: string;
  /** JSON+Python spec (Phase 5+); when present, takes precedence over pipeline */
  spec?: SubviewSpec;
  /** @deprecated Pipeline graph; legacy, replaced by spec */
  pipeline?: PipelineGraph | null;
  /** Runtime values for inputs (from spec.inputs or legacy pipeline) */
  inputValues?: Record<string, string | number>;
}

/** Strategy-scoped inputs (shared by all subviews in this strategy) */
export interface StrategyInputConfig {
  id: string; // unique key (e.g. "timeRange")
  title: string; // display label
  type: InputConfig['type'];
  default?: unknown;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
}

/** Resolved transaction for Python context (instrumentSymbol, option, etc.) */
export interface StrategyTransaction {
  id: number;
  side: string;
  cashDelta: number;
  timestamp: string;
  instrumentSymbol: string;
  option: { expiration: string; strike: number; callPut: string } | null;
  optionRoll?: { option: { expiration: string; strike: number; callPut: string }; optionRolledTo: { expiration: string; strike: number; callPut: string } };
  customData: Record<string, unknown>;
  quantity: number;
  price: number;
}

/** Minimal strategy shape for Phase 2–3 */
export interface Strategy {
  id: string;
  name: string;
  baseCurrency: string;
  /** Starting cash balance for non-margin account */
  initialBalance?: number;
  /** Enable margin account (allows borrowing to trade) */
  marginAccountEnabled?: boolean;
  /** Enable collateral (use positions as collateral for margin) */
  collateralEnabled?: boolean;
  /** Wallet metrics (displayed in Wallet modal) */
  loanAmount?: number;
  /** Loan interest rate (percentage, e.g. 5 for 5%) */
  loanInterest?: number;
  /** Margin requirement (percentage, e.g. 25 for 25%) */
  marginRequirement?: number;
  /** @deprecated Computed: marginAvailable / (marginRequirement / 100) */
  buyingPower?: number;
  /** @deprecated Computed: equity * (marginRequirement / 100) */
  marginLimit?: number;
  /** @deprecated Computed: collateralAvailable + equity + balance - loan - marginLimit */
  marginAvailable?: number;
  collateralAmount?: number;
  /** Collateral requirement (percentage, e.g. 30 for 30%) */
  collateralRequirement?: number;
  /** @deprecated Computed: collateralAmount * (collateralRequirement / 100) */
  collateralLimit?: number;
  /** @deprecated Computed: collateralAmount - collateralLimit */
  collateralAvailable?: number;
  /** Strategy-scoped inputs; subviews reference via global.xxx */
  inputs?: StrategyInputConfig[];
  /** Values for strategy inputs */
  inputValues?: Record<string, string | number>;
  /** Resolved transactions for Python subviews (from API or mock) */
  transactions?: StrategyTransaction[];
  subviews: Subview[];
}

interface StrategyState {
  strategies: Strategy[];
  activeStrategyId: string | null;

  addStrategy: (name: string, baseCurrency: string) => Strategy;
  updateStrategy: (id: string, updates: Partial<Pick<Strategy, 'name' | 'baseCurrency' | 'initialBalance' | 'marginAccountEnabled' | 'collateralEnabled' | 'loanAmount' | 'loanInterest' | 'marginRequirement' | 'collateralAmount' | 'collateralRequirement' | 'inputs' | 'inputValues' | 'transactions'>>) => void;
  addTransaction: (strategyId: string, transaction: Omit<StrategyTransaction, 'id'>) => StrategyTransaction;
  updateTransaction: (strategyId: string, transactionId: number, updates: Partial<Omit<StrategyTransaction, 'id'>>) => void;
  removeTransaction: (strategyId: string, transactionId: number) => void;
  updateStrategyInputValue: (strategyId: string, inputId: string, value: string | number) => void;
  deleteStrategy: (id: string) => void;
  setActiveStrategy: (id: string | null) => void;

  addSubview: (
    strategyId: string,
    options?: { name?: string; defaultSize?: { w: number; h: number }; spec?: SubviewSpec; templateId?: string }
  ) => Subview;
  updateSubviewLayout: (strategyId: string, layout: Layout, containerWidth: number) => void;
  removeSubview: (strategyId: string, subviewId: string) => void;
  updateSubviewName: (strategyId: string, subviewId: string, name: string) => void;
  updateSubviewPipeline: (
    strategyId: string,
    subviewId: string,
    pipeline: PipelineGraph | null
  ) => void;
  updateSubviewSpec: (strategyId: string, subviewId: string, spec: SubviewSpec) => void;
  updateSubviewInputValue: (
    strategyId: string,
    subviewId: string,
    inputKey: string,
    value: string | number
  ) => void;
}

function generateId(): string {
  return crypto.randomUUID?.() ?? `s-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function generateSubviewId(): string {
  return crypto.randomUUID?.() ?? `v-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useStrategyStore = create<StrategyState>()(
  persist(
    (set, get) => ({
      strategies: [],
      activeStrategyId: null,

      addStrategy: (name, baseCurrency) => {
        const strategy: Strategy = {
          id: generateId(),
          name,
          baseCurrency,
          transactions: [],
          subviews: [],
        };
        set((s) => ({
          strategies: [...s.strategies, strategy],
          activeStrategyId: strategy.id,
        }));
        return strategy;
      },

      updateStrategy: (id, updates) => {
        set((s) => ({
          strategies: s.strategies.map((st) =>
            st.id === id ? { ...st, ...updates } : st
          ),
        }));
      },

      updateStrategyInputValue: (strategyId, inputId, value) => {
        set((s) => ({
          strategies: s.strategies.map((st) => {
            if (st.id !== strategyId) return st;
            const next = { ...(st.inputValues ?? {}), [inputId]: value };
            return { ...st, inputValues: next };
          }),
        }));
      },

      deleteStrategy: (id) => {
        const { strategies, activeStrategyId } = get();
        const idx = strategies.findIndex((s) => s.id === id);
        const nextActive =
          activeStrategyId === id
            ? strategies[idx - 1]?.id ?? strategies[idx + 1]?.id ?? null
            : activeStrategyId;
        set({
          strategies: strategies.filter((s) => s.id !== id),
          activeStrategyId: nextActive,
        });
      },

      setActiveStrategy: (id) => set({ activeStrategyId: id }),

      addTransaction: (strategyId, tx) => {
        const st = get().strategies.find((s) => s.id === strategyId);
        if (!st) {
          throw new Error(`Strategy not found: ${strategyId}. Available: ${get().strategies.map((s) => s.id).join(', ') || 'none'}`);
        }
        const existing = st.transactions ?? [];
        const maxId = existing.length > 0 ? Math.max(...existing.map((t) => t.id)) : 0;
        const newTx: StrategyTransaction = {
          ...tx,
          id: maxId + 1,
          option: tx.option ?? null,
        };
        const nextTxs = [...(st.transactions ?? []), newTx];
        set((s) => ({
          strategies: s.strategies.map((st) => {
            if (st.id !== strategyId) return st;
            const updated = { ...st, transactions: nextTxs };
            if (st.marginAccountEnabled) {
              const balance =
                (st.initialBalance ?? 0) +
                nextTxs.reduce((sum, t) => sum + ((t as { cashDelta?: number }).cashDelta ?? 0), 0);
              updated.loanAmount = Math.max(0, -balance);
            }
            return updated;
          }),
        }));
        return newTx;
      },

      updateTransaction: (strategyId, transactionId, updates) => {
        set((s) => {
          const nextStrategies = s.strategies.map((st) => {
            if (st.id !== strategyId) return st;
            const txs = st.transactions ?? [];
            const idx = txs.findIndex((t) => t.id === transactionId);
            if (idx < 0) return st;
            const next = [...txs];
            next[idx] = { ...next[idx], ...updates };
            const updated = { ...st, transactions: next };
            if (st.marginAccountEnabled) {
              const balance =
                (st.initialBalance ?? 0) +
                next.reduce((sum, tx) => sum + ((tx as { cashDelta?: number }).cashDelta ?? 0), 0);
              updated.loanAmount = Math.max(0, -balance);
            }
            return updated;
          });
          return { strategies: nextStrategies };
        });
      },

      removeTransaction: (strategyId, transactionId) => {
        set((s) => {
          const nextStrategies = s.strategies.map((st) => {
            if (st.id !== strategyId) return st;
            const next = (st.transactions ?? []).filter((t) => t.id !== transactionId);
            const updated = { ...st, transactions: next };
            if (st.marginAccountEnabled) {
              const balance =
                (st.initialBalance ?? 0) +
                next.reduce((sum, tx) => sum + ((tx as { cashDelta?: number }).cashDelta ?? 0), 0);
              updated.loanAmount = Math.max(0, -balance);
            }
            return updated;
          });
          return { strategies: nextStrategies };
        });
      },

      addSubview: (strategyId, options = {}) => {
        const name = options.name ?? options.spec?.name ?? 'Subview';
        let pixelSize: { w: number; h: number } | undefined = options.defaultSize;
        if (!pixelSize && options.spec) {
          const spec = options.spec as {
            preferredSize?: { w: number; h: number };
            defaultSize?: { w: number; h: number } | string;
            size?: string;
          };
          if (spec.preferredSize) {
            pixelSize = spec.preferredSize;
          } else if (spec.defaultSize != null) {
            const ds = spec.defaultSize;
            pixelSize =
              typeof ds === 'object'
                ? ds
                : (() => {
                    const m = String(ds).match(/^(\d+)x(\d+)$/);
                    return m ? { w: parseInt(m[1], 10) * 25, h: parseInt(m[2], 10) * 20 } : { w: 400, h: 100 };
                  })();
          } else if (spec.size) {
            const m = String(spec.size).match(/^(\d+)x(\d+)$/);
            pixelSize = m ? { w: parseInt(m[1], 10) * 25, h: parseInt(m[2], 10) * 20 } : { w: 400, h: 100 };
          } else {
            pixelSize = { w: 400, h: 100 };
          }
        }
        pixelSize ??= { w: 400, h: 100 };
        const gridSize = pixelsToGrid(pixelSize.w, pixelSize.h);
        const st = get().strategies.find((s) => s.id === strategyId);
        const subviews = st?.subviews ?? [];
        const maxBottom = subviews.length > 0
          ? Math.max(...subviews.map((sv) => sv.position.y + sv.position.h))
          : 0;
        const subview: Subview = {
          id: generateSubviewId(),
          name,
          position: { x: 0, y: maxBottom, w: gridSize.w, h: gridSize.h },
          ...(options.templateId && { templateId: options.templateId }),
          ...(options.spec && { spec: options.spec }),
        };
        set((s) => ({
          strategies: s.strategies.map((st) =>
            st.id === strategyId
              ? { ...st, subviews: [...st.subviews, subview] }
              : st
          ),
        }));
        return subview;
      },

      updateSubviewLayout: (strategyId, layout, containerWidth) => {
        set((s) => ({
          strategies: s.strategies.map((st) => {
            if (st.id !== strategyId) return st;
            return {
              ...st,
              subviews: st.subviews.map((sv) => {
                const item = layout.find((l) => l.i === sv.id);
                if (!item) return sv;
                const pixelSize = gridToPixels(item.w, item.h, containerWidth);
                const updatedSpec =
                  sv.spec != null
                    ? { ...sv.spec, preferredSize: pixelSize }
                    : undefined;
                return {
                  ...sv,
                  ...(updatedSpec && { spec: updatedSpec }),
                  position: {
                    x: item.x,
                    y: item.y,
                    w: item.w,
                    h: item.h,
                  },
                };
              }),
            };
          }),
        }));
      },

      removeSubview: (strategyId, subviewId) => {
        set((s) => ({
          strategies: s.strategies.map((st) =>
            st.id === strategyId
              ? { ...st, subviews: st.subviews.filter((sv) => sv.id !== subviewId) }
              : st
          ),
        }));
      },

      updateSubviewName: (strategyId, subviewId, name) => {
        set((s) => ({
          strategies: s.strategies.map((st) =>
            st.id === strategyId
              ? {
                  ...st,
                  subviews: st.subviews.map((sv) =>
                    sv.id === subviewId ? { ...sv, name } : sv
                  ),
                }
              : st
          ),
        }));
      },

      updateSubviewPipeline: (strategyId, subviewId, pipeline) => {
        set((s) => ({
          strategies: s.strategies.map((st) =>
            st.id === strategyId
              ? {
                  ...st,
                  subviews: st.subviews.map((sv) =>
                    sv.id === subviewId ? { ...sv, pipeline } : sv
                  ),
                }
              : st
          ),
        }));
      },

      updateSubviewSpec: (strategyId, subviewId, spec) => {
        set((s) => ({
          strategies: s.strategies.map((st) =>
            st.id === strategyId
              ? {
                  ...st,
                  subviews: st.subviews.map((sv) => {
                    if (sv.id !== subviewId) return sv;
                    const updates: Partial<Subview> = { spec, name: spec.name, pipeline: undefined, templateId: undefined };
                    if (spec.preferredSize) {
                      const { w, h } = pixelsToGrid(spec.preferredSize.w, spec.preferredSize.h, REFERENCE_WIDTH);
                      updates.position = { ...sv.position, w, h };
                    }
                    return { ...sv, ...updates };
                  }),
                }
              : st
          ),
        }));
      },

      updateSubviewInputValue: (strategyId, subviewId, inputKey, value) => {
        set((s) => ({
          strategies: s.strategies.map((st) =>
            st.id === strategyId
              ? {
                  ...st,
                  subviews: st.subviews.map((sv) => {
                    if (sv.id !== subviewId) return sv;
                    const next = { ...(sv.inputValues ?? {}), [inputKey]: value };
                    return { ...sv, inputValues: next };
                  }),
                }
              : st
          ),
        }));
      },
    }),
    {
      name: 'str-strategies',
      partialize: (s) => ({
        strategies: s.strategies,
        activeStrategyId: s.activeStrategyId,
      }),
      merge: (persisted, current) => {
        const p = persisted as { strategies?: Strategy[]; activeStrategyId?: string | null };
        if (!p?.strategies) return current;
        const strategies = p.strategies.map((st) => ({
          ...st,
          inputs: st.inputs ?? [],
          inputValues: st.inputValues ?? {},
          transactions: st.transactions ?? [],
          subviews: (st.subviews ?? []).map((sv) => ({
            ...sv,
            pipeline: sv.pipeline ?? null,
            inputValues: sv.inputValues ?? {},
          })),
        }));
        // Restore activeStrategyId, or default to first strategy if we have strategies but none selected
        const activeStrategyId =
          p.activeStrategyId != null && strategies.some((s) => s.id === p.activeStrategyId)
            ? p.activeStrategyId
            : strategies[0]?.id ?? null;
        return {
          ...current,
          strategies,
          activeStrategyId,
        };
      },
    }
  )
);
