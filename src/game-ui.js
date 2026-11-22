import {spellingPrompt,gamePool,phraseWordIndex} from './core.js';
import './game.css';
export function gameViews({state,esc,btn,head,wordsFor}){
 const s=state,ws=wordsFor(s),word=id=>ws.find(w=>w.id===id);
 const next=g=>g.index===g.questions.length-1?'查看结果':'下一题 →';
 const hearts=g=>`<span class="hearts" aria-label="剩余 ${g.lives} 颗心">${[0,1,2].map(i=>`<i class="${i>=g.lives?'empty-heart':''}">${i<g.lives?'♥':'♡'}</i>`).join('')}${g.feedback&&!g.feedback.correct?'<i class="lost-heart" aria-hidden="true">♥</i>':''}</span>`;
 const combo=g=>g.streak>=3?`<div class="combo-burst" role="status"><b>${g.streak} 连对</b><span>${g.streak===3?'漂亮！节奏起来了':'继续保持'}${g.feedback?.bonus?' · +'+g.feedback.bonus+' 积分':''}</span><i></i><i></i><i></i></div>`:'';
 function feedback(g,w){
  const f=g.feedback;if(!f)return '';
  const q=g.questions[g.index];
  if(f.needsCheck){
    const reason=f.timeout?'时间到了':f.submitted==='__miss'?'没有命中目标':'击中了其他目标';
    return `<section class="feedback motor-check"><strong>${reason} · 本轮扣一颗心</strong><p>再看看 <b>${esc(w.word)}</b> 的意思。这次不限时，选择后才记录记忆表现。</p><div class="choices">${q.options.map((id,i)=>btn('check:'+id,`<kbd>${i+1}</kbd>${esc(word(id).meaning)}`,'choice')).join('')}</div>${btn('skipCheck','跳过辨义','button subtle')}</section>`;
  }
  const chosen=word(f.submitted),meaningAnswer=g.mode==='meaning'||(['flight','fishing'].includes(g.mode)&&g.index%2===1);
  const correction=f.checked?`<p>不限时辨义：${f.checkAnswer?esc(word(f.checkAnswer).meaning)+(f.checkCorrect?'（正确）':'（有误）'):'已跳过'}</p>`:'';
  const progression=g.lives>0?btn('nextQuestion',next(g),'button primary'):`<div class="revive-row"><p>机会已用完。</p>${btn('endGame','查看本局结果','button primary')}${s.tickets?btn('revive',`使用复活券（${s.tickets}）`,'button subtle'):s.coins>=8?btn('buyTicket','8 积分兑换一张','button subtle'):''}</div>`;
  const submitted=chosen?(meaningAnswer?chosen.meaning:chosen.word):f.submitted==='__miss'?'未命中目标':f.submitted||'未作答';
  return `<div class="feedback ${f.correct?'good':'again'}" role="status"><strong>${f.correct?'回答正确':f.checked?'本轮结束':'回答不正确'}</strong><div class="answer-comparison">${!f.correct?`<p><label>你的答案</label><span>${esc(submitted)}</span></p>`:''}<p class="correct-answer"><label>正确答案</label><b>${esc(meaningAnswer?w.meaning:w.word)}</b></p></div>${correction}${g.mode==='phrase'?`<p>本轮应填：<b>${esc(spellingPrompt(w.word,q.round).answer)}</b></p>`:''}
   <p><b>${esc(w.word)}</b> — ${esc(w.meaning)}</p><p>${esc(w.phrase)} <span class="feedback-translation">${esc(w.phraseZh)}</span></p>
   <div class="feedback-meta">${f.reward?'今日学习任务 +'+f.reward+' 积分':f.guided?'提示练习，不计入掌握程度':f.checked&&!f.checkAnswer?'已跳过辨义，复习时间不变':f.scheduled?'已更新复习计划':'提前练习，不更改复习计划'}</div>
   ${progression}<details class="game-example"><summary>查看中英例句</summary><p>${esc(w.example)}</p><p class="feedback-translation">${esc(w.exampleZh)}</p></details></div>`;
 }
 function modeDiagram(id){
  const drawings={
   meaning:'<rect x="4" y="5" width="18" height="13" rx="2"/><rect x="26" y="5" width="18" height="13" rx="2"/><path d="m8 11 3 3 6-6M31 11h8"/>',
   phrase:'<path d="M4 20 8 8l4 12m-6-4h5M16 20h9m4 0h9"/><path d="M20 7v8" stroke-dasharray="2 2"/>',
   flight:'<rect x="17" y="2" width="14" height="6" rx="1"/><path d="M24 11v3m0 3-4 6 4-2 4 2Z"/>',
   fishing:'<path d="M14 2v6a3 3 0 0 0 6 0M23 16q8-8 16 0-8 8-16 0l-4 3v-6Z"/><circle cx="34" cy="15" r="1"/>',
   memory:'<rect x="4" y="4" width="17" height="17" rx="2"/><rect x="26" y="4" width="17" height="17" rx="2"/><path d="M8 16l4-8 4 8m-7-3h6m15-3h8v5h-8Zm4-3v12"/>'
  };
  return `<svg width="48" height="26" viewBox="0 0 48 26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${drawings[id]}</svg>`;
 }
 function menu(){
  const pool=gamePool(s),count=Math.min(pool.length,8);
  const spell=Math.min(pool.filter(w=>phraseWordIndex(w.phrase,w.word)>=0).length,4);
  const pairs=Math.min(new Set(pool.map(w=>w.meaning)).size,6);
  const modes=[
   ['meaning','词义选择','看英文，选择中文释义。',count+' 题','开始选词义',count],
   ['phrase','三轮拼写','从补字母逐步练到独立拼写。',spell+' 词 · 最多三轮','开始拼写',spell],
   ['flight','单词飞行','移动飞机，瞄准高亮的词再发射。',count+' 波 · 空格发射','开始飞行',count],
   ['fishing','词汇垂钓','左右移钩，在游动的小鱼下方下钩。',count+' 轮 · 空格下钩','开始垂钓',count],
   ['memory','记忆配对','翻开两张卡，把英文和中文配成对。','最多 '+pairs+' 对 · 不限时','开始配对',pairs>=2]
  ];
  return `${head('','小游戏','',`<span class="pill">复活券 ${s.tickets}</span>`)}<div class="game-modes compact-game-modes">${modes.map(([id,name,desc,hint,label,ready])=>`<section><div aria-hidden="true" class="mode-symbol new-mode-symbol ${id}">${modeDiagram(id)}</div><div class="mode-description"><h3>${name}</h3><p>${desc}</p><span class="mode-tag">${ready?hint:id==='memory'?'需要两个不同释义的可练词':'当前词库没有可练词'}</span></div>${btn('start:'+id,label,'button primary',ready?'':'disabled')}</section>`).join('')}</div>
   <div class="game-rules"><details><summary>查看奖励与复习规则</summary><p>前两局合格游戏各 +2 分。完整答完至少 4 题且正确率达 50% 即可计入；配对需完成全局且至少 2 对。少于 4 题的问答局仅作练习。</p><p>提示拼写、配对和跳过的辨义不改复习时间。每日学习 +6 分。</p></details>${btn('motion',s.settings.reduceMotion?'开启动画':'减少动画','button subtle')}</div>`;
 }
 function finish(g){
  const mistakes=g.mistakes||[];
  const count=g.partial?g.index+(g.feedback?1:0):g.questions.length;
  const entries=mistakes.map(m=>{
   const w=word(m.id),chosen=word(m.submitted),english=g.mode==='meaning'||m.index%2===1;
   const submitted=g.mode==='memory'&&chosen?(m.side==='zh'?chosen.meaning:chosen.word):g.mode==='phrase'?m.submitted:chosen?(english?chosen.meaning:chosen.word):m.timeout?'超时':'没有命中';
   return `<li><b>${esc(w.word)}</b><span>正确释义：${esc(w.meaning)}</span><span>${g.mode==='memory'?'翻到的另一张':m.checked?'操作记录':'你的答案'}：${esc(submitted)}${m.checked?' · 辨义：'+(m.checkAnswer?esc(word(m.checkAnswer).meaning):'已跳过'):''}</span>${g.mode==='phrase'?`<span>应填：${esc(spellingPrompt(w.word,m.round).answer)}</span>`:''}</li>`;
  }).join('');
  return `${head('','本局结果')}<div class="finish"><div class="finish-stamp">${g.score}<small>${g.mode==='memory'?' 对':' / '+count}</small></div><h2>${g.partial?'本局提前结束':'练习完成'}</h2><p>最高 ${g.bestStreak} 连对 · 本局获得 ${g.earned} 积分</p>${g.finishBonus?`<p>含通关奖励 +${g.finishBonus}</p>`:''}${entries?`<section class="mistake-review"><h3>本局回顾</h3><ul>${entries}</ul>${btn('retryMistakes','再练这几个','button primary')}</section>`:''}<div class="finish-actions">${btn('start:'+g.mode,'再玩一局','button subtle')}${btn('endGame','返回小游戏','button subtle')}</div></div>`;
 }
 function memory(g){const done=g.matched.length;return `${head('','记忆配对','',btn('endGame','结束本局','button subtle'))}<div class="memory-status"><b>第 ${g.level+1} 关 · ${g.board.length} 张</b><span>已配对 ${done} / ${g.board.length/2} · 尝试 ${g.moves} 次</span></div><p class="game-help">一次翻两张：找出同一个词的英文与中文。位置不变，翻错也可以继续。</p><div class="memory-board size-${g.board.length}">${g.board.map((c,i)=>{const matched=g.matched.includes(c.id),open=matched||g.open.includes(i);return btn('memoryFlip:'+i,`<span class="memory-inner"><span class="memory-back">${String(i+1).padStart(2,'0')}</span><span class="memory-front">${open?esc(c.side==='en'?word(c.id).word:word(c.id).meaning):''}<small>${open?(c.side==='en'?'EN':'中文'):''}</small></span></span>`,`memory-card ${open?'flipped':''} ${matched?'matched':''}`,`aria-label="${open?esc(c.side==='en'?word(c.id).word:word(c.id).meaning):'翻开第 '+(i+1)+' 张卡'}" ${matched||g.open.includes(i)||g.open.length===2?'disabled':''}`);}).join('')}</div>${g.feedback?`<div class="memory-feedback ${g.feedback.correct?'good':'again'}" role="status"><strong>${g.feedback.correct?'配对成功':'这两张不是一对'}</strong>${[...new Set(g.feedback.ids)].map(id=>`<p>${esc(word(id).word)} — ${esc(word(id).meaning)}</p>`).join('')}${g.stageComplete?`<p>本关完成${g.stageBonus?' · +'+g.stageBonus+' 积分':' · 小关不发积分，整局结束结算'}</p>${btn('memoryNext',g.level===2||g.board.length/2===g.pool.length?'查看结果':'进入下一关','button primary')}`:btn('memoryContinue',g.feedback.correct?'继续配对':'记住位置，盖回去','button primary')}</div>`:''}${combo(g)}`;}
 function arcade(g,w){const fish=g.mode==='fishing',q=g.questions[g.index],english=g.index%2===1;return `<div class="arcade-dashboard"><span>${fish?'目标鱼':'目标单词'}</span><strong>${esc(english?w.word:w.meaning)}</strong><span class="arcade-clock">准备</span>${btn('arcadePause','暂停','button subtle')}</div><div class="arcade-stage ${fish?'pond':'sky'} ${g.feedback?'resolved':''}" aria-label="${fish?'移动鱼钩':'拖动飞机'}" tabindex="0"><div class="arcade-time-track"><i></i></div><div class="arcade-lanes">${q.options.map((id,i)=>`<div class="arcade-target lane-${i}" data-lane="${i}" data-word="${esc(id)}" style="--lane:${i};--count:${q.options.length}">${fish?'<span class="fish-tail"></span>':''}<span>${esc(english?word(id).meaning:word(id).word)}</span>${fish?'<i class="fish-eye"></i>':''}</div>`).join('')}</div><div class="impact-line">${fish?'收线区':'碰撞线'}</div><div class="arcade-player" style="left:50%">${fish?'<span class="hook-line"></span><span class="hook">J</span>':'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 3 40 28 57 40v8l-21-6v10l7 6H21l7-6V42L7 48v-8l17-12Z" fill="currentColor"/></svg>'}</div><div class="arcade-projectile"></div><div class="arcade-overlay" hidden>已暂停</div></div><div class="arcade-controls">${btn('arcadeLeft','← 左移','button subtle')}${btn('arcadeFire',fish?'下钩 · Space':'发射 · Space','button primary',g.feedback?'disabled':'')}${btn('arcadeRight','右移 →','button subtle')}<span>${fish?'移动到小鱼下方，再下钩。':'拖动飞机对准目标，再发射。'}离开页面自动暂停。</span></div>`;}
 function game(g){if(g.completed)return finish(g);if(g.mode==='memory')return memory(g);const q=g.questions[g.index],w=word(q.id),sp=spellingPrompt(w.word,q.round),arc=['flight','fishing'].includes(g.mode);const pos=phraseWordIndex(w.phrase,w.word);return `${head('','练习中','',`<span class="pill">本局 +${g.earned} 分</span>${btn('motion',s.settings.reduceMotion?'动画已减少':'减少动画','button subtle')}${btn('endGame','结束本局','button subtle')}`)}<div class="game-top"><div class="trail-dots">${g.questions.map((_,i)=>`<span class="${i<g.index?'done':i===g.index?'here':''}">${i+1}</span>`).join('')}</div>${hearts(g)}</div><section class="game-question ${g.feedback&&!g.feedback.correct?'answer-shake':''} ${arc?'arcade-question':''}"><span class="eyebrow">第 ${g.index+1} 题 / ${g.questions.length}${g.mode==='phrase'?' · 第 '+(q.round+1)+' 轮 / 3':''}</span>${g.mode==='meaning'?`<h2>${esc(w.word)}</h2><p>选择正确释义</p><div class="choices">${q.options.map((id,i)=>btn('answer:'+id,`<kbd>${i+1}</kbd>${esc(word(id).meaning)}${g.feedback&&id===w.id?' <b>✓ 正确答案</b>':''}`,`choice ${g.feedback&&id===w.id?'correct':''} ${g.feedback&&!g.feedback.correct&&id===g.feedback.submitted?'wrong-choice':''}`,g.feedback?'disabled':'')).join('')}</div>`:arc?arcade(g,w):`<div class="spelling-rounds">${['补 1–2 个字母','只留首字母','完全回忆'].map((v,i)=>`<span class="${q.round===i?'active':''}">${i+1}. ${v}</span>`).join('')}</div><h2 class="phrase-question">${esc(w.phrase.slice(0,pos))}<span class="letter-mask">${esc(sp.mask)}</span>${esc(w.phrase.slice(pos+w.word.length))}</h2><p>${esc(w.phraseZh)}</p><p class="game-help">${q.round===0?'只输入空缺的 '+sp.answer.length+' 个字母，按从左到右的顺序。':q.round===1?'首字母已经给出，只输入空位中的字母。':'输入空位中的字母。单词本身的连字符、空格和撇号已经显示。'}</p><form id="answer-form"><input id="spelling" name="answer" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="${q.round===2?'输入完整单词':'只输入空缺字母'}" aria-label="缺少的单词" ${g.feedback?'disabled':''}>${btn('submitAnswer','确认答案','button primary',g.feedback?'disabled':'type="submit"')}</form>`}${feedback(g,w)}</section>${combo(g)}`;}
 return s.game?game(s.game):menu();
}
