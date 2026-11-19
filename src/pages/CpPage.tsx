import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import { FASE_LABEL, SUMBER_LABEL, loadCp, searchCp, type CpData, type CpElemen, type CpMapel, type FaseKey } from "../features/cp/data";

const COLS = { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3" } as const;
const FASES: FaseKey[] = ["A", "B", "C"];

function Elemen({ mapel, elemen, fase, showMapel }: { mapel: CpMapel; elemen: CpElemen; fase: FaseKey | "semua"; showMapel: boolean }) {
  const [copied, setCopied] = useState<string | null>(null);
  const shown = mapel.fase.filter((f) => fase === "semua" || f === fase);
  if (shown.length === 0) return null;
  async function copy(f: FaseKey) {
    try {
      await navigator.clipboard.writeText(elemen.cp[f] ?? "");
      setCopied(f);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  }
  return (
    <li className="border-b border-mist py-6">
      {showMapel && <p className="text-sm font-medium text-moss">{mapel.nama}</p>}
      <h3 className="font-display text-xl font-semibold">{elemen.nama}</h3>
      <div className={`mt-3 grid gap-x-8 gap-y-5 ${COLS[shown.length as 1 | 2 | 3]}`}>
        {shown.map((f) => (
          <div key={f} className="min-w-0">
            <p className="flex items-baseline justify-between gap-3 border-b-2 border-ink pb-1 text-sm font-semibold">
              <span>Fase {f}, {FASE_LABEL[f]}</span>
              <button onClick={() => copy(f)} className="font-medium text-moss underline">{copied === f ? "Tersalin" : "Salin"}</button>
            </p>
            <p className="mt-2 max-w-[65ch] leading-relaxed">{elemen.cp[f]}</p>
          </div>
        ))}
      </div>
    </li>
  );
}

export default function CpPage() {
  const [data, setData] = useState<CpData | null>(null);
  const [failed, setFailed] = useState(false);
  const [mapelId, setMapelId] = useState("ppkn");
  const [fase, setFase] = useState<FaseKey | "semua">("semua");
  const [query, setQuery] = useState("");

  useEffect(() => { loadCp().then(setData).catch(() => setFailed(true)); }, []);
  const hits = useMemo(() => (data && query.trim() ? searchCp(data, query) : null), [data, query]);
  const mapel = data?.mapel.find((m) => m.id === mapelId) ?? data?.mapel[0];

  const groups = (["km-2025", "ismuba-2024"] as const).map((s) => ({ s, list: data?.mapel.filter((m) => m.sumber === s) ?? [] }));

  return (
    <>
      <PageHeader title="Bank CP" description="Capaian pembelajaran per mata pelajaran, fase demi fase, supaya perkembangannya terbaca berdampingan." />
      {failed && <p role="alert" className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">Data CP tidak dapat dimuat. Muat ulang halaman.</p>}
      {!data && !failed && <p className="mt-10 text-moss">Memuat data CP…</p>}

      {data && mapel && (
        <div className="mt-8 xl:grid xl:grid-cols-[17rem_minmax(0,1fr)] xl:gap-10">
          <aside className="mb-8 xl:mb-0">
            {/* HP/tablet: pilihan dropdown. PC lebar: daftar tegak yang tetap terlihat saat menggulir. */}
            <label className="block xl:hidden">
              <span className="font-medium">Mata pelajaran</span>
              <select value={mapel.id} onChange={(e) => { setMapelId(e.target.value); setQuery(""); }} className="mt-1 block w-full rounded-md border-2 border-mist bg-white px-3 py-2.5 focus:border-ink">
                {groups.map((g) => (
                  <optgroup key={g.s} label={SUMBER_LABEL[g.s]}>
                    {g.list.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>
            <nav aria-label="Mata pelajaran" className="sticky top-8 hidden max-h-[calc(100dvh-4rem)] overflow-y-auto xl:block">
              {groups.map((g) => (
                <div key={g.s} className="mb-5">
                  <p className="mb-1 px-3 text-sm text-moss">{SUMBER_LABEL[g.s]}</p>
                  <ul>
                    {g.list.map((m) => (
                      <li key={m.id}>
                        <button
                          onClick={() => { setMapelId(m.id); setQuery(""); }}
                          aria-current={!hits && m.id === mapel.id ? "true" : undefined}
                          className={`block w-full border-l-4 px-3 py-2 text-left ${!hits && m.id === mapel.id ? "border-chalk bg-mist font-semibold" : "border-transparent hover:bg-mist/60"}`}
                        >
                          {m.nama}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>

          <section className="min-w-0">
            <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
              <label className="block min-w-[14rem] flex-1">
                <span className="font-medium">Cari di seluruh CP</span>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="mis. menyimak, simbol, pecahan" className="mt-1 block w-full rounded-md border-2 border-mist bg-white px-3 py-2.5 focus:border-ink" />
              </label>
              <div role="group" aria-label="Filter fase" className="flex flex-wrap gap-1">
                {(["semua", ...FASES] as const).map((f) => (
                  <button key={f} onClick={() => setFase(f)} aria-pressed={fase === f} className={`border-b-4 px-3 py-2 ${fase === f ? "border-chalk font-semibold" : "border-transparent text-moss"}`}>
                    {f === "semua" ? "Semua fase" : `Fase ${f}`}
                  </button>
                ))}
              </div>
            </div>

            {hits ? (
              <>
                <h2 className="mt-8 font-display text-2xl font-extrabold">{hits.length} elemen cocok</h2>
                {hits.length === 0 ? (
                  <div className="garis-buku mt-4 max-w-xl pb-3"><p>Tidak ada CP yang memuat kata itu.</p><p>Coba kata yang lebih umum.</p></div>
                ) : (
                  <ul>{hits.map((h) => <Elemen key={h.mapel.id + h.elemen.nama} mapel={h.mapel} elemen={h.elemen} fase={fase} showMapel />)}</ul>
                )}
              </>
            ) : (
              <>
                <div className="mt-8">
                  <h2 className="font-display text-3xl font-extrabold">{mapel.nama}</h2>
                  <p className="text-moss">
                    {SUMBER_LABEL[mapel.sumber]}, fase {mapel.fase.join(", ")}, {mapel.elemen.length} elemen
                    {mapel.fase.length === 1 ? ` (hanya Fase ${mapel.fase[0]})` : ""}
                  </p>
                </div>
                <ul>{mapel.elemen.map((e) => <Elemen key={e.nama} mapel={mapel} elemen={e} fase={fase} showMapel={false} />)}</ul>
              </>
            )}
            <p className="mt-8 max-w-[65ch] text-sm text-moss">Sumber: {data.sumber} Periksa kesesuaiannya dengan dokumen resmi sebelum dipakai untuk dokumen yang diserahkan.</p>
          </section>
        </div>
      )}
    </>
  );
}
