import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { config, summarize, workItems } from '../demo/catalog.mjs';
import {
  buildReports,
  findStaleReports,
  HISTORY_NOTICE,
  renderBurndownSvg,
  renderCsv,
  renderSprintMarkdown,
  REPORT_PATHS,
  sprintRows,
} from '../lib/reporting.mjs';

const root = new URL('../', import.meta.url);
const reportCommand = fileURLToPath(new URL('tools/render-reports.mjs', root));
const sprint = config.sprint;
const dates = ['02', '03', '04', '05', '06', '09', '10', '11', '12', '13'].map((day) => `2026-11-${day}`);
const actuals = [100, 95, 87, 79, 71, 63, 60, null, null, null, null];
const ideals = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0];
const fields = ['date', 'phase', 'idealRemaining', 'actualRemaining', 'scopePoints', 'provenance'];
const completedNumbers = [6, 7, 15, 16, 24, 25, 33, 34, 42, 43];
const cloneItems = () => structuredClone(workItems);

function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

// Small strict RFC-style parser so CSV-vs-SVG parity inspects actual serialized bytes.
function parseCsv(source) {
  const records = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') {
      if (quoted && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted && (character === ',' || character === '\n')) {
      row.push(field);
      field = '';
      if (character === '\n') {
        records.push(row);
        row = [];
      }
    } else {
      field += character;
    }
  }
  assert.equal(quoted, false, 'CSV quote must close');
  assert.deepEqual(row, [], 'CSV must end at a record boundary');
  assert.equal(field, '');
  const [header, ...data] = records;
  assert.deepEqual(header, fields);
  return data.map((record) => {
    assert.equal(record.length, header.length);
    return Object.fromEntries(header.map((key, index) => [key, record[index]]));
  });
}

function decodeXml(value) {
  return value.replace(/&(?:amp|lt|gt|quot|apos);/g, (entity) => ({
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'",
  })[entity]);
}

function chartRows(svg) {
  const names = ['date', 'phase', 'ideal-remaining', 'actual-remaining', 'scope-points', 'provenance'];
  return [...svg.matchAll(/<g class="report-row" ([^>]+)>/g)].map(([, attributes]) => {
    const values = Object.fromEntries([...attributes.matchAll(/data-([\w-]+)="([^"]*)"/g)]
      .map(([, name, value]) => [name, decodeXml(value)]));
    assert.deepEqual(Object.keys(values), names);
    return Object.fromEntries(fields.map((field, index) => [field, values[names[index]]]));
  });
}

function linePoints(svg, id) {
  const data = svg.match(new RegExp(`<path id="${id}" d="([^"]+)"`))?.[1];
  assert.ok(data, `Missing ${id}`);
  return [...data.matchAll(/[ML] ([\d.]+) ([\d.]+)/g)].map(([, x, y]) => [Number(x), Number(y)]);
}

test('default metrics agree with the catalogue without counting epics or follow-on scope', () => {
  const rows = sprintRows();
  const summary = summarize();
  assert.equal(summary.sprintItems, 30);
  assert.equal(summary.sprintPoints, 100);
  assert.equal(summary.completedSprintPoints, 40);
  assert.equal(summary.remainingSprintPoints, 60);
  assert.equal(rows[0].scopePoints, 100);
  assert.equal(rows[6].actualRemaining, 60);
  const blocked = workItems.filter((item) => item.sprint && item.kind !== 'Epic' && item.status === 'Blocked');
  assert.equal(blocked.length, 5);
  assert.equal(blocked.reduce((sum, item) => sum + item.estimate, 0), 10);
});

