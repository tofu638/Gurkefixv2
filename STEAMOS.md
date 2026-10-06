# SteamOS / Steam Deck quick guide

## Build on a Linux machine

```bash
git clone <your-repo>
cd gurke-client-electron
npm install
npm run build:steamdeck
```

The result is an x86_64 AppImage.

## Build directly on a Steam Deck

Switch to Desktop Mode, open Konsole, install Node.js/npm using your preferred supported method, then:

```bash
npm install
npm run build:steamdeck
```

Run:

```bash
chmod +x dist/Gurke-Client-*.AppImage
./dist/Gurke-Client-*.AppImage
```

If FUSE/runtime restrictions prevent starting it:

```bash
./dist/Gurke-Client-*.AppImage --appimage-extract-and-run
```

After testing in Desktop Mode, add the AppImage to Steam as a Non-Steam Game so it is available in Gaming Mode.

## Do not package SteamOS as a .deb

SteamOS is Arch-based. The portable AppImage is the intended first distribution format here, avoiding Debian-specific packaging.

## Java

SteamOS hat standardmäßig kein Java, und das Systemlaufwerk ist schreibgeschützt. Der Client lädt deshalb beim ersten Start einer Minecraft-Version automatisch die passende Java-Runtime (Eclipse Temurin JRE 8/17/21, SHA-256-geprüft) nach `~/.config/gurke-client/runtime/` herunter. Kein Root, kein pacman nötig. Ein eigener Java-Pfad in den Einstellungen wird weiterhin respektiert.

## Build von Windows aus

`npm run build:steamos` (oder `build:appimage`) baut automatisch in WSL2. Voraussetzung: WSL mit Ubuntu und Node.js 18+ (empfohlen 22) darin.
