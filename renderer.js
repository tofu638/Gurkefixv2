const $=id=>document.getElementById(id);
const S={versions:[],tab:"release",query:"",selected:null,active:0,account:null,cfg:{},inst:[],activeId:"",srv:{}};
const M={src:"modrinth",sort:"popular",cat:""};
const DEFAULT_SERVERS=["bettervanilla.net","donutsmp.net","pvphg.com","mcpvp.com","mcpvp.club"];
const CATS=[["","Alle"],["optimization","Optimierung"],["technology","Technik"],["adventure","Abenteuer"],["decoration","Dekoration"],["utility","Nützlich"],["library","Bibliotheken"],["worldgen","Weltgenerierung"],["mobs","Mobs"],["magic","Magie"],["equipment","Ausrüstung"],["storage","Lager"]];
const PRESETS={bal:"-XX:+UseG1GC -XX:MaxGCPauseMillis=50 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:G1HeapRegionSize=16M",aikar:"-XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1HeapRegionSize=8M -XX:G1ReservePercent=20 -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 -XX:G1RSetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 -XX:+PerfDisableSharedMem -XX:MaxTenuringThreshold=1"};
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e};
const NS="http://www.w3.org/2000/svg";
const ic=(n,c)=>{const s=document.createElementNS(NS,"svg");s.setAttribute("class","ic"+(c?" "+c:""));const u=document.createElementNS(NS,"use");u.setAttribute("href","#i-"+n);s.append(u);return s};
function setLabel(b,text,icon){b.replaceChildren();if(icon)b.append(ic(icon));if(text)b.append(el("span",null,text))}
const btn=(text,cls,fn,icon)=>{const b=el("button",cls);b.type="button";setLabel(b,text,icon);b.onclick=fn;return b};
const LOADERS={vanilla:{n:"Vanilla",i:"cube",d:"Das Originalspiel ohne Mods."},fabric:{n:"Fabric",i:"fabric",d:"Leicht und schnell, riesige Mod-Auswahl."},forge:{n:"Forge",i:"anvil",d:"Klassische Mods und große Modpacks."}};
const loaderName=l=>(LOADERS[l]||LOADERS.vanilla).n;
const forgeOk=v=>/^\d+\.\d+(\.\d+)?$/.test(v||"")&&Number(v.split(".")[1])>=13;
const canMod=l=>l==="fabric"||l==="forge";
const ib=n=>{const s=document.createElementNS(NS,"svg");s.setAttribute("class","brandic");const u=document.createElementNS(NS,"use");u.setAttribute("href","#b-"+n);s.append(u);return s};
function toast(text,kind){const t=el("div","toast "+(kind||"ok"));t.append(ic(kind==="err"?"warn":"check"),el("span",null,text));$("toasts").append(t);setTimeout(()=>{t.classList.add("out");setTimeout(()=>t.remove(),350)},3800)}
function stagger(box){[...box.children].forEach((c,i)=>c.style.setProperty("--i",Math.min(i,14)));box.classList.add("stagger");setTimeout(()=>box.classList.remove("stagger"),1000)}
const chk=()=>{const s=el("span","check");s.append(ic("check"));return s};
const fmtTime=ms=>{const m=Math.floor((ms||0)/60000);return m>=60?`${Math.floor(m/60)} h ${m%60} min`:`${m} min`};
const newId=()=>"i"+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const act=()=>S.inst.find(i=>i.id===S.activeId);
const saveInst=()=>window.gurke.setCfg({instances:S.inst,activeInstance:S.activeId});
const status=t=>$("status").textContent=t;
function log(t){const e=$("log");e.textContent+=t+"\n";if(e.textContent.length>50000)e.textContent=e.textContent.slice(-35000);e.scrollTop=e.scrollHeight}

