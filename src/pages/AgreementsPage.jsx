import { FileText, CheckSquare, ShieldAlert, RefreshCw, FileCheck } from "lucide-react";
import Topbar from "../components/Topbar";

export default function AgreementsPage() {
  return (
    <>
      <Topbar title="Perjanjian Pengguna" />
      <div className="p-6 lg:p-8 w-full">
        {/* Banner Header */}
        <div className="rounded-2xl bg-gradient-to-br from-brand to-brand-dark text-white p-8 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText size={32} strokeWidth={2} />
            <h2 className="text-2xl font-bold m-0">Perjanjian & Ketentuan Layanan TWEKKY</h2>
          </div>
          <p className="m-0 opacity-90 text-sm max-w-[50ch]">
            Dokumen ini mengatur syarat, ketentuan, serta hak dan kewajiban hukum antara Anda dan platform TWEKKY.
          </p>
        </div>

        {/* Intro Card */}
        <div className="card mb-6 bg-white border border-gray-200">
          <div className="flex items-center gap-2 mb-2 text-brand font-bold text-base">
            <FileCheck size={20} strokeWidth={2} />
            <span>Persetujuan Ketentuan</span>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed mb-0">
            Dengan mendaftar, mengakses, atau menggunakan platform TWEKKY, Anda menyatakan bahwa Anda telah membaca, memahami, dan menyetujui untuk terikat dengan seluruh syarat dan ketentuan yang tercantum dalam Perjanjian Pengguna ini.
          </p>
        </div>

        {/* Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Akun & Keamanan */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-gray-900 font-bold text-base">
              <CheckSquare size={20} strokeWidth={2} className="text-brand" />
              <span>1. Akun dan Tanggung Jawab</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed m-0">
              Anda bertanggung jawab penuh untuk menjaga kerahasiaan kata sandi dan informasi akun Anda. Segala aktivitas yang terjadi di bawah akun Anda adalah tanggung jawab Anda sepenuhnya. Anda wajib memberikan informasi yang akurat saat pendaftaran.
            </p>
          </div>

          {/* Batasan Tanggung Jawab */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-gray-900 font-bold text-base">
              <ShieldAlert size={20} strokeWidth={2} className="text-brand" />
              <span>2. Batasan Tanggung Jawab Platform</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed m-0">
              TWEKKY disediakan sebagaimana adanya. Kami tidak menjamin bahwa layanan akan selalu bebas gangguan atau kesalahan. Kami tidak bertanggung jawab atas kerugian langsung atau tidak langsung yang timbul dari interaksi antar pengguna atau lowongan pihak ketiga.
            </p>
          </div>
        </div>

        {/* Changes to Agreement */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 flex items-start gap-4 shadow-sm">
          <div className="text-brand shrink-0 mt-0.5">
            <RefreshCw size={22} strokeWidth={2} />
          </div>
          <div>
            <h4 className="text-base font-bold text-gray-900 mb-1">Perubahan Ketentuan</h4>
            <p className="text-sm text-gray-600 m-0 leading-relaxed">
              Kami dapat memperbarui Perjanjian Pengguna ini dari waktu ke waktu. Penggunaan berkelanjutan Anda terhadap layanan TWEKKY setelah perubahan tersebut merupakan bentuk persetujuan Anda terhadap ketentuan yang telah direvisi.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}