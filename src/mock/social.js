// Endpoint sosial: auth, profil, feed, komentar, follow, komunitas, pesan, notifikasi.
import { hashPw, nowIso, uid } from "./db";
import { emit } from "./bus";
import {
  on, fail, need, str, byNewest, pubUser, summary, userById, hasInter, addInter, delInter, idsOf, usersWith,
  blockedEither, isMember, commOf, commOut, roleIn, isCommAdmin, viewPost, visiblePosts, notify,
  imageToDataUrl, fileOf,
} from "./core";

const MOODS = ["curhat", "sindiran", "positif", "diskusi"];
const TOPICS = ["finance", "marketing", "design", "hr", "business", "operations", "career", "engineering", "healthcare", "legal", "education", "customer-service", "media"];
const RANGES = { day: 864e5, week: 7 * 864e5, month: 30 * 864e5, year: 365 * 864e5 };

const tokenFor = (u) => `demo.${u.id}`;
const postById = (db, id) => db.posts.find((p) => p.id === id);
const emitPostUpdated = (p) => emit("post_updated", { id: p.id, likes: p.likes, comment_count: p.comment_count });

// ================= AUTH =================
on("POST", "/api/auth/register", (c) => {
  const name = str(c.body.name), email = str(c.body.email).toLowerCase(), password = c.body.password || "";
  if (!name) fail(400, "Nama wajib diisi");
  if (!/^\S+@\S+\.\S+$/.test(email)) fail(400, "Format email tidak valid");
  if (password.length < 6) fail(400, "Kata sandi minimal 6 karakter");
  if (c.db.users.some((u) => u.email.toLowerCase() === email)) fail(409, "Email sudah terdaftar");
  const u = {
    id: uid("u_"), name, email, pw: hashPw(password), bio: "", avatar: "", banner: "", account_type: "personal",
    company_name: "", verification_status: "none", is_pro: false, mentor_subscription_active: false,
    profile_view_anonymous: false, email_notify_off: false, bubble_theme: "", created_at: nowIso(),
  };
  c.db.users.push(u);
  return { user: pubUser(u), token: tokenFor(u) };
});
on("POST", "/api/auth/login", (c) => {
  const email = str(c.body.email).toLowerCase();
  const u = c.db.users.find((x) => x.email.toLowerCase() === email);
  if (!u || u.pw !== hashPw(c.body.password || "")) fail(401, "Email atau kata sandi salah");
  return { user: pubUser(u), token: tokenFor(u) };
});
on("POST", "/api/auth/forgot-password", () => ({
  message: "Mode demo: pengiriman email dinonaktifkan. Gunakan akun demo atau daftar akun baru.",
}));
on("POST", "/api/auth/reset-password", () => fail(400, "Reset kata sandi tidak tersedia di mode demo"));

