import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./features/auth/AuthContext";
import AppShell from "./components/AppShell";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import KelasPage from "./pages/KelasPage";
import CpPage from "./pages/CpPage";
import TujuanPage from "./pages/TujuanPage";
import AlurPage from "./pages/AlurPage";
import TanggaPage from "./pages/TanggaPage";
import RpmPage from "./pages/RpmPage";
import ModulPage from "./pages/ModulPage";
import PengaturanPage from "./pages/PengaturanPage";

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-10 text-moss">Memuat…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

const ph = (title: string, description: string, akanBerisi: string[]) => (
  <PlaceholderPage title={title} description={description} akanBerisi={akanBerisi} />
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/app" element={<RequireAuth><AppShell /></RequireAuth>}>
            <Route index element={<DashboardPage />} />
            <Route path="kelas" element={<KelasPage />} />
            <Route path="perencanaan/cp" element={<CpPage />} />
            <Route path="perencanaan/tujuan" element={<TujuanPage />} />
            <Route path="perencanaan/alur" element={<AlurPage />} />
            <Route path="perencanaan/tangga" element={<TanggaPage />} />
            <Route path="perencanaan/rpm" element={<RpmPage />} />
            <Route path="perencanaan/rencana" element={<Navigate to="/app/perencanaan/rpm" replace />} />
            <Route path="perencanaan/modul" element={<ModulPage />} />
            <Route path="asesmen" element={ph("Asesmen", "Soal, rubrik, dan lembar observasi.", ["Instrumen terhubung ke tujuan pembelajaran"])} />
            <Route path="nilai" element={ph("Nilai", "Input dan rekap nilai siswa.", ["Input nilai per asesmen", "Rekap per tujuan pembelajaran"])} />
            <Route path="dokumen" element={ph("Dokumen", "Semua dokumen yang pernah dibuat.", ["Daftar dokumen dan statusnya", "Unduh ulang hasil ekspor"])} />
            <Route path="pengaturan" element={<PengaturanPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
