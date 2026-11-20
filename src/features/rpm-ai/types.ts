import type { Issue } from "../tp/model";
import type { RpmFields } from "../rpm/model";

export type GenInput = {
  meta: { mapelId: string; mapelNama: string; grade: number; semester: 0 | 1 | 2; topik: string; jp: number; menitPerJp: number; pertemuanKe: number; dariPertemuan: number };
  tp: { kko: string; objek: string; konten: string; bukti: string; jp: number; tahapan: string[]; caraAsesmen: string; tidakDipakai: string };
  cp: string;
  profil: { key: string; answer: "A" | "B"; source: "guru" | "default"; decision: string }[];
  /** Dasar pertemuan dari tangga scaffolding (opsional): isi bebas terstruktur yang diringkas dari dokumen scaffold. */
  dasar?: { label: string; data: Record<string, unknown> };
  arahan: string;
};

export type Usage = { input: number; output: number; cacheRead: number; cacheWrite: number; calls: number };
export type ModelReq = {
  system: { text: string; cache?: boolean }[];
  user: string;
  tool: { name: string; description: string; schema: Record<string, unknown> };
  maxTokens: number;
};
export type ModelRes = { input: unknown; usage?: { input: number; output: number; cacheRead?: number; cacheWrite?: number } };
export type Deps = { callModel: (r: ModelReq) => Promise<ModelRes>; system: ModelReq["system"] };

export type GenResult = { rpm: RpmFields; issues: Issue[]; repaired: boolean; adjustedTime: boolean; usage: Usage };
