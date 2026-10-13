const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktop',{
  getState:()=>ipcRenderer.invoke('state:get'),
  act:action=>ipcRenderer.invoke('state:act',action),
  window:command=>ipcRenderer.invoke('window:command',command),
  displays:()=>ipcRenderer.invoke('displays:get'),
  exportBackup:()=>ipcRenderer.invoke('backup:export'),
  onState:callback=>{const handler=(_,s)=>callback(s);ipcRenderer.on('state:changed',handler);return ()=>ipcRenderer.removeListener('state:changed',handler);},
});
