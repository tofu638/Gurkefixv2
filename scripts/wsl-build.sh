#!/usr/bin/env bash
# Wird von "npm run build:appimage" unter Windows in WSL gestartet (Arbeitsordner = Projektordner).
set -euo pipefail
SRC="$PWD"
echo "🥒 AppImage-Build in WSL"

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "❌ Node.js fehlt in WSL. Einmalig installieren (in Ubuntu/WSL):"
  echo "   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -"
  echo "   sudo apt-get install -y nodejs"
  exit 3
fi
if [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 18 ]; then
  echo "❌ Node.js in WSL ist zu alt ($(node -v)). Bitte Node 18+ (empfohlen 22) installieren:"
  echo "   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -"
  echo "   sudo apt-get install -y nodejs"
  exit 3
fi

# Unter /mnt/c funktionieren Symlinks nicht -> im Linux-Home bauen
case "$SRC" in
  /mnt/*)
    WORK="$HOME/gurke-client-build"
    echo "→ Kopiere Projekt nach $WORK (ohne node_modules/dist)"
    mkdir -p "$WORK"
    tar --exclude=./node_modules --exclude=./dist -cf - . | tar -xf - -C "$WORK"
    ;;
  *) WORK="$SRC" ;;
esac

cd "$WORK"
echo "→ npm install"
npm ci --no-audit --no-fund || npm install --no-audit --no-fund
echo "→ electron-builder (AppImage)"
npm run build:appimage

if [ "$WORK" != "$SRC" ]; then
  mkdir -p "$SRC/dist"
  cp -f dist/*.AppImage "$SRC/dist/"
  echo "→ AppImage kopiert nach $SRC/dist"
fi
