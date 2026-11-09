import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { walkthrough, pages } from '../demo/walkthrough.mjs';
import { workItems } from '../demo/catalog.mjs';

export const GUIDE_PDF = 'docs/instructor-walkthrough.pdf';
export const GUIDE_MANIFEST = 'docs/instructor-walkthrough.manifest.json';
export const GUIDE_SOURCES = Object.freeze([
  'demo/walkthrough.mjs',
  'demo/catalog.mjs',
  'lib/walkthrough-renderer.mjs',
  'tools/build-walkthrough.mjs',
  'reports/sprint-1-burndown.svg',
]);

export const escapeHtml = (value) => String(value).replace(/[&<>"']/g,
  (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const textDigest = (text) => sha256(text.replaceAll('\r\n', '\n'));

export function isAllowedGuideLink(value) {
  try {
    const url = new URL(value);
    const bases = [walkthrough.repositoryUrl, walkthrough.projectUrl];
    return url.protocol === 'https:' && url.origin === 'https://github.com'
      && !url.username && !url.password && !url.search && !url.hash
      && bases.some((base) => url.href === base || url.href.startsWith(`${base}/`));
  } catch { return false; }
}

function link(url, label, className = '') {
  assert.ok(isAllowedGuideLink(url), `Unapproved guide link: ${url}`);
  return `<a class="${className}" href="${escapeHtml(url)}">${escapeHtml(label)}</a>`;
}

const styles = `
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; }
html,body { margin: 0; padding: 0; }
body { color: #23324b; background: #e8edf3; font: 10.4pt/1.34 'Segoe UI', Arial, sans-serif; }
.sheet { position: relative; width: 210mm; height: 297mm; margin: 8mm auto; padding: 13mm 14mm 19mm; background: #fff; break-after: page; page-break-after: always; }
.sheet:last-child { break-after: auto; page-break-after: auto; }
.topline { display: flex; justify-content: space-between; align-items: center; gap: 5mm; margin-bottom: 3mm; }
.eyebrow { color: #156f72; font-size: 8.7pt; font-weight: 750; letter-spacing: 1.1px; text-transform: uppercase; }
.time { flex-shrink: 0; color: #173a53; background: #eaf3f8; padding: 1.3mm 3mm; border-radius: 20px; font-size: 9pt; font-weight: 650; }
h1 { margin: 0 0 2.5mm; color: #10233d; font-size: 23pt; line-height: 1.1; font-weight: 760; letter-spacing: -.5px; }
.intro { margin: 0 0 3mm; color: #475b70; font-size: 10.6pt; }
.open { display: flex; align-items: center; gap: 3mm; border: 1px solid #c9dde6; border-radius: 2mm; padding: 2mm 3mm; margin: 0 0 3.5mm; }
.open a { flex-shrink: 0; color: #086c73; font-size: 9.5pt; font-weight: 750; }
.address { color: #52657a; font-size: 8.3pt; overflow-wrap: anywhere; line-height: 1.2; }
a { color: #075a9c; text-decoration: underline; text-underline-offset: 2px; }
.columns { display: grid; grid-template-columns: 1.16fr 1fr; gap: 5mm; align-items: start; }
h2 { color: #136c73; margin: 0 0 2mm; font-size: 9.1pt; font-weight: 780; letter-spacing: .6px; text-transform: uppercase; }
ol,ul { padding-left: 4.5mm; margin: 0; }
li { margin: 0 0 1.8mm; }
li:last-child { margin-bottom: 0; }
p { margin: 0; }
.expected { margin-top: 3mm; padding: 2.5mm 3mm; border-radius: 2mm; background: #edf7f4; border: 1px solid #d5eae2; }
.expected ul { padding-left: 3.5mm; }
.expected li { margin-bottom: 1.2mm; }
.expected h2 { color: #17684d; }
.teaching { display: grid; grid-template-columns: 1.25fr 1fr; gap: 4mm; margin-top: 3.5mm; }
.script { padding: 3mm; background: #f0f3f9; border-radius: 2mm; border-left: 3px solid #8a8fc7; }
.script p { color: #233653; }
.audience { padding: 2.5mm 0; }
.question { font-weight: 700; margin-bottom: 1.2mm; }
.answer { color: #4a5b70; }
.safety { margin-top: 3mm; padding: 2mm 3mm; background: #fff5e3; border-left: 3px solid #d49625; border-radius: 0 1.5mm 1.5mm 0; font-size: 10pt; }
.safety strong { color: #7a4c02; }
.checkpoint { margin-top: 2mm; padding: 2mm 3mm; border: 1px solid #b8d9d4; border-radius: 1.5mm; font-size: 10pt; }
.checkpoint strong { color: #14665e; }
.links { display: flex; flex-wrap: wrap; gap: 1.3mm 3mm; margin-top: 2.5mm; font-size: 9pt; line-height: 1.3; }
.links a { padding: .7mm 0; }
.links.many { display: grid; grid-template-columns: repeat(3,1fr); gap: 1.5mm 4mm; }
table { border-collapse: collapse; width: 100%; margin-top: 3mm; font-size: 9.8pt; line-height: 1.25; }
thead { display: table-header-group; }
th { padding: 1.8mm 2mm; color: #fff; background: #1c4058; text-align: left; font-weight: 650; }
td { padding: 1.7mm 2mm; border-bottom: 1px solid #dbe3eb; vertical-align: top; }
tbody tr:nth-child(even) { background: #f3f6f9; }
tr { break-inside: avoid; }
.figure { margin: 0 0 3.5mm; padding: 2.5mm; background: #f4f7fb; border: 1px solid #dde5ec; border-radius: 2mm; }
.figure svg { width: 100%; height: auto; display: block; }
.figure figcaption { margin-top: 1mm; color: #52657a; font-size: 8.3pt; }
.burndown-figure { padding: 0; background: #0c1930; border: 0; }
.burndown-figure img { width: 100%; height: auto; display: block; border-radius: 2mm; }
.burndown-figure figcaption { padding: 1.5mm 2.5mm; margin: 0; background: #eef4f7; border-radius: 0 0 2mm 2mm; }
.cover-head { background: #11253f; border-radius: 3mm; color: #f3f7ff; padding: 5mm; margin: 0 0 3mm; }
.cover-head .eyebrow { color: #74dfcf; margin-bottom: 3mm; }
.cover-head h1 { color: #fff; font-size: 26pt; margin-bottom: 3mm; }
.cover-head p { color: #d3e2ef; font-size: 11pt; }
.metrics { display: grid; grid-template-columns: repeat(4,1fr); gap: 2mm; margin-top: 3mm; }
.metric { background: #1c3a54; border: 1px solid #34516a; border-radius: 2mm; padding: 2.5mm; }
.metric strong { display: block; color: #8ce2d3; font-size: 23pt; line-height: 1; }
.metric span { display: block; color: #e0e9f2; font-size: 8.8pt; margin-top: 1mm; }
.scope-metrics { display: grid; grid-template-columns: repeat(4,1fr); gap: 2mm; margin: 0 0 3mm; }
.scope-metrics div { padding: 2mm; background: #eef6f5; border-radius: 1.5mm; color: #17675e; }
.scope-metrics strong { display: block; font-size: 17pt; }
.scope-metrics span { display: block; font-size: 8.5pt; }
.footer { position: absolute; left: 14mm; right: 14mm; bottom: 8mm; display: flex; align-items: center; justify-content: space-between; gap: 3mm; color: #617185; border-top: 1px solid #d9e3eb; padding-top: 2mm; font-size: 8.1pt; line-height: 1.2; }
.footer a { color: #617185; }
.sheet.qa table { font-size: 9.6pt; }
.sheet.quickref .links { font-size: 9.3pt; }
#page-burndown .burndown-figure img { height: 83mm; object-fit: contain; }
@media print { body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .sheet { margin: 0; } }
`;

function cardsSvg(labels, options = {}) {
  const width = 1000;
  const gap = 34;
  const cardWidth = (width - (labels.length - 1) * gap) / labels.length;
  const boxes = labels.map((lines, index) => {
    const x = index * (cardWidth + gap);
    const colour = options.warning && index === labels.length - 1 ? '#fff1db' : '#e5f3f1';
    const texts = lines.map((line, row) => `<text x="${x + 16}" y="${40 + row * 30}" font-size="${row === 0 ? 25 : 21}" font-weight="${row === 0 ? 700 : 450}">${escapeHtml(line)}</text>`).join('');
    const arrow = index < labels.length - 1 ? `<text x="${x + cardWidth + 8}" y="73" font-size="28">→</text>` : '';
    return `<rect x="${x}" y="4" width="${cardWidth}" height="122" rx="12" fill="${colour}" stroke="#b9d8d5"/>${texts}${arrow}`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 135" role="img" aria-label="Instructional schematic"><g fill="#173a4f" font-family="Arial,sans-serif">${boxes}</g></svg>`;
}

function roadmapSvg() {
  const epics = workItems.filter((item) => item.kind === 'Epic');
  const start = Date.parse('2026-11-02');
  const x = (date) => 258 + (Date.parse(date) - start) / 86_400_000 * 27.2;
  const labels = [['2026-11-02', 'Nov 2'], ['2026-11-13', 'Nov 13'], ['2026-11-20', 'Nov 20'], ['2026-11-27', 'Nov 27']];
  const markers = labels.map(([date, label]) => `<line x1="${x(date)}" y1="37" x2="${x(date)}" y2="244" stroke="#b8cbd8" stroke-dasharray="5 5"/><text x="${x(date)}" y="25" text-anchor="middle" font-size="20">${label}</text>`).join('');
  const bars = epics.map((item, index) => {
    const y = 55 + index * 38;
    return `<text x="0" y="${y + 22}" font-size="21">${escapeHtml(item.workstream)}</text><rect x="${x(item.start)}" y="${y}" width="${x(item.target) - x(item.start)}" height="28" rx="7" fill="${index % 2 ? '#8294cc' : '#3c9e98'}"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 254" role="img" aria-label="Schematic of the five planned epic date bars"><g fill="#23425b" font-family="Arial,sans-serif">${markers}${bars}</g></svg>`;
}

function visualFor(page, burndownSvg) {
  if (page.visual === 'burndown') {
    return `<figure class="figure burndown-figure"><img alt="Repository Sprint 1 burndown; illustrative demo history" src="data:image/svg+xml;base64,${Buffer.from(burndownSvg).toString('base64')}"/><figcaption>Actual repository chart artifact. Earlier completion dates are illustrative; future actuals are blank. Open the live report for full-size inspection.</figcaption></figure>`;
  }
  if (page.visual === 'scope') {
    return `<div class="scope-metrics">${[['50', 'portfolio issues'], ['45', 'delivery children'], ['30', 'sprint issues'], ['35', 'open delivery']].map(([number, label]) => `<div><strong>${number}</strong><span>${label}</span></div>`).join('')}</div>`;
  }
  if (page.table || ['none', 'cover', 'route'].includes(page.visual)) return '';
  const diagrams = {
    hierarchy: page.id === 'issue-detail' ? [['Epic #1', '0 estimate points'], ['9 native children', '2 closed / 9 total'], ['Child #6', 'Done / 5 points']]
      : [['Portfolio', '50 issues'], ['Parents', '5 epics / 0 points'], ['Delivery', '45 children / 180 pts']],
    board: [['Backlog + Ready', 'Not completed'], ['Active + Review', 'No partial credit'], ['Blocked + Done', 'Separate states']],
    sprint: [['Committed', '30 issues / 100 pts'], ['Completed', '10 issues / 40 pts'], ['Remaining', '20 issues / 60 pts']],
    dependencies: [['Issue #11', 'Blocked / 2 points'], ['Blocked by →', 'Native relationship'], ['Issue #9', 'Open / In progress']],
    workload: [['All open delivery', '35 issues / 140 pts'], ['Sprint subset', '20 open / 60 pts'], ['Not a capacity claim', 'Fictional teams']],
    insights: [['Portfolio', 'Count = 50 issues'], ['Sprint', 'Sum = 100 points'], ['Open delivery', 'Sum = 140 points']],
    'pr-flow': [['Issue #8', 'Open / In review'], ['PR #52', 'OPEN design review'], ['Green checks', 'Not human approval']],
    workflow: [['Close issue', 'Status → Done'], ['Reopen issue', 'Status → Ready'], ['Link PR', 'Status → In review']],
    'safe-move': [['#10: Ready', 'Baseline: 2 points'], ['#10: In progress', 'Temporary / still 2 pts'], ['#10: Ready', 'Restore + reload']],
  };
  const svg = page.visual === 'roadmap' ? roadmapSvg() : cardsSvg(diagrams[page.visual] ?? [['Read the scope', 'Then quote the metric']]);
  return `<figure class="figure">${svg}<figcaption>Instructional schematic — not a GitHub screenshot. Confirm the native values in the linked live page.</figcaption></figure>`;
}

function renderTable(table) {
  if (!table) return '';
  return `<table><thead><tr>${table.headers.map((value) => `<th scope="col">${escapeHtml(value)}</th>`).join('')}</tr></thead><tbody>${table.rows.map((row) => `<tr>${row.map((value) => `<td>${escapeHtml(value)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function renderPage(page, index, total, burndownSvg) {
  const header = page.kind === 'cover'
    ? `<header class="cover-head"><div class="eyebrow">CityPulse / instructor walkthrough</div><h1>${escapeHtml(page.title)}</h1><p>${escapeHtml(walkthrough.subtitle)}</p><div class="metrics">${[['50', 'real issues'], ['7', 'saved views'], ['4', 'custom charts'], ['1', 'named sprint']].map(([number, label]) => `<div class="metric"><strong>${number}</strong><span>${label}</span></div>`).join('')}</div></header>`
    : `<header><div class="topline"><span class="eyebrow">${escapeHtml(page.kicker)}</span><span class="time">${escapeHtml(page.time)}</span></div><h1>${escapeHtml(page.title)}</h1></header>`;
  return `<section class="sheet ${escapeHtml(page.kind)}" id="page-${escapeHtml(page.id)}" aria-label="Page ${index + 1}: ${escapeHtml(page.title)}"><div class="page-content">
${header}<p class="intro">${escapeHtml(page.intro)}</p>
<nav class="open" aria-label="Live destination">${link(page.url, 'Open live page →')}<span class="address">${escapeHtml(page.url.replace('https://', ''))}</span></nav>
${visualFor(page, burndownSvg)}
<div class="columns"><section><h2>Do · click path</h2><ol>${page.clicks.map((value) => `<li>${escapeHtml(value)}</li>`).join('')}</ol></section><div><section><h2>Show · focus the audience</h2><ul>${page.show.map((value) => `<li>${escapeHtml(value)}</li>`).join('')}</ul></section><section class="expected"><h2>Expected · verify on screen</h2><ul>${page.expected.map((value) => `<li>${escapeHtml(value)}</li>`).join('')}</ul></section></div></div>
${renderTable(page.table)}
<div class="teaching"><section class="script"><h2>Say · instructor script</h2><p>“${escapeHtml(page.say)}”</p></section><section class="audience"><h2>Ask · then explain</h2><p class="question">${escapeHtml(page.ask.question)}</p><p class="answer">${escapeHtml(page.ask.answer)}</p></section></div>
<aside class="safety"><strong>Protect the demo.</strong> ${escapeHtml(page.warning)}</aside>
<p class="checkpoint"><strong>Exit check.</strong> ${escapeHtml(page.checkpoint)}</p>
${page.links ? `<nav class="links${page.links.length > 6 ? ' many' : ''}" aria-label="Related live links">${page.links.map(({ url, label }) => link(url, label)).join('')}</nav>` : ''}
</div><footer class="footer"><span>CityPulse · instructor copy · scenario 09 Nov 2026</span>${link(walkthrough.repositoryUrl, 'Open demo repository')}<span>${String(index + 1).padStart(2, '0')} / ${total}</span></footer></section>`;
}

export function renderWalkthroughHtml({ content = pages, burndownSvg } = {}) {
  assert.equal(content.length, 24, 'The walkthrough must have exactly 24 printed pages');
  assert.equal(new Set(content.map((page) => page.id)).size, content.length, 'Duplicate walkthrough page');
  assert.ok(typeof burndownSvg === 'string' && /<svg[\s>]/.test(burndownSvg), 'The repository SVG is required');
  assert.doesNotMatch(burndownSvg, /<script[\s>]|<foreignObject[\s>]|<image[\s>]|(?:href|src)\s*=|@import\b|javascript:|https?:\/\/(?!www\.w3\.org\/2000\/svg["'\s>])/i, 'Unsafe external SVG resource');
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><meta name="description" content="Browser-only CityPulse instructor walkthrough with verified checkpoints and safe demo actions."/><title>${escapeHtml(walkthrough.title)}</title><style>${styles}</style></head><body><main>${content.map((page, index) => renderPage(page, index, content.length, burndownSvg)).join('\n')}</main></body></html>\n`;
}
