import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SubviewSpec, InputConfig } from '@str/shared';

/* ─── Type definitions (used across frontend) ────── */

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
  templateId?: string;
  spec?: SubviewSpec;
  icon?: string;
  iconColor?: string;
  /** @deprecated Pipeline graph; legacy, replaced by spec */
  pipeline?: PipelineGraph | null;
  inputValues?: Record<string, string | number>;
}

/** Strategy-scoped inputs (shared by all subviews in this strategy) */
export interface StrategyInputConfig {
  id: string;
  title: string;
  type: InputConfig['type'];
  default?: unknown;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
}

/** Resolved transaction for Python context (instrumentSymbol, option, etc.) */
export interface StrategyTransaction {
  id: string | number;
  side: string;
  cashDelta: number;
  timestamp: string;
  instrumentSymbol: string;
  option: { expiration: string; strike: number; callPut: string } | null;
  customData: Record<string, unknown>;
  quantity: number;
  price: number;
}

/** Strategy shape */
export interface Strategy {
  id: string;
  name: string;
  baseCurrency: string;
  icon?: string;
  initialBalance?: number;
  marginAccountEnabled?: boolean;
  collateralEnabled?: boolean;
  loanAmount?: number;
  loanInterest?: number;
  marginRequirement?: number;
  /** @deprecated Computed values */
  buyingPower?: number;
  marginLimit?: number;
  marginAvailable?: number;
  collateralSecurities?: number;
  collateralCash?: number;
  collateralRequirement?: number;
  collateralLimit?: number;
  collateralAvailable?: number;
  inputs?: StrategyInputConfig[];
  inputValues?: Record<string, string | number>;
  transactionsVersion?: number;
  /** @deprecated Transactions are fetched separately via useTransactions() */
  transactions?: StrategyTransaction[];
  subviews: Subview[];
}

/* ─── UI-only Zustand store ─────────────────────── */

interface StrategyUIState {
  activeStrategyId: string | null;
  setActiveStrategy: (id: string | null) => void;
}

export const useStrategyStore = create<StrategyUIState>()(
  persist(
    (set) => ({
      activeStrategyId: null,
      setActiveStrategy: (id) => set({ activeStrategyId: id }),
    }),
    {
      name: 'str-strategies',
      partialize: (s) => ({ activeStrategyId: s.activeStrategyId }),
      merge: (persisted, current) => {
        const p = persisted as { activeStrategyId?: string | null };
        return { ...current, activeStrategyId: p?.activeStrategyId ?? null };
      },
    }
  )
);
