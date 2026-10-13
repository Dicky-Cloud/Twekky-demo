import { HelpCircle, MessageSquare, LifeBuoy, Mail } from "lucide-react";
import Topbar from "../components/Topbar";

export default function HelpPage() {
  return (
    <>
      <Topbar title="Pusat Bantuan" />
      <div className="p-6 lg:p-8 w-full">
        <div className="rounded-2xl bg-gradient-to-br from-brand to-brand-dark text-white p-8 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <HelpCircle size={32} strokeWidth={2} />
            <h2 className="text-2xl font-bold m-0">Butuh Bantuan? Kami Siap Membantu</h2>
          </div>
          <p className="m-0 opacity-90 text-sm max-w-[50ch]">
            Temukan jawaban atas pertanyaan umum seputar penggunaan akun, fitur postingan, dan lowongan kerja di TWEKKY.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-gray-900 font-bold text-base">
              <MessageSquare size={20} strokeWidth={2} className="text-brand" />
              <span>Pertanyaan Umum (FAQ)</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-600 pl-4 list-disc m-0">
              <li>Bagaimana cara mengupgrade akun ke Bisnis?</li>
              <li>Bagaimana cara memverifikasi profil atau perusahaan?</li>
              <li>Bagaimana cara melamar lowongan pekerjaan?</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-gray-900 font-bold text-base">
              <LifeBuoy size={20} strokeWidth={2} className="text-brand" />
              <span>Kendala Teknis</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed m-0">
              Jika Anda mengalami kendala saat masuk (login), pembaruan profil, atau pengiriman pesan, pastikan koneksi internet stabil atau coba muat ulang halaman.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 flex items-start gap-4 shadow-sm">
          <div className="text-brand shrink-0 mt-0.5">
            <Mail size={22} strokeWidth={2} />
          </div>
          <div>
            <h4 className="text-base font-bold text-gray-900 mb-1">Hubungi Tim Dukungan</h4>
            <p className="text-sm text-gray-600 m-0 leading-relaxed">
              Belum menemukan solusi yang dicari? Kirimkan kendala atau pertanyaan Anda melalui email ke <span className="text-brand font-semibold">support@twekky.id</span>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}