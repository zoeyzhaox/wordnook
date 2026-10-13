import {app,BrowserWindow,ipcMain,screen,Tray,Menu,nativeImage,globalShortcut,dialog,nativeTheme} from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createStore} from './store.js';
const here=path.dirname(fileURLToPath(import.meta.url));
let main,widget,tray,store,quitting=false,snoozeTimer,resizeTimer;
const dev=process.env.WORDNOOK_DEV==='1';
if(process.env.WORDNOOK_DATA_DIR) app.setPath('userData',process.env.WORDNOOK_DATA_DIR);
const locked=app.requestSingleInstanceLock();
if(!locked) app.quit();
else {
 app.on('second-instance',()=>showMain());
 app.whenReady().then(()=>{
  try{store=createStore(path.join(app.getPath('userData'),'learning.json'));}
  catch(err){dialog.showErrorBox('拾词数据读取失败',err.message);app.quit();return;}
  nativeTheme.themeSource='system';
  createWindows();createTray();bindIPC();applySettings();
  if(store.recovered) dialog.showMessageBox(main,{type:'warning',message:'已从自动备份恢复学习记录',detail:'损坏的原文件已保留。最近一次操作可能未恢复。'});
  const login=app.isPackaged&&app.getLoginItemSettings().wasOpenedAtLogin;
  if(!login) showMain();
  globalShortcut.register('CommandOrControl+Shift+W',()=>toggleWidget());
  screen.on('display-removed',()=>positionWidget());screen.on('display-metrics-changed',()=>positionWidget());
 }).catch(err=>{dialog.showErrorBox('拾词启动失败',err.message);app.quit();});
}
function createWindows(){
 const prefs={preload:path.join(here,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true};
 main=new BrowserWindow({width:1180,height:800,minWidth:900,minHeight:680,show:false,title:'拾词 · Wordnook',backgroundColor:'#ffffff',titleBarStyle:'hiddenInset',webPreferences:prefs});
 widget=new BrowserWindow({width:store.get().settings.widgetWidth,height:store.get().settings.widgetHeight,minWidth:200,minHeight:112,maxWidth:640,maxHeight:760,show:false,frame:false,transparent:false,resizable:true,maximizable:false,skipTaskbar:true,alwaysOnTop:true,backgroundColor:'#ffffff',webPreferences:prefs});
 widget.setAlwaysOnTop(true,'floating');widget.setVisibleOnAllWorkspaces(true,{visibleOnFullScreen:true,skipTransformProcessType:true});
 for(const [win,mode] of [[main,'main'],[widget,'widget']]){
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',e=>e.preventDefault());
  win.on('close',e=>{if(!quitting){e.preventDefault();win.hide();}});
  if(dev) win.loadURL(`http://127.0.0.1:5173/?mode=${mode}`);else win.loadFile(path.join(here,'../dist/index.html'),{query:{mode}});
 }
 nativeTheme.on('updated',()=>widget.setBackgroundColor(nativeTheme.shouldUseDarkColors?'#202124':'#ffffff'));
 widget.setBackgroundColor(nativeTheme.shouldUseDarkColors?'#202124':'#ffffff');
 widget.on('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(quitting)return;const [width,height]=widget.getSize();const p=store.get().settings;if(width!==p.widgetWidth||height!==p.widgetHeight){store.act({type:'settings',patch:{widgetWidth:Math.max(200,Math.min(640,width)),widgetHeight:Math.max(112,Math.min(760,height))}});broadcast();}positionWidget();},300);});
 widget.on('ready-to-show',()=>{if(store.get().settings.widget)widget.showInactive();});
}
function showMain(){if(main){main.show();main.focus();}}
function positionWidget(){if(!widget)return;const p=store.get().settings;const display=screen.getAllDisplays().find(d=>String(d.id)===p.display)||screen.getPrimaryDisplay();const a=display.workArea;let [w,h]=widget.getSize();const fitW=Math.max(200,Math.min(w,a.width-32)),fitH=Math.max(112,Math.min(h,a.height-32));if(fitW!==w||fitH!==h){widget.setSize(fitW,fitH);w=fitW;h=fitH;}const x=p.corner.endsWith('right')?a.x+a.width-w-16:a.x+16;const y=p.corner.startsWith('bottom')?a.y+a.height-h-16:a.y+16;widget.setPosition(Math.max(a.x,x),Math.max(a.y,y));}
function applySettings(){const p=store.get().settings;const [w,h]=widget.getSize();if(w!==p.widgetWidth||h!==p.widgetHeight)widget.setSize(p.widgetWidth,p.widgetHeight);positionWidget();widget.setOpacity(p.opacity);if(p.widget&&!snoozeTimer)widget.showInactive();else widget.hide();if(app.isPackaged&&['darwin','win32'].includes(process.platform))app.setLoginItemSettings({openAtLogin:p.launchAtLogin,openAsHidden:true});}
function broadcast(){const s=store.get();for(const win of [main,widget])if(win&&!win.isDestroyed())win.webContents.send('state:changed',s);}
function toggleWidget(){clearTimeout(snoozeTimer);snoozeTimer=null;store.act({type:'settings',patch:{widget:!widget.isVisible()}});applySettings();broadcast();}
function createTray(){
 const icon=nativeImage.createFromPath(path.join(here,'../resources/trayTemplate.png'));
 icon.setTemplateImage(true);tray=new Tray(icon);tray.setTitle(process.platform==='darwin'?'拾词':'');tray.setToolTip('拾词 Wordnook');
 tray.setContextMenu(Menu.buildFromTemplate([{label:'打开拾词',click:showMain},{label:'显示 / 隐藏悬浮窗  ⇧⌘W',click:toggleWidget},{type:'separator'},{label:'退出拾词',click:()=>app.quit()}]));tray.on('click',showMain);
 Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'拾词',submenu:[{label:'打开拾词',click:showMain},{role:'about'},{type:'separator'},{role:'quit'}]},{role:'editMenu'},{role:'windowMenu'}]));
}
function bindIPC(){
 const allow=e=>{if(![main?.webContents,widget?.webContents].includes(e.sender)||e.senderFrame!==e.sender.mainFrame)throw Error('无效窗口');};
 ipcMain.handle('state:get',e=>{allow(e);return store.get();});
 ipcMain.handle('state:act',(e,action)=>{allow(e);if(JSON.stringify(action).length>20_000_000)throw Error('文件过大');if(action.type==='settings'&&action.patch?.launchAtLogin&&!app.isPackaged)throw Error('请先安装打包版，再启用开机启动');const r=store.act(action);if(['settings','restore'].includes(action.type))applySettings();broadcast();return r;});
 ipcMain.handle('window:command',(e,command)=>{allow(e);if(command==='main')showMain();else if(command==='toggle')toggleWidget();else if(command==='snooze'){widget.hide();clearTimeout(snoozeTimer);snoozeTimer=setTimeout(()=>{snoozeTimer=null;if(store.get().settings.widget)widget.showInactive();},15*60*1000);}else throw Error('无效窗口操作');});
 ipcMain.handle('displays:get',e=>{allow(e);return screen.getAllDisplays().map((d,i)=>({id:String(d.id),label:d.label||`显示器 ${i+1}`}));});
 ipcMain.handle('backup:export',async e=>{allow(e);const {filePath,canceled}=await dialog.showSaveDialog(main,{defaultPath:`wordnook-backup-${new Date().toISOString().slice(0,10)}.json`,filters:[{name:'JSON',extensions:['json']}]});if(canceled)return false;fs.writeFileSync(filePath,JSON.stringify(store.get(),null,2),{mode:0o600});return true;});
}
app.on('activate',showMain);app.on('window-all-closed',()=>{});app.on('before-quit',()=>{quitting=true;clearTimeout(snoozeTimer);clearTimeout(resizeTimer);});app.on('will-quit',()=>globalShortcut.unregisterAll());
