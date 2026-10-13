import { Link, Navigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Topbar from "../components/Topbar";
import SettingsModal from "../components/SettingsModal";
import { useIsMobile } from "../utils/viewport";
import { SETTINGS_TAB_BY_SLUG, SETTINGS_LABEL } from "../constants/settingsRoutes";

// Satu bagian pengaturan sebagai halaman sendiri di HP (/pengaturan/<bagian>).
// Isinya komponen SettingsModal yang sama dalam mode halaman, jadi logikanya tidak digandakan.
export default function SettingsSectionPage() {
  const { tab: slug } = useParams();
  const isMobile = useIsMobile();
  const tab = SETTINGS_TAB_BY_SLUG[slug];

  if (!tab) return <Navigate to="/pengaturan" replace />;
  // Desktop memakai popup di halaman profil.
  if (!isMobile) {
    const legacy = tab === "business" ? "bisnis" : tab === "mentor" ? "mentor" : "1";
    return <Navigate to={`/profil?pengaturan=${legacy}`} replace />;
  }

  return (
    <>
      <Topbar title={SETTINGS_LABEL[tab]} />
      <div className="mx-auto w-full max-w-xl px-4 pb-6 pt-3">
        <Link
          to="/pengaturan"
          className="mb-3 -ml-1 inline-flex items-center gap-0.5 text-sm font-medium text-gray-600 no-underline hover:text-gray-900"
        >
          <ChevronLeft size={18} /> Pengaturan
        </Link>
        <SettingsModal key={tab} page initialTab={tab} onClose={() => {}} />
      </div>
    </>
  );
}
