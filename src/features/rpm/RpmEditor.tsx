import { useMemo, useState } from "react";
import type { CpData } from "../cp/data";
import type { TpDoc } from "../tp/model";
import { SCALARS, SECTIONS, getPath, setPath } from "./fields";
import { saveLibrary, saveRpm } from "./api";
import {
  CEKLIS, DIMENSI, RUBRIK_LEVEL, TAHAP_INTI, TAHAP_LABEL, alokasiMenit, ceklisStatus, countIssues, emptyKktp, emptyRow, emptyRubrik, lintRpm, totalMenit,
  type Row, type RpmFields, type RubrikRow, type TahapKey,
} from "./model";

const field = "mt-1 block w-full rounded-md border-2 border-mist bg-white px-3 py-2.5 focus:border-ink";
const LEVEL_STYLE = { error: "border-red-800", warn: "border-chalk", info: "border-mist" } as const;
const LEVEL_LABEL = { error: "Perlu diperbaiki", warn: "Saran", info: "Petunjuk" } as const;
const H2 = "mt-12 border-b-4 border-ink pb-2 font-display text-3xl font-extrabold";
const H3 = "mt-8 font-display text-xl font-semibold";
const btn = "rounded-lg border-2 border-ink px-4 py-2 font-semibold hover:bg-mist";

