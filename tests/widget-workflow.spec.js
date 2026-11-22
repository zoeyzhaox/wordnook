import {test, expect} from '@playwright/test';

const action = (page,id) => page.locator('[data-action="'+id+'"]:visible').first();

test('compact review keeps corrections on the word and exposes all quick controls', async ({page}) => {
  await page.setViewportSize({width:220,height:120});
  await page.goto('/?mode=widget');
  const meaning = page.locator('.widget-meaning');
  await expect(meaning).toBeHidden();
  await action(page,'widgetKnow:1').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('.widget-word h1')).toHaveText('abundant');
  await expect(meaning).toContainText('丰富的');
  await expect(meaning).toBeVisible();
  await expect(action(page,'widgetKnow:3')).toHaveCount(0);
  await expect(action(page,'widgetContinue')).toBeFocused();
  await action(page,'widgetContinue').click();
  await expect(page.locator('.widget-word h1')).toHaveText('adapt');
  await action(page,'widgetMenu').click();
  await expect(action(page,'pause')).toBeVisible();
  await expect(action(page,'snooze')).toBeVisible();
  await action(page,'skip').click();
  await expect(page.locator('.widget-word h1')).toHaveText('allocate');
  await action(page,'widgetMenu').click();
  await action(page,'pause').click();
  await action(page,'widgetMenu').click();
  await expect(action(page,'pause')).toHaveText('继续自动换词');
});

test('preview rotation and keyboard act only in the intended area', async ({page}) => {
  await page.clock.install();
  await page.goto('/');
  await action(page,'widget').click();
  const word = page.locator('.widget-word h1');
  await action(page,'nav:today').focus();
  await page.keyboard.press('ArrowRight');
  await expect(word).toHaveText('abundant');
  await action(page,'nav:today').hover();
  await page.clock.fastForward(61000);
  await expect(word).toHaveText('adapt');
  await page.locator('.widget-shell').hover();
  await page.clock.fastForward(61000);
  await expect(word).toHaveText('adapt');
  await action(page,'widgetMenu').click();
  await action(page,'pause').click();
  await action(page,'nav:today').hover();
  await page.clock.fastForward(61000);
  await expect(word).toHaveText('adapt');
  await action(page,'widgetMenu').click();
  await action(page,'pause').click();
  await action(page,'nav:today').hover();
  await page.clock.fastForward(30000);
  await expect(word).toHaveText('adapt');
  await page.clock.fastForward(31000);
  await expect(word).toHaveText('allocate');
  await page.locator('.widget-shell').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(word).toHaveText('adapt');
  await action(page,'widgetMenu').click();
  await action(page,'snooze').click();
  await expect(action(page,'widgetWake')).toBeVisible();
  await page.clock.fastForward(15*60000+1000);
  await expect(word).toHaveText('adapt');
});

test('completion and free browsing cannot create another review', async ({page}) => {
  await page.goto('/');
  await action(page,'nav:settings').click();
  await page.locator('#new-limit').selectOption('5');
  await action(page,'nav:today').click();
  await action(page,'widget').click();
  await expect(page.locator('.widget-preview-notice')).toBeVisible();
  for (let i=0;i<5;i++) await action(page,'widgetKnow:3').click();
  await expect(page.locator('.widget-shell')).toContainText('今日 5 词已完成');
  await page.reload();
  await action(page,'widget').click();
  await expect(action(page,'widgetBrowse')).toBeVisible();
  await action(page,'widgetBrowse').click();
  await expect(page.locator('.widget-status')).toContainText('不计学习记录');
  await expect(action(page,'widgetKnow:3')).toHaveCount(0);
  for (let i=0;i<5;i++) await action(page,'skip').click();
  await expect(page.locator('.widget-word h1')).toHaveText('anticipate');
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('wordnook-v1')));
  expect(state.history).toHaveLength(5);
  expect(state.cards.anticipate).toBeUndefined();
});

for (const viewport of [{width:1280,height:800},{width:390,height:844}]) {
  test('bottom corner remains in view at '+viewport.width+'px',async ({page}) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await action(page,'widget').click();
    await action(page,'corner:bottom-right').click();
    await action(page,'widgetSize:220:120').click();
    await expect(page.locator('.preview-widget')).toHaveCSS('width','220px');
    const bounds = await page.locator('.preview-widget').boundingBox();
    const notice = await page.locator('.widget-preview-notice').boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x+bounds.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds.y+bounds.height).toBeLessThanOrEqual(viewport.height);
    expect(notice.y+notice.height).toBeLessThanOrEqual(bounds.y);
  });
}
