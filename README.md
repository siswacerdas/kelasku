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

## Mengaktifkan AI untuk admin (Cloud Function)
Prasyarat: paket Firebase Blaze, peran admin sudah dipasang (lihat atas), dan **akun API Anthropic** di console.anthropic.com dengan saldo (terpisah dari langganan Claude.ai).
1. `npm i -g firebase-tools` lalu `firebase login`
2. `firebase functions:secrets:set ANTHROPIC_API_KEY` (tempel kunci API; kunci tidak disimpan di repo)
3. `cd functions && npm install && cd ..`
4. `firebase deploy --only functions` (otomatis membangun dahulu). Publikasikan juga `firestore.rules` bila belum.
5. Opsional ganti model: buat `functions/.env` berisi `ANTHROPIC_MODEL=claude-opus-5-5`, lalu deploy ulang. Bawaan: `claude-sonnet-5-5`.
6. Masuk sebagai admin, buka RPM > Pustaka, gunakan panel "Susun dengan AI".
Biaya: tiap pembuatan = 4 sampai 5 panggilan model dengan instruksi sistem sekitar 30 ribu token (di-cache). Pasang *budget alert* di Google Cloud dan Anthropic; batas harian per admin ada di `src/features/rpm-ai/config.ts`.
