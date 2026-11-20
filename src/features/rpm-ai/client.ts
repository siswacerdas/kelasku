import { httpsCallable } from "firebase/functions";
import { functions } from "../../lib/firebase";
import { FUNCTION_NAME } from "./config";
import type { GenInput, Usage } from "./types";

export type GenResponse = { id: string; judul: string; remaining: string[]; repaired: boolean; adjustedTime: boolean; usage: Usage };

/** Memanggil fungsi AI (khusus admin). Batas waktu klien disamakan dengan batas fungsi (callable bawaan hanya 70 detik). */
export async function generateRpmAi(input: GenInput): Promise<GenResponse> {
  const fn = httpsCallable<GenInput, GenResponse>(functions, FUNCTION_NAME, { timeout: 560_000 });
  return (await fn(input)).data;
}

export function explainAiError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? "";
  const msg = (e as { message?: string })?.message ?? "";
  if (code.includes("permission-denied")) return "Akun Anda bukan admin, atau peran admin belum aktif. Keluar lalu masuk lagi setelah peran dipasang.";
  if (code.includes("unauthenticated")) return "Sesi berakhir. Masuk kembali.";
  if (code.includes("resource-exhausted")) return msg || "Batas harian tercapai. Coba lagi besok.";
  if (code.includes("invalid-argument")) return msg || "Masukan belum sah.";
  if (code.includes("not-found") || code.includes("unavailable")) return "Fungsi AI belum terpasang atau belum dapat dijangkau. Pastikan sudah di-deploy (lihat README).";
  if (code.includes("deadline-exceeded")) return "Waktu habis. Hasil mungkin tetap masuk pustaka; periksa daftar sebelum mencoba lagi.";
  return msg || "Penyusunan gagal. Coba lagi.";
}
