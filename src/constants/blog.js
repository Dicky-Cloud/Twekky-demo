// Data blog resmi Twekky (statis). Ganti dengan API saat backend blog tersedia.
//
// CATATAN: nama penulis di AUTHORS adalah placeholder. Isi artikel hanya
// membahas fitur yang memang ada di aplikasi dan tidak memuat angka/klaim
// bisnis — silakan ganti dengan konten dan nama tim yang sebenarnya.
//
// content: array blok -> { t: "p" | "h" | "q", text } atau { t: "ul", items: [] }
// Kelas gradien ditulis utuh supaya terbaca oleh Tailwind.

export const BLOG_CATEGORIES = ["Pengumuman", "Produk", "Komunitas", "Rekrutmen", "Tips Karier", "Di Balik Layar"];

export const CATEGORY_COVER = {
  Pengumuman: "from-brand to-[#6b6b6b]",
  Produk: "from-[#7c3aed] to-[#a78bfa]",
  Komunitas: "from-[#0d9488] to-[#5eead4]",
  Rekrutmen: "from-[#ea580c] to-[#fdba74]",
  "Tips Karier": "from-[#db2777] to-[#f9a8d4]",
  "Di Balik Layar": "from-[#475569] to-[#94a3b8]",
};

export const AUTHORS = {
  tim: { name: "Tim Twekky", role: "Editorial" },
  anindya: { name: "Anindya Putri", role: "Product Manager" },
  raka: { name: "Raka Mahendra", role: "Community Lead" },
  bayu: { name: "Bayu Santoso", role: "Software Engineer" },
};

