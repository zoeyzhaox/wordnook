import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {currentNewLimit,dailyProgress,initialState,phraseWordIndex,queue,transition,validateState} from '../src/core.js';
import {createStore,RecoveryRequired,restoreDamagedStore} from '../electron/store.js';
import {openLearningStore} from '../electron/recovery.js';

const now=new Date(2026,9,13,12).getTime();
const tomorrow=new Date(2026,9,14,12).getTime();
const next=(state,action)=>transition(state,action,now).state;
const entry=word=>({word,meaning:'释义',phrase:word+' now',phraseZh:'搭配',example:word,exampleZh:'例句'});
const letters=i=>(i>=26?letters(Math.floor(i/26)-1):'')+String.fromCharCode(97+i%26);
function paths(t){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'wordnook-recovery-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  return {dir,file:path.join(dir,'learning.json')};
}

test('reduce a frozen ten-word quota, finish task after restarting, apply five tomorrow',()=>{
  let state=next(initialState(),{type:'review',id:'abundant',rating:4});
  const changed=transition(state,{type:'settings',patch:{newLimit:5}},now);
  assert.deepEqual(changed.result,{todayLimit:10,nextLimit:5,deferred:true});
  state=validateState(JSON.parse(JSON.stringify(changed.state)));
  for(const word of queue(state,now)) state=next(state,{type:'review',id:word.id,rating:4});
  assert.equal(dailyProgress(state,now).paid,true);
  assert.equal(queue(state,now).length,0);
  assert.equal(currentNewLimit(state,tomorrow),5);
  assert.equal(queue(state,tomorrow).filter(w=>!state.cards[w.id]).length,5);
  const fresh=transition(initialState(),{type:'settings',patch:{newLimit:5}},now);
  assert.equal(fresh.result.deferred,false);
  assert.equal(queue(fresh.state,now).length,5);
});

test('5000 plus 1 imports survive backup restore and the normal desktop restart',t=>{
  const {file}=paths(t),store=createStore(file);
  const batch=Array.from({length:5000},(_,i)=>entry('sample'+letters(i)));
  const list=store.act({type:'import',words:batch});
  assert.equal(list.result.importedIds.length,5000);
  const second=store.act({type:'import',words:[batch[0],entry('anotherterm')]});
  assert.equal(second.result.skipped,1);
  assert.equal(second.result.imported,1);
  const backup=JSON.parse(JSON.stringify(store.get()));
  assert.equal(next(initialState(),{type:'restore',state:backup}).customWords.length,5001);
  assert.equal(createStore(file).get().customWords.length,5001);
  assert.throws(()=>store.act({type:'import',words:batch.concat(entry('extra'))}),/5000/);
});

test('new imports require a complete term and report index, word and field; legacy records remain readable',()=>{
  assert.equal(phraseWordIndex('Artificial art.','art'),11);
  assert.equal(phraseWordIndex('The state-of-the-art design','art'),-1);
  assert.equal(phraseWordIndex("It isn't easy","isn't"),3);
  assert.equal(phraseWordIndex("We read ‘art’ today","art"),9);
  const bad={...entry('art'),phrase:'artificial light'};
  assert.throws(()=>next(initialState(),{type:'import',words:[entry('sample'),bad]}),/第 2 条（art）.*完整单词/);
  assert.throws(()=>next(initialState(),{type:'import',words:[entry('sample'),{...entry('typo'),exampleZh:''}]}),/第 2 条（typo）.*例句中文译文/);
  const legacy=initialState();
  legacy.customWords=[{...bad,id:'custom:art'}];
  assert.equal(validateState(legacy).customWords[0].word,'art');
});

