import { Info, Target, Users2, Sparkles } from "lucide-react";
import Topbar from "../components/Topbar";

export default function AboutPage() {
  return (
    <>
      <Topbar title="Tentang Twekky" />
      <div className="p-6 lg:p-8 w-full">
        <div className="rounded-2xl bg-gradient-to-br from-brand to-brand-dark text-white p-8 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Info size={32} strokeWidth={2} />
            <h2 className="text-2xl font-bold m-0">Tentang Platform TWEKKY</h2>
          </div>
          <p className="m-0 opacity-90 text-sm max-w-[50ch]">
            Platform profesional dan komunitas talenta tempat ide, kolaborasi, dan peluang karir bertemu.
          </p>
        </div>

        <div className="card mb-6 bg-white border border-gray-200">
          <div className="flex items-center gap-2 mb-2 text-brand font-bold text-base">
            <Target size={20} strokeWidth={2} />
            <span>Misi Kami</span>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed mb-0">
            TWEKKY hadir untuk menghubungkan para profesional, kreator, dan pelaku bisnis secara transparan dan dinamis. Kami memfasilitasi pertukaran ide kreatif serta pencarian talenta terbaik melalui sistem lowongan kerja yang terintegrasi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-gray-900 font-bold text-base">
              <Users2 size={20} strokeWidth={2} className="text-brand" />
              <span>Komunitas yang Bertumbuh</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed m-0">
              Didukung oleh ekosistem pengguna yang aktif berdiskusi, berbagi wawasan industri, dan saling mendukung dalam pengembangan karir maupun bisnis.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-gray-900 font-bold text-base">
              <Sparkles size={20} strokeWidth={2} className="text-brand" />
              <span>Inovasi Tanpa Batas</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed m-0">
              Kami terus berinovasi menyajikan fitur-fitur modern yang responsif dan nyaman digunakan untuk mendukung produktivitas harian Anda.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}