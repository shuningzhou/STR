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

/** Minimal strategy shape for Phase 2–3 */
export interface Strategy {
  id: string;
  name: string;
  baseCurrency: string;
  /** Strategy-scoped inputs; subviews reference via global.xxx */
  inputs?: StrategyInputConfig[];
  /** Values for strategy inputs */
  inputValues?: Record<string, string | number>;
  subviews: Subview[];
}

interface StrategyState {
  strategies: Strategy[];
  activeStrategyId: string | null;

  addStrategy: (name: string, baseCurrency: string) => Strategy;
  updateStrategy: (id: string, updates: Partial<Pick<Strategy, 'name' | 'baseCurrency' | 'inputs' | 'inputValues'>>) => void;
  updateStrategyInputValue: (strategyId: string, inputId: string, value: string | number) => void;
  deleteStrategy: (id: string) => void;
  setActiveStrategy: (id: string | null) => void;

  addSubview: (
    strategyId: string,
    options?: { name?: string; defaultSize?: { w: number; h: number }; spec?: SubviewSpec }
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
                    const updates: Partial<Subview> = { spec, name: spec.name, pipeline: undefined };
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
      partialize: (s) => ({ strategies: s.strategies }),
      merge: (persisted, current) => {
        const p = persisted as { strategies?: Strategy[] };
        if (!p?.strategies) return current;
        return {
          ...current,
          strategies: p.strategies.map((st) => ({
            ...st,
            inputs: st.inputs ?? [],
            inputValues: st.inputValues ?? {},
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
