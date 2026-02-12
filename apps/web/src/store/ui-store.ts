import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarCollapsed: boolean;
  addStrategyModalOpen: boolean;
  strategySettingsModalOpen: boolean;

  toggleSidebar: () => void;
  setAddStrategyModalOpen: (open: boolean) => void;
  setStrategySettingsModalOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      addStrategyModalOpen: false,
      strategySettingsModalOpen: false,

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setAddStrategyModalOpen: (open) => set({ addStrategyModalOpen: open }),
      setStrategySettingsModalOpen: (open) => set({ strategySettingsModalOpen: open }),
    }),
    { name: 'str-ui', partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }) }
  )
);
