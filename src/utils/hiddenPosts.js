// src/utils/hiddenPosts.js
// Post yang disembunyikan lewat menu ⋯ di Feed. Disimpan per browser (localStorage).
export const HIDDEN_KEY = "twekky_hidden_posts";

export function loadHiddenIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

export function saveHiddenIds(ids) {
  try {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify([...ids]));
  } catch {
    /* penyimpanan tidak tersedia; pilihan hanya berlaku selama halaman terbuka */
  }
}