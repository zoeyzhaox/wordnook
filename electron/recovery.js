import fs from 'node:fs';
import path from 'node:path';
import {validateState} from '../src/core.js';
import {createStore,RecoveryRequired,restoreDamagedStore} from './store.js';

export async function openLearningStore(file,dialog,loginEnabled){
  try{return createStore(file);}
  catch(error){if(!(error instanceof RecoveryRequired))throw error;}
  let detail=`记录保存在 ${path.dirname(file)}。可以选择以前导出的 Wordnook JSON 备份，或退出后再处理。原文件会保留。`;
  for(;;){
    const choice=await dialog.showMessageBox({type:'warning',message:'学习记录需要恢复',detail,buttons:['选择手动备份…','退出拾词'],defaultId:0,cancelId:1});
    if(choice.response!==0) return null;
    const picker=await dialog.showOpenDialog({title:'选择 Wordnook 学习备份',properties:['openFile'],filters:[{name:'Wordnook JSON 备份',extensions:['json']}]});
    if(picker.canceled||!picker.filePaths.length) continue;
    const selected=picker.filePaths[0];
    try{
      const state=validateState(JSON.parse(fs.readFileSync(selected,'utf8')));
      const confirm=await dialog.showMessageBox({type:'question',message:'使用这份备份恢复拾词？',detail:`${path.basename(selected)}\n自建单词 ${state.customWords.length} 个，学习记录 ${state.history.length} 条。损坏的原文件将另存于原目录。`,buttons:['返回选择','恢复并打开'],defaultId:0,cancelId:0});
      if(confirm.response===1) return restoreDamagedStore(file,state,loginEnabled);
    }catch(error){detail=`未完成恢复：${error.message}。可以再选一份备份。原有记录仍然保留。`;}
  }
}
