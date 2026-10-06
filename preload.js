const { contextBridge, ipcRenderer } = require("electron");
const inv=(ch,a)=>ipcRenderer.invoke(ch,a);
contextBridge.exposeInMainWorld("gurke", {
  status:()=>inv("auth:status"),login:()=>inv("auth:login"),logout:()=>inv("auth:logout"),
  versions:s=>inv("versions:list",s),getCfg:()=>inv("cfg:get"),setCfg:p=>inv("cfg:set",p),
  detectJava:()=>inv("java:detect"),play:o=>inv("game:play",o),
  openFolder:o=>inv("open:folder",o),openSite:()=>inv("open:site"),openExternal:u=>inv("open:external",u),setCfKey:k=>inv("cf:setKey",k),
  modsSearch:a=>inv("mods:search",a),modsInstall:a=>inv("mods:install",a),modsList:a=>inv("mods:list",a),modsUninstall:a=>inv("mods:uninstall",a),
  modsToggle:a=>inv("mods:toggle",a),modsRemove:a=>inv("mods:remove",a),
  serverStatus:host=>inv("servers:status",{host}),checkUpdate:()=>inv("update:check"),
  on:(ch,fn)=>ipcRenderer.on(ch,(_e,d)=>fn(d))
});
