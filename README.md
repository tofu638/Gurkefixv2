# Gurke Client 1.1 — Windows + SteamOS (.exe + .deb)

Gurke Client is an Electron Minecraft Java launcher. The application uses one codebase for Windows and Linux/SteamOS, with the requested release formats:

- **Windows:** `.exe` NSIS installer
- **Linux / SteamOS:** `.deb` package for x86_64

> You are developing on Windows. You do **not** need SteamOS to work on the source code, but you need a Linux/WSL build environment to produce and test the Linux package reliably.

## 🐧 Linux AppImage bauen (v1.6)

**Wichtig:** Ein AppImage lässt sich nur unter Linux bauen. Auf Windows kommt der Fehler `EPERM ... symlink`.

```bash
npm install
npm run build:appimage      # -> dist/Gurke-Client-<version>-linux-x86_64.AppImage
```

Kein Linux-PC? Zwei Wege von Windows aus:
- **WSL2:** `wsl --install -d Ubuntu`, Projekt nach `~` in Ubuntu kopieren (nicht `/mnt/c`), Node 22 installieren, dann die zwei Befehle oben.
- **GitHub Actions:** Projekt auf GitHub pushen, dann *Actions → Build Gurke Client → Run workflow*. Die fertigen `.exe` und `.AppImage` liegen danach als *Artifacts* zum Download bereit (`.github/workflows/build.yml`).

## Features (1.2.0)

**Spielen**
- Microsoft-Login (Token wird verschlüsselt gespeichert, wenn das System es erlaubt)
- **Instanzen:** beliebig viele getrennte Profile, jede mit eigenen Welten, Mods, Screenshots und Einstellungen
- **Neue Instanz per Dialog:** Name, Loader (Vanilla / Fabric / Forge) und Minecraft-Version in einem Schritt
- **Fabric und Forge:** pro Instanz umschaltbar und wird beim ersten Start automatisch installiert (offline wird die zuletzt installierte Version genutzt). Forge gibt es im Launcher ab Minecraft 1.13; der Installer wird von maven.minecraftforge.net geladen und per SHA-1 geprüft
- Release- und Snapshot-Auswahl, Spielzeit pro Instanz, Direktzugriff auf Mods-/Welten-/Screenshot-Ordner

**Oberfläche:** Seitenleiste, Quick-Play-Leiste mit deinen Servern, großer Start-Button mit Dropdown für Instanz und Version, einheitliche Dropdowns überall.

