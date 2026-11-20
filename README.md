# Kelasku

Aplikasi administrasi guru (rencana pembelajaran, modul ajar, asesmen, rekap nilai) yang kelak berkembang menjadi LMS terbatas.

Stack: Vite + React + TypeScript + Tailwind, Firebase (Auth, Firestore, Storage), deploy ke Hostinger via GitHub Actions.

## Menjalankan lokal
> Setiap kali `package.json` berubah (lihat CHANGELOG), jalankan `npm install` lebih dulu, lalu commit `package-lock.json`. Sebelum push: `npm test` dan `npm run build`.

1. `npm install` (akan membuat `package-lock.json`, **commit file ini**)
2. Salin `.env.example` menjadi `.env`, isi `VITE_FIREBASE_API_KEY`
3. `npm run dev`

## Menyiapkan Firebase (sekali saja)
- Authentication > Sign-in method: aktifkan **Google**; tambahkan `kelasku.io` dan `www.kelasku.io` ke Authorized domains
- Firestore Database: buat database, lalu `npm i -g firebase-tools`, `firebase login`, `firebase deploy --only firestore:rules,storage`
- Google Cloud Console > Credentials: batasi API key ke `kelasku.io/*`, `*.kelasku.io/*`, `localhost`
- Billing: pasang budget alert

## Deploy ke Hostinger
Isi GitHub > Settings > Secrets and variables > Actions > Secrets:
`VITE_FIREBASE_*` (6 nilai dari `.env.example`), `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`, `FTP_DIR`.
Data FTP ada di hPanel > Files > FTP Accounts. `FTP_DIR` biasanya `/public_html/` (sesuaikan dengan folder awal akun FTP).
Setiap push ke `main` akan membangun dan mengunggah isi `dist/` otomatis.

## Peran admin (untuk mengelola Pustaka RPM)
Peran admin berupa *custom claim*, dipasang sekali oleh pemilik proyek:
1. `npm i --no-save firebase-admin`
2. Firebase Console > Project settings > Service accounts > Generate new private key; simpan berkasnya di LUAR folder repo (jangan di-commit).
3. `node scripts/set-admin.mjs C:\jalur\kunci.json emailanda@gmail.com`
4. Keluar lalu masuk lagi di aplikasi. Tab Pustaka akan berlabel "(admin)".

## Jika `npm run dev` atau `npm run build` menolak berjalan
Skrip `scripts/cek-deps.mjs` memeriksa dependensi dan menampilkan penyebabnya (paket belum terpasang atau `package.json` belum yang terbaru). Ikuti petunjuk pada pesannya.