// ================= PROFIL =================
on("GET", "/api/profile/me", (c) => pubUser(need(c)));
on("PUT", "/api/profile/me", (c) => {
  const u = need(c);
  const name = str(c.body.name);
  if (!name) fail(400, "Nama wajib diisi");
  u.name = name;
  u.bio = str(c.body.bio);
  c.db.posts.forEach((p) => {
    if (p.author_id === u.id && !p.as_company) p.author_name = name;
  });
  c.db.comments.forEach((cm) => {
    if (cm.author_id === u.id) cm.author_name = name;
  });
  return pubUser(u);
});
on("PUT", "/api/profile/bubble-theme", (c) => {
  const u = need(c);
  u.bubble_theme = str(c.body.theme);
  return pubUser(u);
});
on("POST", "/api/profile/image", async (c) => {
  const u = need(c);
  const kind = c.q.get("kind") === "banner" ? "banner" : "avatar";
  const f = fileOf(c, "file");
  if (!f) fail(400, "File gambar wajib diunggah");
  if (!f.type.startsWith("image/")) fail(400, "File harus berupa gambar");
  u[kind] = await imageToDataUrl(f, kind === "banner" ? 1200 : 400);
  return pubUser(u);
});
on("DELETE", "/api/profile/image", (c) => {
  const u = need(c);
  u[c.q.get("kind") === "banner" ? "banner" : "avatar"] = "";
  return pubUser(u);
});
on("POST", "/api/profile/business", (c) => {
  const u = need(c);
  const company = str(c.body.company_name);
  if (!company) fail(400, "Nama perusahaan wajib diisi");
  u.account_type = "business";
  u.company_name = company;
  c.db.companies[u.id] ||= { tagline: "", about: "", website: "", location: "", industry: "", size: "", benefits: [], accent: "blue", logo: "", banner: "" };
  return pubUser(u);
});
on("POST", "/api/profile/view", (c) => {
  const u = c.user;
  const target = c.q.get("id");
  if (!u || !target || u.id === target || !userById(c.db, target)) return { recorded: false };
  c.db.profileViews.push({ viewer_id: u.id, target_id: target, anonymous: !!u.profile_view_anonymous, at: nowIso() });
  return { recorded: true };
});
on("PUT", "/api/profile/view-privacy", (c) => {
  const u = need(c);
  u.profile_view_anonymous = !!c.body.anonymous;
  return { anonymous: u.profile_view_anonymous };
});
on("GET", "/api/pro/profile-views", (c) => {
  const u = need(c);
  const mine = c.db.profileViews.filter((v) => v.target_id === u.id);
  const viewers = new Set(mine.map((v) => (v.anonymous ? `anon:${v.viewer_id}` : v.viewer_id)));
  const resp = { is_pro: !!u.is_pro, anonymous_mode: !!u.profile_view_anonymous, total_viewers: viewers.size, total_visits: mine.length, items: [] };
  if (!u.is_pro) resp.list_hidden_reason = "pro_required";
  else if (u.profile_view_anonymous) resp.list_hidden_reason = "anonymous_mode";
  else {
    const agg = new Map();
    mine.forEach((v) => {
      const key = v.anonymous ? `anon:${v.viewer_id}` : v.viewer_id;
      const a = agg.get(key) || { v, visits: 0, days: new Set(), last: v.at };
      a.visits += 1;
      a.days.add(v.at.slice(0, 10));
      if (v.at > a.last) a.last = v.at;
      agg.set(key, a);
    });
    resp.items = [...agg.values()].map((a) => {
      const vu = userById(c.db, a.v.viewer_id);
      const base = { visit_days: a.days.size, visits: a.visits, last_viewed_at: a.last };
      if (a.v.anonymous || !vu) return { anonymous: true, ...base };
      return {
        anonymous: false, viewer_id: vu.id, name: vu.name, account_type: vu.account_type,
        company_name: vu.account_type === "business" ? vu.company_name : "", verified: vu.verification_status === "verified",
        is_pro: vu.is_pro, ...base,
      };
    }).sort((a, b) => (a.last_viewed_at < b.last_viewed_at ? 1 : -1));
  }
  return resp;
});

// ================= USERS =================
on("GET", "/api/users/search", (c) => {
  const u = need(c);
  const q = str(c.q.get("q")).toLowerCase();
  if (!q) return [];
  return c.db.users
    .filter((x) => x.id !== u.id && !blockedEither(c.db, u.id, x.id) && (x.name.toLowerCase().includes(q) || (x.company_name || "").toLowerCase().includes(q)))
    .slice(0, 20).map(summary);
});
on("GET", "/api/users/lookup", (c) => {
  need(c);
  const ids = (c.q.get("ids") || "").split(",").filter(Boolean);
  return [...new Set(ids)].map((id) => userById(c.db, id)).filter(Boolean).map(summary);
});

// ================= FEED =================
function filterFeed(c, list) {
  const tab = ["populer", "komunitasku", "perusahaan"].includes(c.q.get("tab")) ? c.q.get("tab") : "terbaru";
  const range = RANGES[c.q.get("range")] || 0;
  const needle = str(c.q.get("q")).toLowerCase();
  const myComms = new Set(c.user ? c.db.members.filter((m) => m.user_id === c.user.id).map((m) => m.community_id) : []);
  const now = Date.now();
  let out = list.filter((p) => {
    if (range && now - new Date(p.created_at).getTime() > range) return false;
    if (tab === "komunitasku" && (!p.community_id || !myComms.has(p.community_id))) return false;
    if (tab === "perusahaan" && !p.as_company) return false;
    if (needle && !p.title.toLowerCase().includes(needle) && !p.body.toLowerCase().includes(needle)) return false;
    return true;
  });
  if (tab === "populer") {
    out = [...out].sort((a, b) => b.likes + b.comment_count * 2 - (a.likes + a.comment_count * 2) || byNewest(a, b));
  }
  return out;
}

