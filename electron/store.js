import fs from 'node:fs';
import path from 'node:path';
import {initialState,validateState,transition} from '../src/core.js';
export function createStore(file) {
  fs.mkdirSync(path.dirname(file),{recursive:true});
  let state=initialState(),recovered=false;
  if(fs.existsSync(file)) {
    try {state=validateState(JSON.parse(fs.readFileSync(file,'utf8')));} catch {
      fs.copyFileSync(file,`${file}.corrupt-${Date.now()}`);
      if(fs.existsSync(`${file}.bak`)) {state=validateState(JSON.parse(fs.readFileSync(`${file}.bak`,'utf8')));recovered=true;}
      else throw Error('学习数据损坏，已保留原文件。请从手动备份恢复。');
    }
  }
  function save(next) {
    const temp=`${file}.tmp`,fd=fs.openSync(temp,'w',0o600);
    try{fs.writeFileSync(fd,JSON.stringify(next));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
    if(fs.existsSync(file)&&!recovered) fs.copyFileSync(file,`${file}.bak`);
    fs.renameSync(temp,file);recovered=false;state=next;
  }
  return {get:()=>structuredClone(state),act:(action,now)=>{const r=transition(state,action,now);save(r.state);return r;},recovered};
}
