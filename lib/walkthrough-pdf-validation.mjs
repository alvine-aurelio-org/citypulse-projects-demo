import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pages, walkthrough } from '../demo/walkthrough.mjs';
import { GUIDE_PDF, GUIDE_MANIFEST, GUIDE_SOURCES, isAllowedGuideLink, sha256, textDigest } from './walkthrough-renderer.mjs';

const defaultRoot = dirname(dirname(fileURLToPath(import.meta.url)));
export const comparableText = (value) => String(value).normalize('NFKC')
  .replace(/[\u200b-\u200d\ufeff\u00ad]/g, '').replace(/\s+/gu, '');

export function checkGuideManifest(manifest, bytes, sourceContents) {
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.title, walkthrough.title);
  assert.equal(manifest.scenarioDate, walkthrough.scenarioDate);
  assert.equal(manifest.pageCount, pages.length);
  assert.equal(manifest.pdf.path, GUIDE_PDF);
  assert.equal(manifest.pdf.sha256, sha256(bytes), 'Published PDF bytes differ from the build manifest');
  assert.equal(manifest.pdf.bytes, bytes.length);
  assert.deepEqual(manifest.sources.map((source) => source.path), GUIDE_SOURCES);
  for (const source of manifest.sources) {
    assert.equal(typeof sourceContents[source.path], 'string', `Missing source ${source.path}`);
    assert.equal(source.sha256, textDigest(sourceContents[source.path]), `Stale walkthrough source: ${source.path}`);
  }
  assert.equal(manifest.layout.pagesChecked, pages.length);
  assert.equal(manifest.layout.overflowPages, 0);
  assert.ok(manifest.layout.minimumSparePixels >= 8, 'The source print layout has insufficient footer clearance');
}

function flattenedOutline(outline = []) {
  return outline.flatMap((item) => [item.title, ...flattenedOutline(item.items ?? [])]);
}

function requiredPageStrings(page) {
  return [page.title, page.intro, ...page.clicks, ...page.show, page.say,
    page.ask.question, page.ask.answer, ...page.expected, page.warning, page.checkpoint,
    ...(page.table ? [...page.table.headers, ...page.table.rows.flat()] : []),
    ...(page.links ?? []).map((link) => link.label)];
}

export async function inspectWalkthroughPdf(bytes) {
  assert.equal(Buffer.from(bytes).subarray(0, 5).toString('ascii'), '%PDF-', 'Missing actual PDF header');
  assert.match(Buffer.from(bytes).subarray(-2048).toString('latin1'), /%%EOF\s*$/u, 'Incomplete PDF trailer');
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = getDocument({ data: new Uint8Array(bytes), isEvalSupported: false, useSystemFonts: false, stopAtErrors: true });
  const pdf = await task.promise;
  try {
    assert.equal(pdf.numPages, pages.length, 'Unexpected printed page count');
    const metadata = await pdf.getMetadata();
    assert.equal(metadata.info.Title, walkthrough.title);
    const markInfo = await pdf.getMarkInfo();
    assert.equal(markInfo?.get('Marked'), true, 'PDF must preserve tagged document structure');
    const outline = await pdf.getOutline();
    const titles = flattenedOutline(outline ?? []).map(comparableText);
    for (const page of pages) assert.ok(titles.includes(comparableText(page.title)), `Missing PDF bookmark: ${page.title}`);
    const attachments = await pdf.getAttachments();
    assert.ok(attachments === null || Object.keys(attachments).length === 0, 'Unexpected embedded attachments');
    const actions = await pdf.getJSActions();
    assert.ok(actions === null || Object.keys(actions).length === 0, 'Unexpected PDF JavaScript actions');
    let linkCount = 0;
    const pageResults = [];
    for (let index = 0; index < pages.length; index += 1) {
      const source = pages[index];
      const page = await pdf.getPage(index + 1);
      const [left, bottom, right, top] = page.view;
      assert.ok(Math.abs((right - left) - 595.28) < 1 && Math.abs((top - bottom) - 841.89) < 1,
        `Page ${index + 1}: expected portrait A4`);
      const content = await page.getTextContent();
      const text = content.items.filter((item) => typeof item.str === 'string').map((item) => item.str).join(' ');
      const normalized = comparableText(text);
      for (const expected of requiredPageStrings(source)) {
        assert.ok(normalized.includes(comparableText(expected)), `PDF page ${index + 1} lost text: ${expected}`);
      }
      const outside = content.items.filter((item) => item.str?.trim()).filter((item) => {
        const x = item.transform[4];
        const y = item.transform[5];
        return x < left - 2 || x + item.width > right + 2 || y < bottom - 2 || y > top + 2;
      });
      assert.deepEqual(outside.map((item) => item.str), [], `Text outside the physical PDF page ${index + 1}`);
      const annotations = await page.getAnnotations({ intent: 'display' });
      const links = annotations.filter((annotation) => annotation.subtype === 'Link');
      const targets = new Set();
      for (const annotation of links) {
        assert.ok(isAllowedGuideLink(annotation.url), `Unsafe, local, or foreign PDF link: ${annotation.url ?? annotation.unsafeUrl}`);
        const [x1, y1, x2, y2] = annotation.rect;
        assert.ok(x1 >= left - 2 && y1 >= bottom - 2 && x2 <= right + 2 && y2 <= top + 2,
          `Link outside page ${index + 1}`);
        targets.add(annotation.url);
      }
      for (const url of [source.url, walkthrough.repositoryUrl, ...(source.links ?? []).map((link) => link.url)]) {
        assert.ok(targets.has(url), `Page ${index + 1} lost its clickable link: ${url}`);
      }
      linkCount += links.length;
      pageResults.push({ number: index + 1, title: source.title, textCharacters: text.length,
        links: links.length, requiredTextVerified: true, boundsVerified: true });
    }
    return { title: metadata.info.Title, pages: pdf.numPages, links: linkCount,
      tagged: true, bookmarksVerified: pages.length, noJavaScriptOrAttachments: true, pageResults };
  } finally { await task.destroy(); }
}

export async function validatePublishedWalkthrough(root = defaultRoot) {
  const bytes = await readFile(join(root, GUIDE_PDF));
  const manifest = JSON.parse(await readFile(join(root, GUIDE_MANIFEST), 'utf8'));
  const sourceContents = {};
  for (const path of GUIDE_SOURCES) sourceContents[path] = await readFile(join(root, path), 'utf8');
  checkGuideManifest(manifest, bytes, sourceContents);
  return { ...(await inspectWalkthroughPdf(bytes)), bytes: bytes.length,
    sha256: manifest.pdf.sha256, sourceFilesVerified: GUIDE_SOURCES.length };
}