on("GET", "/api/feed", (c) => {
  const viewer = c.user?.id || "";
  const mood = c.q.get("mood"), cid = c.q.get("community_id"), topic = c.q.get("topic");
  let posts = c.db.posts.filter((p) => (!mood || p.mood === mood) && (!cid || p.community_id === cid) && (!topic || p.topic === topic));
  posts = [...posts].sort((a, b) => {
    if (cid) {
      const pa = a.pinned_at || "", pb = b.pinned_at || "";
      if (pa !== pb) return pa < pb ? 1 : -1;
    }
    return byNewest(a, b);
  });
  const result = filterFeed(c, visiblePosts(c.db, posts, viewer));
  if (!c.q.get("limit")) return result;
  const limit = Math.min(Math.max(parseInt(c.q.get("limit"), 10) || 20, 1), 50);
  const start = Math.min(parseInt(c.q.get("cursor"), 10) || 0, result.length);
  const end = Math.min(start + limit, result.length);
  return { items: result.slice(start, end), next_cursor: end < result.length ? String(end) : "", total: result.length };
});

on("GET", "/api/feed/post", (c) => {
  const p = postById(c.db, c.q.get("id"));
  if (!p || !canSee(c.db, p, c.user?.id || "")) fail(404, "Post tidak ditemukan");
  return viewPost(p, c.user?.id || "");
});

function canSee(db, p, viewer) {
  return visiblePosts(db, [p], viewer).length > 0;
}

on("POST", "/api/feed", (c) => {
  const u = need(c);
  const b = c.body;
  const title = str(b.title), body = str(b.body);
  if (!title) fail(400, "Judul wajib diisi");
  if (!body) fail(400, "Isi post wajib diisi");
  const mood = b.mood || "diskusi";
  if (!MOODS.includes(mood)) fail(400, "Mood tidak valid");
  let topic = str(b.topic);
  const cid = str(b.community_id);
  if (cid) {
    const comm = commOf(c.db, cid);
    if (!comm) fail(404, "Komunitas tidak ditemukan");
    if (comm.owner_id !== u.id && !isMember(c.db, cid, u.id)) fail(403, "Gabung dulu ke komunitas ini untuk membuat post");
    topic = comm.topic;
  } else if (topic && !TOPICS.includes(topic)) topic = "";
  const asCompany = !!b.as_company;
  if (asCompany && u.account_type !== "business") fail(403, "Hanya akun Bisnis yang bisa memposting atas nama perusahaan");
  const media = (b.media_ids || []).map((id) => c.db.media[id]).filter(Boolean).map((m) => ({ type: m.type, url: m.url }));
  const p = {
    id: uid("p_"), author_id: u.id, author_name: asCompany ? u.company_name : u.name,
    is_anonymous: !!b.is_anonymous && !asCompany, community_id: cid, topic, as_company: asCompany,
    company_verified: asCompany && u.verification_status === "verified", media, title, body, mood,
    likes: 0, reposts: 0, comment_count: 0, created_at: nowIso(), pinned_at: null,
  };
  c.db.posts.push(p);
  emit("post_created", { id: p.id });
  return viewPost(p, u.id);
});

on("DELETE", "/api/feed", (c) => {
  const u = need(c);
  const p = postById(c.db, c.q.get("id"));
  if (!p) fail(404, "Post tidak ditemukan");
  const comm = p.community_id ? commOf(c.db, p.community_id) : null;
  if (p.author_id !== u.id && !(comm && isCommAdmin(c.db, comm, u.id))) fail(403, "Kamu tidak bisa menghapus post ini");
  c.db.posts = c.db.posts.filter((x) => x.id !== p.id);
  c.db.comments = c.db.comments.filter((x) => x.post_id !== p.id);
  c.db.inter = c.db.inter.filter((i) => i.t !== p.id);
  emit("post_deleted", { id: p.id });
  return { ok: true };
});

