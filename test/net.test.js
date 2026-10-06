// Ausführen: node test/net.test.js  (nutzt gefälschte Netzwerkantworten, kein Internet nötig)
const assert = require("assert"), fs = require("fs"), os = require("os"), path = require("path"), crypto = require("crypto");
const net = require("../lib/net");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gurke-"));
const jar = Buffer.from("fake-jar-content"), SHA1 = crypto.createHash("sha1").update(jar).digest("hex"), sha = crypto.createHash("sha512").update(jar).digest("hex");
const routes = {
  "meta.fabricmc.net/v2/versions/loader/1.20.1": [{ loader: { version: "0.16.0", stable: false } }, { loader: { version: "0.15.11", stable: true } }],
  "meta.fabricmc.net/v2/versions/loader/1.20.1/0.15.11/profile/json": { id: "fabric-loader-0.15.11-1.20.1", inheritsFrom: "1.20.1" },
  "api.modrinth.com/v2/search": { hits: [{ project_id: "P1", title: "Sodium", description: "fast", icon_url: null, downloads: 5, author: "x" }] },
  "api.modrinth.com/v2/project/P1/version": [{ version_type: "release", files: [{ primary: true, filename: "sodium.jar", url: "https://cdn.modrinth.com/a/sodium.jar", hashes: { sha512: sha } }], dependencies: [{ dependency_type: "required", project_id: "P2" }, { dependency_type: "optional", project_id: "P3" }] }],
  "api.modrinth.com/v2/project/P2/version": [{ version_type: "release", files: [{ filename: "fabric-api.jar", url: "https://cdn.modrinth.com/b/fabric-api.jar", hashes: { sha512: sha } }], dependencies: [] }],
  "cdn.modrinth.com/a/sodium.jar": jar, "cdn.modrinth.com/b/fabric-api.jar": jar,
  "api.mcsrvstat.us/3/mcpvp.club": { online: true, players: { online: 12, max: 100 }, motd: { clean: ["Hallo", "Welt"] }, icon: "data:image/png;base64,AAA", version: "1.21" },
  "api.curseforge.com/v1/mods/search": { data: [{ id: 111, name: "Lithium", summary: "tick", downloadCount: 9, logo: { thumbnailUrl: "https://media.forgecdn.net/x.png" }, authors: [{ name: "jellysquid" }] }] },
  "api.curseforge.com/v1/mods/111/files": { data: [{ id: 5, fileName: "lithium-cf.jar", releaseType: 1, fileDate: "2026-01-01", downloadUrl: null, hashes: [{ algo: 1, value: SHA1 }], dependencies: [{ modId: 222, relationType: 3 }, { modId: 333, relationType: 2 }] }] },
  "api.curseforge.com/v1/mods/111/files/5/download-url": { data: "https://edge.forgecdn.net/files/lithium-cf.jar" },
  "api.curseforge.com/v1/mods/222/files": { data: [{ id: 6, fileName: "dep.jar", releaseType: 1, fileDate: "2026-01-02", downloadUrl: "https://edge.forgecdn.net/files/dep.jar", hashes: [], dependencies: [] }] },
  "edge.forgecdn.net/files/lithium-cf.jar": jar, "edge.forgecdn.net/files/dep.jar": jar,
  "files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json": { promos: { "1.20.1-latest": "47.4.0", "1.20.1-recommended": "47.3.0" } },
  "maven.minecraftforge.net/net/minecraftforge/forge/1.20.1-47.3.0/forge-1.20.1-47.3.0-installer.jar.sha1": SHA1,
  "maven.minecraftforge.net/net/minecraftforge/forge/1.20.1-47.3.0/forge-1.20.1-47.3.0-installer.jar": jar,
  "api.github.com/repos/troxiytghg-gif/gurke-client/releases/latest": { name: "Gurke Client v1.3.0" }
};
global.fetch = async (url) => {
  const u = new URL(url), key = u.host + u.pathname, hit = routes[key];
  if (hit === undefined) return { ok: false, status: 404 };
  return { ok: true, status: 200, text: async () => String(hit), json: async () => hit, arrayBuffer: async () => Buffer.isBuffer(hit) ? hit : Buffer.alloc(0) };
};
(async () => {
  const id = await net.installFabric(tmp, "1.20.1");
  assert.strictEqual(id, "fabric-loader-0.15.11-1.20.1");
  assert(fs.existsSync(path.join(tmp, "versions", id, id + ".json")));
  global.fetch = async () => { throw new Error("offline"); };           // offline → lokale Version
  assert.strictEqual(await net.installFabric(tmp, "1.20.1"), id);
  global.fetch = (async f => f)(null) || global.fetch;
})().catch(e => { console.error(e); process.exit(1); }).then(async () => {
  // Netzwerk-Mock wiederherstellen
  global.fetch = async (url) => { const u = new URL(url), hit = routes[u.host + u.pathname]; if (hit === undefined) return { ok: false, status: 404 }; return { ok: true, status: 200, text: async () => String(hit), json: async () => hit, arrayBuffer: async () => Buffer.isBuffer(hit) ? hit : Buffer.alloc(0) }; };
  const hits = await net.searchMods("sod", "1.20.1", "fabric"); assert.strictEqual(hits[0].title, "Sodium");
  const mods = path.join(tmp, "mods");
  const got = await net.installMod("P1", "1.20.1", "fabric", mods);
  assert.deepStrictEqual(got, ["sodium.jar", "fabric-api.jar"]);          // inkl. benötigter Abhängigkeit, ohne optionale
  assert.deepStrictEqual(net.listMods(mods).map(m => [m.name, m.enabled]), [["fabric-api", true], ["sodium", true]]);
  net.toggleMod(mods, "sodium.jar"); assert(fs.existsSync(path.join(mods, "sodium.jar.disabled")));
  net.toggleMod(mods, "sodium.jar.disabled"); assert(fs.existsSync(path.join(mods, "sodium.jar")));
  assert.throws(() => net.removeMod(mods, "../../etc/passwd"));          // Pfad-Trick wird abgelehnt
  net.removeMod(mods, "sodium.jar"); assert(!fs.existsSync(path.join(mods, "sodium.jar")));
  routes["cdn.modrinth.com/b/fabric-api.jar"] = Buffer.from("manipuliert");   // falsche Prüfsumme
  fs.unlinkSync(path.join(mods, "fabric-api.jar"));
  await assert.rejects(net.installMod("P2", "1.20.1", "fabric", mods), /Prüfsumme/);
  assert(!fs.existsSync(path.join(mods, "fabric-api.jar")));
  const s = await net.serverStatus("mcpvp.club"); assert.deepStrictEqual([s.online, s.players.online, s.motd], [true, 12, "Hallo\nWelt"]);
  await assert.rejects(net.serverStatus("evil.com/../x"), /Ungültig/);
  assert.deepStrictEqual(net.joinArgs("1.21", "a.net"), ["--quickPlayMultiplayer", "a.net"]);
  assert.deepStrictEqual(net.joinArgs("1.8.9", "a.net:1234"), ["--server", "a.net", "--port", "1234"]);
  assert.deepStrictEqual(await net.checkUpdate("1.2.0"), { latest: "1.3.0", newer: true, url: net.SITE });
  assert.strictEqual((await net.checkUpdate("1.3.0")).newer, false);
  const cf = await net.cfSearch("KEY", "lith", "1.20.1", "fabric"); assert.strictEqual(cf[0].title, "Lithium");
  const cfm = path.join(tmp, "cfmods");
  assert.deepStrictEqual(await net.cfInstallMod("KEY", "111", "1.20.1", "fabric", cfm), ["lithium-cf.jar", "dep.jar"]);   // download-url-Fallback + Pflicht-Abhängigkeit
  await assert.rejects(net.cfSearch("", "x", "1.20.1", "fabric"), /NO_KEY/);
  const fp = await net.ensureForge(tmp, "1.20.1"); assert(fp.endsWith("forge-1.20.1-47.3.0-installer.jar") && fs.existsSync(fp));   // empfohlene Version + SHA-1-Prüfung
  await assert.rejects(net.ensureForge(tmp, "1.12.2"), /ab Minecraft 1.13/);
  const inst = path.join(tmp, "inst"); const im = path.join(inst, "mods"); fs.mkdirSync(im, { recursive: true });
  routes["cdn.modrinth.com/b/fabric-api.jar"] = jar;   // Manipulation aus dem Test oben zurücksetzen
  const names = await net.installMod("P1", "1.20.1", "forge", im); net.recordInstall(inst, "modrinth:P1", "Sodium", names);
  assert.deepStrictEqual(net.installedKeys(inst), ["modrinth:P1"]);
  const un = net.uninstallMod(inst, "modrinth:P1"); assert.deepStrictEqual(un.kept, ["fabric-api.jar"]);     // Abhängigkeit bleibt
  assert(!fs.existsSync(path.join(im, "sodium.jar"))); assert.deepStrictEqual(net.installedKeys(inst), []);
  assert.throws(() => net.uninstallMod(inst, "modrinth:NOPE"), /nicht über den Launcher/);
  console.log("ALLE TESTS BESTANDEN ✔");
}).catch(e => { console.error("FEHLER:", e); process.exit(1); });