test('inclusive calendar is twelve days, ten weekdays, with a separate start-of-day kickoff', () => {
  const rows = sprintRows();
  assert.equal((Date.parse(sprint.end) - Date.parse(sprint.start)) / 86_400_000 + 1, 12);
  assert.equal(rows.length, 11);
  assert.deepEqual(rows.slice(1).map((row) => row.date), dates);
  assert.deepEqual(rows.map((row) => row.phase), ['kickoff', ...Array(10).fill('end-of-day')]);
  assert.equal(rows[0].date, sprint.start);
  assert.equal(rows[1].date, sprint.start);
  assert.equal(rows[0].actualRemaining, 100);
  assert.equal(rows[1].actualRemaining, 95);
  for (const row of rows.slice(1)) assert.ok(![0, 6].includes(new Date(`${row.date}T00:00:00Z`).getUTCDay()));
});

test('all daily actuals and ideals are exact, with six observed EODs and four null futures', () => {
  const rows = sprintRows();
  assert.deepEqual(rows.map((row) => row.actualRemaining), actuals);
  assert.deepEqual(rows.map((row) => row.idealRemaining), ideals);
  assert.ok(rows.every((row) => row.scopePoints === 100));
  assert.equal(rows.slice(1).filter((row) => row.actualRemaining !== null).length, 6);
  assert.equal(rows.filter((row) => row.actualRemaining === null).length, 4);
  assert.equal(rows[6].actualRemaining - rows[6].idealRemaining, 20);
});