// like / simpan / bagikan / repost
function togglePostFlag(kind, field) {
  return (c) => {
    const u = need(c);
    const p = postById(c.db, c.q.get("id"));
    if (!p || !canSee(c.db, p, u.id)) fail(404, "Post tidak ditemukan");
    const turnOn = c.method === "POST";
    if (turnOn) addInter(c.db, kind, u.id, p.id);
    else delInter(c.db, kind, u.id, p.id);
    if (kind === "like") p.likes = usersWith(c.db, "like", p.id).length;
    if (kind === "repost") p.reposts = usersWith(c.db, "repost", p.id).length;
    if (kind === "repost" && turnOn && p.author_id !== u.id) {
      notify(c.db, p.author_id, "repost", `${u.name} me-repost postmu`, `/post/${p.id}`);
    }
    if (kind === "like" || kind === "repost") emitPostUpdated(p);
    const out = { ok: true, [field]: turnOn };
    if (kind === "like") out.likes = p.likes;
    if (kind === "repost") out.reposts = p.reposts;
    return out;
  };
}
for (const m of ["POST", "DELETE"]) {
  on(m, "/api/feed/like", togglePostFlag("like", "liked"));
  on(m, "/api/feed/save", togglePostFlag("save", "saved"));
  on(m, "/api/feed/share", togglePostFlag("share", "shared"));
  on(m, "/api/feed/repost", togglePostFlag("repost", "reposted"));
}
on("GET", "/api/feed/me", (c) => {
  const u = need(c);
  return {
    liked: idsOf(c.db, "like", u.id), saved: idsOf(c.db, "save", u.id), shared: idsOf(c.db, "share", u.id),
    reposted: idsOf(c.db, "repost", u.id), comment_liked: idsOf(c.db, "clike", u.id),
  };
});
const postsOfKind = (kind) => (c) => {
  const u = need(c);
  const ids = idsOf(c.db, kind, u.id);
  return visiblePosts(c.db, ids.map((id) => postById(c.db, id)).filter(Boolean), u.id);
};
on("GET", "/api/feed/saved", postsOfKind("save"));
on("GET", "/api/feed/shared", postsOfKind("share"));
on("GET", "/api/feed/reposted", postsOfKind("repost"));
on("GET", "/api/feed/following", (c) => {
  const u = need(c);
  const followed = new Set(idsOf(c.db, "follow", u.id));
  const reposted = new Set(c.db.inter.filter((i) => i.k === "repost" && followed.has(i.u)).map((i) => i.t));
  const list = c.db.posts.filter((p) => (followed.has(p.author_id) && !p.is_anonymous) || reposted.has(p.id));
  return visiblePosts(c.db, [...list].sort(byNewest), u.id);
});
on("GET", "/api/feed/reported", (c) => {
  const u = need(c);
  return { post_ids: c.db.reports.filter((r) => r.reporter_id === u.id).map((r) => r.post_id) };
});
on("POST", "/api/reports", (c) => {
  const u = need(c);
  const post_id = str(c.body.post_id);
  if (!postById(c.db, post_id)) fail(404, "Post tidak ditemukan");
  if (c.db.reports.some((r) => r.reporter_id === u.id && r.post_id === post_id)) fail(409, "Kamu sudah melaporkan post ini");
  const r = { id: uid("r_"), reporter_id: u.id, post_id, category: str(c.body.category), subcategory: str(c.body.subcategory), details: str(c.body.details), created_at: nowIso() };
  c.db.reports.push(r);
  return { ok: true, id: r.id };
});

