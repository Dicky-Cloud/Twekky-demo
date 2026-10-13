# Deploy demo ke Vercel (frontend saja)

Frontend ini sudah dilengkapi **backend tiruan di browser** (`src/mock/`), jadi bisa
dideploy sebagai situs statis di Vercel tanpa server Go.

## Cara deploy
1. Pastikan hanya folder `frontend/` yang dipakai sebagai project (Root Directory = `frontend`).
2. Vercel otomatis mendeteksi Vite (`vercel.json` sudah disediakan: build `npm run build`, output `dist`,
   dan rewrite SPA agar `/post/123` tidak 404 saat di-refresh).
3. Tidak perlu environment variable. Jangan unggah file `.env` dari backend.

## Akun demo (kata sandi: `demo1234`)
| Peran | Email |
|---|---|
| Pencari kerja | rina@demo.com |
| Engineer | budi@demo.com |
| HR (Pro) | sari@demo.com |
| Perusahaan (paket Growth, terverifikasi) | hr@majudigital.com |

Anda juga bisa mendaftar akun baru lewat halaman Daftar.

## Cara kerja & batasan
- Semua data (user, post, komentar, lowongan, lamaran, dll.) disimpan di **localStorage browser**.
  Data **tidak dibagikan** antar perangkat/pengunjung; setiap pengunjung punya salinan sendiri.
- Realtime antar tab di browser yang sama berjalan lewat BroadcastChannel.
- Gambar diperkecil lalu disimpan sebagai data URL. Video hanya bertahan selama tab terbuka.
  CV/PDF di atas ~700 KB tidak ikut tersimpan (unduhan menampilkan berkas pratinjau).
- Kuota localStorage ±5 MB; bila penuh, data tetap hidup di memori sampai tab ditutup.
- Reset kata sandi lewat email, pembayaran sungguhan, dan fitur mentor-server tidak aktif.
  Verifikasi perusahaan langsung disetujui dan langganan Pro/Bisnis langsung aktif (demo).
- Kembalikan data awal: jalankan `__twekkyResetDemo()` di Console browser.

## Kembali ke backend Go
Set `VITE_USE_MOCK=false` dan `VITE_API_URL=https://alamat-backend-anda` saat build.
