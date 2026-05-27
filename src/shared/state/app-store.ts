'use client';

import { create } from 'zustand';

type NavigationSurface = 'mobile' | 'desktop';

type AppState = {
  navigationSurface: NavigationSurface;
  sidebarOpen: boolean;
  setNavigationSurface: (surface: NavigationSurface) => void;
  setSidebarOpen: (open: boolean) => void;
};

export const useAppStore = create<AppState>((set) => ({
  navigationSurface: 'desktop',
  sidebarOpen: false,
  setNavigationSurface: (surface) => set({ navigationSurface: surface }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
