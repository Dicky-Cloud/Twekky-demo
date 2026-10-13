import { createContext, useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isMobileViewport } from "../utils/viewport";

// Context global supaya tombol "Buat Post" di Sidebar, di halaman komunitas,
// atau di tempat lain nanti, semuanya cukup memanggil openComposer().
// Desktop: membuka popup yang sama, tidak perlu pindah halaman.
// HP: pindah ke halaman biasa /buat-post (bukan popup).
const PostComposerContext = createContext(null);

export function PostComposerProvider({ children }) {
  const [state, setState] = useState({ open: false, communityId: "", topic: "" });
  const navigate = useNavigate();

  const value = useMemo(
    () => ({
      isOpen: state.open,
      communityId: state.communityId,
      topic: state.topic,
      // communityId: komunitas yang langsung terpilih; topic: slug topik yang langsung
      // terpilih (dipakai bila tidak ada komunitas, misalnya dibuka dari halaman topik).
      openComposer: (communityId = "", topic = "") => {
        if (isMobileViewport()) {
          const qs = new URLSearchParams();
          if (communityId) qs.set("komunitas", communityId);
          if (topic) qs.set("topik", topic);
          const q = qs.toString();
          navigate(q ? `/buat-post?${q}` : "/buat-post");
          return;
        }
        setState({ open: true, communityId, topic });
      },
      closeComposer: () => setState({ open: false, communityId: "", topic: "" }),
    }),
    [state, navigate]
  );

  return <PostComposerContext.Provider value={value}>{children}</PostComposerContext.Provider>;
}

export function usePostComposer() {
  const ctx = useContext(PostComposerContext);
  if (!ctx) throw new Error("usePostComposer must be used within PostComposerProvider");
  return ctx;
}