// media post
on("POST", "/api/media", async (c) => {
  need(c);
  const f = fileOf(c, "file");
  if (!f) fail(400, "File wajib diunggah");
  const isImg = f.type.startsWith("image/"), isVid = f.type.startsWith("video/");
  if (!isImg && !isVid) fail(400, "Hanya gambar atau video yang didukung");
  if (isImg && f.size > 10 * 1024 * 1024) fail(400, "Ukuran gambar maksimal 10 MB");
  if (isVid && f.size > 50 * 1024 * 1024) fail(400, "Ukuran video maksimal 50 MB");
  const id = uid("m_");
  // Video memakai blob URL (hanya hidup selama tab terbuka) agar localStorage tidak penuh.
  const url = isImg ? await imageToDataUrl(f, 1280, 0.8) : URL.createObjectURL(f);
  const m = { id, type: isImg ? "image" : "video", url };
  c.db.media[id] = m;
  return m;
});

// ================= KOMENTAR =================
const commentsView = (db, post, list, viewer) =>
  list.map((cm) => {
    const out = { ...cm };
    if (post?.is_anonymous && cm.author_id === post.author_id && viewer !== post.author_id) {
      out.author_id = "";
      out.author_name = "Anonim";
    }
    return out;
  });

on("GET", "/api/feed/comments", (c) => {
  const post = postById(c.db, c.q.get("post_id"));
  if (!post || !canSee(c.db, post, c.user?.id || "")) fail(404, "Post tidak ditemukan");
  const list = c.db.comments.filter((x) => x.post_id === post.id).sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
  return commentsView(c.db, post, list, c.user?.id || "");
});
on("POST", "/api/feed/comments", (c) => {
  const u = need(c);
  const post = postById(c.db, c.q.get("post_id"));
  if (!post || !canSee(c.db, post, u.id)) fail(404, "Post tidak ditemukan");
  const body = str(c.body.body), sticker = str(c.body.sticker), parent = str(c.body.parent_id);
  if (!body && !sticker) fail(400, "Isi komentar tidak boleh kosong");
  let parentC = null;
  if (parent) {
    parentC = c.db.comments.find((x) => x.id === parent && x.post_id === post.id);
    if (!parentC) fail(404, "Komentar yang dibalas tidak ditemukan");
  }
  const cm = { id: uid("cm_"), post_id: post.id, parent_id: parent, author_id: u.id, author_name: u.name, body, sticker, likes: 0, deleted: false, created_at: nowIso() };
  c.db.comments.push(cm);
  post.comment_count = c.db.comments.filter((x) => x.post_id === post.id && !x.deleted).length;
  if (post.author_id !== u.id) notify(c.db, post.author_id, "comment", `${u.name} mengomentari postmu`, `/post/${post.id}`);
  if (parentC && parentC.author_id !== u.id && parentC.author_id !== post.author_id) {
    notify(c.db, parentC.author_id, "comment", `${u.name} membalas komentarmu`, `/post/${post.id}`);
  }
  emit("comment_added", { post_id: post.id, comment: cm });
  emitPostUpdated(post);
  return commentsView(c.db, post, [cm], u.id)[0];
});
on("DELETE", "/api/feed/comments", (c) => {
  const u = need(c);
  const cm = c.db.comments.find((x) => x.id === c.q.get("id"));
  if (!cm) fail(404, "Komentar tidak ditemukan");
  const post = postById(c.db, cm.post_id);
  if (cm.author_id !== u.id && post?.author_id !== u.id) fail(403, "Kamu tidak bisa menghapus komentar ini");
  cm.deleted = true;
  cm.body = "";
  cm.sticker = "";
  if (post) {
    post.comment_count = c.db.comments.filter((x) => x.post_id === post.id && !x.deleted).length;
    emitPostUpdated(post);
  }
  emit("comment_updated", { post_id: cm.post_id, comment: cm });
  return cm;
});
for (const m of ["POST", "DELETE"]) {
  on(m, "/api/feed/comments/like", (c) => {
    const u = need(c);
    const cm = c.db.comments.find((x) => x.id === c.q.get("id"));
    if (!cm) fail(404, "Komentar tidak ditemukan");
    if (c.method === "POST") addInter(c.db, "clike", u.id, cm.id);
    else delInter(c.db, "clike", u.id, cm.id);
    cm.likes = usersWith(c.db, "clike", cm.id).length;
    emit("comment_updated", { post_id: cm.post_id, comment: cm });
    return cm;
  });
}

