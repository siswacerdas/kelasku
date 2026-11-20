// Pengaman DEV-1: memastikan setiap paket yang diimpor kode ada di package.json DAN terpasang di node_modules.
// Dijalankan otomatis sebelum dev, build, dan test, sehingga masalah dependensi terbaca jelas.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const declared = new Set([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

const used = new Set();
const re = /(?:\bfrom\s+|\bimport\s*\(\s*|\bimport\s+)["']([^"'./][^"']*)["']/g;
for (const f of walk(join(root, "src"))) {
  for (const m of readFileSync(f, "utf8").matchAll(re)) {
    const spec = m[1];
    if (spec.startsWith("node:")) continue;
    const parts = spec.split("/");
    used.add(spec.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0]);
  }
}

const notDeclared = [...used].filter((n) => !declared.has(n));
const notInstalled = [...declared].filter((n) => !existsSync(join(root, "node_modules", n, "package.json")));

if (notDeclared.length || notInstalled.length) {
  console.error("\n[Kelasku] Dependensi bermasalah, build/dev dihentikan.\n");
  if (notDeclared.length) console.error(`  Dipakai kode tetapi TIDAK ada di package.json: ${notDeclared.join(", ")}\n  -> berkas package.json Anda belum yang terbaru; timpa dari paket pembaruan terakhir.\n`);
  if (notInstalled.length) console.error(`  Ada di package.json tetapi BELUM terpasang: ${notInstalled.join(", ")}\n  -> jalankan:  npm install\n`);
  console.error("  Lihat docs/ANTI-REGRESI.md, kontrak DEV-1.\n");
  process.exit(1);
}
