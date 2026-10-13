# Twekky Frontend (Vite + React + Tailwind)

Frontend for Twekky, restyled to match the reference layout: a collapsible
sidebar (Feed, Community, Lowongan Kerja, Buat Post, Pesan, Notifikasi,
Profil) with a topbar (search + avatar + logout) above each page. Styling
is 100% Tailwind utility classes now — `src/index.css` only has the three
`@tailwind` directives plus a small `@layer components` block for repeated
patterns (`.btn`, `.card`, `.field-input`, `.field-label`). No more custom
`.post-card`, `.sidebar-link` etc. CSS. Talks to the `twekky-backend` Gin API.

## Setup

```bash
npm install
cp .env.example .env   # points VITE_API_URL at your backend
npm run dev
```

Runs on http://localhost:5173 and expects the backend at
http://localhost:8080. `npm install` will pull in `tailwindcss`,
`postcss`, and `autoprefixer` — needs internet the first time.

## Sidebar

Click the chevron next to the "Twekky" logo to collapse the sidebar down to
just icons (72px), and the chevron that appears in its place to expand it
back (240px). The border between sidebar and content (`border-r`), and the
line separating the main nav from "Twekky Rules"/"Agreements" (`<hr>`), are
both visible dividers now — not just implied by spacing.

## Pages / features

| Sidebar item     | Route             | Backed by                                   |
|------------------|--------------------|-----------------------------------------------|
| Feed             | `/`                | `GET /api/feed`, mood filter, like            |
| Community        | `/komunitas`        | `GET/POST /api/communities`                   |
| Lowongan Kerja   | `/lowongan-kerja`  | `GET/POST /api/jobs`, `POST /api/jobs/apply`  |
| Buat Post        | `/buat-post`        | `POST /api/feed`                              |
| Pesan            | `/pesan`            | `GET/POST /api/messages`                      |
| Notifikasi       | `/notifikasi`       | `GET /api/notifications`, mark-all-read        |
| Profil           | `/profil`           | `GET/PUT /api/profile/me`, upgrade to business |

## Known gaps (real limits of the current backend, not faked in the UI)

- **Komunitas "Gabung"** — there's no join/member endpoint yet
  (`internal/repository/community_repo.go` only has `Create`/`List`), so the
  button shows a note instead of pretending to join.
- **Pesan** — `Message` only stores user IDs, and there's no
  `GET /api/users/:id` to resolve a name, so conversations show a short ID.
  Paste a user ID in the box above the conversation list to start a new
  thread.
- **Profil stats** — only "Postingan" and "Suka diterima" are shown because
  they're the only numbers the backend actually tracks (computed
  client-side by filtering `/api/feed` by `author_id`). "Disimpan" /
  "Dibagikan" tabs say plainly that the feature isn't backed yet.
- **Buat Post photo/video** — the icons are shown (matching the reference
  design) but disabled-looking, since `Post` has no media fields.

## Structure

```
src/
  api/client.js              fetch wrapper, one function per backend endpoint
  context/AuthContext.jsx     current user, token persistence, login/register/logout
  context/NotificationContext.jsx  polls unread notifications + message presence for sidebar dots
  components/Sidebar.jsx, Topbar.jsx, PostCard.jsx, MoodBadge.jsx, ProtectedRoute.jsx
  pages/                      FeedPage, CommunitiesPage, JobsPage, CreatePostPage,
                               MessagesPage, NotificationsPage, ProfilePage, LoginPage, RegisterPage
```
