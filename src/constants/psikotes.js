// Bank soal & konfigurasi simulasi psikotes Twekky.
// Semua dinilai dengan aturan tetap (tanpa AI). Ini untuk LATIHAN mengenal
// format soal, bukan tes psikologi resmi.

// ---- util ----------------------------------------------------------------
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// Figur (soal figural) digambar dari data: { shape, rot, fill, n }
//   shape: triangle | square | circle | arrow | cross
//   rot: derajat searah jarum jam, fill: true = terisi, n: jumlah bentuk (1-4)
const fig = (shape, rot = 0, fill = true, n = 1) => ({ shape, rot, fill, n });

// ---- soal pilihan ganda ----------------------------------------------------
const VERBAL = [
  { id: "v1", q: "Sinonim dari kata EFISIEN adalah …", options: ["Berdaya guna", "Boros", "Lambat", "Rumit"], answer: 0, explain: "Efisien berarti tepat dan berdaya guna: hasil maksimal dengan usaha dan sumber daya seminimal mungkin." },
  { id: "v2", q: "Sinonim dari kata ANTUSIAS adalah …", options: ["Acuh", "Bersemangat", "Lelah", "Ragu"], answer: 1, explain: "Antusias berarti bersemangat dan penuh minat." },
  { id: "v3", q: "Sinonim dari kata OBJEKTIF adalah …", options: ["Memihak", "Berdasarkan fakta", "Berdasarkan perasaan", "Dipaksakan"], answer: 1, explain: "Objektif berarti berdasarkan fakta yang ada, bukan pendapat atau perasaan pribadi." },
  { id: "v4", q: "Sinonim dari kata KREDIBEL adalah …", options: ["Terkenal", "Dapat dipercaya", "Kaya", "Populer"], answer: 1, explain: "Kredibel berarti dapat dipercaya." },
  { id: "v5", q: "Sinonim dari kata KOMPETEN adalah …", options: ["Cakap", "Sombong", "Malas", "Terburu-buru"], answer: 0, explain: "Kompeten berarti cakap atau mampu melakukan sesuatu dengan baik." },
  { id: "v6", q: "Antonim (lawan kata) dari TRANSPARAN adalah …", options: ["Jernih", "Jelas", "Tertutup", "Terbuka"], answer: 2, explain: "Transparan berarti terbuka atau jelas terlihat; lawan katanya tertutup." },
  { id: "v7", q: "Antonim (lawan kata) dari OPTIMIS adalah …", options: ["Yakin", "Pesimis", "Berani", "Semangat"], answer: 1, explain: "Optimis adalah sikap penuh harapan; lawannya pesimis." },
  { id: "v8", q: "Antonim (lawan kata) dari HEMAT adalah …", options: ["Cermat", "Rajin", "Boros", "Sederhana"], answer: 2, explain: "Hemat berarti tidak berlebihan memakai uang atau sumber daya; lawannya boros." },
  { id: "v9", q: "Antonim (lawan kata) dari FLEKSIBEL adalah …", options: ["Lentur", "Luwes", "Mudah", "Kaku"], answer: 3, explain: "Fleksibel berarti mudah menyesuaikan diri; lawannya kaku." },
  { id: "v10", q: "Dokter : Rumah Sakit = Guru : …", options: ["Buku", "Murid", "Sekolah", "Pelajaran"], answer: 2, explain: "Hubungannya profesi dan tempat kerjanya." },
  { id: "v11", q: "Panas : Dingin = Terang : …", options: ["Lampu", "Gelap", "Siang", "Cahaya"], answer: 1, explain: "Hubungannya lawan kata." },
  { id: "v12", q: "Pena : Menulis = Pisau : …", options: ["Tajam", "Dapur", "Memotong", "Logam"], answer: 2, explain: "Hubungannya alat dan fungsinya." },
  { id: "v13", q: "Petani : Sawah = Nelayan : …", options: ["Ikan", "Laut", "Perahu", "Jaring"], answer: 1, explain: "Hubungannya pekerja dan tempat kerjanya." },
  { id: "v14", q: "Manakah yang TIDAK termasuk satu kelompok?", options: ["Apel", "Jeruk", "Wortel", "Mangga"], answer: 2, explain: "Apel, jeruk, dan mangga adalah buah; wortel adalah sayuran." },
];