**Mods**
- **Mod-Browser mit Modrinth und CurseForge** in einem Tab: Suche passend zu Minecraft-Version und Fabric, Kategorien, Sortierung, Installation mit einem Klick
- CurseForge braucht einen kostenlosen API-Schlüssel (https://console.curseforge.com/), der im Launcher einmal eingefügt wird und verschlüsselt gespeichert wird, wenn das System es erlaubt
- Jede Datei wird gegen die Prüfsumme der Plattform geprüft (SHA-512 bei Modrinth, SHA-1 bei CurseForge)
- Benötigte Abhängigkeiten (z. B. Fabric API) werden mitinstalliert
- Falsche Dateien werden verworfen
- **Installieren und Deinstallieren** direkt in den Suchergebnissen: Der Knopf wechselt zwischen „Installieren“ und „Deinstallieren“. Mitinstallierte Abhängigkeiten bleiben erhalten, weil andere Mods sie brauchen können
- Mods an-/ausschalten und löschen, ohne den Ordner zu öffnen

**Server**
- Live-Status mit Spielerzahl, Icon und MOTD für bettervanilla.net, donutsmp.net, pvphg.com, mcpvp.com und mcpvp.club, dazu eigene Server
- **„Beitreten“** startet Minecraft und verbindet direkt (Quick Play ab 1.20, davor `--server`/`--port`)

**Leistung & Komfort**
- Leistungs-Profile für JVM-Argumente (Ausgewogen / Aikar), RAM-Regler, eigene JVM- und Spielargumente
- Java-Erkennung und Auswahl für Java 8 / 17 / 21, eigene Java-Pfade
- Update-Hinweis (Prüfung über GitHub, Link zu https://gurke.bettervanilla.net), fünf Farbthemen
- Windows `.exe`-Installer, Linux/SteamOS `.deb` und AppImage

> Die Netzwerklogik (Fabric, Modrinth, Server-Status, Updates) liegt in `lib/net.js` und ist mit `npm test` ohne Internet testbar. Die Oberfläche selbst wurde noch nicht in Electron gestartet – bitte vor dem Release einmal mit `npm start` durchklicken.

## Minecraft-Fenster: „Gurke Client <Version>“ und Logo

- Titelbild und F3-Bildschirm zeigen über `--versionType` den Namen „Gurke Client“ (z. B. „Minecraft 1.20.1/Gurke Client“).
- Fenstertitel „Gurke Client 1.20.1“ und das Gurken-Icon setzt `lib/brand.js` von außen (Best-Effort, noch ungetestet): unter Windows per PowerShell, unter Linux/X11 mit `xdotool` und `xprop` (müssen installiert sein). Minecraft erlaubt das von Haus aus nicht, deshalb kann der Titel in seltenen Fällen kurz zurückspringen. Auf Wayland/Gamescope (Steam Deck im Spielmodus) greift es nicht. Ein vollständig zuverlässiger Weg wäre ein kleines Fabric-/Forge-Mod, das Titel und Icon im Spiel setzt.

## Webseite aktualisieren

Nach dem Bauen die Dateien für Cloudflare Pages zerlegen und `downloads.json` erzeugen:

```bash
node scripts/prepare-release.js dist/Gurke-Client-1.2.0-win-x64.exe dist/Gurke-Client-1.2.0-linux-x86_64.AppImage ../gurke-site
```

Danach den Ordner `gurke-site` auf Cloudflare Pages hochladen (Domain: gurke.bettervanilla.net).

## Requirements

Node.js 18+ is recommended.

Minecraft Java requires a suitable Java runtime:
- Minecraft 1.20.5+ → Java 21
- Minecraft 1.17–1.20.4 → Java 17
- Older Minecraft versions → Java 8

## Development on Windows

Open PowerShell in the project folder:

```powershell
npm install
npm start
```

This runs the launcher locally on Windows.

## Build the Windows `.exe`

```powershell
npm run build:win
```

This creates an NSIS installer in `dist/`.

For a versioned build attempt:

```powershell
npm run build:versioned -- win
```

The first attempt goes into `dist/v1/`. If it fails, the next attempt is `dist/v2/`, then `v3`, and so on. The counter prevents attempts from overwriting one another; it does not magically repair an underlying build error.

### Optional Windows portable `.exe`

If you also want a portable executable:

```powershell
npm run build:win:portable
```

The main release target remains the normal NSIS `.exe` installer.

## Build the Linux `.deb`

The requested Linux release format is a **Debian package (`.deb`)** for x86_64.

**Important for SteamOS:** SteamOS itself is Arch-based, not Debian-based, so a `.deb` is not the native SteamOS package format and cannot normally be installed directly with `pacman`. I keep the `.deb` because that is the format you requested, and the project also includes an optional AppImage target for actually running Gurke directly on SteamOS.

Because you are developing on Windows, the recommended approach is **WSL2 with Ubuntu** or another Linux build environment.

Inside WSL:

```bash
cd /mnt/c/path/to/gurke-client-electron
npm install
npm run build:linux
```

This produces an x86_64 `.deb` package.

For the versioned fallback builder:

```bash
npm run build:versioned -- linux
```

or:

```bash
npm run build:versioned -- steamdeck
```

The package will be stored in `dist/v1/`, or the first successful version after a failed attempt.

## Installing the `.deb` on SteamOS

Copy the resulting `.deb` to the Steam Deck and switch to Desktop Mode.

In a terminal:

```bash
sudo pacman -Syu
```

Then install the package with the Debian package tooling available in your chosen SteamOS environment. If your SteamOS image does not provide a working `.deb` installation workflow, use the same source to build a native package for that SteamOS image instead.

**Important:** SteamOS is Arch-based rather than Debian-based. A `.deb` is therefore not the native SteamOS package format. This project is configured to produce the `.deb` you requested, but for the most reliable Steam Deck distribution, an AppImage or Arch-compatible package is usually a better technical choice.

## Build both targets

From a suitable environment:

```bash
npm run build:all
```

This requests:

```text
Windows → NSIS .exe
Linux   → x86_64 .deb
```

For repeatable releases, build Windows on Windows and Linux on Linux/WSL.

## Versioned build behavior

The build helper uses a simple attempt counter:

```text
dist/
├── v1/
│   └── BUILD_FAILED.txt
├── v2/
│   └── Gurke-Client-1.1.0-linux-x64.deb
└── ...
```

A failed build is kept as `v1`, and the next attempt is `v2`. Fixing the actual compiler/dependency/configuration problem is still required for the next attempt to succeed.

## Release layout

```text
Gurke Client/
├── Windows/
│   └── Gurke-Client-1.1.0-win-x64.exe
└── SteamOS/
    └── Gurke-Client-1.1.0-linux-x64.deb
```

The launcher source is shared between both platforms.

### SteamOS note

SteamOS is Arch-based. The requested `.deb` is therefore not its native install format. Use `npm run build:steamdeck` for an AppImage that is practical on Steam Deck, while `npm run build:linux` produces the requested `.deb`.
