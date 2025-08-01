import { mmkvStorage } from "@/lib/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface NotificationThreshold {
  id: string;
  type: "above" | "below";
  price: number;
  enabled: boolean;
}

interface NotificationState {
  notifications: NotificationThreshold[];
  isNotificationsEnabled: boolean;

  setNotificationsEnabled: (enabled: boolean) => void;
  addNotification: (threshold: Omit<NotificationThreshold, "id">) => void;
  updateNotification: (id: string, updates: Partial<NotificationThreshold>) => void;
  removeNotification: (id: string) => void;
  toggleNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      isNotificationsEnabled: false,

      setNotificationsEnabled: (enabled: boolean) => {
        set({ isNotificationsEnabled: enabled });
      },

      addNotification: (threshold: Omit<NotificationThreshold, "id">) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        set((state) => ({
          notifications: [...state.notifications, { ...threshold, id }],
        }));
      },

      updateNotification: (id: string, updates: Partial<NotificationThreshold>) => {
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === id ? { ...notification, ...updates } : notification
          ),
        }));
      },

      removeNotification: (id: string) => {
        set((state) => ({
          notifications: state.notifications.filter((notification) => notification.id !== id),
        }));
      },

      toggleNotification: (id: string) => {
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === id
              ? { ...notification, enabled: !notification.enabled }
              : notification
          ),
        }));
      },
    }),
    {
      name: "notification-store",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
