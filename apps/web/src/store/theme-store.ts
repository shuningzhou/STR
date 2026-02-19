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
  '--color-bg-card': '#262626',
  '--color-bg-hover': '#3d3d3d',
  '--color-active': BRANDING_GREEN,
  '--color-bg-primary': BRANDING_GREEN,
  '--color-bg-primary-hover': BRANDING_GREEN_HOVER,
  '--color-border': BUILT_IN_COLORS['grey-4'],
  '--color-shadow': 'rgba(0, 0, 0, 0.3)',
  '--color-text-primary': '#f2f2f2',
  '--color-text-secondary': '#c8c8c8',
  '--color-accent': '#6c9dcb',
  '--color-accent-hover': '#5a8aba',
  '--color-positive': BRANDING_GREEN,
  '--color-negative': '#f87171',
  '--color-chart-1': '#e0e0e0',
  '--color-chart-2': '#a78bfa',
  '--color-chart-3': '#22d3ee',
  '--color-chart-4': '#fbbf24',
  '--color-chart-5': '#f472b6',
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
