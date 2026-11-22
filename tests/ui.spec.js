import {test,expect} from '@playwright/test';
test('learn, persist, browse, and synchronize the widget',async({page,context})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.getByRole('heading',{name:'今日学习'})).toBeVisible();
 await page.screenshot({path:'test-output/today.png',fullPage:true});
 await page.locator('[data-action="inspect:adapt"]').click();await expect(page.locator('.word-inspector h2').last()).toHaveText('adapt');
 await page.getByRole('button',{name:'开始今天的学习'}).click();
 await expect(page.getByRole('heading',{name:'abundant',exact:true})).toBeVisible();
 await page.keyboard.press('Space');await expect(page.getByText('丰富的；大量的',{exact:false})).toBeVisible();
 await page.screenshot({path:'test-output/review.png',fullPage:true});
 await page.keyboard.press('3');await expect(page.getByRole('heading',{name:'adapt',exact:true})).toBeVisible();
 await page.reload();await expect(page.locator('.balance strong')).toHaveText('0');
 const widget=await context.newPage();await widget.setViewportSize({width:330,height:432});await widget.goto('/?mode=widget');await expect(widget.getByRole('heading',{name:'adapt',exact:true})).toBeVisible();
 await widget.getByRole('button',{name:'详细评分'}).click();await widget.screenshot({path:'test-output/widget.png',fullPage:true});await widget.getByRole('button',{name:'记得',exact:true}).click();
 await expect(page.locator('.balance strong')).toHaveText('0');
 await page.getByRole('button',{name:'词库',exact:true}).click();await page.getByRole('searchbox').fill('allocate');await expect(page.locator('.word-row')).toHaveCount(1);await page.locator('.word-row').click();await expect(page.getByRole('dialog')).toContainText('allocate resources');await page.getByRole('button',{name:'收藏这个词'}).click();await page.getByRole('button',{name:'关闭',exact:true}).click();
 await page.getByRole('button',{name:'小游戏',exact:true}).click();await page.screenshot({path:'test-output/games.png',fullPage:true});await page.getByRole('button',{name:'开始选词义'}).click();await expect(page.locator('.choice')).toHaveCount(4);await page.locator('.choice').first().click();await expect(page.locator('.feedback')).toBeVisible();
 expect(errors).toEqual([]);
});
test('spelling game, reward redemption, revive, settings and JSON import',async({page})=>{
 await page.goto('/');
 // Seed earned currency only for this economy test; UI has no debug affordance.
 await page.evaluate(async()=>{const {initialState}=await import('/src/core.js');const s=initialState();s.coins=90;localStorage.setItem('wordnook-v1',JSON.stringify(s));});await page.reload();
 await page.getByRole('button',{name:'奖励'}).click();await page.getByRole('button',{name:'8 积分 · 兑换'}).click();await expect(page.locator('.balance strong')).toHaveText('82');await page.getByRole('button',{name:'20 积分 · 解锁'}).click();await page.getByRole('button',{name:'使用青绿配色'}).click();await expect(page.locator('body')).toHaveAttribute('data-theme','forest');
 await page.getByRole('button',{name:'小游戏',exact:true}).click();await page.getByRole('button',{name:'开始拼写'}).click();
 for(let i=0;i<3;i++){await page.getByRole('textbox',{name:'缺少的单词'}).fill('wrong');await page.getByRole('textbox',{name:'缺少的单词'}).press('Enter');await expect(page.locator('.feedback')).toBeVisible();if(i<2)await page.getByRole('button',{name:'下一题 →'}).click();}
 await page.getByRole('button',{name:'使用复活券（1）'}).click();await expect(page.locator('.hearts')).toHaveAttribute('aria-label','剩余 2 颗心');
 await page.getByRole('button',{name:'偏好设置'}).click();await page.getByRole('button',{name:'左上',exact:true}).click();await expect(page.getByRole('button',{name:'左上',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'词库',exact:true}).click();await page.getByRole('button',{name:'导入词表',exact:true}).click();const [chooser]=await Promise.all([page.waitForEvent('filechooser'),page.getByRole('button',{name:'选择词表文件'}).click()]);await chooser.setFiles({name:'words.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify([{word:'clarify',meaning:'澄清',phrase:'clarify a point',phraseZh:'澄清一点',example:'Please clarify the last point.',exampleZh:'请澄清最后一点。'}]))});await expect(page.getByRole('dialog')).toHaveCount(0);await page.getByRole('searchbox').fill('clarify');await expect(page.locator('.word-row')).toHaveCount(1);
});
test('complete an eight-question run and restore a backup only after confirmation',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'小游戏',exact:true}).click();await page.getByRole('button',{name:'开始选词义'}).click();
 for(let i=0;i<8;i++){await expect(page.locator('.game-question > .eyebrow')).toContainText(`第 ${i+1} 题`);const id=await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('wordnook-v1'));return s.game.questions[s.game.index].id;});await page.locator(`[data-action="answer:${id}"]`).click();await page.getByRole('button',{name:i===7?'查看结果':'下一题 →'}).click();}
 await expect(page.getByRole('heading',{name:'本局结果'})).toBeVisible();await expect(page.locator('.balance strong')).toHaveText('2');
 await page.getByRole('button',{name:'偏好设置'}).click();const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'导出备份',exact:true}).click()]);const backupPath=await download.path();
 await page.getByRole('button',{name:'恢复备份',exact:true}).click();const [chooser]=await Promise.all([page.waitForEvent('filechooser'),page.getByRole('button',{name:'选择备份',exact:true}).click()]);await chooser.setFiles(backupPath);await expect(page.getByRole('button',{name:'确认替换当前进度'})).toBeVisible();const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('wordnook-v1')).revision);await page.getByRole('button',{name:'确认替换当前进度'}).click();await expect(page.getByRole('dialog')).toHaveCount(0);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('wordnook-v1')).revision)).toBe(before+1);await expect(page.locator('.balance strong')).toHaveText('2');
});

