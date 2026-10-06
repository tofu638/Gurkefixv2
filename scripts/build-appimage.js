// Baut das Linux-/SteamOS-AppImage:  npm run build:appimage   (oder: npm run build:steamos)
// AppImages können NUR unter Linux gebaut werden (die Werkzeuge sind Linux-Programme).
// Unter Windows startet dieses Skript den Build automatisch in WSL2, falls vorhanden.
const { spawnSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");

function guide(osName, reason) {
  console.error(`
🥒 Das AppImage kann auf ${osName} nicht direkt gebaut werden.${reason ? "\n   " + reason : ""}
   (Fehler wie "EPERM ... symlink" kommen genau daher.)

   Drei einfache Wege:
   1) Linux-PC oder Steam Deck:   npm install && npm run build:appimage
   2) Windows mit WSL2 (Ubuntu):  einmalig  wsl --install -d Ubuntu  (PowerShell als Admin, danach Neustart),
                                  dann in Ubuntu Node.js 22 installieren, danach hier wieder:  npm run build:appimage
   3) GitHub Actions:             Projekt auf GitHub pushen -> Actions -> "Build Gurke Client" -> Run workflow
                                  (baut .exe UND .AppImage automatisch, siehe README)
`);
  process.exit(1);
}

if (process.platform === "darwin") guide("macOS");

if (process.platform === "win32") {
  const probe = spawnSync("wsl.exe", ["-e", "bash", "-c", "echo gurke-ok"], { encoding: "utf8" });
  if (probe.error || probe.status !== 0 || !String(probe.stdout || "").includes("gurke-ok")) {
    guide("Windows", "WSL2 mit einer Linux-Distribution (z. B. Ubuntu) wurde nicht gefunden.");
  }
  console.log("🥒 Windows erkannt – baue das AppImage in WSL2 …");
  const r = spawnSync(
    "wsl.exe",
    ["--cd", root, "-e", "bash", "-c", "tr -d '\\r' < scripts/wsl-build.sh > /tmp/gurke-wsl-build.sh && bash /tmp/gurke-wsl-build.sh"],
    { stdio: "inherit" }
  );
  if (r.status === 0) console.log("\n✅ Fertig: dist\\Gurke-Client-*-linux-x86_64.AppImage");
  else console.error("\n❌ Build in WSL fehlgeschlagen (siehe Meldungen oben).");
  process.exit(r.status ?? 1);
}

const r = spawnSync("npx", ["electron-builder", "--linux", "AppImage", "--x64"], {
  cwd: root, stdio: "inherit", shell: true,
});
if (r.status === 0) console.log("\n✅ Fertig: dist/Gurke-Client-*-linux-x86_64.AppImage");
process.exit(r.status ?? 1);
