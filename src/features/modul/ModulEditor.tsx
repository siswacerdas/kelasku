import { useMemo, useState } from "react";
import { Seg, StringList, Txt, btn, field } from "../../components/Fields";
import type { CpData } from "../cp/data";
import { saveModul } from "./api";
import { saveModulLibrary } from "./api";
import ModulPreview from "./ModulPreview";
import SoalList from "./SoalList";
import {
  DIMENSI_NAMA, JENIS_PRODUK, ceklisStatus, countIssues, emptySubunit, lintModul, type AktivitasJenis, type FormatModul, type ModulFields,
} from "./model";

const LEVEL_STYLE = { error: "border-red-800", warn: "border-chalk", info: "border-mist" } as const;
const LEVEL_LABEL = { error: "Perlu diperbaiki", warn: "Saran", info: "Petunjuk" } as const;
const H2 = "mt-12 border-b-4 border-ink pb-2 font-display text-3xl font-extrabold";
const H3 = "mt-8 font-display text-xl font-semibold";
const AKTIVITAS: [AktivitasJenis, string][] = [["", "Belum ditentukan"], ["membaca", "Membaca"], ["menulis", "Menulis"], ["mengamati", "Mengamati"], ["berdiskusi", "Berdiskusi"], ["berhitung", "Berhitung"], ["berkarya", "Berkarya"]];

