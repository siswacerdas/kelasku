import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import PageHeader from "../components/PageHeader";
import { loadCp, type CpData } from "../features/cp/data";
import { subscribeClasses } from "../features/kelas/api";
import type { ClassDoc } from "../features/kelas/types";
import { subscribeScaffolds } from "../features/scaffold/api";
import type { ScaffoldDoc } from "../features/scaffold/model";
import { subscribeWorkspace, type WorkspaceDoc } from "../features/settings/api";
import { subscribeTp } from "../features/tp/api";
import type { TpDoc } from "../features/tp/model";
import { copyModulFromLibrary, deleteModul, deleteModulLibrary, saveModulLibrary, subscribeModul, subscribeModulLibrary, type ModulLibraryDoc } from "../features/modul/api";
import ModulEditor from "../features/modul/ModulEditor";
import { countIssues, emptyModul, lintModul, prefillFromScaffold, type ModulDoc, type ModulFields } from "../features/modul/model";

type Editing = { mode: "mine" | "library"; id: string | null; fields: ModulFields };
const sel = "mt-1 block w-full rounded-md border-2 border-mist bg-white px-3 py-2.5 focus:border-ink";

export default function ModulPage() {
  const { user, isAdmin } = useAuth();
  const ws = user?.uid ?? "";
  const [cp, setCp] = useState<CpData | null>(null);
  const [mine, setMine] = useState<ModulDoc[] | null>(null);
  const [library, setLibrary] = useState<ModulLibraryDoc[] | null>(null);
  const [tps, setTps] = useState<TpDoc[]>([]);
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [scaffolds, setScaffolds] = useState<ScaffoldDoc[]>([]);
  const [wsDoc, setWsDoc] = useState<WorkspaceDoc | null>(null);
  const [tab, setTab] = useState<"mine" | "library">("mine");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [start, setStart] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);
  const [filterMapel, setFilterMapel] = useState("");
  const [filterGrade, setFilterGrade] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const fail = () => setError("Data tidak dapat dimuat. Periksa koneksi, lalu muat ulang halaman.");

  useEffect(() => { loadCp().then(setCp).catch(fail); }, []);
  useEffect(() => {
    if (!ws) return;
    const off = [subscribeModul(ws, setMine, fail), subscribeTp(ws, setTps, () => {}), subscribeClasses(ws, setClasses, () => {}), subscribeScaffolds(ws, setScaffolds, () => {}), subscribeWorkspace(ws, setWsDoc, fail), subscribeModulLibrary(isAdmin, setLibrary, () => setLibrary([]))];
    return () => off.forEach((f) => f());
  }, [ws, isAdmin]);

  const mapelName = (id: string) => cp?.mapel.find((m) => m.id === id)?.nama ?? "Mata pelajaran?";
  const sekolah = wsDoc?.school?.name ?? "";
  const islami = wsDoc?.school?.islami !== false;

  // Awalan dari alternatif scaffolding: jumlah subunit = jumlah tangga.
  const startOptions = useMemo(() => scaffolds.flatMap((sc) => {
    const tp = tps.find((t) => t.id === sc.tpId);
    if (!tp) return [];
    const kelas = classes.find((c) => c.id === sc.classId)?.name ?? "kelas?";
    return sc.alternatif.filter((a) => a.tangga.length > 0).map((a, ai) => ({ value: `${sc.id}|${ai}`, label: `${mapelName(tp.mapelId)}, ${kelas}, ${a.nama || `Alternatif ${ai + 1}`}: ${a.tangga.length} subunit` }));
  }), [scaffolds, tps, classes, cp]); // eslint-disable-line react-hooks/exhaustive-deps

  function startNew(mode: "mine" | "library") {
    const [scId, ai] = start.split("|");
    const sc = scaffolds.find((s) => s.id === scId);
    const tp = tps.find((t) => t.id === sc?.tpId);
    const alt = sc?.alternatif[Number(ai)];
    setEditing({ mode, id: null, fields: sc && tp && alt ? prefillFromScaffold({ tpId: tp.id, mapelId: tp.mapelId, grade: tp.grade, semester: tp.semester, tangga: alt.tangga }) : emptyModul() });
  }
  async function useLibrary(item: ModulLibraryDoc) {
    setBusy(true); setError(null);
    try { await copyModulFromLibrary(ws, item); setInfo(`"${item.judul}" disalin ke Modul saya sebagai draf. Periksa dan sesuaikan dengan kelas Anda.`); setTab("mine"); }
    catch { setError("Modul belum dapat disalin. Coba lagi."); }
    setBusy(false);
  }
  async function togglePublish(item: ModulLibraryDoc) {
    try { await saveModulLibrary(item.id, item, item.status === "terbit" ? "draf" : "terbit", ws); } catch { setError("Status belum berubah. Coba lagi."); }
  }
  const shownLib = useMemo(() => (library ?? []).filter((l) => (!filterMapel || l.mapelId === filterMapel) && (!filterGrade || l.grade === filterGrade)), [library, filterMapel, filterGrade]);

  if (editing) return <ModulEditor key={(editing.id ?? "baru") + editing.mode} ws={ws} uid={ws} mode={editing.mode} id={editing.id} initial={editing.fields} cp={cp} sekolah={sekolah} islami={islami} onClose={() => setEditing(null)} />;

  const tabBtn = (t: "mine" | "library", label: string) => <button onClick={() => setTab(t)} aria-pressed={tab === t} className={`border-b-4 px-4 py-2 ${tab === t ? "border-chalk font-semibold" : "border-transparent text-moss"}`}>{label}</button>;
  return (
    <>
      <PageHeader title="Modul siswa" description="Modul ajar mandiri: teks yang dibaca dan dikerjakan langsung oleh siswa, tersusun dari tangga scaffolding. Gunakan modul dari pustaka atau susun sendiri, lalu cetak." />
      {error && <p role="alert" className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      {info && <p role="status" className="mt-6 rounded-lg border border-mist bg-white px-4 py-3">{info}</p>}
      <div className="mt-8 flex flex-wrap gap-1 border-b border-mist">{tabBtn("mine", "Modul saya")}{tabBtn("library", isAdmin ? "Pustaka (admin)" : "Pustaka modul")}</div>

      <section aria-label="Membuat modul" className="mt-6 border-b border-mist pb-6">
        <h2 className="font-display text-xl font-semibold">{tab === "library" ? "Buat modul untuk pustaka" : "Buat modul baru"}</h2>
        {(tab === "mine" || isAdmin) ? (
          <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-4">
            <label className="block min-w-[16rem] max-w-xl flex-1"><span className="font-medium">Mulai dari tangga scaffolding (opsional)</span>
              <select className={sel} value={start} onChange={(e) => setStart(e.target.value)}>
                <option value="">Kosong, ketik dari awal</option>{startOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select></label>
            <button onClick={() => startNew(tab)} className="rounded-lg bg-chalk px-5 py-3 font-semibold text-ink hover:brightness-95">Susun modul</button>
          </div>
        ) : <p className="mt-2 text-moss">Pustaka dikelola admin. Pilih modul di bawah, lalu tekan Gunakan untuk menyalinnya dan menyesuaikannya dengan kelas Anda.</p>}
      </section>

      {tab === "mine" ? (
        mine === null ? <p className="mt-10 text-moss">Memuat…</p> : mine.length === 0 ? (
          <div className="garis-buku mt-10 max-w-xl pb-3"><p>Belum ada modul. Susun dari tangga scaffolding Anda,</p><p>atau gunakan modul dari pustaka.</p></div>
        ) : (
          <ol className="mt-4">
            {mine.map((r) => {
              const c = countIssues(lintModul(r, { islami }));
              return (
                <li key={r.id} className="border-b border-mist py-5">
                  <p className="text-sm font-medium text-moss">{mapelName(r.mapelId)}, kelas {r.grade || "?"}, {r.subunit.length} subunit{r.sumber ? ", dari pustaka" : ""}</p>
                  <p className="mt-1 font-display text-lg font-semibold">{r.judul || "(tanpa judul)"}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className={`border-l-4 pl-2 font-semibold ${r.status === "siap" ? "border-ink" : "border-chalk"}`}>{r.status === "siap" ? "Siap" : "Draf"}</span>
                    <span className="text-moss">{c.error === 0 && c.warn === 0 ? "Lolos ceklis mutu" : `${c.error} perlu diperbaiki, ${c.warn} saran`}</span>
                    <button onClick={() => setEditing({ mode: "mine", id: r.id, fields: r })} className="font-semibold underline">Buka</button>
                    {confirming === r.id ? (<><button onClick={async () => { try { await deleteModul(ws, r.id); } catch { setError("Modul belum terhapus."); } setConfirming(null); }} className="font-semibold text-red-800 underline">Ya, hapus</button><button onClick={() => setConfirming(null)} className="underline">Batal</button></>) : <button onClick={() => setConfirming(r.id)} className="text-moss underline">Hapus</button>}
                  </p>
                </li>
              );
            })}
          </ol>
        )
      ) : (
        <>
          <div className="mt-6 grid max-w-2xl gap-4 sm:grid-cols-2">
            <label className="block"><span className="font-medium">Kelas</span><select className={sel} value={filterGrade} onChange={(e) => setFilterGrade(Number(e.target.value))}><option value={0}>Semua kelas</option>{[1, 2, 3, 4, 5, 6].map((g) => <option key={g} value={g}>Kelas {g}</option>)}</select></label>
            <label className="block"><span className="font-medium">Mata pelajaran</span><select className={sel} value={filterMapel} onChange={(e) => setFilterMapel(e.target.value)}><option value="">Semua</option>{cp?.mapel.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}</select></label>
          </div>
          {library === null ? <p className="mt-10 text-moss">Memuat…</p> : shownLib.length === 0 ? (
            <div className="garis-buku mt-10 max-w-xl pb-3"><p>Belum ada modul di pustaka untuk pilihan ini.</p><p>{isAdmin ? "Buat modul pertama di atas." : "Pustaka terus ditambah."}</p></div>
          ) : (
            <ol className="mt-4">
              {shownLib.map((l) => (
                <li key={l.id} className="border-b border-mist py-5">
                  <p className="text-sm font-medium text-moss">{mapelName(l.mapelId)}, kelas {l.grade || "?"}, {l.subunit.length} subunit</p>
                  <p className="mt-1 font-display text-lg font-semibold">{l.judul}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    {isAdmin && <span className={`border-l-4 pl-2 font-semibold ${l.status === "terbit" ? "border-ink" : "border-chalk"}`}>{l.status === "terbit" ? "Terbit" : "Draf"}</span>}
                    <button onClick={() => useLibrary(l)} disabled={busy} className="font-semibold underline">Gunakan</button>
                    {isAdmin && (<>
                      <button onClick={() => setEditing({ mode: "library", id: l.id, fields: l })} className="underline">Ubah</button>
                      <button onClick={() => togglePublish(l)} className="underline">{l.status === "terbit" ? "Tarik dari pustaka" : "Terbitkan"}</button>
                      {confirming === l.id ? (<><button onClick={async () => { try { await deleteModulLibrary(l.id); } catch { setError("Modul pustaka belum terhapus."); } setConfirming(null); }} className="font-semibold text-red-800 underline">Ya, hapus</button><button onClick={() => setConfirming(null)} className="underline">Batal</button></>) : <button onClick={() => setConfirming(l.id)} className="text-moss underline">Hapus</button>}
                    </>)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </>
  );
}
