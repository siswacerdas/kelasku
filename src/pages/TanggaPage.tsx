import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import PageHeader from "../components/PageHeader";
import { loadCp, type CpData } from "../features/cp/data";
import { subscribeClasses } from "../features/kelas/api";
import type { ClassDoc } from "../features/kelas/types";
import { subscribeTp } from "../features/tp/api";
import { composeTp, type TpDoc } from "../features/tp/model";
import { subscribeWorkspace, type WorkspaceDoc } from "../features/settings/api";
import { subscribeScaffolds } from "../features/scaffold/api";
import { countIssues, lintScaffold, mergedProfile, profileHash, scaffoldId, type ScaffoldDoc } from "../features/scaffold/model";
import ScaffoldEditor from "../features/scaffold/ScaffoldEditor";

export default function TanggaPage() {
  const { user } = useAuth();
  const ws = user?.uid ?? "";
  const [cp, setCp] = useState<CpData | null>(null);
  const [classes, setClasses] = useState<ClassDoc[] | null>(null);
  const [tps, setTps] = useState<TpDoc[] | null>(null);
  const [scaffolds, setScaffolds] = useState<ScaffoldDoc[] | null>(null);
  const [wsDoc, setWsDoc] = useState<WorkspaceDoc | null>(null);
  const [classId, setClassId] = useState("");
  const [editTp, setEditTp] = useState<TpDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fail = () => setError("Data tidak dapat dimuat. Periksa koneksi, lalu muat ulang halaman.");

  useEffect(() => { loadCp().then(setCp).catch(fail); }, []);
  useEffect(() => {
    if (!ws) return;
    const off = [subscribeClasses(ws, setClasses, fail), subscribeTp(ws, setTps, fail), subscribeScaffolds(ws, setScaffolds, fail), subscribeWorkspace(ws, setWsDoc, fail)];
    return () => off.forEach((f) => f());
  }, [ws]);
  useEffect(() => { if (classes && !classes.some((c) => c.id === classId)) setClassId(classes[0]?.id ?? ""); }, [classes, classId]);

  const cls = classes?.find((c) => c.id === classId);
  const rows = useMemo(
    () => (tps ?? []).filter((t) => cls && t.grade === cls.grade).sort((a, b) => a.mapelId.localeCompare(b.mapelId) || a.cpElemen.localeCompare(b.cpElemen, "id")),
    [tps, cls],
  );
  const profile = useMemo(() => mergedProfile(wsDoc?.profile, cls?.profile), [wsDoc, cls]);
  const mapelName = (id: string) => cp?.mapel.find((m) => m.id === id)?.nama ?? id;

  if (editTp && cls)
    return <ScaffoldEditor key={editTp.id + cls.id} ws={ws} tp={editTp} cls={cls} existing={scaffolds?.find((s) => s.id === scaffoldId(editTp.id, cls.id))} schoolProfile={wsDoc?.profile} onClose={() => setEditTp(null)} />;

  return (
    <>
      <PageHeader title="Tangga pertemuan" description="Menurunkan satu TP menjadi rangkaian pertemuan untuk satu kelas. Profil kelas menentukan jenis tangga yang cocok." />
      {error && <p role="alert" className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      {classes === null || tps === null || scaffolds === null ? (
        <p className="mt-10 text-moss">Memuat…</p>
      ) : classes.length === 0 ? (
        <div className="garis-buku mt-10 max-w-xl pb-3"><p>Belum ada kelas. Tangga disusun per kelas,</p><p>karena profil tiap kelas bisa berbeda.</p></div>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap items-end gap-x-6 gap-y-3">
            <label className="block min-w-[12rem]"><span className="font-medium">Kelas</span>
              <select className="mt-1 block w-full rounded-md border-2 border-mist bg-white px-3 py-2.5 focus:border-ink" value={classId} onChange={(e) => setClassId(e.target.value)}>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name} (kelas {c.grade}, {c.yearLabel})</option>)}
              </select></label>
            <p className="max-w-[60ch] text-moss">TP yang tampil adalah TP kelas {cls?.grade}. Jawaban profil kelas yang belum diisi memakai asumsi default dan ditandai di peta keputusan.</p>
          </div>

          {rows.length === 0 ? (
            <div className="garis-buku mt-10 max-w-xl pb-3">
              <p>Belum ada TP untuk kelas {cls?.grade}.</p>
              <p><Link to="/app/perencanaan/tujuan" className="underline">Susun TP lebih dulu</Link>, lalu kembali ke sini.</p>
            </div>
          ) : (
            <ol className="mt-6">
              {rows.map((t) => {
                const sc = scaffolds.find((s) => s.id === scaffoldId(t.id, classId));
                const iss = sc ? countIssues(lintScaffold(sc, { tp: t, profile, profilHashNow: profileHash(profile) })) : null;
                const siap = t.status === "siap";
                return (
                  <li key={t.id} className="border-b border-mist py-5">
                    <p className="text-sm font-medium text-moss">{mapelName(t.mapelId)}, {t.cpElemen || "TP mandiri"}, {t.jp} JP</p>
                    <p className="mt-1 max-w-[70ch] font-display text-lg font-semibold leading-snug">{composeTp(t)}</p>
                    <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span className={`border-l-4 pl-2 font-semibold ${sc?.status === "siap" ? "border-ink" : sc ? "border-chalk" : "border-mist"}`}>{sc ? (sc.status === "siap" ? "Tangga siap" : "Tangga draf") : "Belum disusun"}</span>
                      {iss && <span className="text-moss">{iss.error === 0 && iss.warn === 0 ? "Lolos telaah mutu" : `${iss.error} perlu diperbaiki, ${iss.warn} saran`}</span>}
                      {siap
                        ? <button onClick={() => setEditTp(t)} className="font-semibold underline">{sc ? "Buka" : "Mulai menyusun"}</button>
                        : <span className="text-moss">TP masih draf; <Link to="/app/perencanaan/tujuan" className="underline">selesaikan TP</Link> lebih dulu</span>}
                    </p>
                  </li>
                );
              })}
            </ol>
          )}
        </>
      )}
    </>
  );
}
