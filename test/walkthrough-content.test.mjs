import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import * as content from '../demo/walkthrough.mjs';
import { config, workItems, summarize } from '../demo/catalog.mjs';
import { assigneesFor, milestoneTitle } from '../tools/provision-demo.mjs';
import { sprintRows } from '../lib/reporting.mjs';

const { walkthrough, pages } = content;
const repositoryUrl = `https://github.com/${config.owner}/${config.repo}`;
const projectUrl = 'https://github.com/orgs/alvine-aurelio-org/projects/11';
const view = (number) => `${projectUrl}/views/${number}`;
const chart = (number) => `${projectUrl}/insights/${number}`;
const issue = (number) => `${repositoryUrl}/issues/${number}`;
const pull = (number) => `${repositoryUrl}/pull/${number}`;
const report = `${repositoryUrl}/blob/main/reports/sprint-1.md`;
const sourceUrl = new URL('../demo/walkthrough.mjs', import.meta.url);
const testUrl = new URL('./walkthrough-content.test.mjs', import.meta.url);
const summary = summarize();
const delivery = workItems.filter((item) => item.kind !== 'Epic');
const sprint = delivery.filter((item) => item.sprint);
const openDelivery = delivery.filter((item) => item.state === 'open');
const points = (items) => items.reduce((sum, item) => sum + item.estimate, 0);
const item = (number) => workItems.find((entry) => entry.number === number);
const page = (id) => pages.find((entry) => entry.id === id);
const words = (value) => value.trim().split(/\s+/u).filter(Boolean).length;

