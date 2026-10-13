import { Accessibility, Eye, Sparkles, CheckCircle2 } from "lucide-react";
import Topbar from "../components/Topbar";

export default function AccessibilityPage() {
  return (
    <>
      <Topbar title="Aksesibilitas" />
      <div className="p-6 lg:p-8 w-full">
        <div className="rounded-2xl bg-gradient-to-br from-brand to-brand-dark text-white p-8 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Accessibility size={32} strokeWidth={2} />
            <h2 className="text-2xl font-bold m-0">Komitmen Aksesibilitas TWEKKY</h2>
          </div>
          <p className="m-0 opacity-90 text-sm max-w-[50ch]">
            Kami berdedikasi untuk memastikan platform TWEKKY dapat diakses dan digunakan dengan nyaman oleh semua orang, termasuk penyandang disabilitas.
          </p>
        </div>

        <div className="card mb-6 bg-white border border-gray-200">
          <div className="flex items-center gap-2 mb-2 text-brand font-bold text-base">
            <Eye size={20} strokeWidth={2} />
            <span>Standar Desain Inklusif</span>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed mb-0">
            TWEKKY dirancang dengan memperhatikan standar kontras warna, keterbacaan teks, navigasi papan ketik (keyboard navigation), serta struktur elemen semantik agar kompatibel dengan teknologi bantuan (assistive technologies).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-gray-900 font-bold text-base">
              <Sparkles size={20} strokeWidth={2} className="text-brand" />
              <span>Fitur Navigasi & Tampilan</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed m-0">
              Antarmuka kami mendukung perbesaran layar, tombol interaktif yang mudah dijangkau, serta struktur sidebar yang fleksibel untuk memudahkan perpindahan halaman tanpa hambatan.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-gray-900 font-bold text-base">
              <CheckCircle2 size={20} strokeWidth={2} className="text-brand" />
              <span>Peningkatan Berkelanjutan</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed m-0">
              Kami terus memantau dan memperbaiki kode serta tata letak aplikasi secara berkala guna mematuhi prinsip aksesibilitas web global demi pengalaman pengguna yang setara.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}