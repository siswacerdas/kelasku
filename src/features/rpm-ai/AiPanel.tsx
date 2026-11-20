import { useEffect, useMemo, useState } from "react";
import type { CpData } from "../cp/data";
import { subscribeClasses } from "../kelas/api";
import type { ClassDoc } from "../kelas/types";
import { mergedProfile, type ScaffoldDoc } from "../scaffold/model";
import { subscribeScaffolds } from "../scaffold/api";
import { subscribeWorkspace, type WorkspaceDoc } from "../settings/api";
import { subscribeTp } from "../tp/api";
import { faseOfGrade, type TpDoc } from "../tp/model";
import { explainAiError, generateRpmAi } from "./client";
import { buildGenInput, dasarOptions } from "./context";
import { DAILY_LIMIT } from "./config";
import { validateGenInput } from "./validate";

const sel = "mt-1 block w-full rounded-md border-2 border-mist bg-white px-3 py-2.5 focus:border-ink";

/** Panel pembuat RPM dengan AI. Hanya dirender untuk admin; pemeriksaan sebenarnya tetap di fungsi dan rules. */
export default function AiPanel({ ws, cp, onDone }: { ws: string; cp: CpData | null; onDone: (msg: string) => void }) {
  const [tps, setTps] = useState<TpDoc[]>([]);
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [scaffolds, setScaffolds] = useState<ScaffoldDoc[]>([]);
  const [wsDoc, setWsDoc] = useState<WorkspaceDoc | null>(null);
  const [tpId, setTpId] = useState("");
  const [dasar, setDasar] = useState("");
  const [topik, setTopik] = useState("");
  const [pertemuanKe, setKe] = useState(1);
  const [dari, setDari] = useState(1);
  const [jp, setJp] = useState(2);
  const [menit, setMenit] = useState(35);
  const [arahan, setArahan] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const off = [subscribeTp(ws, setTps, () => {}), subscribeClasses(ws, setClasses, () => {}), subscribeScaffolds(ws, setScaffolds, () => {}), subscribeWorkspace(ws, setWsDoc, () => {})];
    return () => off.forEach((f) => f());
  }, [ws]);

  const ready = tps.filter((t) => t.status === "siap");
  const tp = ready.find((t) => t.id === tpId);
  const options = useMemo(() => (tp ? dasarOptions(tp, scaffolds, classes) : []), [tp, scaffolds, classes]);

  function pickTp(id: string) {
    setTpId(id); setDasar("");
    const t = ready.find((x) => x.id === id);
    if (t) { setTopik(t.konten); setDari(Math.max(1, Math.ceil((t.jp || 2) / 2))); }
  }

  async function run() {
    if (!tp) return setError("Pilih TP yang sudah berstatus siap.");
    setError(null);
    const sc = scaffolds.find((s) => dasar.startsWith(s.id + "|"));
    const cls = classes.find((c) => c.id === sc?.classId);
    const f = faseOfGrade(tp.grade);
    const cpText = (f && cp?.mapel.find((m) => m.id === tp.mapelId)?.elemen.find((e) => e.nama === tp.cpElemen)?.cp[f]) || "";
    const input = buildGenInput({
      tp, mapelNama: cp?.mapel.find((m) => m.id === tp.mapelId)?.nama ?? tp.mapelId, cpText, profile: mergedProfile(wsDoc?.profile, cls?.profile),
      meta: { topik, semester: tp.semester, jp, menitPerJp: menit, pertemuanKe, dariPertemuan: dari }, arahan, dasarValue: dasar, scaffolds, classes,
    });
    try { validateGenInput(input); } catch (e) { return setError(e instanceof Error ? e.message : "Masukan belum sah."); }
    setBusy(true);
    try {
      const r = await generateRpmAi(input);
      onDone(`"${r.judul}" masuk pustaka sebagai DRAF. ${r.remaining.length ? `Sisa temuan yang perlu Anda tinjau: ${r.remaining.join(", ")}.` : "Lolos ceklis otomatis."} Audit mandiri (RPM-04 sampai 07) menunggu Anda. Tinjau, ubah, lalu terbitkan.`);
    } catch (e) {
      setError(explainAiError(e));
    }
    setBusy(false);
  }

  return (
    <section aria-label="Susun RPM dengan AI" className="mt-6 border-y-4 border-ink py-6">
      <h2 className="font-display text-xl font-semibold">Susun dengan AI (khusus admin)</h2>
      <p className="mt-1 max-w-[70ch] text-moss">Hasil masuk pustaka sebagai draf dan tidak pernah langsung terbit. Anda yang meninjau, mengubah, dan menerbitkan. Proses memakai AI dan memerlukan sekitar 3 sampai 6 menit; jangan menutup halaman. Batas {DAILY_LIMIT} pembuatan per hari.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="block"><span className="font-medium">TP (hanya yang siap)</span>
          <select className={sel} value={tpId} onChange={(e) => pickTp(e.target.value)}>
            <option value="">Pilih TP</option>
            {ready.map((t) => <option key={t.id} value={t.id}>{cp?.mapel.find((m) => m.id === t.mapelId)?.nama ?? t.mapelId}, kelas {t.grade}: {t.konten.slice(0, 60)}</option>)}
          </select></label>
        <label className="block"><span className="font-medium">Dasar pertemuan (dari tangga scaffolding)</span>
          <select className={sel} value={dasar} onChange={(e) => setDasar(e.target.value)} disabled={!tp}>
            <option value="">Tanpa tangga: AI menentukan sendiri</option>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select></label>
        <label className="block md:col-span-2"><span className="font-medium">Topik pertemuan</span><input className={sel} value={topik} onChange={(e) => setTopik(e.target.value)} maxLength={200} /></label>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:col-span-2">
          <label className="block"><span className="font-medium">Pertemuan ke-</span><input className={sel} type="number" min={1} value={pertemuanKe} onChange={(e) => setKe(Number(e.target.value))} /></label>
          <label className="block"><span className="font-medium">Dari</span><input className={sel} type="number" min={1} value={dari} onChange={(e) => setDari(Number(e.target.value))} /></label>
          <label className="block"><span className="font-medium">JP</span><input className={sel} type="number" min={1} value={jp} onChange={(e) => setJp(Number(e.target.value))} /></label>
          <label className="block"><span className="font-medium">Menit per JP</span><input className={sel} type="number" min={10} value={menit} onChange={(e) => setMenit(Number(e.target.value))} /></label>
        </div>
        <label className="block md:col-span-2"><span className="font-medium">Arahan tambahan (opsional)</span>
          <textarea className={sel} rows={3} value={arahan} onChange={(e) => setArahan(e.target.value)} maxLength={2000} placeholder="mis. gunakan contoh tentang antre di kantin; hindari kegiatan yang butuh banyak alat" /></label>
      </div>
      {error && <p role="alert" className="mt-4 text-sm font-medium text-red-800">{error}</p>}
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button onClick={run} disabled={busy || !tp} className="rounded-lg bg-chalk px-5 py-3 font-semibold text-ink hover:brightness-95 disabled:opacity-50">{busy ? "Menyusun, mohon tunggu..." : "Susun dengan AI"}</button>
        {busy && <p role="status" className="text-sm text-moss">Sedang bekerja bagian demi bagian. Jangan menutup halaman ini.</p>}
        {ready.length === 0 && <p className="text-sm text-moss">Belum ada TP berstatus siap di ruang kerja Anda.</p>}
      </div>
    </section>
  );
}
