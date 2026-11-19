import { useMemo, useState } from "react";
import { SOURCE_LABEL, type Profile } from "../profil/profile";
import type { ClassDoc } from "../kelas/types";
import { composeTp, type TpDoc } from "../tp/model";
import { deleteScaffold, saveScaffold } from "./api";
import {
  countIssues, emptyAlt, emptyTangga, lintScaffold, mergedProfile, profileHash, newScaffold,
  type Ans, type Bantuan, type Bobot, type JenisAlt, type Media, type ScaffoldDoc, type ScaffoldFields, type Skala,
} from "./model";

const field = "mt-1 block w-full rounded-md border-2 border-mist bg-white px-3 py-2.5 focus:border-ink";
const LEVEL_STYLE = { error: "border-red-800", warn: "border-chalk", info: "border-mist" } as const;
const LEVEL_LABEL = { error: "Perlu diperbaiki", warn: "Saran", info: "Petunjuk" } as const;
const H3 = "mt-10 font-display text-2xl font-semibold";

function Txt({ label, value, onChange, rows = 3, hint }: { label: string; value: string; onChange: (v: string) => void; rows?: number; hint?: string }) {
  return (
    <label className="block">
      <span className="font-medium">{label}</span>
      {hint && <span className="block text-sm text-moss">{hint}</span>}
      <textarea className={field} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
function Seg<T extends string>({ name, value, options, onChange }: { name: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(([v, text]) => (
        <label key={v} className="cursor-pointer">
          <input type="radio" name={name} className="peer sr-only" checked={value === v} onChange={() => onChange(v)} />
          <span className="block rounded-md border-2 border-mist px-3 py-2 peer-checked:border-ink peer-checked:bg-mist peer-checked:font-semibold peer-focus-visible:outline-3 peer-focus-visible:outline-chalk">{text}</span>
        </label>
      ))}
    </div>
  );
}
const ANS: [Ans, string][] = [["ya", "Ya"], ["tidak", "Tidak"]];

export default function ScaffoldEditor({
  ws, tp, cls, existing, schoolProfile, onClose,
}: {
  ws: string; tp: TpDoc; cls: ClassDoc; existing: ScaffoldDoc | undefined; schoolProfile: Profile | undefined; onClose: () => void;
}) {
  const [s, setS] = useState<ScaffoldFields>(existing ?? newScaffold(tp, cls.id));
  const [ai, setAi] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);

  const profile = useMemo(() => mergedProfile(schoolProfile, cls.profile), [schoolProfile, cls.profile]);
  const hashNow = useMemo(() => profileHash(profile), [profile]);
  const issues = useMemo(() => lintScaffold(s, { tp, profile, profilHashNow: hashNow }), [s, tp, profile, hashNow]);
  const { error: nErr, warn: nWarn } = countIssues(issues);
  const patch = (fn: (d: ScaffoldFields) => void) => setS((o) => { const d = structuredClone(o); fn(d); return d; });
  const alt = s.alternatif[Math.min(ai, s.alternatif.length - 1)];
  const aIdx = Math.min(ai, s.alternatif.length - 1);

  async function save(status: ScaffoldDoc["status"]) {
    setBusy(true);
    setError(null);
    try {
      await saveScaffold(ws, { ...s, profilHash: hashNow }, status);
      onClose();
    } catch {
      setError("Tangga belum tersimpan. Periksa koneksi, lalu coba lagi.");
      setBusy(false);
    }
  }
  async function remove() {
    try { await deleteScaffold(ws, tp.id, cls.id); onClose(); } catch { setError("Tangga belum terhapus. Coba lagi."); }
  }
  const moveT = (ti: number, d: -1 | 1) => patch((x) => { const t = x.alternatif[aIdx].tangga; const j = ti + d; if (j >= 0 && j < t.length) [t[ti], t[j]] = [t[j], t[ti]]; });

  return (
    <div>
      <button onClick={onClose} className="text-moss underline">Kembali ke daftar TP</button>
      <header className="mt-3 border-b-4 border-ink pb-4">
        <p className="text-sm font-medium text-moss">Tangga pertemuan untuk kelas {cls.name}, JP TP: {tp.jp}</p>
        <h2 className="mt-1 max-w-[75ch] font-display text-2xl font-extrabold leading-snug">{composeTp(tp)}</h2>
        <p className="mt-2 text-moss">Telaah: {nErr} perlu diperbaiki, {nWarn} saran. <a href="#telaah-tangga" className="underline min-[110rem]:hidden">Lihat telaah</a></p>
      </header>

      <div className="mt-8 gap-12 min-[110rem]:grid min-[110rem]:grid-cols-[minmax(0,1fr)_28rem]">
        <div className="min-w-0">
          <h3 className="font-display text-2xl font-semibold">Analisis TP untuk scaffolding</h3>
          <p className="text-moss">Pisahkan KKO dari konten, supaya batas kompetensi jelas bagi siapa pun yang menjalankan.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Txt label="Arti KKO dalam TP ini" value={s.analisis.kkoMakna} onChange={(v) => patch((d) => { d.analisis.kkoMakna = v; })} />
            <Txt label="Bukti kompetensi tercapai" value={s.analisis.buktiTercapai} onChange={(v) => patch((d) => { d.analisis.buktiTercapai = v; })} />
            <Txt label="Yang BUKAN termasuk kompetensi ini" value={s.analisis.bukanTermasuk} onChange={(v) => patch((d) => { d.analisis.bukanTermasuk = v; })} />
            <Txt label="Kompetensi prasyarat yang belum disebut TP" hint="Satu per baris." value={s.analisis.prasyarat} onChange={(v) => patch((d) => { d.analisis.prasyarat = v; })} />
            <Txt label="Materi terpilih" value={s.analisis.materiTerpilih} onChange={(v) => patch((d) => { d.analisis.materiTerpilih = v; })} hint="Yang paling alami memunculkan bukti kompetensi." />
            <Txt label="Alasan memilih materi (tautkan ke peta keputusan)" value={s.analisis.alasanMateri} onChange={(v) => patch((d) => { d.analisis.alasanMateri = v; })} />
          </div>
          <fieldset className="mt-6">
            <legend className="font-medium">Konten yang disebut TP: wajib atau pilihan?</legend>
            <ul className="mt-2 space-y-2">
              {s.analisis.konten.map((k, i) => (
                <li key={i} className="flex flex-wrap items-center gap-3">
                  <input aria-label={`Konten ${i + 1}`} className={`${field} mt-0 min-w-[14rem] flex-1`} value={k.konten} onChange={(e) => patch((d) => { d.analisis.konten[i].konten = e.target.value; })} />
                  <Seg name={`konten-${i}`} value={k.status} options={[["WAJIB", "Wajib"], ["PILIHAN", "Pilihan"]]} onChange={(v) => patch((d) => { d.analisis.konten[i].status = v; })} />
                  <button onClick={() => patch((d) => { d.analisis.konten.splice(i, 1); })} className="text-moss underline">Hapus</button>
                </li>
              ))}
            </ul>
            <button onClick={() => patch((d) => { d.analisis.konten.push({ konten: "", status: "WAJIB" }); })} className="mt-3 rounded-lg border-2 border-ink px-4 py-2 font-semibold hover:bg-mist">Tambah konten</button>
          </fieldset>

          <h3 className={H3}>Asesmen diagnostik awal</h3>
          <div className="mt-4 grid gap-4">
            <Txt label="Tugas siap pakai (10 sampai 15 menit)" value={s.diagnostik.tugas} onChange={(v) => patch((d) => { d.diagnostik.tugas = v; })} rows={4} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Txt label="Cara membaca hasil (apa yang diamati)" value={s.diagnostik.caraMembaca} onChange={(v) => patch((d) => { d.diagnostik.caraMembaca = v; })} />
              <Txt label="Keputusan awal" hint="Mulai dari tangga N jika sudah bisa X, tangga M jika belum." value={s.diagnostik.keputusanAwal} onChange={(v) => patch((d) => { d.diagnostik.keputusanAwal = v; })} />
            </div>
          </div>

          <h3 className={H3}>Rekomendasi scaffolding</h3>
          <p className="text-moss">Minimal dua alternatif, masing-masing dengan kondisi kapan cocok dipakai.</p>
          <div role="tablist" aria-label="Alternatif" className="mt-3 flex flex-wrap items-center gap-1 border-b border-mist">
            {s.alternatif.map((a, i) => (
              <button key={i} role="tab" aria-selected={i === aIdx} onClick={() => setAi(i)} className={`border-b-4 px-3 py-2 ${i === aIdx ? "border-chalk font-semibold" : "border-transparent text-moss"}`}>{a.nama || `Alternatif ${i + 1}`}</button>
            ))}
            <button onClick={() => { patch((d) => { d.alternatif.push(emptyAlt("lain", `Alternatif ${d.alternatif.length + 1}`)); }); setAi(s.alternatif.length); }} className="px-3 py-2 underline">Tambah alternatif</button>
          </div>

          {alt && (
            <div className="mt-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block"><span className="font-medium">Nama alternatif</span><input className={field} value={alt.nama} onChange={(e) => patch((d) => { d.alternatif[aIdx].nama = e.target.value; })} /></label>
                <div><span className="font-medium">Jenis</span><div className="mt-1">
                  <Seg<JenisAlt> name="jenis" value={alt.jenis} options={[["bertahap-tunggal", "Bertahap tunggal"], ["kontras-berpasangan", "Kontras berpasangan"], ["lain", "Lainnya"]]} onChange={(v) => patch((d) => { d.alternatif[aIdx].jenis = v; })} /></div></div>
              </div>
              <div className="mt-4"><Txt label="Rasional: alternatif ini cocok jika ..." value={alt.rasional} onChange={(v) => patch((d) => { d.alternatif[aIdx].rasional = v; })} rows={2} /></div>

              <h4 className="mt-6 font-display text-xl font-semibold">Tangga</h4>
              <ol className="mt-2">
                {alt.tangga.map((t, ti) => (
                  <li key={ti} className="border-b border-mist py-3">
                    <details open={ti === 0}>
                      <summary className="cursor-pointer font-medium">
                        Tangga {ti + 1}: {t.kompetensi.trim() || "belum diisi"} <span className="text-sm font-normal text-moss">({t.bobot})</span>
                      </summary>
                      <div className="mt-3 grid gap-4 sm:grid-cols-2">
                        <Txt label="Kompetensi yang dibangun" value={t.kompetensi} onChange={(v) => patch((d) => { d.alternatif[aIdx].tangga[ti].kompetensi = v; })} rows={2} />
                        <Txt label="Materi" value={t.materi} onChange={(v) => patch((d) => { d.alternatif[aIdx].tangga[ti].materi = v; })} rows={2} />
                        <Txt label="Mengapa tangga ini ada" value={t.mengapa} onChange={(v) => patch((d) => { d.alternatif[aIdx].tangga[ti].mengapa = v; })} rows={2} />
                        <Txt label="Tanda keberhasilan yang realistis" value={t.tandaBerhasil} onChange={(v) => patch((d) => { d.alternatif[aIdx].tangga[ti].tandaBerhasil = v; })} rows={2} />
                        <div className="sm:col-span-2"><span className="font-medium">Bobot</span><div className="mt-1">
                          <Seg<Bobot> name={`bobot-${aIdx}-${ti}`} value={t.bobot} options={[["wajib", "Prasyarat wajib"], ["ideal", "Ideal, bisa ditunda"], ["pengayaan", "Pengayaan"]]} onChange={(v) => patch((d) => { d.alternatif[aIdx].tangga[ti].bobot = v; })} /></div></div>
                        <label className="block"><span className="font-medium">Bantuan (menyusut seiring tangga)</span>
                          <select className={field} value={t.bantuan} onChange={(e) => patch((d) => { d.alternatif[aIdx].tangga[ti].bantuan = e.target.value as Bantuan; })}>
                            <option value="">Belum ditentukan</option><option value="penuh">Penuh</option><option value="sedang">Sedang</option><option value="sedikit">Sedikit</option><option value="tanpa">Tanpa bantuan</option></select></label>
                        <label className="block"><span className="font-medium">Skala kegiatan</span>
                          <select className={field} value={t.skala} onChange={(e) => patch((d) => { d.alternatif[aIdx].tangga[ti].skala = e.target.value as Skala; })}>
                            <option value="">Belum ditentukan</option><option value="individu">Individu</option><option value="kelompok-kecil">Kelompok kecil</option><option value="kelompok-sedang">Kelompok sedang</option><option value="kelas">Seluruh kelas</option></select></label>
                        <label className="block"><span className="font-medium">Media utama</span>
                          <select className={field} value={t.media} onChange={(e) => patch((d) => { d.alternatif[aIdx].tangga[ti].media = e.target.value as Media; })}>
                            <option value="">Belum ditentukan</option><option value="cetak">Teks cetak</option><option value="benda">Benda nyata</option><option value="lisan">Interaksi lisan</option><option value="digital">Digital</option></select></label>
                        <span className="hidden sm:block" />
                        <Txt label="Persiapan guru" value={t.persiapanGuru} onChange={(v) => patch((d) => { d.alternatif[aIdx].tangga[ti].persiapanGuru = v; })} rows={2} />
                        <Txt label="Kalimat pembuka siap pakai" value={t.kalimatPembuka} onChange={(v) => patch((d) => { d.alternatif[aIdx].tangga[ti].kalimatPembuka = v; })} rows={2} />
                        <Txt label="Yang perlu diamati" value={t.diamati} onChange={(v) => patch((d) => { d.alternatif[aIdx].tangga[ti].diamati = v; })} rows={2} />
                        <Txt label="Langkah jika belum berhasil" value={t.jikaBelum} onChange={(v) => patch((d) => { d.alternatif[aIdx].tangga[ti].jikaBelum = v; })} rows={2} />
                      </div>
                      <p className="mt-3 flex flex-wrap gap-4 text-sm">
                        <button onClick={() => moveT(ti, -1)} disabled={ti === 0} className="underline disabled:opacity-40 disabled:no-underline">Naik</button>
                        <button onClick={() => moveT(ti, 1)} disabled={ti === alt.tangga.length - 1} className="underline disabled:opacity-40 disabled:no-underline">Turun</button>
                        <button onClick={() => patch((d) => { d.alternatif[aIdx].tangga.splice(ti, 1); })} className="text-moss underline">Hapus tangga</button>
                      </p>
                    </details>
                  </li>
                ))}
              </ol>
              <button onClick={() => patch((d) => { d.alternatif[aIdx].tangga.push(emptyTangga()); })} className="mt-3 rounded-lg border-2 border-ink px-4 py-2 font-semibold hover:bg-mist">Tambah tangga</button>

              <h4 className="mt-8 font-display text-xl font-semibold">Uji validitas tangga</h4>
              <div className="mt-2 divide-y divide-mist">
                {([["sederhana", "Kesederhanaan: setiap tangga lebih sederhana dari tangga berikutnya, bukan sekadar berbeda topik?"], ["fondasi", "Fondasi: menguasai tiap tangga langsung membantu tangga berikutnya?"], ["cukup", "Kecukupan: bila semua tangga dilalui, siswa pasti lebih siap mencapai kompetensi puncak?"]] as const).map(([k, q]) => (
                  <div key={k} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <p className="max-w-[52ch]">{q}</p>
                    <Seg<Ans> name={`uji-${aIdx}-${k}`} value={alt.uji[k]} options={ANS} onChange={(v) => patch((d) => { d.alternatif[aIdx].uji[k] = v; })} />
                  </div>
                ))}
              </div>
              {s.alternatif.length > 1 && <button onClick={() => { patch((d) => { d.alternatif.splice(aIdx, 1); }); setAi(0); }} className="mt-4 text-moss underline">Hapus alternatif ini</button>}
            </div>
          )}

          <h3 className={H3}>Pertemuan inti</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Txt label="Kompetensi (sesuai TP)" value={s.inti.kompetensi} onChange={(v) => patch((d) => { d.inti.kompetensi = v; })} rows={2} />
            <Txt label="Materi puncak" value={s.inti.materiPuncak} onChange={(v) => patch((d) => { d.inti.materiPuncak = v; })} rows={2} />
            <Txt label="Bentuk asesmen" value={s.inti.bentukAsesmen} onChange={(v) => patch((d) => { d.inti.bentukAsesmen = v; })} rows={2} />
            <Txt label="Instrumen asesmen singkat" value={s.inti.instrumen} onChange={(v) => patch((d) => { d.inti.instrumen = v; })} rows={2} />
          </div>

          <h3 className={H3}>Pengaturan pelaksanaan</h3>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div><span className="font-medium">Bentuk rangsangan</span><div className="mt-1">
              <Seg name="rangsangan" value={s.rangsangan} options={[["bersama", "Bersama untuk seluruh kelas"], ["pribadi", "Pengalaman pribadi siswa"], ["tidak-relevan", "Tidak relevan"]]} onChange={(v) => patch((d) => { d.rangsangan = v; })} /></div></div>
            <div><span className="font-medium">Objek pengamatan</span><div className="mt-1">
              <Seg name="objek" value={s.objekPengamatan} options={[["dalam-kelas", "Dalam kelas"], ["luar-kelas", "Luar kelas"], ["tidak-relevan", "Tidak relevan"]]} onChange={(v) => patch((d) => { d.objekPengamatan = v; })} /></div></div>
            <label className="block"><span className="font-medium">JP per pertemuan</span><input className={field} type="number" min={1} value={s.jpPerPertemuan || ""} onChange={(e) => patch((d) => { d.jpPerPertemuan = Number(e.target.value); })} /></label>
          </div>

          {error && <p role="alert" className="mt-6 text-sm font-medium text-red-800">{error}</p>}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button disabled={busy || nErr > 0} onClick={() => save("siap")} className="rounded-lg bg-chalk px-5 py-3 font-semibold text-ink hover:brightness-95 disabled:opacity-50">Simpan sebagai siap</button>
            <button disabled={busy} onClick={() => save("draf")} className="rounded-lg border-2 border-ink px-5 py-3 font-semibold hover:bg-mist disabled:opacity-60">Simpan sebagai draf</button>
            {existing && (confirmDel
              ? <span className="flex items-center gap-3 text-sm">Hapus tangga ini? <button onClick={remove} className="font-semibold text-red-800 underline">Ya, hapus</button><button onClick={() => setConfirmDel(false)} className="underline">Batal</button></span>
              : <button onClick={() => setConfirmDel(true)} className="text-moss underline">Hapus tangga</button>)}
            {nErr > 0 && <p className="text-sm text-moss">Status siap terbuka setelah semua yang perlu diperbaiki selesai.</p>}
          </div>
        </div>

        <aside id="telaah-tangga" className="mt-14 min-w-0 min-[110rem]:sticky min-[110rem]:top-8 min-[110rem]:mt-0 min-[110rem]:max-h-[calc(100dvh-4rem)] min-[110rem]:self-start min-[110rem]:overflow-y-auto min-[110rem]:border-l-4 min-[110rem]:border-ink min-[110rem]:pl-8">
          <h3 className="font-display text-2xl font-semibold">Peta keputusan kelas {cls.name}</h3>
          <ul className="mt-3 space-y-2">
            {profile.map((r) => (
              <li key={r.key} className={`border-l-4 bg-white px-3 py-2 ${r.source === "guru" ? "border-ink" : "border-chalk"}`}>
                <p className="font-medium">{r.decision}</p>
                <p className="text-sm text-moss">({SOURCE_LABEL[r.source]})</p>
              </li>
            ))}
          </ul>
          <h3 className="mt-8 font-display text-2xl font-semibold">Telaah mutu</h3>
          <p className="text-moss">{nErr === 0 && nWarn === 0 ? "Semua pemeriksaan lolos." : `${nErr} perlu diperbaiki, ${nWarn} saran.`}</p>
          <ul className="mt-3 space-y-2">
            {issues.map((i, k) => (
              <li key={i.code + k} className={`border-l-4 bg-white px-3 py-2 ${LEVEL_STYLE[i.level]}`}>
                <span className="text-sm font-semibold">{LEVEL_LABEL[i.level]}</span><p>{i.message}</p>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
