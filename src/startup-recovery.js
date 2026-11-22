import {validateState} from './core.js';

export function showStartupRecovery(root,error,desktop,download){
  root.innerHTML='<main class="fatal"><h1>学习记录暂时无法读取</h1><p class="recovery-reason"></p><p>现有记录仍保存在本机。</p><div class="button-row"></div><p class="recovery-status" role="status"></p></main>';
  const reason=root.querySelector('.recovery-reason');
  reason.textContent=error.message;
  const actions=root.querySelector('.button-row'),status=root.querySelector('.recovery-status');
  function button(text,onClick){
    const control=document.createElement('button');
    control.className='button subtle';control.textContent=text;
    control.addEventListener('click',onClick);actions.append(control);
    return control;
  }
  button('重新读取',()=>location.reload());
  if(desktop) return;
  let original,selected;
  const originalCopyKey='wordnook-unreadable-'+crypto.randomUUID();
  try{original=localStorage.getItem('wordnook-v1');}
  catch{status.textContent='需要允许浏览器使用本地存储后重新读取。';return;}
  if(original!==null) button('下载当前记录原文',()=>download('wordnook-unreadable.json',original));
  const picker=document.createElement('input');
  picker.type='file';picker.accept='.json';picker.hidden=true;actions.append(picker);
  button('选择手动备份',()=>{selected=null;confirm.disabled=true;confirm.hidden=true;status.textContent='';picker.value='';picker.click();});
  const confirm=button('确认恢复并打开',async()=>{
    if(!selected)return;
    const recover=()=>{
      if(localStorage.getItem('wordnook-v1')!==original) throw Error('另一窗口更新了记录，请先重新读取。');
      if(original!==null) localStorage.setItem(originalCopyKey,original);
      // A live tab may still hold a newer revision than this older manual backup.
      // The unreadable original may not contain a usable revision to increment.
      const revision=Math.max(Date.now(),selected.revision+1);
      localStorage.setItem('wordnook-v1',JSON.stringify({...selected,revision}));
    };
    try{
      if(navigator.locks) await navigator.locks.request('wordnook-state',recover);
      else recover();
      location.reload();
    }catch(e){status.textContent=e.name==='QuotaExceededError'?'浏览器空间不足，原始记录仍保留。请下载原文，并在有足够空间的浏览器中恢复备份。':e.message;}
  });
  confirm.disabled=true;
  confirm.hidden=true;
  picker.addEventListener('change',async()=>{
    selected=null;confirm.disabled=true;confirm.hidden=true;
    const file=picker.files[0];if(!file)return;
    try{
      selected=validateState(JSON.parse(await file.text()));
      status.textContent=`已验证 ${file.name}：自建单词 ${selected.customWords.length} 个，学习记录 ${selected.history.length} 条。确认后保留原文副本，再恢复备份。`;
      confirm.hidden=false;confirm.disabled=false;confirm.focus();
    }catch(e){status.textContent='这份备份无法读取：'+e.message;}
  });
}