/* ---------- Dropdown-Komponente ---------- */
function dd(opts,value,onChange){
 const w=el("div","dd"),b=el("button","dd-btn"),m=el("div","dd-menu hidden"),lab=el("span","dd-l"),ch=el("span","dd-c");ch.append(ic("chev"));b.type="button";b.append(lab,ch);
 const items=opts.map(([v,t])=>{const i=el("button","dd-i");i.type="button";const ck=el("span","dd-ck");ck.append(ic("check"));i.append(el("span","dd-t",t),ck);i.onclick=e=>{e.stopPropagation();set(v,true);close()};m.append(i);return {v,i}});
 function set(v,fire){const o=opts.find(x=>x[0]===v)||opts[0];w._v=o[0];lab.textContent=o[1];items.forEach(x=>x.i.classList.toggle("sel",x.v===o[0]));if(fire&&onChange)onChange(o[0])}
 function close(){m.classList.add("hidden");w.classList.remove("open")}
 function open(){document.querySelectorAll(".dd.open").forEach(x=>x._close());m.classList.remove("hidden");w.classList.add("open");const r=b.getBoundingClientRect();w.classList.toggle("up",innerHeight-r.bottom<m.offsetHeight+60&&r.top>m.offsetHeight)}
 b.onclick=e=>{e.stopPropagation();w.classList.contains("open")?close():open()};
 b.onkeydown=e=>{if(e.key==="Escape")close()};
 w._close=close;w.set=v=>set(v,false);w.append(b,m);set(value,false);return w;
}
document.addEventListener("click",()=>document.querySelectorAll(".dd.open").forEach(x=>x._close()));
function enhance(sel){ // vorhandenes <select> durch das schicke Dropdown ersetzen
 const w=dd([...sel.options].map(o=>[o.value,o.textContent]),sel.value,v=>{sel.value=v;sel.dispatchEvent(new Event("change"))});
 sel.style.display="none";sel.after(w);sel._dd=w;
}
["javaMode","jvmPreset","accent"].forEach(id=>enhance($(id)));

/* ---------- Navigation ---------- */
function go(v){document.querySelectorAll(".nav[data-view]").forEach(x=>x.classList.toggle("active",x.dataset.view===v));document.querySelectorAll(".stage .view").forEach(x=>x.classList.toggle("hidden",x.id!=="view-"+v));const t=$("view-"+v);t.classList.remove("enter");void t.offsetWidth;t.classList.add("enter");if(v==="home")stagger($("instances"));onView(v)}
document.querySelectorAll(".nav[data-view]").forEach(b=>b.onclick=()=>go(b.dataset.view));
$("allSrv").onclick=()=>go("servers");
$("folderBtn").onclick=()=>window.gurke.openFolder({instanceId:S.activeId});
$("siteBtn").onclick=()=>window.gurke.openSite();

/* ---------- Account ---------- */
function setAccount(a){S.account=a;$("accName").textContent=a?a.name:"Nicht angemeldet";$("accSub").textContent=a?"Spielt als":"Microsoft-Konto nötig";
 const av=$("avatar");av.replaceChildren();if(a){const i=el("img");i.alt="";i.src="https://mc-heads.net/avatar/"+encodeURIComponent(a.uuid)+"/64";i.onerror=()=>{av.textContent=a.name[0].toUpperCase()};av.append(i)}else av.textContent="?";
 $("loginBtn").classList.toggle("hidden",!!a);$("logoutBtn").classList.toggle("hidden",!a)}
$("loginBtn").onclick=async()=>{status("Microsoft-Login geöffnet …");const r=await window.gurke.login();if(r.ok){setAccount(r.account);status(`Angemeldet als ${r.account.name}`)}else status(r.cancelled?"Anmeldung abgebrochen.":"Login-Fehler: "+(r.error||"unbekannt"))};
$("logoutBtn").onclick=async()=>{await window.gurke.logout();setAccount(null);status("Abgemeldet.")};

