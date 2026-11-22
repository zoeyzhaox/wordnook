import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import {initialState,validateState,transition} from '../src/core.js';

export class RecoveryRequired extends Error {}

const readState=file=>validateState(JSON.parse(fs.readFileSync(file,'utf8')));
function preserveOriginal(file){
  if(fs.existsSync(file)) fs.copyFileSync(file,`${file}.corrupt-${randomUUID()}`,fs.constants.COPYFILE_EXCL);
}

function writeAtomic(file,state,backupPrevious=false){
  const temp=`${file}.tmp-${randomUUID()}`;
  try{
    const fd=fs.openSync(temp,'wx',0o600);
    try{fs.writeFileSync(fd,JSON.stringify(state));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
    if(backupPrevious&&fs.existsSync(file)) fs.copyFileSync(file,`${file}.bak`);
    fs.renameSync(temp,file);
  }finally{
    fs.rmSync(temp,{force:true});
  }
}

export function restoreDamagedStore(file,backup,loginEnabled){
  const state=validateState(backup);
  state.settings.launchAtLogin=loginEnabled;
  preserveOriginal(file);
  preserveOriginal(`${file}.bak`);
  // Install a usable fallback before promoting the manually selected backup.
  writeAtomic(`${file}.bak`,state);
  writeAtomic(file,state);
  return createStore(file);
}

export function createStore(file) {
  fs.mkdirSync(path.dirname(file),{recursive:true});
  let state=initialState(),recovered=false;
  const backup=`${file}.bak`;
  if(fs.existsSync(file)||fs.existsSync(backup)){
    try{state=readState(file);}
    catch{
      try{state=readState(backup);}
      catch{throw new RecoveryRequired('当前学习记录和自动备份均无法读取。');}
      preserveOriginal(file);
      writeAtomic(file,state);
      recovered=true;
    }
  }
  return {
    get:()=>structuredClone(state),
    act:(action,now)=>{
      const result=transition(state,action,now);
      writeAtomic(file,result.state,true);
      state=result.state;
      return result;
    },
    recovered
  };
}
