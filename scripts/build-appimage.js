```js
// Baut das Linux-AppImage: npm run build:appimage
// AppImages können NUR unter Linux gebaut werden.

const { spawnSync } = require("child_process");
const path = require("path");

if (process.platform === "win32" || process.platform === "darwin") {
  console.error(`
🥒 Das AppImage kann auf ${
    process.platform === "win32" ? "Windows" : "macOS"
  } nicht gebaut werden.

   Drei einfache Wege:
   1) Linux-PC oder Steam Deck:
      npm install && npm run build:appimage

   2) Windows mit WSL2 (Ubuntu):
      Projekt NACH ~ in WSL kopieren (nicht /mnt/c),
      dann wie bei 1)

   3) GitHub Actions:
      Projekt auf GitHub pushen und den Workflow starten.
      GitHub baut das AppImage automatisch.
`);

  process.exit(1);
}

const projectDir = path.resolve(__dirname, "..");

console.log("🥒 Gurke Client – AppImage Build");
console.log("📁 Projekt:", projectDir);
console.log("🐧 Plattform:", process.platform);
console.log("🏗️ Architektur: x64");
console.log("");

const r = spawnSync(
  "npx",
  [
    "electron-builder",
    "--linux",
    "AppImage",
    "--x64",
    "--publish=never"
  ],
  {
    cwd: projectDir,
    stdio: "inherit",
    shell: true,
  }
);

if (r.status === 0) {
  console.log("");
  console.log("✅ AppImage erfolgreich gebaut!");
  console.log("");
  console.log("📦 Datei:");
  console.log("   dist/Gurke-Client-*-linux-x86_64.AppImage");
  console.log("");
} else {
  console.error("");
  console.error("❌ AppImage-Build fehlgeschlagen.");
  console.error("");
}

process.exit(r.status ?? 1);
```