// ================= FOLLOW =================
for (const m of ["POST", "DELETE"]) {
  on(m, "/api/follow", (c) => {
    const u = need(c);
    const target = userById(c.db, c.q.get("id"));
    if (!target) fail(404, "Pengguna tidak ditemukan");
    if (target.id === u.id) fail(400, "Kamu tidak bisa mengikuti dirimu sendiri");
    if (c.method === "POST") {
      if (blockedEither(c.db, u.id, target.id)) fail(403, "Tidak bisa mengikuti pengguna ini");
      if (!hasInter(c.db, "follow", u.id, target.id)) {
        addInter(c.db, "follow", u.id, target.id);
        notify(c.db, target.id, "follow", `${u.name} mulai mengikuti kamu`, `/pengguna/${u.id}`);
      }
    } else delInter(c.db, "follow", u.id, target.id);
    return { ok: true, following: c.method === "POST" };
  });
}
on("GET", "/api/follow", (c) => {
  const viewer = c.user?.id || "";
  const target = c.q.get("id") || viewer;
  if (!userById(c.db, target)) fail(404, "Pengguna tidak ditemukan");
  return {
    followers: usersWith(c.db, "follow", target), following: idsOf(c.db, "follow", target),
    is_following: hasInter(c.db, "follow", viewer, target),
  };
});

// ================= BLOKIR =================
on("GET", "/api/blocks", (c) => {
  const u = need(c);
  return c.db.blocks.filter((b) => b.blocker_id === u.id).map((b) => {
    const t = userById(c.db, b.blocked_id);
    return { user_id: b.blocked_id, name: t?.name || "Pengguna", company_name: t?.company_name || "", blocked_at: b.created_at };
  });
});
on("POST", "/api/blocks", (c) => {
  const u = need(c);
  const id = str(c.body.user_id);
  if (!userById(c.db, id)) fail(404, "Pengguna tidak ditemukan");
  if (id === u.id) fail(400, "Kamu tidak bisa memblokir dirimu sendiri");
  if (!c.db.blocks.some((b) => b.blocker_id === u.id && b.blocked_id === id)) {
    c.db.blocks.push({ blocker_id: u.id, blocked_id: id, created_at: nowIso() });
    delInter(c.db, "follow", u.id, id);
    delInter(c.db, "follow", id, u.id);
  }
  return { blocked: true };
});
on("DELETE", "/api/blocks", (c) => {
  const u = need(c);
  const id = c.q.get("user_id");
  c.db.blocks = c.db.blocks.filter((b) => !(b.blocker_id === u.id && b.blocked_id === id));
  return { blocked: false };
});

// ================= PESAN & NOTIFIKASI =================
on("GET", "/api/messages", (c) => {
  const u = need(c);
  return c.db.messages.filter((m) => m.from_user_id === u.id || m.to_user_id === u.id)
    .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
});
on("POST", "/api/messages", (c) => {
  const u = need(c);
  const to = str(c.body.to_user_id), body = str(c.body.body);
  if (!to || !body) fail(400, "Penerima dan isi pesan wajib diisi");
  if (to === u.id) fail(400, "Tidak bisa mengirim pesan ke diri sendiri");
  if (!userById(c.db, to)) fail(404, "Pengguna tidak ditemukan");
  if (blockedEither(c.db, u.id, to)) fail(403, "Tidak bisa mengirim pesan ke pengguna ini");
  const m = { id: uid("msg_"), from_user_id: u.id, to_user_id: to, body, created_at: nowIso() };
  c.db.messages.push(m);
  notify(c.db, to, "message", `Pesan baru dari ${u.name}`, "/pesan");
  emit("message", m);
  return m;
});
on("GET", "/api/notifications", (c) => {
  const u = need(c);
  return c.db.notifications.filter((n) => n.user_id === u.id).sort(byNewest);
});
on("POST", "/api/notifications/read", (c) => {
  const u = need(c);
  c.db.notifications.forEach((n) => {
    if (n.user_id === u.id) n.read = true;
  });
  return { ok: true };
});
on("PUT", "/api/notifications/email", (c) => {
  const u = need(c);
  u.email_notify_off = !c.body.enabled;
  return { ok: true, enabled: !!c.body.enabled };
});