export default function ModulEditor({ ws, uid, mode, id, initial, cp, sekolah, islami, onClose }: {
  ws: string; uid: string; mode: "mine" | "library"; id: string | null; initial: ModulFields; cp: CpData | null; sekolah: string; islami: boolean; onClose: () => void;
}) {
  const [m, setM] = useState<ModulFields>(initial);
  const [si, setSi] = useState(0);
  const [preview, setPreview] = useState(false);
  const [kunci, setKunci] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const patch = (fn: (d: ModulFields) => void) => setM((o) => { const d = structuredClone(o); fn(d); return d; });

  const issues = useMemo(() => lintModul(m, { islami }), [m, islami]);
  const ceklis = useMemo(() => ceklisStatus(issues), [issues]);
  const { error: nErr, warn: nWarn } = countIssues(issues);
  const fase = m.grade >= 1 ? (m.grade <= 2 ? "A" : m.grade <= 4 ? "B" : "C") : null;
  const mapelOptions = cp?.mapel.filter((x) => !fase || x.fase.includes(fase)) ?? [];
  const mapelNama = cp?.mapel.find((x) => x.id === m.mapelId)?.nama ?? "";
  const idx = Math.min(si, m.subunit.length - 1);
  const s = m.subunit[idx];

  async function save(status: "draf" | "siap") {
    setBusy(true); setError(null);
    try {
      if (mode === "library") await saveModulLibrary(id, m, status === "siap" ? "terbit" : "draf", uid);
      else await saveModul(ws, id, m, status);
      onClose();
    } catch { setError("Modul belum tersimpan. Periksa koneksi dan hak akses, lalu coba lagi."); setBusy(false); }
  }

  if (preview) return <ModulPreview m={m} mapelNama={mapelNama} sekolah={sekolah} showKunci={kunci} onToggleKunci={setKunci} onBack={() => setPreview(false)} />;

  return (
    <div>
      <button onClick={onClose} className="text-moss underline">Kembali</button>
      <header className="mt-3 border-b-4 border-ink pb-4">
        <p className="text-sm font-medium text-moss">{mode === "library" ? "Pustaka modul (admin)" : "Modul saya"}</p>
        <h2 className="mt-1 font-display text-3xl font-extrabold">{m.judul || "Modul baru"}</h2>
        <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-moss">
          <span>Telaah: {nErr} perlu diperbaiki, {nWarn} saran. <a href="#ceklis-modul" className="underline min-[110rem]:hidden">Lihat ceklis mutu</a></span>
          <button onClick={() => setPreview(true)} className={btn}>Pratinjau cetak</button>
        </p>
      </header>

      <div className="mt-6 gap-12 min-[110rem]:grid min-[110rem]:grid-cols-[minmax(0,1fr)_30rem]">
        <div className="min-w-0">
          <h2 className={H2}>Identitas unit</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <label className="block"><span className="font-medium">Kelas</span>
              <select className={field} value={m.grade} onChange={(e) => patch((d) => { d.grade = Number(e.target.value); })}><option value={0}>Pilih kelas</option>{[1, 2, 3, 4, 5, 6].map((g) => <option key={g} value={g}>Kelas {g}</option>)}</select></label>
            <label className="block"><span className="font-medium">Mata pelajaran</span>
              <select className={field} value={m.mapelId} onChange={(e) => patch((d) => { d.mapelId = e.target.value; })}><option value="">Pilih mata pelajaran</option>{mapelOptions.map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}</select></label>
            <label className="block"><span className="font-medium">Semester</span>
              <select className={field} value={m.semester} onChange={(e) => patch((d) => { d.semester = Number(e.target.value) as 0 | 1 | 2; })}><option value={0}>Belum ditentukan</option><option value={1}>Semester 1</option><option value={2}>Semester 2</option></select></label>
            <label className="block sm:col-span-2"><span className="font-medium">Judul unit (untuk siswa)</span><input className={field} value={m.judul} onChange={(e) => patch((d) => { d.judul = e.target.value; })} /></label>
            <div className="sm:col-span-2 xl:col-span-3"><span className="font-medium">Format penyajian</span><div className="mt-1">
              <Seg<FormatModul> name="format" value={m.format} options={[["cetak", "Cetak"], ["digital", "Digital"], ["keduanya", "Keduanya"]]} onChange={(v) => patch((d) => { d.format = v; })} /></div></div>
            <label className="block"><span className="font-medium">Jumlah tangga scaffolding yang dirujuk</span><span className="block text-sm text-moss">0 bila tidak ditautkan. Jumlah subunit mengikuti tangga.</span>
              <input className={field} type="number" min={0} value={m.jumlahTangga} onChange={(e) => patch((d) => { d.jumlahTangga = Number(e.target.value); })} /></label>
            <Txt label="Elemen PAK dari RPM (catatan guru, tidak tampil ke siswa)" rows={2} hint="Kosongkan bila tidak ada kaitan alami." value={m.elemenPak} onChange={(v) => patch((d) => { d.elemenPak = v; })} />
          </div>

          <h3 className={H3}>Dimensi Profil Lulusan yang difokuskan (2 sampai 4)</h3>
          <p className="text-moss">Tulis wujudnya sebagai tugas atau aktivitas konkret, bukan sekadar label.</p>
          <ul className="mt-2">
            {m.dimensiFokus.map((d, i) => (
              <li key={i} className="grid gap-3 border-b border-mist py-3 md:grid-cols-[16rem_minmax(0,1fr)_auto]">
                <select aria-label={`Dimensi ${i + 1}`} className={`${field} mt-0`} value={d.nama} onChange={(e) => patch((x) => { x.dimensiFokus[i].nama = e.target.value; })}><option value="">Pilih dimensi</option>{DIMENSI_NAMA.map((n) => <option key={n}>{n}</option>)}</select>
                <input aria-label={`Wujud dimensi ${i + 1}`} className={`${field} mt-0`} value={d.wujud} onChange={(e) => patch((x) => { x.dimensiFokus[i].wujud = e.target.value; })} placeholder="Tugas atau aktivitas konkretnya" />
                <button onClick={() => patch((x) => { x.dimensiFokus.splice(i, 1); })} className="text-moss underline">Hapus</button>
              </li>
            ))}
          </ul>
          {m.dimensiFokus.length < 4 && <button onClick={() => patch((d) => { d.dimensiFokus.push({ nama: "", wujud: "" }); })} className={`${btn} mt-3`}>Tambah dimensi</button>}

          <h2 className={H2}>Pengantar</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Txt label="Salam dan sapaan hangat" rows={2} value={m.pengantar.salam} onChange={(v) => patch((d) => { d.pengantar.salam = v; })} />
            <Txt label="Unit ini membahas apa" rows={2} value={m.pengantar.tentang} onChange={(v) => patch((d) => { d.pengantar.tentang = v; })} />
            <Txt label="Mengapa topik ini penting" rows={2} value={m.pengantar.mengapa} onChange={(v) => patch((d) => { d.pengantar.mengapa = v; })} />
            <Txt label="Cara menggunakan modul" rows={2} value={m.pengantar.caraPakai} onChange={(v) => patch((d) => { d.pengantar.caraPakai = v; })} />
            <Txt label="Tujuan unit dalam bahasa siswa" rows={2} value={m.pengantar.tujuan} onChange={(v) => patch((d) => { d.pengantar.tujuan = v; })} />
            <Txt label="Produk Belajar yang diumumkan" rows={2} hint='Mis. "Di akhir unit ini, kamu akan membuat ..."' value={m.pengantar.produk} onChange={(v) => patch((d) => { d.pengantar.produk = v; })} />
          </div>

          <h2 className={H2}>Asesmen awal unit</h2>
          <p className="mt-3 text-moss">Diagnostik, bukan pemantik diskusi: 4 sampai 8 soal atau tugas dengan jawaban benar atau salah.</p>
          <div className="mt-3"><SoalList label="Soal asesmen awal" soal={m.asesmenAwal.soal} onChange={(x) => patch((d) => { d.asesmenAwal.soal = x; })} /></div>
          <div className="mt-4"><Txt label="Paragraf motivasi penutup" rows={2} value={m.asesmenAwal.motivasi} onChange={(v) => patch((d) => { d.asesmenAwal.motivasi = v; })} /></div>

          <h2 className={H2}>Rangkaian subunit</h2>
          <div role="tablist" aria-label="Subunit" className="mt-3 flex flex-wrap items-center gap-1 border-b border-mist">
            {m.subunit.map((x, i) => <button key={i} role="tab" aria-selected={i === idx} onClick={() => setSi(i)} className={`border-b-4 px-3 py-2 ${i === idx ? "border-chalk font-semibold" : "border-transparent text-moss"}`}>Bagian {i + 1}{x.judul ? `: ${x.judul.slice(0, 18)}` : ""}</button>)}
            <button onClick={() => { patch((d) => { d.subunit.push(emptySubunit()); }); setSi(m.subunit.length); }} className="px-3 py-2 underline">Tambah subunit</button>
          </div>

          {s && (
            <div className="mt-5 space-y-6">
              <p className="text-sm text-moss">{idx === 0 ? "Subunit pertama: Materi Pintu Masuk. Lebih sederhana, toleran terhadap ketidaksempurnaan, KKO sama, dan fondasi langsung berguna." : idx === m.subunit.length - 1 ? "Subunit akhir: penerapan atau karya; selesaikan Produk Belajar." : "Subunit tengah: hubungan, penalaran, dan mulai Produk Belajar."}</p>
              <label className="block"><span className="font-medium">Judul subunit</span><input className={field} value={s.judul} onChange={(e) => patch((d) => { d.subunit[idx].judul = e.target.value; })} /></label>
              {idx > 0 && <Txt label="Kalimat jembatan dari subunit sebelumnya" rows={2} value={s.jembatan} onChange={(v) => patch((d) => { d.subunit[idx].jembatan = v; })} />}
              <Txt label="Orientasi" rows={2} hint='Narasi singkat: "Di bagian ini kamu akan belajar ... Ini bermanfaat agar kamu dapat ...". Pertanyaan ditulis di pemantik, bukan di sini.' value={s.orientasi} onChange={(v) => patch((d) => { d.subunit[idx].orientasi = v; })} />
              <StringList label="Pemantik pengalaman (kotak tersendiri)" hint="1 sampai 3 pertanyaan konkret yang dijawab sebelum membaca." items={s.pemantik} onChange={(v) => patch((d) => { d.subunit[idx].pemantik = v; })} addLabel="Tambah pertanyaan" />
              <StringList label="Bacaan utama (paragraf)" hint={fase ? `2 sampai 6 paragraf; Fase ${fase}: ${fase === "A" ? "2 sampai 3" : fase === "B" ? "3 sampai 4" : "4 sampai 6"} kalimat per paragraf.` : "2 sampai 6 paragraf."} items={s.bacaan} rows={5} onChange={(v) => patch((d) => { d.subunit[idx].bacaan = v; })} addLabel="Tambah paragraf" />

              <fieldset className="border-l-4 border-mist pl-4">
                <legend className="font-medium">Aktivitas inti siswa</legend>
                <div className="mt-2 grid gap-4 md:grid-cols-2">
                  <label className="block"><span className="font-medium">Jenis aktivitas utama</span>
                    <select className={field} value={s.aktivitas.jenis} onChange={(e) => patch((d) => { d.subunit[idx].aktivitas.jenis = e.target.value as AktivitasJenis; })}>{AKTIVITAS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>
                  <label className="block"><span className="font-medium">Judul ramah</span><input className={field} placeholder="Yuk, Mengamati" value={s.aktivitas.judul} onChange={(e) => patch((d) => { d.subunit[idx].aktivitas.judul = e.target.value; })} /></label>
                  <Txt label="Tujuan (1-2 kalimat)" rows={2} value={s.aktivitas.tujuan} onChange={(v) => patch((d) => { d.subunit[idx].aktivitas.tujuan = v; })} />
                  <Txt label="Tugas yang jelas" rows={2} value={s.aktivitas.tugas} onChange={(v) => patch((d) => { d.subunit[idx].aktivitas.tugas = v; })} />
                </div>
                <div className="mt-4"><StringList label="Langkah terurut" items={s.aktivitas.langkah} onChange={(v) => patch((d) => { d.subunit[idx].aktivitas.langkah = v; })} addLabel="Tambah langkah" /></div>
                <label className="mt-4 flex cursor-pointer items-center gap-2"><input type="checkbox" checked={s.aktivitas.interaktif} onChange={(e) => patch((d) => { d.subunit[idx].aktivitas.interaktif = e.target.checked; })} /><span>Memakai elemen interaktif digital</span></label>
                {s.aktivitas.interaktif && <div className="mt-3"><Txt label="Padanan cetak" rows={2} hint="Mis. drag-and-drop menjadi tabel isian atau gunting-tempel kartu kata." value={s.aktivitas.padananCetak} onChange={(v) => patch((d) => { d.subunit[idx].aktivitas.padananCetak = v; })} /></div>}
              </fieldset>

              <SoalList label="Latihan formatif (3 sampai 8 soal: maks 50% PG/benar-salah, min 1 uraian, min 1 penerapan)" soal={s.formatif} onChange={(v) => patch((d) => { d.subunit[idx].formatif = v; })} />
              <StringList label="Refleksi pribadi (wajib, 2 sampai 3 pertanyaan)" items={s.refleksi} onChange={(v) => patch((d) => { d.subunit[idx].refleksi = v; })} addLabel="Tambah pertanyaan" min={2} />
              <Txt label="Tugas rumah (opsional)" rows={2} hint={idx === 0 ? "Subunit pertama boleh tanpa tugas rumah." : fase === "A" ? "Fase A: sangat sederhana, tidak butuh bantuan orang tua intensif." : undefined} value={s.tugasRumah} onChange={(v) => patch((d) => { d.subunit[idx].tugasRumah = v; })} />
              <div className="grid gap-4 md:grid-cols-2">
                {islami && <StringList label="Titik integrasi nilai Islami (catatan, 1 sampai 2)" items={s.nilaiIslami.length ? s.nilaiIslami : [""]} onChange={(v) => patch((d) => { d.subunit[idx].nilaiIslami = v; })} min={1} rows={2} addLabel="Tambah titik" />}
                <Txt label="Catatan PAK di subunit ini (hanya bila Elemen PAK terisi)" rows={3} hint="Di mana nilainya muncul sebagai cerita atau aktivitas. Tidak tampil ke siswa." value={s.pakWujud} onChange={(v) => patch((d) => { d.subunit[idx].pakWujud = v; })} />
              </div>
              {m.subunit.length > 1 && <button onClick={() => { patch((d) => { d.subunit.splice(idx, 1); }); setSi(0); }} className="text-moss underline">Hapus subunit ini</button>}
            </div>
          )}

          <h2 className={H2}>Akhir unit</h2>
          <div className="mt-4"><SoalList label="Latihan akhir unit (wajib minimal 1 soal terbuka atau karya)" soal={m.asesmenAkhir} onChange={(x) => patch((d) => { d.asesmenAkhir = x; })} /></div>
          <h3 className={H3}>Produk belajar unit</h3>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <label className="block"><span className="font-medium">Jenis produk</span>
              <input className={field} list="jenis-produk" value={m.produk.jenis} onChange={(e) => patch((d) => { d.produk.jenis = e.target.value; })} /><datalist id="jenis-produk">{JENIS_PRODUK.map((j) => <option key={j} value={j} />)}</datalist></label>
            <label className="block"><span className="font-medium">Mulai dikerjakan di subunit ke-</span><input className={field} type="number" min={1} max={m.subunit.length} value={m.produk.mulaiSubunit} onChange={(e) => patch((d) => { d.produk.mulaiSubunit = Number(e.target.value); })} /></label>
            <div className="md:col-span-2"><Txt label="Deskripsi karya untuk siswa" rows={3} value={m.produk.deskripsi} onChange={(v) => patch((d) => { d.produk.deskripsi = v; })} /></div>
          </div>
          <div className="mt-6"><StringList label="Refleksi akhir unit (3 sampai 5 pertanyaan)" items={m.refleksiAkhir} onChange={(v) => patch((d) => { d.refleksiAkhir = v; })} addLabel="Tambah pertanyaan" min={3} /></div>
          <h3 className={H3}>Glosarium (opsional)</h3>
          <ul className="mt-2">
            {m.glosarium.map((g, i) => (
              <li key={i} className="grid gap-3 border-b border-mist py-2 md:grid-cols-[14rem_minmax(0,1fr)_auto]">
                <input aria-label={`Istilah ${i + 1}`} className={`${field} mt-0`} value={g.istilah} onChange={(e) => patch((d) => { d.glosarium[i].istilah = e.target.value; })} placeholder="Istilah" />
                <input aria-label={`Arti ${i + 1}`} className={`${field} mt-0`} value={g.arti} onChange={(e) => patch((d) => { d.glosarium[i].arti = e.target.value; })} placeholder="Penjelasan sederhana" />
                <button onClick={() => patch((d) => { d.glosarium.splice(i, 1); })} className="text-moss underline">Hapus</button>
              </li>
            ))}
          </ul>
          <button onClick={() => patch((d) => { d.glosarium.push({ istilah: "", arti: "" }); })} className={`${btn} mt-3`}>Tambah istilah</button>

          <h2 className={H2}>Audit mandiri</h2>
          <p className="mt-3 text-moss">Kriteria Materi Pintu Masuk untuk subunit pertama. Centang setelah Anda benar-benar memeriksanya.</p>
          <ul className="mt-2 space-y-3">
            {([["sederhana", "Lebih pendek dan sederhana strukturnya; tidak menuntut kompleksitas materi puncak"], ["toleran", "Toleran terhadap ketidaksempurnaan: siswa bisa berhasil meski belum sempurna"], ["kkoSama", "Tetap relevan dengan KKO yang sama, bukan kompetensi berbeda"], ["fondasi", "Membangun fondasi yang langsung berguna untuk subunit puncak, bukan pemanasan terpisah"]] as const).map(([k, t]) => (
              <li key={k}><label className="flex cursor-pointer gap-3"><input type="checkbox" className="mt-1.5" checked={m.pintuMasuk[k]} onChange={(e) => patch((d) => { d.pintuMasuk[k] = e.target.checked; })} /><span>{t}</span></label></li>
            ))}
          </ul>

          {error && <p role="alert" className="mt-6 text-sm font-medium text-red-800">{error}</p>}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button disabled={busy || nErr > 0} onClick={() => save("siap")} className="rounded-lg bg-chalk px-5 py-3 font-semibold text-ink hover:brightness-95 disabled:opacity-50">{mode === "library" ? "Terbitkan ke pustaka" : "Simpan sebagai siap"}</button>
            <button disabled={busy} onClick={() => save("draf")} className="rounded-lg border-2 border-ink px-5 py-3 font-semibold hover:bg-mist disabled:opacity-60">Simpan sebagai draf</button>
            {nErr > 0 && <p className="text-sm text-moss">Status siap terbuka setelah semua yang perlu diperbaiki selesai.</p>}
          </div>
        </div>

        <aside id="ceklis-modul" className="mt-14 min-w-0 min-[110rem]:sticky min-[110rem]:top-8 min-[110rem]:mt-0 min-[110rem]:max-h-[calc(100dvh-4rem)] min-[110rem]:self-start min-[110rem]:overflow-y-auto min-[110rem]:border-l-4 min-[110rem]:border-ink min-[110rem]:pl-8">
          <h3 className="font-display text-2xl font-semibold">Ceklis mutu modul</h3>
          <p className="text-moss">{ceklis.filter((c) => c.status === "lolos").length} dari {ceklis.length} butir lolos.</p>
          <ul className="mt-3">
            {ceklis.map((c) => (
              <li key={c.code} className="flex gap-3 border-b border-mist py-2">
                <span className={`w-14 shrink-0 text-sm font-semibold ${c.status === "perlu" ? "text-red-800" : ""}`}>{c.status === "lolos" ? "Lolos" : "Perlu"}</span>
                <span><span className="text-sm text-moss">{c.code}</span> {c.kriteria}</span>
              </li>
            ))}
          </ul>
          <h3 className="mt-8 font-display text-2xl font-semibold">Temuan</h3>
          <ul className="mt-3 space-y-2">
            {issues.map((i, k) => <li key={i.code + k} className={`border-l-4 bg-white px-3 py-2 ${LEVEL_STYLE[i.level]}`}><span className="text-sm font-semibold">{LEVEL_LABEL[i.level]} ({i.code})</span><p>{i.message}</p></li>)}
          </ul>
        </aside>
      </div>
    </div>
  );
}
