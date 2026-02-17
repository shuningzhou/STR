import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarCollapsed: boolean;
  canvasEditMode: boolean;
  addStrategyModalOpen: boolean;
  strategySettingsModalOpen: boolean;
  subviewSettingsOpen: { strategyId: string; subviewId: string } | null;
  subviewGalleryModalOpen: boolean;

  toggleSidebar: () => void;
  toggleCanvasEditMode: () => void;
  setAddStrategyModalOpen: (open: boolean) => void;
  setStrategySettingsModalOpen: (open: boolean) => void;
  setSubviewSettingsOpen: (value: { strategyId: string; subviewId: string } | null) => void;
  setSubviewGalleryModalOpen: (open: boolean) => void;
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

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleCanvasEditMode: () => set((s) => ({ canvasEditMode: !s.canvasEditMode })),
      setAddStrategyModalOpen: (open) => set({ addStrategyModalOpen: open }),
      setStrategySettingsModalOpen: (open) => set({ strategySettingsModalOpen: open }),
      setSubviewSettingsOpen: (value) => set({ subviewSettingsOpen: value }),
      setSubviewGalleryModalOpen: (open) => set({ subviewGalleryModalOpen: open }),
    }),
    { name: 'str-ui', partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }) }
  )
);
