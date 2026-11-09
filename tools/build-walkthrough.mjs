import assert from 'node:assert/strict';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { pages, walkthrough } from '../demo/walkthrough.mjs';
import { GUIDE_PDF, GUIDE_MANIFEST, GUIDE_SOURCES, renderWalkthroughHtml, sha256, textDigest } from '../lib/walkthrough-renderer.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const cache = join(root, '.demo-cache', 'walkthrough');

async function findBrowser() {
  const candidates = [
    process.env.PDF_BROWSER_EXECUTABLE,
    process.platform === 'win32' ? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' : undefined,
    process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : undefined,
    process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined,
    '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome',
  ].filter(Boolean);
  for (const candidate of candidates) {
    try { await access(candidate, constants.F_OK); return candidate; } catch { /* Try the next known location. */ }
  }
  throw new Error('No local Chromium/Edge browser found. Maintainers can set PDF_BROWSER_EXECUTABLE; presenters need only the published PDF.');
}

async function main() {
  assert.equal(process.argv.length, 2, 'Usage: node tools/build-walkthrough.mjs');
  await mkdir(cache, { recursive: true });
  const svg = await readFile(join(root, 'reports/sprint-1-burndown.svg'), 'utf8');
  const html = renderWalkthroughHtml({ burndownSvg: svg });
  const htmlPath = join(cache, 'instructor-walkthrough.html');
  await writeFile(htmlPath, html, 'utf8');
  const browser = await chromium.launch({ executablePath: await findBrowser(), headless: true });
  let bytes;
  let layout;
  const engine = browser.version();
  try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 1414 }, reducedMotion: 'reduce' });
    const blocked = [];
    await page.route('**/*', (route) => {
      if (/^https?:/i.test(route.request().url())) { blocked.push(route.request().url()); return route.abort(); }
      return route.continue();
    });
    await page.emulateMedia({ media: 'print' });
    await page.goto(pathToFileURL(htmlPath).href);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((image) => image.decode()));
    });
    layout = await page.evaluate(() => [...document.querySelectorAll('.sheet')].map((sheet, index) => {
      const box = sheet.getBoundingClientRect();
      const body = sheet.querySelector('.page-content').getBoundingClientRect();
      const footer = sheet.querySelector('.footer').getBoundingClientRect();
      const outside = [...sheet.querySelectorAll('.page-content h1,.page-content p,.page-content li,.page-content th,.page-content td,.page-content a')]
        .filter((element) => { const r = element.getBoundingClientRect(); return r.left < box.left + 12 || r.right > box.right - 12 || r.bottom > footer.top - 5; })
        .map((element) => ({ tag: element.tagName, text: element.textContent.slice(0, 100) }));
      return { page: index + 1, title: sheet.querySelector('h1').textContent, contentBottom: body.bottom - box.top,
        footerTop: footer.top - box.top, sparePixels: footer.top - body.bottom, scrollOverflow: sheet.scrollHeight - sheet.clientHeight, outside };
    }));
    await writeFile(join(cache, 'layout.json'), JSON.stringify(layout, null, 2) + '\n');
    const failures = layout.filter((item) => item.sparePixels < 8 || item.scrollOverflow > 1 || item.outside.length);
    assert.deepEqual(failures, [], `Print layout overflow: ${JSON.stringify(failures)}`);
    assert.equal(blocked.length, 0, 'PDF generation must not depend on external assets or authenticated browser content');
    const pdfPath = resolve(root, GUIDE_PDF);
    bytes = await page.pdf({ path: pdfPath, printBackground: true, preferCSSPageSize: true,
      displayHeaderFooter: false, tagged: true, outline: true });
  } finally { await browser.close(); }
  const sources = [];
  for (const path of GUIDE_SOURCES) sources.push({ path, sha256: textDigest(await readFile(join(root, path), 'utf8')) });
  const manifest = { schemaVersion: 1, title: walkthrough.title, scenarioDate: walkthrough.scenarioDate,
    pageCount: pages.length, pdf: { path: GUIDE_PDF, sha256: sha256(bytes), bytes: bytes.length },
    sources, generator: { engine: 'Chromium via Playwright', browserVersion: engine, packageVersion: '1.65.0',
      note: 'Source-bound build; Chromium PDF metadata and system fonts can vary across machines.' },
    layout: { pagesChecked: layout.length, overflowPages: 0, minimumSparePixels: Math.floor(Math.min(...layout.map((item) => item.sparePixels))) },
    visuals: 'Instructional schematics, not GitHub screenshots; the burndown embeds the repository SVG.',
    safety: 'Build is offline, does not use browser authentication, and does not mutate the live demo.' };
  await writeFile(join(root, GUIDE_MANIFEST), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify({ pdf: GUIDE_PDF, pages: pages.length, bytes: bytes.length, layoutChecked: layout.length,
    minimumSparePixels: manifest.layout.minimumSparePixels, sha256: manifest.pdf.sha256 }, null, 2));
}

try { await main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
