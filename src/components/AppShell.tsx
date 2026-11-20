import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { isActive, mobileTabs, navGroups } from "../app/nav";

/**
 * Kerangka semua halaman /app/*.
 * - PC (>= lg): sidebar tetap + area isi yang MENGISI sisa lebar (tidak ditengahkan sempit).
 * - HP (< lg): bar atas + menu bawah; area isi diberi ruang agar tidak tertutup menu bawah.
 */
export default function AppShell() {
  const { user, error, logout } = useAuth();
  const { pathname } = useLocation();
  const nama = user?.displayName ?? user?.email ?? "";

  return (
    <div className="min-h-dvh print:block lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] 2xl:grid-cols-[18rem_minmax(0,1fr)]">
      {/* Sidebar PC */}
      <aside className="sticky top-0 hidden h-dvh flex-col self-start bg-ink px-5 py-8 text-paper print:hidden lg:flex">
        <Link to="/app" className="font-display text-2xl font-extrabold text-chalk">
          Kelasku
        </Link>
        <nav aria-label="Menu utama" className="mt-10 flex-1 space-y-6 overflow-y-auto">
          {navGroups.map((g, gi) => (
            <div key={gi}>
              {g.title && <p className="mb-2 px-3 text-sm text-mist/70">{g.title}</p>}
              <ul className="space-y-1">
                {g.items.map((item) => {
                  const active = isActive(pathname, item);
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        aria-current={active ? "page" : undefined}
                        className={`block rounded-md border-l-4 px-3 py-2 transition-colors ${
                          active ? "border-chalk bg-white/10 font-semibold" : "border-transparent text-mist hover:bg-white/5"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-white/15 pt-4 text-sm">
          <p className="truncate text-mist">{nama}</p>
          <button onClick={logout} className="mt-2 font-medium text-chalk hover:underline">
            Keluar
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Bar atas HP */}
        <header className="flex items-center justify-between bg-ink px-4 py-3 text-paper print:hidden lg:hidden">
          <Link to="/app" className="font-display text-xl font-extrabold text-chalk">
            Kelasku
          </Link>
          {/* key={pathname}: menu menutup sendiri saat pindah halaman */}
          <details key={pathname} className="relative">
            <summary className="cursor-pointer list-none rounded-md px-3 py-1.5 text-sm font-medium hover:bg-white/10">
              Akun
            </summary>
            <div className="absolute right-0 z-30 mt-2 w-56 rounded-md bg-paper p-2 text-ink shadow-lg">
              <p className="truncate px-3 py-2 text-sm text-moss">{nama}</p>
              <Link to="/app/dokumen" className="block rounded px-3 py-2 hover:bg-mist">Dokumen</Link>
              <Link to="/app/pengaturan" className="block rounded px-3 py-2 hover:bg-mist">Pengaturan</Link>
              <button onClick={logout} className="block w-full rounded px-3 py-2 text-left font-medium hover:bg-mist">
                Keluar
              </button>
            </div>
          </details>
        </header>

        <main className="px-4 pb-28 pt-6 print:p-0 sm:px-8 lg:pb-12 lg:pt-10 xl:px-12 2xl:px-16">
          <div className="mx-auto w-full max-w-[110rem]">
            {error && (
              <p role="alert" className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </p>
            )}
            <Outlet />
          </div>
        </main>
      </div>

      {/* Menu bawah HP */}
      <nav
        aria-label="Menu utama"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-mist bg-paper pb-[env(safe-area-inset-bottom)] print:hidden lg:hidden"
      >
        <ul className="grid grid-cols-5">
          {mobileTabs.map((item) => {
            const active = isActive(pathname, item);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className={`block border-t-4 px-1 py-3 text-center text-xs ${
                    active ? "border-chalk font-bold text-ink" : "border-transparent text-moss"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
