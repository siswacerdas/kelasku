/**
 * Satu-satunya daftar bidang isian tunggal RPM. Dipakai editor (menggambar formulir) DAN template Excel
 * (kolom Kode), sehingga keduanya tidak bisa saling menyimpang (RPM-3).
 */
import type { RpmFields } from "./model";

export type Scalar = { code: string; path: string; label: string; section: string; rows?: number; hint?: string; kind?: "text" | "num" | "status" };

export const SECTIONS: Record<string, string> = {
  A1: "A.1 Identitas pembelajaran", A2: "A.2 Analisis peserta didik", A3: "A.3 Analisis materi",
  B1: "B.1 Capaian pembelajaran", B2: "B.2 Tujuan pembelajaran", B3: "B.3 Topik dan konteks nyata", B5: "B.5 Praktik pedagogis utama", B6: "B.6 Kemitraan pembelajaran", B7: "B.7 Lingkungan belajar dan sarana",
  C9: "C. Lensa PAK (opsional)", D1: "D.1 Asesmen awal (diagnostik)", D2: "D.2 Asesmen proses (formatif)", D3: "D.3 Asesmen akhir (sumatif)",
};

export const SCALARS: Scalar[] = [
  { code: "I4", path: "topik", label: "Topik", section: "A1" },
  { code: "I5", path: "jp", label: "Jumlah JP", section: "A1", kind: "num" },
  { code: "I6", path: "menitPerJp", label: "Menit per JP", section: "A1", kind: "num" },
  { code: "I7", path: "pertemuanKe", label: "Pertemuan ke-", section: "A1", kind: "num" },
  { code: "I8", path: "dariPertemuan", label: "Dari berapa pertemuan untuk TP ini", section: "A1", kind: "num" },
  { code: "A21", path: "a.pengetahuanAwal", label: "Pengetahuan awal terkait materi", section: "A2" },
  { code: "A22", path: "a.minat", label: "Minat dan latar belakang yang relevan", section: "A2" },
  { code: "A23", path: "a.gayaBelajar", label: "Gaya belajar dominan", section: "A2", rows: 2 },
  { code: "A24", path: "a.kebutuhan", label: "Kebutuhan spesifik", section: "A2" },
  { code: "A25", path: "a.implikasi", label: "Implikasi bagi pembelajaran", section: "A2" },
  { code: "A31", path: "a.esensial", label: "Pengetahuan esensial", section: "A3" },
  { code: "A32", path: "a.aplikatif", label: "Pengetahuan aplikatif", section: "A3" },
  { code: "A33", path: "a.nilaiKarakter", label: "Nilai-karakter terkait", section: "A3" },
  { code: "A34", path: "a.elemenPak", label: "Elemen PAK terkait (opsional)", section: "A3", rows: 2, hint: "Isi hanya jika ada kaitan alami. Kosongkan bila tidak; jangan dipaksakan." },
  { code: "A35", path: "a.relevansi", label: "Relevansi kehidupan nyata", section: "A3" },
  { code: "A36", path: "a.kesulitan", label: "Tingkat kesulitan", section: "A3", rows: 2 },
  { code: "B1", path: "b.cp", label: "Capaian pembelajaran (disalin dari dokumen resmi)", section: "B1", rows: 4 },
  { code: "B21", path: "b.tpTahunan", label: "TP (tahunan)", section: "B2" },
  { code: "B22", path: "b.tpHarian", label: "TP harian (pertemuan ini)", section: "B2" },
  { code: "B23", path: "b.indikator.0", label: "Indikator terukur 1", section: "B2", rows: 2 },
  { code: "B24", path: "b.indikator.1", label: "Indikator terukur 2 (bila ada)", section: "B2", rows: 2 },
  { code: "B25", path: "b.indikator.2", label: "Indikator terukur 3 (bila ada)", section: "B2", rows: 2 },
  { code: "B26", path: "b.elemenPak", label: "Elemen PAK yang diperkuat (opsional)", section: "B2", rows: 2 },
  { code: "B3", path: "b.konteks", label: "Topik atau konteks nyata", section: "B3" },
  { code: "B5", path: "b.praktik", label: "Model atau strategi (sebut nama) beserta alasannya", section: "B5" },
  { code: "B6", path: "b.kemitraan", label: "Peran orang tua, guru lain, dan teman sebaya", section: "B6", hint: "Tulis 'tidak relevan' bila memang tidak ada." },
  { code: "B7", path: "b.lingkungan", label: "Pengaturan ruang, lingkungan sekitar, media dan alat", section: "B7" },
  { code: "C9", path: "c.catatanPak", label: "Catatan pemetaan Temukan-Bayangkan-Lakukan-Bagikan", section: "C9", rows: 2, hint: "Hanya jika Elemen PAK diisi." },
  { code: "D11", path: "d.diagnostik.tugas", label: "Tugas diagnostik (5 sampai 15 menit)", section: "D1" },
  { code: "D12", path: "d.diagnostik.cara", label: "Cara membaca hasil", section: "D1" },
  { code: "D13", path: "d.diagnostik.tindakLanjut", label: "Tindak lanjut", section: "D1" },
  { code: "D21", path: "d.formatif.minimal", label: "Kriteria Minimal", section: "D2" },
  { code: "D22", path: "d.formatif.standar", label: "Kriteria Standar", section: "D2" },
  { code: "D23", path: "d.formatif.lanjutan", label: "Kriteria Lanjutan", section: "D2" },
  { code: "D31", path: "d.sumatif.status", label: "Status asesmen akhir (formatif atau sumatif)", section: "D3", kind: "status" },
  { code: "D32", path: "d.sumatif.peran", label: "Peran dalam sumatif (jika formatif-saja)", section: "D3", rows: 2 },
  { code: "D33", path: "d.sumatif.instrumen", label: "Instrumen sumatif (jika sumatif)", section: "D3", rows: 2 },
];

export function getPath(o: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((cur, k) => (cur == null ? undefined : (cur as Record<string, unknown>)[k]), o);
}
export function setPath(o: RpmFields, path: string, value: unknown): void {
  const keys = path.split(".");
  let cur = o as unknown as Record<string, unknown>;
  keys.slice(0, -1).forEach((k, i) => {
    if (cur[k] == null) cur[k] = /^\d+$/.test(keys[i + 1]) ? [] : {};
    cur = cur[k] as Record<string, unknown>;
  });
  cur[keys[keys.length - 1]] = value;
}
