import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StrategyTransaction } from '@/store/strategy-store';

export type AddTransactionModalMode = 'full' | 'stock-etf';

interface UIState {
  sidebarCollapsed: boolean;
  canvasEditMode: boolean;
  addStrategyModalOpen: boolean;
  strategySettingsModalOpen: boolean;
  subviewSettingsOpen: { strategyId: string; subviewId: string } | null;
  subviewGalleryModalOpen: boolean;
  /** When open: { strategyId, mode }. mode: 'full' = toolbar (all transactions), 'stock-etf' = subview (stocks/ETFs only) */
  addTransactionModalOpen: { strategyId: string; mode: AddTransactionModalMode } | null;
  /** When open: { strategyId, transaction } for editing */
  editTransactionModalOpen: { strategyId: string; transaction: StrategyTransaction } | null;
  /** When open: { strategyId, mode: 'deposit' | 'withdraw' } for wallet */
  depositWithdrawModalOpen: { strategyId: string; mode: 'deposit' | 'withdraw' } | null;
  /** When open: strategyId for the transaction list slide-out panel */
  transactionListPanelOpen: string | null;

  toggleSidebar: () => void;
  toggleCanvasEditMode: () => void;
  setAddStrategyModalOpen: (open: boolean) => void;
  setStrategySettingsModalOpen: (open: boolean) => void;
  setSubviewSettingsOpen: (value: { strategyId: string; subviewId: string } | null) => void;
  setSubviewGalleryModalOpen: (open: boolean) => void;
  setAddTransactionModalOpen: (value: { strategyId: string; mode: AddTransactionModalMode } | null) => void;
  setEditTransactionModalOpen: (value: { strategyId: string; transaction: StrategyTransaction } | null) => void;
  setDepositWithdrawModalOpen: (value: { strategyId: string; mode: 'deposit' | 'withdraw' } | null) => void;
  setTransactionListPanelOpen: (value: string | null) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      canvasEditMode: true,
      addStrategyModalOpen: false,
      strategySettingsModalOpen: false,
      subviewSettingsOpen: null,
      subviewGalleryModalOpen: false,
      addTransactionModalOpen: null,
      editTransactionModalOpen: null,
      depositWithdrawModalOpen: null,
      transactionListPanelOpen: null,

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleCanvasEditMode: () => set((s) => ({ canvasEditMode: !s.canvasEditMode })),
      setAddStrategyModalOpen: (open) => set({ addStrategyModalOpen: open }),
      setStrategySettingsModalOpen: (open) => set({ strategySettingsModalOpen: open }),
      setSubviewSettingsOpen: (value) => set({ subviewSettingsOpen: value }),
      setSubviewGalleryModalOpen: (open) => set({ subviewGalleryModalOpen: open }),
      setAddTransactionModalOpen: (value) => set({ addTransactionModalOpen: value }),
      setEditTransactionModalOpen: (value) => set({ editTransactionModalOpen: value }),
      setDepositWithdrawModalOpen: (value) => set({ depositWithdrawModalOpen: value }),
      setTransactionListPanelOpen: (value) => set({ transactionListPanelOpen: value }),
    }),
    { name: 'str-ui', partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }) }
  )
);