/* ---------- Start-Menü: Instanz + Version ---------- */
function visible(){const q=S.query.trim().toLowerCase();return S.versions.filter(v=>v.type===S.tab&&v.id.toLowerCase().includes(q))}
function select(id){S.selected=id;const a=act();if(a){a.version=id;saveInst();renderInstances();updatePlay()}window.gurke.setCfg({version:id});renderList();closeMenu()}
function renderList(){const list=$("list"),items=visible();list.replaceChildren();if(!items.length){list.append(el("div","hint","Keine Version gefunden."));return}
 S.active=Math.min(S.active,items.length-1);const latest=S.versions.find(v=>v.type==="release")?.id;
 items.forEach((v,i)=>{const b=el("button","item"+(i===S.active?" active":""));b.type="button";b.append(el("span","vn",v.id));if(v.id===latest)b.append(el("span","tag","NEUESTE"));if(v.type==="snapshot")b.append(el("span","tag snap","SNAPSHOT"));if(v.id===S.selected)b.append(chk());b.onclick=()=>select(v.id);b.onmouseenter=()=>{S.active=i;list.querySelectorAll(".item").forEach((x,j)=>x.classList.toggle("active",j===i))};list.append(b)})}
function renderInstMenu(){const box=$("instMenu");box.replaceChildren();S.inst.forEach(i=>{const b=el("button","minst"+(i.id===S.activeId?" sel":""));b.type="button";const n=el("span","nm",i.name);b.append(n,el("span","vv",i.version||""),el("span","badge",i.loader==="fabric"?"Fabric":"Vanilla"));if(i.id===S.activeId)b.append(chk());b.onclick=()=>{S.activeId=i.id;saveInst();syncVersion();renderInstances();renderInstMenu();updatePlay()};box.append(b)})}
function openMenu(){$("launchMenu").classList.remove("hidden");S.query="";$("search").value="";renderInstMenu();renderList();setTimeout(()=>$("search").focus({preventScroll:true}),50)}
function closeMenu(){$("launchMenu").classList.add("hidden")}
$("launchDD").onclick=e=>{e.stopPropagation();$("launchMenu").classList.contains("hidden")?openMenu():closeMenu()};
document.addEventListener("mousedown",e=>{if(!e.target.closest(".launchwrap"))closeMenu()});
$("search").oninput=e=>{S.query=e.target.value;S.active=0;renderList()};
document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{S.tab=t.dataset.tab;S.active=0;document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===t));renderList();$("search").focus()});
$("search").onkeydown=e=>{const items=visible();if(e.key==="ArrowDown"){S.active=Math.min(S.active+1,items.length-1);e.preventDefault()}else if(e.key==="ArrowUp"){S.active=Math.max(S.active-1,0);e.preventDefault()}else if(e.key==="Enter"&&items[S.active])return select(items[S.active].id);else if(e.key==="Escape")return closeMenu();else return;renderList()};
function syncVersion(){const a=act();S.selected=a?.version||null;const t=S.versions.find(v=>v.id===S.selected);if(t){S.tab=t.type;document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x.dataset.tab===S.tab))}}
function updatePlay(){const a=act(),p=$("playBtn");p.classList.toggle("loading",S.run==="loading");p.classList.toggle("running",S.run==="running");
 if(S.run==="loading"){$("playMain").textContent="STARTET …";$("playSub").textContent="Dateien werden vorbereitet";return}
 if(S.run==="running"){$("playMain").textContent="LÄUFT";$("playSub").textContent=`Gurke Client ${a?.version||""}`;return}
 $("playMain").textContent=a?.version?`SPIELEN ${a.version}`:"SPIELEN";$("playSub").textContent=a?`${a.name} · ${loaderName(a.loader)}`:"Version wählen"}
const setRun=s=>{S.run=s;$("playBtn").disabled=s!==""&&s!==undefined&&s!==null&&s!=="idle";updatePlay()};

