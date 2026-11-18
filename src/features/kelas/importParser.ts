import type { Gender } from "./types";

/**
 * Pembaca daftar siswa (hasil tempel dari Excel, CSV, atau sel-sel berkas .xlsx).
 * Murni (tanpa DOM/Firebase) agar mudah diuji. Kontrak: lihat KELAS-1 di docs/ANTI-REGRESI.md.
 *
 * Template boleh disesuaikan pengguna: urutan kolom bebas, kolom selain Nama boleh dihapus,
 * kolom asing diabaikan. Kolom dikenali dari JUDUL-nya (lihat ALIASES).
 */
export type StudentInput = { name: string; nis: string; nisn: string; gender: Gender };
export type Problem = { level: "error" | "warn"; text: string };
export type ParsedRow = { line: number; student: StudentInput; problems: Problem[]; skip: boolean };
export type ParseResult = { rows: ParsedRow[]; usedHeader: boolean; tooMany: boolean };

export const MAX_ROWS = 300;

type Field = keyof StudentInput;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const ALIASES: Record<Field, string[]> = {
  name: ["Nama", "Nama Siswa", "Nama Lengkap", "Nama Peserta Didik"],
  nis: ["NIS", "Nomor Induk", "No Induk", "Nomor Induk Siswa"],
  nisn: ["NISN"],
  gender: ["Jenis Kelamin", "JK", "L/P", "Kelamin", "Gender"],
};
const FIELD_BY_HEADER = new Map<string, Field>();
(Object.keys(ALIASES) as Field[]).forEach((f) => ALIASES[f].forEach((a) => FIELD_BY_HEADER.set(norm(a), f)));

type Cols = Partial<Record<Field, number>>;

function detectHeader(cells: string[]): Cols | null {
  const cols: Cols = {};
  cells.forEach((c, i) => {
    const f = FIELD_BY_HEADER.get(norm(c));
    if (f && cols[f] === undefined) cols[f] = i;
  });
  return cols.name !== undefined ? cols : null;
}

export function normalizeGender(v: string): Gender | null {
  const x = v.trim().toLowerCase();
  if (x === "") return "";
  if (["l", "lk", "laki", "laki-laki", "laki laki", "male", "m"].includes(x)) return "L";
  if (["p", "pr", "perempuan", "wanita", "female", "f"].includes(x)) return "P";
  return null;
}

/** Pemeriksaan satu siswa, dipakai juga oleh formulir ketik satu-satu. */
export function checkStudent(s: StudentInput): Problem[] {
  const p: Problem[] = [];
  if (!s.name) p.push({ level: "error", text: "Nama kosong" });
  if (s.name.length > 100) p.push({ level: "error", text: "Nama lebih dari 100 huruf" });
  if (s.nis.length > 20) p.push({ level: "error", text: "NIS terlalu panjang" });
  if (s.nisn && !/^\d{10}$/.test(s.nisn)) p.push({ level: "warn", text: "NISN biasanya 10 angka" });
  return p;
}

const isEmpty = (r: string[]) => r.every((c) => c === "");

export function parseGrid(input: (string[] | undefined)[]): ParseResult {
  // Array.from agar baris "bolong" (baris kosong pada berkas Excel) ikut terbaca
  const grid = Array.from(input, (r) => Array.from(r ?? [], (c) => (c ?? "").toString().trim()));
  const first = grid.findIndex((r) => !isEmpty(r));
  if (first === -1) return { rows: [], usedHeader: false, tooMany: false };

  let cols: Cols | null = detectHeader(grid[first]);
  const usedHeader = cols !== null;
  let start = first;
  let namesOnly = false;
  if (cols) start = first + 1;
  else if (grid.slice(first).every((r) => r.filter((c) => c !== "").length <= 1)) namesOnly = true;
  else cols = { name: 0, nis: 1, nisn: 2, gender: 3 };

  const rows: ParsedRow[] = [];
  let tooMany = false;
  for (let i = start; i < grid.length; i++) {
    const r = grid[i];
    if (isEmpty(r)) continue;
    const get = (idx: number | undefined) => (idx === undefined ? "" : (r[idx] ?? ""));
    const rawName = namesOnly ? (r.find((c) => c !== "") ?? "") : get(cols?.name);
    const name = rawName.replace(/\s+/g, " ").trim();
    if (/^\(contoh\)/i.test(name)) continue; // baris contoh dari template
    if (rows.length >= MAX_ROWS) {
      tooMany = true;
      break;
    }
    const problems: Problem[] = [];
    const g = normalizeGender(get(cols?.gender));
    if (g === null) problems.push({ level: "warn", text: "Jenis kelamin tidak dikenali, dikosongkan" });
    const student: StudentInput = { name, nis: get(cols?.nis), nisn: get(cols?.nisn), gender: g ?? "" };
    problems.push(...checkStudent(student));
    rows.push({ line: i + 1, student, problems, skip: false });
  }

  // NIS/nama ganda di dalam daftar yang sama
  const seenNis = new Set<string>();
  const seenName = new Set<string>();
  for (const row of rows) {
    const { nis, name } = row.student;
    if (nis) {
      if (seenNis.has(nis)) row.problems.push({ level: "error", text: "NIS ganda di dalam daftar" });
      seenNis.add(nis);
    }
    const key = name.toLowerCase();
    if (name && seenName.has(key)) row.problems.push({ level: "warn", text: "Nama sama dengan baris lain" });
    seenName.add(key);
    row.skip = row.problems.some((p) => p.level === "error");
  }
  return { rows, usedHeader, tooMany };
}

function splitLine(line: string, d: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else quoted = false;
      } else cur += ch;
    } else if (ch === '"' && cur === "") quoted = true;
    else if (ch === d) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

/** Teks tempelan: dari Excel (tab), CSV (titik koma / koma), atau satu nama per baris. */
export function parseText(text: string): ParseResult {
  const d = text.includes("\t") ? "\t" : text.includes(";") ? ";" : text.includes(",") ? "," : "\t";
  return parseGrid(text.replace(/\r\n?/g, "\n").split("\n").map((l) => splitLine(l, d)));
}

/** Cocokkan dengan siswa yang sudah ada di kelas: NIS sama = dilewati, nama sama = peringatan. */
export function markAgainstExisting(rows: ParsedRow[], existing: Pick<StudentInput, "name" | "nis">[]): ParsedRow[] {
  const nis = new Set(existing.map((e) => e.nis).filter(Boolean));
  const names = new Set(existing.map((e) => e.name.toLowerCase()));
  return rows.map((r) => {
    const problems = [...r.problems];
    if (r.student.nis && nis.has(r.student.nis)) problems.push({ level: "error", text: "NIS sudah ada di kelas ini" });
    else if (r.student.name && names.has(r.student.name.toLowerCase()))
      problems.push({ level: "warn", text: "Nama sama dengan siswa yang sudah ada" });
    return { ...r, problems, skip: problems.some((p) => p.level === "error") };
  });
}
