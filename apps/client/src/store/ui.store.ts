import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  
  notificationOpen: boolean;
  toggleNotifications: () => void;
  setNotificationOpen: (isOpen: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (isOpen: boolean) => set({ sidebarOpen: isOpen }),

  notificationOpen: false,
  toggleNotifications: () => set((state) => ({ notificationOpen: !state.notificationOpen })),
  setNotificationOpen: (isOpen: boolean) => set({ notificationOpen: isOpen }),
}));