test('in-page widget, deck selection, collectibles, and speech status',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'预览悬浮窗',exact:true}).click();await expect(page.locator('.preview-widget')).toBeVisible();await page.getByRole('button',{name:'左下',exact:true}).click();await expect(page.locator('.desktop-stage')).toHaveAttribute('data-corner','bottom-left');await page.getByRole('button',{name:'详细评分',exact:true}).click();await page.getByRole('button',{name:'记得',exact:true}).click();await expect(page.locator('.balance strong')).toHaveText('0');
 await page.getByRole('button',{name:'词库',exact:true}).click();await page.locator('#deck').selectOption('ielts');await page.getByRole('searchbox').fill('affordable');await expect(page.locator('.word-row')).toHaveCount(1);await page.locator('#deck').selectOption('toefl');await expect(page.locator('.word-row')).toHaveCount(0);
 await page.getByRole('button',{name:'偏好设置'}).click();await expect(page.getByRole('heading',{name:'英语发音'})).toBeVisible();await page.locator('#accent').selectOption('en-GB');await expect(page.locator('#accent')).toHaveValue('en-GB');
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('wordnook-v1'));s.coins=150;localStorage.setItem('wordnook-v1',JSON.stringify(s));});await page.reload();await page.getByRole('button',{name:'奖励',exact:true}).click();await page.locator('[data-action="purchase:sticker-stamp"]').click();await page.getByRole('button',{name:'贴上已读印章'}).click();await expect(page.locator('.brand .worn-sticker')).toBeVisible();await page.locator('[data-action="purchase:plum"]').click();await page.getByRole('button',{name:'使用梅紫配色'}).click();await expect(page.locator('body')).toHaveAttribute('data-theme','plum');await page.screenshot({path:'test-output/rewards-v012.png',fullPage:true});await page.getByRole('button',{name:'今日',exact:true}).click();await page.getByRole('button',{name:'预览悬浮窗',exact:true}).click();await expect(page.locator('.preview-widget .worn-sticker')).toBeVisible();await page.screenshot({path:'test-output/preview-v012.png',fullPage:true});
});

