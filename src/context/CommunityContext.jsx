import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "./AuthContext";

const CommunityContext = createContext(null);

export function CommunityProvider({ children }) {
  const { user } = useAuth();
  const [joined, setJoined] = useState([]);
  const [pendingIds, setPendingIds] = useState([]); // komunitas yang menunggu persetujuan

  const refresh = useCallback(async () => {
    if (!user) {
      setJoined([]);
      setPendingIds([]);
      return;
    }
    try {
      const [j, p] = await Promise.all([api.listJoinedCommunities(), api.listMyJoinRequests()]);
      setJoined(j || []);
      setPendingIds(p || []);
    } catch {
      // diam saja; sidebar cuma tidak menampilkan daftar
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <CommunityContext.Provider value={{ joined, pendingIds, refresh }}>{children}</CommunityContext.Provider>;
}

export function useCommunities() {
  const ctx = useContext(CommunityContext);
  if (!ctx) throw new Error("useCommunities must be used inside <CommunityProvider>");
  return ctx;
}