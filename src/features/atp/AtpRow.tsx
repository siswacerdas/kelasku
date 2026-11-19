import { useState } from "react";
import { saveAtp } from "./api";
import { atpOf, shortTp } from "./model";
import type { AtpData, TpDoc } from "../tp/model";

const field = "mt-1 block w-full rounded-md border-2 border-mist bg-white px-3 py-2 focus:border-ink";

export default function AtpRow({
  ws, tp, label, candidates, canUp, canDown, otherGrade, onMove, onGrade,
}: {
  ws: string;
  tp: TpDoc;
  label: string;
  candidates: { id: string; label: string; text: string }[];
  canUp: boolean;
  canDown: boolean;
  otherGrade: number;
  onMove: (dir: -1 | 1) => void;
  onGrade: () => void;
}) {
  const [a, setA] = useState<AtpData>(atpOf(tp));
  const [status, setStatus] = useState<string | null>(null);
  const dirty = JSON.stringify(a) !== JSON.stringify(atpOf(tp));
  const togglePre = (id: string) => setA((o) => ({ ...o, prasyarat: o.prasyarat.includes(id) ? o.prasyarat.filter((x) => x !== id) : [...o.prasyarat, id] }));

  async function save() {
    try {
      await saveAtp(ws, tp.id, { ...a, alasan: a.alasan.trim(), catatan: a.catatan.trim() });
      setStatus("Tersimpan.");
    } catch {
      setStatus("Belum tersimpan. Periksa koneksi, lalu coba lagi.");
    }
  }

  return (
    <li className="border-b border-mist py-5">
      <div className="flex gap-3">
        <span className="w-10 shrink-0 font-display text-xl font-extrabold">{label}</span>
        <div className="min-w-0 flex-1">
          <p className="max-w-[65ch] font-medium leading-snug">{shortTp(tp)}</p>
          <p className="mt-1 text-sm text-moss">
            {tp.cpElemen || "TP mandiri"}, {tp.jp} JP{tp.status !== "siap" ? ", draf" : ""}
            {a.prasyarat.length ? `, prasyarat ${a.prasyarat.map((id) => candidates.find((c) => c.id === id)?.label ?? "?").join(", ")}` : ""}
            {a.kontinuitas === "diperdalam" ? ", diperdalam lintas kelas" : ""}
          </p>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <button onClick={() => onMove(-1)} disabled={!canUp} className="underline disabled:opacity-40 disabled:no-underline">Naik</button>
            <button onClick={() => onMove(1)} disabled={!canDown} className="underline disabled:opacity-40 disabled:no-underline">Turun</button>
            <button onClick={onGrade} className="underline">Pindah ke kelas {otherGrade}</button>
          </p>
          <details className="mt-3">
            <summary className="cursor-pointer font-medium">Alasan dan relasi</summary>
            <div className="mt-3 space-y-4">
              <label className="block"><span className="font-medium">Alasan penempatan di kelas {tp.grade}</span>
                <textarea className={`${field} min-h-[4rem]`} value={a.alasan} onChange={(e) => setA({ ...a, alasan: e.target.value })} placeholder="mis. membangun fondasi proses menyusun laporan sebelum penguatan kalimat majemuk" /></label>
              <fieldset>
                <legend className="font-medium">Prasyarat (TP yang harus tuntas lebih dulu)</legend>
                {candidates.length === 0 ? <p className="text-sm text-moss">Belum ada TP lain.</p> : (
                  <ul className="mt-1 max-h-48 space-y-1 overflow-y-auto">
                    {candidates.map((c) => (
                      <li key={c.id}><label className="flex cursor-pointer gap-2"><input type="checkbox" checked={a.prasyarat.includes(c.id)} onChange={() => togglePre(c.id)} className="mt-1.5" />
                        <span><span className="font-semibold">{c.label}</span> <span className="text-moss">{c.text}</span></span></label></li>
                    ))}
                  </ul>
                )}
              </fieldset>
              <fieldset>
                <legend className="font-medium">Kontinuitas</legend>
                <div className="mt-1 flex flex-wrap gap-2">
                  {([["tuntas", "Tuntas di kelas ini"], ["diperdalam", "Perlu diulang atau diperdalam lintas kelas"]] as const).map(([v, text]) => (
                    <label key={v} className="cursor-pointer"><input type="radio" name={`k-${tp.id}`} className="peer sr-only" checked={a.kontinuitas === v} onChange={() => setA({ ...a, kontinuitas: v })} />
                      <span className="block rounded-md border-2 border-mist px-3 py-2 peer-checked:border-ink peer-checked:bg-mist peer-checked:font-semibold peer-focus-visible:outline-3 peer-focus-visible:outline-chalk">{text}</span></label>
                  ))}
                </div>
              </fieldset>
              {a.kontinuitas === "diperdalam" && (
                <label className="block"><span className="font-medium">Apa yang diulang atau diperdalam</span>
                  <textarea className={`${field} min-h-[3.5rem]`} value={a.catatan} onChange={(e) => setA({ ...a, catatan: e.target.value })} /></label>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={save} disabled={!dirty} className="rounded-lg bg-chalk px-4 py-2.5 font-semibold text-ink hover:brightness-95 disabled:opacity-50">Simpan relasi</button>
                {status && <p role="status" className="text-sm font-medium">{status}</p>}
              </div>
            </div>
          </details>
        </div>
      </div>
    </li>
  );
}
