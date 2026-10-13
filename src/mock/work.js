// Endpoint lowongan kerja: lowongan, lamaran, profil karier, rekrutmen, bisnis, Pro.
import { nowIso, uid } from "./db";
import {
  on, onDownload, fail, need, needBiz, str, byNewest, userById, addInter, delInter, idsOf, notify,
  fileOf, readAsDataUrl, dataUrlToBlob, imageToDataUrl, makePdf,
} from "./core";

const SKILLS = ["JavaScript", "TypeScript", "React", "Vue", "Node.js", "Go", "Python", "Java", "SQL", "PostgreSQL", "MySQL", "REST", "GraphQL", "Docker", "AWS", "Figma", "UX Research", "UI Design", "Copywriting", "SEO", "Digital Marketing", "Excel", "Akuntansi", "Komunikasi", "Problem Solving", "Public Speaking", "Manajemen Proyek", "Customer Service", "Data Analysis", "Tailwind"];
const JOB_TYPES = ["full-time", "part-time", "freelance", "internship"];
const LEVELS = ["", "sma", "student", "student-final", "fresh", "1-3", "3-5", "5+"];
const MODES = ["", "onsite", "remote", "hybrid"];
const APP_STATUS = ["new", "reviewed", "interview", "accepted", "rejected"];
const APP_LABEL = { new: "Baru", reviewed: "Ditinjau", interview: "Wawancara", accepted: "Diterima", rejected: "Ditolak" };

const PLANS = [
  { id: "starter", name: "Starter", price_monthly: 0, price_yearly: 0, max_active_jobs: 2, max_boosts: 0, boost_days: 0, company_customization: false, max_company_posts_per_day: 2, applicant_notes: false, max_message_templates: 0, max_screening_questions: 0, job_viewer_list: false, match_score: false, applicant_ratings: false, max_talent_pool: 0, interview_scheduling: false },
  { id: "growth", name: "Growth", price_monthly: 299000, price_yearly: 2990000, max_active_jobs: 10, max_boosts: 3, boost_days: 7, company_customization: true, max_company_posts_per_day: 10, applicant_notes: true, max_message_templates: 10, max_screening_questions: 5, job_viewer_list: true, match_score: true, applicant_ratings: true, max_talent_pool: 100, interview_scheduling: true },
];
const subActive = (s) => s && new Date(s.expires_at) > new Date();
const planOf = (db, userId) => {
  const s = db.subs[userId];
  return subActive(s) ? PLANS.find((p) => p.id === s.plan) || PLANS[0] : PLANS[0];
};
const isBoosted = (j) => !!j.boosted_until && new Date(j.boosted_until) > new Date();

const jobOut = (db, j, viewer) => {
  const { apply_url, ...rest } = j; // eslint-disable-line no-unused-vars
  const poster = userById(db, j.poster_id);
  const out = { ...rest, company_name: poster?.company_name || j.company_name, is_verified: poster?.verification_status === "verified", is_boosted: isBoosted(j) };
  if (viewer?.is_pro && j.apply_mode !== "external") out.applicant_count = db.apps.filter((a) => a.job_id === j.id).length;
  return out;
};
const jobById = (db, id) => db.jobs.find((j) => j.id === id);