/* ---------- Einstellungen ---------- */
function collectSettings(){return {ram:+$("ram").value,minecraft:{gameDir:$("gameDir").value.trim(),fullscreen:$("fullscreen").checked,width:+$("width").value||1280,height:+$("height").value||720,jvmArgs:$("jvmArgs").value,gameArgs:$("gameArgs").value},java:{autoDetect:$("javaMode").value==="auto",customPath:$("javaPath").value.trim()},launcher:{closeOnGameStart:$("closeOnStart").checked,showConsole:$("showConsole").checked,checkUpdates:$("checkUpdates").checked},appearance:{animations:$("animations").checked,accent:$("accent").value}}}
function applyCfg(c){c=c||{};$("ram").value=c.ram||4096;$("ramVal").textContent=c.ram||4096;const m=c.minecraft||{},j=c.java||{},l=c.launcher||{},a=c.appearance||{};
 $("gameDir").value=m.gameDir||"";$("width").value=m.width||1280;$("height").value=m.height||720;$("fullscreen").checked=!!m.fullscreen;$("jvmArgs").value=m.jvmArgs||"";$("gameArgs").value=m.gameArgs||"";
 $("javaMode").value=j.autoDetect===false?"custom":"auto";$("javaPath").value=j.customPath||"";$("closeOnStart").checked=!!l.closeOnGameStart;$("showConsole").checked=l.showConsole!==false;$("animations").checked=a.animations!==false;$("checkUpdates").checked=l.checkUpdates!==false;
 $("accent").value=a.accent||"green";document.body.dataset.accent=$("accent").value;document.body.classList.toggle("noanim",a.animations===false);
 $("jvmPreset").value=Object.keys(PRESETS).find(k=>PRESETS[k]===(m.jvmArgs||"").trim())||"";["javaMode","jvmPreset","accent"].forEach(id=>$(id)._dd.set($(id).value))}
let saveTimer;
document.querySelectorAll("#view-settings input,#view-settings select,#view-settings textarea").forEach(e=>e.addEventListener("change",()=>{clearTimeout(saveTimer);saveTimer=setTimeout(()=>window.gurke.setCfg(collectSettings()),150)}));
$("jvmPreset").addEventListener("change",()=>{$("jvmArgs").value=PRESETS[$("jvmPreset").value]||"";$("jvmArgs").dispatchEvent(new Event("change"))});
$("accent").addEventListener("change",()=>document.body.dataset.accent=$("accent").value);
$("animations").addEventListener("change",()=>document.body.classList.toggle("noanim",!$("animations").checked));
$("ram").oninput=()=>$("ramVal").textContent=$("ram").value;
$("detectJava").onclick=async()=>{status("Suche nach Java …");const r=await window.gurke.detectJava();$("javaResult").textContent=r.length?r.map(x=>`Java ${x.version} — ${x.path}`).join("\n"):"Kein Java gefunden.";status(r.length?`${r.length} Java-Installation(en) gefunden.`:"Java nicht gefunden.")};
$("reset").onclick=async()=>{if(!confirm("Alle Einstellungen zurücksetzen?"))return;await window.gurke.setCfg({ram:4096,minecraft:{gameDir:"",fullscreen:false,width:1280,height:720,jvmArgs:"",gameArgs:""},java:{autoDetect:true,customPath:""},launcher:{closeOnGameStart:false,showConsole:true,checkUpdates:true},appearance:{animations:true,accent:"green"}});applyCfg(await window.gurke.getCfg());status("Einstellungen zurückgesetzt.")};

/* ---------- Instanzen ---------- */
function renderInstances(){
 const box=$("instances");box.replaceChildren();let total=0;
 S.inst.forEach(i=>{const pt=(S.cfg.playtime||{})[i.id]||0;total+=pt;
  const c=el("div","card2"+(i.id===S.activeId?" active":"")+(S.justAdded===i.id?" pop":""));
  c.append(el("div","t",i.name),el("div","s",`Minecraft ${i.version||"?"} · ${loaderName(i.loader)} · ${fmtTime(pt)} gespielt`));
  const b=el("div","btns");
  b.append(btn(i.id===S.activeId?"Aktiv":"Auswählen",i.id===S.activeId?"mini go":"mini",()=>{S.activeId=i.id;saveInst();syncVersion();updatePlay();renderInstances()},i.id===S.activeId?"check":""),
   dd([["vanilla","Vanilla"],["fabric","Fabric"],["forge","Forge"]],LOADERS[i.loader]?i.loader:"vanilla",v=>{if(v==="forge"&&!forgeOk(i.version)){toast("Forge gibt es erst ab Minecraft 1.13.","err");return renderInstances()}i.loader=v;saveInst();updatePlay();renderInstances()}),
   btn("","mini",()=>window.gurke.openFolder({instanceId:i.id}),"folder"),
   btn("","mini danger",()=>{if(S.inst.length<2)return status("Mindestens eine Instanz muss bleiben.");if(!confirm(`Instanz „${i.name}“ entfernen? Die Dateien bleiben auf der Festplatte.`))return;S.inst=S.inst.filter(x=>x!==i);if(S.activeId===i.id)S.activeId=S.inst[0].id;saveInst();syncVersion();updatePlay();renderInstances()},"trash"));
  c.append(b);box.append(c)});
 S.justAdded=null;$("totalTime").textContent=`Gesamtspielzeit: ${fmtTime(total)}`;
}
const ND={loader:"vanilla",version:"",dd:null};
function openNew(){
 $("ndName").value="";ND.loader="vanilla";const rel=S.versions.filter(v=>v.type==="release").map(v=>[v.id,v.id]);
 ND.version=rel.some(x=>x[0]===act()?.version)?act().version:(rel[0]?.[0]||"");
 $("ndVerBox").replaceChildren();ND.dd=dd(rel.length?rel:[["","Keine Versionen (offline?)"]],ND.version,v=>{ND.version=v;ndRender()});$("ndVerBox").append(ND.dd);
 ndRender();$("newModal").classList.remove("hidden");setTimeout(()=>$("ndName").focus(),80)}
