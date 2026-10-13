import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [hasMessages, setHasMessages] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setUnreadNotifications(0);
      setHasMessages(false);
      return;
    }
    try {
      const notifs = await api.listNotifications();
      setUnreadNotifications((notifs || []).filter((n) => !n.read).length);
    } catch {
      // logged in but request failed (e.g. token just expired) — leave badge as-is
    }
    try {
      const messages = await api.listMessages();
      setHasMessages((messages || []).length > 0);
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <NotificationContext.Provider value={{ unreadNotifications, hasMessages, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside <NotificationProvider>");
  return ctx;
}
