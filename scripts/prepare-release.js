// Bereitet die gebauten Dateien für die Cloudflare-Pages-Seite vor:
//   node scripts/prepare-release.js <win.exe> <linux.AppImage> <site-ordner>
// Zerlegt jede Datei in 20-MiB-Teile (Cloudflare Pages erlaubt max. 25 MiB pro Datei)
// und schreibt <site-ordner>/downloads.json – die Webseite liest Version, Teile und Größe von dort.
const fs = require("fs"), path = require("path");
const [win, linux, site] = process.argv.slice(2);
if (!win || !linux || !site) { console.error("Aufruf: node scripts/prepare-release.js <win.exe> <linux.AppImage> <site-ordner>"); process.exit(1); }
const PART = 20 * 1024 * 1024;
const version = (path.basename(win).match(/(\d+)[._](\d+)[._](\d+)/) || []).slice(1, 4).join(".") || require("../package.json").version;
function split(file, sub) {
  const dir = path.join(site, "downloads", sub); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const name = path.basename(file), size = fs.statSync(file).size, fd = fs.openSync(file, "r"); let parts = 0;
  for (let off = 0; off < size; off += PART, parts++) {
    const len = Math.min(PART, size - off), buf = Buffer.alloc(len); fs.readSync(fd, buf, 0, len, off);
    fs.writeFileSync(path.join(dir, `${name}.part${String(parts).padStart(3, "0")}`), buf);
  }
  fs.closeSync(fd); return { dir: `downloads/${sub}/`, name, parts, size };
}
const manifest = { version, windows: split(win, "windows"), linux: split(linux, "linux") };
fs.writeFileSync(path.join(site, "downloads.json"), JSON.stringify(manifest, null, 2));
console.log("Fertig:", JSON.stringify(manifest, null, 2));
