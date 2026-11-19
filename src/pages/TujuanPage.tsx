import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import PageHeader from "../components/PageHeader";
import { loadCp, type CpData } from "../features/cp/data";
import { deleteTp, subscribeTp } from "../features/tp/api";
import TpEditor from "../features/tp/TpEditor";
import { composeTp, countLevels, lintTp, type TpDoc } from "../features/tp/model";

const sel = "mt-1 block w-full rounded-md border-2 border-mist bg-white px-3 py-2.5 focus:border-ink";

export default function TujuanPage() {
  const { user } = useAuth();
  const ws = user?.uid ?? "";
  const [cp, setCp] = useState<CpData | null>(null);
  const [list, setList] = useState<TpDoc[] | null>(null);
  const [mapelId, setMapelId] = useState("");
  const [grade, setGrade] = useState(0);
  const [editing, setEditing] = useState<TpDoc | "new" | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadCp().then(setCp).catch(() => setError("Data CP tidak dapat dimuat. Muat ulang halaman.")); }, []);
  useEffect(() => (ws ? subscribeTp(ws, setList, () => setError("TP tidak dapat dimuat. Periksa koneksi, lalu muat ulang halaman.")) : undefined), [ws]);

  const shown = useMemo(
    () => (list ?? []).filter((t) => (!mapelId || t.mapelId === mapelId) && (!grade || t.grade === grade))
      .sort((a, b) => a.grade - b.grade || a.mapelId.localeCompare(b.mapelId) || a.cpElemen.localeCompare(b.cpElemen)),
    [list, mapelId, grade],
  );
  const mapelName = (id: string) => cp?.mapel.find((m) => m.id === id)?.nama ?? id;

  async function remove(id: string) {
    try { await deleteTp(ws, id); } catch { setError("TP belum terhapus. Coba lagi."); }
    setConfirming(null);
  }

  return (
    <>
      <PageHeader
        title="Tujuan pembelajaran"
        description="TP lahir dari bedah CP: rumusan kompetensi, tahapan proses, dan cara asesmen. Telaah mutu menemani setiap langkah."
        actions={<button onClick={() => setEditing("new")} className="rounded-lg bg-chalk px-5 py-3 font-semibold text-ink hover:brightness-95">Tambah TP</button>}
      />
      {error && <p role="alert" className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      <div className={`mt-8 gap-10 ${editing ? "xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,48rem)]" : ""}`}>
        <section className={`min-w-0 ${editing ? "hidden xl:block" : ""}`}>
          <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
            <label className="block"><span className="font-medium">Kelas</span>
              <select className={sel} value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
                <option value={0}>Semua kelas</option>{[1, 2, 3, 4, 5, 6].map((g) => <option key={g} value={g}>Kelas {g}</option>)}
              </select></label>
            <label className="block"><span className="font-medium">Mata pelajaran</span>
              <select className={sel} value={mapelId} onChange={(e) => setMapelId(e.target.value)}>
                <option value="">Semua mata pelajaran</option>{cp?.mapel.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}
              </select></label>
          </div>

          {list === null ? (
            <p className="mt-10 text-moss">Memuat TP…</p>
          ) : shown.length === 0 ? (
            <div className="garis-buku mt-10 max-w-xl pb-3">
              <p>{list.length === 0 ? "Belum ada TP. Mulailah dari satu TP," : "Tidak ada TP untuk pilihan ini."}</p>
              <p>{list.length === 0 ? "lengkap dengan tahapan proses dan asesmen." : "Ubah pilihan di atas atau tambah TP baru."}</p>
            </div>
          ) : (
            <ol className="mt-6">
              {shown.map((t) => {
                const issues = lintTp(t, { mapelFase: cp?.mapel.find((m) => m.id === t.mapelId)?.fase });
                const { error: e, warn: w } = countLevels(issues);
                return (
                  <li key={t.id} className="border-b border-mist py-5">
                    <p className="text-sm font-medium text-moss">
                      {mapelName(t.mapelId)}, kelas {t.grade}{t.semester ? `, semester ${t.semester}` : ""}, {t.cpElemen || "TP mandiri"}
                    </p>
                    <p className="mt-1 max-w-[70ch] font-display text-lg font-semibold leading-snug">{composeTp(t)}</p>
                    <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span className={`border-l-4 pl-2 font-semibold ${t.status === "siap" ? "border-ink" : "border-chalk"}`}>{t.status === "siap" ? "Siap" : "Draf"}</span>
                      <span>{t.jp} JP, {t.tahapan.length} langkah</span>
                      <span className="text-moss">{e === 0 && w === 0 ? "Lolos telaah mutu" : `${e} perlu diperbaiki, ${w} saran`}</span>
                      <span className="flex gap-4">
                        <button onClick={() => setEditing(t)} className="underline">Ubah</button>
                        {confirming === t.id ? (
                          <><button onClick={() => remove(t.id)} className="font-semibold text-red-800 underline">Ya, hapus</button><button onClick={() => setConfirming(null)} className="underline">Batal</button></>
                        ) : (
                          <button onClick={() => setConfirming(t.id)} className="text-moss underline">Hapus</button>
                        )}
                      </span>
                    </p>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {editing && (
          <TpEditor key={editing === "new" ? "new" : editing.id} ws={ws} initial={editing === "new" ? null : editing} defaults={{ mapelId, grade }} cp={cp} onClose={() => setEditing(null)} />
        )}
      </div>
    </>
  );
}
