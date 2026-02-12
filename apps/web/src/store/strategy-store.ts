import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Minimal strategy shape for Phase 2 (no backend) */
export interface Strategy {
  id: string;
  name: string;
  baseCurrency: string;
}

interface StrategyState {
  strategies: Strategy[];
  activeStrategyId: string | null;

  addStrategy: (name: string, baseCurrency: string) => Strategy;
  updateStrategy: (id: string, updates: Partial<Pick<Strategy, 'name' | 'baseCurrency'>>) => void;
  deleteStrategy: (id: string) => void;
  setActiveStrategy: (id: string | null) => void;
}

function generateId(): string {
  return crypto.randomUUID?.() ?? `s-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
    }),
    {
      name: 'str-strategies',
      partialize: (s) => ({ strategies: s.strategies }),
    }
  )
);
