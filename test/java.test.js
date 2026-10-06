// Ausführen: node test/java.test.js  (gefälschte Adoptium-Antworten, kein Internet nötig)
const assert = require("assert"), fs = require("fs"), os = require("os"), path = require("path"), crypto = require("crypto");
const { execFileSync } = require("child_process");
const j = require("../lib/java-runtime");
(async () => {
  assert.strictEqual(j.requiredJava("1.21.1"), 21);
  assert.strictEqual(j.requiredJava("1.20.4"), 17);
  assert.strictEqual(j.requiredJava("1.20.5"), 21);
  assert.strictEqual(j.requiredJava("1.16.5"), 8);
  assert.strictEqual(j.javaMajor("1.8"), 8);
  assert.strictEqual(j.javaMajor("17.0"), 17);

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gurke-java-"));
  const src = path.join(tmp, "src", "jdk-21.0.5+11-jre", "bin"); fs.mkdirSync(src, { recursive: true });
  fs.writeFileSync(path.join(src, "java"), "#!/bin/sh\necho 'openjdk version \"21.0.5\"' >&2\n"); fs.chmodSync(path.join(src, "java"), 0o755);
  const tgz = path.join(tmp, "jre.tar.gz");
  execFileSync("tar", ["-czf", tgz, "-C", path.join(tmp, "src"), "jdk-21.0.5+11-jre"]);
  const data = fs.readFileSync(tgz), sha = crypto.createHash("sha256").update(data).digest("hex");
  let bad = false;
  const fakeFetch = async url => {
    if (url.includes("api.adoptium.net")) {
      assert.ok(url.includes("/21/hotspot") && url.includes("image_type=jre") && url.includes("os=linux"));
      return { ok: true, json: async () => [{ binary: { package: { link: "https://github.com/x/jre.tar.gz", checksum: bad ? "00" : sha, name: "jre.tar.gz", size: data.length } } }] };
    }
    return { ok: true, headers: { get: () => String(data.length) }, body: new Response(data).body };
  };
  const base = path.join(tmp, "userData"), logs = [];
  bad = true;
  await assert.rejects(j.ensureJava(base, 21, { fetchFn: fakeFetch, platform: "linux", arch: "x64" }), /Prüfsumme/);
  assert.ok(!fs.existsSync(path.join(base, "runtime", "java-21")), "kein halb installiertes Java");
  bad = false;
  const bin = await j.ensureJava(base, 21, { fetchFn: fakeFetch, platform: "linux", arch: "x64", log: t => logs.push(t) });
  assert.ok(bin.endsWith(path.join("java-21", "bin", "java")));
  assert.ok(execFileSync(bin, [], { stdio: "pipe" }) !== null);
  assert.deepStrictEqual(j.managedJavas(base, "linux"), [bin]);
  // zweiter Aufruf: kein neuer Download
  const again = await j.ensureJava(base, 21, { fetchFn: () => { throw new Error("sollte nicht laden"); }, platform: "linux", arch: "x64" });
  assert.strictEqual(again, bin);
  console.log("Java-Tests OK\n" + logs.join("\n"));
})().catch(e => { console.error(e); process.exit(1); });
