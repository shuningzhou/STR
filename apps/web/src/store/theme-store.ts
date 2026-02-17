import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ThemeColors {
  '--color-bg-page': string;
  '--color-bg-card': string;
  '--color-bg-hover': string;
  '--color-active': string;
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
  '--color-bg-page': '#1e1e1e',
  '--color-bg-card': '#2d2d30',
  '--color-bg-hover': '#2a2d2e',
  '--color-active': '#22c55e',
  '--color-border': '#5a5a5c',
  '--color-shadow': 'rgba(0, 0, 0, 0.3)',
  '--color-text-primary': '#e0e0e0',
  '--color-text-secondary': '#bbbbbb',
  '--color-accent': '#6c9dcb',
  '--color-accent-hover': '#5a8aba',
  '--color-positive': '#4caf50',
  '--color-negative': '#f87171',
  '--color-chart-1': '#e0e0e0',
  '--color-chart-2': '#a78bfa',
  '--color-chart-3': '#22d3ee',
  '--color-chart-4': '#fbbf24',
  '--color-chart-5': '#f472b6',
};

const LIGHT_DEFAULTS: ThemeColors = {
  '--color-bg-page': '#f3f3f3',
  '--color-bg-card': '#ffffff',
  '--color-bg-hover': '#e8e8ea',
  '--color-active': '#22c55e',
  '--color-border': '#b8b8b8',
  '--color-shadow': 'rgba(0, 0, 0, 0.08)',
  '--color-text-primary': '#333333',
  '--color-text-secondary': '#666666',
  '--color-accent': '#6c9dcb',
  '--color-accent-hover': '#5a8aba',
  '--color-positive': '#4caf50',
  '--color-negative': '#f87171',
  '--color-chart-1': '#e0e0e0',
  '--color-chart-2': '#a78bfa',
  '--color-chart-3': '#22d3ee',
  '--color-chart-4': '#fbbf24',
  '--color-chart-5': '#f472b6',
};

type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  customColors: Partial<ThemeColors>;
  viewingCurrency: string;

  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
  setCustomColor: (key: keyof ThemeColors, value: string) => void;
  resetColor: (key: keyof ThemeColors) => void;
  resetAllColors: () => void;
  setViewingCurrency: (currency: string) => void;
  getDefaults: () => ThemeColors;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'dark',
      customColors: {},
      viewingCurrency: 'USD',

      toggleMode: () => {
        const newMode = get().mode === 'dark' ? 'light' : 'dark';
        set({ mode: newMode });
        applyTheme(newMode, get().customColors);
      },

      setMode: (mode) => {
        set({ mode });
        applyTheme(mode, get().customColors);
      },

      setCustomColor: (key, value) => {
        const customColors = { ...get().customColors, [key]: value };
        set({ customColors });
        applyTheme(get().mode, customColors);
      },

      resetColor: (key) => {
        const customColors = { ...get().customColors };
        delete customColors[key];
        set({ customColors });
        applyTheme(get().mode, customColors);
      },

      resetAllColors: () => {
        set({ customColors: {} });
        applyTheme(get().mode, {});
      },

      setViewingCurrency: (currency) => set({ viewingCurrency: currency }),

      getDefaults: () =>
        get().mode === 'dark' ? { ...DARK_DEFAULTS } : { ...LIGHT_DEFAULTS },
    }),
    { name: 'str-theme' }
  )
);

/** Apply theme: CSS class + custom color overrides */
export function applyTheme(mode: ThemeMode, customColors: Partial<ThemeColors>) {
  const root = document.documentElement;
  root.classList.toggle('light', mode === 'light');
  const defaults = mode === 'dark' ? DARK_DEFAULTS : LIGHT_DEFAULTS;
  const merged = { ...defaults, ...customColors };
  for (const [key, value] of Object.entries(merged)) {
    root.style.setProperty(key, value);
  }
}

/** Initialize theme on app load */
export function initializeTheme() {
  const state = useThemeStore.getState();
  applyTheme(state.mode, state.customColors);
}
