export type NavItem = { to: string; label: string; end?: boolean; prefix?: string };
export type NavGroup = { title?: string; items: NavItem[] };

/** Menu PC (sidebar). Urutannya mengikuti alur kerja guru, bukan daftar fitur teknis. */
export const navGroups: NavGroup[] = [
  { items: [{ to: "/app", label: "Beranda", end: true }] },
  { items: [{ to: "/app/kelas", label: "Kelas & siswa" }] },
  {
    title: "Perencanaan",
    items: [
      { to: "/app/perencanaan/cp", label: "Bank CP" },
      { to: "/app/perencanaan/tujuan", label: "Tujuan pembelajaran" },
      { to: "/app/perencanaan/alur", label: "Alur (ATP)" },
      { to: "/app/perencanaan/tangga", label: "Tangga pertemuan" },
      { to: "/app/perencanaan/rencana", label: "Rencana pembelajaran" },
      { to: "/app/perencanaan/modul", label: "Modul ajar" },
    ],
  },
  {
    items: [
      { to: "/app/asesmen", label: "Asesmen" },
      { to: "/app/nilai", label: "Nilai" },
      { to: "/app/dokumen", label: "Dokumen" },
    ],
  },
  { items: [{ to: "/app/pengaturan", label: "Pengaturan" }] },
];

/** Menu HP (bottom bar). Maksimal 5 item; sisanya ada di menu akun. */
export const mobileTabs: NavItem[] = [
  { to: "/app", label: "Beranda", end: true },
  { to: "/app/kelas", label: "Kelas" },
  { to: "/app/perencanaan/rencana", label: "Rencana", prefix: "/app/perencanaan" },
  { to: "/app/asesmen", label: "Asesmen" },
  { to: "/app/nilai", label: "Nilai" },
];

export function isActive(pathname: string, item: NavItem): boolean {
  if (item.prefix) return pathname.startsWith(item.prefix);
  if (item.end) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(item.to + "/");
}