test('an earlier as-of cutoff never credits later declared completions', () => {
  const earlier = { ...sprint, asOf: '2026-11-04' };
  const rows = sprintRows(workItems, earlier);
  assert.deepEqual(rows.map((row) => row.actualRemaining), [100, 95, 87, 79, ...Array(7).fill(null)]);
  assert.equal(rows[3].actualRemaining, 79);
  const report = renderSprintMarkdown(rows, { sprint: earlier });
  assert.equal([...report.matchAll(/^\d+\. \[#/gm)].length, 5);
  assert.match(report, /5 Done issues \/ 21 story points/);
  assert.doesNotMatch(report, /simulated completion: \*\*2026-11-0[569]/);
});

test('a future Done declaration is not credited before its date and never draws a future actual', () => {
  const items = cloneItems();
  items.find((item) => item.number === 43).doneDate = '2026-11-10';
  const rows = sprintRows(items);
  assert.equal(rows[6].actualRemaining, 63);
  assert.equal(rows[7].actualRemaining, null);
  assert.equal(rows.at(-1).actualRemaining, null);
  const report = renderSprintMarkdown(rows, { items });
  assert.match(report, /9 Done issues \/ 37 story points/);
  assert.doesNotMatch(report, /\[#43 -/);
});

test('In progress and In review receive no arbitrary percentage of completion credit', () => {
  const items = cloneItems();
  const done = items.find((item) => item.number === 6);
  done.status = 'In progress';
  done.doneDate = null;
  assert.equal(sprintRows(items)[6].actualRemaining, 65);
  done.status = 'In review';
  assert.equal(sprintRows(items)[6].actualRemaining, 65);
});

test('all epics and all non-sprint children remain excluded even with misleading flags or estimates', () => {
  const items = cloneItems();
  for (const item of items) {
    if (item.kind === 'Epic') {
      item.sprint = true;
      item.estimate = 999;
      item.status = 'Done';
      item.doneDate = '2026-11-02';
    } else if (!item.sprint) {
      item.estimate = 999;
      item.status = 'Done';
      item.doneDate = '2026-11-02';
    }
  }
  assert.deepEqual(sprintRows(items), sprintRows());
});

test('native closedAt metadata cannot change the simulated chart', () => {
  const items = cloneItems();
  for (const item of items) item.closedAt = item.status === 'Done' ? '2026-11-09T15:34:12Z' : null;
  assert.deepEqual(sprintRows(items), sprintRows());
  for (const item of items.filter((item) => item.status === 'Done')) item.closedAt = '2099-12-31T23:59:59Z';
  assert.deepEqual(sprintRows(items), sprintRows());
});

test('a simulated weekend completion is first credited in the following weekday EOD', () => {
  const items = cloneItems();
  items.find((item) => item.number === 43).doneDate = '2026-11-08';
  const rows = sprintRows(items);
  assert.equal(rows[5].date, '2026-11-06');
  assert.equal(rows[5].actualRemaining, 63);
  assert.equal(rows[6].date, '2026-11-09');
  assert.equal(rows[6].actualRemaining, 60);
});

test('strict date validation rejects invalid, non-ISO, reversed, and inconsistent calendar dates', () => {
  for (const date of ['2026-02-29', '2026-11-31', '2026-13-01', '2026-11-9', '2026-11-09T00:00:00Z', null]) {
    assert.throws(() => sprintRows(workItems, { ...sprint, asOf: date }), /calendar date/);
  }
  assert.throws(() => sprintRows(workItems, { ...sprint, end: '2026-11-01' }), /duration/);
  assert.throws(() => sprintRows(workItems, { ...sprint, duration: 10 }), /inclusive calendar/);
  assert.throws(() => sprintRows(workItems, { ...sprint, asOf: '2026-11-16' }), /asOf/);
  assert.throws(() => sprintRows(workItems, { ...sprint, asOf: '2026-11-08' }), /weekday/);
});

test('invalid simulated completion dates, missing Done dates, and unfinished dates fail explicitly', () => {
  for (const date of ['2026-02-29', '2026-11-31', null, undefined]) {
    const items = cloneItems();
    items.find((item) => item.number === 6).doneDate = date;
    assert.throws(() => sprintRows(items), /doneDate/);
  }
  for (const date of ['2026-11-01', '2026-11-14']) {
    const items = cloneItems();
    items.find((item) => item.number === 6).doneDate = date;
    assert.throws(() => sprintRows(items), /within the sprint/);
  }
  const items = cloneItems();
  items.find((item) => item.status === 'In review').doneDate = '2026-11-09';
  assert.throws(() => sprintRows(items), /Unfinished issue/);
});

test('missing, negative, fractional, non-finite, and string estimates cannot silently become zero', () => {
  for (const estimate of [undefined, null, -1, 2.5, NaN, Infinity, '5']) {
    const items = cloneItems();
    items.find((item) => item.number === 6).estimate = estimate;
    assert.throws(() => sprintRows(items), /estimate/);
  }
});

test('scope mismatch cannot silently rebase the fixed kickoff commitment', () => {
  const items = cloneItems();
  items.find((item) => item.number === 6).estimate = 6;
  assert.throws(() => sprintRows(items), /Committed estimates \(101\).*fixed kickoff baseline \(100\)/);
  assert.throws(() => sprintRows([]), /fixed kickoff baseline/);
  assert.throws(() => sprintRows(workItems, { ...sprint, baselinePoints: 0 }), /positive safe integer/);
});

test('duplicate issue numbers, unknown statuses, and non-array input fail closed', () => {
  const items = cloneItems();
  items.find((item) => item.number === 7).number = 6;
  assert.throws(() => sprintRows(items), /unique positive integer/);
  const unknown = cloneItems();
  unknown.find((item) => item.number === 6).status = '90% finished';
  assert.throws(() => sprintRows(unknown), /known delivery status/);
  assert.throws(() => sprintRows(null), /must be an array/);
});

test('row integrity guards reject fake future zero, rebased scope, missing weekdays, and lost provenance', () => {
  const future = sprintRows();
  future[7].actualRemaining = 0;
  assert.throws(() => renderBurndownSvg(future), /Future actual/);
  assert.throws(() => renderCsv(future), /Future actual/);
  const rebased = sprintRows();
  rebased[2].scopePoints = 87;
  assert.throws(() => renderCsv(rebased), /fixed sprint/);
  assert.throws(() => renderCsv(sprintRows().slice(1)), /kickoff and every sprint weekday/);
  const missing = sprintRows();
  missing[0].provenance = '';
  assert.throws(() => renderCsv(missing), /provenance/);
});

test('reporting is pure with deeply frozen inputs and fresh deterministic outputs', () => {
  const items = deepFreeze(cloneItems());
  const settings = deepFreeze(structuredClone(config));
  const before = JSON.stringify({ items, settings });
  const first = buildReports(items, settings);
  const second = buildReports(items, settings);
  assert.deepEqual(first, second);
  assert.notEqual(first, second);
  const rows = deepFreeze(sprintRows(items, settings.sprint));
  assert.equal(renderBurndownSvg(rows, settings), first[REPORT_PATHS[0]]);
  assert.equal(renderCsv(rows, settings), first[REPORT_PATHS[1]]);
  assert.equal(renderSprintMarkdown(rows, { ...settings, items }), first[REPORT_PATHS[2]]);
  const reordered = rows.map((row) => Object.fromEntries(Object.entries(row).reverse()));
  assert.equal(renderSprintMarkdown(reordered, { ...settings, items }), first[REPORT_PATHS[2]]);
  assert.equal(JSON.stringify({ items, settings }), before);
});

test('only the exact three report artifact paths are returned, with UTF-8/LF clean endings', () => {
  assert.deepEqual(REPORT_PATHS, ['reports/sprint-1-burndown.svg', 'reports/sprint-1-burndown.csv', 'reports/sprint-1.md']);
  const reports = buildReports();
  assert.deepEqual(Object.keys(reports), REPORT_PATHS);
  for (const [path, content] of Object.entries(reports)) {
    assert.equal(typeof content, 'string', path);
    assert.ok(content.length > 500, path);
    assert.doesNotMatch(content, /\r|[\t ]+$/m, path);
    assert.equal(content.match(/\n*$/)[0], '\n', path);
    assert.equal(Buffer.from(content, 'utf8').toString('utf8'), content, path);
    assert.ok(content.includes(HISTORY_NOTICE), path);
  }
});

test('the full CSV is auditable: exact header, kickoff, weekday rows, provenance, and blank future actuals', () => {
  const csv = renderCsv();
  const parsed = parseCsv(csv);
  assert.equal(parsed.length, 11);
  assert.deepEqual(parsed.map((row) => row.actualRemaining), actuals.map((value) => value === null ? '' : String(value)));
  assert.deepEqual(parsed.map((row) => row.idealRemaining), ideals.map(String));
  assert.deepEqual(parsed.map((row) => row.date), [sprint.start, ...dates]);
  assert.ok(parsed.every((row) => row.scopePoints === '100' && row.provenance.includes(HISTORY_NOTICE)));
  assert.ok(parsed.every((row) => /simulated completion dates.*native closedAt.*no implemented product/.test(row.provenance)));
  assert.ok(csv.includes('"ILLUSTRATIVE DEMO HISTORY'), 'Comma-bearing provenance must be CSV quoted');
});

test('SVG has accessible title/description, deterministic dimensions, metrics, and self-contained styling', () => {
  const svg = renderBurndownSvg();
  assert.match(svg, /width="1200" height="650" viewBox="0 0 1200 650"/);
  assert.match(svg, /role="img" aria-labelledby="burndown-title burndown-desc"/);
  assert.match(svg, /<title id="burndown-title">[^<]+story-point burndown<\/title>/);
  assert.match(svg, /<desc id="burndown-desc">[^<]+Future actuals are not observed[^<]+No product is implemented\.<\/desc>/);
  for (const value of ['100 committed', '40 completed', '60 remaining', '+20 points', 'behind ideal', 'DAY 6/10', HISTORY_NOTICE]) {
    assert.ok(svg.includes(value), value);
  }
  assert.match(svg, /stroke="#55e6ce"/);
  assert.match(svg, /id="ideal-line"[^>]+stroke-dasharray="7 6"/);
  assert.doesNotMatch(svg, /<(?:script|foreignObject|iframe|image|use|a)\b|\bon\w+\s*=|(?:href|src)\s*=|@import|@font-face|<!DOCTYPE|<!ENTITY/i);
  for (const [, target] of svg.matchAll(/url\(([^)]+)\)/g)) assert.match(target, /^#[a-z-]+$/);
});

test('SVG escapes every dynamic textual context, including XML-special and control characters', () => {
  const attack = `A & B <script>alert("x")</script> 'quoted'\u0001`;
  const settings = { ...config, projectTitle: attack, sprint: { ...sprint, title: attack } };
  const svg = renderBurndownSvg(sprintRows(workItems, settings.sprint), settings);
  assert.ok(svg.includes('A &amp; B &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &apos;quoted&apos;\ufffd'));
  assert.doesNotMatch(svg, /<script>|\u0001|&(?!(?:amp|lt|gt|quot|apos);)/);
  assert.match(svg, /<desc id="burndown-desc">A &amp; B/);
  const long = renderBurndownSvg(sprintRows(), { projectTitle: 'Long scenario label '.repeat(40) });
  assert.ok(long.includes('Long scenario label '.repeat(40)), 'Accessible title must preserve full source text');
  assert.ok(long.includes('\u2026'), 'Visible headings must fit without clipping');
});

test('SVG axes and date ticks expose 0..100 points and each weekday without weekend ticks', () => {
  const svg = renderBurndownSvg();
  const axes = svg.match(/<g id="axes">([\s\S]*?)\n  <\/g>/)?.[1];
  assert.ok(axes);
  for (const points of [0, 20, 40, 60, 80, 100]) assert.ok(axes.includes(`>${points}</text>`));
  for (const day of ['02', '03', '04', '05', '06', '09', '10', '11', '12', '13']) assert.ok(axes.includes(`>${day} Nov</text>`));
  assert.doesNotMatch(axes, />0[78] Nov<|>Sat<|>Sun</);
  assert.match(svg, /FUTURE \/ NOT OBSERVED/);
  assert.match(svg, /id="as-of-marker" x1="728"/);
});

test('every serialized CSV row matches every SVG row, including future blanks and provenance', () => {
  const reports = buildReports();
  assert.deepEqual(chartRows(reports[REPORT_PATHS[0]]), parseCsv(reports[REPORT_PATHS[1]]));
});

test('actual and ideal plotted coordinates match the complete CSV, not just chart metadata', () => {
  const reports = buildReports();
  const csv = parseCsv(reports[REPORT_PATHS[1]]);
  const coordinates = (row, index, field) => [104 + index * 104, Number((492 - Number(row[field]) * 2.1).toFixed(2))];
  const expectedActual = csv.flatMap((row, index) => row.actualRemaining === '' ? [] : [coordinates(row, index, 'actualRemaining')]);
  const expectedIdeal = csv.map((row, index) => coordinates(row, index, 'idealRemaining'));
  assert.deepEqual(linePoints(reports[REPORT_PATHS[0]], 'actual-line'), expectedActual);
  assert.deepEqual(linePoints(reports[REPORT_PATHS[0]], 'ideal-line'), expectedIdeal);
  assert.equal(expectedActual.length, 7);
  assert.equal(expectedActual.at(-1)[0], 728);
  assert.equal(expectedIdeal.length, 11);
  assert.equal((reports[REPORT_PATHS[0]].match(/class="actual-point"/g) ?? []).length, 7);
  assert.equal((reports[REPORT_PATHS[0]].match(/class="ideal-point"/g) ?? []).length, 11);
  assert.ok(expectedActual.every(([x]) => x <= 728), 'No future actual segment or projected points');
});

test('Markdown embeds the sibling SVG and states all exact snapshot and exclusion metrics', () => {
  const report = renderSprintMarkdown();
  assert.match(report, /!\[[^\n]+\]\(sprint-1-burndown\.svg\)/);
  for (const value of [
    '30 issues / 100 story points', '10 Done issues / 40 story points', '60 story points',
    '40% of committed points', '5 issues / 10 story points', '+20 points (behind ideal)',
    'ideal remaining is **40** versus actual **60**', '**5 zero-point epics**', '**15 non-sprint children**',
    '12 calendar days / 10 weekday working days', 'working day **6 of 10**',
  ]) assert.ok(report.includes(value), value);
  assert.match(report, /not an implemented product/);
  assert.match(report, /In progress and In review earn \*\*no partial completed credit\*\*/);
  assert.equal((report.match(/\| not observed \|/g) ?? []).length, 4);
  assert.match(report, /2026-11-02 \| Kickoff - start of day \| 100 \| 100 \| 100/);
  assert.match(report, /2026-11-09 \| Weekday end of day \| 40 \| 60 \| 100/);
});

test('Markdown links exactly the ten completed issues with declared dates and correct repository identity', () => {
  const report = renderSprintMarkdown();
  const entries = [...report.matchAll(/^(\d+)\. \[#(\d+) - [^\n]+\]\(https:\/\/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)\) - \*\*(\d+) points\*\*; simulated completion: \*\*(\d{4}-\d{2}-\d{2})\*\*\.$/gm)];
  assert.equal(entries.length, 10);
  assert.deepEqual(entries.map((entry) => Number(entry[2])), completedNumbers);
  for (const [index, entry] of entries.entries()) {
    const [, ordinal, number, owner, repo, target, points, date] = entry;
    const item = workItems.find((candidate) => candidate.number === Number(number));
    assert.equal(Number(ordinal), index + 1);
    assert.equal(owner, config.owner);
    assert.equal(repo, config.repo);
    assert.equal(target, number);
    assert.equal(Number(points), item.estimate);
    assert.equal(date, item.doneDate);
  }
  assert.match(report, /simulated completion dates\*\*, not native GitHub closedAt timestamps/);
  assert.match(report, /2026-11-09 seed run/);
});

test('Markdown escapes issue titles and uses configured links without allowing unsafe identity URLs', () => {
  const items = cloneItems();
  items.find((item) => item.number === 6).title = '<script> [wrong](javascript:alert(1)) & *not markup*';
  const settings = { ...config, items, owner: 'demo-owner', repo: 'demo.repo' };
  const report = renderSprintMarkdown(sprintRows(items), settings);
  assert.ok(report.includes('&lt;script&gt; \\[wrong\\]\\(javascript:alert\\(1\\)\\) &amp; \\*not markup\\*'));
  assert.ok(report.includes('(https://github.com/demo-owner/demo.repo/issues/6)'));
  assert.doesNotMatch(report, /<script>|\]\(javascript:/);
  assert.throws(() => renderSprintMarkdown(sprintRows(), { owner: 'bad/owner' }), /valid GitHub/);
  const divergent = sprintRows();
  divergent[6].actualRemaining = 61;
  assert.throws(() => renderSprintMarkdown(divergent), /issue evidence must match/);
});

test('native chart documentation explains burn-up without claiming native history seeding', () => {
  const report = renderSprintMarkdown();
  assert.match(report, /https:\/\/docs\.github\.com\/en\/issues\/planning-and-tracking-with-projects\/viewing-insights-about-your-project\/about-insights-for-projects/);
  assert.match(report, /https:\/\/docs\.github\.com\/en\/issues\/planning-and-tracking-with-projects\/viewing-insights-about-your-project\/creating-charts/);
  assert.match(report, /historical \*\*burn-up\*\* charts/);
  assert.match(report, /do \*\*not\*\* seed native chart history/);
  assert.match(report, /neither reads nor backdates GitHub event history/);
});

test('stale comparison recognizes missing and edited reports, without trimming semantic differences', () => {
  const expected = buildReports();
  assert.deepEqual(findStaleReports({}, expected), REPORT_PATHS.map((path) => ({ path, reason: 'missing' })));
  const changed = { ...expected, [REPORT_PATHS[0]]: expected[REPORT_PATHS[0]].replace('60 remaining', '0 remaining') };
  assert.deepEqual(findStaleReports(changed, expected), [{ path: REPORT_PATHS[0], reason: 'stale' }]);
  const noEof = { ...expected, [REPORT_PATHS[1]]: expected[REPORT_PATHS[1]].slice(0, -1) };
  assert.deepEqual(findStaleReports(noEof, expected), [{ path: REPORT_PATHS[1], reason: 'stale' }]);
  const extraBlank = { ...expected, [REPORT_PATHS[2]]: `${expected[REPORT_PATHS[2]]}\n` };
  assert.deepEqual(findStaleReports(extraBlank, expected), [{ path: REPORT_PATHS[2], reason: 'stale' }]);
  assert.throws(() => findStaleReports(expected, { ...expected, '../README.md': 'not permitted' }), /exactly the three/);
});

test('Windows CRLF comparisons are normalized without altering source or persisted strings', () => {
  const expected = buildReports();
  const persisted = Object.fromEntries(Object.entries(expected).map(([path, text]) => [path, text.replaceAll('\n', '\r\n')]));
  const before = structuredClone(persisted);
  assert.deepEqual(findStaleReports(persisted, expected), []);
  assert.deepEqual(persisted, before);
  assert.ok(Object.values(persisted).every((text) => text.includes('\r\n')));
  const bareCr = { ...expected, [REPORT_PATHS[1]]: expected[REPORT_PATHS[1]].replaceAll('\n', '\r') };
  assert.deepEqual(findStaleReports(bareCr, expected), [{ path: REPORT_PATHS[1], reason: 'stale' }]);
});

test('persisted full CSV, SVG coordinates, and Markdown are current and mutually consistent', () => {
  const persisted = Object.fromEntries(REPORT_PATHS.map((path) => [path, readFileSync(new URL(path, root), 'utf8')]));
  assert.deepEqual(findStaleReports(persisted), []);
  assert.deepEqual(chartRows(persisted[REPORT_PATHS[0]]), parseCsv(persisted[REPORT_PATHS[1]].replaceAll('\r\n', '\n')));
  const csv = parseCsv(persisted[REPORT_PATHS[1]].replaceAll('\r\n', '\n'));
  assert.equal(linePoints(persisted[REPORT_PATHS[0]], 'actual-line').at(-1)[1], 366);
  assert.equal(csv[6].actualRemaining, '60');
  assert.ok(persisted[REPORT_PATHS[2]].includes('| 2026-11-09 | Weekday end of day | 40 | 60 | 100 |'));
});

test('credential-free --check works from any cwd, preserves files, and is timezone independent', () => {
  const before = REPORT_PATHS.map((path) => readFileSync(new URL(path, root)));
  const command = spawnSync(process.execPath, [reportCommand, '--check'], {
    cwd: fileURLToPath(new URL('../', root)),
    encoding: 'utf8',
    env: { ...process.env, TZ: 'Pacific/Kiritimati', GH_TOKEN: '', GITHUB_TOKEN: '', GH_ENTERPRISE_TOKEN: '' },
  });
  assert.equal(command.status, 0, command.stderr);
  assert.match(command.stdout, /Reports are current \(3 files; CRLF normalized\)/);
  assert.equal(command.stderr, '');
  assert.deepEqual(REPORT_PATHS.map((path) => readFileSync(new URL(path, root))), before);
});

test('unknown command options fail without accepting alternate output paths or changing artifacts', () => {
  const before = REPORT_PATHS.map((path) => readFileSync(new URL(path, root)));
  for (const args of [['--output=../README.md'], ['--check', '--write'], ['--check', '--check']]) {
    const command = spawnSync(process.execPath, [reportCommand, ...args], { encoding: 'utf8' });
    assert.equal(command.status, 1);
    assert.match(command.stderr, /Usage:/);
  }
  assert.deepEqual(REPORT_PATHS.map((path) => readFileSync(new URL(path, root))), before);
});
