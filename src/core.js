import { createEmptyCard, fsrs } from 'ts-fsrs';
import { THEMES, STICKERS, rewardPrice } from './rewards.js';
import { WORDS } from './words.js';

export const scheduler = fsrs({request_retention:0.9, maximum_interval:365, enable_fuzz:false, learning_steps:['1m','10m'], relearning_steps:['10m']});
export const dayKey = (now = Date.now()) => { const d=new Date(now); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export const initialState = () => ({schema:1,revision:0,cards:{},history:[],coins:0,tickets:0,rewarded:{},daily:{},customWords:[],favorites:[],unlocks:[],game:null,settings:{corner:'top-right',display:'primary',opacity:1,launchAtLogin:false,widget:true,newLimit:10,rotateSeconds:60,theme:'paper',sound:false,deck:'all',voice:'',accent:'en-US',sticker:'none',reduceMotion:false,widgetWidth:330,widgetHeight:432}});
export const wordsFor = s => {const custom=new Set(s.customWords.map(w=>w.word.toLowerCase()));return [...WORDS.filter(w=>!custom.has(w.word.toLowerCase())),...s.customWords.map(w=>({...w,decks:WORDS.find(b=>b.word.toLowerCase()===w.word.toLowerCase())?.decks||[]}))];};
export const deckWords = s => wordsFor(s).filter(w=>s.settings.deck==='all'||(s.settings.deck==='custom'?w.id.startsWith('custom:'):w.decks?.includes(s.settings.deck)));
const own = (o,k) => Object.hasOwn(o,k);
const normalizedCard = c => ({...c,due:new Date(c.due),...(c.last_review?{last_review:new Date(c.last_review)}:{})});
export function currentNewLimit(s,now=Date.now()) {
  const limit=s.settings.newLimit,day=s.daily[dayKey(now)];
  if(!day?.task) return limit;
  if(day.effectiveNewLimit!==undefined) return day.effectiveNewLimit;
  // Older versions stored the frozen word IDs but no snapshot of the quota.
  if(day.task.ids.length<=limit&&day.newCount<=limit) return limit;
  const midnight=new Date(now).setHours(0,0,0,0);
  const firstReview=new Map();
  for(const {id,at} of s.history){
    if(!firstReview.has(id)||at<firstReview.get(id)) firstReview.set(id,at);
  }
  const originallyNew=day.task.ids.filter(id=>!s.cards[id]||firstReview.get(id)>=midnight).length;
  return Math.min(100,Math.max(limit,originallyNew,day.newCount));
}
function regularSlotsLeft(s,day,now) {
  const usedExtras=day?.taskExtraIds?.filter(id=>s.cards[id]).length||0;
  return Math.max(0,currentNewLimit(s,now)-(day?.newCount||0)+usedExtras);
}
export function blockedTaskIds(s,now=Date.now()){
  const day=s.daily[dayKey(now)];
  if(!day?.task||day.task.paid||regularSlotsLeft(s,day,now)>0) return [];
  return day.task.ids.filter(id=>!s.cards[id]&&!day.taskExtraIds?.includes(id));
}
export function queue(s,now=Date.now()) {
  const ws=deckWords(s),due=ws.filter(w=>s.cards[w.id]&&+new Date(s.cards[w.id].due)<=now).sort((a,b)=>new Date(s.cards[a.id].due)-new Date(s.cards[b.id].due));
  const day=s.daily[dayKey(now)],extras=new Set(day?.taskExtraIds||[]);
  const fresh=ws.filter(w=>!s.cards[w.id]);
  return [...due,...fresh.filter(w=>extras.has(w.id)),...fresh.filter(w=>!extras.has(w.id)).slice(0,regularSlotsLeft(s,day,now))];
}
export function stats(s,now=Date.now()) {
  const ws=wordsFor(s),cards=Object.values(s.cards),today=s.daily[dayKey(now)]||{reviews:0,newCount:0,words:[]};
  return {total:ws.length,seen:cards.length,due:cards.filter(c=>+new Date(c.due)<=now).length,stable:cards.filter(c=>c.scheduled_days>=21).length,today,queue:queue(s,now).length};
}
export function intervals(s,id,now=Date.now()) {
  const results=scheduler.repeat(s.cards[id]?normalizedCard(s.cards[id]):createEmptyCard(new Date(now)),new Date(now));
  return [1,2,3,4].map(r=>({rating:r,ms:+results[r].card.due-now}));
}
function review(s,id,rating,source,now) {
  if(!wordsFor(s).some(w=>w.id===id)||![1,2,3,4].includes(rating)) throw Error('无效的学习记录');
  ensureDailyTask(s,now);
  const old=s.cards[id];
  // A second window or repeat practice cannot reschedule a card before its due time.
  if(old && +new Date(old.due)>now) return {scheduled:false,reward:0};
  const key=dayKey(now);
  const day=s.daily[key] ||= {reviews:0,newCount:0,words:[]};
  if(!old && !day.taskExtraIds?.includes(id) && regularSlotsLeft(s,day,now)===0) return {scheduled:false,reward:0};
  const result=scheduler.next(old?normalizedCard(old):createEmptyCard(new Date(now)),new Date(now),rating);
  s.cards[id]=JSON.parse(JSON.stringify(result.card));
  s.history.push({id,rating,source,at:now,log:JSON.parse(JSON.stringify(result.log))});
  day.reviews++; if(!old) day.newCount++;
  if(!day.words.includes(id)) day.words.push(id);
  let reward=0;
  const task=day.task;
  if(rating>=2&&task.ids.includes(id)&&!task.done.includes(id))task.done.push(id);
  if(task.ids.length&&task.done.length===task.ids.length&&!task.paid){task.paid=true;s.coins+=6;reward=6;}
  return {scheduled:true,reward};
}
const shuffle = arr => arr.map(x=>({x,r:Math.random()})).sort((a,b)=>a.r-b.r).map(v=>v.x);
export function spellingPrompt(word,round){
 const letters=[...word].map((c,i)=>/[a-z]/i.test(c)?i:-1).filter(i=>i>=0);
 const hidden=round===0?letters.slice(-Math.min(2,Math.max(1,letters.length-1))):round===1?letters.slice(1):letters;
 return {mask:[...word].map((c,i)=>hidden.includes(i)?'_':c).join(''),answer:hidden.map(i=>word[i]).join(''),hidden};
}
export function ensureDailyTask(s,now=Date.now()){
 const d=s.daily[dayKey(now)]||={reviews:0,newCount:0,words:[]};
 const effective=currentNewLimit(s,now);
 d.task||={ids:queue(s,now).map(w=>w.id),done:[],paid:false};
 d.effectiveNewLimit=effective;
 return d;
}
export function dailyProgress(s,now=Date.now()) {const d=s.daily[dayKey(now)],t=d?.task;return {target:t?.ids.length??queue(s,now).length,done:t?.done.length||0,paid:!!t?.paid,games:d?.rewardGames?.length||0};}
export function gamePool(s,now=Date.now(),mixSeen=false){
  const due=queue(s,now),dueIds=new Set(due.map(w=>w.id));
  const seen=deckWords(s).filter(w=>s.cards[w.id]&&!dueIds.has(w.id));
  return [...due,...(mixSeen?shuffle(seen):seen)];
}
function settleGame(s,g,now){
  if(g.settled)return;
  g.finishBonus=g.retry?0:completeGameReward(s,g,now);
  g.earned+=g.finishBonus;
  g.settled=true;
}
function gameBonus(){return 0;}
function completeGameReward(s,g,now){const d=s.daily[dayKey(now)]||={reviews:0,newCount:0,words:[]};d.rewardGames||=[];if(d.rewardGames.includes(g.id)||d.rewardGames.length>=2)return 0;const valid=g.mode==='memory'?g.score>=2:g.questions.length>=4&&g.score>=Math.ceil(g.questions.length/2);if(!valid)return 0;d.rewardGames.push(g.id);s.coins+=2;return 2;}
function makeBoard(g){const ids=g.pool.slice(0,[2,4,6][g.level]);g.board=shuffle(ids.flatMap(id=>[{id,side:'en'},{id,side:'zh'}]));g.open=[];g.matched=[];g.feedback=null;g.stageComplete=false;g.stageBonus=0;}
// Match whole English terms; a substring of a larger word or compound is not a spelling prompt.
export function phraseWordIndex(phrase,word) {
  const text=phrase.toLowerCase(),term=word.toLowerCase();
  if(!term) return -1;
  const wordPart=c=>!!c && /[\p{L}\p{N}_]/u.test(c);
  const connector=c=>c==="'" || c==="’" || c==='-';
  let start=text.indexOf(term);
  while(start!==-1){
    const end=start+term.length;
    const before=text[start-1],after=text[end];
    const joinedBefore=connector(before)&&wordPart(text[start-2]);
    const joinedAfter=connector(after)&&wordPart(text[end+1]);
    if(!wordPart(before)&&!wordPart(after)&&!joinedBefore&&!joinedAfter) return start;
    start=text.indexOf(term,start+1);
  }
  return -1;
}
function cleanWords(input,s,validating=false) {
  if(!Array.isArray(input)||input.length<1||(!validating&&input.length>5000)) throw Error('每次请导入 1–5000 个词条');
  const required=['word','meaning','phrase','phraseZh','example','exampleZh'];
  const existing=new Set(validating?[]:wordsFor(s).map(w=>w.word.toLowerCase()));
  const labels={word:'单词',meaning:'中文释义',phrase:'英文搭配',phraseZh:'搭配译文',example:'英文例句',exampleZh:'例句中文译文'};
  const result=[], errors=[];
  for (const [index,row] of input.entries()) {
    const word=typeof row?.word==='string' ? row.word.trim() : '';
    const where='第 '+(index+1)+' 条'+(word?'（'+word.slice(0,40)+'）':'');
    const issues=[];
    let phraseTooLong=false;
    if (!row || typeof row!=='object' || Array.isArray(row)) {
      issues.push('词条格式不正确');
    } else {
      for (const key of required) {
        const value=row[key];
        if (typeof value!=='string' || !value.trim()) {
          issues.push('缺少'+labels[key]+'（'+key+'）');
        } else if (key!=='word' && value.length>1000) {
          const characters=Array.from(value).length;
          if (characters>1000) {
            issues.push(labels[key]+'（'+key+'）有 '+characters+' 个字符，上限 1000');
            if (key==='phrase') phraseTooLong=true;
          }
        }
      }
      if (word && !/^[a-zA-Z][a-zA-Z '\-]{0,79}$/.test(word)) {
        const length=Array.from(word).length;
        issues.push(length>80 ? '单词有 '+length+' 个字符，上限 80' : '单词格式不正确');
      }
      if (word && word.length<=80 && typeof row.phrase==='string' && row.phrase.trim() && !phraseTooLong) {
        // Legacy backups may contain terms accepted under the original substring rule.
        const matches=validating ? row.phrase.toLowerCase().includes(word.toLowerCase()) : phraseWordIndex(row.phrase,word)>=0;
        if (!matches) issues.push('英文搭配「'+row.phrase.slice(0,60)+'」需包含完整单词原形「'+word+'」，才能生成拼写题');
      }
    }
    if (issues.length) {
      const message=where+'：'+issues.join('，');
      if (validating) throw Error(message);
      errors.push(message);
      continue;
    }
    if (existing.has(word.toLowerCase())) continue;
    existing.add(word.toLowerCase());
    result.push({id:'custom:'+word.toLowerCase(),word,...Object.fromEntries(required.slice(1).map(k=>[k,row[k].trim()])),pos:typeof row.pos==='string'?row.pos.slice(0,30):'',topic:typeof row.topic==='string'?row.topic.slice(0,30):'我的词库'});
  }
  if (errors.length) throw Error(errors.join('\n'));
  return result;
}
export function validateState(s) {
  if(!s||s.schema!==1||!Number.isInteger(s.revision)||s.revision<0) throw Error('备份版本不兼容');
  for(const k of ['coins','tickets']) if(!Number.isInteger(s[k])||s[k]<0||s[k]>1e9) throw Error('备份奖励数据无效');
  if(!Array.isArray(s.customWords)||!Array.isArray(s.history)||!Array.isArray(s.favorites)||!Array.isArray(s.unlocks)) throw Error('备份格式无效');
  if(s.customWords.length) {const normalized=cleanWords(s.customWords,initialState(),true); if(normalized.length!==s.customWords.length||normalized.some((w,i)=>w.id!==s.customWords[i].id)) throw Error('备份词库无效');}
  const ids=new Set(wordsFor(s).map(w=>w.id));
  for(const k of ['cards','daily','rewarded','settings']) if(!s[k]||typeof s[k]!=='object'||Array.isArray(s[k])) throw Error('备份格式无效');
  for(const [id,c] of Object.entries(s.cards)) {
    if(!ids.has(id)||!Number.isFinite(+new Date(c.due))||(c.last_review&&!Number.isFinite(+new Date(c.last_review)))) throw Error('备份复习日期无效');
    for(const k of ['stability','difficulty','elapsed_days','scheduled_days','reps','lapses','learning_steps','state']) if(!Number.isFinite(c[k])||c[k]<0||c[k]>1e7) throw Error('备份复习参数无效');
    if(c.state>3||!Number.isInteger(c.state)||c.difficulty>10) throw Error('备份复习状态无效');
  }
  for(const d of Object.values(s.daily)) if(!d||!Number.isInteger(d.reviews)||d.reviews<0||!Number.isInteger(d.newCount)||d.newCount<0||!Array.isArray(d.words)||d.words.some(id=>!ids.has(id))) throw Error('备份日历无效');
  for(const d of Object.values(s.daily)) if(d.effectiveNewLimit!==undefined&&(!Number.isInteger(d.effectiveNewLimit)||d.effectiveNewLimit<1||d.effectiveNewLimit>100)) throw Error('每日新词配额无效');
  for(const d of Object.values(s.daily))if(d.gameBonuses!==undefined&&(!Array.isArray(d.gameBonuses)||d.gameBonuses.some(k=>typeof k!=='string'||!(/^(combo|finish):(meaning|phrase|flight|fishing)$|^memory:[0-2]$/).test(k))))throw Error('备份游戏奖励无效');
  for(const d of Object.values(s.daily)){if(d.task&&(!Array.isArray(d.task.ids)||!Array.isArray(d.task.done)||typeof d.task.paid!=='boolean'||d.task.ids.some(id=>!ids.has(id))||d.task.done.some(id=>!d.task.ids.includes(id))))throw Error('每日任务无效');if(d.rewardGames&&(!Array.isArray(d.rewardGames)||d.rewardGames.length>2||d.rewardGames.some(id=>typeof id!=='string')))throw Error('游戏奖励记录无效');}
  for(const d of Object.values(s.daily)){
    const extra=d.taskExtraIds;
    if(extra!==undefined&&(!Array.isArray(extra)||extra.length>100||new Set(extra).size!==extra.length||extra.some(id=>!d.task?.ids.includes(id)))) throw Error('任务词额外配额无效');
  }
  if(Object.entries(s.rewarded).some(([id,key])=>!ids.has(id)||typeof key!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(key))) throw Error('备份奖励记录无效');
  if(s.favorites.some(id=>!ids.has(id))||s.unlocks.some(v=>!rewardPrice(v))) throw Error('备份收藏或主题无效');
  const settings=checkSettings(s.settings);
  if(settings.sticker!=='none'&&!s.unlocks.includes('sticker-'+settings.sticker)) throw Error('备份贴纸无效');
  if(settings.theme!=='paper'&&!s.unlocks.includes(settings.theme)) throw Error('备份主题无效');
  if(s.history.some(h=>!h||!ids.has(h.id)||![1,2,3,4].includes(h.rating)||!Number.isFinite(h.at))) throw Error('备份历史无效');
  return {...s,settings,game:null};
}
function checkSettings(p) {
  const out={};
  const checks={corner:v=>['top-left','top-right','bottom-left','bottom-right'].includes(v),display:v=>typeof v==='string'&&v.length<50,opacity:v=>Number.isFinite(v)&&v>=0.65&&v<=1,launchAtLogin:v=>typeof v==='boolean',widget:v=>typeof v==='boolean',newLimit:v=>Number.isInteger(v)&&v>=1&&v<=100,rotateSeconds:v=>[30,60,120,300].includes(v),theme:v=>THEMES.some(t=>t.id===v),sound:v=>typeof v==='boolean',deck:v=>['all','toefl','ielts','custom'].includes(v),voice:v=>typeof v==='string'&&v.length<500,accent:v=>['en-US','en-GB'].includes(v),sticker:v=>v==='none'||STICKERS.some(t=>t.id===v),reduceMotion:v=>typeof v==='boolean',widgetWidth:v=>Number.isInteger(v)&&v>=200&&v<=640,widgetHeight:v=>Number.isInteger(v)&&v>=112&&v<=760};
  for(const [k,v] of Object.entries(p)) {if(!own(checks,k)||!checks[k](v)) throw Error('设置值无效');out[k]=v;}
  return {...initialState().settings,...out};
}
export function transition(state,action,now=Date.now()) {
  const s=structuredClone(state); let result={};
  if(!action||typeof action.type!=='string') throw Error('无效操作');
  switch(action.type) {
    case 'allowTaskWords': {
      const ids=blockedTaskIds(s,now),day=s.daily[dayKey(now)];
      if(!ids.length) throw Error('任务词或名额已经变化，请查看当前学习队列');
      day.effectiveNewLimit=currentNewLimit(s,now);
      day.taskExtraIds=[...(day.taskExtraIds||[]),...ids];
      if(action.showAll===true) s.settings.deck='all';
      result={ids};break;
    }
    case 'review': result=review(s,action.id,action.rating,'card',now); break;
    case 'favorite': {
      if(!wordsFor(s).some(w=>w.id===action.id)) throw Error('词条不存在');
      s.favorites=s.favorites.includes(action.id)?s.favorites.filter(x=>x!==action.id):[...s.favorites,action.id];break;
    }
    case 'settings': {
      const previousLimit=currentNewLimit(s,now);
      s.settings=checkSettings({...s.settings,...action.patch});
      if(action.patch?.newLimit!==undefined){
        const today=s.daily[dayKey(now)];
        const defer=!!today?.task && s.settings.newLimit<previousLimit;
        if(today?.task) today.effectiveNewLimit=defer?previousLimit:s.settings.newLimit;
        result={todayLimit:currentNewLimit(s,now),nextLimit:s.settings.newLimit,deferred:defer};
      }
      if(s.settings.theme!=='paper'&&!s.unlocks.includes(s.settings.theme)) throw Error('请先解锁该配色');
      if(s.settings.sticker!=='none'&&!s.unlocks.includes('sticker-'+s.settings.sticker)) throw Error('请先解锁该贴纸');
      break;
    }
    case 'buy': {
      const price=action.item==='ticket'?8:rewardPrice(action.item);
      if(!price) throw Error('商品不存在');
      if(action.item!=='ticket'&&s.unlocks.includes(action.item)) throw Error('已拥有该主题');
      if(s.coins<price) throw Error('积分不足');
      s.coins-=price;
      if(action.item==='ticket') s.tickets++; else s.unlocks.push(action.item);
      break;
    }
    case 'import': {
      const entries=cleanWords(action.words,s);
      s.customWords.push(...entries);
      result={imported:entries.length,skipped:action.words.length-entries.length,importedIds:entries.map(w=>w.id)};
      break;
    }
    case 'restore': {const restored=validateState(action.state);restored.revision=state.revision+1;restored.settings.launchAtLogin=state.settings.launchAtLogin;return {state:restored,result:{}};}
    case 'startGame':
    case 'retryMistakes': {
      let mode=action.mode, retryWords=null;
      if(action.type==='retryMistakes'){
        const previous=s.game;
        if(!previous?.completed || previous.id!==action.gameId) throw Error('请从本局结果选择错词');
        mode=previous.mode==='phrase'?'phrase':'meaning';
        const ids=new Set((previous.mistakes||[]).map(m=>m.id));
        retryWords=wordsFor(s).filter(w=>ids.has(w.id));
      }
      if(!['meaning','phrase','flight','fishing','memory'].includes(mode)) throw Error('游戏不存在');
      const pool=retryWords || gamePool(s,now,true);
      const eligible=mode==='phrase'?pool.filter(w=>phraseWordIndex(w.phrase,w.word)>=0):pool;
      const chosen=retryWords?eligible:shuffle(eligible.slice(0,24)).slice(0,mode==='phrase'?4:8);
      if(!chosen.length) throw Error('当前没有可练习的词，请检查词库与今日新词上限');
      const options=retryWords?wordsFor(s):deckWords(s);
      const questions=chosen.map(w=>({id:w.id,round:0,options:shuffle([w,...shuffle(options.filter(x=>x.id!==w.id&&x.meaning!==w.meaning)).slice(0,3)]).map(x=>x.id)}));
      const spellingRounds=retryWords?[2]:[0,1,2];
      s.game={id:crypto.randomUUID(),mode,index:0,lives:3,score:0,streak:0,bestStreak:0,earned:0,feedback:null,completed:false,mistakes:[],retry:!!retryWords,
        questions:mode==='phrase'?spellingRounds.flatMap(round=>questions.filter((q,i)=>spellingPrompt(chosen[i].word,round).hidden.length).map(q=>({...q,round}))):questions};
      if(mode==='memory'){
        const unique=shuffle(pool).filter((w,i,ws)=>ws.findIndex(x=>x.meaning===w.meaning)===i).slice(0,6);
        if(unique.length<2) throw Error('记忆配对至少需要两个不同释义的可练习词');
        s.game.pool=unique.map(w=>w.id);s.game.level=0;s.game.moves=0;s.game.stageComplete=false;makeBoard(s.game);
      }
      break;
    }
    case 'answer': {
      const g=s.game;
      if(!g||g.mode==='memory'||g.id!==action.gameId||g.index!==action.index||g.feedback||g.completed||g.lives<=0) throw Error('这道题已提交，请继续下一题');
      const q=g.questions[g.index],w=wordsFor(s).find(w=>w.id===q.id);
      const answer=typeof action.answer==='string'?action.answer.trim().toLowerCase():'';
      const arcade=['flight','fishing'].includes(g.mode);
      const motorMiss=arcade&&(action.timeout===true||answer==='__miss');
      if(!motorMiss&&g.mode!=='phrase'&&!q.options.includes(answer)) throw Error('请选择本题显示的选项');
      const prompt=spellingPrompt(w.word,q.round);
      // A player may type just the missing letters or the full word in the final round.
      const correct=g.mode==='phrase'?answer===prompt.answer.toLowerCase()||(q.round===2&&answer===w.word.toLowerCase()):!motorMiss&&answer===w.id;
      if(correct){g.score++;g.streak++;}else{g.streak=0;g.lives--;}
      g.bestStreak=Math.max(g.bestStreak,g.streak);
      const guided=g.mode==='phrase'&&q.round<2;
      const needsCheck=arcade&&!correct;
      result=guided||needsCheck?{scheduled:false,reward:0}:review(s,w.id,correct?(g.mode==='phrase'?3:2):1,'game',now);
      g.earned+=result.reward;
      g.feedback={correct,answer:w.word,submitted:answer,reward:result.reward,scheduled:result.scheduled,guided,timeout:!!action.timeout,needsCheck};
      if(!correct){
        g.mistakes||=[];
        g.mistakes.push({id:w.id,submitted:answer,round:q.round,index:g.index,timeout:!!action.timeout});
      }
      if(g.index===g.questions.length-1){
        settleGame(s,g,now);
        if(g.lives===0&&!needsCheck) g.completed=true;
      }
      break;
    }
    case 'checkMeaning': {
      const g=s.game;
      if(!g||g.id!==action.gameId||g.index!==action.index||g.completed||!g.feedback?.needsCheck) throw Error('本轮辨义已经结束');
      const q=g.questions[g.index];
      if(action.skip!==true&&!q.options.includes(action.answer)) throw Error('请选择本题显示的选项');
      const correct=action.answer===q.id;
      result=action.skip?{scheduled:false,reward:0}:review(s,q.id,correct?2:1,'game',now);
      g.earned+=result.reward;
      Object.assign(g.feedback,{needsCheck:false,checked:true,checkAnswer:action.skip?null:action.answer,checkCorrect:correct,reward:result.reward,scheduled:result.scheduled});
      Object.assign(g.mistakes.at(-1),{checked:true,checkAnswer:g.feedback.checkAnswer});
      if(g.index===g.questions.length-1&&g.lives===0)g.completed=true;
      break;
    }
    case 'nextQuestion': {
      const g=s.game;
      if(!g||g.mode==='memory'||!g.feedback||g.feedback.needsCheck||g.lives<=0||g.completed) throw Error('请先完成当前题目');
      if(g.index===g.questions.length-1){settleGame(s,g,now);g.completed=true;}else{g.index++;g.feedback=null;}break;
    }
    case 'memoryFlip': {
      const g=s.game,i=action.card;
      if(!g||g.mode!=='memory'||g.id!==action.gameId||g.level!==action.level||g.completed||g.stageComplete||g.open.length>=2||!Number.isInteger(i)||!g.board[i]||g.open.includes(i)||g.matched.includes(g.board[i].id)) throw Error('当前不能翻这张卡');
      g.feedback=null;g.open.push(i);
      if(g.open.length===2){g.moves++;const a=g.board[g.open[0]],b=g.board[g.open[1]],correct=a.id===b.id&&a.side!==b.side;
        if(correct){g.matched.push(a.id);g.streak++;g.score++;g.bestStreak=Math.max(g.bestStreak,g.streak);}else{
          g.streak=0;g.mistakes||=[];
          for(const [card,other] of [[a,b],[b,a]]){
            if(!g.mistakes.some(m=>m.id===card.id&&m.submitted===other.id)){
              g.mistakes.push({id:card.id,submitted:other.id,side:other.side});
            }
          }
        }
        g.feedback={correct,ids:[a.id,b.id],reward:0,bonus:0,scheduled:false};
        if(g.matched.length===g.board.length/2){g.stageComplete=true;g.stageBonus=gameBonus(s,'memory:'+g.level,2*(g.level+1),now);g.earned+=g.stageBonus;}
      }break;
    }
    case 'memoryContinue': {
      const g=s.game;if(!g||g.mode!=='memory'||g.id!==action.gameId||g.level!==action.level||g.open.length!==2||g.stageComplete)throw Error('请先翻两张卡');g.open=[];g.feedback=null;break;
    }
    case 'memoryNext': {
      const g=s.game;if(!g||g.mode!=='memory'||g.id!==action.gameId||!g.stageComplete||g.completed)throw Error('请先完成本关');
      if(g.level===2||g.board.length/2===g.pool.length){g.completed=true;g.finishBonus=completeGameReward(s,g,now);g.earned+=g.finishBonus;}else {g.level++;makeBoard(g);}break;
    }
    case 'revive': {
      const g=s.game;if(!g||g.mode==='memory'||g.lives!==0||g.completed||s.tickets<1) throw Error('当前无法复活');
      s.tickets--;g.lives=2;break;
    }
    case 'endGame': {
      const g=s.game;
      if(!g||g.completed){s.game=null;break;}
      if(g.mode==='memory'&&!g.moves || g.mode!=='memory'&&!g.feedback&&g.index===0){s.game=null;break;}
      g.completed=true;g.partial=!g.settled;
      break;
    }
    default:throw Error('不支持的操作');
  }
  s.revision++;
  return {state:s,result};
}