const NUMERIK = [
  { id: "n1", q: "Lanjutkan deret berikut:\n2, 4, 8, 16, …", options: ["24", "30", "32", "64"], answer: 2, explain: "Setiap angka dikali 2, jadi 16 × 2 = 32." },
  { id: "n2", q: "Lanjutkan deret berikut:\n3, 6, 9, 12, …", options: ["14", "15", "16", "18"], answer: 1, explain: "Setiap angka bertambah 3, jadi 12 + 3 = 15." },
  { id: "n3", q: "Lanjutkan deret berikut:\n1, 4, 9, 16, 25, …", options: ["30", "34", "36", "49"], answer: 2, explain: "Deret bilangan kuadrat: 1², 2², 3², … jadi berikutnya 6² = 36." },
  { id: "n4", q: "Lanjutkan deret berikut:\n2, 3, 5, 8, 12, …", options: ["15", "16", "17", "18"], answer: 2, explain: "Selisihnya naik: +1, +2, +3, +4, jadi berikutnya +5 → 17." },
  { id: "n5", q: "Lanjutkan deret berikut:\n100, 90, 81, 73, …", options: ["64", "65", "66", "67"], answer: 2, explain: "Selisihnya −10, −9, −8, jadi berikutnya −7 → 66." },
  { id: "n6", q: "Lanjutkan deret berikut:\n1, 1, 2, 3, 5, 8, …", options: ["11", "12", "13", "14"], answer: 2, explain: "Deret Fibonacci: tiap angka adalah jumlah dua angka sebelumnya (5 + 8 = 13)." },
  { id: "n7", q: "Berapakah 15% dari 240?", options: ["32", "36", "40", "45"], answer: 1, explain: "0,15 × 240 = 36." },
  { id: "n8", q: "Sebuah mobil melaju 60 km/jam selama 2,5 jam. Berapa jarak yang ditempuh?", options: ["120 km", "140 km", "150 km", "160 km"], answer: 2, explain: "Jarak = kecepatan × waktu = 60 × 2,5 = 150 km." },
  { id: "n9", q: "Perbandingan umur Ani dan Budi adalah 3 : 5. Jumlah umur mereka 48 tahun. Berapa umur Budi?", options: ["18 tahun", "24 tahun", "30 tahun", "32 tahun"], answer: 2, explain: "Jumlah bagian 3 + 5 = 8; 48 ÷ 8 = 6; umur Budi = 5 × 6 = 30." },
  { id: "n10", q: "3/4 + 2/3 = …", options: ["5/7", "17/12", "6/12", "3/2"], answer: 1, explain: "Samakan penyebut: 9/12 + 8/12 = 17/12." },
  { id: "n11", q: "Sebuah baju seharga Rp200.000 diskon 25%, lalu dipotong voucher Rp10.000. Berapa yang dibayar?", options: ["Rp140.000", "Rp150.000", "Rp160.000", "Rp130.000"], answer: 0, explain: "Diskon 25% = Rp50.000 sehingga jadi Rp150.000; dikurangi voucher Rp10.000 = Rp140.000." },
  { id: "n12", q: "A menyelesaikan suatu pekerjaan dalam 6 hari, B dalam 12 hari. Jika bekerja bersama, pekerjaan selesai dalam …", options: ["3 hari", "4 hari", "5 hari", "9 hari"], answer: 1, explain: "Dalam sehari mereka menyelesaikan 1/6 + 1/12 = 3/12 = 1/4 pekerjaan, jadi 4 hari." },
  { id: "n13", q: "Rata-rata 5 nilai adalah 78. Jumlah 4 nilai pertama adalah 300. Berapa nilai kelima?", options: ["80", "85", "90", "95"], answer: 2, explain: "Jumlah seluruhnya 5 × 78 = 390; nilai kelima = 390 − 300 = 90." },
  { id: "n14", q: "Sebuah toko membeli barang Rp80.000 dan menjualnya dengan untung 20%. Berapa harga jualnya?", options: ["Rp92.000", "Rp96.000", "Rp100.000", "Rp104.000"], answer: 1, explain: "Untung 20% = Rp16.000, jadi harga jual Rp96.000." },
];