function ndRender(){
 if(ND.loader==="forge"&&!forgeOk(ND.version))ND.loader="vanilla";const box=$("ndLoaders");box.replaceChildren();
 Object.entries(LOADERS).forEach(([k,L])=>{const dis=k==="forge"&&!forgeOk(ND.version);const b=el("button","lcard"+(ND.loader===k?" sel":"")+(dis?" dis":""));b.type="button";b.disabled=dis;
  const t=el("div","lt");t.append(ic(L.i),el("b",null,L.n));b.append(t,el("span","ld",dis?"Erst ab Minecraft 1.13.":L.d));b.onclick=()=>{ND.loader=k;ndRender()};box.append(b)});
 $("ndHint").textContent=ND.loader==="vanilla"?"":"Mods installierst du danach im Tab Mods – aus Modrinth oder CurseForge."}
const closeNew=()=>$("newModal").classList.add("hidden");
$("newBtn").onclick=openNew;$("ndCancel").onclick=closeNew;$("newModal").addEventListener("mousedown",e=>{if(e.target.id==="newModal")closeNew()});
document.addEventListener("keydown",e=>{if($("newModal").classList.contains("hidden"))return;if(e.key==="Escape")closeNew();if(e.key==="Enter"&&e.target.id==="ndName")$("ndCreate").click()});
$("ndCreate").onclick=()=>{if(!ND.version)return;const i={id:newId(),name:($("ndName").value.trim()||"Neue Instanz").slice(0,32),version:ND.version,loader:ND.loader};S.inst.push(i);S.activeId=i.id;S.justAdded=i.id;saveInst();syncVersion();updatePlay();renderInstances();closeNew();toast(`Instanz „${i.name}“ erstellt.`)};

