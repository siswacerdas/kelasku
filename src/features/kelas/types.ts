export type Gender = "" | "L" | "P";
export type Fase = "A" | "B" | "C";

export type ClassDoc = { id: string; name: string; grade: number; fase: Fase; yearLabel: string };
export type StudentDoc = { id: string; classId: string; name: string; nis: string; nisn: string; gender: Gender };

/** Fase Kurikulum Merdeka untuk SD: A (kelas 1-2), B (3-4), C (5-6). */
export const faseForGrade = (grade: number): Fase => (grade <= 2 ? "A" : grade <= 4 ? "B" : "C");

/** Tahun ajaran berjalan; tahun ajaran baru dimulai Juli. */
export function currentYearLabel(d: Date = new Date()): string {
  const start = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
  return `${start}/${start + 1}`;
}

export const collator = new Intl.Collator("id", { numeric: true, sensitivity: "base" });
