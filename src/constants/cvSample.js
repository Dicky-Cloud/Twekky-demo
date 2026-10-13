// Data contoh fiktif untuk melihat tampilan tiap model CV (bukan data pengguna).
export const CV_SAMPLE = {
  name: "Rina Wulandari",
  headline: "Staf Administrasi",
  contact: ["rina.contoh@email.com", "0812-0000-0000", "Semarang, Jawa Tengah"],
  summary:
    "Lulusan S1 Akuntansi dengan pengalaman administrasi dan pengelolaan dokumen. Teliti, terbiasa bekerja dengan tenggat, dan cepat mempelajari alat kerja baru.",
  photo: null,
  skills: ["Microsoft Office", "Pengarsipan", "Korespondensi", "Komunikasi", "Manajemen waktu", "Entri data"],
  languages: ["Indonesia (ibu)", "Inggris (aktif)"],
  interests: ["Membaca", "Bulu tangkis"],
  experience: [
    { id: "s1", title: "Staf Administrasi", company: "PT Contoh Sejahtera", industry: "Manufaktur", start: "2022-03", end: "", current: true,
      desc: "Mengelola surat masuk dan keluar, menyusun laporan mingguan, serta menyiapkan dokumen rapat untuk tim." },
    { id: "s2", title: "Staf Administrasi (Magang)", company: "CV Maju Bersama", industry: "Perdagangan", start: "2021-06", end: "2022-02", current: false,
      desc: "Membantu entri data transaksi dan merapikan arsip dokumen." },
  ],
  education: [
    { id: "e1", school: "Universitas Contoh", level: "D4/S1", major: "Akuntansi", start: "2017", end: "2021" },
  ],
  organizations: [
    { id: "o1", title: "Bendahara", company: "Himpunan Mahasiswa Akuntansi", start: "2019-01", end: "2019-12", current: false, desc: "Mengelola kas dan laporan keuangan kegiatan." },
  ],
  certifications: [
    { id: "c1", title: "Kursus Microsoft Excel Lanjutan", company: "Lembaga Pelatihan Contoh", start: "2022" },
  ],
  portfolio: [
    { id: "p1", title: "Contoh laporan keuangan", url: "https://contoh.example/laporan" },
  ],
};