/* ---------- Mods: Modrinth + CurseForge ---------- */
const modSort=dd([["popular","Beliebt"],["updated","Zuletzt aktualisiert"]],"popular",v=>{M.sort=v;searchMods()});$("modSortBox").append(modSort);
function renderChips(){const box=$("modChips");box.replaceChildren();if(M.src!=="modrinth")return;CATS.forEach(([v,t])=>{const b=el("button","cp"+(M.cat===v?" on":""),t);b.type="button";b.onclick=()=>{M.cat=v;renderChips();searchMods()};box.append(b)})}
const phIcon=()=>{const d=el("div","ph");d.append(ic("cube"));return d};
function modCard(m){
 const c=el("div","mod");let img;if(m.icon){img=el("img");img.alt="";img.src=m.icon;img.onerror=()=>img.replaceWith(phIcon())}else img=phIcon();
 const g=el("div","grow"),tt=el("div","t");tt.append(ib(M.src==="curseforge"?"curseforge":"modrinth"),document.createTextNode(m.title));
 g.append(tt,el("div","s",`${m.author||"?"} · ${Math.round(m.downloads||0).toLocaleString("de-DE")} Downloads`),el("div","d",m.desc||""));
 const b=el("button","mini");b.type="button";
 const paint=()=>{b.classList.toggle("go",!m.installed);b.classList.toggle("rm",!!m.installed);setLabel(b,m.installed?"Deinstallieren":"Installieren",m.installed?"trash":"download")};paint();
 b.onclick=async()=>{b.disabled=true;setLabel(b,m.installed?"Entferne …":"Lädt …");
  if(m.installed){const r=await window.gurke.modsUninstall({instanceId:S.activeId,projectId:m.id,source:M.src});if(r.ok){m.installed=false;toast(`${m.title} deinstalliert.`+(r.data.kept.length?" Mitinstallierte Abhängigkeiten bleiben erhalten.":""))}else toast(r.error,"err")}
  else{const r=await window.gurke.modsInstall({instanceId:S.activeId,projectId:m.id,source:M.src,title:m.title});if(r.ok){m.installed=true;toast(`${m.title} installiert.`);$("modHint").textContent="Installiert: "+r.data.join(", ")}else{toast(r.error,"err");$("modHint").textContent=r.error}}
  b.disabled=false;paint();c.classList.add("flash");setTimeout(()=>c.classList.remove("flash"),800);refreshCount()};
 c.append(img,g,b);return c}
function cfSetup(msg){$("cfSetup").classList.remove("hidden");$("modResults").replaceChildren();$("modHint").textContent="";if(msg)$("cfMsg").textContent=msg}
async function searchMods(){
 const a=act();if(!a||M.src==="installed")return;$("cfSetup").classList.add("hidden");
 if(M.src==="curseforge"&&!S.cfg.hasCfKey)return cfSetup();
 $("modHint").textContent="Suche …";$("modResults").replaceChildren(...Array.from({length:6},()=>{const d=el("div","mod sk");d.append(el("div","ph"),el("div","grow"));return d}));
 const r=await window.gurke.modsSearch({instanceId:a.id,q:$("modQ").value,source:M.src,sort:M.sort,category:M.cat});const box=$("modResults");box.replaceChildren();
 if(!r.ok){if(r.error==="NO_KEY")return cfSetup();if(r.error==="BAD_KEY"){S.cfg.hasCfKey=false;return cfSetup("CurseForge hat den Schlüssel abgelehnt. Bitte prüfe ihn und füge ihn neu ein.")}$("modHint").textContent=r.error;return}
 $("modHint").textContent=r.data.length?`${r.data.length} Treffer für Minecraft ${a.version}${canMod(a.loader)?" ("+loaderName(a.loader)+")":""}`:"Keine Mods für diese Version gefunden.";r.data.forEach(m=>box.append(modCard(m)));stagger(box);
}
async function renderInstalledMods(){
 const box=$("modInstalled");const r=await window.gurke.modsList({instanceId:S.activeId});box.replaceChildren();$("modCount").textContent=r.ok&&r.data.length?`(${r.data.length})`:"";
 if(!r.ok||!r.data.length){box.append(el("div","hint","Noch keine Mods installiert."));return}
 r.data.forEach(m=>{const c=el("div","mod"+(m.enabled?"":" dis"));const g=el("div","grow");g.append(el("div","t",m.name),el("div","s",(m.size/1048576).toFixed(1)+" MB · "+(m.enabled?"aktiv":"deaktiviert")));
  c.append(g,btn(m.enabled?"Ausschalten":"Einschalten","mini",async()=>{await window.gurke.modsToggle({instanceId:S.activeId,file:m.file});renderInstalledMods()}),btn("","mini danger",async()=>{if(!confirm(`${m.name} löschen?`))return;await window.gurke.modsRemove({instanceId:S.activeId,file:m.file});renderInstalledMods()},"trash"));box.append(c)});
}
const refreshCount=()=>{window.gurke.modsList({instanceId:S.activeId}).then(r=>{$("modCount").textContent=r.ok&&r.data.length?`(${r.data.length})`:"";if(M.src==="installed")renderInstalledMods()})};
function setSrc(src){M.src=src;document.querySelectorAll(".seg").forEach(x=>x.classList.toggle("active",x.dataset.src===src));const inst=src==="installed";$("browse").classList.toggle("hidden",inst);$("installedBox").classList.toggle("hidden",!inst);renderChips();if(inst)renderInstalledMods();else{$("modResults").replaceChildren();searchMods()}}
document.querySelectorAll(".seg").forEach(s=>s.onclick=()=>setSrc(s.dataset.src));
$("modGo").onclick=searchMods;$("modQ").onkeydown=e=>{if(e.key==="Enter")searchMods()};
function setLoader(l){const a=act();if(!a)return;if(l==="forge"&&!forgeOk(a.version)){toast("Forge gibt es erst ab Minecraft 1.13.","err");return}a.loader=l;saveInst();updatePlay();renderInstances();renderMods()}
$("toFabric").onclick=()=>setLoader("fabric");$("toForge").onclick=()=>setLoader("forge");
$("cfGet").onclick=()=>window.gurke.openExternal("https://console.curseforge.com/");
$("cfSave").onclick=async()=>{const k=$("cfKey").value.trim();if(!k)return;await window.gurke.setCfKey(k);$("cfKey").value="";S.cfg.hasCfKey=true;$("cfSetup").classList.add("hidden");searchMods()};
$("openMods").onclick=()=>window.gurke.openFolder({instanceId:S.activeId,sub:"mods"});
$("openShots").onclick=()=>window.gurke.openFolder({instanceId:S.activeId,sub:"screenshots"});
$("openSaves").onclick=()=>window.gurke.openFolder({instanceId:S.activeId,sub:"saves"});
function renderMods(){const a=act();if(!a)return;$("modsFor").textContent=`${a.name} · Minecraft ${a.version} · ${loaderName(a.loader)}`;$("modsNotice").classList.toggle("hidden",canMod(a.loader));refreshCount();setSrc(M.src)}

