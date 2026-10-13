import { Lock, Eye, Database, Share2, UserCheck } from "lucide-react";
import Topbar from "../components/Topbar";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Topbar title="Kebijakan Privasi" />
      <div className="p-6 lg:p-8 w-full">
        {/* Banner Header */}
        <div className="rounded-2xl bg-gradient-to-br from-brand to-brand-dark text-white p-8 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Lock size={32} strokeWidth={2} />
            <h2 className="text-2xl font-bold m-0">Kebijakan Privasi TWEKKY</h2>
          </div>
          <p className="m-0 opacity-90 text-sm max-w-[50ch]">
            Kami menghargai privasi Anda dan berkomitmen untuk melindungi data pribadi yang Anda bagikan di platform TWEKKY.
          </p>
        </div>

        {/* Intro Card */}
        <div className="card mb-6 bg-white border border-gray-200">
          <div className="flex items-center gap-2 mb-2 text-brand font-bold text-base">
            <Eye size={20} strokeWidth={2} />
            <span>Komitmen Privasi Kami</span>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed mb-0">
            Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi pribadi Anda saat Anda mengakses atau menggunakan layanan TWEKKY. Dengan menggunakan platform kami, Anda menyetujui praktik data yang dijelaskan di bawah ini.
          </p>
        </div>

        {/* Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Pengumpulan Data */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-gray-900 font-bold text-base">
              <Database size={20} strokeWidth={2} className="text-brand" />
              <span>1. Data yang Kami Kumpulkan</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed m-0">
              Kami mengumpulkan informasi yang Anda berikan secara langsung, seperti nama, alamat email, foto profil, bio, nama perusahaan (untuk akun bisnis), serta konten postingan atau lamaran pekerjaan yang Anda buat di platform.
            </p>
          </div>

          {/* Penggunaan & Berbagi Data */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-gray-900 font-bold text-base">
              <Share2 size={20} strokeWidth={2} className="text-brand" />
              <span>2. Penggunaan & Pembagian Informasi</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed m-0">
              Informasi Anda digunakan untuk mengelola akun, memfasilitasi komunikasi antar pengguna, menampilkan lowongan kerja, serta meningkatkan keamanan platform. Kami tidak akan menjual atau menyewakan data pribadi Anda kepada pihak ketiga tanpa izin.
            </p>
          </div>
        </div>

        {/* Kunjungan Profil */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-3 text-gray-900 font-bold text-base">
            <Eye size={20} strokeWidth={2} className="text-brand" />
            <span>3. Data Kunjungan Profil ("Pengunjung profilmu")</span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mt-0 mb-3">
            Saat Anda membuka profil pengguna lain, TWEKKY mencatat siapa yang berkunjung, tanggal, dan berapa kali berkunjung pada hari itu. Kunjungan berulang oleh orang yang sama di hari yang sama digabung menjadi satu catatan.
          </p>
          <ul className="text-sm text-gray-600 leading-relaxed m-0 pl-5 space-y-1.5">
            <li>Pemilik profil melihat jumlah pengunjung 30 hari terakhir. Pengguna Pro juga melihat daftar pengunjung (nama atau perusahaan) sampai 90 hari terakhir.</li>
            <li>Catatan kunjungan disimpan paling lama 90 hari, lalu dihapus otomatis.</li>
            <li>Kunjungan ke profil Anda sendiri tidak dicatat. Kunjungan antara pengguna yang saling atau sepihak memblokir tidak dicatat dan tidak ditampilkan.</li>
            <li>Mode Anonim (Pengaturan &gt; Privasi) menyembunyikan identitas Anda sebagai pengunjung: pemilik profil hanya melihat "pengunjung anonim". Sebagai timbal balik, daftar nama pengunjung profil Anda sendiri juga disembunyikan selama mode ini aktif. Mode ini berlaku untuk kunjungan berikutnya; kunjungan yang sudah tercatat atas nama Anda tidak berubah.</li>
            <li>Data kunjungan tidak dijual dan hanya dipakai untuk fitur ini.</li>
          </ul>
          <p className="text-xs text-gray-400 mt-3 mb-0">Diperbarui: 5 Oktober 2026</p>
        </div>

        {/* User Control Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 flex items-start gap-4 shadow-sm">
          <div className="text-brand shrink-0 mt-0.5">
            <UserCheck size={22} strokeWidth={2} />
          </div>
          <div>
            <h4 className="text-base font-bold text-gray-900 mb-1">Kontrol & Hak Anda</h4>
            <p className="text-sm text-gray-600 m-0 leading-relaxed">
              Anda memiliki hak penuh untuk memperbarui profil, mengubah informasi akun, atau meminta penghapusan data dengan menghubungi tim dukungan kami kapan saja melalui menu bantuan atau pengaturan akun. Anda juga dapat mengaktifkan Mode Anonim kapan saja agar kunjungan Anda ke profil lain tidak menampilkan identitas.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}