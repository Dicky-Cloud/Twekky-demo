import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import Topbar from "../components/Topbar";

export default function RulesPage() {
  return (
    <>
      <Topbar title="Aturan Komunitas" />
      <div className="p-6 lg:p-8 w-full">
        {/* Banner Header */}
        <div className="rounded-2xl bg-gradient-to-br from-brand to-brand-dark text-white p-8 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck size={32} strokeWidth={2} />
            <h2 className="text-2xl font-bold m-0">Panduan & Aturan Komunitas TWEKKY</h2>
          </div>
          <p className="m-0 opacity-90 text-sm max-w-[50ch]">
            Kami berkomitmen menjaga lingkungan yang aman, profesional, suportif, dan inspiratif bagi seluruh pengguna dan talenta.
          </p>
        </div>

        {/* Intro Card */}
        <div className="card mb-6 bg-white border border-gray-200">
          <h3 className="text-lg font-bold mb-2">Nilai Utama Kami</h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-0">
            TWEKKY adalah ruang bertukar ide, membangun karir, serta berkolaborasi. Setiap anggota komunitas diharapkan saling menghargai, menjunjung tinggi integritas, serta mematuhi aturan dasar di bawah ini demi kenyamanan bersama.
          </p>
        </div>

        {/* Dos and Don'ts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Hal yang Dianjurkan */}
          <div className="rounded-2xl border border-success/30 bg-success-soft/20 p-6">
            <div className="flex items-center gap-2 mb-4 text-success font-bold text-base">
              <CheckCircle2 size={20} strokeWidth={2.5} />
              <span>Hal yang Dianjurkan (Dos)</span>
            </div>
            <ul className="space-y-3 text-sm text-gray-700 m-0 pl-4 list-disc">
              <li>
                <strong>Berbagi Konten Berkualitas:</strong> Unggah postingan, karya, atau wawasan yang relevan dengan perkembangan industri dan karir.
              </li>
              <li>
                <strong>Diskusi Konstruktif:</strong> Berikan tanggapan, kritik, atau saran yang membangun dan profesional pada postingan pengguna lain.
              </li>
              <li>
                <strong>Informasi Valid:</strong> Pastikan lowongan pekerjaan atau profil bisnis yang Anda daftarkan akurat dan dapat dipertanggungjawabkan.
              </li>
              <li>
                <strong>Saling Mendukung:</strong> Berikan apresiasi (suka/komentar positif) kepada sesama kreator dan pencari kerja di komunitas.
              </li>
            </ul>
          </div>

          {/* Hal yang Dilarang */}
          <div className="rounded-2xl border border-danger/30 bg-danger-soft/20 p-6">
            <div className="flex items-center gap-2 mb-4 text-danger font-bold text-base">
              <XCircle size={20} strokeWidth={2.5} />
              <span>Hal yang Dilarang (Don&apos;ts)</span>
            </div>
            <ul className="space-y-3 text-sm text-gray-700 m-0 pl-4 list-disc">
              <li>
                <strong>Ujaran Kebencian & Pelecehan:</strong> Dilarang keras melakukan perundungan (bullying), rasisme, atau menyerang SARA.
              </li>
              <li>
                <strong>Konten Spam & Penipuan:</strong> Tidak diperbolehkan menyebar tautan palsu, skema cepat kaya, atau spam iklan berulang.
              </li>
              <li>
                <strong>Informasi Palsu:</strong> Dilarang menggunakan identitas palsu atau mencantumkan informasi lowongan kerja fiktif.
              </li>
              <li>
                <strong>Pelanggaran Hak Cipta:</strong> Membagikan karya atau kekayaan intelektual milik orang lain tanpa izin atau pencantuman sumber.
              </li>
            </ul>
          </div>
        </div>

        {/* Consequences Card */}
        <div className="rounded-xl border border-warning/30 bg-warning-soft/20 p-5 flex items-start gap-4">
          <div className="text-amber-600 shrink-0 mt-0.5">
            <AlertTriangle size={22} strokeWidth={2} />
          </div>
          <div>
            <h4 className="text-base font-bold text-gray-900 mb-1">Konsekuensi Pelanggaran</h4>
            <p className="text-sm text-gray-600 m-0 leading-relaxed">
              Tim moderasi TWEKKY berhak untuk menghapus konten yang melanggar aturan, menangguhkan status verifikasi bisnis, hingga melakukan pemblokiran akun secara permanen bagi pelanggar berulang.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}