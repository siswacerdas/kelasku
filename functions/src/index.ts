/**
 * Cloud Function generateRpm: pembuat RPM dengan AI, KHUSUS ADMIN.
 * - Hanya akun ber-custom-claim admin yang dapat memanggil (diperiksa di sini, bukan di klien).
 * - Kunci API disimpan sebagai secret fungsi; tidak pernah sampai ke klien.
 * - Hasil disimpan ke rpmLibrary dengan status "draf"; penerbitan tetap oleh admin.
 * - Dibatasi DAILY_LIMIT pembuatan per admin per hari.
 */
import Anthropic from "@anthropic-ai/sdk";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { defineSecret, defineString } from "firebase-functions/params";
import { logger } from "firebase-functions";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { DAILY_LIMIT, DEFAULT_MODEL, PROMPT_VERSION, REGION } from "../../src/features/rpm-ai/config";
import { buildLibraryPayload, generateRpmCore } from "../../src/features/rpm-ai/generate";
import { INSTRUKSI } from "../../src/features/rpm-ai/prompt";
import type { Deps } from "../../src/features/rpm-ai/types";
import { validateGenInput } from "../../src/features/rpm-ai/validate";
import bukuRpm from "../prompts/buku-saku-rpm-v3.md";
import bukuScaffolding from "../prompts/buku-saku-scaffolding-sd-v2.md";
import bukuCpAtpTp from "../prompts/buku-saku-cp-atp-tp-v1.1.md";

initializeApp();
const db = getFirestore();
const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");
const MODEL = defineString("ANTHROPIC_MODEL", { default: DEFAULT_MODEL });

const SYSTEM: Deps["system"] = [
  { text: INSTRUKSI },
  // Blok besar yang stabil: di-cache agar panggilan berikutnya jauh lebih murah dan cepat.
  { text: `# BUKU SAKU RPM v3\n\n${bukuRpm}\n\n# BUKU SAKU SCAFFOLDING SD v2\n\n${bukuScaffolding}\n\n# BUKU SAKU CP-ATP-TP v1.1\n\n${bukuCpAtpTp}`, cache: true },
];

function makeCallModel(client: Anthropic, model: string): Deps["callModel"] {
  return async (req) => {
    const res = await client.messages.create({
      model,
      max_tokens: req.maxTokens,
      system: req.system.map((b) => ({ type: "text" as const, text: b.text, ...(b.cache ? { cache_control: { type: "ephemeral" as const } } : {}) })),
      messages: [{ role: "user", content: req.user }],
      tools: [{ name: req.tool.name, description: req.tool.description, input_schema: req.tool.schema as Anthropic.Tool.InputSchema }],
      tool_choice: { type: "tool", name: req.tool.name },
    });
    if (res.stop_reason === "max_tokens") throw new Error("Keluaran model terpotong (melebihi batas token).");
    const block = res.content.find((b) => b.type === "tool_use");
    if (!block || block.type !== "tool_use") throw new Error("Model tidak mengembalikan keluaran terstruktur.");
    return {
      input: block.input,
      usage: { input: res.usage.input_tokens, output: res.usage.output_tokens, cacheRead: res.usage.cache_read_input_tokens ?? 0, cacheWrite: res.usage.cache_creation_input_tokens ?? 0 },
    };
  };
}

/** Kuota harian per admin (dihitung per percobaan karena biaya sudah timbul). Koleksi aiUsage tertutup bagi klien. */
async function takeQuota(uid: string) {
  const day = new Date().toISOString().slice(0, 10);
  const ref = db.doc(`aiUsage/${uid}_${day}`);
  await db.runTransaction(async (tx) => {
    const n = ((await tx.get(ref)).data()?.count as number | undefined) ?? 0;
    if (n >= DAILY_LIMIT) throw new HttpsError("resource-exhausted", `Batas ${DAILY_LIMIT} pembuatan per hari tercapai. Coba lagi besok.`);
    tx.set(ref, { uid, day, count: n + 1, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });
}

export const generateRpm = onCall(
  { region: REGION, secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 540, memory: "1GiB", maxInstances: 3 },
  async (req) => {
    if (!req.auth) throw new HttpsError("unauthenticated", "Masuk terlebih dahulu.");
    if (req.auth.token.admin !== true) throw new HttpsError("permission-denied", "Fitur ini hanya untuk admin.");
    const uid = req.auth.uid;

    let input;
    try { input = validateGenInput(req.data); } catch (e) { throw new HttpsError("invalid-argument", e instanceof Error ? e.message : "Masukan tidak sah."); }

    await takeQuota(uid);
    const model = MODEL.value();
    let res;
    try {
      res = await generateRpmCore(input, { callModel: makeCallModel(new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() }), model), system: SYSTEM });
    } catch (e) {
      logger.error("generateRpm gagal", { uid, error: e instanceof Error ? e.message : String(e) });
      throw new HttpsError("internal", `Penyusunan gagal: ${e instanceof Error ? e.message : "kesalahan tak dikenal"}`);
    }

    const judul = `${input.meta.mapelNama} kelas ${input.meta.grade}: ${input.meta.topik} (pertemuan ${input.meta.pertemuanKe}/${input.meta.dariPertemuan})`;
    const payload = buildLibraryPayload(res, { judul, uid, model, promptVersion: PROMPT_VERSION });
    const ref = await db.collection("rpmLibrary").add({ ...payload, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    logger.info("generateRpm selesai", { uid, id: ref.id, usage: res.usage, remaining: payload.ai.remaining });
    return { id: ref.id, judul, remaining: payload.ai.remaining, repaired: res.repaired, adjustedTime: res.adjustedTime, usage: res.usage };
  },
);
