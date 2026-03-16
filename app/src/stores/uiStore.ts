import { create } from 'zustand'

interface UIState {
  activePage: string
  sidebarOpen: boolean
  setActivePage: (page: string) => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>((set) => ({
  activePage: 'dashboard',
  sidebarOpen: true,
  setActivePage: (page) => set({ activePage: page }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))
