export type FaseKey = "A" | "B" | "C";
export type CpElemen = { nama: string; cp: Partial<Record<FaseKey, string>> };
export type CpMapel = { id: string; nama: string; sumber: "km-2025" | "ismuba-2024"; fase: FaseKey[]; elemen: CpElemen[] };
export type CpData = { sumber: string; mapel: CpMapel[] };

export const FASE_LABEL: Record<FaseKey, string> = { A: "Kelas 1–2", B: "Kelas 3–4", C: "Kelas 5–6" };
export const SUMBER_LABEL = { "km-2025": "Kurikulum Merdeka 2025", "ismuba-2024": "ISMUBA Muhammadiyah 2024" } as const;

/** Dimuat dinamis agar data CP (sekitar 40 KB) hanya diunduh saat halaman Bank CP dibuka. */
export async function loadCp(): Promise<CpData> {
  return (await import("../../data/cp.json")).default as unknown as CpData;
}

const norm = (s: string) => s.toLowerCase();

/** Semua kata pencarian harus ditemukan di nama mapel, nama elemen, atau teks CP. */
export function searchCp(data: CpData, query: string): { mapel: CpMapel; elemen: CpElemen }[] {
  const terms = norm(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  const hits: { mapel: CpMapel; elemen: CpElemen }[] = [];
  for (const mapel of data.mapel)
    for (const elemen of mapel.elemen) {
      const hay = norm([mapel.nama, elemen.nama, ...Object.values(elemen.cp)].join(" "));
      if (terms.every((t) => hay.includes(t))) hits.push({ mapel, elemen });
    }
  return hits;
}
