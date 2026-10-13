// Bagian Pengaturan <-> alamat halamannya di HP (/pengaturan/<slug>).
// Kunci di kiri sama dengan kunci tab di SettingsModal.
export const SETTINGS_SLUG = {
  account: "akun",
  about: "tentang",
  business: "bisnis",
  mentor: "mentor",
  notifications: "notifikasi",
  privacy: "privasi",
  report: "laporan",
};

export const SETTINGS_TAB_BY_SLUG = Object.fromEntries(
  Object.entries(SETTINGS_SLUG).map(([tab, slug]) => [slug, tab])
);

export const SETTINGS_LABEL = {
  account: "Akun & Keamanan",
  about: "Tentang",
  business: "Akun Bisnis",
  mentor: "Pengaturan Mentor",
  notifications: "Notifikasi",
  privacy: "Privasi",
  report: "Pusat Laporan",
};

export function settingsPath(tab) {
  return `/pengaturan/${SETTINGS_SLUG[tab] || SETTINGS_SLUG.account}`;
}
