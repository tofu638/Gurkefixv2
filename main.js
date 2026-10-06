const { app, BrowserWindow, ipcMain, safeStorage, shell, screen } = require("electron");
const net = require("./lib/net");
const { brandWindow } = require("./lib/brand");
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const { Auth } = require("msmc");
const { Client } = require("minecraft-launcher-core");
const jrt = require("./lib/java-runtime");

const MANIFEST = "https://launchermeta.mojang.com/mc/game/version_manifest_v2.json";
let win, xbox = null, playing = false;

const DEFAULT_CFG = {
  version: "", ram: 4096, instances: [], activeInstance: "", servers: [], playtime: {},
  minecraft: { minRam: 512, maxRam: 4096, fullscreen: false, width: 1280, height: 720, gameDir: "", jvmArgs: "", gameArgs: "" },
  java: { autoDetect: true, customPath: "", java8: "", java17: "", java21: "" },
  launcher: { closeOnGameStart: false, showConsole: true, checkUpdates: true },
  appearance: { animations: true, accent: "green" }
};

const cfgFile = () => path.join(app.getPath("userData"), "config.json");
function merge(a,b) {
  const out = {...a};
  for (const [k,v] of Object.entries(b || {}))
    out[k] = (v && typeof v === "object" && !Array.isArray(v) && a?.[k] && typeof a[k] === "object") ? merge(a[k],v) : v;
  return out;
}
function loadCfg() { try { return merge(DEFAULT_CFG, JSON.parse(fs.readFileSync(cfgFile(),"utf8"))); } catch { return structuredClone(DEFAULT_CFG); } }
function saveCfg(patch) {
  const cfg = merge(loadCfg(), patch);
  fs.mkdirSync(path.dirname(cfgFile()), {recursive:true});
  fs.writeFileSync(cfgFile(), JSON.stringify(cfg,null,2));
  return cfg;
}
function storeToken(token) {
  if (!token) return saveCfg({rt:null,rtEnc:false});
  if (safeStorage.isEncryptionAvailable()) return saveCfg({rt:safeStorage.encryptString(token).toString("base64"),rtEnc:true});
  return saveCfg({rt:token,rtEnc:false});
}
function readToken() {
  const {rt,rtEnc}=loadCfg(); if(!rt)return null;
  try{return rtEnc?safeStorage.decryptString(Buffer.from(rt,"base64")):rt}catch{return null}
}

function createWindow() {
  const wa=screen.getPrimaryDisplay().workAreaSize;
  win=new BrowserWindow({ icon: path.join(__dirname,"build","icons","256x256.png"),
    width:Math.min(1500,wa.width),height:Math.min(950,wa.height),minWidth:1000,minHeight:650,
    backgroundColor:"#07110b",title:"Gurke Client",autoHideMenuBar:true,center:true,
    webPreferences:{preload:path.join(__dirname,"preload.js"),contextIsolation:true,nodeIntegration:false}
  });
  win.loadFile("index.html");
}
app.whenReady().then(createWindow);
app.on("window-all-closed",()=>app.quit());
const send=(ch,data)=>win&&!win.isDestroyed()&&win.webContents.send(ch,data);

async function accountInfo(){
  if(!xbox)return null;
  const mc=await xbox.getMinecraft(),u=mc.mclc();
  return {name:u.name,uuid:u.uuid};
}
ipcMain.handle("auth:status",async()=>{
  const rt=readToken();if(!rt)return {ok:false};
  try{xbox=await new Auth("select_account").refresh(rt);storeToken(xbox.save());return {ok:true,account:await accountInfo()};}
  catch{return {ok:false}}
});
ipcMain.handle("auth:login",async()=>{
  try{xbox=await new Auth("select_account").launch("electron",{width:520,height:680});storeToken(xbox.save());return {ok:true,account:await accountInfo()};}
  catch(e){const msg=String(e?.message||e);return {ok:false,cancelled:/cancel|closed|user/i.test(msg),error:explain(msg)}}
});
ipcMain.handle("auth:logout",()=>{xbox=null;storeToken(null);return {ok:true}});
function explain(msg){
  if(/game|own|entitle/i.test(msg))return "Dieses Microsoft-Konto besitzt Minecraft Java Edition nicht.";
  if(/child|family|age/i.test(msg))return "Kinderkonto: Online-Spielen muss in der Xbox-Familie erlaubt sein.";
  return msg;
}

