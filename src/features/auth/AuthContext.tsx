import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { auth, db, googleProvider } from "../../lib/firebase";

type AuthState = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

/**
 * Login pertama: buat profil + ruang kerja pribadi (workspace) + keanggotaan owner.
 * ID workspace = uid guru, sehingga tidak perlu query untuk menemukannya.
 */
async function ensureWorkspace(user: User) {
  const userRef = doc(db, "users", user.uid);
  if ((await getDoc(userRef)).exists()) return;

  const batch = writeBatch(db);
  batch.set(userRef, {
    displayName: user.displayName ?? "",
    email: user.email ?? "",
    photoURL: user.photoURL ?? "",
    workspaceId: user.uid,
    createdAt: serverTimestamp(),
  });
  batch.set(doc(db, "workspaces", user.uid), {
    name: user.displayName ? `Ruang kerja ${user.displayName}` : "Ruang kerja saya",
    ownerId: user.uid,
    plan: "free",
    createdAt: serverTimestamp(),
  });
  batch.set(doc(db, "workspaces", user.uid, "members", user.uid), {
    role: "owner",
    createdAt: serverTimestamp(),
  });
  await batch.commit();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      try {
        if (u) {
          await ensureWorkspace(u);
          // Peran admin hanya berasal dari custom claim yang dipasang lewat Admin SDK (tidak bisa diubah klien).
          setIsAdmin((await u.getIdTokenResult()).claims.admin === true);
        } else setIsAdmin(false);
        setUser(u);
      } catch {
        setError("Akun berhasil masuk, tetapi ruang kerja belum dapat dibuat. Coba muat ulang halaman.");
        setUser(u);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch {
      setError("Masuk dengan Google dibatalkan atau gagal. Silakan coba lagi.");
    }
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, error, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}
