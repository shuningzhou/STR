import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ThemeColors {
  '--color-bg-page': string;
  '--color-bg-card': string;
  '--color-bg-hover': string;
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

const LIGHT_DEFAULTS: ThemeColors = {
  '--color-bg-page': '#f5f5f7',
  '--color-bg-card': '#ffffff',
  '--color-bg-hover': '#86efac',
  '--color-border': '#e5e5e7',
  '--color-shadow': 'rgba(0, 0, 0, 0.06)',
  '--color-text-primary': '#333333',
  '--color-text-secondary': '#888888',
  '--color-accent': '#1a1a1a',
  '--color-accent-hover': '#333333',
  '--color-positive': '#4caf50',
  '--color-negative': '#ff6b6b',
  '--color-chart-1': '#1a1a1a',
  '--color-chart-2': '#6366f1',
  '--color-chart-3': '#06b6d4',
  '--color-chart-4': '#f59e0b',
  '--color-chart-5': '#ec4899',
};

const DARK_DEFAULTS: ThemeColors = {
  '--color-bg-page': '#111111',
  '--color-bg-card': '#1c1c1c',
  '--color-bg-hover': 'rgba(34, 197, 94, 0.4)',
  '--color-border': '#2a2a2a',
  '--color-shadow': 'rgba(0, 0, 0, 0.3)',
  '--color-text-primary': '#f0f0f0',
  '--color-text-secondary': '#888888',
  '--color-accent': '#f0f0f0',
  '--color-accent-hover': '#cccccc',
  '--color-positive': '#4ade80',
  '--color-negative': '#f87171',
  '--color-chart-1': '#f0f0f0',
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

  // Actions
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
      mode: 'light',
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

      getDefaults: () => {
        return get().mode === 'dark' ? { ...DARK_DEFAULTS } : { ...LIGHT_DEFAULTS };
      },
    }),
    {
      name: 'str-theme',
    }
  )
);

/** Apply theme to the DOM */
export function applyTheme(mode: ThemeMode, customColors: Partial<ThemeColors>) {
  const root = document.documentElement;

  // Toggle dark class
  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Apply custom color overrides
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
