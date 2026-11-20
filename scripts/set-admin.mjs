// Memberi peran admin pada satu akun (custom claim). Dijalankan SEKALI oleh pemilik proyek di komputernya sendiri.
// Persiapan: npm i --no-save firebase-admin ; unduh kunci akun layanan (Firebase Console > Project settings > Service accounts),
// simpan di LUAR repo, lalu:  node scripts/set-admin.mjs C:\jalur\kunci.json <email>
// Setelah dijalankan, akun tersebut harus keluar lalu masuk lagi agar token baru terbaca.
import { readFileSync } from "node:fs";
import admin from "firebase-admin";

const [keyPath, email] = process.argv.slice(2);
if (!keyPath || !email) {
  console.error("Pemakaian: node scripts/set-admin.mjs <jalur-kunci.json> <email>");
  process.exit(1);
}
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync(keyPath, "utf8"))) });
const user = await admin.auth().getUserByEmail(email);
await admin.auth().setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), admin: true });
console.log(`Peran admin dipasang untuk ${email} (uid ${user.uid}). Keluar lalu masuk lagi di aplikasi.`);
