// Data awal demo. Semua akun demo memakai kata sandi: demo1234
const hashPw = (pw) => {
  try {
    return btoa(unescape(encodeURIComponent("tw-demo:" + pw)));
  } catch {
    return "tw-demo:" + pw;
  }
};
const ago = (mins) => new Date(Date.now() - mins * 60_000).toISOString();

export function buildSeed(version) {
  const pw = hashPw("demo1234");
  const user = (o) => ({
    bio: "", avatar: "", banner: "", account_type: "personal", company_name: "",
    verification_status: "none", is_pro: false, mentor_subscription_active: false,
    profile_view_anonymous: false, email_notify_off: false, bubble_theme: "", pw, ...o,
  });

  const users = [
    user({ id: "u_rina", name: "Rina Pratama", email: "rina@demo.com", bio: "UI/UX designer. Suka kopi dan riset pengguna.", created_at: ago(60 * 24 * 90) }),
    user({ id: "u_budi", name: "Budi Santoso", email: "budi@demo.com", bio: "Backend engineer, 4 tahun pengalaman.", created_at: ago(60 * 24 * 70) }),
    user({ id: "u_sari", name: "Sari Wulandari", email: "sari@demo.com", bio: "HR generalist & career coach.", is_pro: true, created_at: ago(60 * 24 * 60) }),
    user({
      id: "u_biz", name: "PT Maju Digital", email: "hr@majudigital.com", account_type: "business",
      company_name: "PT Maju Digital", verification_status: "verified",
      bio: "Perusahaan teknologi yang membangun produk untuk UMKM Indonesia.", created_at: ago(60 * 24 * 120),
    }),
  ];

  const communities = [
    { id: "c_hr", name: "HR Indonesia", description: "Ruang diskusi praktisi HR: rekrutmen, kompensasi, dan budaya kerja.", owner_id: "u_sari", topic: "hr", join_type: "open", rules: "Saling menghargai.\nJangan menyebut nama perusahaan secara negatif.", member_count: 3, created_at: ago(60 * 24 * 50) },
    { id: "c_eng", name: "Engineer Talks", description: "Ngobrol santai seputar software engineering dan karier teknis.", owner_id: "u_budi", topic: "engineering", join_type: "open", rules: "Tanpa spam.", member_count: 2, created_at: ago(60 * 24 * 40) },
    { id: "c_switch", name: "Career Switchers", description: "Pindah karier? Mulai dari sini. Anggota perlu persetujuan pembuat.", owner_id: "u_sari", topic: "career", join_type: "approval", rules: "Ceritakan latar belakangmu saat meminta bergabung.", member_count: 1, created_at: ago(60 * 24 * 20) },
  ];
  const members = [
    { community_id: "c_hr", user_id: "u_sari", role: "owner" },
    { community_id: "c_hr", user_id: "u_rina", role: "member" },
    { community_id: "c_hr", user_id: "u_biz", role: "member" },
    { community_id: "c_eng", user_id: "u_budi", role: "owner" },
    { community_id: "c_eng", user_id: "u_rina", role: "member" },
    { community_id: "c_switch", user_id: "u_sari", role: "owner" },
  ];

  const post = (o) => ({
    is_anonymous: false, community_id: "", topic: "", as_company: false, company_verified: false,
    media: [], mood: "diskusi", likes: 0, reposts: 0, comment_count: 0, pinned_at: null, ...o,
  });
  const posts = [
    post({ id: "p1", author_id: "u_rina", author_name: "Rina Pratama", title: "Tips lolos wawancara desain: bawa cerita, bukan sekadar portofolio", body: "Setelah 6 kali wawancara bulan ini, pelajaran terbesarku: pewawancara ingin tahu proses berpikirmu. Ceritakan masalah, keputusan, dan dampaknya. Kalian punya tips lain?", mood: "diskusi", topic: "design", likes: 12, comment_count: 2, created_at: ago(35) }),
    post({ id: "p2", author_id: "u_budi", author_name: "Budi Santoso", title: "Akhirnya naik jabatan jadi Senior Engineer 🎉", body: "Tiga tahun konsisten belajar dan berbagi ilmu di tim. Terima kasih untuk mentor dan rekan-rekan yang sabar. Semangat buat yang masih berjuang!", mood: "positif", topic: "engineering", community_id: "c_eng", likes: 31, reposts: 3, comment_count: 1, created_at: ago(120) }),
    post({ id: "p3", author_id: "u_sari", author_name: "Anonim", is_anonymous: true, title: "Lembur tiap hari tapi dibilang 'itu sudah tugasmu'", body: "Sudah tiga bulan pulang jam 9 malam. Ketika bicara soal beban kerja, jawabannya selalu sama. Ada yang pernah di posisi ini? Bagaimana menyikapinya?", mood: "curhat", topic: "career", likes: 24, comment_count: 1, created_at: ago(300) }),
    post({ id: "p4", author_id: "u_sari", author_name: "Sari Wulandari", title: "Pertanyaan wawancara yang sebaiknya dihindari rekruter", body: "Pertanyaan soal status pernikahan atau rencana punya anak tidak relevan dengan kompetensi. Lebih baik fokus pada pengalaman dan skill yang dibutuhkan.", mood: "diskusi", topic: "hr", community_id: "c_hr", likes: 18, reposts: 2, comment_count: 0, created_at: ago(600), pinned_at: ago(590) }),
    post({ id: "p5", author_id: "u_biz", author_name: "PT Maju Digital", as_company: true, company_verified: true, title: "Kami membuka 3 posisi baru bulan ini!", body: "Frontend Engineer, Product Designer, dan Customer Success. Cek menu Lowongan untuk detail dan lamar langsung lewat Twekky.", mood: "positif", topic: "business", likes: 9, comment_count: 0, created_at: ago(900) }),
    post({ id: "p6", author_id: "u_rina", author_name: "Rina Pratama", title: "Manajer yang suka sekali rapat 'sebentar'", body: "Rapat sebentar yang ternyata dua jam, tiga kali sehari. Kapan waktunya mengerjakan pekerjaan sungguhan? 😅", mood: "sindiran", topic: "operations", likes: 40, reposts: 5, comment_count: 0, created_at: ago(60 * 26) }),
    post({ id: "p7", author_id: "u_budi", author_name: "Budi Santoso", title: "Belajar Go atau Rust untuk backend di 2026?", body: "Sedang mempertimbangkan pindah dari Node.js. Menurut kalian mana yang lebih masuk akal untuk tim kecil?", mood: "diskusi", topic: "engineering", community_id: "c_eng", likes: 7, comment_count: 0, created_at: ago(60 * 48) }),
  ];

  const comment = (o) => ({ parent_id: "", sticker: "", likes: 0, deleted: false, ...o });
  const comments = [
    comment({ id: "cm1", post_id: "p1", author_id: "u_sari", author_name: "Sari Wulandari", body: "Setuju! Struktur STAR membantu banget untuk bercerita.", likes: 3, created_at: ago(25) }),
    comment({ id: "cm2", post_id: "p1", parent_id: "cm1", author_id: "u_rina", author_name: "Rina Pratama", body: "Betul, Bu Sari. Aku latihan dulu di depan cermin 😄", created_at: ago(20) }),
    comment({ id: "cm3", post_id: "p2", author_id: "u_rina", author_name: "Rina Pratama", body: "Selamat Budi! Inspiratif sekali.", likes: 2, created_at: ago(100) }),
    comment({ id: "cm4", post_id: "p3", author_id: "u_budi", author_name: "Budi Santoso", body: "Coba catat jam kerja dan dampaknya, lalu bawa data itu ke atasan.", likes: 5, created_at: ago(250) }),
  ];

  const j = (o) => ({
    poster_id: "u_biz", company_name: "PT Maju Digital", is_verified: true, status: "active",
    salary_min: 0, salary_max: 0, views: 0, required_skills: [], level: "", work_mode: "",
    apply_mode: "quick", apply_url: "", boosted_until: null, is_boosted: false, ...o,
  });
  const jobs = [
    j({ id: "j1", title: "Frontend Engineer", description: "Membangun antarmuka web untuk produk UMKM kami menggunakan React.\n\nTanggung jawab:\n- Mengembangkan fitur baru\n- Menjaga kualitas kode\n- Berkolaborasi dengan desainer", location: "Jakarta", type: "full-time", salary_min: 12000000, salary_max: 18000000, views: 120, required_skills: ["React", "JavaScript", "Tailwind"], level: "1-3", work_mode: "hybrid", created_at: ago(60 * 24 * 2) }),
    j({ id: "j2", title: "Product Designer", description: "Merancang pengalaman produk dari riset hingga prototipe.", location: "Remote", type: "full-time", salary_min: 10000000, salary_max: 15000000, views: 85, required_skills: ["Figma", "UX Research"], level: "1-3", work_mode: "remote", created_at: ago(60 * 24 * 3) }),
    j({ id: "j3", title: "Customer Success Associate", description: "Mendampingi pelanggan UMKM agar sukses memakai produk kami.", location: "Bandung", type: "full-time", salary_min: 6000000, salary_max: 8000000, views: 60, required_skills: ["Komunikasi", "Problem Solving"], level: "fresh", work_mode: "onsite", created_at: ago(60 * 24 * 4) }),
    j({ id: "j4", title: "Content Writer (Magang)", description: "Menulis artikel blog dan materi edukasi untuk UMKM.", location: "Semarang", type: "internship", salary_min: 2000000, salary_max: 3000000, views: 44, required_skills: ["Copywriting", "SEO"], level: "student", work_mode: "hybrid", created_at: ago(60 * 24 * 5) }),
    j({ id: "j5", title: "Backend Engineer (Go)", description: "Membangun layanan API yang andal dan cepat.", location: "Remote", type: "freelance", salary_min: 15000000, salary_max: 22000000, views: 98, required_skills: ["Go", "SQL", "REST"], level: "3-5", work_mode: "remote", apply_mode: "external", apply_url: "https://example.com/careers/backend", created_at: ago(60 * 24 * 6) }),
  ];

  const inter = [
    { k: "follow", u: "u_rina", t: "u_budi" }, { k: "follow", u: "u_rina", t: "u_sari" },
    { k: "follow", u: "u_budi", t: "u_rina" }, { k: "follow", u: "u_sari", t: "u_rina" },
    { k: "like", u: "u_rina", t: "p2" }, { k: "like", u: "u_rina", t: "p4" },
  ];

  const notifications = [
    { id: "n1", user_id: "u_rina", type: "follow", text: "Budi Santoso mulai mengikuti kamu", link: "/pengguna/u_budi", read: false, created_at: ago(90) },
    { id: "n2", user_id: "u_rina", type: "comment", text: "Sari Wulandari mengomentari postmu", link: "/post/p1", read: false, created_at: ago(25) },
  ];

  return {
    v: version, users, posts, comments, communities, members, joinReqs: [], inter, blocks: [],
    notifications, messages: [], jobs, apps: [], viewers: [], careers: {}, reviews: [], reports: [],
    media: {}, companies: { u_biz: { tagline: "Teknologi untuk UMKM Indonesia", about: "PT Maju Digital membangun produk SaaS untuk membantu UMKM tumbuh.", website: "https://example.com", location: "Jakarta", industry: "Teknologi", size: "51-200", benefits: ["Asuransi kesehatan", "WFH fleksibel", "Budget belajar"], accent: "blue", logo: "", banner: "" } },
    subs: { u_biz: { user_id: "u_biz", plan: "growth", period: "yearly", started_at: ago(60 * 24 * 30), expires_at: new Date(Date.now() + 335 * 86400000).toISOString(), auto_renew: true } }, searches: [], screenings: {}, answers: {}, talent: [], evals: {}, notes: [], interviews: [],
    templates: [], verifs: [], profileViews: [], ext: [],
  };
}
