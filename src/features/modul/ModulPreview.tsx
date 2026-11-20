import type { ReactNode } from "react";
import { SOAL_LABEL, type ModulFields, type Soal } from "./model";

const Garis = ({ n = 3 }: { n?: number }) => <div className="garis-buku mt-1" style={{ height: `${n * 2.25}rem` }} aria-hidden="true" />;

function SoalBlok({ soal, mulai = 1 }: { soal: Soal[]; mulai?: number }) {
  return (
    <ol className="mt-3 space-y-5" start={mulai}>
      {soal.filter((s) => s.teks.trim()).map((s, i) => (
        <li key={i} className="break-inside-avoid">
          <p className="font-medium">{s.teks}</p>
          {s.opsi.trim() && <ul className="mt-1 ml-5 list-[lower-alpha]">{s.opsi.split("\n").filter(Boolean).map((o, j) => <li key={j}>{o.replace(/^[a-z][.)]\s*/i, "")}</li>)}</ul>}
          {(s.jenis === "uraian" || s.jenis === "penerapan") && <Garis n={3} />}
          {(s.jenis === "isian" || s.jenis === "bs") && <Garis n={1} />}
        </li>
      ))}
    </ol>
  );
}
const Judul = ({ children }: { children: ReactNode }) => <h2 className="mt-8 border-b-4 border-ink pb-1 font-display text-2xl font-extrabold">{children}</h2>;
const Kotak = ({ judul, children }: { judul: string; children: ReactNode }) => (
  <section className="mt-5 break-inside-avoid border-2 border-ink p-4"><h3 className="font-display text-lg font-bold">{judul}</h3>{children}</section>
);

