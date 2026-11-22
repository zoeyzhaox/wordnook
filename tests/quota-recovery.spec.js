import {test,expect} from '@playwright/test';
import {initialState,queue,transition} from '../src/core.js';

test('an exhausted cross-deck task only adds today’s target slots after an explicit choice',async({page})=>{
  const now=Date.now();
  let s=initialState();
  const act=action=>{s=transition(s,action,now).state;};
  const rows=['sprout','fern','stem','hedge','shade','twig'].map(word=>({word,meaning:word,phrase:word+' here',phraseZh:word,example:word,exampleZh:word}));
  act({type:'settings',patch:{newLimit:5}});
  act({type:'import',words:rows});
  act({type:'review',id:'abundant',rating:4});
  act({type:'settings',patch:{deck:'custom'}});
  for(const word of queue(s,now)) act({type:'review',id:word.id,rating:4});
  await page.addInitScript(stored=>{if(!localStorage.getItem('wordnook-v1'))localStorage.setItem('wordnook-v1',JSON.stringify(stored));},s);
  await page.goto('/');
  const button=page.getByRole('button',{name:'切到全部词汇并增加今日任务名额'});
  await expect(button).toBeVisible();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('wordnook-v1')).settings.deck)).toBe('custom');
  await button.click();
  await expect(page.locator('h1')).toHaveText('单词卡');
  for(let i=0;i<4;i++){
    await page.locator('[data-action="flip"]').click();
    await page.locator('[data-action="rate:4"]').click();
  }
  await page.locator('[data-action="nav:today"]:visible').first().click();
  await expect(page.getByText(/已领取 6 分/)).toBeVisible();
  const result=await page.evaluate(()=>JSON.parse(localStorage.getItem('wordnook-v1')));
  expect(result.settings.newLimit).toBe(5);
  expect(result.coins).toBe(6);
  expect(Object.values(result.daily)[0].taskExtraIds).toHaveLength(4);
});
