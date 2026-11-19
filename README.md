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