const LOGIKA = [
  { id: "l1", q: "Semua karyawan wajib absen. Budi adalah karyawan.\nKesimpulannya …", options: ["Budi wajib absen", "Budi tidak wajib absen", "Semua yang absen adalah karyawan", "Budi tidak mungkin absen"], answer: 0, explain: "Budi termasuk kelompok karyawan, sehingga aturan untuk karyawan berlaku padanya." },
  { id: "l2", q: "Semua manajer adalah lulusan S1. Sebagian lulusan S1 mahir bahasa Inggris.\nKesimpulan yang PASTI benar adalah …", options: ["Semua manajer mahir bahasa Inggris", "Sebagian manajer mahir bahasa Inggris", "Tidak ada manajer yang mahir bahasa Inggris", "Tidak dapat dipastikan hubungan manajer dengan kemahiran bahasa Inggris"], answer: 3, explain: "Sebagian lulusan S1 yang mahir belum tentu termasuk manajer, jadi tidak ada kesimpulan yang pasti." },
  { id: "l3", q: "Jika hujan, maka jalanan basah. Jalanan tidak basah.\nKesimpulannya …", options: ["Hujan", "Tidak hujan", "Jalanan kering karena panas", "Tidak dapat disimpulkan"], answer: 1, explain: "Kontraposisi: jika akibatnya tidak terjadi, maka sebabnya juga tidak terjadi." },
  { id: "l4", q: "Jika rajin belajar maka lulus. Andi lulus.\nKesimpulannya …", options: ["Andi rajin belajar", "Andi tidak rajin belajar", "Tidak dapat disimpulkan apakah Andi rajin belajar", "Andi pasti tidak lulus"], answer: 2, explain: "Lulus bisa terjadi karena alasan lain, jadi tidak dapat disimpulkan Andi rajin belajar atau tidak." },
  { id: "l5", q: "A lebih tinggi dari B. B lebih tinggi dari C. D lebih tinggi dari A.\nSiapa yang paling pendek?", options: ["A", "B", "C", "D"], answer: 2, explain: "Urutan dari tinggi: D > A > B > C, jadi C paling pendek." },
  { id: "l6", q: "Lima orang mengantre. Rani di depan Sinta. Tono di belakang Sinta. Umar di depan Rani. Vina paling belakang.\nSiapa yang berada di urutan ketiga?", options: ["Rani", "Sinta", "Tono", "Umar"], answer: 1, explain: "Urutannya: Umar, Rani, Sinta, Tono, Vina. Urutan ketiga adalah Sinta." },
  { id: "l7", q: "Jika 2 hari setelah lusa adalah hari Jumat, maka hari ini adalah hari …", options: ["Senin", "Selasa", "Rabu", "Kamis"], answer: 0, explain: "Lusa = 2 hari dari sekarang; 2 hari setelahnya = 4 hari dari sekarang. Jumat dikurangi 4 hari = Senin." },
  { id: "l8", q: "Jika A = 1, B = 2, C = 3, dan seterusnya, berapa nilai kata BAD?", options: ["6", "7", "8", "9"], answer: 1, explain: "B = 2, A = 1, D = 4, jumlahnya 7." },
  { id: "l9", q: "Tidak ada pegawai magang yang mendapat lembur. Dina adalah pegawai magang.\nKesimpulannya …", options: ["Dina mendapat lembur", "Dina tidak mendapat lembur", "Dina bukan pegawai magang", "Sebagian pegawai lembur adalah magang"], answer: 1, explain: "Dina termasuk pegawai magang, dan tidak ada pegawai magang yang mendapat lembur." },
  { id: "l10", q: "Di sebuah kandang ada ayam dan kambing. Jumlah kepala 10 dan jumlah kaki 28. Berapa jumlah kambing?", options: ["3", "4", "5", "6"], answer: 1, explain: "Jika semuanya ayam, kakinya 20. Selisih 8 kaki; tiap kambing menambah 2 kaki, sehingga ada 4 kambing." },
];