// ================= KOMUNITAS =================
const commList = (c) => c.db.communities.map((x) => commOut(c.db, x));
on("GET", "/api/communities", (c) => commList(c));
on("GET", "/api/communities/detail", (c) => {
  const comm = commOf(c.db, c.q.get("id"));
  if (!comm) fail(404, "Komunitas tidak ditemukan");
  return { ...commOut(c.db, comm), my_role: roleIn(c.db, comm, c.user?.id || "") };
});
on("POST", "/api/communities", (c) => {
  const u = need(c);
  const name = str(c.body.name), topic = str(c.body.topic);
  if (!name) fail(400, "Nama komunitas wajib diisi");
  if (!TOPICS.includes(topic)) fail(400, "Topik tidak valid");
  const join = c.body.join_type === "approval" ? "approval" : "open";
  if (c.db.communities.some((x) => x.name.toLowerCase() === name.toLowerCase())) fail(409, "Nama komunitas sudah dipakai");
  const comm = { id: uid("c_"), name, description: str(c.body.description), owner_id: u.id, topic, join_type: join, rules: str(c.body.rules), member_count: 1, created_at: nowIso() };
  c.db.communities.push(comm);
  c.db.members.push({ community_id: comm.id, user_id: u.id, role: "owner" });
  return commOut(c.db, comm);
});
on("POST", "/api/communities/topic", (c) => {
  const u = need(c);
  const comm = commOf(c.db, c.q.get("id"));
  if (!comm) fail(404, "Komunitas tidak ditemukan");
  if (comm.owner_id !== u.id) fail(403, "Hanya pembuat komunitas yang bisa mengubah topik");
  const topic = str(c.body.topic);
  if (!TOPICS.includes(topic)) fail(400, "Topik tidak valid");
  comm.topic = topic;
  c.db.posts.forEach((p) => {
    if (p.community_id === comm.id) p.topic = topic;
  });
  return commOut(c.db, comm);
});
on("POST", "/api/communities/admins", (c) => {
  const u = need(c);
  const comm = commOf(c.db, c.q.get("id"));
  if (!comm) fail(404, "Komunitas tidak ditemukan");
  if (comm.owner_id !== u.id) fail(403, "Hanya pembuat komunitas yang bisa mengatur co-admin");
  const m = c.db.members.find((x) => x.community_id === comm.id && x.user_id === c.q.get("user_id"));
  if (!m || m.role === "owner") fail(400, "Pengguna bukan anggota biasa");
  m.role = c.body.admin ? "admin" : "member";
  return { admin: !!c.body.admin };
});
on("POST", "/api/communities/join", (c) => {
  const u = need(c);
  const comm = commOf(c.db, c.q.get("id"));
  if (!comm) fail(404, "Komunitas tidak ditemukan");
  if (comm.join_type === "approval") fail(403, "Komunitas ini memerlukan persetujuan pembuat");
  if (!isMember(c.db, comm.id, u.id)) c.db.members.push({ community_id: comm.id, user_id: u.id, role: "member" });
  return { ...commOut(c.db, comm), my_role: roleIn(c.db, comm, u.id) };
});
on("POST", "/api/communities/leave", (c) => {
  const u = need(c);
  const comm = commOf(c.db, c.q.get("id"));
  if (!comm) fail(404, "Komunitas tidak ditemukan");
  if (comm.owner_id === u.id) fail(400, "Pembuat komunitas tidak bisa keluar");
  c.db.members = c.db.members.filter((m) => !(m.community_id === comm.id && m.user_id === u.id));
  return { ...commOut(c.db, comm), my_role: "" };
});
on("GET", "/api/communities/joined", (c) => {
  const u = need(c);
  const ids = new Set(c.db.members.filter((m) => m.user_id === u.id).map((m) => m.community_id));
  return commList(c).filter((x) => ids.has(x.id));
});
on("GET", "/api/communities/members", (c) => {
  const u = need(c);
  const comm = commOf(c.db, c.q.get("id"));
  if (!comm) fail(404, "Komunitas tidak ditemukan");
  if (comm.join_type === "approval" && !isMember(c.db, comm.id, u.id)) fail(403, "Daftar anggota hanya untuk anggota");
  return c.db.members.filter((m) => m.community_id === comm.id).map((m) => {
    const mu = userById(c.db, m.user_id);
    return mu ? { ...summary(mu), is_owner: m.role === "owner", role: m.role } : null;
  }).filter(Boolean).sort((a, b) => (b.is_owner - a.is_owner) || a.name.localeCompare(b.name));
});
on("POST", "/api/communities/posts/pin", (c) => {
  const u = need(c);
  const comm = commOf(c.db, c.q.get("id"));
  const p = postById(c.db, c.q.get("post"));
  if (!comm || !p || p.community_id !== comm.id) fail(404, "Post tidak ditemukan di komunitas ini");
  if (!isCommAdmin(c.db, comm, u.id)) fail(403, "Hanya admin komunitas yang bisa menyematkan post");
  p.pinned_at = c.body.pinned ? nowIso() : null;
  return viewPost(p, u.id);
});
on("POST", "/api/communities/requests", (c) => {
  const u = need(c);
  const comm = commOf(c.db, c.q.get("id"));
  if (!comm) fail(404, "Komunitas tidak ditemukan");
  if (comm.join_type !== "approval") fail(400, "Komunitas ini terbuka untuk umum");
  if (isMember(c.db, comm.id, u.id)) fail(409, "Kamu sudah menjadi anggota");
  if (!c.db.joinReqs.some((r) => r.community_id === comm.id && r.user_id === u.id)) {
    c.db.joinReqs.push({ community_id: comm.id, user_id: u.id, user_name: u.name, message: str(c.body.message), created_at: nowIso() });
    notify(c.db, comm.owner_id, "join_request", `${u.name} ingin bergabung ke ${comm.name}`, `/komunitas/${comm.id}`);
  }
  return { status: "pending" };
});
on("POST", "/api/communities/requests/cancel", (c) => {
  const u = need(c);
  c.db.joinReqs = c.db.joinReqs.filter((r) => !(r.community_id === c.q.get("id") && r.user_id === u.id));
  return { status: "cancelled" };
});
on("GET", "/api/communities/my-requests", (c) => {
  const u = need(c);
  return c.db.joinReqs.filter((r) => r.user_id === u.id).map((r) => r.community_id);
});
on("GET", "/api/communities/requests", (c) => {
  const u = need(c);
  const comm = commOf(c.db, c.q.get("id"));
  if (!comm) fail(404, "Komunitas tidak ditemukan");
  if (!isCommAdmin(c.db, comm, u.id)) fail(403, "Hanya admin komunitas");
  return c.db.joinReqs.filter((r) => r.community_id === comm.id).sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
});
function decideRequest(approve) {
  return (c) => {
    const u = need(c);
    const comm = commOf(c.db, c.q.get("id"));
    if (!comm) fail(404, "Komunitas tidak ditemukan");
    if (!isCommAdmin(c.db, comm, u.id)) fail(403, "Hanya admin komunitas");
    const uidv = c.q.get("user_id");
    if (!c.db.joinReqs.some((r) => r.community_id === comm.id && r.user_id === uidv)) fail(404, "Permintaan tidak ditemukan");
    c.db.joinReqs = c.db.joinReqs.filter((r) => !(r.community_id === comm.id && r.user_id === uidv));
    if (approve) {
      if (!isMember(c.db, comm.id, uidv)) c.db.members.push({ community_id: comm.id, user_id: uidv, role: "member" });
      notify(c.db, uidv, "join_approved", `Permintaanmu bergabung ke ${comm.name} disetujui`, `/komunitas/${comm.id}`);
      return commOut(c.db, comm);
    }
    notify(c.db, uidv, "join_rejected", `Permintaanmu bergabung ke ${comm.name} ditolak`, "/komunitas");
    return { status: "rejected" };
  };
}
on("POST", "/api/communities/requests/approve", decideRequest(true));
on("POST", "/api/communities/requests/reject", decideRequest(false));

