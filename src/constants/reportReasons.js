// Alasan laporan. Slug HARUS sama dengan internal/models/report.go (ReportCategories).
// urgent: kategori keselamatan; ditinjau lebih dulu di sisi admin.
// evidence: "recommended" = bukti foto disarankan (tidak wajib).

export const MAX_EVIDENCE = 4;
export const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;
export const EVIDENCE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const MIN_DETAILS = 10;
export const MAX_DETAILS = 1000;

export const REPORT_CATEGORIES = [
  {
    slug: "spam",
    label: "Spam atau iklan menyesatkan",
    hint: "Promosi yang tidak diinginkan, tautan mencurigakan, post berulang",
    subs: [
      { slug: "promo", label: "Iklan atau promosi yang tidak diinginkan" },
      { slug: "link", label: "Tautan mencurigakan" },
      { slug: "repetitive", label: "Post berulang atau membanjiri" },
      { slug: "other", label: "Lainnya" },
    ],
  },
  {
    slug: "scam",
    label: "Penipuan",
    hint: "Lowongan palsu, meminta uang, menyamar sebagai perusahaan",
    evidence: "recommended",
    subs: [
      { slug: "fake_job", label: "Lowongan kerja palsu" },
      { slug: "ask_money", label: "Meminta uang atau biaya" },
      { slug: "phishing", label: "Mengambil data pribadi (phishing)" },
      { slug: "impersonate_company", label: "Menyamar sebagai perusahaan atau merek" },
      { slug: "investment", label: "Investasi bodong atau MLM" },
      { slug: "other", label: "Lainnya" },
    ],
  },
  {
    slug: "harassment",
    label: "Pelecehan atau perundungan",
    hint: "Hinaan, serangan pribadi, pelecehan seksual, menguntit",
    evidence: "recommended",
    subs: [
      { slug: "insult_me", label: "Menyerang atau menghina saya" },
      { slug: "insult_other", label: "Menyerang atau menghina orang lain" },
      { slug: "sexual_harassment", label: "Pelecehan seksual" },
      { slug: "stalking", label: "Menguntit atau mengganggu berulang" },
      { slug: "other", label: "Lainnya" },
    ],
  },
  {
    slug: "hate",
    label: "Ujaran kebencian atau diskriminasi",
    hint: "Menyerang kelompok berdasarkan identitas mereka",
    subs: [
      { slug: "ethnic_religion", label: "Suku, agama, ras, atau antargolongan (SARA)" },
      { slug: "gender_orientation", label: "Gender atau orientasi seksual" },
      { slug: "disability", label: "Disabilitas atau kondisi kesehatan" },
      { slug: "other", label: "Lainnya" },
    ],
  },
  {
    slug: "violence",
    label: "Kekerasan atau ancaman",
    hint: "Ancaman, hasutan, konten kekerasan, ekstremisme",
    urgent: true,
    subs: [
      { slug: "threat", label: "Ancaman kekerasan" },
      { slug: "glorify", label: "Mengagungkan atau menghasut kekerasan" },
      { slug: "graphic", label: "Konten kekerasan yang mengerikan" },
      { slug: "extremism", label: "Terorisme atau ekstremisme" },
    ],
  },
  {
    slug: "self_harm",
    label: "Menyakiti diri sendiri atau bunuh diri",
    hint: "Seseorang yang tampak berisiko, atau konten yang mendorongnya",
    urgent: true,
    subs: [
      { slug: "at_risk", label: "Seseorang tampak berisiko menyakiti dirinya" },
      { slug: "promote", label: "Mendorong menyakiti diri atau gangguan makan" },
    ],
  },
  {
    slug: "sexual",
    label: "Konten seksual",
    hint: "Ketelanjangan, penawaran layanan seksual, konten intim tanpa izin",
    subs: [
      { slug: "nudity", label: "Ketelanjangan atau konten dewasa" },
      { slug: "solicitation", label: "Menawarkan layanan seksual" },
      { slug: "non_consensual", label: "Konten intim tanpa persetujuan" },
    ],
  },
  {
    slug: "child_safety",
    label: "Keselamatan anak",
    hint: "Konten seksual atau kekerasan yang melibatkan anak",
    urgent: true,
    subs: [
      { slug: "sexual_minor", label: "Konten seksual yang melibatkan anak" },
      { slug: "abuse_minor", label: "Kekerasan atau eksploitasi terhadap anak" },
    ],
  },
  {
    slug: "privacy",
    label: "Pelanggaran privasi",
    hint: "Data pribadi, foto tanpa izin, dokumen atau rahasia perusahaan",
    evidence: "recommended",
    subs: [
      { slug: "personal_data", label: "Membocorkan data pribadi (alamat, nomor telepon, dsb.)" },
      { slug: "photo_no_consent", label: "Foto atau video tanpa izin" },
      { slug: "private_doc", label: "Percakapan, CV, atau dokumen pribadi" },
      { slug: "company_secret", label: "Rahasia perusahaan" },
    ],
  },
  {
    slug: "defamation",
    label: "Fitnah atau pencemaran nama baik",
    hint: "Tuduhan tidak benar terhadap orang atau perusahaan",
    evidence: "recommended",
    subs: [
      { slug: "false_accusation_me", label: "Tuduhan tidak benar terhadap saya" },
      { slug: "false_accusation_company", label: "Tuduhan tidak benar terhadap perusahaan" },
      { slug: "false_accusation_other", label: "Tuduhan tidak benar terhadap orang lain" },
    ],
  },
  {
    slug: "misinformation",
    label: "Informasi palsu atau hoaks",
    hint: "Kabar bohong yang berpotensi merugikan",
    subs: [
      { slug: "health", label: "Hoaks kesehatan" },
      { slug: "politics", label: "Hoaks politik atau pemilu" },
      { slug: "other", label: "Informasi keliru lainnya" },
    ],
  },
  {
    slug: "ip",
    label: "Pelanggaran hak cipta atau merek",
    hint: "Karya atau merek dipakai tanpa izin",
    evidence: "recommended",
    subs: [
      { slug: "copyright", label: "Karya saya dipakai tanpa izin (hak cipta)" },
      { slug: "trademark", label: "Pelanggaran merek dagang" },
    ],
  },
  {
    slug: "other",
    label: "Lainnya",
    hint: "Masalah yang tidak ada di daftar di atas",
    subs: [],
  },
];

// Penjelasan wajib untuk kategori "Lainnya" atau sub-alasan "Lainnya".
export function detailsRequired(categorySlug, subSlug) {
  return categorySlug === "other" || subSlug === "other";
}