function strings(value) {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

const text = (value) => strings(value).join(' ');
const prose = (value) => {
  const { id, kind, url, visual, table, links, ...body } = value;
  return [...strings(body), ...(links ?? []).map((link) => link.label)].join(' ');
};
const linksOf = (value) => [value.url, ...(value.links ?? []).map((link) => link.url)];
const byStatus = (items) => config.statuses.map(({ name }) => {
  const selected = items.filter((entry) => entry.status === name);
  return [name, String(selected.length), String(points(selected))];
});

const route = [
  ['welcome', 'CityPulse: teach the connected delivery story'],
  ['run-of-show', 'Choose the 35-minute or 15-minute route'],
  ['preflight', 'Preflight: access, tabs, and a protected baseline'],
  ['repository', 'Start at the private repository'],
  ['portfolio', 'Portfolio: one scope, native hierarchy'],
  ['issue-detail', 'Epic and child: what native completion means'],
  ['delivery-board', 'Delivery board: six stages, 45 children'],
  ['sprint-board', 'Sprint 1: a 100-point commitment'],
  ['burndown', 'Burndown: 60 remaining, 20 behind ideal'],
  ['blockers', 'Blockers: follow the unresolved prerequisite'],
  ['at-risk-update', 'At risk: turn evidence into the next action'],
  ['roadmap', 'Roadmap: planned dates, not delivery evidence'],
  ['milestones', 'Milestones: three gates, not three sprints'],
  ['workload', 'Workload: distribution is not capacity'],
  ['bug-triage', 'Bug triage: discuss the synthetic privacy case'],
  ['current-insights', 'Insights: choose Count or Sum deliberately'],
  ['native-burnup', 'Native burn-up: read the real event boundary'],
  ['pull-requests', 'Pull requests: merged assembly, open design'],
  ['actions', 'Actions: green checks at the right revision'],
  ['workflows', 'Workflows: inspect the saved rules safely'],
  ['optional-interaction', 'Optional: move #10, verify, then restore'],
  ['audience-questions', 'Audience questions: answer with the right scope'],
  ['recovery', 'Recover without reseeding or guessing'],
  ['quick-reference', 'Quick reference: reset and close on the risk'],
];

test('exports only the two requested entries and the exact walkthrough metadata', () => {
  assert.deepEqual(Object.keys(content).sort(), ['pages', 'walkthrough']);
  assert.deepEqual(walkthrough, {
    title: 'CityPulse Instructor Walkthrough',
    subtitle: 'A browser-only script for showing one connected GitHub delivery environment without changing its baseline.',
    version: '1.0',
    scenarioDate: config.sprint.asOf,
    repositoryUrl,
    projectUrl,
    audience: 'Instructor / presenter',
    duration: '30–40 minutes, with a 15-minute fast track',
  });
  assert.equal(walkthrough.scenarioDate, '2026-11-09');
});

test('has exactly 24 uniquely identified pages in the printed route order', () => {
  assert.equal(pages.length, 24);
  assert.equal(new Set(pages.map(({ id }) => id)).size, 24);
  assert.deepEqual(pages.map(({ id, title }) => [id, title]), route);
  for (const { id } of pages) assert.match(id, /^[a-z]+(?:-[a-z0-9]+)*$/u);
});

test('every page supplies the complete renderer schema and only supported extensions', () => {
  const required = ['id', 'kind', 'title', 'kicker', 'time', 'url', 'intro', 'clicks',
    'show', 'say', 'ask', 'expected', 'warning', 'checkpoint', 'visual'];
  const kinds = new Set(['cover', 'route', 'preflight', 'stop', 'qa', 'recovery', 'quickref']);
  const visuals = new Set(['cover', 'route', 'none', 'hierarchy', 'board', 'sprint', 'burndown',
    'dependencies', 'roadmap', 'workload', 'insights', 'pr-flow', 'workflow', 'safe-move', 'scope']);
  for (const entry of pages) {
    const optional = ['table', 'links'].filter((key) => Object.hasOwn(entry, key));
    assert.deepEqual(Object.keys(entry).sort(), [...required, ...optional].sort(), entry.id);
    assert.ok(kinds.has(entry.kind), entry.id);
    assert.ok(visuals.has(entry.visual), entry.id);
    for (const key of required.filter((key) => !['clicks', 'show', 'ask', 'expected'].includes(key))) {
      assert.equal(typeof entry[key], 'string', `${entry.id}.${key}`);
      assert.ok(entry[key].trim(), `${entry.id}.${key}`);
    }
    for (const [key, minimum, maximum] of [['clicks', 3, 5], ['show', 2, 4], ['expected', 1, 4]]) {
      assert.ok(Array.isArray(entry[key]), `${entry.id}.${key}`);
      assert.ok(entry[key].length >= minimum && entry[key].length <= maximum, `${entry.id}.${key}`);
      assert.ok(entry[key].every((value) => typeof value === 'string' && value.trim()), `${entry.id}.${key}`);
    }
    assert.deepEqual(Object.keys(entry.ask).sort(), ['answer', 'question']);
    for (const answer of Object.values(entry.ask)) assert.ok(typeof answer === 'string' && answer.trim());
    if (entry.table) {
      assert.ok(Array.isArray(entry.table.headers) && entry.table.headers.length >= 2);
      assert.ok(Array.isArray(entry.table.rows) && entry.table.rows.length >= 1);
      assert.deepEqual(Object.keys(entry.table).sort(), ['headers', 'rows']);
      for (const row of entry.table.rows) {
        assert.ok(Array.isArray(row));
        assert.equal(row.length, entry.table.headers.length, entry.id);
        assert.ok(row.every((cell) => typeof cell === 'string' && cell.trim()), entry.id);
      }
      assert.ok(entry.table.headers.every((cell) => typeof cell === 'string' && cell.trim()));
    }
    if (entry.links) {
      assert.ok(Array.isArray(entry.links) && entry.links.length > 0);
      assert.ok(entry.links.length <= 17, entry.id);
      for (const link of entry.links) {
        assert.deepEqual(Object.keys(link).sort(), ['label', 'url']);
        assert.ok(typeof link.label === 'string' && link.label.trim());
        assert.equal(typeof link.url, 'string');
      }
    }
  }
});

test('text fits the portrait renderer budgets, including the smaller burndown allowance', () => {
  for (const entry of pages) {
    assert.ok(entry.title.length <= 62, `${entry.id}: title ${entry.title.length}`);
    assert.ok(entry.kicker.length <= 32, `${entry.id}: kicker`);
    assert.ok(entry.time.length <= 24, `${entry.id}: time`);
    assert.ok(words(entry.intro) <= 40, `${entry.id}: introduction`);
    assert.ok(words(entry.say) <= 50, `${entry.id}: spoken script`);
    const maximum = entry.id === 'burndown' ? 190 : 280;
    assert.ok(words(prose(entry)) <= maximum, `${entry.id}: ${words(prose(entry))} words exceeds ${maximum}`);
    assert.ok(words(entry.warning) <= 30, `${entry.id}: concise warning`);
    assert.ok(words(entry.checkpoint) <= 30, `${entry.id}: concise checkpoint`);
    assert.ok(Object.values(entry.ask).every((value) => words(value) <= 30), `${entry.id}: short Q&A`);
  }
});

test('renderer content is plain text without markup, embedded bullets, or multiline strings', () => {
  for (const value of strings({ walkthrough, pages })) {
    assert.equal(value, value.trim());
    assert.doesNotMatch(value, /[`*\u2022\u2023\u25cf\u25e6\r\n]/u);
    assert.doesNotMatch(value, /<\/?[a-z][^>]*>|\[[^\]]+\]\([^)]+\)|^[-+]\s/iu);
    assert.doesNotMatch(value, /[\u0000-\u001f\u007f]/u);
  }
});

test('all URLs are canonical HTTPS targets inside the exact repository or Project 11', () => {
  const targets = strings({ walkthrough, pages }).filter((value) => /^https?:/u.test(value));
  assert.ok(targets.length > 50);
  const scopes = [new URL(repositoryUrl).pathname, new URL(projectUrl).pathname];
  for (const target of targets) {
    const parsed = new URL(target);
    assert.equal(parsed.protocol, 'https:');
    assert.equal(parsed.origin, 'https://github.com');
    assert.equal(parsed.username + parsed.password + parsed.port + parsed.search + parsed.hash, '');
    assert.equal(parsed.href, target);
    assert.ok(scopes.some((scope) => parsed.pathname === scope || parsed.pathname.startsWith(`${scope}/`)), target);
  }
  for (const value of strings({ walkthrough, pages })) {
    for (const match of value.matchAll(/https?:\/\/[^\s]+/gu)) {
      assert.ok(targets.includes(match[0]), `URL embedded in prose: ${match[0]}`);
    }
  }
});

test('all seven canonical views and four custom charts have native navigation targets', () => {
  const targets = new Set(pages.flatMap(linksOf));
  assert.equal(config.views.length, 7);
  for (let number = 1; number <= config.views.length; number += 1) assert.ok(targets.has(view(number)));
  for (let number = 1; number <= 4; number += 1) assert.ok(targets.has(chart(number)));
  for (const [id, number] of [['portfolio', 1], ['delivery-board', 2], ['sprint-board', 3],
    ['roadmap', 4], ['workload', 5], ['blockers', 6], ['bug-triage', 7]]) {
    assert.equal(page(id).url, view(number));
    assert.ok(text(page(id)).includes(config.views[number - 1].name));
    if (config.views[number - 1].filter) assert.ok(text(page(id)).includes(config.views[number - 1].filter));
  }
  assert.equal(page('current-insights').url, chart(2));
  assert.equal(page('native-burnup').url, chart(4));
});

test('the data-only module has no imports, dependencies, network calls, or execution side effects', () => {
  const source = readFileSync(sourceUrl, 'utf8');
  assert.doesNotMatch(source, /^\s*import\b|\b(?:fetch|require|spawnSync|readFileSync|writeFileSync)\s*\(|\bprocess\./mu);
  assert.doesNotMatch(source, /<img|<script|@font-face|data:image|https:\/\/(?:fonts|images)\./iu);
});

test('both newly authored files have exactly one final newline and no trailing whitespace', () => {
  for (const url of [sourceUrl, testUrl]) {
    const source = readFileSync(url, 'utf8').replaceAll('\r\n', '\n');
    assert.ok(source.endsWith('\n') && !source.endsWith('\n\n'), url.pathname);
    assert.doesNotMatch(source, /[ \t]+$/mu, url.pathname);
  }
});

function printedPositions(label) {
  return label.replace(/^Pages?\s/u, '').split(' and ').flatMap((part) => {
    const [first, last = first] = part.split('–').map(Number);
    assert.ok(Number.isInteger(first) && Number.isInteger(last) && first <= last, label);
    return Array.from({ length: last - first + 1 }, (_, index) => first + index);
  });
}

test('fast-track references resolve to the actual printed pages and total fifteen minutes', () => {
  const rows = page('run-of-show').table.rows;
  const expectedStops = [
    [['repository', 'portfolio', 'issue-detail'], 'Repository + portfolio', 2],
    [['delivery-board', 'sprint-board'], 'Delivery + Sprint 1', 3],
    [['burndown'], 'Burndown', 2],
    [['blockers', 'at-risk-update'], 'Blockers + At risk', 2],
    [['roadmap', 'workload'], 'Roadmap + workload', 2],
    [['current-insights', 'pull-requests', 'actions', 'workflows'], 'Insights + PRs + workflows', 3],
    [['quick-reference'], 'Wrap and reset', 1],
  ];
  assert.equal(rows.length, expectedStops.length);
  for (const [index, [reference, focus, minutes]] of rows.entries()) {
    const [ids, expectedFocus, expectedMinutes] = expectedStops[index];
    const positions = printedPositions(reference);
    assert.ok(positions.every((position) => position >= 1 && position <= pages.length));
    assert.deepEqual(positions.map((position) => pages[position - 1].id), ids);
    assert.equal(focus, expectedFocus);
    assert.equal(Number(minutes), expectedMinutes);
  }
  assert.equal(rows.reduce((total, row) => total + Number(row[2]), 0), 15);
  assert.match(text(page('run-of-show')), /30–40 minutes/u);
  assert.match(text(page('run-of-show')), /page 8 for 2 minutes, page 9 for 1, page 11 for 1, and page 24 for 1/u);
  assert.equal(pages[20].id, 'optional-interaction');
  assert.equal(pages[21].id, 'audience-questions');
  assert.equal(pages[22].id, 'recovery');
});

test('cover metrics are catalogue-derived and the product and diagram boundaries are explicit', () => {
  const cover = page('welcome');
  assert.equal(cover.kind, 'cover');
  assert.equal(cover.url, repositoryUrl);
  for (const expected of [
    `${summary.total} real issues`, `${summary.epics} epics`, `${summary.children} delivery children`,
    `${summary.children} native child links`, `${summary.dependencyEdges} native dependency relationships`,
    `${workItems.filter((entry) => entry.state === 'open').length} open`,
    `${workItems.filter((entry) => entry.state === 'closed').length} closed-completed`,
  ]) assert.ok(text(cover).includes(expected), expected);
  assert.match(text(cover), /7 saved views, 4 custom charts, and 1 named sprint/u);
  assert.match(cover.warning, /schematics, not screenshots/u);
  assert.match(cover.intro, /product and delivery story are fictional/u);
});

test('preflight is browser-only, checks separate private access, and prohibits presenter setup writes', () => {
  const preflight = page('preflight');
  assert.equal(preflight.kind, 'preflight');
  assert.match(preflight.intro, /no Node, GitHub CLI, terminal, installation/u);
  assert.match(text(preflight), /private repository and linked private organization Project 11 separately/u);
  assert.match(text(preflight), /browser zoom/u);
  assert.ok(text(preflight).includes(config.views[2].filter));
  assert.match(text(preflight), /never replace it with @current/u);
  assert.match(text(preflight), /November 9 EOD/u);
  assert.match(text(preflight), /page 21 only/u);
  for (const restriction of ['seeding', 'new issues', 'drafts', 'imports', 'archiving', 'permission changes', 'credential display']) {
    assert.ok(preflight.warning.includes(restriction), restriction);
  }
});

test('repository landing shows the correct linked Project and existing report and guide entry points', () => {
  const landing = page('repository');
  assert.equal(landing.url, repositoryUrl);
  assert.match(text(landing), /Private badge/u);
  assert.match(text(landing), /About.*Sprint board/u);
  assert.match(text(landing), /Projects → CityPulse \| Digital Service Launch/u);
  assert.match(text(landing), /README.*overview, embedded burndown, and Presentation guide/u);
  assert.ok(linksOf(landing).includes(`${repositoryUrl}/projects`));
  assert.match(landing.warning, /another lab Project/u);
});

test('portfolio includes parents, native fields, saved sums, and virtualized-row caveats', () => {
  const portfolio = page('portfolio');
  assert.ok(portfolio.expected.includes(`${summary.total} portfolio issues / ${points(delivery)} points.`));
  assert.ok(portfolio.expected.includes(`In progress: ${summary.byStatus['In progress']} including the ${summary.epics} epics.`));
  for (const field of ['Workstream', 'Count', 'Estimate', 'Type', 'Parent issue', 'Sub-issues progress']) {
    assert.ok(text(portfolio).includes(field), field);
  }
  assert.match(text(portfolio), /collapsed/u);
  assert.match(text(portfolio), /virtualizes/u);
  assert.match(portfolio.warning, /not count only visible DOM rows/u);
});

test('display settings use the actual View button and dismissal never means closing the issue', () => {
  for (const id of ['portfolio', 'roadmap', 'workload']) {
    assert.match(page(id).clicks.join(' '), /View beside the filter/u);
    assert.doesNotMatch(page(id).clicks.join(' '), /view-name menu/u);
  }
  const bugInstructions = page('bug-triage').clicks.join(' ');
  assert.match(bugInstructions, /dismiss the detail panel/u);
  assert.doesNotMatch(bugInstructions, /close the issue(?! panel)/iu);
  assert.match(page('workflows').clicks[0], /Project toolbar → Workflows/u);
});

test('epic and child detail matches native seed state, type mapping, and real assignment helpers', () => {
  const detail = page('issue-detail');
  const epic = item(1);
  const child = item(6);
  const children = workItems.filter((entry) => entry.parent === epic.number);
  const complete = children.filter((entry) => entry.state === 'closed');
  assert.equal(detail.url, issue(epic.number));
  assert.ok(linksOf(detail).includes(issue(child.number)));
  assert.equal(epic.estimate, 0);
  assert.equal(epic.type, 'Feature');
  assert.ok(text(detail).includes(`${complete.length}/${children.length}`));
  assert.ok(text(detail).includes(`${children.length} children`));
  assert.ok(text(detail).includes(`${child.estimate}-point Estimate`));
  assert.equal(child.state, 'closed');
  assert.equal(child.stateReason, 'completed');
  assert.ok(text(detail).includes(child.title));
  assert.ok(text(detail).includes(child.role));
  assert.deepEqual(assigneesFor(child), ['alvinea28']);
  assert.deepEqual(assigneesFor(epic), ['alvinea28']);
  assert.match(text(detail), /not an organization Epic type/u);
  assert.match(detail.warning, /seeded checkbox.*test or approval evidence/u);
});

test('delivery board table is computed from all and only non-epic child issues', () => {
  const board = page('delivery-board');
  assert.deepEqual(board.table.rows, byStatus(delivery));
  assert.ok(board.expected.includes(`${delivery.length} delivery children / ${points(delivery)} points.`));
  assert.ok(text(board).includes(config.views[1].filter));
  assert.match(text(board), /six Status columns/u);
  assert.ok(text(board).includes(item(10).title));
  assert.match(board.warning, /Do not drag cards or move Done work/u);
});

test('sprint board has the named scope, correct dates, stage maths, and no partial credit', () => {
  const board = page('sprint-board');
  assert.deepEqual(board.table.rows, byStatus(sprint).filter(([, count]) => count !== '0'));
  assert.ok(board.expected.includes(`${summary.sprintItems} sprint issues / ${summary.sprintPoints} points.`));
  const done = sprint.filter((entry) => entry.state === 'closed');
  assert.ok(board.expected.includes(`${done.length} Done / ${summary.completedSprintPoints} completed points.`));
  assert.ok(board.expected.includes(`${sprint.length - done.length} open / ${summary.remainingSprintPoints} remaining points.`));
  const calendarDays = (Date.parse(config.sprint.end) - Date.parse(config.sprint.start)) / 86_400_000 + 1;
  assert.equal(calendarDays, 12);
  assert.equal(sprintRows().length - 1, 10);
  assert.match(text(board), /November 2–13, 2026, 12 calendar days inclusive and 10 working days/u);
  assert.ok(text(board).includes(config.views[2].filter));
  assert.ok(text(board).includes(`${summary.epics} epics and ${delivery.filter((entry) => !entry.sprint).length} uncommitted children`));
  assert.match(board.say, /no partial credit/u);
  assert.match(text(board), /Backlog has no sprint items/u);
});

test('burndown figures come from report rows and disclose simulated dates and blank future actuals', () => {
  const burndown = page('burndown');
  const rows = sprintRows();
  const snapshot = rows.find((row) => row.date === config.sprint.asOf && row.phase === 'end-of-day');
  const day = rows.indexOf(snapshot);
  assert.equal(burndown.url, report);
  assert.equal(burndown.visual, 'burndown');
  assert.ok(text(burndown).includes(`${config.sprint.baselinePoints} kickoff points`));
  assert.ok(text(burndown).includes(`working day ${day}`));
  assert.ok(text(burndown).includes(`actual ${snapshot.actualRemaining} remaining versus ideal ${snapshot.idealRemaining}`));
  assert.ok(text(burndown).includes(`${snapshot.actualRemaining - snapshot.idealRemaining} points behind`));
  assert.ok(text(burndown).includes(`${summary.completedSprintPoints} completed points = ${summary.completedSprintPoints * 100 / summary.sprintPoints}%`));
  assert.ok(rows.filter((row) => row.date > config.sprint.asOf).every((row) => row.actualRemaining === null));
  assert.match(text(burndown), /blank future actuals/u);
  assert.match(burndown.say, /completion dates are simulated.*events were not backdated/u);
  assert.match(burndown.warning, /not native GitHub closure history/u);
  assert.ok(linksOf(burndown).includes(`${repositoryUrl}/blob/main/reports/sprint-1-burndown.csv`));
  assert.ok(words(prose(burndown)) <= 190);
});

test('blocker examples use existing native prerequisites and keep blocked effort inside remaining', () => {
  const blockers = page('blockers');
  const blocked = sprint.filter((entry) => entry.status === 'Blocked');
  assert.ok(blockers.expected.includes(`${blocked.length} blocked issues / ${points(blocked)} points.`));
  assert.ok(text(blockers).includes(`${summary.dependencyEdges} native dependency relationships`));
  assert.deepEqual(item(11).blockedBy, [9]);
  assert.equal(item(9).state, 'open');
  assert.equal(item(9).status, 'In progress');
  assert.deepEqual(item(8).blockedBy, [7]);
  assert.equal(item(7).state, 'closed');
  assert.equal(item(7).status, 'Done');
  for (const number of [11, 9, 8, 7]) assert.ok(linksOf(blockers).includes(issue(number)));
  assert.match(text(blockers), /reciprocal Blocks link/u);
  assert.match(text(blockers), /inside the 60 remaining points/u);
  assert.match(blockers.warning, /do not add, remove, or resolve links/u);
});

test('risk stop opens the existing native update with dated risk, mitigation, and next action', () => {
  const update = page('at-risk-update');
  assert.equal(update.url, projectUrl);
  assert.match(text(update), /At risk status.*toolbar.*latest existing status update/u);
  for (const section of ['Risk', 'Mitigation', 'Next action']) assert.ok(text(update).includes(section));
  assert.match(text(update), /November 13/u);
  assert.match(text(update), /finish current prerequisites and review work/u);
  assert.match(text(update), /reconfirm beta scope/u);
  assert.match(update.warning, /fictional scenario.*do not create or edit an update/u);
});

test('roadmap maps real planning fields and explains milestone markers in an epic-only filter', () => {
  const roadmap = page('roadmap');
  const epics = workItems.filter((entry) => entry.kind === 'Epic');
  const epicMilestones = new Set(epics.map(milestoneTitle));
  assert.ok(roadmap.expected.includes(`${epics.length} epic bars.`));
  assert.deepEqual([...epicMilestones].sort(), ['Operations readiness', 'Public launch']);
  assert.equal(epicMilestones.has('Citizen beta'), false);
  assert.match(text(roadmap), /Dates.*Start date and Target date/u);
  assert.match(text(roadmap), /Markers → Sprint and Milestone/u);
  assert.match(text(roadmap), /Operations readiness on November 20 and Public launch on November 27/u);
  assert.match(text(roadmap), /Citizen beta, November 13, may not appear.*no epic is assigned/u);
  assert.match(roadmap.say, /not createdAt timestamps or actual delivery/u);
  assert.match(text(roadmap), /do not use Save view/u);
});

test('all milestone gate counts and closed/open splits match the provisioning milestone helper', () => {
  const milestonePage = page('milestones');
  assert.equal(milestonePage.url, `${repositoryUrl}/milestones`);
  assert.deepEqual(milestonePage.table.rows, config.milestones.map(({ title, due_on }) => {
    const selected = workItems.filter((entry) => milestoneTitle(entry) === title);
    const closed = selected.filter((entry) => entry.state === 'closed').length;
    return [title, `November ${Number(due_on.slice(8, 10))}`, String(selected.length), String(closed), String(selected.length - closed)];
  }));
  assert.match(text(milestonePage), /Issue-count progress is not point-weighted progress/u);
  assert.match(text(milestonePage), /Open dependencies still matter/u);
  assert.match(milestonePage.warning, /Do not edit due dates or close milestones/u);
});

test('workload totals and per-team sums match all open children rather than just the sprint', () => {
  const workload = page('workload');
  assert.deepEqual(workload.table.rows, config.teams.map(({ name }) => {
    const selected = openDelivery.filter((entry) => entry.team === name);
    return [name, String(selected.length), String(points(selected))];
  }));
  assert.ok(workload.expected.includes(`${openDelivery.length} open delivery issues / ${points(openDelivery)} points.`));
  const openSprint = sprint.filter((entry) => entry.state === 'open');
  assert.ok(workload.expected.includes(`Sprint subset: ${openSprint.length} open issues / ${points(openSprint)} points.`));
  assert.deepEqual(assigneesFor(item(10)), []);
  assert.deepEqual(assigneesFor(item(9)), ['alvinea28']);
  assert.match(text(workload), /not GitHub access-control groups/u);
  assert.match(workload.say, /not available capacity or measured velocity/u);
});

test('bug triage uses the eight native Bugs and the actual synthetic #28 acceptance conditions', () => {
  const triage = page('bug-triage');
  const bug = item(28);
  const bugs = workItems.filter((entry) => entry.type === 'Bug');
  assert.ok(triage.expected.includes(`${bugs.length} native Bugs.`));
  assert.equal(bug.status, 'Ready');
  assert.equal(bug.priority, 'P0 - Critical');
  assert.equal(bug.estimate, 2);
  assert.deepEqual(assigneesFor(bug), []);
  assert.ok(text(triage).includes(bug.title));
  assert.ok(linksOf(triage).includes(issue(bug.number)));
  assert.ok(bug.acceptance.some((criterion) => criterion.includes('neutral fallback')));
  assert.match(text(triage), /only citizen-visible fields.*neutral fallback/u);
  assert.match(triage.ask.answer, /never insert internal staff-note content/u);
  assert.match(triage.warning, /synthetic case.*real incident, completed fix, or executed test/u);
});

test('current Insights distinguishes the three aggregates and their catalogue-derived scopes', () => {
  const insights = page('current-insights');
  assert.deepEqual(insights.table.rows, [
    ['Delivery status', 'Count / Status', `${summary.total} issues`],
    ['Sprint 1 - Effort by status', 'Sum of Estimate / Status', `${points(sprint)} points`],
    ['Team workload', 'Sum of Estimate / Team', `${points(openDelivery)} points`],
  ]);
  assert.deepEqual(insights.links.map((link) => link.url), [chart(1), chart(2), chart(3)]);
  assert.match(text(insights), /Column, X Status, Y Count, no filter/u);
  assert.match(text(insights), /Column, X Status, Y Sum of Estimate/u);
  assert.match(text(insights), /Column, X Team, Y Sum of Estimate/u);
  assert.ok(text(insights).includes(config.views[2].filter));
  assert.ok(text(insights).includes(config.views[4].filter));
  for (const [status, , estimate] of byStatus(sprint).filter(([, count]) => count !== '0')) {
    assert.ok(text(insights).includes(`${status} ${estimate}`), status);
  }
  for (const { name } of config.teams) {
    assert.ok(text(insights).includes(`${name} ${points(openDelivery.filter((entry) => entry.team === name))}`));
  }
  assert.match(insights.warning, /inspection only.*do not change selections or save/u);
});

test('native burn-up has no fake screenshot or invented earlier native delivery history', () => {
  const burnup = page('native-burnup');
  assert.equal(burnup.url, chart(4));
  assert.equal(burnup.visual, 'none');
  assert.match(text(burnup), /Stacked area, X Time, Y Sum of Estimate/u);
  assert.match(text(burnup), /named Sprint 1 filter/u);
  assert.match(text(burnup), /November 2–9 range/u);
  assert.match(text(burnup), /November 9 only: Open 60 \/ Completed 40; earlier values zero/u);
  assert.match(burnup.say, /native burn-up, not native burndown/u);
  assert.match(burnup.say, /not backdated events or manufactured history/u);
  assert.match(text(burnup), /default Burn up/u);
  assert.ok(linksOf(burnup).includes(report));
});

test('PR demonstration preserves intentionally open #52, linked #8, and fifty issue-only cards', () => {
  const prs = page('pull-requests');
  assert.equal(prs.url, pull(52));
  assert.ok(linksOf(prs).includes(pull(51)));
  assert.ok(linksOf(prs).includes(issue(8)));
  assert.match(text(prs), /PR #51 MERGED; PR #52 OPEN/u);
  assert.match(text(prs), /Closes #8/u);
  for (const tab of ['Conversation', 'Files changed', 'Checks', 'Development']) assert.ok(text(prs).includes(tab));
  assert.match(text(prs), /Both PRs outside the 50 issue cards/u);
  assert.match(text(prs), /Green CI is not human approval/u);
  assert.match(prs.warning, /Never merge PR #52, close #8, or add either PR/u);
  assert.equal(item(8).state, 'open');
  assert.equal(item(8).status, 'In review');
});

test('Actions binds Demo quality and CodeQL to the current revision without freezing a test count', () => {
  const actions = page('actions');
  assert.equal(actions.url, `${repositoryUrl}/actions`);
  assert.match(text(actions), /Demo quality.*same revision/u);
  assert.match(text(actions), /CodeQL.*same current main revision/u);
  assert.match(text(actions), /test and report-freshness steps/u);
  assert.match(text(actions), /PR head from main/u);
  assert.match(text(actions), /not green.*rather than substitute an older success/u);
  assert.match(actions.say, /not runtime application tests/u);
  assert.match(actions.warning, /do not rerun workflows/u);
  for (const entry of pages) {
    assert.doesNotMatch(text(entry), /\b\d+\s+(?:tests?\s+(?:pass(?:ed)?|fail(?:ed)?)|pass(?:ed|ing)?\s+tests?)\b/iu);
  }
});

test('native workflow inventory distinguishes seven enabled rules from broad auto-add and archive', () => {
  const workflows = page('workflows');
  assert.equal(workflows.url, `${projectUrl}/workflows`);
  assert.deepEqual(workflows.table.rows.map(([name]) => name), [
    'Item closed', 'Auto-close issue', 'Item reopened', 'Pull request linked',
    'Pull request merged', 'Item added to project', 'Auto-add sub-issues to project',
  ]);
  assert.equal(workflows.table.rows.length, 7);
  assert.match(text(workflows), /Item closed.*Done/u);
  assert.match(text(workflows), /Item reopened → Ready/u);
  assert.match(text(workflows), /Pull request linked → In review/u);
  assert.match(text(workflows), /Broad Auto-add off; Auto-archive off/u);
  assert.match(text(workflows), /choosing Done can close the underlying issue/u);
  assert.match(workflows.warning, /Do not enable, disable, edit, archive, or trigger rules/u);
});

test('optional #10 interaction calculates temporary sums and explicitly restores every baseline field', () => {
  const interaction = page('optional-interaction');
  const original = item(10);
  assert.equal(original.status, 'Ready');
  assert.equal(original.estimate, 2);
  assert.equal(original.sprint, true);
  assert.equal(original.state, 'open');
  assert.deepEqual(assigneesFor(original), []);
  const temporary = sprint.map((entry) => ({ ...entry, status: entry.number === original.number ? 'In progress' : entry.status }));
  const temporaryRows = new Map(byStatus(temporary).map(([status, count, estimate]) => [status, { count, estimate }]));
  const baselineRows = new Map(byStatus(sprint).map(([status, count, estimate]) => [status, { count, estimate }]));
  const temporaryReady = temporaryRows.get('Ready');
  const temporaryProgress = temporaryRows.get('In progress');
  const baselineReady = baselineRows.get('Ready');
  const baselineProgress = baselineRows.get('In progress');
  assert.ok(interaction.expected.includes(`Temporary Ready: ${temporaryReady.count} issues / ${temporaryReady.estimate} points; In progress: ${temporaryProgress.count} / ${temporaryProgress.estimate}.`));
  assert.ok(interaction.expected.includes(`Restored Ready: ${baselineReady.count} issues / ${baselineReady.estimate} points; In progress: ${baselineProgress.count} / ${baselineProgress.estimate}.`));
  assert.equal(points(temporary), summary.sprintPoints);
  assert.equal(points(temporary.filter((entry) => entry.status === 'Done')), summary.completedSprintPoints);
  assert.match(interaction.intro, /explicit owner permission/u);
  assert.ok(text(interaction).includes(original.title));
  assert.ok(text(interaction).includes(config.sprint.title));
  assert.match(interaction.clicks[1], /Status dropdown → In progress.*canonical Sprint board.*reload/u);
  assert.match(interaction.clicks[3], /Status dropdown → Ready.*canonical Sprint board.*reload again/u);
  assert.match(text(interaction), /open, Ready, 2 points, unassigned, same named Sprint/u);
  assert.match(interaction.warning, /Never choose Done or edit Assignees, Sprint, or Estimate/u);
  assert.equal(interaction.visual, 'safe-move');
});

test('audience questions include answers for scopes, effort, blockers, capacity, CI, and provenance', () => {
  const qa = page('audience-questions');
  assert.equal(qa.kind, 'qa');
  assert.equal(qa.table.rows.length, 7);
  const answers = qa.table.rows.map(([, answer]) => answer).join(' ');
  for (const expected of [
    `${summary.total} includes ${summary.epics} epics`, `${delivery.length} delivery children`,
    `${sprint.length} committed sprint children`, `${openDelivery.length} open delivery children`,
    `${points(sprint)} committed sprint points`, `${points(delivery)} all delivery points`,
    `${points(openDelivery)} open delivery points`,
  ]) assert.ok(answers.includes(expected), expected);
  assert.match(answers, /40 Done points \/ 100 = 40%; 60 remain/u);
  assert.match(answers, /10 blocked points are inside the remaining 60/u);
  assert.match(answers, /not actual staffing or measured throughput/u);
  assert.match(answers, /not human approval, runtime acceptance, or production authorization/u);
  assert.match(answers, /illustrative dates; native events start November 9/u);
});

test('recovery handles access, scopes, axes, unsaved changes, owned edits, and completed downloads', () => {
  const recovery = page('recovery');
  assert.equal(recovery.kind, 'recovery');
  const instructions = recovery.clicks.join(' ');
  assert.match(instructions, /404.*intended account.*separate read access.*private resources/u);
  assert.match(instructions, /do not assume deletion/u);
  assert.ok(instructions.includes(config.views[2].filter));
  assert.match(instructions, /not @current/u);
  assert.match(instructions, /expand Workstream groups and parents.*virtualized/u);
  assert.match(instructions, /Count versus Sum of Estimate and filter/u);
  assert.match(instructions, /Dates → Start date \+ Target date/u);
  assert.match(instructions, /discard, do not Save/u);
  assert.match(instructions, /restore only your own page 21 #10 move.*otherwise stop.*never seed/u);
  assert.match(instructions, /count loaded view rows before.*Export view data.*Export confirmation/u);
  assert.match(instructions, /verify a completed saved download, never confirmation alone/u);
  assert.match(recovery.ask.answer, /saved file, or report it unconfirmed/u);
  assert.equal(recovery.visual, 'none');
});

test('quick reference stays compact, links all eleven native lenses, and leaves the baseline intact', () => {
  const quick = page('quick-reference');
  assert.equal(quick.kind, 'quickref');
  assert.equal(quick.url, view(3));
  assert.equal(quick.links.length, 17);
  assert.deepEqual(quick.links.slice(0, 7).map((link) => link.url), Array.from({ length: 7 }, (_, index) => view(index + 1)));
  assert.deepEqual(quick.links.slice(7, 11).map((link) => link.url), Array.from({ length: 4 }, (_, index) => chart(index + 1)));
  for (const target of [issue(8), issue(10), issue(11), pull(51), pull(52), report]) {
    assert.ok(linksOf(quick).includes(target));
  }
  assert.match(text(quick), /50 portfolio \/ 45 delivery \/ 30 sprint \/ 35 open delivery/u);
  for (const [status, count] of byStatus(delivery)) assert.ok(text(quick).includes(`${status} ${count}`));
  assert.match(text(quick), /100 committed \/ 40 completed \/ 60 remaining/u);
  assert.match(text(quick), /No unsaved changes; #10 Ready; #8 In review; PR #52 OPEN/u);
  assert.match(quick.checkpoint, /Sprint board 03 reloaded, unchanged, and visibly At risk/u);
  assert.match(quick.say, /does not prove a service was built or deployed/u);
});

test('no page instructs closing or merging the review example, destructive actions, or fake evidence', () => {
  for (const entry of pages) {
    for (const instruction of entry.clicks) {
      assert.doesNotMatch(instruction, /^(?:merge\b|close\s+(?:issue|PR|pull request|#)|archive\b|delete\b|seed\b|rerun\b|enable\b|disable\b)/iu, entry.id);
      assert.doesNotMatch(instruction, /\b(?:click|press|select)\s+(?:the\s+)?(?:Merge pull request|Confirm merge|Close issue|Create issue|Archive item)\b/iu, entry.id);
    }
    assert.doesNotMatch(text(entry), /this screenshot|screenshot shows|screenshot proves|captured screenshot/iu, entry.id);
    assert.ok(entry.warning.trim() && entry.checkpoint.trim(), entry.id);
  }
  assert.match(page('pull-requests').warning, /Never merge PR #52/u);
  assert.match(page('quick-reference').warning, /Do not merge, close, archive/u);
});
