import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const dist = new URL('../dist/', import.meta.url);
const output = new URL('../Wordnook-preview.html', import.meta.url);
let html = await readFile(new URL('index.html', dist), 'utf8');
const moduleTags = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)];
const cssTags = [...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>/g)];
if (moduleTags.length !== 1 || cssTags.length !== 1) {
  throw new Error('The offline preview expects one bundled module and one stylesheet.');
}

const [moduleTag, modulePath] = moduleTags[0];
const [styleTag, stylePath] = cssTags[0];
const [js, css] = await Promise.all([
  readFile(new URL(modulePath, dist), 'utf8'),
  readFile(new URL(stylePath, dist), 'utf8'),
]);
const script = js.replace(/<\/script/gi, '<\\/script');
const hash = createHash('sha256').update(script).digest('base64');
const policy = `default-src 'none'; script-src 'sha256-${hash}'; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; object-src 'none'; base-uri 'none'`;
const csp = /(<meta\b[^>]*http-equiv="Content-Security-Policy"[^>]*content=")[^"]*(")/;
if (!csp.test(html)) throw new Error('Missing content security policy in the application shell.');
html = html.replace(csp, (_, start, end) => start + policy + end)
  .replace(moduleTag, () => `<script type="module">${script}</script>`)
  .replace(styleTag, () => `<style>${css}</style>`);
await writeFile(output, html);