const FIGURAL = [
  { id: "f1", q: "Pilih gambar yang melengkapi pola berikut.", figures: [fig("arrow", 0), fig("arrow", 90), fig("arrow", 180)], options: [fig("arrow", 0), fig("arrow", 90), fig("arrow", 270), fig("arrow", 180)], answer: 2, explain: "Panah berputar 90° searah jarum jam setiap langkah: 0° → 90° → 180° → 270°." },
  { id: "f2", q: "Pilih gambar yang melengkapi pola berikut.", figures: [fig("circle", 0, true, 1), fig("circle", 0, true, 2), fig("circle", 0, true, 3)], options: [fig("circle", 0, true, 3), fig("circle", 0, true, 4), fig("circle", 0, true, 2), fig("circle", 0, true, 1)], answer: 1, explain: "Jumlah lingkaran bertambah satu setiap langkah, jadi berikutnya empat lingkaran." },
  { id: "f3", q: "Pilih gambar yang melengkapi pola berikut.", figures: [fig("square", 0, true), fig("square", 0, false), fig("square", 0, true)], options: [fig("square", 0, true), fig("square", 0, false), fig("circle", 0, false), fig("triangle", 0, false)], answer: 1, explain: "Persegi bergantian terisi dan kosong, jadi berikutnya persegi kosong." },
  { id: "f4", q: "Pilih gambar yang melengkapi pola berikut.", figures: [fig("triangle", 0), fig("triangle", 45), fig("triangle", 90)], options: [fig("triangle", 180), fig("triangle", 135), fig("triangle", 45), fig("triangle", 90)], answer: 1, explain: "Segitiga berputar 45° setiap langkah: 0° → 45° → 90° → 135°." },
  { id: "f5", q: "Pilih gambar yang melengkapi pola berikut.", figures: [fig("triangle", 0, true, 1), fig("triangle", 0, false, 2), fig("triangle", 0, true, 3)], options: [fig("triangle", 0, true, 4), fig("triangle", 0, false, 4), fig("triangle", 0, false, 3), fig("triangle", 0, true, 2)], answer: 1, explain: "Jumlah bentuk bertambah satu dan isinya bergantian penuh/kosong, jadi berikutnya empat segitiga kosong." },
  { id: "f6", q: "Pilih gambar yang melengkapi pola berikut.", figures: [fig("arrow", 270), fig("arrow", 180), fig("arrow", 90)], options: [fig("arrow", 90), fig("arrow", 180), fig("arrow", 0), fig("arrow", 270)], answer: 2, explain: "Panah berputar 90° berlawanan arah jarum jam setiap langkah, jadi berikutnya menghadap ke atas (0°)." },
  { id: "f7", q: "Pilih gambar yang melengkapi pola berikut.", figures: [fig("circle"), fig("square"), fig("triangle"), fig("circle"), fig("square")], options: [fig("circle"), fig("square"), fig("triangle"), fig("cross")], answer: 2, explain: "Urutan bentuk berulang: lingkaran, persegi, segitiga. Setelah persegi datang segitiga." },
  { id: "f8", q: "Pilih gambar yang BERBEDA dari tiga lainnya.", options: [fig("triangle", 0), fig("triangle", 90), fig("square", 0), fig("triangle", 180)], answer: 2, explain: "Tiga gambar lainnya segitiga (hanya arahnya berbeda). Yang berbeda jenis bentuknya adalah persegi." },
  { id: "f9", q: "Pilih gambar yang melengkapi pola berikut.", figures: [fig("triangle", 0, true), fig("triangle", 180, false), fig("triangle", 0, true), fig("triangle", 180, false)], options: [fig("triangle", 180, true), fig("triangle", 0, false), fig("triangle", 0, true), fig("triangle", 180, false)], answer: 2, explain: "Pola bergantian antara (tegak, penuh) dan (terbalik, kosong). Berikutnya segitiga tegak yang penuh." },
];

