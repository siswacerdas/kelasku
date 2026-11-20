// Membundel fungsi beserta kode bersama dari ../src (validator, ceklis, perakit RPM) menjadi lib/index.js,
// sehingga Cloud Function memakai aturan mutu yang PERSIS sama dengan aplikasi.
import { build } from "esbuild";

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  outfile: "lib/index.js",
  sourcemap: true,
  loader: { ".md": "text" },
  external: ["firebase-admin", "firebase-admin/*", "firebase-functions", "firebase-functions/*", "@anthropic-ai/sdk"],
});
console.log("functions/lib/index.js dibangun");
