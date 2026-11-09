import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import { GUIDE_PDF } from '../lib/walkthrough-renderer.mjs';
import { validatePublishedWalkthrough } from '../lib/walkthrough-pdf-validation.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

async function renderInspectionImages() {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = await readFile(join(root, GUIDE_PDF));
  const task = getDocument({ data: new Uint8Array(data), isEvalSupported: false });
  const pdf = await task.promise;
  const target = join(root, '.demo-cache', 'walkthrough', 'inspection');
  await mkdir(target, { recursive: true });
  try {
    const thumbnails = [];
    for (let number = 1; number <= pdf.numPages; number += 1) {
      const page = await pdf.getPage(number);
      const viewport = page.getViewport({ scale: 1 });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const context = canvas.getContext('2d');
      await page.render({ canvasContext: context, viewport }).promise;
      thumbnails.push(canvas);
      if ([1, 9, 20, 22, 24].includes(number)) {
        await writeFile(join(target, `page-${String(number).padStart(2, '0')}.png`), await canvas.encode('png'));
      }
    }
    for (let group = 0; group < 3; group += 1) {
      const width = 4 * 460;
      const height = 2 * 680;
      const sheet = createCanvas(width, height);
      const context = sheet.getContext('2d');
      context.fillStyle = '#dce4ec'; context.fillRect(0, 0, width, height);
      for (let index = 0; index < 8; index += 1) {
        const number = group * 8 + index;
        context.drawImage(thumbnails[number], index % 4 * 460 + 8, Math.floor(index / 4) * 680 + 8, 444, 628);
        context.font = '17px sans-serif'; context.fillStyle = '#10233d';
        context.fillText(`Page ${number + 1}`, index % 4 * 460 + 14, Math.floor(index / 4) * 680 + 660);
      }
      await writeFile(join(target, `contact-${group + 1}.png`), await sheet.encode('png'));
    }
    return { pagesRasterized: thumbnails.length, contactSheets: 3, inspectionFolder: '.demo-cache/walkthrough/inspection' };
  } finally { await task.destroy(); }
}

try {
  const args = process.argv.slice(2);
  assert.ok(args.length === 0 || (args.length === 1 && args[0] === '--render'),
    'Usage: node tools/verify-walkthrough.mjs [--render]');
  const result = await validatePublishedWalkthrough(root);
  const cache = join(root, '.demo-cache', 'walkthrough');
  await mkdir(cache, { recursive: true });
  await writeFile(join(cache, 'pdf-verification.json'), JSON.stringify(result, null, 2) + '\n');
  const visual = args[0] === '--render' ? await renderInspectionImages() : {};
  console.log(JSON.stringify({ pdf: GUIDE_PDF, pages: result.pages, bytes: result.bytes, links: result.links,
    tagged: result.tagged, bookmarksVerified: result.bookmarksVerified, sourceFilesVerified: result.sourceFilesVerified,
    allPageTextAndBoundsVerified: true, ...visual }, null, 2));
} catch (error) { console.error(error.message); process.exitCode = 1; }
