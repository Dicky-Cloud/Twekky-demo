// DATA CONTOH — semua nama, rating, dan harga di bawah ini fiktif dan hanya
// untuk pengembangan UI. Ganti dengan data dari API sebelum rilis.
// `topic` memakai slug yang sama dengan src/constants/topics.js.

export const MENTORS = [
  {
    id: "m1",
    name: "Rina Kusumawati",
    title: "Head of Finance",
    org: "Perusahaan fintech",
    topic: "finance",
    expertise: ["Perencanaan keuangan", "Analisis laporan", "Karier di keuangan"],
    bio: "Lebih dari 12 tahun di bidang keuangan korporat. Senang membantu profesional muda memahami jalur karier dari staf hingga manajer keuangan.",
    rating: 4.9,
    sessions: 128,
    price: 150000,
    slots: ["Senin 19.00", "Rabu 20.00", "Sabtu 10.00"],
  },
  {
    id: "m2",
    name: "Dimas Prakoso",
    title: "Senior Product Designer",
    org: "Startup e-commerce",
    topic: "design",
    expertise: ["Portofolio desain", "UX research", "Review karya"],
    bio: "Mendesain produk digital untuk jutaan pengguna. Bisa membantu menyusun portofolio dan mempersiapkan wawancara desain.",
    rating: 4.8,
    sessions: 96,
    price: 175000,
    slots: ["Selasa 20.00", "Kamis 20.00", "Minggu 14.00"],
  },
  {
    id: "m3",
    name: "Sari Wulandari",
    title: "HR Business Partner",
    org: "Perusahaan manufaktur",
    topic: "hr",
    expertise: ["Wawancara kerja", "Negosiasi gaji", "Review CV"],
    bio: "Pernah menyeleksi ribuan kandidat. Berbagi sudut pandang recruiter agar kamu tahu apa yang sebenarnya dicari.",
    rating: 4.9,
    sessions: 214,
    price: 125000,
    slots: ["Senin 18.30", "Rabu 18.30", "Jumat 19.30"],
  },
  {
    id: "m4",
    name: "Bagas Setiawan",
    title: "Engineering Manager",
    org: "Perusahaan teknologi",
    topic: "engineering",
    expertise: ["Karier software engineer", "System design", "Kepemimpinan teknis"],
    bio: "Memimpin tim engineering lintas negara. Membantu dari persiapan wawancara teknis sampai transisi menjadi lead.",
    rating: 4.7,
    sessions: 87,
    price: 200000,
    slots: ["Selasa 21.00", "Kamis 21.00", "Sabtu 09.00"],
  },
  {
    id: "m8",
    name: "Nadia Permata",
    title: "Marketing Director",
    org: "Agensi digital",
    topic: "marketing",
    expertise: ["Strategi pemasaran", "Personal branding", "Karier di marketing"],
    bio: "Membangun merek dari nol hingga dikenal nasional. Fokus pada strategi yang terukur dan karier jangka panjang.",
    rating: 4.8,
    sessions: 143,
    price: 160000,
    slots: ["Senin 20.00", "Rabu 19.30", "Minggu 10.00"],
  },
  {
    id: "m5",
    name: "Hendra Gunawan",
    title: "Konsultan Hukum Ketenagakerjaan",
    org: "Firma hukum",
    topic: "legal",
    expertise: ["Kontrak kerja", "Hak karyawan", "Hukum bisnis"],
    bio: "Mendampingi pekerja dan perusahaan memahami kontrak serta hak dan kewajiban. Bukan pengganti nasihat hukum resmi.",
    rating: 4.6,
    sessions: 61,
    price: 225000,
    slots: ["Selasa 19.00", "Jumat 20.00"],
  },
  {
    id: "m6",
    name: "Laras Anindita",
    title: "Career Coach",
    org: "Mandiri",
    topic: "career",
    expertise: ["Transisi karier", "Menemukan arah", "Persiapan melamar"],
    bio: "Membantu orang yang ingin berpindah bidang atau naik level. Sesi berfokus pada rencana langkah yang konkret.",
    rating: 5.0,
    sessions: 176,
    price: 140000,
    slots: ["Rabu 20.00", "Sabtu 11.00", "Minggu 16.00"],
  },
  {
    id: "m7",
    name: "Fajar Nugroho",
    title: "Operations Lead",
    org: "Perusahaan logistik",
    topic: "operations",
    expertise: ["Manajemen operasional", "Optimasi proses", "Manajemen tim"],
    bio: "Berpengalaman mengelola operasional skala besar. Cocok untuk kamu yang ingin memahami manajemen proses dan tim.",
    rating: 4.7,
    sessions: 72,
    price: 150000,
    slots: ["Senin 19.30", "Kamis 19.30"],
  },
];

// Komisi platform yang dipotong dari tiap sesi mentor. Ubah di satu tempat ini.
// Contoh: sesi Rp150.000 -> biaya Rp15.000 -> mentor menerima Rp135.000.
export const MENTOR_FEE_PERCENT = 10;
export const mentorFee = (price) => Math.round((price * MENTOR_FEE_PERCENT) / 100);
export const mentorNet = (price) => price - mentorFee(price);

export function formatRupiah(n) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}
