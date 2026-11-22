import {showStartupRecovery} from './startup-recovery.js';
import './style.css';
import './library.css';
import {createLibraryView} from './library-view.js';
import './study.css';
import './widget-controls.css';
import {version as buildVersion} from '../package.json';
import {runtimeLabel} from './runtime-info.js';
import {wallpaperSvg,wallpaperPng} from './wallpapers.js';
import {gameViews} from './game-ui.js';
import {createArcade} from './arcade.js';
import {THEMES,STICKERS,WALLPAPERS} from './rewards.js';
import {initialState,transition,validateState,wordsFor,deckWords,queue,stats,intervals,dayKey,dailyProgress,currentNewLimit,blockedTaskIds} from './core.js';

const root=document.querySelector('#app'),isWidget=new URLSearchParams(location.search).get('mode')==='widget';
const desktop=window.desktop;
const widgetSession = {deck:null,id:null,browsing:false,correction:null,menu:false,hiddenUntil:0,rotatedAt:Date.now()};
let previewSize=null,previewResizeInProgress=false;
let state,inspectId=null,route=window.WORDNOOK_PREVIEW?'widgetPreview':(window.WORDNOOK_ROUTE||'today'),selected=null,revealed=false,detail=null,busy=false,toastTimer,paused=false,displayList=[],restoreFile=null;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={today:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',cards:'<rect x="6" y="3" width="14" height="18" rx="2"/><path d="M3 6v12M10 8h6m-6 4h4"/>',game:'<path d="M7 7h10c3 0 5 9 3 11-2 2-4-2-5-2H9c-1 0-3 4-5 2C2 16 4 7 7 7Z"/><path d="M7 10v5m-2.5-2.5h5m6.5-1h.01m2 3h.01"/>',book:'<path d="M12 5v16M3 4c4-1 6 0 9 1 3-1 5-2 9-1v15c-4-1-6 0-9 2-3-2-5-3-9-2Z"/>',gift:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13M12 8C2 8 7 0 12 8c5-8 10 0 0 0Z"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="m9 3 6 0 1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1Z"/>',sound:'<path d="m3 9 4 0 5-4v14l-5-4H3Zm13-2c3 3 3 7 0 10m3-13c5 5 5 11 0 16"/>',arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',leaf:'<path d="M20 3C7 1 1 8 5 15s17 2 15-12ZM5 20 16 8"/>',pin:'<path d="m8 3 8 0-1 6 4 4H5l4-4-1-6Zm4 10v8"/>',star:'<path d="m12 3 3 6 6 1-4.5 4.5 1 6-5.5-3-5.5 3 1-6L3 10l6-1Z"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',check:'<path d="m5 12 4 4 10-10"/>'};
const icon=(name,cls='')=>`<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.leaf}</svg>`;
const btn=(action,label,cls='button',attrs='')=>`<button class="${cls}" data-action="${action}" ${attrs}>${label}</button>`;
const dt=ms=>ms<60000?'现在':ms<3600000?`${Math.round(ms/60000)} 分钟`:ms<86400000?`${Math.round(ms/3600000)} 小时`:`${Math.round(ms/86400000)} 天`;
function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3500);}
async function readLocal() {
  const load = async () => {
    const raw = localStorage.getItem('wordnook-v1');
    const stored = raw ? JSON.parse(raw) : null;
    const validated = stored ? validateState(stored) : initialState();
    if (isWidget) return validated;
    // Other open main windows share the current game. An app restart ends it.
    let otherMain = false;
    if (navigator.locks) {
      const presence = 'wordnook-open-main';
      const snapshot = await navigator.locks.query();
      otherMain = snapshot.held.some(lock => lock.name === presence);
      await new Promise((ready, reject) => {
        navigator.locks.request(presence, {mode:'shared'}, () => {
          ready();
          return new Promise(release => window.addEventListener('pagehide', release, {once:true}));
        }).catch(reject);
      });
    }
    if (!stored?.game) return validated;
    if (otherMain) {
      return {...validated, game:stored.game};
    }
    validated.revision++;
    localStorage.setItem('wordnook-v1', JSON.stringify(validated));
    return validated;
  };
  return navigator.locks ? navigator.locks.request('wordnook-state', load) : load();
}
async function act(action){
 if(busy)return null;busy=true;
 try {
  let r;
  if(desktop)r=await desktop.act(action);
  else {const run=()=>{const raw=localStorage.getItem('wordnook-v1');const base=raw?JSON.parse(raw):initialState();const next=transition(base,action);localStorage.setItem('wordnook-v1',JSON.stringify(next.state));return next;};r=navigator.locks?await navigator.locks.request('wordnook-state',run):run();}
  if(!state||r.state.revision>=state.revision)state=r.state;
  return r.result;
 }catch(e){const message=e.message.replace(/^Error invoking remote method '[^']+': Error: /,'');if(action.type==='import'&&detail==='import'){fileError=message;render();}else toast(message);return null;}finally{busy=false;}
}
function currentWord(){const q=queue(state);if(selected&&q.some(w=>w.id===selected))return q.find(w=>w.id===selected);selected=q[0]?.id||null;return q[0];}
function englishVoices(){return ('speechSynthesis' in window?speechSynthesis.getVoices():[]).filter(v=>/^en[-_]/i.test(v.lang));}
function chosenVoice(){const voices=englishVoices();return voices.find(v=>v.voiceURI===state.settings.voice)||voices.find(v=>v.lang===state.settings.accent&&v.localService)||voices.find(v=>v.lang===state.settings.accent)||voices.find(v=>v.localService)||voices[0];}
function speak(text){if(!('speechSynthesis'in window)){toast('当前设备没有语音服务');return;}const voice=chosenVoice();if(!voice){toast('尚未检测到英语声音，请在系统设置中安装后刷新声音列表');return;}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=voice.lang;u.voice=voice;u.rate=0.88;u.onerror=e=>{if(!['interrupted','canceled'].includes(e.error))toast('语音不可用，请检查系统声音及音量');};speechSynthesis.speak(u);}
function stickerSvg(id){const paths={stamp:'<rect x="7" y="7" width="50" height="50" rx="3"/><rect x="11" y="11" width="42" height="42" rx="1"/><path d="m20 30 8 8 16-16M20 47h24"/>',ticket:'<path d="M5 16h54v9a7 7 0 0 0 0 14v9H5v-9a7 7 0 0 0 0-14Z"/><path stroke-dasharray="2 3" d="M44 17v30"/><path d="M17 26h18m-18 6h12m-12 6h15"/>',pixel:'<path stroke-linejoin="miter" d="M8 17h18v5h12v-5h18v32H38v5H26v-5H8ZM32 23v26M14 25h9m-9 8h9m18-8h9m-9 8h9"/>'};return `<svg class="sticker-art" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${paths[id]||''}</svg>`;}
function wornSticker(){return state.settings.sticker!=='none'?`<span class="worn-sticker" title="${esc(STICKERS.find(x=>x.id===state.settings.sticker)?.name)}">${stickerSvg(state.settings.sticker)}</span>`:'';}
function previewView(){const w=previewSize?.width||state.settings.widgetWidth,h=previewSize?.height||state.settings.widgetHeight;return `${head('','悬浮窗预览','',btn('nav:today','返回今日','button subtle'))}<div class="preview-controls"><p>拖动右下角调整大小。小窗获得焦点后可用 ← / → 换词。</p><div class="corners">${[['top-left','左上'],['top-right','右上'],['bottom-left','左下'],['bottom-right','右下']].map(([v,t])=>btn('corner:'+v,t,state.settings.corner===v?'selected':'','aria-pressed="'+(state.settings.corner===v)+'"')).join('')}</div></div><div class="widget-presets">${btn('widgetSize:220:120','极简','button subtle')}${btn('widgetSize:280:230','释义','button subtle')}${btn('widgetSize:380:480','完整','button subtle')}<span>跟随系统明暗 · <output id="widget-dimensions">${w} × ${h}</output></span></div><p class="widget-preview-notice">预览中的「会」「不会」和详细评分均计入今日学习。</p><div class="desktop-stage" data-corner="${state.settings.corner}"><div class="preview-widget" tabindex="0" aria-label="可调整大小的悬浮窗" style="width:${w}px;height:${h}px;opacity:${state.settings.opacity}">${widgetView()}</div></div><p class="footnote">极简显示英文、快速评分和更多操作。放大后可看中文、搭配、例句和详细评分。</p>`;}
function voiceSettings(){const vs=englishVoices(),v=chosenVoice();return `<section><h3>英语发音</h3><div class="setting-row"><div><strong>${v?'检测到 '+vs.length+' 个英语声音':'尚未检测到英语声音'}</strong><p>使用设备语音服务，应用未内置录音或独立语音包。${v?(v.localService?'当前为本地声音，可离线使用。':'当前为在线声音，可能需要联网。'):'可在 Mac 系统设置 → 辅助功能 → 朗读与语音（部分版本为朗读内容）中管理和下载声音。'}</p></div>${btn('refreshVoices','刷新声音列表','button subtle')}</div><div class="setting-row"><label for="accent">优先口音</label><select id="accent"><option value="en-US" ${state.settings.accent==='en-US'?'selected':''}>美式英语</option><option value="en-GB" ${state.settings.accent==='en-GB'?'selected':''}>英式英语</option></select></div><div class="setting-row"><label for="voice">使用声音</label><select id="voice"><option value="">自动选择</option>${vs.map(v=>`<option value="${esc(v.voiceURI)}" ${state.settings.voice===v.voiceURI?'selected':''}>${esc(v.name)} · ${esc(v.lang)} · ${v.localService?'本地':'在线'}</option>`).join('')}</select></div><div class="setting-row"><p>当前：${v?esc(v.name)+' · '+esc(v.lang):'无可用声音'}。选择口音后会重新自动匹配声音。</p>${btn('testVoice','试听英语发音','button subtle',!v?'disabled':'')}</div></section>`;}

function nav(){const st=stats(state);return `<aside class="sidebar"><div class="brand"><b class="app-mark">W</b><span>拾词<small>Wordnook</small></span>${wornSticker()}${btn('nav:settings',icon('settings'),'mobile-settings icon-button','aria-label="偏好设置"')}</div><div class="nav-caption">学习</div><nav>${[['today','today','今日'],['review','cards','单词卡'],['games','game','小游戏'],['library','book','词库'],['rewards','gift','奖励']].map(([r,i,l])=>btn(`nav:${r}`,`${icon(i)}<span>${l}</span>${r==='review'&&st.queue?`<span class="badge">${st.queue}</span>`:''}`,`nav-item ${route===r?'active':''}`)).join('')}</nav><div class="side-bottom"><div class="balance"><span>可用积分</span><strong>${state.coins}</strong></div>${btn('nav:settings',`${icon('settings')}偏好设置`,`nav-item ${route==='settings'?'active':''}`)}<div class="local-status"><i></i>本机存储 · 离线可用</div></div></aside>`;}
const pageTitles={'今天，拾起几个词。':'今日学习','给记忆一点时间。':'单词卡','休息一下，玩一小局。':'小游戏','一个慢慢变厚的词库。':'词库','给认真一点小奖励。':'奖励','让它待在舒服的位置。':'偏好设置','走完这段小路了。':'本局结果','一步，一个词。':'练习中'};
function head(eyebrow,title,sub='',right=''){return `<header class="page-head"><div><h1 tabindex="-1">${pageTitles[title]||title}</h1></div><div class="toolbar-end">${right}</div></header>`;}
const deckLabels={all:'全部词汇',toefl:'托福 · 基础选词',ielts:'雅思 · 基础选词',custom:'我的导入'};
let inspectRevealed=false,waitingForReview=false,nextStudyRefresh=Infinity;
function studySchedule(){
 const now=Date.now(), tomorrow=new Date(now);
 tomorrow.setHours(24,0,0,0);
 const words=deckWords(state);
 let upcoming=null,dueAt=Infinity;
 for(const word of words){
  const due=Date.parse(state.cards[word.id]?.due);
  if(due>now&&due<dueAt){upcoming=word;dueAt=due;}
 }
 nextStudyRefresh=Math.min(dueAt,tomorrow.getTime());
 return {words,upcoming,dueAt};
}
function dueLabel(due){
 const time=new Date(due),minutes=Math.max(1,Math.ceil((due-Date.now())/60000));
 if(minutes<60)return '约 '+minutes+' 分钟后';
 const sameDay=dayKey(due)===dayKey();
 return time.toLocaleString('zh-CN',{...(sameDay?{}:{month:'short',day:'numeric'}),hour:'2-digit',minute:'2-digit'});
}
function taskAllowancePrompt(){
 const day=state.daily[dayKey()],blocked=blockedTaskIds(state);
 if(!day?.task)return '';
 const available=new Set(deckWords(state).map(w=>w.id));
 const outside=blocked.some(id=>!available.has(id));
 if(blocked.length){
   const words=new Map(wordsFor(state).map(w=>[w.id,w.word]));
   const targets=blocked.slice(0,3).map(id=>esc(words.get(id))).join('、');
   const label=outside?'切到全部词汇并增加今日任务名额':'增加今日任务名额';
   return `<div class="task-allowance"><p>今天的新词名额已用完，固定任务还有 ${blocked.length} 个新词（${targets}${blocked.length>3?'等':''}）。可仅为这些词增加今天的名额。明天仍按 ${state.settings.newLimit} 个新词安排。</p>${btn('allowTaskWords:'+(outside?'all':'current'),label,'button subtle')}</div>`;
 }
 if(day.taskExtraIds?.some(id=>!state.cards[id]&&!available.has(id))) return btn('switchToBuiltIn','切到全部词汇，继续今日任务词','button subtle');
 return '';
}
function emptyDeck(){
 return `<section class="empty study-empty"><h2>我的导入还没有词</h2><p>导入 CSV 或 JSON 词表，即可开始学习自己的单词。</p><div class="button-row">${btn('import','导入第一份词表','button primary')}${btn('switchToBuiltIn','使用内置词库','button subtle')}</div>${taskAllowancePrompt()}</section>`;
}
function studyBreak(schedule,progress){
 const remaining=progress.target-progress.done;
 return `<section class="empty study-empty" data-study-break><h2>本轮学习结束</h2>
 <p>${schedule.upcoming?`<time data-due="${schedule.dueAt}">${dueLabel(schedule.dueAt)}</time>再复习 <strong>${esc(schedule.upcoming.word)}</strong>。`:'当前没有到期词。下一天会重新计算新词配额。'}</p>
 ${remaining>0?`<p>今日任务还差 ${remaining} 个词达标。</p>`:''}
 ${taskAllowancePrompt()}<div class="button-row">${btn('nav:games','打开小游戏','button subtle')}</div></section>`;
}
function inspector(w){
 const saved=state.favorites.includes(w.id);
 return `<div class="section-heading"><h2>词汇详情</h2><span>${esc(w.topic)}</span></div>
 <div class="inspector-content"><div class="word-title"><h2>${esc(w.word)}</h2>${btn('speak:'+w.id,icon('sound'),'icon-button','aria-label="朗读单词"')}</div>
 <div class="inspector-actions">${btn('studyWord:'+w.id,'练这个词','button primary')}${btn('inspectMeaning',inspectRevealed?'收起释义':'看释义','button subtle',`aria-expanded="${inspectRevealed}"`)}</div>
 ${inspectRevealed?wordBack(w):''}
 <div class="inspector-footer">${btn('favorite:'+w.id,`${icon('star')} ${saved?'已收藏':'收藏'}`,'button subtle',`aria-pressed="${saved}"`)}<span>查看不计入学习进度</span></div></div>`;
}
function selectInspector(id,showMeaning=false){
 const w=queue(state).find(item=>item.id===id);
 if(!w)return;
 inspectId=id;inspectRevealed=showMeaning;
 const pane=root.querySelector('.word-inspector');
 if(!pane)return;
 const action=pane.contains(document.activeElement)?document.activeElement.dataset.action:null;
 pane.innerHTML=inspector(w);
 root.querySelectorAll('.queue-item').forEach(row=>{
  const current=row.dataset.action==='inspect:'+id;
  row.classList.toggle('current',current);
  row.setAttribute('aria-pressed',String(current));
 });
 if(action)pane.querySelector(`[data-action="${CSS.escape(action)}"]`)?.focus({preventScroll:true});
}
function today(){
 const progress=dailyProgress(state),st=stats(state),q=queue(state),schedule=studySchedule();
 const w=q.find(item=>item.id===inspectId)||q[0];
 if(w?.id!==inspectId){inspectId=w?.id||null;inspectRevealed=false;}
 const header=head('','今日学习','',`<span class="date">${new Intl.DateTimeFormat('zh-CN',{month:'long',day:'numeric',weekday:'short'}).format(new Date())}</span>${btn('widget',`${icon('pin')}${desktop?'桌面悬浮窗':'预览悬浮窗'}`,'button subtle')}`);
 if(!schedule.words.length)return header+emptyDeck();
 const queueRows=q.slice(0,12).map((item,i)=>`<button class="queue-item ${item.id===w.id?'current':''}" aria-pressed="${item.id===w.id}" data-action="inspect:${esc(item.id)}"><span class="queue-index">${String(i+1).padStart(2,'0')}</span><span><strong>${esc(item.word)}</strong><small>${esc(item.topic)}</small></span><span class="queue-state">${state.cards[item.id]?'复习':'新词'}</span></button>`).join('');
 const days=Array.from({length:7},(_,i)=>{
  const date=new Date();date.setDate(date.getDate()-6+i);
  return `<div class="${i===6?'current':''}"><small>${i===6?'今天':(date.getMonth()+1)+'/'+date.getDate()}</small><b>${state.daily[dayKey(date)]?.reviews||0}</b></div>`;
 }).join('');
 return `${header}<div class="study-lead"><div><span>当前学习词库</span><h2>${deckLabels[state.settings.deck]} · 今天可学 ${q.length} 词</h2></div>
 ${q.length?btn('nav:review',`开始今天的学习 ${icon('arrow')}`,'button primary'):''}</div>
 <div class="study-summary"><div><span>当前词库待复习</span><strong>${q.filter(item=>state.cards[item.id]).length}</strong></div>
 <div><span>今日已接触新词</span><strong>${st.today.newCount}<small> / ${currentNewLimit(state)}${st.today.taskExtraIds?.length?' + '+st.today.taskExtraIds.length+' 个任务名额':''}</small></strong></div>
 <div><span>累计学过（全部词库）</span><strong>${st.seen}<small> / ${st.total}</small></strong></div></div>
 ${w?`<div class="study-workspace"><section class="queue-panel"><div class="section-heading"><h2>学习队列 <span>${q.length}</span></h2><span>到期优先</span></div><div class="queue-list" data-deck="${state.settings.deck}">${queueRows}</div><div class="queue-footer">${btn('nav:library','查看全部词汇 →','text-button')}</div></section><section class="word-inspector">${inspector(w)}</section></div>`:studyBreak(schedule,progress)}
 <details class="daily-task-strip"><summary>今日任务已达标 ${progress.done} / ${progress.target} 词${progress.paid?' · 已领取 6 分':''}</summary><div><p>一个词评为「有点费劲」或以上，计入一次达标。忘记的词到期后还可以再试。完成当天学习任务得 6 分。</p><p>今日合格游戏 ${progress.games} / 2 局，每局另得 2 分。首次作答时锁定当天词单。</p></div></details>
 <div class="activity-strip"><div><strong>最近 7 天</strong><span>回忆次数</span></div><div class="activity-days">${days}</div></div>
 ${!desktop?'<p class="preview-notice">浏览器体验版 · 跨应用悬浮与登录启动需使用 Mac 桌面版。</p>':''}`;
}
function refreshStudyClock(){
 if(Date.now()>=nextStudyRefresh){
  if(route==='today'||!revealed)render();
  return;
 }
 const time=root.querySelector('time[data-due]');
 if(time){
  const label=dueLabel(Number(time.dataset.due));
  if(label!==time.textContent)time.textContent=label;
 }
}
function wordBack(w){return `<div class="meaning"><span>${esc(w.pos)}</span> ${esc(w.meaning)}</div><div class="usage"><label>常用搭配</label><strong>${esc(w.phrase)}</strong><span>${esc(w.phraseZh)}</span></div><div class="example"><label>例句</label><p>${esc(w.example)} ${btn(`speak:${w.id}:example`,icon('sound'),'icon-button','aria-label="朗读例句"')}</p><span>${esc(w.exampleZh)}</span></div>`;}
function reviewView(){
 const schedule=studySchedule(),q=queue(state),header=head('','单词卡','',`<span class="pill">待学 ${q.length} 词</span>`);
 if(!schedule.words.length){waitingForReview=false;return header+emptyDeck();}
 if(!q.length){waitingForReview=true;return header+studyBreak(schedule,dailyProgress(state));}
 if(waitingForReview){
  const due=Boolean(state.cards[q[0].id]);
  const available=q.length===1?esc(q[0].word):`${esc(q[0].word)} 等 ${q.length} 个词`;
  return `${header}<section class="empty study-empty"><h2>${due?'有词到期了':'今日新词已就绪'}</h2><p>${available} 可以开始${due?'复习':'学习'}了。</p>${btn('resumeReview',due?'继续复习':'开始学习','button primary')}</section>`;
 }
 const w=currentWord();
 return `${header}<section class="flashcard ${revealed?'is-revealed':''}"><div class="card-top"><span>${state.cards[w.id]?'到期复习':'新词'} · ${esc(w.topic)}</span>${btn(`favorite:${w.id}`,icon('star'),`icon-button ${state.favorites.includes(w.id)?'saved':''}`,`aria-label="收藏单词" aria-pressed="${state.favorites.includes(w.id)}"`)}</div><div class="word-title"><h2>${esc(w.word)}</h2>${btn(`speak:${w.id}`,icon('sound'),'icon-button','aria-label="朗读单词"')}</div>${revealed?wordBack(w):`<div class="recall-prompt"><span>这个词是什么意思？</span><p>回忆中文含义，然后查看答案。</p>${btn('flip','显示答案 <kbd>Space</kbd>','button primary')}</div>`}</section>${revealed?`<div class="rating-label">选择回忆程度</div><div class="ratings">${intervals(state,w.id).map(({rating,ms},i)=>btn(`rate:${rating}`,`<span><kbd>${rating}</kbd>${['忘记了','有点费劲','记得','很轻松'][i]}</span><small>${dt(ms)}后复习</small>`,`rating rating-${rating}`)).join('')}</div>`:`<p class="keyboard-hint">空格翻面 · 翻面后按 1–4 记录回忆程度</p>`}`;
}
function renderGameStep(){
  render();
  if(route!=='games'||detail)return;
  const target=document.querySelector('.motor-check .choice, .feedback [data-action="nextQuestion"], .revive-row [data-action="endGame"], #spelling:not(:disabled), .finish [data-action="retryMistakes"], .finish-actions button');
  target?.focus();
}
function games(){return gameViews({state,esc,btn,head,wordsFor});}
const wordLibrary = createLibraryView({btn, esc, head, dt, icon});
function library() { return wordLibrary.view(state); }
function updateLibraryResults() {
  const results = document.querySelector('#library-results');
  if (results) results.innerHTML = wordLibrary.rows(state);
}
function rewards(){
 const shortfall=Math.max(0,100-state.coins);
 const estimate=shortfall?`还差 ${shortfall} 分。按每日学习 6 分计算约需 ${Math.ceil(shortfall/6)} 天，每天再完成两局合格游戏最快 ${Math.ceil(shortfall/10)} 天。`:'当前余额已足够兑换一张壁纸。';
 return `${head('','奖励')}<div class="reward-account"><div><span>可用积分</span><strong>${state.coins}</strong></div><p>每日学习任务 +6 · 前两局合格游戏各 +2 · 每天最多 10 分</p></div><div class="reward-list"><section><div class="reward-ticket" aria-hidden="true">+2<small>机会</small></div><div class="reward-description"><h3>复活券</h3><p>游戏机会用完后恢复 2 次。已持有 ${state.tickets} 张。</p></div>${btn('buyTicket','8 积分 · 兑换','button primary',state.coins<8?'disabled':'')}</section></div><h2 class="reward-heading">壁纸 <small>100 分 / 张</small></h2><p class="footnote">${estimate} 壁纸可下载为 4K PNG。</p><div class="wallpaper-catalog">${WALLPAPERS.map(t=>{const owned=state.unlocks.includes('wallpaper-'+t.id);return `<section><div class="wallpaper-thumb">${wallpaperSvg(t.id,640,360)}</div><div><h3>${t.name}</h3>${owned?btn('wallpaper:'+t.id,'下载 4K 壁纸','button subtle'):btn('purchase:wallpaper-'+t.id,'100 积分 · 解锁','button subtle',state.coins<100?'disabled':'')}</div></section>`;}).join('')}</div><h2 class="reward-heading">配色 <small>只改变强调色，保留中性背景</small></h2><div class="reward-list compact">${THEMES.map(t=>{const owned=t.price===0||state.unlocks.includes(t.id),active=state.settings.theme===t.id;return `<section><div class="palette-chip" style="--chip:${t.color};--chip-soft:${t.soft}"><i></i><i></i><i></i></div><div class="reward-description"><h3>${t.name}</h3><p>${t.price===0?'默认可用':owned?'已永久解锁':t.price+' 积分 · 永久解锁'}</p></div>${owned?btn('theme:'+t.id,active?'使用中':'使用'+t.name,'button subtle',active?'disabled':''):btn('purchase:'+t.id,t.price+' 积分 · 解锁','button subtle',state.coins<t.price?'disabled':'')}</section>`;}).join('')}</div><h2 class="reward-heading">贴纸 <small>显示在侧栏和悬浮窗，随时可以取下</small></h2><div class="reward-list compact">${STICKERS.map(t=>{const owned=state.unlocks.includes('sticker-'+t.id),active=state.settings.sticker===t.id;return `<section><div class="sticker-sample">${stickerSvg(t.id)}</div><div class="reward-description"><h3>${t.name}</h3><p>${t.description}</p></div>${owned?btn('sticker:'+(active?'none':t.id),active?'取下贴纸':'贴上'+t.name,'button subtle'):btn('purchase:sticker-'+t.id,t.price+' 积分 · 解锁','button subtle',state.coins<t.price?'disabled':'')}</section>`;}).join('')}</div>`;}

function settings(){const p=state.settings;return `${head('MAKE YOURSELF AT HOME','让它待在舒服的位置。','设置会自动保存。悬浮窗只在你需要时出现。')}<div class="settings-list">${voiceSettings()}<section><h3>桌面小窗</h3><div class="setting-row"><div><strong>跟随系统颜色 · 自由缩放</strong><p>拖动小窗边缘调整大小，尺寸自动保存。最小 200 × 112，逐步显示释义、搭配和例句；左右方向键切换。</p></div>${btn('widget',desktop?'显示 / 隐藏小窗':'预览悬浮窗','button subtle')}</div><div class="setting-row"><div><strong>悬浮位置</strong><p>按所选屏幕的可用区域贴边，避开菜单栏与 Dock。</p></div><div class="corners">${[['top-left','左上'],['top-right','右上'],['bottom-left','左下'],['bottom-right','右下']].map(([v,t])=>btn(`corner:${v}`,t,p.corner===v?'selected':'','aria-pressed="'+(p.corner===v)+'"')).join('')}</div></div><div class="setting-row"><label for="display">显示器</label><select id="display" ${!desktop?'disabled':''}><option value="primary">主显示器</option>${displayList.map(d=>`<option value="${esc(d.id)}" ${p.display===d.id?'selected':''}>${esc(d.label)}</option>`).join('')}</select></div><div class="setting-row"><label for="opacity">不透明度 <span>${Math.round(p.opacity*100)}%</span></label><input id="opacity" type="range" min="0.65" max="1" step="0.05" value="${p.opacity}"></div><div class="setting-row"><label for="rotate">自动换词间隔<p>鼠标停留、正在回忆时暂停；自动换词不计入学习。</p></label><select id="rotate">${[30,60,120,300].map(v=>`<option value="${v}" ${p.rotateSeconds===v?'selected':''}>${v<60?v+' 秒':v/60+' 分钟'}</option>`).join('')}</select></div><div class="setting-row"><label for="startup">登录 Mac 后自动开启<p>安装版生效，启动时仅显示小窗。</p></label><input type="checkbox" role="switch" id="startup" ${p.launchAtLogin?'checked':''} ${!desktop?'disabled':''}></div><div class="setting-row"><label for="show-widget">显示悬浮窗</label><input type="checkbox" role="switch" id="show-widget" ${p.widget?'checked':''} ${!desktop?'disabled':''}></div></section><section><h3>学习节奏</h3><div class="setting-row"><label for="new-limit">每天最多几个新词？<p>到期复习不受新词数量限制。${currentNewLimit(state)!==p.newLimit?'今日仍为 '+currentNewLimit(state)+' 个，新上限 '+p.newLimit+' 个从明天起生效。':''}</p></label><select id="new-limit">${[5,10,15,20,30,50,...(![5,10,15,20,30,50].includes(p.newLimit)?[p.newLimit]:[])].map(v=>`<option value="${v}" ${p.newLimit===v?'selected':''}>${v} 个</option>`).join('')}</select></div><div class="setting-row"><div><strong>间隔重复</strong><p>采用 FSRS 间隔重复，目标记忆保持率 90%。这是调度目标，并非学习效果保证。</p></div><span class="pill">已启用</span></div></section><section><h3>数据管理</h3><div class="setting-row"><div><strong>词库与学习记录</strong><p>无需账户，离线可用。备份包含学习进度、收藏和奖励。</p></div><div class="button-row">${btn('export','导出备份','button subtle')}${btn('restore','恢复备份','button subtle')}</div></div><div class="setting-row"><div><strong>导入自己的词表</strong><p>支持 JSON、CSV。包含释义、常用搭配及中英例句。</p></div>${btn('template','下载词表模板','button subtle')}</div></section></div><p class="footnote">拾词 v${esc(buildVersion)} · ${esc(runtimeLabel(desktop?.runtime))}。英语发音使用系统语音，离线发音需已安装本地英语声音。</p>`;}
function widgetWords() {
  const deck = state.settings.deck;
  if (widgetSession.deck !== deck) {
    widgetSession.deck = deck;
    widgetSession.id = null;
    widgetSession.browsing = false;
    widgetSession.correction = null;
    widgetSession.menu = false;
  }
  return widgetSession.browsing ? deckWords(state) : queue(state);
}

function widgetWord(words = widgetWords()) {
  const word = words.find(item => item.id === widgetSession.id) || words[0];
  widgetSession.id = word?.id || null;
  return word;
}

function widgetMore() {
  return btn('widgetMenu', '⋯', 'widget-more', 'aria-label="更多小窗操作" aria-expanded="' + widgetSession.menu + '"');
}

function widgetActions() {
  return `<div class="widget-actions" aria-label="小窗操作">
    ${btn('pause', paused ? '继续自动换词' : '暂停自动换词', 'text-button')}
    ${btn('skip', '跳过当前词', 'text-button')}
    ${btn('snooze', '暂隐 15 分钟', 'text-button')}
    ${btn('widgetMenu', '收起', 'text-button')}
  </div>`;
}

function widgetView() {
  const words = widgetWords();
  if (widgetSession.hiddenUntil > Date.now()) {
    return `<div class="widget-viewport"><div class="widget-shell widget-message"><strong>小窗已暂隐 15 分钟</strong>${btn('widgetWake', '立即恢复', 'button subtle')}</div></div>`;
  }
  const correction = widgetSession.correction;
  const word = correction?.word || widgetWord(words);
  if (!word) {
    const deck = deckWords(state);
    const day = dailyProgress(state);
    const done = !day.target || day.done !== day.target ? '当前词库已学完' : `今日 ${day.done} 词已完成`;
    const empty = !deck.length;
    return `<div class="widget-viewport"><div class="widget-shell widget-message" tabindex="0">
      <strong>${empty ? '当前词库为空' : done}</strong>${empty ? btn('openMain', '打开主窗口', 'button subtle') : btn('widgetBrowse', '随便看看', 'button subtle')}
    </div></div>`;
  }
  const id = esc(word.id);
  const index = words.findIndex(item => item.id === word.id);
  const browse = widgetSession.browsing;
  let footer;
  if (correction) {
    footer = btn('widgetContinue', '下一词 →', 'widget-continue');
  } else if (browse) {
    footer = `<div class="widget-browse-actions">${btn('widgetStudy', '回到学习', 'text-button')}${btn('skip', '下一词 →', 'text-button')}</div>`;
  } else {
    const advanced = revealed
      ? `<div class="widget-ratings">${['忘记', '费劲', '记得', '轻松'].map((label, i) => btn('rate:' + (i + 1), label, 'rating-' + (i + 1))).join('')}</div>`
      : btn('flip', '详细评分', 'text-button');
    footer = `<div class="widget-binary">${btn('widgetKnow:1', '✕ <span>不会</span>', 'widget-no', 'aria-label="不会" title="不会：记录为忘记"')}${btn('widgetKnow:3', '✓ <span>会</span>', 'widget-yes', 'aria-label="会" title="会：记录为记得"')}</div>
      <div class="widget-advanced">${advanced}</div>
      <div class="widget-bottom">${btn('previous', '← 上一个', 'text-button')}<span>${index + 1} / ${words.length}</span>${btn('skip', '下一个 →', 'text-button')}</div>`;
  }
  return `<div class="widget-viewport"><div class="widget-shell ${correction ? 'widget-correction' : ''}" tabindex="0" aria-label="单词小窗，左右方向键切换">
    <div class="mini-drag" title="拖动此处移动窗口"></div>${widgetMore()}
    <header class="widget-drag"><span>${icon('cards')} 拾词</span><div>${btn('openMain', '↗', 'icon-button', 'aria-label="打开主窗口"')}</div></header>
    ${widgetSession.menu ? widgetActions() : ''}
    <div class="widget-body">${browse ? '<small class="widget-status">随便看看 · 不计学习记录</small>' : ''}
      <div class="widget-word">${wornSticker()}<h1>${esc(word.word)}</h1>${btn('speak:' + id, icon('sound'), 'icon-button widget-extra', 'aria-label="朗读单词"')}</div>
      <div class="widget-meaning">${esc(word.pos)} ${esc(word.meaning)}</div>
      ${correction ? '' : `<div class="widget-usage"><strong>${esc(word.phrase)}</strong><span>${esc(word.phraseZh)}</span></div><p class="widget-example">${esc(word.example)}</p><p class="widget-translation">${esc(word.exampleZh)}</p>`}
    </div><footer>${footer}</footer></div></div>`;
}

function renderWidget(focusAction = '') {
  const previousFocus = document.activeElement?.closest('.widget-viewport, .preview-widget');
  render();
  if (focusAction || previousFocus) {
    const target = focusAction && document.querySelector('.widget-shell [data-action="' + focusAction + '"]');
    (target || document.querySelector('.widget-shell'))?.focus({preventScroll:true});
  }
}

function moveWidget(delta) {
  const words = widgetWords();
  const current = widgetSession.correction?.nextId;
  const word = widgetWord(words);
  if (current && words.some(item => item.id === current)) {
    widgetSession.id = current;
  } else if (!widgetSession.correction && word) {
    const index = words.indexOf(word);
    widgetSession.id = words[(index + delta + words.length) % words.length].id;
  }
  widgetSession.correction = null;
  widgetSession.menu = false;
  widgetSession.rotatedAt = Date.now();
  revealed = false;
  renderWidget();
}

async function gradeWidget(rating) {
  if (widgetSession.correction || widgetSession.browsing) return;
  const words = widgetWords();
  const word = widgetWord(words);
  if (!word) return;
  const nextId = words[(words.indexOf(word) + 1) % words.length].id;
  const result = await act({type:'review', id:word.id, rating});
  if (!result) return;
  widgetSession.rotatedAt = Date.now();
  revealed = false;
  if (result.reward) toast('今日学习任务完成 +6 积分');
  if (rating === 1 && result.scheduled) {
    widgetSession.correction = {word, nextId};
    renderWidget('widgetContinue');
    return;
  }
  widgetSession.id = nextId;
  renderWidget();
}

function widgetKeyboard(event) {
  if (!isWidget && !document.activeElement?.closest('.widget-viewport,.preview-widget')) return;
  if (event.key === 'Escape' && widgetSession.menu) {
    widgetSession.menu = false;
    renderWidget('widgetMenu');
    return;
  }
  if (widgetSession.menu || widgetSession.hiddenUntil > Date.now()) return;
  if (['ArrowLeft','ArrowRight'].includes(event.code)) {
    event.preventDefault();
    moveWidget(event.code === 'ArrowLeft' ? -1 : 1);
    return;
  }
  if (event.code === 'Space' && !document.activeElement?.closest('button,a,summary,[role="button"]') && document.querySelector('.widget-advanced [data-action="flip"]')?.getClientRects().length) {
    event.preventDefault();
    revealed = true;
    renderWidget();
  } else if (revealed && /^[1-4]$/.test(event.key) && document.querySelector('.widget-ratings')?.getClientRects().length) {
    event.preventDefault();
    gradeWidget(Number(event.key));
  }
}

const widgetResizeObserver = new ResizeObserver(entries => {
  for (const {target,contentRect} of entries) {
    if (!target.isConnected) continue;
    const output = document.querySelector('#widget-dimensions');
    if (output) output.textContent = Math.round(contentRect.width) + ' × ' + Math.round(contentRect.height);
  }
});
root.addEventListener('pointerdown', event => {
  const frame = event.target.closest('.preview-widget');
  if (!frame) return;
  const bounds = frame.getBoundingClientRect();
  previewResizeInProgress = event.clientX >= bounds.right - 20 && event.clientY >= bounds.bottom - 20;
});
document.addEventListener('pointerup', async () => {
  if (!previewResizeInProgress) return;
  previewResizeInProgress = false;
  const frame = document.querySelector('.preview-widget');
  if (!frame) return;
  const {width,height} = frame.getBoundingClientRect();
  const size = {widgetWidth:Math.min(640,Math.max(200,Math.round(width))),widgetHeight:Math.min(760,Math.max(112,Math.round(height)))};
  if (size.widgetWidth !== state.settings.widgetWidth || size.widgetHeight !== state.settings.widgetHeight) {
    await act({type:'settings',patch:size});
    previewSize = null;
  }
});
document.addEventListener('pointercancel', () => {previewResizeInProgress=false;});


let modalOpener = null;
let composingSearch = false, pendingLibraryRefresh = false;
let fileRequest = 0;
let fileError = '';
function resetDialog() {
  detail = null;
  restoreFile = null;
  fileError = '';
  fileRequest++;
}
function openDialog(value, opener) {
  resetDialog();
  const matching = [...root.querySelectorAll('[data-action="' + CSS.escape(opener) + '"]')];
  modalOpener = {action:opener, index:Math.max(0, matching.indexOf(document.activeElement))};
  detail = value;
  render();
}
function closeDialog() {
  const opener = modalOpener;
  modalOpener = null;
  resetDialog();
  render();
  const matches = opener ? root.querySelectorAll('[data-action="' + CSS.escape(opener.action) + '"]') : [];
  const trigger = matches[opener?.index];
  (trigger || document.getElementById('search') || document.querySelector('main h1'))?.focus({preventScroll:true});
}
function fileErrorView() {
  return fileError ? '<p class="file-error" role="alert">' + esc(fileError) + '</p>' : '';
}
function modal(){if(detail==='import')return `<div class="modal-shade"><section class="modal" role="dialog" aria-modal="true" aria-label="导入词表">${btn('closeModal',icon('close'),'close icon-button','aria-label="关闭"')}<span class="eyebrow">YOUR OWN COLLECTION</span><h2>导入词表</h2><p>支持 UTF-8 CSV 或 JSON，最多 5,000 个词。已有单词自动跳过。</p><p>每个词需有中英例句、搭配与中文释义。模板含一条可以替换的示例。搭配需包含单词原形。例如 art class 会生成 ___ class，artificial light 不含独立的 art。</p>${fileErrorView()}<div class="button-row">${btn('template','下载 CSV 模板','button subtle')}${btn('chooseImport','选择词表文件','button primary')}</div></section></div>`;if(detail==='restore')return `<div class="modal-shade"><section class="modal" role="dialog" aria-modal="true" aria-label="恢复备份">${btn('closeModal',icon('close'),'close icon-button','aria-label="关闭"')}<h2>恢复到备份中的进度？</h2><p>恢复将替换当前词库、进度、收藏与奖励。建议先导出当前备份。</p>${fileErrorView()}<div class="button-row">${btn('export','先导出当前备份','button subtle')}${btn('chooseRestore','选择备份','button primary')}</div>${restoreFile?`<p>已验证：${esc(restoreFile.name)}</p>${btn('confirmRestore','确认替换当前进度','button danger')}`:''}</section></div>`;const w=wordsFor(state).find(w=>w.id===detail);if(!w)return '';return `<div class="modal-shade"><section class="modal" role="dialog" aria-modal="true" aria-label="单词详情">${btn('closeModal',icon('close'),'close icon-button','aria-label="关闭"')}<span class="eyebrow">${esc(w.topic)}</span><div class="word-title"><h2>${esc(w.word)}</h2>${btn(`speak:${w.id}`,icon('sound'),'icon-button','aria-label="朗读单词"')}</div>${wordBack(w)}${btn(`favorite:${w.id}`,`${icon('star')} ${state.favorites.includes(w.id)?'取消收藏':'收藏这个词'}`,'button subtle')}</section></div>`;}
function render(){if(!state)return;
 if (composingSearch && route === 'library' && document.activeElement?.id === 'search' && !detail) {
   pendingLibraryRefresh = true;
   return;
 }
 const previousModalControl = root.querySelector('.modal')?.contains(document.activeElement)
   ? document.activeElement?.dataset.action : null;
 const oldQueue=root.querySelector('.queue-list');
 const queueTop=oldQueue?.scrollTop||0;
 const queueFocus=oldQueue?.contains(document.activeElement)?document.activeElement.dataset.action:null;
 const taskExpanded=root.querySelector('.daily-task-strip')?.open;
 document.body.classList.toggle('reduce-motion',state.settings.reduceMotion);document.body.dataset.theme=state.settings.theme;const palette=THEMES.find(t=>t.id===state.settings.theme)||THEMES[0];document.body.style.setProperty('--green',palette.color);document.body.style.setProperty('--soft',palette.soft);document.body.classList.toggle('widget-mode',isWidget);const focus=document.activeElement?.id;const val=focus==='spelling'?document.activeElement.value:null;const start=focus==='search'?document.activeElement.selectionStart:null;if(isWidget)root.innerHTML=widgetView();else root.innerHTML=`<div class="app-frame">${nav()}<main>${({today,review:reviewView,games,library,rewards,settings,widgetPreview:previewView}[route]||today)()}</main></div>${detail?modal():''}`;if(detail){
   const oldControl = previousModalControl && root.querySelector('.modal [data-action="' + CSS.escape(previousModalControl) + '"]');
   (oldControl || root.querySelector('.modal button'))?.focus({preventScroll:true});
 }if(focus&&!detail){const e=document.getElementById(focus);if(e){e.focus();if(val!==null)e.value=val;if(start!==null)e.setSelectionRange(start,start);}}const newQueue=root.querySelector('.queue-list');
 if(newQueue&&oldQueue?.dataset.deck===newQueue.dataset.deck){
  if(queueFocus)newQueue.querySelector(`[data-action="${CSS.escape(queueFocus)}"]`)?.focus({preventScroll:true});
  newQueue.scrollTop=queueTop;
 }
 if(taskExpanded&&root.querySelector('.daily-task-strip'))root.querySelector('.daily-task-strip').open=true;
 arcade.refresh();widgetResizeObserver.disconnect();const preview=document.querySelector('.preview-widget');if(preview)widgetResizeObserver.observe(preview);}
function download(name,text,type='application/json'){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function parseCSV(text){const rows=[];let row=[],field='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(field);field='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(Boolean))rows.push(row);row=[];field='';}else field+=c;}if(quoted)throw Error('CSV 中存在未闭合的引号');row.push(field);if(row.some(Boolean))rows.push(row);const headers=rows.shift()?.map(h=>h.replace(/^\uFEFF/,'').trim());if(!headers)throw Error('词表为空');return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]||''])));}
function pickFile(kind) {
  const request = ++fileRequest;
  fileError = '';
  if (kind === 'restore') restoreFile = null;
  render();
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = kind === 'restore' ? '.json' : '.json,.csv';
  input.onchange = async () => {
    const file = input.files[0];
    if (!file || request !== fileRequest) return;
    try {
      if (kind === 'import' && file.size > 20_000_000) throw Error('词表文件不能超过 20 MB');
      const content = (await file.text()).replace(/^\uFEFF/, '');
      if (request !== fileRequest) return;
      if (kind === 'restore') {
        const candidate = validateState(JSON.parse(content));
        restoreFile = {name:file.name, state:candidate};
        render();
        document.querySelector('[data-action="confirmRestore"]')?.focus();
      } else {
        const data = file.name.toLowerCase().endsWith('.csv') ? parseCSV(content) : JSON.parse(content);
        const result = await act({type:'import', words:Array.isArray(data) ? data : data?.words});
        if (result && request === fileRequest) {
          wordLibrary.recordBatch(result);
          route = 'library';
          closeDialog();
          toast('已导入 ' + result.imported + ' 个新词，跳过重复 ' + result.skipped + ' 条');
        }
      }
    } catch (error) {
      if (request !== fileRequest) return;
      fileError = error instanceof SyntaxError ? 'JSON 格式有误。' + error.message : error.message;
      render();
    }
  };
  input.click();
}
async function handle(action){
 if(busy)return;
 const [name,...args]=action.split(':'),id=args.join(':');
 if(name==='nav'){if(route==='games'&&id!=='games')arcade.suspend();if(route==='review'||route==='widgetPreview'){selected=null;revealed=false;}route=id;resetDialog();modalOpener=null;waitingForReview=false;
  if(route==='today')inspectRevealed=false;
  if(route==='settings'&&desktop)displayList=await desktop.displays();
  render();window.scrollTo(0,0);root.querySelector('main h1')?.focus({preventScroll:true});return;}
 if(name==='speak'){const ex=id.endsWith(':example'),wid=ex?id.slice(0,-8):id;const w=wordsFor(state).find(w=>w.id===wid);if(w)speak(ex?w.example:w.word);return;}
 if(name==='flip'){revealed=true;if(isWidget||route==='widgetPreview')renderWidget();else render();return;}
 if(name==='widgetSize'){previewSize={width:Number(args[0]),height:Number(args[1])};await act({type:'settings',patch:{widgetWidth:previewSize.width,widgetHeight:previewSize.height}});render();return;}
 if(name==='widgetKnow'){await gradeWidget(Number(id));return;}
 if(name==='rate'&&(isWidget||route==='widgetPreview')){if(revealed)await gradeWidget(Number(id));return;}
 if(name==='rate'){const w=currentWord();if(!w||!revealed)return;const r=await act({type:'review',id:w.id,rating:Number(id)});if(r){revealed=false;selected=null;if(r.reward)toast('今日学习任务完成 +6 积分');else if(!r.scheduled)toast('练习完成，下次复习时间不变');else if(Number(id)===1)toast(`已记录「忘记了」，${dueLabel(Date.parse(state.cards[w.id].due))}再复习 ${w.word}。`);}render();return;}
 if(name==='favorite'){
  const keepFocus=!detail&&document.activeElement?.dataset.action===action;
  await act({type:'favorite',id});render();
  if(keepFocus)root.querySelector(`[data-action="${CSS.escape(action)}"]`)?.focus({preventScroll:true});
  return;
 }
 if(name==='inspect'){selectInspector(id);return;}
 if(name==='inspectMeaning'){selectInspector(inspectId,!inspectRevealed);return;}
 if(name==='studyWord'||name==='resumeReview'){
  selected=name==='studyWord'?id:null;revealed=false;waitingForReview=false;route='review';
  render();window.scrollTo(0,0);root.querySelector('main h1')?.focus({preventScroll:true});return;
 }
 if(name==='allowTaskWords'){
   const result=await act({type:'allowTaskWords',showAll:id==='all'});
   if(result){selected=result.ids[0];revealed=false;detail=null;route='review';}
   render();return;
 }
 if(name==='switchToBuiltIn'){
  if(await act({type:'settings',patch:{deck:'all'}})){waitingForReview=false;inspectId=null;render();}
  return;
 }
 if(name==='detail'){openDialog(id,action);return;}
 if(name==='closeModal'){closeDialog();return;}
 if(name==='favorites'){wordLibrary.toggleFavorites();render();document.querySelector('[data-action="favorites"]')?.focus({preventScroll:true});return;}
 if(name==='clearLibraryFilters'){wordLibrary.clearFilters();render();document.getElementById('search')?.focus();return;}
 if(name==='showImportBatch'||name==='closeImportBatch'){wordLibrary.showBatch(name==='showImportBatch');render();document.getElementById('search')?.focus();return;}
 if(name==='libraryPage'){
   wordLibrary.movePage(Number(id));
   updateLibraryResults();
   const firstWord=document.querySelector('.word-row');
   firstWord?.focus({preventScroll:true});firstWord?.scrollIntoView({block:'nearest'});
   return;
 }
 if(name==='motion'){await act({type:'settings',patch:{reduceMotion:!state.settings.reduceMotion}});render();return;}
 if(['arcadeFire','arcadeLeft','arcadeRight','arcadePause'].includes(name)){if(name==='arcadeFire')await arcade.fire();else if(name==='arcadePause')arcade.toggle();else arcade.move(name==='arcadeLeft'?-.1:.1);return;}
 if(['memoryFlip','memoryContinue','memoryNext'].includes(name)){const g=state.game;if(g)await act({type:name,gameId:g.id,level:g.level,card:Number(id)});render();return;}
 if(name==='start'){if(await act({type:'startGame',mode:id}))renderGameStep();return;}
 if(name==='retryMistakes'){if(await act({type:name,gameId:state.game?.id}))renderGameStep();return;}
 if(name==='check'||name==='skipCheck'){
   const g=state.game;
   if(g&&await act({type:'checkMeaning',gameId:g.id,index:g.index,answer:id,skip:name==='skipCheck'}))renderGameStep();
   return;
 }
 if(name==='answer'||name==='submitAnswer'){const g=state.game;if(!g)return;const answer=name==='answer'?id:document.querySelector('#spelling')?.value;if(!answer?.trim()){toast('先填一个答案吧');return;}await act({type:'answer',gameId:g.id,index:g.index,answer});renderGameStep();return;}
 if(['nextQuestion','revive','endGame'].includes(name)){await act({type:name});renderGameStep();return;}
 if(name==='buyTicket'||name==='buyForest'){const r=await act({type:'buy',item:name==='buyTicket'?'ticket':'forest'});if(r)toast(name==='buyTicket'?'已兑换 1 张复活券':'青绿配色已解锁');render();return;}
 if(name==='wallpaper'){if(!state.unlocks.includes('wallpaper-'+id)){toast('请先解锁壁纸');return;}const blob=await wallpaperPng(id);download('Wordnook-'+id+'-3840x2160.png',blob,'image/png');return;}
 if(name==='testVoice'){speak('Regular practice helps you remember new words.');return;}
 if(name==='refreshVoices'){render();toast('已刷新声音列表');return;}
 if(name==='purchase'){const r=await act({type:'buy',item:id});if(r)toast('已解锁，可在奖励页启用');render();return;}
 if(name==='theme'||name==='sticker'){await act({type:'settings',patch:{[name==='theme'?'theme':'sticker']:id}});render();return;}
 if(name==='forest'){await act({type:'settings',patch:{theme:state.settings.theme==='forest'?'paper':'forest'}});render();return;}
 if(name==='corner'){await act({type:'settings',patch:{corner:id}});render();return;}
 if(name==='widget'){widgetSession.rotatedAt=Date.now();if(desktop)await desktop.window('toggle');else {route='widgetPreview';selected=null;revealed=false;render();}return;}
 if(name==='openMain'){if(desktop)await desktop.window('main');else {route='today';selected=null;revealed=false;render();}return;}
 if(name==='widgetMenu'){widgetSession.menu=!widgetSession.menu;widgetSession.rotatedAt=Date.now();renderWidget(widgetSession.menu?'pause':'widgetMenu');return;}
 if(name==='widgetBrowse'||name==='widgetStudy'){widgetSession.browsing=name==='widgetBrowse';widgetSession.id=null;widgetSession.correction=null;widgetSession.menu=false;widgetSession.rotatedAt=Date.now();revealed=false;renderWidget();return;}
 if(name==='snooze'){widgetSession.menu=false;if(desktop)await desktop.window('snooze');else widgetSession.hiddenUntil=Date.now()+15*60_000;widgetSession.rotatedAt=Date.now();renderWidget();return;}
 if(name==='widgetWake'){widgetSession.hiddenUntil=0;widgetSession.rotatedAt=Date.now();renderWidget();return;}
 if(name==='pause'){paused=!paused;widgetSession.menu=false;widgetSession.rotatedAt=Date.now();renderWidget('widgetMenu');return;}
 if(name==='skip'||name==='previous'||name==='widgetContinue'){moveWidget(name==='previous'?-1:1);return;}
 if(name==='import'||name==='restore'){openDialog(name,action);return;}
 if(name==='chooseImport'||name==='chooseRestore'){pickFile(name==='chooseImport'?'import':'restore');return;}
 if(name==='confirmRestore'){if(restoreFile&&await act({type:'restore',state:restoreFile.state})){wordLibrary.reset();selected=null;revealed=false;closeDialog();toast('已恢复备份');}return;}
 if(name==='export'){if(desktop){if(await desktop.exportBackup())toast('备份已导出');}else download(`wordnook-backup-${dayKey()}.json`,JSON.stringify(state,null,2));return;}
 if(name==='template'){const w={word:'noteworthy',pos:'adj.',meaning:'值得注意的',phrase:'a noteworthy change',phraseZh:'值得注意的变化',example:'We noticed a noteworthy change in the results.',exampleZh:'我们注意到结果出现了值得关注的变化。',topic:'学术'},keys=['word','pos','meaning','phrase','phraseZh','example','exampleZh','topic'];download('wordnook-import-template.csv','\uFEFF'+keys.join(',')+'\n'+keys.map(k=>'"'+String(w[k]).replaceAll('"','""')+'"').join(','),'text/csv;charset=utf-8');}
}
root.addEventListener('click',e=>{const target=e.target.closest('[data-action]');if(target&&!target.disabled){e.preventDefault();handle(target.dataset.action).catch(err=>toast(err.message));}});
root.addEventListener('submit',e=>{e.preventDefault();if(e.target.id==='answer-form')handle('submitAnswer');});
root.addEventListener('compositionstart', e => { if(e.target.id==='search') composingSearch = true; });
root.addEventListener('compositionend', e => {
  if(e.target.id!=='search') return;
  composingSearch = false;
  wordLibrary.search(e.target.value);
  updateLibraryResults();
  if (pendingLibraryRefresh) {
    pendingLibraryRefresh = false;
    setTimeout(() => { if (route === 'library') render(); }, 0);
  }
});
root.addEventListener('input',e=>{
  if(e.target.id==='search'&&!e.isComposing&&!composingSearch){
    wordLibrary.search(e.target.value);
    updateLibraryResults();
  }
});
root.addEventListener('change',async e=>{if(e.target.id==='topic'){wordLibrary.setTopic(e.target.value);updateLibraryResults();return;}if(e.target.id==='deck')wordLibrary.switchDeck();if(e.target.id==='accent'){await act({type:'settings',patch:{accent:e.target.value,voice:''}});render();return;}const map={voice:['voice',e.target.value],deck:['deck',e.target.value],display:['display',e.target.value],opacity:['opacity',Number(e.target.value)],rotate:['rotateSeconds',Number(e.target.value)],startup:['launchAtLogin',e.target.checked],'show-widget':['widget',e.target.checked],'new-limit':['newLimit',Number(e.target.value)]};if(map[e.target.id]){const [key,value]=map[e.target.id];await act({type:'settings',patch:{[key]:value}});render();}});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&detail){e.preventDefault();closeDialog();return;}
 if(detail&&e.key==='Tab'){const els=[...document.querySelectorAll('.modal button,.modal input')].filter(x=>!x.disabled),first=els[0],last=els.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}return;}
 if(detail||/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName)||e.metaKey||e.ctrlKey||e.altKey)return;
 if(isWidget||route==='widgetPreview'){widgetKeyboard(e);return;}
 if(route==='review'){if(e.code==='Space'&&document.activeElement?.closest('button,a,summary,[role="button"]'))return;if(e.code==='Space'&&!revealed){e.preventDefault();handle('flip');}else if(revealed&&/^[1-4]$/.test(e.key))handle(`rate:${e.key}`);}
 else if(route==='games'&&state.game&&!state.game.feedback&&['flight','fishing'].includes(state.game.mode)){if(['ArrowLeft','ArrowRight','Space'].includes(e.code)){e.preventDefault();if(e.code==='Space')arcade.fire();else arcade.move(e.code==='ArrowLeft'?-.1:.1);}if(e.code==='KeyP'){e.preventDefault();arcade.toggle();}}
 else if(route==='games'&&!state.game?.completed&&state.game&&/^[1-4]$/.test(e.key)){
   const g=state.game,id=g.questions[g.index]?.options[Number(e.key)-1];
   if(id&&g.feedback?.needsCheck)handle('check:'+id);
   else if(id&&g.mode==='meaning'&&!g.feedback)handle('answer:'+id);
 }
});
function receiveState(s){if(s.revision<state.revision)return;if(s.settings.widgetWidth!==state.settings.widgetWidth||s.settings.widgetHeight!==state.settings.widgetHeight)previewSize=null;if(selected&&s.cards[selected]?.last_review!==state.cards[selected]?.last_review){revealed=false;selected=null;}state=s;render();}
const arcade=createArcade({getState:()=>state,getRoute:()=>route,toast,answer:async(answer,timeout,g)=>{await act({type:'answer',gameId:g.id,index:g.index,answer,timeout});renderGameStep();}});
try{
  let pendingState=null;
  const onChange=incoming=>{
    if(state) receiveState(incoming);
    else if(!pendingState||incoming.revision>=pendingState.revision) pendingState=incoming;
  };
  if(desktop) desktop.onState(onChange);
  else addEventListener('storage',event=>{
    if(event.key==='wordnook-v1'&&event.newValue){
      try{onChange(JSON.parse(event.newValue));}
      catch{toast('无法同步窗口，请重新打开');}
    }
  });
  const loaded=desktop?await desktop.getState():await readLocal();
  state=pendingState&&pendingState.revision>loaded.revision?pendingState:loaded;
  render();
}catch(e){showStartupRecovery(root,e,desktop,download);}
setInterval(() => {
  if (!state) return;
  if (!isWidget && !detail && ['today','review'].includes(route)) refreshStudyClock();
  if (!isWidget && route !== 'widgetPreview') return;
  const now = Date.now();
  if (widgetSession.hiddenUntil && now >= widgetSession.hiddenUntil) {
    widgetSession.hiddenUntil = 0;
    widgetSession.rotatedAt = now;
    renderWidget();
  }
  const shell = root.querySelector('.widget-shell');
  if (paused || widgetSession.menu || widgetSession.correction || widgetSession.hiddenUntil || revealed || shell?.matches(':hover')) {
    widgetSession.rotatedAt = now;
  } else if (now - widgetSession.rotatedAt >= state.settings.rotateSeconds * 1000) {
    moveWidget(1);
  }
},1000);
root.addEventListener('pointerout', event => {
  const shell = event.target.closest('.widget-shell');
  if (shell && !shell.contains(event.relatedTarget)) widgetSession.rotatedAt = Date.now();
});


if('speechSynthesis' in window)speechSynthesis.addEventListener('voiceschanged',()=>{if(state&&route==='settings')render();});
