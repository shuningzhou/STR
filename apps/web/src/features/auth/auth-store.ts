import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  setToken: (token: string | null) => void;
  clearToken: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      setToken: (token) => set({ accessToken: token }),
      clearToken: () => set({ accessToken: null }),
    }),
    { name: 'str-auth', partialize: (s) => ({ accessToken: s.accessToken }) }
  )
);