function Txt({ label, value, onChange, rows = 3, hint }: { label: string; value: string; onChange: (v: string) => void; rows?: number; hint?: string }) {
  return (
    <label className="block">
      <span className="font-medium">{label}</span>
      {hint && <span className="block text-sm text-moss">{hint}</span>}
      <textarea className={field} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function RowsTable({ rows, onChange, label }: { rows: Row[]; onChange: (r: Row[]) => void; label: string }) {
  const set = (i: number, p: Partial<Row>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const move = (i: number, d: -1 | 1) => { const n = [...rows]; const j = i + d; if (j >= 0 && j < n.length) { [n[i], n[j]] = [n[j], n[i]]; onChange(n); } };
  return (
    <div>
      <ol className="mt-2">
        {rows.map((r, i) => (
          <li key={i} className="grid gap-x-3 gap-y-2 border-b border-mist py-3 md:grid-cols-[2rem_5.5rem_minmax(0,3fr)_minmax(0,2fr)_auto]">
            <span className="font-semibold md:pt-2.5">{i + 1}</span>
            <label className="block"><span className="text-sm text-moss md:sr-only">Waktu (menit)</span>
              <input aria-label={`${label} baris ${i + 1} waktu`} className={`${field} mt-0`} type="number" min={1} inputMode="numeric" value={r.waktu || ""} onChange={(e) => set(i, { waktu: Number(e.target.value) })} /></label>
            <label className="block"><span className="text-sm text-moss md:sr-only">Kegiatan pembelajaran</span>
              <textarea aria-label={`${label} baris ${i + 1} kegiatan`} className={`${field} mt-0`} rows={2} value={r.kegiatan} onChange={(e) => set(i, { kegiatan: e.target.value })} /></label>
            <label className="block"><span className="text-sm text-moss md:sr-only">Catatan (hanya bila relevan)</span>
              <textarea aria-label={`${label} baris ${i + 1} catatan`} className={`${field} mt-0`} rows={2} value={r.catatan} onChange={(e) => set(i, { catatan: e.target.value })} placeholder="Berkesadaran, Bermakna, atau Menggembirakan: alasan singkat" /></label>
            <span className="flex gap-3 text-sm md:flex-col md:gap-1 md:pt-2">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="underline disabled:opacity-40 disabled:no-underline">Naik</button>
              <button onClick={() => move(i, 1)} disabled={i === rows.length - 1} className="underline disabled:opacity-40 disabled:no-underline">Turun</button>
              {rows.length > 1 && <button onClick={() => onChange(rows.filter((_, j) => j !== i))} className="text-moss underline">Hapus</button>}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-2 flex flex-wrap items-center gap-4">
        <button onClick={() => onChange([...rows, emptyRow()])} className={btn}>Tambah baris</button>
        <span className="text-sm text-moss">Subtotal {rows.reduce((n, r) => n + (Number(r.waktu) || 0), 0)} menit</span>
      </p>
    </div>
  );
}

function RubrikEditor({ rows, onChange, nama }: { rows: RubrikRow[]; onChange: (r: RubrikRow[]) => void; nama: string }) {
  const set = (i: number, p: Partial<RubrikRow>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...p } : r)));
  return (
    <div>
      {rows.length === 0 && <p className="text-moss">Belum ada aspek. Gunakan salah satu atau keduanya sesuai jenis TP.</p>}
      <ul>
        {rows.map((r, i) => (
          <li key={i} className="border-b border-mist py-3">
            <label className="block"><span className="font-medium">Aspek yang dinilai</span><input aria-label={`${nama} aspek ${i + 1}`} className={field} value={r.aspek} onChange={(e) => set(i, { aspek: e.target.value })} /></label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {(["l1", "l2", "l3", "l4"] as const).map((k, n) => (
                <Txt key={k} label={RUBRIK_LEVEL[n]} value={r[k]} rows={3} onChange={(v) => set(i, { [k]: v })} />
              ))}
            </div>
            <button onClick={() => onChange(rows.filter((_, j) => j !== i))} className="mt-2 text-sm text-moss underline">Hapus aspek</button>
          </li>
        ))}
      </ul>
      <button onClick={() => onChange([...rows, emptyRubrik()])} className={`${btn} mt-3`}>Tambah aspek</button>
    </div>
  );
}

export default function RpmEditor({
  ws, uid, mode, id, initial, libraryMeta, notes, cp, tp, school, teacherName, onClose,
}: {
  ws: string; uid: string; mode: "mine" | "library"; id: string | null; initial: RpmFields;
  libraryMeta?: { judul: string }; notes: string[]; cp: CpData | null; tp?: TpDoc;
  school?: { name?: string; principalName?: string }; teacherName?: string; onClose: () => void;
}) {
  const [r, setR] = useState<RpmFields>(initial);
  const [judul, setJudul] = useState(libraryMeta?.judul ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const patch = (fn: (d: RpmFields) => void) => setR((o) => { const d = structuredClone(o); fn(d); return d; });

  const issues = useMemo(() => lintRpm(r, { tp, school, teacherName }), [r, tp, school, teacherName]);
  const ceklis = useMemo(() => ceklisStatus(issues, r), [issues, r]);
  const { error: nErr, warn: nWarn } = countIssues(issues);
  const alok = alokasiMenit(r), tot = totalMenit(r);
  const fase = r.grade >= 1 ? (r.grade <= 2 ? "A" : r.grade <= 4 ? "B" : "C") : null;
  const mapelOptions = cp?.mapel.filter((m) => !fase || m.fase.includes(fase)) ?? [];
  const cpMapel = cp?.mapel.find((m) => m.id === r.mapelId);

  async function save(status: "draf" | "siap") {
    setBusy(true);
    setError(null);
    try {
      if (mode === "library") await saveLibrary(id, r, status === "siap" ? "terbit" : "draf", judul.trim() || `${cpMapel?.nama ?? "RPM"} kelas ${r.grade}: ${r.topik}`, uid);
      else await saveRpm(ws, id, r, status);
      onClose();
    } catch {
      setError("RPM belum tersimpan. Periksa koneksi dan hak akses, lalu coba lagi.");
      setBusy(false);
    }
  }

  const scalars = (section: string) => SCALARS.filter((s) => s.section === section).map((s) => {
    const v = getPath(r, s.path);
    if (s.kind === "num") return (
      <label key={s.code} className="block"><span className="font-medium">{s.label}</span>
        <input className={field} type="number" min={1} inputMode="numeric" value={Number(v) || ""} onChange={(e) => patch((d) => setPath(d, s.path, Number(e.target.value)))} /></label>
    );
    if (s.kind === "status") return (
      <div key={s.code}><span className="font-medium">{s.label}</span>
        <div className="mt-1 flex flex-wrap gap-2">
          {([["formatif", "Formatif-saja (TP berlanjut)"], ["sumatif", "Sumatif (pertemuan terakhir TP ini)"]] as const).map(([val, text]) => (
            <label key={val} className="cursor-pointer"><input type="radio" name="status-akhir" className="peer sr-only" checked={v === val} onChange={() => patch((d) => setPath(d, s.path, val))} />
              <span className="block rounded-md border-2 border-mist px-3 py-2 peer-checked:border-ink peer-checked:bg-mist peer-checked:font-semibold peer-focus-visible:outline-3 peer-focus-visible:outline-chalk">{text}</span></label>
          ))}
        </div></div>
    );
    return <Txt key={s.code} label={s.label} hint={s.hint} rows={s.rows ?? 3} value={String(v ?? "")} onChange={(val) => patch((d) => setPath(d, s.path, val))} />;
  });

  const tahap = (k: TahapKey) => (
    <>
      <h3 className={H3}>{TAHAP_LABEL[k]}</h3>
      <RowsTable label={TAHAP_LABEL[k]} rows={r.c[k]} onChange={(rows) => patch((d) => { d.c[k] = rows; })} />
      {(TAHAP_INTI as readonly string[]).includes(k) && (
        <fieldset className="mt-5 border-l-4 border-mist pl-4">
          <legend className="font-medium">Adaptasi perbedaan kemampuan ({TAHAP_LABEL[k]})</legend>
          <div className="mt-2 grid gap-3 md:grid-cols-3">
            {(["cepat", "lambat", "pemalu"] as const).map((c) => (
              <Txt key={c} label={c === "cepat" ? "Siswa cepat" : c === "lambat" ? "Siswa lambat" : "Siswa pemalu"} rows={3}
                value={r.c.adaptasi[k as (typeof TAHAP_INTI)[number]][c]} onChange={(v) => patch((d) => { d.c.adaptasi[k as (typeof TAHAP_INTI)[number]][c] = v; })} />
            ))}
          </div>
        </fieldset>
      )}
    </>
  );

  return (
    <div>
      <button onClick={onClose} className="text-moss underline">Kembali</button>
      <header className="mt-3 border-b-4 border-ink pb-4">
        <p className="text-sm font-medium text-moss">{mode === "library" ? "Pustaka RPM (admin)" : "RPM saya"}</p>
        <h2 className="mt-1 font-display text-3xl font-extrabold">{cpMapel?.nama ?? "RPM baru"}{r.grade ? `, kelas ${r.grade}` : ""}{r.topik ? `: ${r.topik}` : ""}</h2>
        <p className="mt-2 text-moss">
          Total waktu {tot} dari {alok} menit. Telaah: {nErr} perlu diperbaiki, {nWarn} saran. <a href="#ceklis-rpm" className="underline min-[110rem]:hidden">Lihat ceklis mutu</a>
        </p>
      </header>

      {notes.length > 0 && (
        <div role="status" className="mt-5 border-l-4 border-chalk bg-white px-4 py-3">
          <p className="font-semibold">Hasil membaca berkas:</p>
          <ul className="list-disc pl-5">{notes.map((n) => <li key={n}>{n}</li>)}</ul>
          <p className="text-sm text-moss">Periksa isinya sebelum menyimpan.</p>
        </div>
      )}

      <div className="mt-6 gap-12 min-[110rem]:grid min-[110rem]:grid-cols-[minmax(0,1fr)_30rem]">
        <div className="min-w-0">
          {mode === "library" && <label className="mt-2 block max-w-2xl"><span className="font-medium">Judul di pustaka</span><input className={field} value={judul} onChange={(e) => setJudul(e.target.value)} /></label>}

          <h2 className={H2}>A. Identifikasi</h2>
          <h3 className={H3}>{SECTIONS.A1}</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <label className="block"><span className="font-medium">Kelas</span>
              <select className={field} value={r.grade} onChange={(e) => patch((d) => { d.grade = Number(e.target.value); })}>
                <option value={0}>Pilih kelas</option>{[1, 2, 3, 4, 5, 6].map((g) => <option key={g} value={g}>Kelas {g}</option>)}</select></label>
            <label className="block"><span className="font-medium">Mata pelajaran</span>
              <select className={field} value={r.mapelId} onChange={(e) => patch((d) => { d.mapelId = e.target.value; })}>
                <option value="">Pilih mata pelajaran</option>{mapelOptions.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}</select></label>
            <label className="block"><span className="font-medium">Semester</span>
              <select className={field} value={r.semester} onChange={(e) => patch((d) => { d.semester = Number(e.target.value) as 0 | 1 | 2; })}>
                <option value={0}>Belum ditentukan</option><option value={1}>Semester 1</option><option value={2}>Semester 2</option></select></label>
            {scalars("A1")}
          </div>
          <p className="mt-2 text-sm text-moss">Alokasi waktu: {r.jp} JP x {r.menitPerJp} menit = {alok} menit.</p>
          <h3 className={H3}>{SECTIONS.A2}</h3><div className="mt-3 grid gap-4 md:grid-cols-2">{scalars("A2")}</div>
          <h3 className={H3}>{SECTIONS.A3}</h3><div className="mt-3 grid gap-4 md:grid-cols-2">{scalars("A3")}</div>

          <h2 className={H2}>B. Desain pembelajaran</h2>
          <h3 className={H3}>{SECTIONS.B1}</h3><div className="mt-3">{scalars("B1")}</div>
          <h3 className={H3}>{SECTIONS.B2}</h3><div className="mt-3 grid gap-4 md:grid-cols-2">{scalars("B2")}</div>
          <h3 className={H3}>{SECTIONS.B3}</h3><div className="mt-3">{scalars("B3")}</div>
          <h3 className={H3}>B.4 Fokus Dimensi Profil Lulusan</h3>
          <p className="text-moss">Tulis ke-8 dimensi satu baris, beri tanda bintang pada 2 sampai 3 yang paling dominan.</p>
          <ul className="mt-2">
            {r.b.dimensi.map((dm, i) => (
              <li key={dm.nama} className="grid gap-x-3 gap-y-1 border-b border-mist py-2 md:grid-cols-[2rem_13rem_minmax(0,1fr)_7rem] md:items-center">
                <span className="font-semibold">{i + 1}</span><span>{DIMENSI[i]}</span>
                <input aria-label={`Catatan ${dm.nama}`} className={`${field} mt-0`} value={dm.catatan} onChange={(e) => patch((d) => { d.b.dimensi[i].catatan = e.target.value; })} />
                <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={dm.dominan} onChange={(e) => patch((d) => { d.b.dimensi[i].dominan = e.target.checked; })} /><span>Dominan</span></label>
              </li>
            ))}
          </ul>
          <h3 className={H3}>{SECTIONS.B5}</h3><div className="mt-3">{scalars("B5")}</div>
          <h3 className={H3}>{SECTIONS.B6}</h3><div className="mt-3">{scalars("B6")}</div>
          <h3 className={H3}>{SECTIONS.B7}</h3><div className="mt-3">{scalars("B7")}</div>

          <h2 className={H2}>C. Pengalaman belajar</h2>
          <p className="mt-3 max-w-[70ch] text-moss">Setiap tahap berupa tabel: satu baris, satu tindakan, waktu terisi. Uji kecukupan: bisakah guru pengganti menjalankan baris-baris ini tanpa mengarang? Contoh pola bukan kuota jumlah baris.</p>
          {tahap("pendahuluan")}{tahap("memahami")}{tahap("mengaplikasi")}{tahap("merefleksi")}
          <h3 className={H3}>{SECTIONS.C9}</h3><div className="mt-3">{scalars("C9")}</div>
          {tahap("penutup")}
          <p className={`mt-6 font-semibold ${tot === alok ? "" : "text-red-800"}`}>Total waktu semua tahap: {tot} menit; alokasi {alok} menit.</p>

          <h2 className={H2}>D. Asesmen pembelajaran</h2>
          <h3 className={H3}>{SECTIONS.D1}</h3><div className="mt-3 grid gap-4 md:grid-cols-3">{scalars("D1")}</div>
          <h3 className={H3}>{SECTIONS.D2}</h3><div className="mt-3 grid gap-4 md:grid-cols-3">{scalars("D2")}</div>
          <h3 className={H3}>{SECTIONS.D3}</h3><div className="mt-3 grid gap-4 md:grid-cols-2">{scalars("D3")}</div>
          <h3 className={H3}>D.4 Rubrik pengetahuan</h3><RubrikEditor nama="Rubrik pengetahuan" rows={r.d.rubrikPengetahuan} onChange={(x) => patch((d) => { d.d.rubrikPengetahuan = x; })} />
          <h3 className={H3}>D.4 Rubrik kinerja</h3><RubrikEditor nama="Rubrik kinerja" rows={r.d.rubrikKinerja} onChange={(x) => patch((d) => { d.d.rubrikKinerja = x; })} />
          <h3 className={H3}>D.5 Ceklis observasi guru</h3>
          <p className="text-moss">Daftar siswa diisi saat dicetak dari kelas Anda. Tulis perilaku atau kompetensi yang diamati sebagai kolom.</p>
          <ul className="mt-2 space-y-2">
            {r.d.observasi.perilaku.map((p, i) => (
              <li key={i} className="flex gap-3"><input aria-label={`Perilaku teramati ${i + 1}`} className={`${field} mt-0`} value={p} onChange={(e) => patch((d) => { d.d.observasi.perilaku[i] = e.target.value; })} />
                {r.d.observasi.perilaku.length > 1 && <button onClick={() => patch((d) => { d.d.observasi.perilaku.splice(i, 1); })} className="text-moss underline">Hapus</button>}</li>
            ))}
          </ul>
          <p className="mt-3 flex flex-wrap items-center gap-5">
            <button onClick={() => patch((d) => { d.d.observasi.perilaku.push(""); })} className={btn}>Tambah perilaku</button>
            <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={r.d.observasi.kolomPak} onChange={(e) => patch((d) => { d.d.observasi.kolomPak = e.target.checked; })} /><span>Sertakan kolom PAK</span></label>
          </p>
          <h3 className={H3}>D.6 Keterkaitan dengan KKTP dan Dimensi Profil Lulusan</h3>
          <ul>
            {r.d.kktp.map((k, i) => (
              <li key={i} className="border-b border-mist py-3">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {([["jenis", "Jenis KKTP (Pengetahuan/Kinerja)"], ["level", "Level yang dituju"], ["deskriptor", "Deskriptor capaian"], ["bukti", "Bukti dari RPM ini"]] as const).map(([key, label]) => (
                    <label key={key} className="block"><span className="font-medium">{label}</span><input className={field} value={k[key]} onChange={(e) => patch((d) => { d.d.kktp[i][key] = e.target.value; })} /></label>
                  ))}
                </div>
                {r.d.kktp.length > 1 && <button onClick={() => patch((d) => { d.d.kktp.splice(i, 1); })} className="mt-2 text-sm text-moss underline">Hapus baris</button>}
              </li>
            ))}
          </ul>
          <button onClick={() => patch((d) => { d.d.kktp.push(emptyKktp()); })} className={`${btn} mt-3`}>Tambah baris</button>

          <h2 className={H2}>Audit mandiri</h2>
          <p className="mt-3 text-moss">Butir yang tidak dapat diperiksa otomatis. Centang setelah Anda benar-benar memeriksanya.</p>
          <ul className="mt-2 space-y-3">
            {CEKLIS.filter((c) => c.guru).map((c) => (
              <li key={c.code}><label className="flex cursor-pointer gap-3"><input type="checkbox" className="mt-1.5" checked={r.konfirmasi[c.guru!]} onChange={(e) => patch((d) => { d.konfirmasi[c.guru!] = e.target.checked; })} /><span><span className="font-semibold">{c.code}</span> {c.kriteria}</span></label></li>
            ))}
          </ul>

          {error && <p role="alert" className="mt-6 text-sm font-medium text-red-800">{error}</p>}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button disabled={busy || nErr > 0} onClick={() => save("siap")} className="rounded-lg bg-chalk px-5 py-3 font-semibold text-ink hover:brightness-95 disabled:opacity-50">{mode === "library" ? "Terbitkan ke pustaka" : "Simpan sebagai siap"}</button>
            <button disabled={busy} onClick={() => save("draf")} className="rounded-lg border-2 border-ink px-5 py-3 font-semibold hover:bg-mist disabled:opacity-60">Simpan sebagai draf</button>
            {nErr > 0 && <p className="text-sm text-moss">Status siap terbuka setelah semua yang perlu diperbaiki selesai.</p>}
          </div>
        </div>

        <aside id="ceklis-rpm" className="mt-14 min-w-0 min-[110rem]:sticky min-[110rem]:top-8 min-[110rem]:mt-0 min-[110rem]:max-h-[calc(100dvh-4rem)] min-[110rem]:self-start min-[110rem]:overflow-y-auto min-[110rem]:border-l-4 min-[110rem]:border-ink min-[110rem]:pl-8">
          <h3 className="font-display text-2xl font-semibold">Ceklis mutu RPM</h3>
          <p className="text-moss">{ceklis.filter((c) => c.status === "lolos").length} dari {ceklis.length} butir lolos.</p>
          <ul className="mt-3">
            {ceklis.map((c) => (
              <li key={c.code} className="flex gap-3 border-b border-mist py-2">
                <span className={`w-24 shrink-0 text-sm font-semibold ${c.status === "perlu" ? "text-red-800" : c.status === "belum" ? "text-moss" : ""}`}>{c.status === "lolos" ? "Lolos" : c.status === "perlu" ? "Perlu" : "Belum dicentang"}</span>
                <span><span className="text-sm text-moss">{c.code}</span> {c.kriteria}</span>
              </li>
            ))}
          </ul>
          <h3 className="mt-8 font-display text-2xl font-semibold">Temuan</h3>
          <ul className="mt-3 space-y-2">
            {issues.filter((i) => !/^Konfirmasi/.test(i.message)).map((i, k) => (
              <li key={i.code + k} className={`border-l-4 bg-white px-3 py-2 ${LEVEL_STYLE[i.level]}`}><span className="text-sm font-semibold">{LEVEL_LABEL[i.level]} ({i.code})</span><p>{i.message}</p></li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
