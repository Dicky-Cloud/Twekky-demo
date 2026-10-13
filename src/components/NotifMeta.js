// Ikon, judul, dan format waktu notifikasi (dipakai dropdown notifikasi di Topbar).
import { MessageSquare, Mail, Briefcase, Bell, UserPlus, CheckCircle2, XCircle, CalendarClock } from "lucide-react";

export const NOTIF_ICONS = {
  comment: MessageSquare,
  message: Mail,
  job_match: Briefcase,
  job_alert: Briefcase,
  join_request: UserPlus,
  join_approved: CheckCircle2,
  join_rejected: XCircle,
  job_application: Briefcase,
  application_status: CheckCircle2,
  interview: CalendarClock,
};

export const NOTIF_TITLES = {
  comment: "Komentar Baru",
  message: "Pesan Baru",
  job_match: "Lowongan Cocok",
  job_alert: "Lowongan Baru Cocok",
  join_request: "Permintaan Bergabung",
  join_approved: "Permintaan Disetujui",
  join_rejected: "Permintaan Ditolak",
  job_application: "Pelamar Baru",
  application_status: "Status Lamaran",
  interview: "Wawancara",
};

export const NotifFallbackIcon = Bell;

export function notifTimeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}