/* ---------- Server ---------- */
const hosts=()=>[...DEFAULT_SERVERS,...(S.cfg.servers||[]).filter(h=>!DEFAULT_SERVERS.includes(h))];
function icon(h,d,cls){if(d?.icon){const i=el("img",cls);i.alt="";i.src=d.icon;return i}return el("div",(cls||"")+" ph",h[0].toUpperCase())}
function playersText(d){return d?(d.online?`${d.players.online.toLocaleString("de-DE")} / ${d.players.max.toLocaleString("de-DE")} online`:"Offline"):"Lade …"}
function renderQuick(){const q=$("quick");q.replaceChildren();hosts().slice(0,8).forEach(h=>{const d=S.srv[h],b=el("button","qbtn");b.type="button";b.title=`${h} – ${playersText(d)} · klicken zum Beitreten`;if(d?.icon){const i=el("img");i.alt="";i.src=d.icon;b.append(i)}else b.textContent=h[0].toUpperCase();b.onclick=()=>play(h);q.append(b)})}
function renderMini(){const box=$("srvMini");box.replaceChildren();hosts().slice(0,7).forEach(h=>{const d=S.srv[h],r=el("div","sr"+(d?(d.online?" on":" off"):""));const g=el("div","g");g.append(el("div","n",h));const s=el("div","s");s.append(el("span","dot"),playersText(d));g.append(s);
 const j=el("button","j");j.type="button";j.append(ic("play"));j.title="Beitreten";j.onclick=()=>play(h);r.append(icon(h,d),g,j);box.append(r)})}
