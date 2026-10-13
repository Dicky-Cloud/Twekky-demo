import { handleRequest, handleDownload } from "../mock/server";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
const TOKEN_KEY = "twekky_token";

// MODE DEMO (default): seluruh "backend" berjalan di browser (src/mock) dan data
// disimpan di localStorage, jadi aplikasi bisa dideploy sebagai situs statis
// (mis. Vercel). Set VITE_USE_MOCK=false untuk memakai backend Go sungguhan.
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

// Nilai "data:" / "blob:" (gambar yang diunggah di mode demo) dipakai apa adanya.
const isInline = (v) => typeof v === "string" && /^(data|blob):/.test(v);

// Ubah path media dari server (mis. "/api/media/file?name=...") jadi URL penuh.
export function mediaUrl(path) {
  if (!path) return "";
  if (isInline(path)) return path;
  return /^https?:\/\//.test(path) ? path : `${API_URL}${path}`;
}

// URL gambar logo/foto latar perusahaan dari nama berkas yang disimpan server.
export function companyImageUrl(name) {
  if (isInline(name)) return name;
  return name ? mediaUrl(`/api/companies/image?name=${encodeURIComponent(name)}`) : "";
}

// URL foto profil / foto sampul pengguna dari nama berkas yang disimpan server.
export function profileImageUrl(name) {
  if (isInline(name)) return name;
  return name ? mediaUrl(`/api/profile/image?name=${encodeURIComponent(name)}`) : "";
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// Core request helper. Every handler on the Go side returns JSON (either
// the resource, or {"error": "..."} on failure — see internal/utils/response.go),
// so we mirror that contract here: resolve with parsed JSON, or throw an
// Error whose message is the backend's error string.
async function request(path, { method = "GET", body, auth = false } = {}) {
  if (USE_MOCK) {
    try {
      return await handleRequest(path, { method, body });
    } catch (err) {
      throw new Error(err.message);
    }
  }
  // FormData (mis. unggah CV) dikirim apa adanya: browser yang mengisi
  // Content-Type multipart beserta boundary-nya, jadi JANGAN diset manual.
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const headers = isForm ? {} : { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

// Unduh file yang dilindungi login (mis. CV pelamar). Tautan <a href> biasa
// tidak bisa membawa header Authorization, jadi file diambil dengan fetch lalu
// disimpan lewat blob.
async function downloadFile(path, filename) {
  let blob;
  if (USE_MOCK) {
    try {
      const out = await handleDownload(path);
      blob = out.blob;
      filename = filename || out.filename;
    } catch (err) {
      throw new Error(err.message);
    }
  } else {
    const headers = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${path}`, { headers });
    if (!res.ok) {
      const isJson = res.headers.get("content-type")?.includes("application/json");
      const data = isJson ? await res.json().catch(() => null) : null;
      throw new Error(data?.error || `Gagal mengunduh file (${res.status})`);
    }
    blob = await res.blob();
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "file";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const api = {
  // auth
  register: (name, email, password) =>
    request("/api/auth/register", { method: "POST", body: { name, email, password } }),
  login: (email, password) =>
    request("/api/auth/login", { method: "POST", body: { email, password } }),
  forgotPassword: (email) => request("/api/auth/forgot-password", { method: "POST", body: { email } }),
  resetPassword: (token, password) =>
    request("/api/auth/reset-password", { method: "POST", body: { token, password } }),

  // profile
  me: () => request("/api/profile/me", { auth: true }),
  updateProfile: (name, bio) =>
    request("/api/profile/me", { method: "PUT", body: { name, bio }, auth: true }),
  // tema bubble chat (id dari constants/bubbleThemes.js); hasilnya user terbaru
  setBubbleTheme: (theme) =>
    request("/api/profile/bubble-theme", { method: "PUT", body: { theme }, auth: true }),
  // foto profil & foto sampul (kind: "avatar" | "banner"); hasilnya user terbaru
  uploadProfileImage: (kind, file) => {
    const body = new FormData();
    body.append("file", file);
    return request(`/api/profile/image?kind=${kind}`, { method: "POST", auth: true, body });
  },
  deleteProfileImage: (kind) =>
    request(`/api/profile/image?kind=${kind}`, { method: "DELETE", auth: true }),
  upgradeToBusiness: (companyName) =>
    request("/api/profile/business", {
      method: "POST",
      body: { company_name: companyName },
      auth: true,
    }),

  // feed
  // Satu halaman feed dari server: { items, next_cursor, total }.
  // tab: terbaru | populer | komunitasku | perusahaan; range: day | week | month | year.
  feedPage: ({ tab, range, q, topic, mood, cursor, limit = 20 } = {}) => {
    const params = new URLSearchParams();
    if (tab) params.set("tab", tab);
    if (range) params.set("range", range);
    if (q) params.set("q", q);
    if (topic) params.set("topic", topic);
    if (mood) params.set("mood", mood);
    if (cursor) params.set("cursor", cursor);
    params.set("limit", String(limit));
    return request(`/api/feed?${params.toString()}`, { auth: true });
  },
  listFeed: (mood, communityId, topic) => {
    const params = new URLSearchParams();
    if (mood) params.set("mood", mood);
    if (communityId) params.set("community_id", communityId);
    if (topic) params.set("topic", topic);
    const qs = params.toString();
    // auth: token ikut dikirim bila login, agar post anonim milik sendiri tetap terbaca
    return request(`/api/feed${qs ? `?${qs}` : ""}`, { auth: true });
  },
  createPost: ({ title, body, mood, communityId, topic, isAnonymous, asCompany, mediaIds }) =>
    request("/api/feed", {
      method: "POST",
      auth: true,
      body: {
        title,
        body,
        mood,
        community_id: communityId || "",
        topic: topic || "",
        is_anonymous: !!isAnonymous,
        as_company: !!asCompany,
        media_ids: mediaIds || [],
      },
    }),
  // unggah satu gambar/video untuk post; hasilnya {id, type, url}
  uploadMedia: (file) => {
    const body = new FormData();
    body.append("file", file);
    return request("/api/media", { method: "POST", auth: true, body });
  },
  likePost: (id) => request(`/api/feed/like?id=${encodeURIComponent(id)}`, { method: "POST", auth: true }),
  // batal suka, simpan, bagikan, dan hapus post (server menyimpan per akun)
  unlikePost: (id) => request(`/api/feed/like?id=${encodeURIComponent(id)}`, { method: "DELETE", auth: true }),
  savePost: (id) => request(`/api/feed/save?id=${encodeURIComponent(id)}`, { method: "POST", auth: true }),
  unsavePost: (id) => request(`/api/feed/save?id=${encodeURIComponent(id)}`, { method: "DELETE", auth: true }),
  sharePost: (id) => request(`/api/feed/share?id=${encodeURIComponent(id)}`, { method: "POST", auth: true }),
  unsharePost: (id) => request(`/api/feed/share?id=${encodeURIComponent(id)}`, { method: "DELETE", auth: true }),
  deletePost: (id) => request(`/api/feed?id=${encodeURIComponent(id)}`, { method: "DELETE", auth: true }),
  myPostState: () => request("/api/feed/me", { auth: true }), // { liked: [], saved: [], shared: [] }
  savedPosts: () => request("/api/feed/saved", { auth: true }),
  sharedPosts: () => request("/api/feed/shared", { auth: true }),
  // repost: tampil di feed pengikut dan tab "Repost" profil
  repostPost: (id) => request(`/api/feed/repost?id=${encodeURIComponent(id)}`, { method: "POST", auth: true }),
  unrepostPost: (id) => request(`/api/feed/repost?id=${encodeURIComponent(id)}`, { method: "DELETE", auth: true }),
  repostedPosts: () => request("/api/feed/reposted", { auth: true }),
  // feed dari akun yang diikuti (termasuk repost mereka)
  followingFeed: () => request("/api/feed/following", { auth: true }),
  // ikuti / berhenti ikuti; statistik { followers: [ids], following: [ids], is_following }
  followUser: (id) => request(`/api/follow?id=${encodeURIComponent(id)}`, { method: "POST", auth: true }),
  unfollowUser: (id) => request(`/api/follow?id=${encodeURIComponent(id)}`, { method: "DELETE", auth: true }),
  followStats: (id) => request(`/api/follow${id ? `?id=${encodeURIComponent(id)}` : ""}`, { auth: true }),

  // communities
  listCommunities: () => request("/api/communities"),
  getCommunity: (id) => request(`/api/communities/detail?id=${encodeURIComponent(id)}`),
  createCommunity: ({ name, description, topic, joinType, rules }) =>
    request("/api/communities", {
      method: "POST",
      auth: true,
      body: { name, description, topic, join_type: joinType, rules },
    }),
  // hanya pemilik; semua post di komunitas ikut pindah ke topik baru
  setCommunityTopic: (id, topic) =>
    request(`/api/communities/topic?id=${encodeURIComponent(id)}`, { method: "POST", auth: true, body: { topic } }),
  // co-admin: hanya pembuat komunitas; admin=false untuk mencabut
  setCommunityAdmin: (id, userId, admin) =>
    request(`/api/communities/admins?id=${encodeURIComponent(id)}&user_id=${encodeURIComponent(userId)}`, {
      method: "POST",
      auth: true,
      body: { admin },
    }),
  joinCommunity: (id) =>
    request(`/api/communities/join?id=${encodeURIComponent(id)}`, { method: "POST", auth: true }),
  leaveCommunity: (id) =>
    request(`/api/communities/leave?id=${encodeURIComponent(id)}`, { method: "POST", auth: true }),
  listJoinedCommunities: () => request("/api/communities/joined", { auth: true }),
  listCommunityMembers: (id) =>
    request(`/api/communities/members?id=${encodeURIComponent(id)}`, { auth: true }),
  pinCommunityPost: (communityId, postId, pinned) =>
    request(`/api/communities/posts/pin?id=${encodeURIComponent(communityId)}&post=${encodeURIComponent(postId)}`, {
      method: "POST",
      auth: true,
      body: { pinned },
    }),

  // join dengan persetujuan pembuat komunitas
  requestJoinCommunity: (id, message) =>
    request(`/api/communities/requests?id=${encodeURIComponent(id)}`, {
      method: "POST",
      auth: true,
      body: { message },
    }),
  cancelJoinRequest: (id) =>
    request(`/api/communities/requests/cancel?id=${encodeURIComponent(id)}`, {
      method: "POST",
      auth: true,
    }),
  listMyJoinRequests: () => request("/api/communities/my-requests", { auth: true }),
  listJoinRequests: (id) =>
    request(`/api/communities/requests?id=${encodeURIComponent(id)}`, { auth: true }),
  approveJoinRequest: (id, userId) =>
    request(
      `/api/communities/requests/approve?id=${encodeURIComponent(id)}&user_id=${encodeURIComponent(userId)}`,
      { method: "POST", auth: true }
    ),
  rejectJoinRequest: (id, userId) =>
    request(
      `/api/communities/requests/reject?id=${encodeURIComponent(id)}&user_id=${encodeURIComponent(userId)}`,
      { method: "POST", auth: true }
    ),

  // jobs
  listJobs: (type, q) => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (q) params.set("q", q);
    const qs = params.toString();
    return request(`/api/jobs${qs ? `?${qs}` : ""}`, { auth: true });
  },
  skillSuggestions: () => request("/api/skills"),
  createJob: ({
    title, description, location, type, salaryMin, salaryMax,
    requiredSkills = [], level = "", workMode = "", applyMode = "quick", applyUrl = "",
  }) =>
    request("/api/jobs", {
      method: "POST",
      auth: true,
      body: {
        title,
        description,
        location,
        type,
        salary_min: Number(salaryMin) || 0,
        salary_max: Number(salaryMax) || 0,
        required_skills: requiredSkills,
        level,
        work_mode: workMode,
        apply_mode: applyMode,
        apply_url: applyMode === "external" ? applyUrl.trim() : "",
      },
    }),
  // formData: name, email, phone, english_level, experience, skills, cover_letter, cv (file)
  applyJob: (id, formData) =>
    request(`/api/jobs/apply?id=${encodeURIComponent(id)}`, { method: "POST", auth: true, body: formData }),
  // batal melamar (id = id lowongan)
  withdrawApplication: (id) =>
    request(`/api/jobs/apply?id=${encodeURIComponent(id)}`, { method: "DELETE", auth: true }),
  // menambah penghitung "dilihat"; kegagalannya sengaja diabaikan
  // (bila login, kunjungan juga tercatat di "pelihat lowongan" milik perekrut)
  viewJob: (id) =>
    request(`/api/jobs/view?id=${encodeURIComponent(id)}`, { method: "POST", auth: true }).catch(() => null),
  // pertanyaan penyaring yang harus dijawab pelamar (tanpa jawaban ideal)
  screeningQuestions: (jobId) => request(`/api/jobs/screening?id=${encodeURIComponent(jobId)}`, { auth: true }),
  // perekrut: atur pertanyaan, lihat jawaban & penanda, pelihat lowongan
  getScreening: (jobId) => request(`/api/recruitment/screening?id=${encodeURIComponent(jobId)}`, { auth: true }),
  saveScreening: (jobId, questions) =>
    request(`/api/recruitment/screening?id=${encodeURIComponent(jobId)}`, { method: "PUT", auth: true, body: { questions } }),
  screeningFlags: () => request("/api/recruitment/screening/flags", { auth: true }),
  applicantScreening: (applicationId) =>
    request(`/api/recruitment/applicants/screening?id=${encodeURIComponent(applicationId)}`, { auth: true }),
  jobViewers: (jobId) => request(`/api/recruitment/jobs/viewers?id=${encodeURIComponent(jobId)}`, { auth: true }),
  // verifikasi perusahaan (akun Bisnis)
  getVerification: () => request("/api/business/verification", { auth: true }),
  submitVerification: (formData) => request("/api/business/verification", { method: "POST", auth: true, body: formData }),
  myApplications: () => request("/api/jobs/my-applications", { auth: true }),
  // lowongan tersimpan (per akun)
  saveJob: (id) => request(`/api/jobs/save?id=${encodeURIComponent(id)}`, { method: "POST", auth: true }),
  unsaveJob: (id) => request(`/api/jobs/save?id=${encodeURIComponent(id)}`, { method: "DELETE", auth: true }),
  savedJobs: () => request("/api/jobs/saved", { auth: true }), // { ids: [], jobs: [] }
  // profil karier & CV tersimpan
  getCareerProfile: () => request("/api/profile/career", { auth: true }),
  saveCareerProfile: (career) => request("/api/profile/career", { method: "PUT", auth: true, body: career }),
  uploadProfileCV: (file) => {
    const body = new FormData();
    body.append("cv", file);
    return request("/api/profile/cv", { method: "POST", auth: true, body });
  },
  deleteProfileCV: (id) => request(`/api/profile/cv?id=${encodeURIComponent(id)}`, { method: "DELETE", auth: true }),
  setPrimaryProfileCV: (id) => request(`/api/profile/cv/primary?id=${encodeURIComponent(id)}`, { method: "PUT", auth: true }),
  downloadProfileCV: (id, filename) => downloadFile(`/api/profile/cv?id=${encodeURIComponent(id)}`, filename),
  // lamar lewat situs perusahaan
  externalApplyInfo: (id) => request(`/api/jobs/external?id=${encodeURIComponent(id)}`, { auth: true }),
  externalApplyClick: (id) =>
    request(`/api/jobs/external/click?id=${encodeURIComponent(id)}`, { method: "POST", auth: true }),
  externalApplyDone: (id) =>
    request(`/api/jobs/external/applied?id=${encodeURIComponent(id)}`, { method: "POST", auth: true }),
  myExternalApplications: () => request("/api/jobs/my-external", { auth: true }),

  // Twekky Pro
  proMe: () => request("/api/pro/me", { auth: true }),
  proSubscribe: () => request("/api/pro/subscribe", { method: "POST", auth: true }),
  proCancel: () => request("/api/pro/cancel", { method: "POST", auth: true }),
  listSearches: () => request("/api/pro/searches", { auth: true }),
  createSearch: (body) => request("/api/pro/searches", { method: "POST", auth: true, body }),
  deleteSearch: (id) =>
    request(`/api/pro/searches?id=${encodeURIComponent(id)}`, { method: "DELETE", auth: true }),
  sendFollowUp: (id, body) =>
    request(`/api/jobs/my-applications/follow-up?id=${encodeURIComponent(id)}`, {
      method: "POST",
      auth: true,
      body: { body },
    }),
  saveApplicationNote: (id, note, remindAt = "") =>
    request(`/api/jobs/my-applications/note?id=${encodeURIComponent(id)}`, {
      method: "POST",
      auth: true,
      body: { note, remind_at: remindAt },
    }),

  // rekrutmen (akun Bisnis)
  recruitmentJobs: () => request("/api/recruitment/jobs", { auth: true }),
  setRecruitmentJobStatus: (id, status) =>
    request(`/api/recruitment/jobs/status?id=${encodeURIComponent(id)}`, {
      method: "POST",
      auth: true,
      body: { status },
    }),
  recruitmentApplicants: (jobId) =>
    request(`/api/recruitment/applicants${jobId ? `?job_id=${encodeURIComponent(jobId)}` : ""}`, {
      auth: true,
    }),
  recruitmentApplicant: (id) =>
    request(`/api/recruitment/applicants/detail?id=${encodeURIComponent(id)}`, { auth: true }),
  setApplicantStatus: (id, status) =>
    request(`/api/recruitment/applicants/status?id=${encodeURIComponent(id)}`, {
      method: "POST",
      auth: true,
      body: { status },
    }),
  // Surat pengantar pelamar sebagai PDF (dibuat server saat diminta).
  downloadApplicantCoverLetter: (id, filename) =>
    downloadFile(`/api/recruitment/applicants/cover-letter?id=${encodeURIComponent(id)}`, filename),
  downloadApplicantCV: (id, filename) =>
    downloadFile(`/api/recruitment/applicants/cv?id=${encodeURIComponent(id)}`, filename),
  // ekspor pelamar ke CSV, mengikuti filter lowongan & status yang sedang aktif
  exportApplicantsCSV: (jobId, status) => {
    const q = new URLSearchParams();
    if (jobId) q.set("job_id", jobId);
    if (status) q.set("status", status);
    const date = new Date().toISOString().slice(0, 10);
    return downloadFile(`/api/recruitment/applicants/export?${q.toString()}`, `pelamar-${date}.csv`);
  },
  recruitmentStats: () => request("/api/recruitment/stats", { auth: true }),
  // catatan internal pelamar & template pesan (paket Growth)
  applicantNotes: (appId) =>
    request(`/api/recruitment/applicants/notes?id=${encodeURIComponent(appId)}`, { auth: true }),
  addApplicantNote: (appId, body) =>
    request(`/api/recruitment/applicants/notes?id=${encodeURIComponent(appId)}`, { method: "POST", auth: true, body: { body } }),
  updateApplicantNote: (appId, noteId, body) =>
    request(
      `/api/recruitment/applicants/notes?id=${encodeURIComponent(appId)}&note_id=${encodeURIComponent(noteId)}`,
      { method: "PUT", auth: true, body: { body } }
    ),
  deleteApplicantNote: (appId, noteId) =>
    request(
      `/api/recruitment/applicants/notes?id=${encodeURIComponent(appId)}&note_id=${encodeURIComponent(noteId)}`,
      { method: "DELETE", auth: true }
    ),
  messageTemplates: (kind) =>
    request(`/api/recruitment/templates${kind ? `?kind=${encodeURIComponent(kind)}` : ""}`, { auth: true }),
  createMessageTemplate: (data) => request("/api/recruitment/templates", { method: "POST", auth: true, body: data }),
  updateMessageTemplate: (id, data) =>
    request(`/api/recruitment/templates?id=${encodeURIComponent(id)}`, { method: "PUT", auth: true, body: data }),
  deleteMessageTemplate: (id) =>
    request(`/api/recruitment/templates?id=${encodeURIComponent(id)}`, { method: "DELETE", auth: true }),
  renderMessageTemplate: (templateId, applicationId) =>
    request("/api/recruitment/templates/render", {
      method: "POST",
      auth: true,
      body: { template_id: templateId, application_id: applicationId },
    }),
  boostJob: (id) => request(`/api/recruitment/jobs/boost?id=${encodeURIComponent(id)}`, { method: "POST", auth: true }),
  unboostJob: (id) => request(`/api/recruitment/jobs/unboost?id=${encodeURIComponent(id)}`, { method: "POST", auth: true }),

  // skor kecocokan, penilaian pelamar, talent pool, wawancara (paket Growth)
  recruitmentMatches: (jobId) =>
    request(`/api/recruitment/match${jobId ? `?job_id=${encodeURIComponent(jobId)}` : ""}`, { auth: true }),
  evaluations: () => request("/api/recruitment/evaluations", { auth: true }),
  applicantEvaluation: (appId) =>
    request(`/api/recruitment/applicants/evaluation?id=${encodeURIComponent(appId)}`, { auth: true }),
  saveEvaluation: (appId, data) =>
    request(`/api/recruitment/applicants/evaluation?id=${encodeURIComponent(appId)}`, { method: "PUT", auth: true, body: data }),
  talentPool: () => request("/api/recruitment/talent", { auth: true }),
  addToTalentPool: (applicationId, note) =>
    request("/api/recruitment/talent", { method: "POST", auth: true, body: { application_id: applicationId, note } }),
  updateTalentNote: (id, note) =>
    request(`/api/recruitment/talent?id=${encodeURIComponent(id)}`, { method: "PUT", auth: true, body: { note } }),
  removeFromTalentPool: (id) =>
    request(`/api/recruitment/talent?id=${encodeURIComponent(id)}`, { method: "DELETE", auth: true }),
  recruitmentInterviews: (applicationId) =>
    request(`/api/recruitment/interviews${applicationId ? `?application_id=${encodeURIComponent(applicationId)}` : ""}`, { auth: true }),
  createInterview: (data) => request("/api/recruitment/interviews", { method: "POST", auth: true, body: data }),
  updateInterview: (id, data) =>
    request(`/api/recruitment/interviews?id=${encodeURIComponent(id)}`, { method: "PUT", auth: true, body: data }),
  cancelInterview: (id) =>
    request(`/api/recruitment/interviews?id=${encodeURIComponent(id)}`, { method: "DELETE", auth: true }),
  myInterviews: () => request("/api/jobs/my-interviews", { auth: true }),
  respondInterview: (id, response, note) =>
    request(`/api/jobs/my-interviews/respond?id=${encodeURIComponent(id)}`, { method: "POST", auth: true, body: { response, note } }),

  // paket Bisnis (langganan) & halaman perusahaan
  businessPlans: () => request("/api/business/plans"),
  businessMe: () => request("/api/business/me", { auth: true }),
  businessSubscribe: (plan, period) =>
    request("/api/business/subscribe", { method: "POST", auth: true, body: { plan, period } }),
  businessCancelSubscription: () =>
    request("/api/business/subscription/cancel", { method: "POST", auth: true }),
  updateCompany: (data) => request("/api/business/company", { method: "PUT", auth: true, body: data }),
  getCompany: (id) => request(`/api/companies/detail?id=${encodeURIComponent(id)}`),
  // logo & foto latar perusahaan (kind: "logo" | "banner")
  uploadCompanyImage: (kind, file) => {
    const body = new FormData();
    body.append("file", file);
    return request(`/api/business/company/image?kind=${kind}`, { method: "POST", auth: true, body });
  },
  deleteCompanyImage: (kind) =>
    request(`/api/business/company/image?kind=${kind}`, { method: "DELETE", auth: true }),
  // ulasan perusahaan (sort: "newest" | "highest" | "lowest")
  getCompanyReviews: (companyId, sort = "newest") =>
    request(`/api/companies/reviews?id=${encodeURIComponent(companyId)}&sort=${encodeURIComponent(sort)}`, {
      auth: true,
    }),
  createCompanyReview: (companyId, data) =>
    request(`/api/companies/reviews?id=${encodeURIComponent(companyId)}`, { method: "POST", auth: true, body: data }),
  updateCompanyReview: (companyId, data) =>
    request(`/api/companies/reviews?id=${encodeURIComponent(companyId)}`, { method: "PUT", auth: true, body: data }),
  deleteCompanyReview: (companyId) =>
    request(`/api/companies/reviews?id=${encodeURIComponent(companyId)}`, { method: "DELETE", auth: true }),

  // blokir pengguna
  listBlocks: () => request("/api/blocks", { auth: true }),
  blockUser: (userId) => request("/api/blocks", { method: "POST", auth: true, body: { user_id: userId } }),
  unblockUser: (userId) =>
    request(`/api/blocks?user_id=${encodeURIComponent(userId)}`, { method: "DELETE", auth: true }),

  // siapa yang melihat profilmu
  // kegagalan pencatatan kunjungan sengaja diabaikan (tidak boleh mengganggu halaman)
  recordProfileView: (userId) =>
    request(`/api/profile/view?id=${encodeURIComponent(userId)}`, { method: "POST", auth: true }).catch(() => null),
  profileViews: () => request("/api/pro/profile-views", { auth: true }),
  setViewPrivacy: (anonymous) =>
    request("/api/profile/view-privacy", { method: "PUT", auth: true, body: { anonymous } }),

  // users
  searchUsers: (q) => request(`/api/users/search?q=${encodeURIComponent(q)}`, { auth: true }),
  lookupUsers: (ids) =>
    request(`/api/users/lookup?ids=${encodeURIComponent(ids.join(","))}`, { auth: true }),

  // messages
  listMessages: () => request("/api/messages", { auth: true }),
  sendMessage: (toUserId, body) =>
    request("/api/messages", { method: "POST", auth: true, body: { to_user_id: toUserId, body } }),

  // notifications
  listNotifications: () => request("/api/notifications", { auth: true }),
  // email untuk ikutan & repost; status tersimpan di field email_notify_off profil
  setEmailNotifications: (enabled) =>
    request("/api/notifications/email", { method: "PUT", auth: true, body: { enabled } }),
  markAllNotificationsRead: () => request("/api/notifications/read", { method: "POST", auth: true }),

  // post detail + comments
  getPost: (id) => request(`/api/feed/post?id=${encodeURIComponent(id)}`, { auth: true }),
  // laporan post: body = FormData (post_id, category, subcategory, details, evidence[]),
  // dikirim sebagai multipart oleh ReportPostModal
  reportPost: (formData) => request("/api/reports", { method: "POST", auth: true, body: formData }),
  // id post yang sudah saya laporkan (untuk menonaktifkan tombol Laporkan)
  reportedPostIds: () => request("/api/feed/reported", { auth: true }),
  listComments: (postId) => request(`/api/feed/comments?post_id=${encodeURIComponent(postId)}`, { auth: true }),
  
  // post_id tetap di URL. Body membawa teks, stiker, dan parent_id (kosong = komentar
  // tingkat atas). Komentar boleh teks saja, stiker saja, atau keduanya.
  createComment: async (postId, { body = "", sticker = "", parentId = "" } = {}) => {
    if (!postId) throw new Error("post_id tidak boleh kosong");
    const text = (body || "").trim();
    if (!text && !sticker) throw new Error("Isi komentar tidak boleh kosong");

    return request(`/api/feed/comments?post_id=${encodeURIComponent(postId)}`, {
      method: "POST",
      auth: true,
      body: { body: text, sticker: sticker || "", parent_id: parentId || "" },
    });
  },

  // CATATAN: path endpoint di bawah ini mengikuti pola endpoint lain (`?id=`).
  // Sesuaikan kalau route di backend Go-mu berbeda.
  likeComment: (id) =>
    request(`/api/feed/comments/like?id=${encodeURIComponent(id)}`, { method: "POST", auth: true }),
  unlikeComment: (id) =>
    request(`/api/feed/comments/like?id=${encodeURIComponent(id)}`, { method: "DELETE", auth: true }),
  deleteComment: (id) =>
    request(`/api/feed/comments?id=${encodeURIComponent(id)}`, { method: "DELETE", auth: true }),
};