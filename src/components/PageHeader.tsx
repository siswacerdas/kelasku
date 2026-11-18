import type { ReactNode } from "react";

/** Kepala halaman seragam: garis tebal seperti kepala buku induk. Pakai di SETIAP halaman aplikasi. */
export default function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b-4 border-ink pb-5">
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl 2xl:text-5xl">{title}</h1>
        {description && <p className="mt-2 max-w-[65ch] text-lg text-moss">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </header>
  );
}
