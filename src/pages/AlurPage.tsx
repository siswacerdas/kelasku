import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import PageHeader from "../components/PageHeader";
import { FASE_LABEL, loadCp, type CpData, type FaseKey } from "../features/cp/data";
import { subscribeTp } from "../features/tp/api";
import { faseOfGrade, type TpDoc } from "../features/tp/model";
import { applyOrder } from "../features/atp/api";
import AtpRow from "../features/atp/AtpRow";
import { FASE_GRADES, labelMap, lintAlur, moveToGrade, moveWithin, rekapJp, shortTp, sortTps, type OrderUpdate } from "../features/atp/model";

const sel = "mt-1 block w-full rounded-md border-2 border-mist bg-white px-3 py-2.5 focus:border-ink";
const LEVEL_STYLE = { error: "border-red-800", warn: "border-chalk", info: "border-mist" } as const;
const LEVEL_LABEL = { error: "Perlu diperbaiki", warn: "Saran", info: "Petunjuk" } as const;

export default function AlurPage() {
  const { user } = useAuth();
  const ws = user?.uid ?? "";
  const [cp, setCp] = useState<CpData | null>(null);
  const [list, setList] = useState<TpDoc[] | null>(null);
  const [mapelId, setMapelId] = useState("");
  const [fase, setFase] = useState<FaseKey>("C");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadCp().then(setCp).catch(() => setError("Data CP tidak dapat dimuat. Muat ulang halaman.")); }, []);
  useEffect(() => (ws ? subscribeTp(ws, setList, () => setError("TP tidak dapat dimuat. Periksa koneksi, lalu muat ulang halaman.")) : undefined), [ws]);

  const mapel = cp?.mapel.find((m) => m.id === mapelId);
  const fases = mapel?.fase ?? [];
  const activeFase: FaseKey = fases.includes(fase) ? fase : (fases[fases.length - 1] ?? fase);
  const grades = FASE_GRADES[activeFase];

  const tps = useMemo(() => sortTps((list ?? []).filter((t) => t.mapelId === mapelId && faseOfGrade(t.grade) === activeFase)), [list, mapelId, activeFase]);
  const labels = useMemo(() => labelMap(tps), [tps]);
  const elemen = useMemo(() => mapel?.elemen.filter((e) => e.cp[activeFase]).map((e) => e.nama) ?? [], [mapel, activeFase]);
  const issues = useMemo(() => lintAlur(tps, { fase: activeFase, elemen }), [tps, activeFase, elemen]);
  const rekap = useMemo(() => rekapJp(tps, elemen, [...grades]), [tps, elemen, grades]);

  async function run(updates: OrderUpdate[]) {
    if (updates.length === 0) return;
    try { await applyOrder(ws, updates); } catch { setError("Urutan belum tersimpan. Periksa koneksi, lalu coba lagi."); }
  }
  const nErr = issues.filter((i) => i.level === "error").length;
  const nWarn = issues.filter((i) => i.level === "warn").length;

  return (
    <>
      <PageHeader title="Alur tujuan pembelajaran" description="Menata relasi antar-TP dalam satu fase: urutan, prasyarat, dan pengulangan lintas kelas. Disusun setelah TP-TP dirumuskan." />
      {error && <p role="alert" className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      <div className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-2">
        <label className="block"><span className="font-medium">Mata pelajaran</span>
          <select className={sel} value={mapelId} onChange={(e) => setMapelId(e.target.value)}>
            <option value="">Pilih mata pelajaran</option>{cp?.mapel.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}
          </select></label>
        <label className="block"><span className="font-medium">Fase</span>
          <select className={sel} value={activeFase} onChange={(e) => setFase(e.target.value as FaseKey)} disabled={!mapel}>
            {(fases.length ? fases : (["A", "B", "C"] as FaseKey[])).map((f) => <option key={f} value={f}>Fase {f}, {FASE_LABEL[f]}</option>)}
          </select></label>
      </div>

      {!mapel ? (
        <div className="garis-buku mt-10 max-w-xl pb-3"><p>Pilih mata pelajaran untuk melihat alurnya.</p><p>Alur dibangun dari TP yang sudah Anda susun.</p></div>
      ) : list === null ? (
        <p className="mt-10 text-moss">Memuat TP…</p>
      ) : (
        <div className="mt-10 gap-12 min-[110rem]:grid min-[110rem]:grid-cols-[minmax(0,1fr)_28rem]">
          <section aria-label="Papan alur" className="min-w-0">
            <div className="grid gap-x-10 gap-y-8 xl:grid-cols-2">
              {grades.map((g, gi) => {
                const col = tps.filter((t) => t.grade === g);
                return (
                  <div key={g} className="min-w-0">
                    <h2 className="border-b-4 border-ink pb-2 font-display text-2xl font-extrabold">
                      Kelas {g} <span className="font-sans text-base font-normal text-moss">{gi === 0 ? "fondasi proses" : "penguatan kompleksitas"}</span>
                    </h2>
                    {col.length === 0 ? (
                      <div className="garis-buku mt-4 pb-3"><p>Belum ada TP di kelas ini.</p></div>
                    ) : (
                      <ol>
                        {col.map((t, i) => (
                          <AtpRow
                            key={t.id + JSON.stringify(t.atp ?? {}) + t.grade}
                            ws={ws} tp={t} label={labels.get(t.id) ?? "?"}
                            candidates={tps.filter((x) => x.id !== t.id).map((x) => ({ id: x.id, label: labels.get(x.id) ?? "?", text: shortTp(x) }))}
                            canUp={i > 0} canDown={i < col.length - 1}
                            otherGrade={grades[gi === 0 ? 1 : 0]}
                            onMove={(dir) => run(moveWithin(col, t.id, dir))}
                            onGrade={() => run(moveToGrade(tps, t.id, grades[gi === 0 ? 1 : 0]))}
                          />
                        ))}
                      </ol>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="mt-12 min-w-0 min-[110rem]:mt-0 min-[110rem]:border-l-4 min-[110rem]:border-ink min-[110rem]:pl-8">
            <section aria-label="Telaah alur">
              <h2 className="font-display text-2xl font-semibold">Telaah alur</h2>
              <p className="text-moss">{issues.every((i) => i.level === "info") ? "Tidak ada yang perlu diperbaiki." : `${nErr} perlu diperbaiki, ${nWarn} saran.`}</p>
              <ul className="mt-3 space-y-2">
                {issues.map((i) => (
                  <li key={i.code + i.message} className={`border-l-4 bg-white px-3 py-2 ${LEVEL_STYLE[i.level]}`}>
                    <span className="text-sm font-semibold">{LEVEL_LABEL[i.level]}</span><p>{i.message}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-label="Rekap JP" className="mt-10">
              <h2 className="font-display text-2xl font-semibold">Rekap JP</h2>
              <p className="text-sm text-moss">Estimasi indikatif; sesuaikan dengan kalender akademik.</p>
              <div className="mt-3 border-b-2 border-ink pb-1 text-sm font-semibold">
                <div className="grid grid-cols-[minmax(0,1fr)_3rem_3rem_3rem_3rem] gap-x-2">
                  <span>Elemen</span><span className="text-right">TP</span><span className="text-right">JP</span>{grades.map((g) => <span key={g} className="text-right">K{g}</span>)}
                </div>
              </div>
              <ul>
                {[...rekap.rows, rekap.total].map((r, idx, arr) => (
                  <li key={r.elemen} className={`grid grid-cols-[minmax(0,1fr)_3rem_3rem_3rem_3rem] gap-x-2 border-b border-mist py-2 ${idx === arr.length - 1 ? "font-bold" : ""}`}>
                    <span className={r.jumlah === 0 && idx !== arr.length - 1 ? "text-moss" : ""}>{r.elemen}{r.jumlah === 0 && idx !== arr.length - 1 ? " (belum ada TP)" : ""}</span>
                    <span className="text-right">{r.jumlah}</span><span className="text-right">{r.jp}</span>{grades.map((g) => <span key={g} className="text-right">{r.perKelas[g] ?? 0}</span>)}
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      )}
    </>
  );
}