ipcMain.handle("versions:list",async(_e,snapshots)=>{
  const res=await fetch(MANIFEST);if(!res.ok)throw new Error("Mojang-Versionen konnten nicht geladen werden.");
  const data=await res.json();
  return data.versions.filter(v=>v.type==="release"||(snapshots&&v.type==="snapshot")).map(v=>({id:v.id,type:v.type}));
});
function readCfKey(){const {cfKey,cfKeyEnc}=loadCfg();if(!cfKey)return "";try{return cfKeyEnc?safeStorage.decryptString(Buffer.from(cfKey,"base64")):cfKey}catch{return ""}}
ipcMain.handle("cf:setKey",(_e,key)=>{key=String(key||"").trim();if(!key){saveCfg({cfKey:"",cfKeyEnc:false});return true}
  if(safeStorage.isEncryptionAvailable())saveCfg({cfKey:safeStorage.encryptString(key).toString("base64"),cfKeyEnc:true});else saveCfg({cfKey:key,cfKeyEnc:false});return true});
ipcMain.handle("cfg:get",()=>{const {rt,rtEnc,cfKey,cfKeyEnc,...rest}=loadCfg();return {...rest,hasCfKey:!!cfKey}});
ipcMain.handle("cfg:set",(_e,patch)=>{saveCfg(patch);return true});
const rootDir=()=>loadCfg().minecraft.gameDir||path.join(app.getPath("userData"),"minecraft");
function instDir(id){
  const inst=(loadCfg().instances||[]).find(i=>i.id===id);
  if(!inst||!/^[a-z0-9]+$/i.test(inst.id))throw new Error("Instanz nicht gefunden.");
  return {inst,dir:path.join(rootDir(),"instances",inst.id)};
}
ipcMain.handle("open:folder",(_e,o)=>{
  try{
    const sub=["mods","saves","screenshots","logs","resourcepacks"].includes(o?.sub)?o.sub:"";
    const {dir}=o?.instanceId?instDir(o.instanceId):{dir:rootDir()};
    const target=sub?path.join(dir,sub):dir;fs.mkdirSync(target,{recursive:true});return shell.openPath(target);
  }catch{return shell.openPath(rootDir())}
});
ipcMain.handle("open:site",()=>shell.openExternal(net.SITE));
const EXTERNAL=["https://console.curseforge.com/","https://www.curseforge.com/","https://modrinth.com/"];
ipcMain.handle("open:external",(_e,url)=>EXTERNAL.some(p=>String(url).startsWith(p))?shell.openExternal(url):false);

/* ---- Mods (Modrinth), Server, Updates ---- */
const wrap=fn=>async(_e,a)=>{try{return {ok:true,data:await fn(a||{})}}catch(e){return {ok:false,error:String(e?.message||e)}}};
const MODLOADERS=["fabric","forge"];
ipcMain.handle("mods:search",wrap(async({instanceId,q,source,sort,category})=>{
  const {inst,dir}=instDir(instanceId),loader=MODLOADERS.includes(inst.loader)?inst.loader:"";
  const hits=await(source==="curseforge"?net.cfSearch(readCfKey(),q,inst.version,loader,{sort}):net.searchMods(q,inst.version,loader,{sort,category}));
  const have=new Set(net.installedKeys(dir));const src=source==="curseforge"?"curseforge":"modrinth";
  return hits.map(h=>({...h,installed:have.has(src+":"+h.id)}));
}));
ipcMain.handle("mods:install",wrap(async({instanceId,projectId,source,title})=>{
  const {inst,dir}=instDir(instanceId);if(!MODLOADERS.includes(inst.loader))throw new Error("Mods brauchen Fabric oder Forge – stelle die Instanz um.");
  const mods=path.join(dir,"mods"),cf=source==="curseforge";
  const names=await(cf?net.cfInstallMod(readCfKey(),projectId,inst.version,inst.loader,mods):net.installMod(projectId,inst.version,inst.loader,mods));
  net.recordInstall(dir,(cf?"curseforge:":"modrinth:")+projectId,String(title||projectId).slice(0,80),names);return names;
}));
ipcMain.handle("mods:uninstall",wrap(({instanceId,projectId,source})=>net.uninstallMod(instDir(instanceId).dir,(source==="curseforge"?"curseforge:":"modrinth:")+projectId)));
ipcMain.handle("mods:list",wrap(({instanceId})=>net.listMods(path.join(instDir(instanceId).dir,"mods"))));
ipcMain.handle("mods:toggle",wrap(({instanceId,file})=>net.toggleMod(path.join(instDir(instanceId).dir,"mods"),file)));
ipcMain.handle("mods:remove",wrap(({instanceId,file})=>net.removeMod(path.join(instDir(instanceId).dir,"mods"),file)));
ipcMain.handle("servers:status",wrap(({host})=>net.serverStatus(host)));
ipcMain.handle("update:check",wrap(()=>net.checkUpdate(app.getVersion())));