// ================= LOWONGAN =================
on("GET", "/api/skills", () => SKILLS);
on("GET", "/api/jobs", (c) => {
  const type = c.q.get("type"), q = str(c.q.get("q")).toLowerCase();
  const list = c.db.jobs.filter((j) => {
    if (j.status === "closed") return false;
    if (type && j.type !== type) return false;
    if (q) {
      const hay = `${j.title} ${j.company_name} ${j.description} ${j.location} ${(j.required_skills || []).join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  return list.sort((a, b) => Number(isBoosted(b)) - Number(isBoosted(a)) || byNewest(a, b)).map((j) => jobOut(c.db, j, c.user));
});
on("POST", "/api/jobs", (c) => {
  const u = needBiz(c);
  const b = c.body;
  const title = str(b.title), description = str(b.description), location = str(b.location);
  if (!title) fail(400, "Judul lowongan wajib diisi");
  if (!description) fail(400, "Deskripsi wajib diisi");
  if (!location) fail(400, "Lokasi wajib diisi");
  if (!JOB_TYPES.includes(b.type)) fail(400, "Jenis pekerjaan tidak valid");
  if (!LEVELS.includes(b.level || "")) fail(400, "Level tidak valid");
  if (!MODES.includes(b.work_mode || "")) fail(400, "Mode kerja tidak valid");
  const mode = b.apply_mode === "external" ? "external" : "quick";
  if (mode === "external" && !/^https?:\/\/\S+\.\S+/.test(str(b.apply_url))) fail(400, "Tautan lamaran harus berupa URL http(s) yang valid");
  const min = Number(b.salary_min) || 0, max = Number(b.salary_max) || 0;
  if (min && max && min > max) fail(400, "Gaji minimum tidak boleh melebihi maksimum");
  const plan = planOf(c.db, u.id);
  const active = c.db.jobs.filter((j) => j.poster_id === u.id && j.status === "active").length;
  if (active >= plan.max_active_jobs) fail(403, `Batas ${plan.max_active_jobs} lowongan aktif paket ${plan.name} tercapai. Upgrade paket untuk menambah.`);
  const j = {
    id: uid("j_"), poster_id: u.id, company_name: u.company_name, is_verified: u.verification_status === "verified",
    title, description, location, type: b.type, status: "active", salary_min: min, salary_max: max, views: 0,
    created_at: nowIso(), required_skills: (b.required_skills || []).map(str).filter(Boolean), level: b.level || "",
    work_mode: b.work_mode || "", apply_mode: mode, apply_url: mode === "external" ? str(b.apply_url) : "",
    boosted_until: null, is_boosted: false,
  };
  c.db.jobs.push(j);
  return jobOut(c.db, j, u);
});
on("POST", "/api/jobs/view", (c) => {
  const j = jobById(c.db, c.q.get("id"));
  if (!j) return { ok: true };
  j.views = (j.views || 0) + 1;
  if (c.user && c.user.id !== j.poster_id) c.db.viewers.push({ job_id: j.id, viewer_id: c.user.id, anonymous: !!c.user.profile_view_anonymous, at: nowIso() });
  return { ok: true };
});
for (const m of ["POST", "DELETE"]) {
  on(m, "/api/jobs/save", (c) => {
    const u = need(c);
    const j = jobById(c.db, c.q.get("id"));
    if (!j) fail(404, "Lowongan tidak ditemukan");
    if (c.method === "POST") addInter(c.db, "jsave", u.id, j.id);
    else delInter(c.db, "jsave", u.id, j.id);
    return { ok: true, saved: c.method === "POST" };
  });
}
on("GET", "/api/jobs/saved", (c) => {
  const u = need(c);
  const ids = idsOf(c.db, "jsave", u.id);
  return { ids, jobs: ids.map((id) => jobById(c.db, id)).filter(Boolean).map((j) => jobOut(c.db, j, u)) };
});

// ================= PENYARING (SCREENING) =================
const questionsOf = (db, jobId) => db.screenings[jobId] || [];
on("GET", "/api/jobs/screening", (c) => {
  need(c);
  return questionsOf(c.db, c.q.get("id")).map(({ ideal, ...q }) => q); // eslint-disable-line no-unused-vars
});
on("GET", "/api/recruitment/screening", (c) => {
  const u = needBiz(c);
  const j = jobById(c.db, c.q.get("id"));
  if (!j || j.poster_id !== u.id) fail(404, "Lowongan tidak ditemukan");
  return { questions: questionsOf(c.db, j.id), max: planOf(c.db, u.id).max_screening_questions };
});
on("PUT", "/api/recruitment/screening", (c) => {
  const u = needBiz(c);
  const j = jobById(c.db, c.q.get("id"));
  if (!j || j.poster_id !== u.id) fail(404, "Lowongan tidak ditemukan");
  const plan = planOf(c.db, u.id);
  const qs = (c.body.questions || []).filter((q) => str(q.text));
  if (qs.length > plan.max_screening_questions) fail(403, `Paket ${plan.name} hanya mendukung ${plan.max_screening_questions} pertanyaan`);
  c.db.screenings[j.id] = qs.map((q) => ({ ...q, id: q.id || uid("q_") }));
  return { questions: c.db.screenings[j.id], max: plan.max_screening_questions };
});
on("GET", "/api/recruitment/screening/flags", (c) => {
  const u = needBiz(c);
  const out = {};
  c.db.apps.filter((a) => jobById(c.db, a.job_id)?.poster_id === u.id).forEach((a) => {
    const r = c.db.answers[a.id];
    if (r) out[a.id] = { evaluated: r.evaluated, mismatches: r.mismatches };
  });
  return out;
});
on("GET", "/api/recruitment/applicants/screening", (c) => {
  needBiz(c);
  return c.db.answers[c.q.get("id")] || { application_id: c.q.get("id"), answers: [], evaluated: 0, mismatches: 0 };
});

// ================= LAMARAN =================
const stripApp = (a) => {
  const { cv_data, note, follow_ups, last_follow_up_at, remind_at, answers, ...rest } = a; // eslint-disable-line no-unused-vars
  return rest;
};
const careerOf = (db, id) => (db.careers[id] ||= { career: null, cvs: [] });

on("POST", "/api/jobs/apply", async (c) => {
  const u = need(c);
  const j = jobById(c.db, c.q.get("id"));
  if (!j) fail(404, "Lowongan tidak ditemukan");
  if (j.status === "closed") fail(400, "Lowongan sudah ditutup");
  if (j.apply_mode === "external") fail(400, "Lowongan ini melamar lewat situs perusahaan");
  if (j.poster_id === u.id) fail(400, "Kamu tidak bisa melamar lowonganmu sendiri");
  if (c.db.apps.some((a) => a.job_id === j.id && a.applicant_id === u.id)) fail(409, "Kamu sudah melamar lowongan ini");
  const b = c.body;
  const name = str(b.name), email = str(b.email);
  if (!name || !email) fail(400, "Nama dan email wajib diisi");
  let cv = { name: "", size: 0, data: "" };
  if (b.use_saved_cv) {
    const saved = careerOf(c.db, u.id).cvs.find((x) => x.id === b.cv_id);
    if (!saved) fail(400, "CV tersimpan tidak ditemukan");
    cv = { name: saved.name, size: saved.size, data: saved.data };
  } else {
    const f = fileOf(c, "cv");
    if (f) cv = { name: f.name, size: f.size, data: f.size <= 700 * 1024 ? await readAsDataUrl(f) : "" };
  }
  const poster = userById(c.db, j.poster_id);
  const quota = c.db.apps.filter((a) => a.applicant_id === u.id && a.is_priority && a.created_at.slice(0, 7) === nowIso().slice(0, 7)).length;
  const priority = b.priority === "1" && u.is_pro && quota < 3;
  const qs = questionsOf(c.db, j.id);
  const app = {
    id: uid("a_"), job_id: j.id, applicant_id: u.id, name, email, phone: str(b.phone), english_level: str(b.english_level),
    experience: str(b.experience), skills: str(b.skills), cover_letter: str(b.cover_letter),
    work_authorization: str(b.work_authorization), needs_sponsorship: str(b.needs_sponsorship),
    cv_name: cv.name, cv_size: cv.size, cv_data: cv.data, status: "new", created_at: nowIso(), updated_at: nowIso(),
    is_priority: priority, viewed_at: null, note: "", follow_ups: 0, last_follow_up_at: null, remind_at: null,
  };
  if (qs.length) {
    let given = {};
    try { given = JSON.parse(b.answers || "{}"); } catch { /* abaikan */ }
    const list = Array.isArray(given) ? given : Object.entries(given).map(([question_id, answer]) => ({ question_id, answer }));
    const answers = qs.map((q) => {
      const ans = String(list.find((x) => x.question_id === q.id)?.answer ?? "");
      if (q.required && !ans.trim()) fail(400, `Pertanyaan wajib dijawab: ${q.text}`);
      const mismatch = !!q.ideal && ans.trim().toLowerCase() !== String(q.ideal).trim().toLowerCase();
      return { question_id: q.id, question: q.text, type: q.type, answer: ans, ideal: q.ideal || "", mismatch };
    });
    const evaluated = answers.filter((x) => x.ideal).length;
    c.db.answers[app.id] = { application_id: app.id, answers, evaluated, mismatches: answers.filter((x) => x.mismatch).length, created_at: nowIso() };
  }
  c.db.apps.push(app);
  notify(c.db, poster?.id, "job_application", `${name} melamar posisi ${j.title}`, `/rekrutmen/pelamar/${app.id}`);
  return stripApp(app);
});
on("DELETE", "/api/jobs/apply", (c) => {
  const u = need(c);
  const before = c.db.apps.length;
  c.db.apps = c.db.apps.filter((a) => !(a.job_id === c.q.get("id") && a.applicant_id === u.id));
  if (before === c.db.apps.length) fail(404, "Lamaran tidak ditemukan");
  return { ok: true };
});
on("GET", "/api/jobs/my-applications", (c) => {
  const u = need(c);
  return c.db.apps.filter((a) => a.applicant_id === u.id).sort(byNewest).map((a) => {
    const j = jobById(c.db, a.job_id);
    const out = {
      id: a.id, job_id: a.job_id, job_title: j?.title || "", company_name: userById(c.db, j?.poster_id)?.company_name || j?.company_name || "",
      status: a.status, created_at: a.created_at, is_priority: a.is_priority, viewed: !!a.viewed_at, poster_id: j?.poster_id || "",
      follow_ups_used: a.follow_ups, follow_ups_max: u.is_pro ? 5 : 1,
    };
    if (u.is_pro) Object.assign(out, { viewed_at: a.viewed_at, note: a.note, remind_at: a.remind_at });
    return out;
  });
});
on("POST", "/api/jobs/my-applications/follow-up", (c) => {
  const u = need(c);
  const a = c.db.apps.find((x) => x.id === c.q.get("id") && x.applicant_id === u.id);
  if (!a) fail(404, "Lamaran tidak ditemukan");
  const max = u.is_pro ? 5 : 1;
  if (a.follow_ups >= max) fail(403, "Batas tindak lanjut tercapai");
  const body = str(c.body.body);
  if (!body) fail(400, "Pesan wajib diisi");
  const j = jobById(c.db, a.job_id);
  a.follow_ups += 1;
  a.last_follow_up_at = nowIso();
  c.db.messages.push({ id: uid("msg_"), from_user_id: u.id, to_user_id: j.poster_id, body, created_at: nowIso() });
  notify(c.db, j.poster_id, "message", `Pesan baru dari ${u.name}`, "/pesan");
  return { to_user_id: j.poster_id };
});
on("POST", "/api/jobs/my-applications/note", (c) => {
  const u = need(c);
  const a = c.db.apps.find((x) => x.id === c.q.get("id") && x.applicant_id === u.id);
  if (!a) fail(404, "Lamaran tidak ditemukan");
  if (!u.is_pro) fail(403, "Fitur ini untuk pengguna Pro");
  a.note = str(c.body.note);
  a.remind_at = c.body.remind_at || null;
  return { id: a.id, note: a.note, remind_at: a.remind_at };
});

// lamar lewat situs perusahaan
const extRec = (db, jobId, userId) => db.ext.find((e) => e.job_id === jobId && e.user_id === userId);
on("GET", "/api/jobs/external", (c) => {
  const u = need(c);
  const j = jobById(c.db, c.q.get("id"));
  if (!j || j.apply_mode !== "external") fail(404, "Lowongan tidak ditemukan");
  const poster = userById(c.db, j.poster_id);
  let host = "";
  try { host = new URL(j.apply_url).host; } catch { /* abaikan */ }
  const rec = extRec(c.db, j.id, u.id);
  return { url: j.apply_url, host, company_name: poster?.company_name || j.company_name, is_verified: poster?.verification_status === "verified", title: j.title, clicked_at: rec?.clicked_at || null, applied_at: rec?.applied_at || null };
});
on("POST", "/api/jobs/external/click", (c) => {
  const u = need(c);
  const j = jobById(c.db, c.q.get("id"));
  if (!j) fail(404, "Lowongan tidak ditemukan");
  let rec = extRec(c.db, j.id, u.id);
  if (!rec) c.db.ext.push((rec = { job_id: j.id, user_id: u.id, clicked_at: nowIso(), applied_at: null }));
  return { url: j.apply_url, ...rec };
});
on("POST", "/api/jobs/external/applied", (c) => {
  const u = need(c);
  let rec = extRec(c.db, c.q.get("id"), u.id);
  if (!rec) c.db.ext.push((rec = { job_id: c.q.get("id"), user_id: u.id, clicked_at: nowIso(), applied_at: null }));
  rec.applied_at ||= nowIso();
  return rec;
});
on("GET", "/api/jobs/my-external", (c) => {
  const u = need(c);
  return c.db.ext.filter((e) => e.user_id === u.id).map((e) => {
    const j = jobById(c.db, e.job_id);
    return { ...e, job_title: j?.title || "", company_name: j?.company_name || "" };
  });
});

// ================= PROFIL KARIER & CV =================
const EMPTY_CAREER = () => ({
  headline: "", city: "", phone: "", share: true, status: "", level: "", salaryMin: 0, skills: [], roles: [], workModes: [],
  locations: [], hiddenCompanies: [], portfolio: [], pauseEmail: false, experience: [], organizations: [], certifications: [],
  education: [], updated_at: "",
});
const cvInfo = (x) => ({ id: x.id, name: x.name, size: x.size, uploaded_at: x.uploaded_at });
on("GET", "/api/profile/career", (c) => {
  const u = need(c);
  const rec = careerOf(c.db, u.id);
  const cvs = rec.cvs.map(cvInfo);
  return { exists: !!rec.career, career: rec.career || EMPTY_CAREER(), cv: cvs[0] || null, cvs };
});
on("PUT", "/api/profile/career", (c) => {
  const u = need(c);
  careerOf(c.db, u.id).career = { ...EMPTY_CAREER(), ...c.body, updated_at: nowIso() };
  return { ok: true };
});
on("POST", "/api/profile/cv", async (c) => {
  const u = need(c);
  const f = fileOf(c, "cv");
  if (!f) fail(400, "File CV wajib diunggah");
  if (f.size > 5 * 1024 * 1024) fail(400, "Ukuran CV maksimal 5 MB");
  const rec = careerOf(c.db, u.id);
  if (rec.cvs.length >= 4) fail(400, "Maksimal 4 CV tersimpan");
  const cv = { id: uid("cv_"), name: f.name, size: f.size, uploaded_at: nowIso(), data: f.size <= 700 * 1024 ? await readAsDataUrl(f) : "" };
  rec.cvs.push(cv);
  return cvInfo(cv);
});
on("DELETE", "/api/profile/cv", (c) => {
  const rec = careerOf(c.db, need(c).id);
  rec.cvs = rec.cvs.filter((x) => x.id !== c.q.get("id"));
  return { ok: true };
});
on("PUT", "/api/profile/cv/primary", (c) => {
  const rec = careerOf(c.db, need(c).id);
  const i = rec.cvs.findIndex((x) => x.id === c.q.get("id"));
  if (i < 0) fail(404, "CV tidak ditemukan");
  rec.cvs.unshift(...rec.cvs.splice(i, 1));
  return { ok: true };
});
const placeholderPdf = (title, lines) => makePdf(title, lines);
onDownload("/api/profile/cv", async (c) => {
  const u = need(c);
  const cv = careerOf(c.db, u.id).cvs.find((x) => x.id === c.q.get("id"));
  if (!cv) fail(404, "CV tidak ditemukan");
  if (cv.data) return { blob: await dataUrlToBlob(cv.data), filename: cv.name };
  return { blob: placeholderPdf(cv.name, ["Pratinjau demo: berkas asli terlalu besar untuk disimpan di browser."]), filename: cv.name };
});

// ================= PRO =================
on("GET", "/api/pro/me", (c) => {
  const u = need(c);
  const month = nowIso().slice(0, 7);
  return {
    is_pro: !!u.is_pro, price: 49000, priority_used: c.db.apps.filter((a) => a.applicant_id === u.id && a.is_priority && a.created_at.slice(0, 7) === month).length,
    priority_limit: 3, searches_limit: u.is_pro ? 10 : 1, early_access_hours: 24,
  };
});
on("POST", "/api/pro/subscribe", (c) => {
  need(c).is_pro = true;
  return { is_pro: true };
});
on("POST", "/api/pro/cancel", (c) => {
  need(c).is_pro = false;
  return { is_pro: false };
});
on("GET", "/api/pro/searches", (c) => c.db.searches.filter((s) => s.user_id === need(c).id));
on("POST", "/api/pro/searches", (c) => {
  const u = need(c);
  const limit = u.is_pro ? 10 : 1;
  if (c.db.searches.filter((s) => s.user_id === u.id).length >= limit) fail(403, `Batas ${limit} pencarian tersimpan tercapai`);
  const s = { id: uid("s_"), user_id: u.id, query: str(c.body.query), type: c.body.type || "", location: str(c.body.location), min_salary: Number(c.body.min_salary) || 0, created_at: nowIso() };
  c.db.searches.push(s);
  return s;
});
on("DELETE", "/api/pro/searches", (c) => {
  const u = need(c);
  c.db.searches = c.db.searches.filter((s) => !(s.id === c.q.get("id") && s.user_id === u.id));
  return { ok: true };
});

// ================= BISNIS =================
const companyOf = (db, id) => (db.companies[id] ||= { tagline: "", about: "", website: "", location: "", industry: "", size: "", benefits: [], accent: "blue", logo: "", banner: "" });
on("GET", "/api/business/plans", () => ({ plans: PLANS, payment_demo: true }));
on("GET", "/api/business/me", (c) => {
  const u = needBiz(c);
  const sub = c.db.subs[u.id] || null;
  const mine = c.db.jobs.filter((j) => j.poster_id === u.id);
  return {
    plan: planOf(c.db, u.id), subscription: sub, subscription_active: !!subActive(sub),
    usage: { active_jobs: mine.filter((j) => j.status === "active").length, boosts: mine.filter(isBoosted).length },
    company: { user_id: u.id, ...companyOf(c.db, u.id) }, payment_demo: true,
  };
});
on("POST", "/api/business/subscribe", (c) => {
  const u = needBiz(c);
  if (!PLANS.some((p) => p.id === c.body.plan && p.id !== "starter")) fail(400, "Paket tidak valid");
  const yearly = c.body.period === "yearly";
  const sub = { user_id: u.id, plan: c.body.plan, period: yearly ? "yearly" : "monthly", started_at: nowIso(), expires_at: new Date(Date.now() + (yearly ? 365 : 30) * 864e5).toISOString(), auto_renew: true };
  c.db.subs[u.id] = sub;
  return sub;
});
on("POST", "/api/business/subscription/cancel", (c) => {
  const sub = c.db.subs[needBiz(c).id];
  if (!sub) fail(404, "Tidak ada langganan aktif");
  sub.auto_renew = false;
  return sub;
});
on("PUT", "/api/business/company", (c) => {
  const u = needBiz(c);
  const p = companyOf(c.db, u.id);
  const plan = planOf(c.db, u.id);
  for (const k of ["tagline", "about", "website", "location", "industry", "size"]) if (k in c.body) p[k] = str(c.body[k]);
  if (plan.company_customization) {
    if (Array.isArray(c.body.benefits)) p.benefits = c.body.benefits.map(str).filter(Boolean);
    if (c.body.accent) p.accent = str(c.body.accent);
  }
  if (c.body.company_name && str(c.body.company_name)) u.company_name = str(c.body.company_name);
  return { user_id: u.id, ...p, updated_at: nowIso() };
});
on("POST", "/api/business/company/image", async (c) => {
  const u = needBiz(c);
  const kind = c.q.get("kind") === "banner" ? "banner" : "logo";
  const f = fileOf(c, "file");
  if (!f || !f.type.startsWith("image/")) fail(400, "File harus berupa gambar");
  const p = companyOf(c.db, u.id);
  p[kind] = await imageToDataUrl(f, kind === "banner" ? 1200 : 400);
  return { user_id: u.id, ...p };
});
on("DELETE", "/api/business/company/image", (c) => {
  const u = needBiz(c);
  const p = companyOf(c.db, u.id);
  p[c.q.get("kind") === "banner" ? "banner" : "logo"] = "";
  return { user_id: u.id, ...p };
});
on("GET", "/api/companies/detail", (c) => {
  const u = userById(c.db, c.q.get("id"));
  if (!u || u.account_type !== "business") fail(404, "Perusahaan tidak ditemukan");
  const plan = planOf(c.db, u.id);
  const p = companyOf(c.db, u.id);
  const jobs = c.db.jobs.filter((j) => j.poster_id === u.id && j.status !== "closed").map((j) => jobOut(c.db, j, c.user))
    .sort((a, b) => Number(b.is_boosted) - Number(a.is_boosted));
  return {
    id: u.id, name: u.company_name, verified: u.verification_status === "verified", member_since: u.created_at,
    tagline: p.tagline, about: p.about, website: p.website, location: p.location, industry: p.industry, size: p.size,
    benefits: plan.company_customization ? p.benefits : [], accent: plan.company_customization && p.accent ? p.accent : "blue",
    logo: p.logo, banner: p.banner, customized: plan.company_customization, jobs,
  };
});
on("GET", "/api/business/verification", (c) => {
  const u = needBiz(c);
  const latest = c.db.verifs.filter((v) => v.user_id === u.id).sort(byNewest)[0] || null;
  return { status: u.verification_status, request: latest };
});
on("POST", "/api/business/verification", (c) => {
  const u = needBiz(c);
  const b = c.body;
  if (!str(b.legal_name) || !str(b.nib) || !str(b.contact_email)) fail(400, "Nama badan usaha, NIB, dan email kontak wajib diisi");
  // Demo: pengajuan langsung disetujui supaya lencana "terverifikasi" bisa dicoba.
  const req = { id: uid("v_"), user_id: u.id, legal_name: str(b.legal_name), nib: str(b.nib), website: str(b.website), contact_email: str(b.contact_email), note: str(b.note), doc_name: fileOf(c, "document")?.name || fileOf(c, "doc")?.name || "", status: "approved", created_at: nowIso(), submitted_at: nowIso(), reviewed_at: nowIso() };
  c.db.verifs.push(req);
  u.verification_status = "verified";
  notify(c.db, u.id, "verification", "Perusahaanmu kini terverifikasi (mode demo)", "/rekrutmen/perusahaan");
  return { status: u.verification_status, request: req };
});

// ulasan perusahaan
const reviewView = (db, r, viewer) => ({
  ...r, author_name: r.anonymous ? "Anonim" : userById(db, r.author_id)?.name || "Pengguna", mine: r.author_id === viewer,
});
const summarize = (list) => {
  const dist = [0, 0, 0, 0, 0];
  list.forEach((r) => (dist[r.rating - 1] += 1));
  const n = list.length;
  return { count: n, average: n ? Math.round((list.reduce((s, r) => s + r.rating, 0) / n) * 10) / 10 : 0, distribution: dist, recommend_percent: n ? Math.round((list.filter((r) => r.recommend).length / n) * 100) : 0 };
};
const companyOrFail = (c) => {
  const co = userById(c.db, c.q.get("id"));
  if (!co || co.account_type !== "business") fail(404, "Perusahaan tidak ditemukan");
  return co;
};
const reviewInput = (b) => {
  const rating = Number(b.rating);
  if (!(rating >= 1 && rating <= 5)) fail(400, "Rating harus 1-5");
  if (!str(b.title)) fail(400, "Judul ulasan wajib diisi");
  return { rating, title: str(b.title), pros: str(b.pros), cons: str(b.cons), position: str(b.position), employment_status: b.employment_status === "former" ? "former" : "current", recommend: !!b.recommend, anonymous: !!b.anonymous };
};
on("GET", "/api/companies/reviews", (c) => {
  const co = companyOrFail(c);
  const list = c.db.reviews.filter((r) => r.company_id === co.id).sort(byNewest);
  const sort = c.q.get("sort");
  if (sort === "highest") list.sort((a, b) => b.rating - a.rating);
  if (sort === "lowest") list.sort((a, b) => a.rating - b.rating);
  return { summary: summarize(list), reviews: list.map((r) => reviewView(c.db, r, c.user?.id)) };
});
on("POST", "/api/companies/reviews", (c) => {
  const u = need(c);
  const co = companyOrFail(c);
  if (u.account_type === "business") fail(403, "Akun Bisnis tidak bisa mengulas perusahaan");
  if (c.db.reviews.some((r) => r.company_id === co.id && r.author_id === u.id)) fail(409, "Kamu sudah mengulas perusahaan ini");
  const r = { id: uid("rv_"), company_id: co.id, author_id: u.id, ...reviewInput(c.body), created_at: nowIso(), updated_at: nowIso() };
  c.db.reviews.push(r);
  return reviewView(c.db, r, u.id);
});
on("PUT", "/api/companies/reviews", (c) => {
  const u = need(c);
  const co = companyOrFail(c);
  const r = c.db.reviews.find((x) => x.company_id === co.id && x.author_id === u.id);
  if (!r) fail(404, "Ulasan tidak ditemukan");
  Object.assign(r, reviewInput(c.body), { updated_at: nowIso() });
  return reviewView(c.db, r, u.id);
});
on("DELETE", "/api/companies/reviews", (c) => {
  const u = need(c);
  const co = companyOrFail(c);
  c.db.reviews = c.db.reviews.filter((x) => !(x.company_id === co.id && x.author_id === u.id));
  return { deleted: true };
});

// ================= REKRUTMEN =================
const myJobs = (c, u) => c.db.jobs.filter((j) => j.poster_id === u.id);
const myApps = (c, u) => c.db.apps.filter((a) => myJobs(c, u).some((j) => j.id === a.job_id));
const ownedApp = (c, u, id) => {
  const a = c.db.apps.find((x) => x.id === id);
  if (!a || jobById(c.db, a.job_id)?.poster_id !== u.id) fail(404, "Pelamar tidak ditemukan");
  return a;
};
const appView = (c, u, a) => ({
  ...stripApp(a), job_title: jobById(c.db, a.job_id)?.title || "", has_cv: !!a.cv_name,
  blocked: c.db.blocks.some((b) => b.blocker_id === u.id && b.blocked_id === a.applicant_id),
});
const newCounts = () => ({ new: 0, reviewed: 0, interview: 0, accepted: 0, rejected: 0 });

on("GET", "/api/recruitment/jobs", (c) => {
  const u = needBiz(c);
  return myJobs(c, u).sort(byNewest).map((j) => {
    const counts = newCounts();
    c.db.apps.filter((a) => a.job_id === j.id).forEach((a) => (counts[a.status] += 1));
    const ext = c.db.ext.filter((e) => e.job_id === j.id);
    return { ...jobOut(c.db, j, u), applicant_count: Object.values(counts).reduce((s, n) => s + n, 0), new_count: counts.new, status_counts: counts, apply_clicks: ext.length, external_applied: ext.filter((e) => e.applied_at).length };
  });
});
on("POST", "/api/recruitment/jobs/status", (c) => {
  const u = needBiz(c);
  const j = jobById(c.db, c.q.get("id"));
  if (!j || j.poster_id !== u.id) fail(404, "Lowongan tidak ditemukan");
  if (!["active", "closed"].includes(c.body.status)) fail(400, "Status tidak valid");
  if (c.body.status === "active" && j.status !== "active") {
    const plan = planOf(c.db, u.id);
    if (myJobs(c, u).filter((x) => x.status === "active").length >= plan.max_active_jobs) fail(403, `Batas lowongan aktif paket ${plan.name} tercapai`);
  }
  j.status = c.body.status;
  return jobOut(c.db, j, u);
});
on("POST", "/api/recruitment/jobs/boost", (c) => {
  const u = needBiz(c);
  const j = jobById(c.db, c.q.get("id"));
  const plan = planOf(c.db, u.id);
  if (!j || j.poster_id !== u.id) fail(404, "Lowongan tidak ditemukan");
  if (!plan.max_boosts) fail(403, "Sorotan lowongan hanya untuk paket Growth");
  if (!isBoosted(j) && myJobs(c, u).filter(isBoosted).length >= plan.max_boosts) fail(403, `Maksimal ${plan.max_boosts} lowongan disorot bersamaan`);
  j.boosted_until = new Date(Date.now() + plan.boost_days * 864e5).toISOString();
  return jobOut(c.db, j, u);
});
on("POST", "/api/recruitment/jobs/unboost", (c) => {
  const u = needBiz(c);
  const j = jobById(c.db, c.q.get("id"));
  if (!j || j.poster_id !== u.id) fail(404, "Lowongan tidak ditemukan");
  j.boosted_until = null;
  return jobOut(c.db, j, u);
});
on("GET", "/api/recruitment/jobs/viewers", (c) => {
  const u = needBiz(c);
  const j = jobById(c.db, c.q.get("id"));
  if (!j || j.poster_id !== u.id) fail(404, "Lowongan tidak ditemukan");
  const plan = planOf(c.db, u.id);
  const mine = c.db.viewers.filter((v) => v.job_id === j.id);
  const week = Date.now() - 7 * 864e5;
  const applied = new Set(c.db.apps.filter((a) => a.job_id === j.id).map((a) => a.applicant_id));
  const resp = {
    window_days: 30, total_viewers: new Set(mine.map((v) => v.viewer_id)).size,
    viewers_7d: new Set(mine.filter((v) => new Date(v.at).getTime() > week).map((v) => v.viewer_id)).size,
    applied_viewers: new Set(mine.filter((v) => applied.has(v.viewer_id)).map((v) => v.viewer_id)).size,
    anonymous_viewers: new Set(mine.filter((v) => v.anonymous).map((v) => v.viewer_id)).size, items: [],
  };
  if (!plan.job_viewer_list) {
    resp.list_hidden_reason = "plan_required";
    return resp;
  }
  const agg = new Map();
  mine.filter((v) => !v.anonymous).forEach((v) => {
    const a = agg.get(v.viewer_id) || { visits: 0, days: new Set(), last: v.at };
    a.visits += 1;
    a.days.add(v.at.slice(0, 10));
    if (v.at > a.last) a.last = v.at;
    agg.set(v.viewer_id, a);
  });
  resp.items = [...agg.entries()].map(([id, a]) => ({ viewer_id: id, name: userById(c.db, id)?.name || "Pengguna", bio: userById(c.db, id)?.bio || "", applied: applied.has(id), visit_days: a.days.size, visits: a.visits, last_viewed_at: a.last }));
  return resp;
});
on("GET", "/api/recruitment/applicants", (c) => {
  const u = needBiz(c);
  const jobId = c.q.get("job_id");
  return myApps(c, u).filter((a) => !jobId || a.job_id === jobId).sort((a, b) => Number(b.is_priority) - Number(a.is_priority) || byNewest(a, b)).map((a) => appView(c, u, a));
});
on("GET", "/api/recruitment/applicants/detail", (c) => {
  const u = needBiz(c);
  const a = ownedApp(c, u, c.q.get("id"));
  a.viewed_at ||= nowIso();
  return appView(c, u, a);
});
on("POST", "/api/recruitment/applicants/status", (c) => {
  const u = needBiz(c);
  const a = ownedApp(c, u, c.q.get("id"));
  if (!APP_STATUS.includes(c.body.status)) fail(400, "Status tidak valid");
  a.status = c.body.status;
  a.updated_at = nowIso();
  const j = jobById(c.db, a.job_id);
  notify(c.db, a.applicant_id, "application_status", `Status lamaranmu untuk "${j?.title}" kini: ${APP_LABEL[a.status]}`, "/lowongan-kerja");
  return appView(c, u, a);
});
on("GET", "/api/recruitment/stats", (c) => {
  const u = needBiz(c);
  const jobs = myJobs(c, u), apps = myApps(c, u);
  const counts = newCounts();
  apps.forEach((a) => (counts[a.status] += 1));
  const daily = [];
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    daily.push({ date: d, count: apps.filter((a) => a.created_at.slice(0, 10) === d).length });
  }
  return { total_jobs: jobs.length, active_jobs: jobs.filter((j) => j.status === "active").length, total_views: jobs.reduce((s, j) => s + (j.views || 0), 0), total_applicants: apps.length, status_counts: counts, daily };
});
onDownload("/api/recruitment/applicants/cv", async (c) => {
  const u = needBiz(c);
  const a = ownedApp(c, u, c.q.get("id"));
  if (!a.cv_name) fail(404, "Pelamar tidak melampirkan CV");
  if (a.cv_data) return { blob: await dataUrlToBlob(a.cv_data), filename: a.cv_name };
  return { blob: placeholderPdf(a.cv_name, ["Pratinjau demo: berkas asli terlalu besar untuk disimpan di browser."]), filename: a.cv_name };
});
onDownload("/api/recruitment/applicants/cover-letter", (c) => {
  const u = needBiz(c);
  const a = ownedApp(c, u, c.q.get("id"));
  const j = jobById(c.db, a.job_id);
  return { blob: placeholderPdf(`Surat Pengantar - ${a.name}`, [`Posisi: ${j?.title || ""}`, `Email: ${a.email}`, "", ...(a.cover_letter || "(tidak ada surat pengantar)").split("\n")]), filename: `surat-pengantar-${a.name}.pdf` };
});
onDownload("/api/recruitment/applicants/export", (c) => {
  const u = needBiz(c);
  const jobId = c.q.get("job_id"), status = c.q.get("status");
  const rows = myApps(c, u).filter((a) => (!jobId || a.job_id === jobId) && (!status || a.status === status));
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["Nama", "Email", "Telepon", "Posisi", "Status", "Pengalaman", "Keahlian", "Tanggal"];
  const lines = rows.map((a) => [a.name, a.email, a.phone, jobById(c.db, a.job_id)?.title, APP_LABEL[a.status], a.experience, a.skills, a.created_at].map(esc).join(","));
  return { blob: new Blob([[head.map(esc).join(","), ...lines].join("\n")], { type: "text/csv" }), filename: "pelamar.csv" };
});

// ----- paket Growth: catatan, template, penilaian, talent pool, wawancara, skor -----
on("GET", "/api/recruitment/applicants/notes", (c) => {
  const u = needBiz(c);
  const a = ownedApp(c, u, c.q.get("id"));
  const notes = c.db.notes.filter((n) => n.application_id === a.id).sort(byNewest);
  const allowed = planOf(c.db, u.id).applicant_notes;
  return { allowed, count: notes.length, notes: allowed ? notes : [] };
});
on("POST", "/api/recruitment/applicants/notes", (c) => {
  const u = needBiz(c);
  const a = ownedApp(c, u, c.q.get("id"));
  if (!planOf(c.db, u.id).applicant_notes) fail(403, "Catatan pelamar hanya untuk paket Growth");
  if (!str(c.body.body)) fail(400, "Isi catatan wajib diisi");
  const n = { id: uid("nt_"), application_id: a.id, body: str(c.body.body), created_at: nowIso(), updated_at: nowIso() };
  c.db.notes.push(n);
  return n;
});
on("PUT", "/api/recruitment/applicants/notes", (c) => {
  needBiz(c);
  const n = c.db.notes.find((x) => x.id === c.q.get("note_id"));
  if (!n) fail(404, "Catatan tidak ditemukan");
  n.body = str(c.body.body);
  n.updated_at = nowIso();
  return n;
});
on("DELETE", "/api/recruitment/applicants/notes", (c) => {
  needBiz(c);
  c.db.notes = c.db.notes.filter((x) => x.id !== c.q.get("note_id"));
  return { deleted: true };
});

const DEFAULT_TEMPLATES = [
  { kind: "rejection", name: "Penolakan sopan", body: "Halo {{nama}}, terima kasih telah melamar posisi {{posisi}} di {{perusahaan}}. Setelah pertimbangan, kami belum dapat melanjutkan proses Anda. Semoga sukses!" },
  { kind: "interview", name: "Undangan wawancara", body: "Halo {{nama}}, kami tertarik dengan lamaran Anda untuk posisi {{posisi}} di {{perusahaan}}. Kami ingin mengundang Anda wawancara." },
];
on("GET", "/api/recruitment/templates", (c) => {
  const u = needBiz(c);
  const plan = planOf(c.db, u.id);
  const kind = c.q.get("kind");
  const mine = c.db.templates.filter((t) => t.owner_id === u.id);
  return { allowed: plan.max_message_templates > 0, limit: plan.max_message_templates, count: mine.length, templates: mine.filter((t) => !kind || t.kind === kind), suggestions: DEFAULT_TEMPLATES };
});
on("POST", "/api/recruitment/templates", (c) => {
  const u = needBiz(c);
  const plan = planOf(c.db, u.id);
  if (!plan.max_message_templates) fail(403, "Template pesan hanya untuk paket Growth");
  if (c.db.templates.filter((t) => t.owner_id === u.id).length >= plan.max_message_templates) fail(403, "Batas template tercapai");
  if (!["rejection", "interview"].includes(c.body.kind)) fail(400, "Jenis template tidak valid");
  if (!str(c.body.name) || !str(c.body.body)) fail(400, "Nama dan isi template wajib diisi");
  const t = { id: uid("t_"), owner_id: u.id, kind: c.body.kind, name: str(c.body.name), body: str(c.body.body), created_at: nowIso(), updated_at: nowIso() };
  c.db.templates.push(t);
  return t;
});
on("PUT", "/api/recruitment/templates", (c) => {
  const u = needBiz(c);
  const t = c.db.templates.find((x) => x.id === c.q.get("id") && x.owner_id === u.id);
  if (!t) fail(404, "Template tidak ditemukan");
  Object.assign(t, { name: str(c.body.name) || t.name, body: str(c.body.body) || t.body, kind: c.body.kind || t.kind, updated_at: nowIso() });
  return t;
});
on("DELETE", "/api/recruitment/templates", (c) => {
  const u = needBiz(c);
  c.db.templates = c.db.templates.filter((x) => !(x.id === c.q.get("id") && x.owner_id === u.id));
  return { deleted: true };
});
on("POST", "/api/recruitment/templates/render", (c) => {
  const u = needBiz(c);
  const t = c.db.templates.find((x) => x.id === c.body.template_id && x.owner_id === u.id);
  const a = ownedApp(c, u, c.body.application_id);
  if (!t) fail(404, "Template tidak ditemukan");
  const text = t.body.replaceAll("{{nama}}", a.name).replaceAll("{{posisi}}", jobById(c.db, a.job_id)?.title || "").replaceAll("{{perusahaan}}", u.company_name);
  return { body: text, text, to_user_id: a.applicant_id };
});

on("GET", "/api/recruitment/evaluations", (c) => {
  const u = needBiz(c);
  const items = {};
  myApps(c, u).forEach((a) => {
    if (c.db.evals[a.id]) items[a.id] = c.db.evals[a.id];
  });
  return { allowed: planOf(c.db, u.id).applicant_ratings, items };
});
on("GET", "/api/recruitment/applicants/evaluation", (c) => {
  const u = needBiz(c);
  const a = ownedApp(c, u, c.q.get("id"));
  return { allowed: planOf(c.db, u.id).applicant_ratings, evaluation: c.db.evals[a.id] || null };
});
on("PUT", "/api/recruitment/applicants/evaluation", (c) => {
  const u = needBiz(c);
  const a = ownedApp(c, u, c.q.get("id"));
  if (!planOf(c.db, u.id).applicant_ratings) fail(403, "Penilaian pelamar hanya untuk paket Growth");
  const ev = { application_id: a.id, rating: Math.min(5, Math.max(0, Number(c.body.rating) || 0)), label: c.body.label || "", updated_at: nowIso() };
  c.db.evals[a.id] = ev;
  return { allowed: true, evaluation: ev };
});

const talentView = (c, t) => ({ ...t, application_exists: c.db.apps.some((a) => a.id === t.application_id), rating: c.db.evals[t.application_id]?.rating || 0, label: c.db.evals[t.application_id]?.label || "" });
on("GET", "/api/recruitment/talent", (c) => {
  const u = needBiz(c);
  const plan = planOf(c.db, u.id);
  const items = c.db.talent.filter((t) => t.owner_id === u.id).sort(byNewest);
  return { allowed: plan.max_talent_pool > 0, limit: plan.max_talent_pool, count: items.length, items: items.map((t) => talentView(c, t)) };
});
on("POST", "/api/recruitment/talent", (c) => {
  const u = needBiz(c);
  const plan = planOf(c.db, u.id);
  if (!plan.max_talent_pool) fail(403, "Talent pool hanya untuk paket Growth");
  const a = ownedApp(c, u, c.body.application_id);
  if (c.db.talent.some((t) => t.owner_id === u.id && t.applicant_id === a.applicant_id)) fail(409, "Kandidat sudah ada di talent pool");
  const t = { id: uid("tp_"), owner_id: u.id, applicant_id: a.applicant_id, application_id: a.id, name: a.name, skills: a.skills, experience: a.experience, source_job: jobById(c.db, a.job_id)?.title || "", note: str(c.body.note), created_at: nowIso(), updated_at: nowIso() };
  c.db.talent.push(t);
  return talentView(c, t);
});
on("PUT", "/api/recruitment/talent", (c) => {
  const u = needBiz(c);
  const t = c.db.talent.find((x) => x.id === c.q.get("id") && x.owner_id === u.id);
  if (!t) fail(404, "Kandidat tidak ditemukan");
  t.note = str(c.body.note);
  t.updated_at = nowIso();
  return talentView(c, t);
});
on("DELETE", "/api/recruitment/talent", (c) => {
  const u = needBiz(c);
  c.db.talent = c.db.talent.filter((x) => !(x.id === c.q.get("id") && x.owner_id === u.id));
  return { deleted: true };
});

const ivRecruiter = (c, iv) => ({ ...iv, applicant_name: c.db.apps.find((a) => a.id === iv.application_id)?.name || "", job_title: jobById(c.db, iv.job_id)?.title || "" });
on("GET", "/api/recruitment/interviews", (c) => {
  const u = needBiz(c);
  const appId = c.q.get("application_id");
  const items = c.db.interviews.filter((i) => i.owner_id === u.id && (!appId || i.application_id === appId)).sort((a, b) => (a.starts_at < b.starts_at ? -1 : 1));
  return { allowed: planOf(c.db, u.id).interview_scheduling, items: items.map((i) => ivRecruiter(c, i)) };
});
on("POST", "/api/recruitment/interviews", (c) => {
  const u = needBiz(c);
  if (!planOf(c.db, u.id).interview_scheduling) fail(403, "Jadwal wawancara hanya untuk paket Growth");
  const a = ownedApp(c, u, c.body.application_id);
  if (!["online", "onsite", "phone"].includes(c.body.mode)) fail(400, "Mode wawancara tidak valid");
  if (isNaN(new Date(c.body.starts_at))) fail(400, "Waktu wawancara tidak valid");
  const iv = { id: uid("iv_"), application_id: a.id, job_id: a.job_id, owner_id: u.id, applicant_id: a.applicant_id, starts_at: new Date(c.body.starts_at).toISOString(), duration_min: Number(c.body.duration_min) || 30, mode: c.body.mode, location: str(c.body.location), note: str(c.body.note), status: "pending", response_note: "", created_at: nowIso(), updated_at: nowIso() };
  c.db.interviews.push(iv);
  notify(c.db, a.applicant_id, "interview", `Undangan wawancara untuk posisi ${jobById(c.db, a.job_id)?.title}`, "/wawancara");
  return ivRecruiter(c, iv);
});
on("PUT", "/api/recruitment/interviews", (c) => {
  const u = needBiz(c);
  const iv = c.db.interviews.find((x) => x.id === c.q.get("id") && x.owner_id === u.id);
  if (!iv) fail(404, "Jadwal tidak ditemukan");
  if (c.body.starts_at) iv.starts_at = new Date(c.body.starts_at).toISOString();
  for (const k of ["duration_min", "mode", "location", "note"]) if (k in c.body) iv[k] = c.body[k];
  iv.status = "pending";
  iv.updated_at = nowIso();
  notify(c.db, iv.applicant_id, "interview", "Jadwal wawancaramu diperbarui", "/wawancara");
  return ivRecruiter(c, iv);
});
on("DELETE", "/api/recruitment/interviews", (c) => {
  const u = needBiz(c);
  const iv = c.db.interviews.find((x) => x.id === c.q.get("id") && x.owner_id === u.id);
  if (!iv) fail(404, "Jadwal tidak ditemukan");
  iv.status = "cancelled";
  iv.updated_at = nowIso();
  notify(c.db, iv.applicant_id, "interview", "Wawancaramu dibatalkan oleh perekrut", "/wawancara");
  return ivRecruiter(c, iv);
});
on("GET", "/api/jobs/my-interviews", (c) => {
  const u = need(c);
  return c.db.interviews.filter((i) => i.applicant_id === u.id).sort((a, b) => (a.starts_at < b.starts_at ? -1 : 1)).map((i) => {
    const j = jobById(c.db, i.job_id);
    return { ...i, job_title: j?.title || "", company_name: userById(c.db, j?.poster_id)?.company_name || "", poster_id: j?.poster_id || "" };
  });
});
on("POST", "/api/jobs/my-interviews/respond", (c) => {
  const u = need(c);
  const iv = c.db.interviews.find((x) => x.id === c.q.get("id") && x.applicant_id === u.id);
  if (!iv) fail(404, "Wawancara tidak ditemukan");
  if (!["confirmed", "declined"].includes(c.body.response)) fail(400, "Respons tidak valid");
  iv.status = c.body.response;
  iv.response_note = str(c.body.note);
  iv.updated_at = nowIso();
  notify(c.db, iv.owner_id, "interview", `${u.name} ${iv.status === "confirmed" ? "akan hadir" : "tidak bisa hadir"} di wawancara`, "/rekrutmen/wawancara");
  const j = jobById(c.db, iv.job_id);
  return { ...iv, job_title: j?.title || "", company_name: userById(c.db, j?.poster_id)?.company_name || "", poster_id: j?.poster_id || "" };
});

on("GET", "/api/recruitment/match", (c) => {
  const u = needBiz(c);
  const allowed = planOf(c.db, u.id).match_score;
  const jobId = c.q.get("job_id");
  const results = {};
  if (allowed) {
    myApps(c, u).filter((a) => !jobId || a.job_id === jobId).forEach((a) => {
      const j = jobById(c.db, a.job_id);
      const have = (a.skills || "").toLowerCase().split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
      const need_ = j?.required_skills || [];
      const matched = need_.filter((s) => have.includes(s.toLowerCase()));
      const missing = need_.filter((s) => !have.includes(s.toLowerCase()));
      const score = need_.length ? Math.round((matched.length / need_.length) * 100) : 50;
      results[a.id] = { score, label: score >= 75 ? "Sangat cocok" : score >= 50 ? "Cocok" : "Kurang cocok", matched_skills: matched, missing_skills: missing, parts: [{ name: "Keahlian", score, max: 100 }] };
    });
  }
  return { allowed, results };
});

