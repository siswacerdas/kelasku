import PageHeader from "../components/PageHeader";

/** Halaman sementara untuk rute yang belum dibangun. Dihapus satu per satu saat halaman aslinya jadi. */
export default function PlaceholderPage({
  title,
  description,
  akanBerisi,
}: {
  title: string;
  description: string;
  akanBerisi: string[];
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <section className="mt-10 max-w-3xl">
        <h2 className="font-display text-xl font-semibold">Yang akan ada di halaman ini</h2>
        <ul className="garis-buku mt-3 pl-1">
          {akanBerisi.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