test('corrupt primary and fallback stay intact across cancel, invalid selection and confirmed recovery',async t=>{
  const {dir,file}=paths(t);
  fs.writeFileSync(file,'damaged primary');
  fs.writeFileSync(file+'.bak','damaged fallback');
  assert.throws(()=>createStore(file),RecoveryRequired);
  assert.throws(()=>restoreDamagedStore(file,{schema:0},false));
  assert.equal(fs.readFileSync(file,'utf8'),'damaged primary');
  assert.equal(await openLearningStore(file,{showMessageBox:async()=>({response:1})},false),null);
  const backup=next(initialState(),{type:'review',id:'abundant',rating:4});
  const external=path.join(dir,'manual.json');
  fs.writeFileSync(external,JSON.stringify(backup));
  const choices=[0,0,1],files=[file,external];
  const messages=[];
  const dialog={
    showMessageBox:async options=>{messages.push(options);return {response:choices.shift()};},
    showOpenDialog:async()=>({filePaths:[files.shift()],canceled:false})
  };
  const recovered=await openLearningStore(file,dialog,true);
  assert.equal(messages.length,3);
  assert.match(messages[1].detail,/未完成恢复/);
  assert.equal(recovered.get().history.length,1);
  assert.equal(recovered.get().settings.launchAtLogin,true);
  assert.equal(createStore(file).get().history.length,1);
  const originals=fs.readdirSync(dir).filter(f=>f.includes('.corrupt-')).map(f=>fs.readFileSync(path.join(dir,f),'utf8'));
  assert.deepEqual(originals.sort(),['damaged fallback','damaged primary']);
  fs.writeFileSync(file,'another damaged primary');
  const automatic=createStore(file);
  assert.equal(automatic.recovered,true);
  assert.equal(automatic.get().history.length,1);
});

test('legacy save with an already lowered limit can finish the frozen task after upgrade',()=>{
  let state=next(initialState(),{type:'review',id:'abundant',rating:4});
  const date=Object.keys(state.daily)[0];
  for(const word of queue(state,now).slice(0,4)) state=next(state,{type:'review',id:word.id,rating:4});
  delete state.daily[date].effectiveNewLimit;
  state.settings.newLimit=5;
  state=validateState(JSON.parse(JSON.stringify(state)));
  assert.equal(currentNewLimit(state,now),10);
  assert.equal(queue(state,now).length,5);
  for(const word of queue(state,now))state=next(state,{type:'review',id:word.id,rating:4});
  assert.equal(dailyProgress(state,now).paid,true);
  assert.equal(state.daily[date].effectiveNewLimit,10);
  assert.equal(currentNewLimit(state,tomorrow),5);
});

test('optional extra slots are reserved for frozen target IDs, remain local to the day and never pay twice',()=>{
  let s=initialState();
  const custom=Array.from({length:12},(_,i)=>entry('ownword'+letters(i)));
  s=next(s,{type:'import',words:custom});
  s=next(s,{type:'review',id:'abundant',rating:4});
  s=next(s,{type:'settings',patch:{deck:'custom'}});
  for(const word of queue(s,now))s=next(s,{type:'review',id:word.id,rating:4});
  assert.equal(queue(s,now).length,0);
  assert.equal(dailyProgress(s,now).done,1);
  const granted=transition(s,{type:'allowTaskWords',showAll:true},now);
  assert.equal(granted.result.ids.length,9);
  s=validateState(granted.state);
  assert.equal(s.settings.deck,'all');
  assert.equal(s.settings.newLimit,10);
  assert.throws(()=>next(s,{type:'allowTaskWords',showAll:true}));
  const unrelated=transition(s,{type:'review',id:'custom:ownwordl',rating:4},now);
  assert.equal(unrelated.result.scheduled,false);
  const remaining=queue(s,now);
  assert.deepEqual(new Set(remaining.map(w=>w.id)),new Set(granted.result.ids));
  for(const word of remaining)s=next(s,{type:'review',id:word.id,rating:4});
  assert.equal(s.coins,6);
  assert.equal(queue(s,now).length,0);
  assert.equal(queue(s,tomorrow).filter(w=>!s.cards[w.id]).length,10);
});
