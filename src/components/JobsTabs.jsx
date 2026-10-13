import { Link, NavLink } from "react-router-dom";
import { Bookmark } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Baris tab Lowongan Kerja untuk halaman yang berdiri sendiri (Wawancara).
// Tampilannya sama dengan baris tab di JobsPage supaya terasa satu halaman.
// Tiga tab pertama kembali ke JobsPage; tab Wawancara adalah halaman ini sendiri.
const base =
  "pb-3 px-2 text-sm font-semibold border-b-2 transition-colors no-underline whitespace-nowrap flex items-center gap-1.5";
const idle = "border-transparent text-gray-500 hover:text-gray-700";
const active = "border-brand text-brand";

export default function JobsTabs({ className = "" }) {
  const { user } = useAuth();
  const tab = ({ isActive }) => `${base} ${isActive ? active : idle}`;

  return (
    <nav
      aria-label="Menu Lowongan Kerja"
      className={`flex items-end gap-2 overflow-x-auto border-b border-gray-200 print:hidden ${className}`}
    >
      <Link to="/lowongan-kerja" className={`${base} ${idle}`}>
        Semua Lowongan
      </Link>
      <Link to="/lowongan-kerja?tab=tersimpan" className={`${base} ${idle}`}>
        <Bookmark size={15} /> Tersimpan
      </Link>
      {user && (
        <Link to="/lowongan-kerja?tab=lamaran" className={`${base} ${idle}`}>
          Lamaran Saya
        </Link>
      )}
      <NavLink to="/wawancara" className={tab}>
        Wawancara
      </NavLink>
    </nav>
  );
}