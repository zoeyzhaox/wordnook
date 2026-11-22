import {test,expect} from '@playwright/test';

const mode = (p,name) => p.locator('[data-action="start:'+name+'"]');
const begin = async (p,name) => {
  await p.goto('/');
  await p.getByRole('button',{name:'小游戏',exact:true}).click();
  await mode(p,name).click();
  await expect(p.locator('.game-question')).toBeVisible();
};
const game = p => p.evaluate(()=>JSON.parse(localStorage.getItem('wordnook-v1')).game);

test('menu names and geometry, spelling focus, Enter progression',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'小游戏',exact:true}).click();
  await expect(mode(page,'memory')).toHaveAccessibleName('开始配对');
  const box=await mode(page,'memory').boundingBox();
  expect(box.y+box.height).toBeLessThan(page.viewportSize().height);
  await mode(page,'phrase').click();
  await expect(page.locator('#spelling')).toBeFocused();
  await page.keyboard.type('wrong');
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-action="nextQuestion"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('.game-question>.eyebrow')).toContainText('第 2 题');
  await expect(page.locator('#spelling')).toBeFocused();
});

test('center fire hits no unhighlighted target and untimed recall can be skipped',async({page})=>{
  await begin(page,'flight');
  await expect(page.locator('.arcade-target.aimed')).toHaveCount(0);
  await page.keyboard.press('Space');
  await expect(page.locator('.motor-check')).toContainText('没有命中目标');
  const g=await game(page);
  expect(g.feedback.submitted).toBe('__miss');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('wordnook-v1')).history.length)).toBe(0);
  await page.getByRole('button',{name:'跳过辨义'}).click();
  await expect(page.locator('[data-action="nextQuestion"]')).toBeFocused();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('wordnook-v1')).history.length)).toBe(0);
});

test('5/8 last-heart result exposes selected and correct meanings and has a targeted retry',async({page})=>{
  await begin(page,'meaning');
  for(let i=0;i<8;i++){
    const q=(await game(page)).questions[i];
    await page.locator('[data-action="answer:'+(i<5?q.id:q.options.find(x=>x!==q.id))+'"]').click();
    if(i<7){
      await expect(page.locator('[data-action="nextQuestion"]')).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.locator('.game-question>.eyebrow')).toContainText('第 '+(i+2)+' 题');
    }
  }
  await expect(page.locator('.finish-stamp')).toContainText('5 / 8');
  await expect(page.locator('.mistake-review li')).toHaveCount(3);
  await expect(page.locator('.mistake-review')).toContainText('你的答案');
  await page.getByRole('button',{name:'再练这几个'}).click();
  await expect(page.locator('.game-question>.eyebrow')).toContainText('第 1 题 / 3');
});

test('a two-word deck ignores absent numeric choices',async({page})=>{
  await page.goto('/');
  await page.evaluate(async()=>{
    const {initialState,transition}=await import('/src/core.js');
    const words=['kestrel','xylophone'].map((w,i)=>({
      word:w,meaning:['红隼','木琴'][i],phrase:'a '+w,phraseZh:'一个例子',
      example:'I see a '+w+'.',exampleZh:'我看到了。'
    }));
    let state=transition(initialState(),{type:'import',words}).state;
    state=transition(state,{type:'settings',patch:{deck:'custom'}}).state;
    localStorage.setItem('wordnook-v1',JSON.stringify(state));
  });
  await page.reload();
  await page.getByRole('button',{name:'小游戏',exact:true}).click();
  await mode(page,'meaning').click();
  await expect(page.locator('.choice')).toHaveCount(2);
  await page.keyboard.press('4');
  await expect(page.locator('.hearts')).toHaveAttribute('aria-label','剩余 3 颗心');
  expect((await game(page)).feedback).toBeNull();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('wordnook-v1')).history.length)).toBe(0);
});
