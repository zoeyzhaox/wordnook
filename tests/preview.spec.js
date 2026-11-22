import {test, expect} from '@playwright/test';
import {copyFile, mkdtemp, readFile, rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

test('downloaded offline preview works as a single local file', async ({page, context}) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'wordnook-preview-'));
  try {
    const localCopy = path.join(directory, 'Wordnook-preview.html');
    await copyFile(new URL('../Wordnook-preview.html', import.meta.url), localCopy);
    const {version} = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
    await context.setOffline(true);
    const url = pathToFileURL(localCopy).href;
    const externalRequests = [], errors = [];
    page.on('request', request => { if (request.url() !== url) externalRequests.push(request.url()); });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });

    await page.goto(url);
    await page.getByRole('button', {name:'偏好设置'}).click();
    await expect(page.getByText(`拾词 v${version} · 浏览器预览版`, {exact:false})).toBeVisible();
    await page.locator('[data-action="nav:review"]').click();
    await page.locator('[data-action="flip"]').first().click();
    await page.locator('[data-action="rate:3"]').first().click();
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('wordnook-v1'))?.history?.length)).toBe(1);
    await page.reload();
    await page.locator('[data-action="widget"]').first().click();
    await expect(page.locator('.preview-widget')).toBeVisible();
    await page.locator('[data-action="nav:games"]').click();
    await page.locator('[data-action="start:meaning"]').click();
    await expect(page.locator('[data-action^="answer:"]').first()).toBeVisible();
    expect(externalRequests).toEqual([]);
    expect(errors).toEqual([]);
  } finally {
    await rm(directory, {recursive:true, force:true});
  }
});