export const BLOG_POSTS = [
  {
    slug: "memperkenalkan-mentor-twekky",
    title: "Memperkenalkan Mentor Twekky: Belajar Langsung dari Profesional",
    excerpt:
      "Sesi 1-on-1 dengan mentor berpengalaman sedang kami siapkan, dari review CV sampai arah karier jangka panjang.",
    category: "Pengumuman",
    author: "anindya",
    date: "2026-09-29",
    readMins: 4,
    featured: true,
    tags: ["mentor", "fitur baru", "karier"],
    content: [
      { t: "p", text: "Banyak anggota komunitas bertanya hal yang sama: bagaimana caranya mendapat masukan langsung dari orang yang sudah berpengalaman di bidangnya? Jawaban kami adalah Mentor Twekky." },
      { t: "h", text: "Apa itu Mentor Twekky?" },
      { t: "p", text: "Mentor Twekky adalah fitur untuk memesan sesi 1-on-1 dengan profesional dari berbagai bidang, seperti keuangan, desain, HR, engineering, dan marketing. Kamu bisa menelusuri profil mentor, melihat keahlian dan jadwal tersedia, lalu mengajukan sesi." },
      { t: "h", text: "Topik yang bisa dibahas" },
      { t: "ul", items: [
        "Review CV dan portofolio.",
        "Persiapan wawancara dan negosiasi gaji.",
        "Transisi karier ke bidang baru.",
        "Rencana pengembangan karier jangka panjang.",
      ] },
      { t: "p", text: "Fitur ini akan tersedia bagi pelanggan Mentor. Kami masih menyiapkan sisi pembayaran dan konfirmasi jadwal, dan akan mengabarkan perkembangannya di blog ini." },
    ],
  },
  {
    slug: "dashboard-rekrutmen-akun-bisnis",
    title: "Dashboard Rekrutmen untuk Akun Bisnis",
    excerpt:
      "Pasang lowongan, kelola pelamar, dan pantau statistik rekrutmen dari satu tempat.",
    category: "Produk",
    author: "anindya",
    date: "2026-09-22",
    readMins: 5,
    tags: ["rekrutmen", "akun bisnis", "lowongan"],
    content: [
      { t: "p", text: "Merekrut seharusnya tidak berarti membuka belasan tab dan spreadsheet. Karena itu akun Bisnis di Twekky kini dilengkapi dashboard rekrutmen." },
      { t: "h", text: "Apa saja isinya" },
      { t: "ul", items: [
        "Ringkasan: gambaran cepat lowongan dan pelamar yang masuk.",
        "Lowongan saya: buka atau tutup lowongan kapan saja.",
        "Pelamar: lihat detail pelamar, ubah status seleksi, dan unduh CV.",
        "Statistik: pantau jumlah dilihat dan jumlah pelamar tiap lowongan.",
      ] },
      { t: "h", text: "Cara mengaktifkan" },
      { t: "p", text: "Buka Profil, pilih Pengaturan, lalu masuk ke tab Akun Bisnis dan isi nama perusahaan. Menu Rekrutmen akan muncul di sidebar setelah akunmu ditingkatkan." },
    ],
  },
  {
    slug: "cara-membuat-dan-mengelola-komunitas",
    title: "Membuat dan Mengelola Komunitasmu di Twekky",
    excerpt:
      "Terbuka untuk semua atau dengan persetujuan? Panduan memilih pengaturan yang tepat untuk komunitasmu.",
    category: "Komunitas",
    author: "raka",
    date: "2026-09-15",
    readMins: 5,
    tags: ["komunitas", "panduan"],
    content: [
      { t: "p", text: "Komunitas adalah tempat orang dengan minat yang sama berdiskusi lebih dalam. Siapa pun yang login bisa membuat komunitas sendiri." },
      { t: "h", text: "Pilih cara bergabung" },
      { t: "ul", items: [
        "Terbuka: siapa pun langsung menjadi anggota.",
        "Dengan persetujuan: calon anggota mengirim permintaan dan pembuat komunitas yang memutuskan.",
      ] },
      { t: "p", text: "Untuk komunitas yang membahas topik sensitif atau butuh anggota yang relevan, mode persetujuan membantu menjaga kualitas diskusi." },
      { t: "h", text: "Tips mengelola" },
      { t: "ul", items: [
        "Pilih topik yang paling sesuai agar komunitasmu mudah ditemukan.",
        "Tulis aturan yang singkat dan jelas sejak awal.",
        "Tinjau permintaan bergabung secara berkala.",
      ] },
    ],
  },
  {
    slug: "kenapa-kami-menyediakan-post-anonim",
    title: "Kenapa Twekky Menyediakan Post Anonim",
    excerpt:
      "Tidak semua cerita nyaman ditulis dengan nama sendiri. Begini cara kami menyeimbangkan kebebasan bercerita dan rasa aman.",
    category: "Di Balik Layar",
    author: "raka",
    date: "2026-09-08",
    readMins: 4,
    tags: ["anonim", "keamanan", "nilai"],
    content: [
      { t: "p", text: "Dunia kerja penuh cerita yang sulit dibagikan secara terbuka: atasan yang tidak adil, rekan yang sulit, atau sekadar kelelahan. Post anonim memberi ruang untuk bercerita tanpa takut dikenali." },
      { t: "q", text: "Anonim bukan berarti tanpa aturan. Aturan komunitas tetap berlaku untuk semua post." },
      { t: "h", text: "Cara kerjanya" },
      { t: "p", text: "Saat membuat post, kamu bisa memilih tampil sebagai Anonim. Nama tidak ditampilkan di feed maupun halaman post. Setiap post juga bisa diberi mood, seperti curhat, diskusi, atau positif, supaya pembaca tahu konteksnya." },
      { t: "h", text: "Batasannya" },
      { t: "p", text: "Fitur ini tidak boleh dipakai untuk menyerang, melecehkan, atau menyebarkan informasi pribadi orang lain. Pelanggaran tetap bisa dilaporkan." },
    ],
  },
  {
    slug: "cara-menulis-cv-yang-lolos-ats",
    title: "Cara Menulis CV yang Lolos Seleksi Otomatis (ATS)",
    excerpt:
      "Banyak CV bagus gugur sebelum dibaca manusia. Susun CV yang ramah sistem pelacak pelamar.",
    category: "Tips Karier",
    author: "tim",
    date: "2026-09-01",
    readMins: 5,
    tags: ["cv", "lamaran", "ats"],
    content: [
      { t: "p", text: "Sebelum sampai ke meja recruiter, CV sering dipindai dulu oleh Applicant Tracking System (ATS). Sistem ini mencocokkan kata kunci dan struktur CV dengan deskripsi lowongan." },
      { t: "h", text: "1. Gunakan format yang sederhana" },
      { t: "p", text: "Pilih satu kolom, font standar, dan judul bagian yang lazim seperti Pengalaman Kerja, Pendidikan, dan Keahlian. Hindari tabel, kotak teks, serta ikon sebagai pengganti kata." },
      { t: "h", text: "2. Cocokkan kata kunci dengan lowongan" },
      { t: "p", text: "Baca deskripsi pekerjaan, lalu gunakan istilah yang sama bila memang kamu menguasainya." },
      { t: "h", text: "3. Tunjukkan hasil, bukan hanya tugas" },
      { t: "ul", items: [
        "Tulis angka bila ada: 'menaikkan penjualan 18% dalam 6 bulan'.",
        "Mulai kalimat dengan kata kerja aktif: memimpin, membangun, mengurangi.",
        "Batasi 3–5 poin per posisi agar mudah dipindai.",
      ] },
    ],
  },
  {
    slug: "persiapan-wawancara-kerja-7-langkah",
    title: "Persiapan Wawancara Kerja: 7 Langkah Praktis",
    excerpt:
      "Dari riset perusahaan sampai pertanyaan balik untuk pewawancara, checklist singkat agar kamu tampil percaya diri.",
    category: "Tips Karier",
    author: "tim",
    date: "2026-08-25",
    readMins: 6,
    tags: ["wawancara", "karier"],
    content: [
      { t: "p", text: "Wawancara bukan ujian hafalan. Pewawancara ingin tahu apakah kamu cocok dengan peran dan tim. Persiapan yang terarah lebih efektif daripada menghafal jawaban." },
      { t: "ul", items: [
        "Riset perusahaan: produk, pelanggan, dan berita terbaru.",
        "Petakan pengalamanmu ke setiap poin deskripsi lowongan.",
        "Siapkan 3–4 cerita dengan format STAR (Situasi, Tugas, Aksi, Hasil).",
        "Latih jawaban 'ceritakan tentang dirimu' maksimal dua menit.",
        "Siapkan 2–3 pertanyaan untuk pewawancara.",
        "Uji perangkat dan koneksi bila wawancara dilakukan daring.",
        "Tiba lebih awal, atau masuk ruang daring 5 menit sebelum jadwal.",
      ] },
      { t: "p", text: "Setelah wawancara, kirim pesan terima kasih singkat dalam 24 jam dan sebutkan satu hal spesifik yang kamu pelajari dari obrolan tadi." },
    ],
  },
  {
    slug: "menulis-lowongan-yang-menarik-talenta",
    title: "Menulis Lowongan Kerja yang Menarik Talenta Terbaik",
    excerpt:
      "Untuk tim rekrutmen: deskripsi lowongan yang jelas dan jujur menghasilkan pelamar yang lebih relevan.",
    category: "Rekrutmen",
    author: "tim",
    date: "2026-08-18",
    readMins: 4,
    tags: ["lowongan", "rekrutmen"],
    content: [
      { t: "p", text: "Lowongan adalah iklan pertama perusahaanmu di mata kandidat. Judul yang kabur dan daftar syarat yang tidak realistis membuat kandidat bagus mundur sebelum melamar." },
      { t: "ul", items: [
        "Gunakan judul jabatan yang umum dipakai pasar, hindari istilah internal.",
        "Cantumkan rentang gaji dan lokasi atau skema kerja dengan jelas.",
        "Pisahkan syarat wajib dari nilai tambah.",
        "Jelaskan tanggung jawab utama dalam 5–7 poin.",
        "Ceritakan tahapan seleksi dan perkiraan waktunya.",
      ] },
      { t: "p", text: "Lowongan yang transparan juga mengurangi waktu tim HR untuk menyaring pelamar yang tidak sesuai." },
    ],
  },
  {
    slug: "catatan-rilis-komentar-berantai-dan-stiker",
    title: "Catatan Rilis: Komentar Berantai, Stiker, dan Popup Buat Post",
    excerpt:
      "Diskusi jadi lebih hidup: balasan bertingkat, stiker, penyebutan pengguna, dan pembuatan post tanpa pindah halaman.",
    category: "Produk",
    author: "anindya",
    date: "2026-08-11",
    readMins: 3,
    tags: ["catatan rilis", "komentar"],
    content: [
      { t: "p", text: "Rangkuman pembaruan terbaru di Twekky:" },
      { t: "ul", items: [
        "Komentar berantai: balas komentar langsung dan ikuti percakapan dalam satu utas.",
        "Stiker dan emoji: ekspresikan reaksi tanpa harus menulis panjang.",
        "Mention dan hashtag: tandai orang atau topik langsung di dalam komentar.",
        "Popup Buat Post: tulis post dari halaman mana pun lewat sidebar, tanpa berpindah halaman.",
        "Profil dan pengaturan berbentuk popup agar alurmu tidak terputus.",
      ] },
      { t: "p", text: "Punya saran fitur? Sampaikan lewat Pusat Laporan di Pengaturan." },
    ],
  },
  {
    slug: "di-balik-layar-membangun-twekky",
    title: "Di Balik Layar: Bagaimana Twekky Dibangun",
    excerpt:
      "Sekilas tentang teknologi dan cara kerja tim di balik platform karier dan komunitas ini.",
    category: "Di Balik Layar",
    author: "bayu",
    date: "2026-08-04",
    readMins: 4,
    tags: ["engineering", "tim"],
    content: [
      { t: "p", text: "Twekky dimulai dari satu pertanyaan sederhana: bagaimana jika tempat mencari kerja juga menjadi tempat bertukar cerita dan belajar?" },
      { t: "h", text: "Teknologi yang kami pakai" },
      { t: "p", text: "Bagian server ditulis dengan Go dan framework Gin, sedangkan antarmukanya memakai React dengan Tailwind CSS. Kombinasi ini membuat aplikasi cepat dan mudah dikembangkan." },
      { t: "h", text: "Cara kami bekerja" },
      { t: "ul", items: [
        "Rilis kecil dan sering, supaya masukan pengguna cepat terjawab.",
        "Fitur baru dibangun per bagian: data, antarmuka, lalu penyempurnaan.",
        "Keamanan dan privasi dipertimbangkan sejak desain awal.",
      ] },
    ],
  },
];

export function getPost(slug) {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getAuthor(key) {
  return AUTHORS[key] || AUTHORS.tim;
}

const dateFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" });
export function formatPostDate(iso) {
  return dateFmt.format(new Date(iso));
}
