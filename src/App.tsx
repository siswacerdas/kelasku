import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./features/auth/AuthContext";
import AppShell from "./components/AppShell";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import KelasPage from "./pages/KelasPage";
import CpPage from "./pages/CpPage";
import TujuanPage from "./pages/TujuanPage";
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
            <Route path="perencanaan/rencana" element={ph("Rencana pembelajaran", "Rancangan pembelajaran untuk satu topik.", ["Identitas dan tujuan", "Pemahaman bermakna dan pertanyaan pemantik", "Pengalaman belajar"])} />
            <Route path="perencanaan/modul" element={ph("Modul ajar", "Disusun dari rencana pembelajaran.", ["Susunan otomatis dari rencana", "Ekspor ke Word dan PDF"])} />
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
