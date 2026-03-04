import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StrategyTransaction } from '@/store/strategy-store';

export type AddTransactionModalMode = 'full' | 'stock-etf' | 'option' | 'option-buy' | 'dividend' | 'vertical-spread';

interface UIState {
  sidebarCollapsed: boolean;
  canvasEditMode: boolean;
  addStrategyModalOpen: boolean;
  strategySettingsModalOpen: boolean;
  subviewSettingsOpen: { strategyId: string; subviewId: string } | null;
  subviewGalleryModalOpen: boolean;
  /** When open: { strategyId, mode }. mode: 'full' = toolbar (all transactions), 'stock-etf' = subview (stocks/ETFs only) */
  addTransactionModalOpen: { strategyId: string; mode: AddTransactionModalMode } | null;
  /** When open: { strategyId, transaction, mode? }. mode: 'stock-etf' = simple, 'option' = option, 'dividend' = dividend, 'full' = full */
  editTransactionModalOpen: {
    strategyId: string;
    transaction: StrategyTransaction;
    mode?: 'stock-etf' | 'option' | 'dividend' | 'full';
  } | null;
  /** When open: { strategyId, mode: 'deposit' | 'withdraw' } for wallet deposit/withdraw */
  depositWithdrawModalOpen: { strategyId: string; mode: 'deposit' | 'withdraw' } | null;
  /** When open: strategyId for wallet settings modal */
  walletSettingsModalOpen: string | null;
  /** When open: strategyId for the transaction list slide-out panel */
  transactionListPanelOpen: string | null;
  /** When open: { strategyId, transaction } or { strategyId, transactions } for delete confirmation modal */
  deleteTransactionConfirmOpen:
    | { strategyId: string; transaction: StrategyTransaction; transactions?: never }
    | { strategyId: string; transaction?: never; transactions: StrategyTransaction[] }
    | null;
  /** When open: { strategyId, transaction } for roll option modal */
  rollOptionModalOpen: { strategyId: string; transaction: StrategyTransaction } | null;
  /** When open: { strategyId, transaction } for close option modal (partial close supported) */
  closeOptionModalOpen: { strategyId: string; transaction: StrategyTransaction } | null;
  /** When open: { strategyId, transaction } for assign option modal */
  assignOptionModalOpen: { strategyId: string; transaction: StrategyTransaction } | null;
  /** When open: { strategyId, legs } for close spread modal (both legs) */
  closeSpreadModalOpen: { strategyId: string; legs: StrategyTransaction[] } | null;
  /** When open: { strategyId, legs } for edit spread modal */
  editSpreadModalOpen: { strategyId: string; legs: StrategyTransaction[] } | null;
  /** User account modal (logout etc.) */
  userModalOpen: boolean;
  /** Admin settings modal (super admin only) */
  adminSettingsModalOpen: boolean;
  /** Measured canvas grid width so preview can match */
  canvasWidth: number;

  toggleSidebar: () => void;
  toggleCanvasEditMode: () => void;
  setAddStrategyModalOpen: (open: boolean) => void;
  setStrategySettingsModalOpen: (open: boolean) => void;
  setSubviewSettingsOpen: (value: { strategyId: string; subviewId: string } | null) => void;
  setSubviewGalleryModalOpen: (open: boolean) => void;
  setAddTransactionModalOpen: (value: { strategyId: string; mode: AddTransactionModalMode } | null) => void;
  setEditTransactionModalOpen: (value: {
    strategyId: string;
    transaction: StrategyTransaction;
    mode?: 'stock-etf' | 'option' | 'dividend' | 'full';
  } | null) => void;
  setDepositWithdrawModalOpen: (value: { strategyId: string; mode: 'deposit' | 'withdraw' } | null) => void;
  setWalletSettingsModalOpen: (value: string | null) => void;
  setTransactionListPanelOpen: (value: string | null) => void;
  setDeleteTransactionConfirmOpen: (
    value:
      | { strategyId: string; transaction: StrategyTransaction; transactions?: never }
      | { strategyId: string; transaction?: never; transactions: StrategyTransaction[] }
      | null
  ) => void;
  setRollOptionModalOpen: (value: { strategyId: string; transaction: StrategyTransaction } | null) => void;
  setCloseOptionModalOpen: (value: { strategyId: string; transaction: StrategyTransaction } | null) => void;
  setAssignOptionModalOpen: (value: { strategyId: string; transaction: StrategyTransaction } | null) => void;
  setCloseSpreadModalOpen: (value: { strategyId: string; legs: StrategyTransaction[] } | null) => void;
  setEditSpreadModalOpen: (value: { strategyId: string; legs: StrategyTransaction[] } | null) => void;
  setUserModalOpen: (open: boolean) => void;
  setAdminSettingsModalOpen: (open: boolean) => void;
  setCanvasWidth: (width: number) => void;
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
      walletSettingsModalOpen: null,
      transactionListPanelOpen: null,
      deleteTransactionConfirmOpen: null,
      rollOptionModalOpen: null,
      closeOptionModalOpen: null,
      assignOptionModalOpen: null,
      closeSpreadModalOpen: null,
      editSpreadModalOpen: null,
      userModalOpen: false,
      adminSettingsModalOpen: false,
      canvasWidth: 0,

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleCanvasEditMode: () => set((s) => ({ canvasEditMode: !s.canvasEditMode })),
      setAddStrategyModalOpen: (open) => set({ addStrategyModalOpen: open }),
      setStrategySettingsModalOpen: (open) => set({ strategySettingsModalOpen: open }),
      setSubviewSettingsOpen: (value) => set({ subviewSettingsOpen: value }),
      setSubviewGalleryModalOpen: (open) => set({ subviewGalleryModalOpen: open }),
      setAddTransactionModalOpen: (value) => set({ addTransactionModalOpen: value }),
      setEditTransactionModalOpen: (value) => set({ editTransactionModalOpen: value }),
      setDepositWithdrawModalOpen: (value) => set({ depositWithdrawModalOpen: value }),
      setWalletSettingsModalOpen: (value) => set({ walletSettingsModalOpen: value }),
      setTransactionListPanelOpen: (value) => set({ transactionListPanelOpen: value }),
      setDeleteTransactionConfirmOpen: (value) => set({ deleteTransactionConfirmOpen: value }),
      setRollOptionModalOpen: (value) => set({ rollOptionModalOpen: value }),
      setCloseOptionModalOpen: (value) => set({ closeOptionModalOpen: value }),
      setAssignOptionModalOpen: (value) => set({ assignOptionModalOpen: value }),
      setCloseSpreadModalOpen: (value) => set({ closeSpreadModalOpen: value }),
      setEditSpreadModalOpen: (value) => set({ editSpreadModalOpen: value }),
      setUserModalOpen: (open) => set({ userModalOpen: open }),
      setAdminSettingsModalOpen: (open) => set({ adminSettingsModalOpen: open }),
      setCanvasWidth: (width) => set({ canvasWidth: width }),
    }),
    { name: 'str-ui', partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }) }
  )
);
