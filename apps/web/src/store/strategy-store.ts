import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Layout } from 'react-grid-layout';

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
  /** Pipeline graph (Phase 5); null = use template default */
  pipeline?: PipelineGraph | null;
  /** Runtime values for pipeline inputs (e.g. filter condition values set by user on canvas) */
  inputValues?: Record<string, string | number>;
}

/** Minimal strategy shape for Phase 2–3 */
export interface Strategy {
  id: string;
  name: string;
  baseCurrency: string;
  subviews: Subview[];
}

interface StrategyState {
  strategies: Strategy[];
  activeStrategyId: string | null;

  addStrategy: (name: string, baseCurrency: string) => Strategy;
  updateStrategy: (id: string, updates: Partial<Pick<Strategy, 'name' | 'baseCurrency'>>) => void;
  deleteStrategy: (id: string) => void;
  setActiveStrategy: (id: string | null) => void;

  addSubview: (
    strategyId: string,
    options?: { name?: string; defaultSize?: { w: number; h: number } }
  ) => Subview;
  updateSubviewLayout: (strategyId: string, layout: Layout) => void;
  removeSubview: (strategyId: string, subviewId: string) => void;
  updateSubviewName: (strategyId: string, subviewId: string, name: string) => void;
  updateSubviewPipeline: (
    strategyId: string,
    subviewId: string,
    pipeline: PipelineGraph | null
  ) => void;
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

      addSubview: (strategyId, options = {}) => {
        const name = options.name ?? 'Subview';
        const defaultSize = options.defaultSize ?? { w: 8, h: 2 };
        const st = get().strategies.find((s) => s.id === strategyId);
        const subviews = st?.subviews ?? [];
        const maxBottom = subviews.length > 0
          ? Math.max(...subviews.map((sv) => sv.position.y + sv.position.h))
          : 0;
        const subview: Subview = {
          id: generateSubviewId(),
          name,
          position: { x: 0, y: maxBottom, w: defaultSize.w, h: defaultSize.h },
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

      updateSubviewLayout: (strategyId, layout) => {
        set((s) => ({
          strategies: s.strategies.map((st) => {
            if (st.id !== strategyId) return st;
            return {
              ...st,
              subviews: st.subviews.map((sv) => {
                const item = layout.find((l) => l.i === sv.id);
                if (!item) return sv;
                return {
                  ...sv,
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
      partialize: (s) => ({ strategies: s.strategies }),
      merge: (persisted, current) => {
        const p = persisted as { strategies?: Strategy[] };
        if (!p?.strategies) return current;
        return {
          ...current,
          strategies: p.strategies.map((st) => ({
            ...st,
            subviews: (st.subviews ?? []).map((sv) => ({
              ...sv,
              pipeline: sv.pipeline ?? null,
              inputValues: sv.inputValues ?? {},
            })),
          })),
        };
      },
    }
  )
);