export const MCQ_CATEGORIES = {
  verbal: { id: "verbal", label: "Verbal", questions: VERBAL },
  numerik: { id: "numerik", label: "Numerik", questions: NUMERIK },
  logika: { id: "logika", label: "Logika", questions: LOGIKA },
  figural: { id: "figural", label: "Figural", questions: FIGURAL },
};

const withCategory = (id) => MCQ_CATEGORIES[id].questions.map((q) => ({ ...q, category: id }));

export function getCategoryQuestions(id) {
  return shuffle(withCategory(id));
}

// Simulasi lengkap: 5 soal acak dari tiap kategori, dicampur.
export const FULL_PER_CATEGORY = 5;
export function buildFullTest() {
  const picked = Object.keys(MCQ_CATEGORIES).flatMap((id) =>
    shuffle(withCategory(id)).slice(0, FULL_PER_CATEGORY)
  );
  return shuffle(picked);
}

// ---- tes kepribadian (gaya DISC) --------------------------------------------
export const PERSONALITY_DIMS = {
  D: {
    label: "Dominan",
    summary: "Tegas, berorientasi hasil, dan cepat mengambil keputusan.",
    watch: "Bisa terkesan terlalu keras atau kurang sabar terhadap orang lain.",
  },
  I: {
    label: "Influence",
    summary: "Komunikatif, antusias, dan pandai membangun hubungan.",
    watch: "Detail dan tindak lanjut kadang terlewat.",
  },
  S: {
    label: "Steadiness",
    summary: "Sabar, setia, kolaboratif, dan menjaga keharmonisan tim.",
    watch: "Bisa sulit menolak atau beradaptasi dengan perubahan yang cepat.",
  },
  C: {
    label: "Conscientiousness",
    summary: "Teliti, analitis, dan patuh pada standar kualitas.",
    watch: "Bisa terlalu perfeksionis dan lambat dalam memutuskan.",
  },
};

export const PERSONALITY_ITEMS = [
  { id: "p1", dim: "D", text: "Saya cepat mengambil keputusan, bahkan dalam situasi yang belum pasti." },
  { id: "p2", dim: "D", text: "Saya senang memimpin dan mengarahkan orang lain." },
  { id: "p3", dim: "D", text: "Saya tidak ragu menyampaikan pendapat yang berbeda dari kebanyakan orang." },
  { id: "p4", dim: "D", text: "Saya menyukai tantangan dan target yang tinggi." },
  { id: "p5", dim: "D", text: "Saya ingin hasil yang cepat dan tidak suka proses yang bertele-tele." },
  { id: "p6", dim: "I", text: "Saya mudah akrab dengan orang yang baru dikenal." },
  { id: "p7", dim: "I", text: "Saya senang menyemangati dan memotivasi orang lain." },
  { id: "p8", dim: "I", text: "Saya lebih suka bekerja dalam suasana yang ramai dan menyenangkan." },
  { id: "p9", dim: "I", text: "Saya suka bercerita dan mengungkapkan ide dengan ekspresif." },
  { id: "p10", dim: "I", text: "Saya mudah membangun suasana positif di dalam tim." },
  { id: "p11", dim: "S", text: "Saya sabar mendengarkan keluhan orang lain." },
  { id: "p12", dim: "S", text: "Saya lebih nyaman dengan rutinitas yang stabil." },
  { id: "p13", dim: "S", text: "Saya setia pada tim dan jarang ingin berpindah-pindah." },
  { id: "p14", dim: "S", text: "Saya menghindari konflik dan mengutamakan kebersamaan." },
  { id: "p15", dim: "S", text: "Saya butuh waktu untuk beradaptasi dengan perubahan besar." },
  { id: "p16", dim: "C", text: "Saya teliti dan memeriksa ulang pekerjaan sebelum diserahkan." },
  { id: "p17", dim: "C", text: "Saya bekerja paling baik jika aturan dan prosedurnya jelas." },
  { id: "p18", dim: "C", text: "Saya mengambil keputusan berdasarkan data dan fakta." },
  { id: "p19", dim: "C", text: "Saya tidak nyaman jika hasil kerja penuh kesalahan kecil." },
  { id: "p20", dim: "C", text: "Saya merencanakan sesuatu secara rinci sebelum mulai." },
];

