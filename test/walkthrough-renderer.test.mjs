import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { pages } from '../demo/walkthrough.mjs';
import { renderWalkthroughHtml, escapeHtml, isAllowedGuideLink, textDigest, sha256,
  GUIDE_PDF, GUIDE_MANIFEST, GUIDE_SOURCES } from '../lib/walkthrough-renderer.mjs';
import { checkGuideManifest, comparableText, inspectWalkthroughPdf, validatePublishedWalkthrough } from '../lib/walkthrough-pdf-validation.mjs';

const svg = readFileSync(new URL('../reports/sprint-1-burndown.svg', import.meta.url), 'utf8');
const html = renderWalkthroughHtml({ burndownSvg: svg });

test('print document contains exactly 24 semantic pages, titles, and page footers', () => {
  assert.equal((html.match(/<section class="sheet /g) ?? []).length, 24);
  assert.equal((html.match(/class="footer"/g) ?? []).length, 24);
  assert.match(html, /<html lang="en">/);
  assert.match(html, /@page \{ size: A4 portrait; margin: 0; \}/);
  for (const [index, page] of pages.entries()) {
    assert.ok(html.includes(`id="page-${page.id}"`));
    assert.ok(html.includes(escapeHtml(page.title)));
    assert.ok(html.includes(`${String(index + 1).padStart(2, '0')} / 24`));
  }
});

test('every page visibly carries actions, talking points, answers, metrics, and safe exit checks', () => {
  for (const label of ['Do · click path', 'Show · focus the audience', 'Expected · verify on screen',
    'Say · instructor script', 'Ask · then explain', 'Protect the demo.', 'Exit check.']) {
    assert.equal(html.split(label).length - 1, 24, label);
  }
  for (const page of pages) for (const text of [...page.clicks, ...page.show, ...page.expected,
    page.say, page.ask.question, page.ask.answer, page.warning, page.checkpoint]) assert.ok(html.includes(escapeHtml(text)));
});

test('burndown embeds the exact local SVG; other graphics are honestly labeled schematics', () => {
  assert.ok(html.includes(Buffer.from(svg).toString('base64')));
  assert.match(html, /Actual repository chart artifact/);
  assert.match(html, /Instructional schematic — not a GitHub screenshot/);
  assert.match(html, /future actuals are blank/);
  assert.doesNotMatch(html, /src="https?:|@import|<script\b|<foreignObject\b/i);
});

test('all generated action links remain within the one private repo or Project 11', () => {
  const links = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
  assert.ok(links.length >= 100);
  assert.ok(links.every(isAllowedGuideLink));
  for (const value of ['javascript:alert(1)', 'file:///E:/private.txt',
    'https://github.com/alvine-aurelio-org/citypulse-projects-demo-other',
    'https://github.com/orgs/alvine-aurelio-org/projects/110',
    'https://github.com/orgs/another-org/projects/11', 'https://example.invalid']) assert.equal(isAllowedGuideLink(value), false);
});

test('all dynamic prose and link labels are HTML escaped', () => {
  assert.equal(escapeHtml('<a "x">&\''), '&lt;a &quot;x&quot;&gt;&amp;&#39;');
  const altered = structuredClone(pages);
  altered[3].say = '<script>alert("x")</script> & still plain text';
  const output = renderWalkthroughHtml({ content: altered, burndownSvg: svg });
  assert.ok(output.includes('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; still plain text'));
  assert.doesNotMatch(output, /<script\b/);
});

test('invalid page collections, unsafe SVG, and unapproved navigation fail closed', () => {
  assert.throws(() => renderWalkthroughHtml({ content: pages.slice(1), burndownSvg: svg }), /24 printed pages/);
  assert.throws(() => renderWalkthroughHtml({ content: [pages[0], ...pages.slice(0, 23)], burndownSvg: svg }), /Duplicate/);
  assert.throws(() => renderWalkthroughHtml({ burndownSvg: '<svg><script>alert(1)</script></svg>' }), /Unsafe/);
  assert.throws(() => renderWalkthroughHtml({ burndownSvg: '<svg><image href="https://example.invalid/a"/></svg>' }), /Unsafe/);
  assert.throws(() => renderWalkthroughHtml({ burndownSvg: '<svg><image href="file:///private.txt"/></svg>' }), /Unsafe/);
  assert.throws(() => renderWalkthroughHtml({ burndownSvg: '<svg><image href="//example.invalid/a"/></svg>' }), /Unsafe/);
  const altered = structuredClone(pages); altered[0].url = 'https://example.invalid';
  assert.throws(() => renderWalkthroughHtml({ content: altered, burndownSvg: svg }), /Unapproved/);
});

test('HTML is deterministic and text digests survive Windows clean-filter normalization', () => {
  assert.equal(renderWalkthroughHtml({ burndownSvg: svg }), html);
  assert.equal(textDigest('line\r\n'), textDigest('line\n'));
  assert.notEqual(textDigest('line\n'), textDigest('different\n'));
  assert.equal(sha256(Buffer.from('same')), sha256('same'));
  assert.equal(comparableText('a\n b\u00ad c'), 'abc');
});

test('artifact paths and source provenance are exact allowlists', () => {
  assert.equal(GUIDE_PDF, 'docs/instructor-walkthrough.pdf');
  assert.equal(GUIDE_MANIFEST, 'docs/instructor-walkthrough.manifest.json');
  assert.equal(GUIDE_SOURCES.length, 5);
  assert.ok(GUIDE_SOURCES.includes('demo/walkthrough.mjs'));
  assert.ok(GUIDE_SOURCES.includes('reports/sprint-1-burndown.svg'));
  assert.ok(Object.isFrozen(GUIDE_SOURCES));
});

test('manifest rejects changed PDF bytes, stale sources, and fake print-layout approval', () => {
  const sources = Object.fromEntries(GUIDE_SOURCES.map((path) => [path, `source ${path}\n`]));
  const bytes = Buffer.from('%PDF-fixture');
  const manifest = { schemaVersion: 1, title: 'CityPulse Instructor Walkthrough', scenarioDate: '2026-11-09', pageCount: 24,
    pdf: { path: GUIDE_PDF, sha256: sha256(bytes), bytes: bytes.length },
    sources: GUIDE_SOURCES.map((path) => ({ path, sha256: textDigest(sources[path]) })),
    layout: { pagesChecked: 24, overflowPages: 0, minimumSparePixels: 18 } };
  assert.doesNotThrow(() => checkGuideManifest(manifest, bytes, sources));
  assert.throws(() => checkGuideManifest(manifest, Buffer.from('different'), sources), /PDF bytes/);
  assert.throws(() => checkGuideManifest(manifest, bytes, { ...sources, [GUIDE_SOURCES[0]]: 'edited' }), /Stale/);
  assert.throws(() => checkGuideManifest({ ...manifest, layout: { ...manifest.layout, overflowPages: 1 } }, bytes, sources));
  assert.throws(() => checkGuideManifest({ ...manifest, layout: { ...manifest.layout, minimumSparePixels: 2 } }, bytes, sources));
});

test('a renamed or truncated file cannot masquerade as a valid published PDF', async () => {
  await assert.rejects(inspectWalkthroughPdf(Buffer.from('not a PDF')), /PDF header/);
  await assert.rejects(inspectWalkthroughPdf(Buffer.from('%PDF-1.7\ntruncated')), /PDF trailer/);
});

test('actual published PDF preserves every page, full teaching text, safe links, bookmarks, and tags', { timeout: 60_000 }, async () => {
  const result = await validatePublishedWalkthrough();
  assert.equal(result.pages, 24);
  assert.ok(result.links >= 100);
  assert.equal(result.bookmarksVerified, 24);
  assert.equal(result.tagged, true);
  assert.equal(result.sourceFilesVerified, 5);
  assert.ok(result.pageResults.every((page) => page.requiredTextVerified && page.boundsVerified));
});