function renderServers(){
 const box=$("serverList");box.replaceChildren();
 hosts().forEach(h=>{const d=S.srv[h],custom=!DEFAULT_SERVERS.includes(h);
  const c=el("div","card2 srv"+(d?(d.online?" on":" off"):""));const top=el("div","top2");const t=el("div");t.append(el("div","t",h));const p=el("div","s");p.append(el("span","dot"),playersText(d));t.append(p);top.append(icon(h,d),t);
  c.append(top,el("div","motd",d?(d.online?(d.motd||"Kein MOTD"):"Nicht erreichbar"):"…"));
  const b=el("div","btns");b.append(btn("Beitreten","mini go",()=>play(h),"play"),btn("IP kopieren","mini",()=>{navigator.clipboard?.writeText(h);status(h+" kopiert.")},"copy"));
  if(custom)b.append(btn("","mini danger",()=>{S.cfg.servers=(S.cfg.servers||[]).filter(x=>x!==h);window.gurke.setCfg({servers:S.cfg.servers});renderAll()},"trash"));
  c.append(b);box.append(c)});
}
const renderAll=()=>{renderQuick();renderMini();renderServers()};
let refreshing=false;
async function refreshServers(){if(refreshing)return;refreshing=true;for(const h of hosts()){const r=await window.gurke.serverStatus(h);S.srv[h]=r.ok?r.data:{online:false,players:{online:0,max:0},motd:"",icon:""};renderAll()}refreshing=false}
$("srvAdd").onclick=()=>{const h=$("srvNew").value.trim().toLowerCase();if(!/^[a-z0-9]([a-z0-9.-]{0,251}[a-z0-9])?(:\d{1,5})?$/.test(h))return status("Ungültige Server-Adresse.");S.cfg.servers=[...new Set([...(S.cfg.servers||[]),h])];window.gurke.setCfg({servers:S.cfg.servers});$("srvNew").value="";renderAll();refreshServers()};
function onView(v){if(v==="mods")renderMods();if(v==="servers"||v==="home")renderAll()}
setInterval(()=>{if(!document.hidden)refreshServers()},60000);

/* ---------- Start ---------- */
$("updateBtn").onclick=()=>window.gurke.openSite();
async function play(join){if(!S.account)return status("Bitte zuerst mit Microsoft anmelden.");if(!act()?.version)return;await window.gurke.setCfg(collectSettings());setRun("loading");$("log").textContent="";$("bar").style.width="0";status(typeof join==="string"?`Starte und verbinde mit ${join} …`:"Starte … (beim ersten Mal werden Dateien geladen)");const r=await window.gurke.play({instanceId:S.activeId,ram:+$("ram").value,join:typeof join==="string"?join:""});if(!r.ok){setRun("idle");status(r.error);toast(r.error,"err")}else{setRun("running");status(`Minecraft startet mit Java ${r.java} als „Gurke Client ${act().version}“.`)}}
$("playBtn").onclick=()=>play();
window.gurke.on("game:progress",p=>{if(p.total)$("bar").style.width=Math.min(100,p.task/p.total*100)+"%";status(`Lade ${p.type} (${p.task}/${p.total})`)});
window.gurke.on("game:log",t=>{log(t);if(/Launching with arguments/i.test(t))status("Minecraft startet …")});
window.gurke.on("game:closed",async code=>{S.cfg=await window.gurke.getCfg();renderInstances();setRun("idle");$("bar").style.width="0";status(code===0?"Minecraft beendet.":`Minecraft beendet (Code ${code}). Siehe Konsole.`)});
(async function init(){
 const cfg=await window.gurke.getCfg();S.cfg=cfg;applyCfg(cfg);
 S.inst=(cfg.instances||[]).filter(i=>i&&/^[a-z0-9]+$/i.test(i.id));
 try{S.versions=await window.gurke.versions(true)}catch{status("Versionsliste konnte nicht geladen werden (Internet?).")}
 const latest=S.versions.find(v=>v.type==="release")?.id||"";
 if(!S.inst.length)S.inst=[{id:newId(),name:"Standard",version:cfg.version||latest,loader:"vanilla"}];
 S.inst.forEach(i=>{if(!i.version)i.version=latest});
 S.activeId=S.inst.some(i=>i.id===cfg.activeInstance)?cfg.activeInstance:S.inst[0].id;saveInst();
 syncVersion();updatePlay();renderInstances();renderAll();renderChips();refreshServers();
 const s=await window.gurke.status();setAccount(s.ok?s.account:null);status(s.ok?`Willkommen zurück, ${s.account.name}!`:"Bereit.");
 if(cfg.launcher?.checkUpdates!==false){const u=await window.gurke.checkUpdate();if(u.ok&&u.data.newer){$("updateText").textContent=`Neue Version ${u.data.latest} verfügbar.`;$("updateBanner").classList.remove("hidden")}}
})();
