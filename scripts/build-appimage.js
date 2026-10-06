```js
// Build Gurke Client AppImage
// Run with: npm run build:appimage

const { spawnSync } = require("child_process");
const path = require("path");

if (process.platform === "win32" || process.platform === "darwin") {
  console.error(
    "AppImage builds must run on Linux. Use GitHub Actions, Linux, or SteamOS."
  );
  process.exit(1);
}

const projectDir = path.resolve(__dirname, "..");

console.log("Building Gurke Client AppImage...");

const result = spawnSync(
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
    shell: false
  }
);

if (result.error) {
  console.error("Failed to start the build:", result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  console.error("AppImage build failed.");
  process.exit(result.status || 1);
}

console.log("AppImage build completed successfully!");
console.log("Check the dist folder for the .AppImage file.");
```
