import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BRANDING_GREEN, BRANDING_GREEN_HOVER, BUILT_IN_COLORS } from '@/features/subviews/SubviewSpecRenderer';

export interface ThemeColors {
  '--color-bg-page': string;
  '--color-bg-card': string;
  '--color-bg-hover': string;
  '--color-active': string;
  '--color-bg-primary': string;
  '--color-bg-primary-hover': string;
  '--color-border': string;
  '--color-shadow': string;
  '--color-text-primary': string;
  '--color-text-secondary': string;
  '--color-accent': string;
  '--color-accent-hover': string;
  '--color-positive': string;
  '--color-negative': string;
  '--color-chart-1': string;
  '--color-chart-2': string;
  '--color-chart-3': string;
  '--color-chart-4': string;
  '--color-chart-5': string;
}

const DARK_DEFAULTS: ThemeColors = {
  '--color-bg-page': BUILT_IN_COLORS['black'],
  '--color-bg-card': BUILT_IN_COLORS['grey-4'],
  '--color-bg-hover': BUILT_IN_COLORS['grey-4'],
  '--color-active': BRANDING_GREEN,
  '--color-bg-primary': BRANDING_GREEN,
  '--color-bg-primary-hover': BRANDING_GREEN_HOVER,
  '--color-border': BUILT_IN_COLORS['grey-4'],
  '--color-shadow': 'rgba(19, 19, 19, 0.3)', // black with alpha
  '--color-text-primary': BUILT_IN_COLORS['white'],
  '--color-text-secondary': BUILT_IN_COLORS['grey-0'],
  '--color-accent': BUILT_IN_COLORS['blue-1'],
  '--color-accent-hover': BUILT_IN_COLORS['blue-3'],
  '--color-positive': BRANDING_GREEN,
  '--color-negative': BUILT_IN_COLORS['red-1'],
  '--color-chart-1': BUILT_IN_COLORS['offwhite-0'],
  '--color-chart-2': BUILT_IN_COLORS['violet-1'],
  '--color-chart-3': BUILT_IN_COLORS['cyan-2'],
  '--color-chart-4': BUILT_IN_COLORS['yellow-2'],
  '--color-chart-5': BUILT_IN_COLORS['magenta-1'],
};

interface ThemeState {
  customColors: Partial<ThemeColors>;
  viewingCurrency: string;

  setCustomColor: (key: keyof ThemeColors, value: string) => void;
  resetColor: (key: keyof ThemeColors) => void;
  resetAllColors: () => void;
  setViewingCurrency: (currency: string) => void;
  getDefaults: () => ThemeColors;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      customColors: {},
      viewingCurrency: 'USD',

      setCustomColor: (key, value) => {
        const customColors = { ...get().customColors, [key]: value };
        set({ customColors });
        applyTheme(get().customColors);
      },

      resetColor: (key) => {
        const customColors = { ...get().customColors };
        delete customColors[key];
        set({ customColors });
        applyTheme(customColors);
      },

      resetAllColors: () => {
        set({ customColors: {} });
        applyTheme({});
      },

      setViewingCurrency: (currency) => set({ viewingCurrency: currency }),

      getDefaults: () => ({ ...DARK_DEFAULTS }),
    }),
    {
      name: 'str-theme',
      partialize: (s) => ({ customColors: s.customColors, viewingCurrency: s.viewingCurrency }),
    }
  )
);

/** Apply theme: dark mode only, with optional custom color overrides */
export function applyTheme(customColors: Partial<ThemeColors> = {}) {
  const root = document.documentElement;
  root.classList.remove('light');
  const merged = { ...DARK_DEFAULTS, ...customColors };
  for (const [key, value] of Object.entries(merged)) {
    root.style.setProperty(key, value);
  }
}

/** Initialize theme on app load */
export function initializeTheme() {
  const state = useThemeStore.getState();
  applyTheme(state.customColors);
}
