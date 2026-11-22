import {test, expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

const action = (page, name) => page.locator(`[data-action="${name}"]:visible`).first();
const entry = word => ({word, meaning:'示例', phrase:word+' in context', phraseZh:'搭配',
  example:'An example.', exampleZh:'例句。'});

async function openLibrary(page) {
  await page.goto('/');
  await action(page,'nav:library').click();
}

async function importWords(page, words) {
  await action(page,'import').click();
  const chooser = page.waitForEvent('filechooser');
  await action(page,'chooseImport').click();
  await (await chooser).setFiles({name:'class.json', mimeType:'application/json', buffer:Buffer.from(JSON.stringify(words))});
}

test('Chinese IME composition, copied whitespace and first-time favorites',async ({page, context}) => {
  await openLibrary(page);
  const search=page.getByRole('searchbox');
  await search.focus();
  const cdp=await context.newCDPSession(page);
  for (const text of ['fen', 'fen pei', '分配']) {
    await cdp.send('Input.imeSetComposition',{text,selectionStart:text.length,selectionEnd:text.length});
  }
  await cdp.send('Input.insertText',{text:'分配'});
  await expect(search).toHaveValue('分配');
  await expect(page.locator('.word-row').first()).toContainText('allocate');
  await search.fill(' approach ');
  await expect(page.locator('.word-row')).toHaveCount(1);
  await search.fill('');
  await action(page,'favorites').click();
  await expect(page.locator('.library-empty')).toContainText('还没有收藏');
  await action(page,'clearLibraryFilters').click();
  await expect(page.locator('.word-row').first()).toContainText('abundant');
});

test('large import paginates results, identifies duplicates and links the batch without switching study deck',async ({page}) => {
  await openLibrary(page);
  await page.locator('#deck').selectOption('toefl');
  const words=Array.from({length:4999},(_,i) => entry('lemma'+[2,1,0].map(n=>String.fromCharCode(97+Math.floor(i/26**n)%26)).join('')));
  await importWords(page,[entry('abundant'),...words]);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.library-batch')).toContainText('4999 个新词，跳过重复 1 条');
  await action(page,'showImportBatch').click();
  await expect(page.locator('#deck')).toHaveValue('toefl');
  await expect(page.locator('.word-row')).toHaveCount(50);
  const first=await page.locator('.word-row').first().textContent();
  await action(page,'libraryPage:1').click();
  await expect(page.locator('.word-row').first()).not.toHaveText(first);
  await expect(page.locator('.library-pagination')).toContainText('第 2 / 100 页');
  await expect(page.locator('.word-row').first()).toBeFocused();
  await page.getByRole('searchbox').fill(' '+words[4998].word+' ');
  await expect(page.locator('.word-row')).toHaveCount(1);
  await action(page,'closeImportBatch').click();
  await expect(page.locator('#deck')).toHaveValue('toefl');
  await expect(page.locator('.word-row').first()).toContainText('abundant');
});

test('invalid import identifies the record and field without adding its valid neighbor',async ({page})=>{
  await openLibrary(page);
  await importWords(page,[entry('luminous'),{...entry('typo'),exampleZh:''}]);
  const error=page.getByRole('dialog').getByRole('alert');
  await expect(error).toContainText('2');
  await expect(error).toContainText('typo');
  await expect(error).toContainText('例句中文译文');
  await page.keyboard.press('Escape');
  await expect(action(page,'import')).toBeFocused();
  await page.getByRole('searchbox').fill('luminous');
  await expect(page.locator('.word-row')).toHaveCount(0);
});

test('close or escape restores focus and clears pending restore files',async ({page})=>{
  await openLibrary(page);
  const row=page.locator('.word-row').nth(7);
  await row.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(row).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('.word-row').nth(8)).toBeFocused();
  await action(page,'nav:settings').click();
  const download=page.waitForEvent('download');
  await action(page,'export').click();
  const path=await (await download).path();
  for (const key of ['Escape','close','confirm']) {
    await action(page,'restore').click();
    await expect(action(page,'confirmRestore')).toHaveCount(0);
    const chooser=page.waitForEvent('filechooser');
    await action(page,'chooseRestore').click();
    await (await chooser).setFiles(path);
    await expect(action(page,'confirmRestore')).toBeVisible();
    if(key==='Escape') await page.keyboard.press('Escape');
    else await action(page,key==='confirm'?'confirmRestore':'closeModal').click();
    await expect(action(page,'restore')).toBeFocused();
  }
  await action(page,'restore').click();
  await expect(action(page,'confirmRestore')).toHaveCount(0);
});

test('refresh clears the stale game permanently; opening a second ordinary tab preserves a live game',async ({page,context})=>{
  await page.goto('/');
  await action(page,'nav:games').click();
  await action(page,'start:meaning').click();
  await expect(page.locator('.game-question')).toBeVisible();
  const other=await context.newPage();
  await other.goto('/');
  await action(other,'nav:games').click();
  await expect(other.locator('.game-question')).toBeVisible();
  const liveGame=await page.evaluate(()=>JSON.parse(localStorage.getItem('wordnook-v1')).game.id);
  await other.reload();
  await action(other,'nav:games').click();
  await expect(other.locator('.game-question')).toBeVisible();
  await expect(page.locator('.game-question')).toBeVisible();
  expect(await other.evaluate(()=>JSON.parse(localStorage.getItem('wordnook-v1')).game.id)).toBe(liveGame);
  await other.close();
  await page.reload();
  await action(page,'nav:games').click();
  await expect(action(page,'start:meaning')).toBeVisible();
  await action(page,'nav:library').click();
  await page.locator('.word-row').first().click();
  await page.getByRole('dialog').getByRole('button',{name:'收藏这个词'}).click();
  await page.keyboard.press('Escape');
  await action(page,'nav:games').click();
  await expect(action(page,'start:meaning')).toBeVisible();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('wordnook-v1')).game)).toBe(null);
});

test('downloaded CSV template imports directly and explains zero additions on a second import',async ({page})=>{
  await openLibrary(page);
  await action(page,'import').click();
  const download=page.waitForEvent('download');
  await action(page,'template').click();
  const file=await download;
  const bytes=await readFile(await file.path());
  for (let run=0;run<2;run++) {
    if(run) await action(page,'import').click();
    const chooser=page.waitForEvent('filechooser');
    await action(page,'chooseImport').click();
    await (await chooser).setFiles({name:file.suggestedFilename(),mimeType:'text/csv',buffer:bytes});
    await expect(page.locator('.library-batch')).toContainText(run?'已导入 0 个新词，跳过重复 1 条':'已导入 1 个新词，跳过重复 0 条');
  }
});

test('import shows complete-word clozes and reports multiple invalid rows and actual field lengths',async ({page})=>{
  await openLibrary(page);
  await importWords(page,[{...entry('art'),phrase:'artificial light'},{...entry('typo'),example:'x'.repeat(1007),exampleZh:''}]);
  const error=page.getByRole('dialog').getByRole('alert');
  await expect(error).toContainText('第 1 条（art）');
  await expect(error).toContainText('artificial light');
  await expect(error).toContainText('第 2 条（typo）');
  await expect(error).toContainText('1007 个字符，上限 1000');
  await expect(error).toContainText('例句中文译文');
  await page.keyboard.press('Escape');
  await importWords(page,[{...entry('art'),phrase:'art class'}]);
  await expect(page.locator('.import-cloze')).toBeVisible();
  await expect(page.locator('.import-cloze li')).toHaveText('art → ___ class');
});