/** Tampilan teks siswa untuk dibaca atau dicetak. Hanya memuat isi siswa; kunci jawaban opsional dan hanya untuk guru. */
export default function ModulPreview({ m, mapelNama, sekolah, showKunci, onToggleKunci, onBack }: { m: ModulFields; mapelNama: string; sekolah: string; showKunci: boolean; onToggleKunci: (v: boolean) => void; onBack: () => void }) {
  const fase = m.grade <= 2 ? "A" : m.grade <= 4 ? "B" : "C";
  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 print:hidden">
        <button onClick={onBack} className="text-moss underline">Kembali ke penyusunan</button>
        <button onClick={() => window.print()} className="rounded-lg bg-chalk px-5 py-3 font-semibold text-ink hover:brightness-95">Cetak atau simpan PDF</button>
        <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={showKunci} onChange={(e) => onToggleKunci(e.target.checked)} /><span>Sertakan kunci jawaban (halaman guru)</span></label>
      </div>
      <p className="mt-2 text-sm text-moss print:hidden">Gunakan menu cetak peramban lalu pilih "Simpan sebagai PDF". Hanya teks siswa yang tercetak.</p>

      <article className="mx-auto mt-6 max-w-[48rem] bg-white p-8 leading-relaxed print:mt-0 print:max-w-none print:p-0">
        <header className="break-after-page border-4 border-ink p-8 text-center">
          <p className="font-display text-lg">{mapelNama}</p>
          <h1 className="mt-6 font-display text-5xl font-extrabold">{m.judul || "(judul unit)"}</h1>
          <p className="mt-6 text-lg">Kelas {m.grade || "?"}, Fase {fase}</p>
          {sekolah && <p className="mt-2 text-lg">{sekolah}</p>}
          <p className="mt-16 text-left">Nama: <span className="inline-block w-2/3 border-b-2 border-ink align-bottom">&nbsp;</span></p>
        </header>

        <section className="break-after-page">
          <Judul>Pengantar</Judul>
          {[m.pengantar.salam, m.pengantar.tentang, m.pengantar.mengapa, m.pengantar.caraPakai].filter(Boolean).map((p, i) => <p key={i} className="mt-3">{p}</p>)}
          {m.pengantar.tujuan && <Kotak judul="Tujuan kita">{<p>{m.pengantar.tujuan}</p>}</Kotak>}
          {m.pengantar.produk && <Kotak judul="Karya yang akan kamu buat"><p>{m.pengantar.produk}</p></Kotak>}
        </section>

        <section className="break-after-page">
          <Judul>Yuk, Uji Kesiapan Belajarmu!</Judul>
          <SoalBlok soal={m.asesmenAwal.soal} />
          {m.asesmenAwal.motivasi && <p className="mt-6 italic">{m.asesmenAwal.motivasi}</p>}
        </section>

        {m.subunit.map((s, i) => (
          <section key={i} className="break-before-page">
            <Judul>{`Bagian ${i + 1}: ${s.judul}`}</Judul>
            {s.jembatan && i > 0 && <p className="mt-3 italic">{s.jembatan}</p>}
            <p className="mt-3">{s.orientasi}</p>
            <Kotak judul="Sebelum Kita Mulai">
              <ol className="ml-5 list-decimal space-y-3">{s.pemantik.filter(Boolean).map((q, j) => <li key={j}>{q}<Garis n={2} /></li>)}</ol>
            </Kotak>
            {s.bacaan.filter(Boolean).map((p, j) => <p key={j} className="mt-4">{p}</p>)}
            <Kotak judul={s.aktivitas.judul || "Yuk, Mencoba"}>
              <p>{s.aktivitas.tujuan}</p>
              <ol className="mt-2 ml-5 list-decimal">{s.aktivitas.langkah.filter(Boolean).map((l, j) => <li key={j}>{l}</li>)}</ol>
              <p className="mt-2 font-medium">{s.aktivitas.tugas}</p>
              <Garis n={4} />
            </Kotak>
            <h3 className="mt-6 font-display text-xl font-bold">Latihan</h3>
            <SoalBlok soal={s.formatif} />
            <Kotak judul="Refleksiku">
              <ol className="ml-5 list-decimal space-y-3">{s.refleksi.filter(Boolean).map((q, j) => <li key={j}>{q}<Garis n={2} /></li>)}</ol>
            </Kotak>
            {s.tugasRumah.trim() && <Kotak judul="Tugas di Rumah"><p>{s.tugasRumah}</p></Kotak>}
          </section>
        ))}

        <section className="break-before-page">
          <Judul>Latihan Akhir Unit</Judul>
          <SoalBlok soal={m.asesmenAkhir} />
          {m.produk.deskripsi && <Kotak judul={`Karyaku: ${m.produk.jenis}`}><p>{m.produk.deskripsi}</p><Garis n={6} /></Kotak>}
          {m.refleksiAkhir.some(Boolean) && <Kotak judul="Refleksi Akhir Unit"><ol className="ml-5 list-decimal space-y-3">{m.refleksiAkhir.filter(Boolean).map((q, j) => <li key={j}>{q}<Garis n={2} /></li>)}</ol></Kotak>}
          {m.glosarium.some((g) => g.istilah) && <Kotak judul="Glosarium"><dl>{m.glosarium.filter((g) => g.istilah).map((g, j) => <div key={j} className="mt-1"><dt className="inline font-bold">{g.istilah}</dt>: <dd className="inline">{g.arti}</dd></div>)}</dl></Kotak>}
        </section>

        {showKunci && (
          <section className="break-before-page">
            <Judul>Kunci Jawaban (khusus guru)</Judul>
            {([["Asesmen awal", m.asesmenAwal.soal], ...m.subunit.map((s, i) => [`Bagian ${i + 1}`, s.formatif] as const), ["Latihan akhir unit", m.asesmenAkhir]] as const).map(([nama, soal]) => (
              <div key={nama} className="mt-4"><h3 className="font-bold">{nama}</h3>
                <ol className="ml-5 list-decimal">{(soal as Soal[]).filter((s) => s.teks.trim()).map((s, i) => <li key={i}><span className="text-sm text-moss">({SOAL_LABEL[s.jenis]})</span> {s.kunci || "(belum ada kunci)"}</li>)}</ol></div>
            ))}
          </section>
        )}
      </article>
    </div>
  );
}
