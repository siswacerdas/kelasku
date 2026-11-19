import { useMemo, useState } from "react";
import type { CpData, FaseKey } from "../cp/data";
import { FASE_LABEL } from "../cp/data";
import { saveTp } from "./api";
import { KKO_LEVEL, KKO_SUGGESTIONS, UJI, asesmenRowFor, composeTp, countLevels, faseOfGrade, lintTp, type TpDoc, type TpFields } from "./model";
import { emptyTp } from "./model";

const field = "mt-1 block w-full rounded-md border-2 border-mist bg-white px-3 py-2.5 focus:border-ink";
const LEVEL_STYLE = { error: "border-red-800", warn: "border-chalk", info: "border-mist" } as const;
const LEVEL_LABEL = { error: "Perlu diperbaiki", warn: "Saran", info: "Petunjuk" } as const;

export default function TpEditor({
  ws, initial, defaults, cp, onClose,
}: {
  ws: string;
  initial: TpDoc | null;
  defaults: { mapelId: string; grade: number };
  cp: CpData | null;
  onClose: () => void;
}) {
  const [t, setT] = useState<TpFields>(initial ? { ...initial, tahapan: [...initial.tahapan, ...["", "", "", ""]].slice(0, Math.max(4, initial.tahapan.length)) } : { ...emptyTp(), ...defaults });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const up = <K extends keyof TpFields>(k: K, v: TpFields[K]) => setT((o) => ({ ...o, [k]: v }));

  const fase = faseOfGrade(t.grade);
  const mapel = cp?.mapel.find((m) => m.id === t.mapelId);
  const mapelOptions = cp?.mapel.filter((m) => !fase || m.fase.includes(fase as FaseKey)) ?? [];
  const cpText = mapel && fase ? mapel.elemen.find((e) => e.nama === t.cpElemen)?.cp[fase] : undefined;
  const issues = useMemo(() => lintTp(t, mapel ? { mapelFase: mapel.fase } : undefined), [t, mapel]);
  const { error: nErr, warn: nWarn } = countLevels(issues);
  const row = asesmenRowFor(t.kko);
  const level = KKO_LEVEL[t.kko.trim().toLowerCase()];

  async function save(status: TpDoc["status"]) {
    setBusy(true);
    setError(null);
    try {
      await saveTp(ws, initial?.id ?? null, t, status);
      onClose();
    } catch {
      setError("TP belum tersimpan. Periksa koneksi, lalu coba lagi.");
      setBusy(false);
    }
  }
  const setStep = (i: number, v: string) => setT((o) => ({ ...o, tahapan: o.tahapan.map((s, j) => (j === i ? v : s)) }));

  return (
    <section aria-label="Penyusunan TP" className="border-y-4 border-ink py-6 xl:border-y-0 xl:border-l-4 xl:py-0 xl:pl-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold">{initial ? "Ubah TP" : "Tujuan pembelajaran baru"}</h2>
        <button onClick={onClose} className="text-moss underline">Tutup</button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="font-medium">Kelas</span>
          <select className={field} value={t.grade} onChange={(e) => up("grade", Number(e.target.value))}>
            <option value={0}>Pilih kelas</option>{[1, 2, 3, 4, 5, 6].map((g) => <option key={g} value={g}>Kelas {g} (Fase {faseOfGrade(g)})</option>)}
          </select></label>
        <label className="block"><span className="font-medium">Mata pelajaran</span>
          <select className={field} value={t.mapelId} onChange={(e) => setT((o) => ({ ...o, mapelId: e.target.value, cpElemen: "" }))}>
            <option value="">Pilih mata pelajaran</option>{mapelOptions.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}
          </select></label>
        <label className="block sm:col-span-2"><span className="font-medium">Elemen CP</span>
          <select className={field} value={t.cpElemen} onChange={(e) => up("cpElemen", e.target.value)} disabled={!mapel}>
            <option value="">Tidak dikaitkan (TP mandiri)</option>{mapel?.elemen.map((e) => <option key={e.nama} value={e.nama}>{e.nama}</option>)}
          </select></label>
        {cpText && (
          <details className="sm:col-span-2 border-l-4 border-mist bg-white px-3 py-2">
            <summary className="cursor-pointer font-medium">CP elemen ini (Fase {fase}, {FASE_LABEL[fase as FaseKey]})</summary>
            <p className="mt-2 max-w-[65ch] leading-relaxed">{cpText}</p>
          </details>
        )}
        <label className="block"><span className="font-medium">Semester</span>
          <select className={field} value={t.semester} onChange={(e) => up("semester", Number(e.target.value) as 0 | 1 | 2)}>
            <option value={0}>Belum ditentukan</option><option value={1}>Semester 1</option><option value={2}>Semester 2</option>
          </select></label>
        <label className="block"><span className="font-medium">JP (estimasi)</span>
          <input className={field} type="number" min={1} inputMode="numeric" value={t.jp || ""} onChange={(e) => up("jp", Number(e.target.value))} /></label>
      </div>

      <h3 className="mt-8 font-display text-xl font-semibold">Rumusan kompetensi</h3>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="font-medium">Kata kerja operasional (KKO)</span>
          <input className={field} list="kko-list" value={t.kko} onChange={(e) => up("kko", e.target.value)} placeholder="mis. Menjelaskan" />
          <datalist id="kko-list">{KKO_SUGGESTIONS.map((k) => <option key={k} value={k} />)}</datalist>
          {level && <span className="mt-1 block text-sm text-moss">Level {level}.</span>}</label>
        <label className="block"><span className="font-medium">Objek yang dirinci</span>
          <input className={field} value={t.objek} onChange={(e) => up("objek", e.target.value)} placeholder="mis. hubungan sebab-akibat banjir" /></label>
        <label className="block"><span className="font-medium">Konten</span>
          <input className={field} value={t.konten} onChange={(e) => up("konten", e.target.value)} placeholder="mis. lingkungan sekitar sekolah" /></label>
        <label className="block"><span className="font-medium">Bukti konkret dan terukur</span>
          <input className={field} value={t.bukti} onChange={(e) => up("bukti", e.target.value)} placeholder="mis. tulisan singkat dengan alasan" /></label>
      </div>
      <p className="mt-3 border-l-4 border-ink bg-white px-3 py-2 font-medium">{composeTp(t)}</p>

      <h3 className="mt-8 font-display text-xl font-semibold">Tahapan proses</h3>
      <p className="text-moss">Minimal 4 langkah, dari titik mulai hingga produk atau performa akhir, termasuk membandingkan, merevisi, atau berlatih.</p>
      <ol className="mt-3 space-y-3">
        {t.tahapan.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-2.5 w-6 shrink-0 text-right font-semibold">{i + 1}</span>
            <textarea aria-label={`Langkah ${i + 1}`} className={`${field} mt-0 min-h-[3.5rem]`} value={s} onChange={(e) => setStep(i, e.target.value)} />
            {t.tahapan.length > 4 && <button onClick={() => setT((o) => ({ ...o, tahapan: o.tahapan.filter((_, j) => j !== i) }))} className="text-moss underline">Hapus</button>}
          </li>
        ))}
      </ol>
      <button onClick={() => setT((o) => ({ ...o, tahapan: [...o.tahapan, ""] }))} className="mt-3 rounded-lg border-2 border-ink px-4 py-2 font-semibold hover:bg-mist">Tambah langkah</button>

      <h3 className="mt-8 font-display text-xl font-semibold">Cara asesmen</h3>
      {row && <p className="text-moss">Untuk {t.kko.trim().toLowerCase()}, bentuk yang lazim sesuai: {row.sesuai}.</p>}
      <label className="mt-3 block"><span className="font-medium">Instrumen yang dipakai</span>
        <textarea className={`${field} min-h-[5rem]`} value={t.caraAsesmen} onChange={(e) => up("caraAsesmen", e.target.value)} /></label>
      <label className="mt-3 block"><span className="font-medium">Yang tidak dipakai (bila relevan)</span>
        <textarea className={`${field} min-h-[3.5rem]`} value={t.tidakDipakai} onChange={(e) => up("tidakDipakai", e.target.value)} /></label>

      <h3 className="mt-8 font-display text-xl font-semibold">Uji pemisahan</h3>
      <p className="text-moss">Jika ada jawaban Ya, TP sebaiknya dipecah.</p>
      <div className="mt-2 divide-y divide-mist">
        {UJI.map((u) => (
          <fieldset key={u.key} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <legend className="sr-only">{u.q}</legend>
            <p className="max-w-[48ch]" aria-hidden="true">{u.q}</p>
            <div className="flex gap-2">
              {(["tidak", "ya"] as const).map((a) => (
                <label key={a} className="cursor-pointer">
                  <input type="radio" name={u.key} className="peer sr-only" checked={t.uji[u.key] === a} onChange={() => setT((o) => ({ ...o, uji: { ...o.uji, [u.key]: a } }))} />
                  <span className="block min-w-16 rounded-md border-2 border-mist px-4 py-2 text-center peer-checked:border-ink peer-checked:bg-mist peer-checked:font-semibold peer-focus-visible:outline-3 peer-focus-visible:outline-chalk">{a === "ya" ? "Ya" : "Tidak"}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <section aria-label="Telaah mutu" className="mt-8">
        <h3 className="font-display text-xl font-semibold">Telaah mutu</h3>
        <p className="text-moss">{nErr === 0 && nWarn === 0 ? "Semua pemeriksaan lolos." : `${nErr} perlu diperbaiki, ${nWarn} saran.`}</p>
        <ul className="mt-3 space-y-2">
          {issues.map((i) => (
            <li key={i.code} className={`border-l-4 bg-white px-3 py-2 ${LEVEL_STYLE[i.level]}`}>
              <span className="text-sm font-semibold">{LEVEL_LABEL[i.level]}</span>
              <p>{i.message}</p>
            </li>
          ))}
        </ul>
      </section>

      {error && <p role="alert" className="mt-4 text-sm font-medium text-red-800">{error}</p>}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button disabled={busy || nErr > 0} onClick={() => save("siap")} className="rounded-lg bg-chalk px-5 py-3 font-semibold text-ink hover:brightness-95 disabled:opacity-50">Simpan sebagai siap</button>
        <button disabled={busy} onClick={() => save("draf")} className="rounded-lg border-2 border-ink px-5 py-3 font-semibold hover:bg-mist disabled:opacity-60">Simpan sebagai draf</button>
        {nErr > 0 && <p className="text-sm text-moss">Status siap terbuka setelah semua yang perlu diperbaiki selesai.</p>}
      </div>
    </section>
  );
}