test('study dashboard protects recall, starts the selected word and keeps the queue in place',async({page})=>{
 await page.clock.install();
 await page.goto('/');
 await expect(page.locator('.word-inspector .meaning')).toHaveCount(0);
 const row=page.locator('[data-action="inspect:beneficial"]');
 await row.scrollIntoViewIfNeeded();
 const offset=await page.locator('.queue-list').evaluate(el=>el.scrollTop);
 expect(offset).toBeGreaterThan(0);
 await row.click();
 await expect(row).toBeFocused();
 await expect(page.locator('.word-inspector .word-title')).toContainText('beneficial');
 await page.clock.runFor(31000);
 await expect(row).toBeFocused();
 expect(await page.locator('.queue-list').evaluate(el=>el.scrollTop)).toBe(offset);
 await page.getByRole('button',{name:'看释义',exact:true}).click();
 await expect(page.locator('.word-inspector .meaning')).toContainText('有益');
 await page.getByRole('button',{name:'练这个词'}).click();
 await expect(page.locator('.flashcard h2')).toHaveText('beneficial');
 await expect(page.locator('.flashcard .meaning')).toHaveCount(0);
 const star=page.getByRole('button',{name:'收藏单词'});
 await star.focus();await page.keyboard.press('Space');
 await expect(star).toHaveAttribute('aria-pressed','true');
 await expect(star).toBeFocused();
 await expect(page.locator('.ratings')).toHaveCount(0);
});

test('study break names the next due word and lets the learner resume when due',async({page})=>{
 await page.clock.install({time:new Date('2026-11-22T12:00:00')});
 await page.clock.pauseAt(new Date('2026-11-22T12:00:01'));
 await page.goto('/');
 await page.getByRole('button',{name:'开始今天的学习'}).click();
 for(let i=0;i<10;i++){
  await page.getByRole('button',{name:/显示答案/}).click();
  await page.locator(`[data-action="rate:${i===0?1:4}"]`).click();
  if(i===0)await expect(page.locator('#toast')).toContainText('再复习 abundant');
 }
 await expect(page.locator('[data-study-break]')).toContainText('1 分钟后再复习 abundant');
 await expect(page.locator('[data-study-break]')).toContainText('还差 1 个词');
 await page.clock.runFor(61000);
 await page.getByRole('button',{name:'继续复习'}).click();
 await expect(page.locator('.flashcard h2')).toHaveText('abundant');
});

test('empty custom deck offers import and mobile settings and reward estimates remain reachable',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'奖励',exact:true}).click();
 await expect(page.locator('.footnote').first()).toContainText('还差 100 分');
 await expect(page.locator('.footnote').first()).toContainText('17 天');
 await expect(page.locator('.footnote').first()).toContainText('最快 10 天');
 await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
 await page.getByRole('button',{name:'今日',exact:true}).click();
 expect(await page.evaluate(()=>scrollY)).toBe(0);
 await page.getByRole('button',{name:'词库',exact:true}).click();
 await page.locator('#deck').selectOption('custom');
 await page.getByRole('button',{name:'今日',exact:true}).click();
 await expect(page.locator('.word-inspector')).toHaveCount(0);
 await page.getByRole('button',{name:'导入第一份词表'}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'使用内置词库'}).click();
 await expect(page.locator('.study-lead')).toContainText('全部词汇 · 今天可学 10 词');
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'偏好设置',exact:true}).click();
 await page.locator('#new-limit').selectOption('5');
 await expect(page.locator('#new-limit')).toHaveValue('5');
 const download=page.waitForEvent('download');
 await page.getByRole('button',{name:'导出备份',exact:true}).click();
 expect((await download).suggestedFilename()).toMatch(/backup.*\.json$/);
});