export const LIKERT = [
  "Sangat tidak setuju",
  "Tidak setuju",
  "Netral",
  "Setuju",
  "Sangat setuju",
];

// ---- daftar tes --------------------------------------------------------------
export const TESTS = [
  {
    id: "full",
    kind: "mcq",
    title: "Simulasi Lengkap",
    desc: "Campuran soal verbal, numerik, logika, dan figural dalam satu sesi, seperti tes seleksi sungguhan.",
    count: FULL_PER_CATEGORY * Object.keys(MCQ_CATEGORIES).length,
    minutes: 20,
    tips: [
      "Soal diacak setiap kali kamu mulai, jadi tiap percobaan berbeda.",
      "Jawab yang kamu yakin dulu, lalu kembali ke soal yang sulit lewat nomor soal.",
    ],
  },
  {
    id: "verbal",
    kind: "mcq",
    title: "Kemampuan Verbal",
    desc: "Sinonim, antonim, analogi kata, dan mengelompokkan kata.",
    count: VERBAL.length,
    minutes: 10,
    tips: ["Perhatikan hubungan antar kata pada soal analogi: lawan kata, alat–fungsi, atau pekerja–tempat."],
  },
  {
    id: "numerik",
    kind: "mcq",
    title: "Kemampuan Numerik",
    desc: "Deret angka, persentase, perbandingan, pecahan, dan soal cerita.",
    count: NUMERIK.length,
    minutes: 20,
    tips: ["Pada deret angka, cek dulu selisih antar angka sebelum mencoba pola lain."],
  },
  {
    id: "logika",
    kind: "mcq",
    title: "Penalaran Logika",
    desc: "Silogisme, penalaran urutan, dan logika sebab-akibat.",
    count: LOGIKA.length,
    minutes: 12,
    tips: ["Tulis urutan atau hubungan di kertas coret agar tidak keliru membayangkannya."],
  },
  {
    id: "figural",
    kind: "mcq",
    title: "Figural & Pola Gambar",
    desc: "Melengkapi pola rotasi, jumlah, dan isi bentuk.",
    count: FIGURAL.length,
    minutes: 8,
    tips: ["Amati satu hal per langkah: putaran, jumlah bentuk, lalu isinya (penuh atau kosong)."],
  },
  {
    id: "kraepelin",
    kind: "kraepelin",
    title: "Tes Kraepelin (Latihan)",
    desc: "Menjumlahkan angka berurutan dengan cepat. Melatih kecepatan, ketelitian, dan stamina.",
    count: null,
    minutes: 3,
    tips: [
      "Jumlahkan dua angka yang bersebelahan, lalu ketik angka SATUAN dari hasilnya. Contoh: 7 + 8 = 15 → ketik 5.",
      "Ada 3 lajur, masing-masing 60 detik. Kamu bisa mengetik lewat keyboard atau tombol angka di layar.",
    ],
  },
  {
    id: "kepribadian",
    kind: "personality",
    title: "Gaya Kepribadian (DISC)",
    desc: "20 pernyataan untuk mengenal kecenderungan gaya kerjamu. Tidak ada jawaban benar atau salah.",
    count: PERSONALITY_ITEMS.length,
    minutes: null,
    tips: ["Jawab sesuai dirimu yang sebenarnya, bukan dirimu yang ingin terlihat baik."],
  },
];

// ---- riwayat (disimpan di perangkat ini) ---------------------------------------
const HISTORY_KEY = "twekky_psikotes_history";

export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveHistory(entry) {
  try {
    const list = [{ ...entry, at: new Date().toISOString() }, ...loadHistory()].slice(0, 30);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch {
    /* penyimpanan penuh / diblokir: abaikan, riwayat hanya fitur tambahan */
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    /* abaikan */
  }
}