function execVersion(javaPath){
  return new Promise(resolve=>execFile(javaPath,["-version"],{timeout:5000},(err,stdout,stderr)=>{
    const text=String(stdout||"")+String(stderr||"");
    const m=text.match(/version "(\d+)(?:\.(\d+))?/i);
    resolve({ok:!err,version:m?`${m[1]}.${m[2]||"0"}`:""});
  }));
}
async function detectJava(){
  const candidates=[];
  const cfg=loadCfg().java;
  if(cfg.customPath)candidates.push(cfg.customPath);
  if(process.platform==="win32"){
    candidates.push("java");
    for(const root of [process.env.JAVA_HOME,process.env.ProgramFiles&&path.join(process.env.ProgramFiles,"Java")].filter(Boolean)){
      if(fs.existsSync(root)){
        try{for(const d of fs.readdirSync(root))candidates.push(path.join(root,d,"bin","java.exe"))}catch{}
      }
    }
  } else {
    candidates.push("java");
    for(const root of ["/usr/bin/java","/usr/lib/jvm/java-21-openjdk/bin/java","/usr/lib/jvm/java-17-openjdk/bin/java","/usr/lib/jvm/java-8-openjdk/bin/java","/home/deck/.local/share/mise/installs/java"].filter(Boolean))candidates.push(root);
  }
  candidates.push(...jrt.managedJavas(app.getPath("userData")));
  const seen=new Set(),found=[];
  for(const c of candidates){
    if(seen.has(c))continue;seen.add(c);
    const r=await execVersion(c);if(r.ok)found.push({path:c,version:r.version});
  }
  return found;
}
ipcMain.handle("java:detect",()=>detectJava());

function javaForVersion(version, cfg, found){
  const parts=String(version).split(".").map(Number);
  const minor=parts[1]||0, patch=parts[2]||0;
  if(!cfg.autoDetect && cfg.customPath)return cfg.customPath;
  const required=(minor>20 || (minor===20 && patch>=5)) ? 21 : (minor>=17 ? 17 : 8);
  const preferred=required===21?cfg.java21:required===17?cfg.java17:cfg.java8;
  if(preferred)return preferred;
  const match=found.find(x=>Number(x.version.split(".")[0])===required);
  return match?.path || found[0]?.path || "java";
}
function parseArgs(s){return String(s||"").trim()?String(s).match(/(?:[^\s"]+|"[^"]*")+/g).map(x=>x.replace(/^"|"$/g,"")):[]}

ipcMain.handle("game:play",async(_e,opts)=>{
  if(playing)return {ok:false,error:"Minecraft läuft bereits."};
  if(!xbox)return {ok:false,error:"Bitte zuerst anmelden."};
  let ctx;try{ctx=instDir(opts.instanceId)}catch(e){return {ok:false,error:e.message}}
  const {inst,dir:gameDir}=ctx, version=inst.version;
  const cfg=loadCfg(), found=await detectJava(); let javaPath=javaForVersion(version,cfg.java,found);
  let jr=await execVersion(javaPath);
  const needJava=jrt.requiredJava(version);
  if((!jr.ok||jrt.javaMajor(jr.version)<needJava)&&(cfg.java.autoDetect!==false||!cfg.java.customPath)){
    try{
      javaPath=await jrt.ensureJava(app.getPath("userData"),needJava,{log:t=>send("game:log",t)});
      jr=await execVersion(javaPath);
    }catch(e){return {ok:false,error:"Java "+needJava+" konnte nicht automatisch installiert werden: "+String(e?.message||e)}}
  }
  if(!jr.ok)return {ok:false,error:"Java wurde nicht gefunden. Installiere Java 21 für aktuelle Minecraft-Versionen."};
  const join=opts.join&&net.validHost(opts.join)?opts.join:"";
  try{
    playing=true;
    const root=rootDir();let custom;
    if(inst.loader==="fabric"){send("game:log","Fabric wird vorbereitet …");custom=await net.installFabric(root,version);send("game:log","Fabric: "+custom)}
    let forge;
    if(inst.loader==="forge"){send("game:log","Forge wird vorbereitet …");forge=await net.ensureForge(root,version);send("game:log","Forge: "+path.basename(forge))}
    fs.mkdirSync(gameDir,{recursive:true});
    await xbox.refresh(); const mc=await xbox.getMinecraft(); const launcher=new Client();
    let startedAt=0;
    launcher.on("progress",p=>send("game:progress",{type:p.type,task:p.task,total:p.total}));
    launcher.on("download-status",d=>send("game:log",`Download: ${d.name||d.type}`));
    launcher.on("debug",m=>send("game:log",String(m)));
    launcher.on("data",m=>{if(!startedAt)startedAt=Date.now();send("game:log",String(m))});
    launcher.on("close",code=>{
      playing=false;
      if(startedAt){const pt={...(loadCfg().playtime||{})};pt[inst.id]=(pt[inst.id]||0)+(Date.now()-startedAt);saveCfg({playtime:pt})}
      win?.show();send("game:closed",code);
    });
    const args=parseArgs(cfg.minecraft.jvmArgs);
    const gameArgs=[...parseArgs(cfg.minecraft.gameArgs),...(join?net.joinArgs(version,join):[])];
    const proc=await launcher.launch({
      authorization:mc.mclc(),root,javaPath,
      version:{number:version,type:"Gurke Client",...(custom?{custom}:{})},
      ...(forge?{forge}:{}),
      overrides:{gameDirectory:gameDir},
      memory:{max:`${opts.ram}M`,min:`${cfg.minecraft.minRam||512}M`},
      customArgs:args,
      customLaunchArgs:gameArgs,
      window:{fullscreen:!!cfg.minecraft.fullscreen,width:cfg.minecraft.width,height:cfg.minecraft.height}
    });
    if(!proc){playing=false;return {ok:false,error:"Start fehlgeschlagen (siehe Log)."}}
    try{
      const {nativeImage}=require("electron");const png=path.join(__dirname,"build","icons","64x64.png");let argb="";
      if(process.platform==="linux"){const im=nativeImage.createFromPath(png),bm=im.toBitmap(),sz=im.getSize(),nums=[sz.width,sz.height];
        for(let i=0;i<bm.length;i+=4)nums.push(((bm[i+3]<<24)|(bm[i+2]<<16)|(bm[i+1]<<8)|bm[i])>>>0);argb=nums.join(",")}
      brandWindow({pid:proc.pid,title:`Gurke Client ${version}`,icoPath:path.join(__dirname,"build","icons","icon.ico"),iconArgb:argb,dataDir:app.getPath("userData"),log:t=>send("game:log",t)});
    }catch(e){send("game:log","Fenster-Branding übersprungen: "+e.message)}
    if(cfg.launcher.closeOnGameStart) setTimeout(()=>win?.hide(),1500);
    return {ok:true,java:jr.version,path:javaPath};
  }catch(e){playing=false;return {ok:false,error:String(e?.message||e)}}
});
