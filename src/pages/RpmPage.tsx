import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import PageHeader from "../components/PageHeader";
import { loadCp, type CpData } from "../features/cp/data";
import { subscribeTp } from "../features/tp/api";
import { composeTp, faseOfGrade, type TpDoc } from "../features/tp/model";
import { subscribeWorkspace, type WorkspaceDoc } from "../features/settings/api";
import { copyFromLibrary, deleteLibrary, deleteRpm, saveLibrary, subscribeLibrary, subscribeRpm, type LibraryDoc } from "../features/rpm/api";
import { buildRpmTemplate, readSheets } from "../features/rpm/excel";
import { countIssues, emptyRpm, lintRpm, prefillFromTp, type RpmDoc, type RpmFields } from "../features/rpm/model";
import { sheetsToRpm } from "../features/rpm/template";
import RpmEditor from "../features/rpm/RpmEditor";
import AiPanel from "../features/rpm-ai/AiPanel";

type Editing = { mode: "mine" | "library"; id: string | null; fields: RpmFields; judul?: string; notes: string[]; tp?: TpDoc };
const sel = "mt-1 block w-full rounded-md border-2 border-mist bg-white px-3 py-2.5 focus:border-ink";
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const MAX_FILE = 2 * 1024 * 1024;

export default function RpmPage() {
  const { user, isAdmin } = useAuth();
  const ws = user?.uid ?? "";
  const [cp, setCp] = useState<CpData | null>(null);
  const [mine, setMine] = useState<RpmDoc[] | null>(null);
  const [library, setLibrary] = useState<LibraryDoc[] | null>(null);
  const [tps, setTps] = useState<TpDoc[] | null>(null);
  const [wsDoc, setWsDoc] = useState<WorkspaceDoc | null>(null);
  const [tab, setTab] = useState<"mine" | "library">("mine");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [startTp, setStartTp] = useState("");
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
    const off = [subscribeRpm(ws, setMine, fail), subscribeTp(ws, setTps, fail), subscribeWorkspace(ws, setWsDoc, fail), subscribeLibrary(isAdmin, setLibrary, () => setLibrary([]))];
    return () => off.forEach((f) => f());
  }, [ws, isAdmin]);

  const mapelName = (id: string) => cp?.mapel.find((m) => m.id === id)?.nama ?? "Mata pelajaran?";
  const resolveMapel = (name: string) => cp?.mapel.find((m) => norm(m.nama) === norm(name) || m.id === norm(name))?.id ?? "";
  const school = wsDoc?.school;
  const teacherName = wsDoc?.teacher?.name || user?.displayName || "";
  const tpOf = (id: string) => tps?.find((t) => t.id === id);

  function cpTextOf(tp: TpDoc): string {
    const f = faseOfGrade(tp.grade);
    return (f && cp?.mapel.find((m) => m.id === tp.mapelId)?.elemen.find((e) => e.nama === tp.cpElemen)?.cp[f]) || "";
  }
  function startNew(mode: "mine" | "library") {
    const tp = startTp ? tpOf(startTp) : undefined;
    setEditing({ mode, id: null, fields: tp ? prefillFromTp(tp, cpTextOf(tp)) : emptyRpm(), notes: [], tp });
  }
  async function onFile(e: React.ChangeEvent<HTMLInputElement>, mode: "mine" | "library") {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setError(null);
    if (!f.name.toLowerCase().endsWith(".xlsx")) return setError("Gunakan berkas .xlsx dari template. Berkas .xls lama: buka di Excel lalu Simpan sebagai .xlsx.");
    if (f.size > MAX_FILE) return setError("Berkas terlalu besar (maksimal 2 MB).");
    setBusy(true);
    try {
      const { rpm, notes } = sheetsToRpm(await readSheets(await f.arrayBuffer()), resolveMapel);
      setEditing({ mode, id: null, fields: rpm, notes: notes.length ? notes : ["Berkas terbaca. Periksa isinya, lalu simpan."], tp: undefined });
    } catch {
      setError("Berkas tidak dapat dibaca. Pastikan itu template RPM yang tidak rusak.");
    }
    setBusy(false);
  }
  async function downloadTemplate() {
    setBusy(true);
    try {
      const data = await buildRpmTemplate();
      const url = URL.createObjectURL(new Blob([data as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const a = document.createElement("a");
      a.href = url; a.download = "template-rpm.xlsx"; a.click();
      URL.revokeObjectURL(url);
    } catch { setError("Template belum dapat dibuat. Muat ulang halaman, lalu coba lagi."); }
    setBusy(false);
  }
  async function useLibrary(item: LibraryDoc) {
    setBusy(true); setError(null);
    try { await copyFromLibrary(ws, item); setInfo(`"${item.judul}" disalin ke RPM saya sebagai draf. Periksa dan sesuaikan dengan kelas Anda.`); setTab("mine"); }
    catch { setError("RPM belum dapat disalin. Coba lagi."); }
    setBusy(false);
  }
  async function togglePublish(item: LibraryDoc) {
    try { await saveLibrary(item.id, item, item.status === "terbit" ? "draf" : "terbit", item.judul, ws); }
    catch { setError("Status belum berubah. Coba lagi."); }
  }

  const shownLib = useMemo(() => (library ?? []).filter((l) => (!filterMapel || l.mapelId === filterMapel) && (!filterGrade || l.grade === filterGrade)), [library, filterMapel, filterGrade]);

  if (editing)
    return (
      <RpmEditor key={(editing.id ?? "baru") + editing.mode + editing.notes.length} ws={ws} uid={ws} mode={editing.mode} id={editing.id} initial={editing.fields}
        libraryMeta={editing.judul !== undefined ? { judul: editing.judul } : undefined} notes={editing.notes} cp={cp} tp={editing.tp ?? tpOf(editing.fields.tpId)}
        school={school} teacherName={teacherName} onClose={() => setEditing(null)} />
    );

  const tabBtn = (t: "mine" | "library", label: string) => (
    <button onClick={() => setTab(t)} aria-pressed={tab === t} className={`border-b-4 px-4 py-2 ${tab === t ? "border-chalk font-semibold" : "border-transparent text-moss"}`}>{label}</button>
  );
  const readyTps = (tps ?? []).filter((t) => t.status === "siap");

  return (
    <>
      <PageHeader title="Rencana pembelajaran mendalam (RPM)" description="Satu RPM untuk satu pertemuan. Gunakan RPM dari pustaka, ketik sendiri, atau unggah dari template Excel." />
      {error && <p role="alert" className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      {info && <p role="status" className="mt-6 rounded-lg border border-mist bg-white px-4 py-3">{info}</p>}

      <div className="mt-8 flex flex-wrap gap-1 border-b border-mist">{tabBtn("mine", "RPM saya")}{tabBtn("library", isAdmin ? "Pustaka (admin)" : "Pustaka RPM")}</div>

      {/* Membuat RPM: ketik langsung atau unggah template. Admin melakukannya untuk pustaka. */}
      <section aria-label="Membuat RPM" className="mt-6 border-b border-mist pb-6">
        <h2 className="font-display text-xl font-semibold">{tab === "library" ? "Buat RPM untuk pustaka" : "Buat RPM baru"}</h2>
        {(tab === "mine" || isAdmin) ? (
          <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-4">
            <label className="block min-w-[16rem] max-w-xl flex-1"><span className="font-medium">Mulai dari TP (opsional)</span>
              <select className={sel} value={startTp} onChange={(e) => setStartTp(e.target.value)}>
                <option value="">Kosong, ketik dari awal</option>
                {readyTps.map((t) => <option key={t.id} value={t.id}>{mapelName(t.mapelId)}, kelas {t.grade}: {composeTp(t).replace(/^Siswa harus bisa /, "").slice(0, 70)}</option>)}
              </select></label>
            <button onClick={() => startNew(tab)} className="rounded-lg bg-chalk px-5 py-3 font-semibold text-ink hover:brightness-95">Ketik RPM</button>
            <button onClick={downloadTemplate} disabled={busy} className="rounded-lg border-2 border-ink px-5 py-3 font-semibold hover:bg-mist disabled:opacity-60">Unduh template Excel</button>
            <label className="cursor-pointer rounded-lg border-2 border-ink px-5 py-3 font-semibold hover:bg-mist">Unggah template<input type="file" accept=".xlsx" className="sr-only" onChange={(e) => onFile(e, tab)} /></label>
          </div>
        ) : <p className="mt-2 text-moss">Pustaka dikelola admin. Pilih RPM di bawah, lalu tekan Gunakan untuk menyalinnya ke RPM saya dan menyesuaikannya.</p>}
      </section>

      {tab === "library" && isAdmin && <AiPanel ws={ws} cp={cp} onDone={(m) => { setInfo(m); setError(null); }} />}

      {tab === "mine" ? (
        mine === null ? <p className="mt-10 text-moss">Memuat…</p> : mine.length === 0 ? (
          <div className="garis-buku mt-10 max-w-xl pb-3"><p>Belum ada RPM. Ketik sendiri, unggah dari template,</p><p>atau gunakan RPM dari pustaka.</p></div>
        ) : (
          <ol className="mt-4">
            {mine.map((r) => {
              const c = countIssues(lintRpm(r, { tp: tpOf(r.tpId), school, teacherName }));
              return (
                <li key={r.id} className="border-b border-mist py-5">
                  <p className="text-sm font-medium text-moss">{mapelName(r.mapelId)}, kelas {r.grade || "?"}, pertemuan {r.pertemuanKe} dari {r.dariPertemuan}{r.sumber ? ", dari pustaka" : ""}</p>
                  <p className="mt-1 font-display text-lg font-semibold">{r.topik || "(tanpa topik)"}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className={`border-l-4 pl-2 font-semibold ${r.status === "siap" ? "border-ink" : "border-chalk"}`}>{r.status === "siap" ? "Siap" : "Draf"}</span>
                    <span className="text-moss">{c.error === 0 && c.warn === 0 ? "Lolos ceklis mutu" : `${c.error} perlu diperbaiki, ${c.warn} saran`}</span>
                    <button onClick={() => setEditing({ mode: "mine", id: r.id, fields: r, notes: [] })} className="font-semibold underline">Buka</button>
                    {confirming === r.id ? (<><button onClick={async () => { try { await deleteRpm(ws, r.id); } catch { setError("RPM belum terhapus."); } setConfirming(null); }} className="font-semibold text-red-800 underline">Ya, hapus</button><button onClick={() => setConfirming(null)} className="underline">Batal</button></>) : <button onClick={() => setConfirming(r.id)} className="text-moss underline">Hapus</button>}
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
            <div className="garis-buku mt-10 max-w-xl pb-3"><p>Belum ada RPM di pustaka untuk pilihan ini.</p><p>{isAdmin ? "Buat RPM pertama di atas." : "Pustaka terus ditambah."}</p></div>
          ) : (
            <ol className="mt-4">
              {shownLib.map((l) => (
                <li key={l.id} className="border-b border-mist py-5">
                  <p className="text-sm font-medium text-moss">{mapelName(l.mapelId)}, kelas {l.grade || "?"}, pertemuan {l.pertemuanKe} dari {l.dariPertemuan}</p>
                  <p className="mt-1 font-display text-lg font-semibold">{l.judul || l.topik}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    {isAdmin && <span className={`border-l-4 pl-2 font-semibold ${l.status === "terbit" ? "border-ink" : "border-chalk"}`}>{l.status === "terbit" ? "Terbit" : "Draf"}</span>}
                    <button onClick={() => useLibrary(l)} disabled={busy} className="font-semibold underline">Gunakan</button>
                    {isAdmin && (<>
                      <button onClick={() => setEditing({ mode: "library", id: l.id, fields: l, judul: l.judul, notes: [] })} className="underline">Ubah</button>
                      <button onClick={() => togglePublish(l)} className="underline">{l.status === "terbit" ? "Tarik dari pustaka" : "Terbitkan"}</button>
                      {confirming === l.id ? (<><button onClick={async () => { try { await deleteLibrary(l.id); } catch { setError("RPM pustaka belum terhapus."); } setConfirming(null); }} className="font-semibold text-red-800 underline">Ya, hapus</button><button onClick={() => setConfirming(null)} className="underline">Batal</button></>) : <button onClick={() => setConfirming(l.id)} className="text-moss underline">Hapus</button>}
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
