// One transient animation loop; all scoring remains in the authoritative state reducer.
export function createArcade({getState,getRoute,answer,toast}){
 let key='',progress=0,aim=.5,paused=false,shooting=false,last=0,stage=null,previouslyHidden=false;
 const current=()=>{const g=getState()?.game;return getRoute()==='games'&&g&&['flight','fishing'].includes(g.mode)&&!g.completed?g:null;};
 function refresh(){const g=current();stage=document.querySelector('.arcade-stage');if(!g||!stage)return;const next=g.id+':'+g.index;if(key!==next){key=next;progress=0;aim=.5;paused=false;shooting=false;last=0;}paint(g);}
 function positions(g){const n=g.questions[g.index].options.length;return Array.from({length:n},(_,i)=>(i+.5)/n+(g.mode==='fishing'?Math.sin(progress*12+i*2)*.045:0));}
 function paint(g){if(!stage)return;const active=!g.feedback;stage.classList.toggle('arcade-paused',paused);const overlay=stage.querySelector('.arcade-overlay');overlay.hidden=!paused||!active;const clock=document.querySelector('.arcade-clock');if(clock)clock.textContent=g.feedback?'本轮结束':paused?'已暂停':Math.ceil((1-progress)*duration(g))+' 秒';const pb=document.querySelector('[data-action="arcadePause"]');if(pb){pb.textContent=paused?'继续':'暂停';pb.disabled=!!g.feedback;}
 stage.querySelector('.arcade-player').style.left=aim*100+'%';stage.querySelector('.arcade-time-track i').style.transform=`scaleX(${1-progress})`;
 positions(g).forEach((x,i)=>{const el=stage.querySelector(`[data-lane="${i}"]`);if(el){el.style.left=x*100+'%';el.style.top=(g.mode==='flight'?35+progress*205:95+(i%2)*68)+'px';el.classList.toggle('aimed',Math.abs(x-aim)<.11);el.classList.toggle('target-hit',!!g.feedback?.correct&&g.questions[g.index].options[i]===g.questions[g.index].id);}});
 }
 const duration=g=>Math.max(10,18-Math.floor(g.index/3)*3);
 async function fire(){const g=current();if(!g||g.feedback||paused||shooting)return;shooting=true;const snapshot=key,positionsNow=positions(g);let closest=0;positionsNow.forEach((x,i)=>{if(Math.abs(x-aim)<Math.abs(positionsNow[closest]-aim))closest=i;});const target=Math.abs(positionsNow[closest]-aim)<=.13?g.questions[g.index].options[closest]:'__miss';const projectile=stage?.querySelector('.arcade-projectile');if(projectile){projectile.style.left=aim*100+'%';projectile.classList.remove('fired');void projectile.offsetWidth;projectile.classList.add('fired');}await new Promise(r=>setTimeout(r,getState().settings.reduceMotion?0:220));if(key===snapshot&&current()?.id===g.id&&current()?.index===g.index)await answer(target,false,g);shooting=false;}
 function move(delta){const g=current();if(!g||g.feedback||paused)return;aim=Math.max(.06,Math.min(.94,aim+delta));paint(g);}
 function toggle(){const g=current();if(!g||g.feedback)return;paused=!paused;last=0;paint(g);}
 function suspend(){if(current()&&!current().feedback){paused=true;last=0;paint(current());}}
 document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();});window.addEventListener('blur',suspend);
 document.addEventListener('pointerdown',e=>{const el=e.target.closest('.arcade-stage');if(!el||!current()||current().feedback||paused)return;el.setPointerCapture(e.pointerId);place(e,el);});
 document.addEventListener('pointermove',e=>{const el=e.target.closest('.arcade-stage');if(el&&e.buttons===1&&current()&&!current().feedback&&!paused)place(e,el);});
 function place(e,el){const r=el.getBoundingClientRect();aim=Math.max(.06,Math.min(.94,(e.clientX-r.left)/r.width));paint(current());}
 function tick(time){const g=current();if(!g){if(key)paused=true;last=0;}else if(!stage?.isConnected){last=0;}else{const hidden=document.hidden;if(hidden&&!previouslyHidden)suspend();previouslyHidden=hidden;if(!paused&&!shooting&&!g.feedback&&!hidden){if(last)progress=Math.min(1,progress+Math.min(time-last,100)/1000/duration(g));last=time;paint(g);if(progress>=1){shooting=true;answer('',true,g).finally(()=>shooting=false);}}else last=0;}if(!g||paused||g.feedback)setTimeout(()=>requestAnimationFrame(tick),200);else requestAnimationFrame(tick);}
 requestAnimationFrame(tick);return {refresh,fire,move,toggle,suspend};
}
