import assert from 'node:assert/strict';
import test from 'node:test';
import * as catalog from '../demo/catalog.mjs';

const { config, workItems, issueBody, summarize } = catalog;
const expectedStatuses = ['Backlog', 'Ready', 'In progress', 'In review', 'Blocked', 'Done'];
const expectedCounts = { Backlog: 10, Ready: 10, 'In progress': 10, 'In review': 5, Blocked: 5, Done: 10 };
const expectedSlotStatuses = ['Done', 'Done', 'In review', 'In progress', 'Ready', 'Blocked', 'Ready', 'Backlog', 'Backlog'];
const expectedSlotEstimates = [5, 3, 3, 5, 2, 2, 3, 5, 8];
const expectedWorkstreams = ['Citizen onboarding', 'Service catalogue', 'Request tracking', 'Staff operations', 'Release and reliability'];
const expectedDoneDates = [
  ['2026-11-02', '2026-11-03'],
  ['2026-11-03', '2026-11-04'],
  ['2026-11-04', '2026-11-05'],
  ['2026-11-05', '2026-11-06'],
  ['2026-11-06', '2026-11-09'],
];
const byNumber = new Map(workItems.map((item) => [item.number, item]));
const sumPoints = (items) => items.reduce((total, item) => total + item.estimate, 0);
const childrenOf = (parent) => workItems.filter((item) => item.parent === parent);
const issueUrl = (number) => `https://github.com/alvine-aurelio-org/citypulse-projects-demo/issues/${number}`;

function assertCalendarDay(value, label) {
  assert.equal(typeof value, 'string', label);
  assert.match(value, /^\d{4}-\d{2}-\d{2}$/, label);
  const parsed = new Date(`${value}T00:00:00Z`);
  assert.ok(Number.isFinite(parsed.getTime()), label);
  assert.equal(parsed.toISOString().slice(0, 10), value, label);
}

function assertAcyclic(items) {
  const lookup = new Map(items.map((item) => [item.number, item]));
  const visiting = new Set();
  const visited = new Set();

  function visit(number) {
    assert.ok(!visiting.has(number), `Dependency cycle at #${number}`);
    if (visited.has(number)) return;
    assert.ok(lookup.has(number), `Missing dependency #${number}`);
    visiting.add(number);
    for (const dependency of lookup.get(number).blockedBy) visit(dependency);
    visiting.delete(number);
    visited.add(number);
  }

  for (const item of items) visit(item.number);
  assert.equal(visited.size, items.length);
}

test('exports exactly the four requested ES module entry points', () => {
  assert.deepEqual(Object.keys(catalog).sort(), ['config', 'issueBody', 'summarize', 'workItems']);
  assert.equal(typeof issueBody, 'function');
  assert.equal(typeof summarize, 'function');
});

test('config has the exact project identity and inclusive twelve-day sprint contract', () => {
  assert.deepEqual(Object.keys(config).sort(), [
    'owner', 'repo', 'projectTitle', 'sprint', 'statuses', 'priorities', 'teams', 'risks', 'milestones', 'views',
  ].sort());
  assert.equal(config.owner, 'alvine-aurelio-org');
  assert.equal(config.repo, 'citypulse-projects-demo');
  assert.equal(config.projectTitle, 'CityPulse | Digital Service Launch');
  assert.deepEqual(config.sprint, {
    title: 'Sprint 1 - Citizen beta',
    start: '2026-11-02',
    end: '2026-11-13',
    duration: 12,
    asOf: '2026-11-09',
    baselinePoints: 100,
  });
  const days = (Date.parse(config.sprint.end) - Date.parse(config.sprint.start)) / 86_400_000 + 1;
  assert.equal(days, config.sprint.duration);
  assert.ok(config.sprint.start <= config.sprint.asOf && config.sprint.asOf <= config.sprint.end);
});

test('option dictionaries have exact ordered names, valid GraphQL colours, and descriptions', () => {
  const colours = new Set(['BLUE', 'GRAY', 'GREEN', 'ORANGE', 'PINK', 'PURPLE', 'RED', 'YELLOW']);
  const dictionaries = [
    [config.statuses, expectedStatuses],
    [config.priorities, ['P0 - Critical', 'P1 - High', 'P2 - Normal', 'P3 - Low']],
    [config.teams, ['Product', 'Experience', 'Platform', 'Service Ops', 'Quality']],
    [config.risks, ['Low', 'Medium', 'High']],
  ];
  for (const [options, names] of dictionaries) {
    assert.deepEqual(options.map((option) => option.name), names);
    assert.equal(new Set(options.map((option) => option.name)).size, options.length);
    for (const option of options) {
      assert.deepEqual(Object.keys(option).sort(), ['color', 'description', 'name']);
      assert.ok(colours.has(option.color), option.name);
      assert.ok(option.description.length >= 30, option.name);
    }
  }
});

test('the three milestones have the requested November dates and UTC due_on timestamps', () => {
  assert.deepEqual(config.milestones.map(({ title, due_on }) => ({ title, due_on })), [
    { title: 'Citizen beta', due_on: '2026-11-13T23:59:59Z' },
    { title: 'Operations readiness', due_on: '2026-11-20T23:59:59Z' },
    { title: 'Public launch', due_on: '2026-11-27T23:59:59Z' },
  ]);
  for (const milestone of config.milestones) {
    assert.deepEqual(Object.keys(milestone).sort(), ['description', 'due_on', 'title']);
    assert.ok(milestone.description.length >= 40);
    assert.ok(Number.isFinite(Date.parse(milestone.due_on)));
  }
});

test('the seven view seeds preserve the specified layouts and filter scoping', () => {
  assert.deepEqual(config.views, [
    { name: '01 - Portfolio backlog', layout: 'TABLE_LAYOUT', filter: '' },
    { name: '02 - Delivery board', layout: 'BOARD_LAYOUT', filter: '-label:epic' },
    { name: '03 - Sprint 1 board', layout: 'BOARD_LAYOUT', filter: 'sprint:"Sprint 1 - Citizen beta"' },
    { name: '04 - Release roadmap', layout: 'ROADMAP_LAYOUT', filter: 'label:epic' },
    { name: '05 - Team workload', layout: 'TABLE_LAYOUT', filter: 'is:open -label:epic' },
    { name: '06 - Risks and blockers', layout: 'BOARD_LAYOUT', filter: 'status:Blocked' },
    { name: '07 - Bug triage', layout: 'TABLE_LAYOUT', filter: 'type:Bug' },
  ]);
  assert.equal(new Set(config.views.map((view) => view.name)).size, 7);
});

test('exactly fifty unique stable integer issue numbers are ordered 1 through 50', () => {
  assert.equal(workItems.length, 50);
  assert.deepEqual(workItems.map((item) => item.number), Array.from({ length: 50 }, (_, index) => index + 1));
  assert.equal(byNumber.size, 50);
  assert.ok(workItems.every((item) => Number.isInteger(item.number)));
});

test('every item exposes all required fields plus explicit native-state seed fields', () => {
  const fields = [
    'number', 'title', 'type', 'kind', 'parent', 'estimate', 'sprint', 'status', 'priority', 'team',
    'workstream', 'risk', 'start', 'target', 'doneDate', 'blockedBy', 'role', 'summary', 'acceptance',
    'notes', 'state', 'stateReason',
  ].sort();
  const names = (options) => new Set(options.map((option) => option.name));
  for (const item of workItems) {
    assert.deepEqual(Object.keys(item).sort(), fields, `#${item.number}`);
    assert.equal(typeof item.sprint, 'boolean');
    assert.ok(Number.isInteger(item.estimate) && item.estimate >= 0);
    assert.ok(names(config.statuses).has(item.status));
    assert.ok(names(config.priorities).has(item.priority));
    assert.ok(names(config.teams).has(item.team));
    assert.ok(names(config.risks).has(item.risk));
    assert.ok(Array.isArray(item.acceptance));
    assert.ok(Array.isArray(item.blockedBy));
  }
});

test('titles and content are distinct and the five expected workstreams are used', () => {
  assert.equal(new Set(workItems.map((item) => item.title.toLowerCase())).size, 50);
  assert.equal(new Set(workItems.map((item) => item.summary)).size, 50);
  assert.equal(new Set(workItems.map((item) => item.notes)).size, 50);
  assert.deepEqual([...new Set(workItems.map((item) => item.workstream))], expectedWorkstreams);
  for (const item of workItems) {
    const minimumTitleLength = item.kind === 'Epic' ? 20 : 25;
    assert.ok(item.title.length >= minimumTitleLength && item.title.length <= 120, `Title #${item.number}`);
    assert.ok(item.summary.length >= 100, `Summary #${item.number}`);
    assert.ok(item.notes.length >= 80, `Progress note #${item.number}`);
    assert.doesNotMatch(item.title, /placeholder|todo|sample issue|work item \d+|lorem ipsum/i);
  }
});

test('native types are Task, Bug, or Feature with eight bugs and real task/spike variety', () => {
  const typeByKind = { Epic: 'Feature', Story: 'Feature', Task: 'Task', Bug: 'Bug', Spike: 'Task' };
  for (const item of workItems) {
    assert.ok(Object.hasOwn(typeByKind, item.kind), `Kind #${item.number}`);
    assert.equal(item.type, typeByKind[item.kind], `Type #${item.number}`);
  }
  assert.equal(workItems.filter((item) => item.type === 'Bug').length, 8);
  assert.equal(workItems.filter((item) => item.kind === 'Spike').length, 5);
  assert.ok(workItems.some((item) => item.kind === 'Task'));
  assert.ok(workItems.some((item) => item.kind === 'Story'));
});

test('the first five counted issues are zero-point open Feature epics', () => {
  const epics = workItems.filter((item) => item.kind === 'Epic');
  assert.equal(epics.length, 5);
  assert.deepEqual(epics, workItems.slice(0, 5));
  assert.deepEqual(epics.map((item) => item.title), expectedWorkstreams.map((name) => `[EPIC] ${name}`));
  for (const epic of epics) {
    assert.equal(epic.type, 'Feature');
    assert.equal(epic.parent, null);
    assert.equal(epic.estimate, 0);
    assert.equal(epic.sprint, false);
    assert.equal(epic.status, 'In progress');
    assert.equal(epic.doneDate, null);
    assert.equal(epic.state, 'open');
    assert.equal(epic.stateReason, null);
  }
});

test('each epic owns exactly its assigned nine contiguous child issues', () => {
  for (let parent = 1; parent <= 5; parent += 1) {
    const children = childrenOf(parent);
    assert.equal(children.length, 9);
    assert.deepEqual(children.map((item) => item.number),
      Array.from({ length: 9 }, (_, slot) => 6 + (parent - 1) * 9 + slot));
    assert.ok(children.every((item) => item.workstream === byNumber.get(parent).workstream));
    assert.ok(children.every((item) => item.kind !== 'Epic'));
  }
  assert.equal(workItems.filter((item) => item.parent !== null).length, 45);
});

test('every group follows the exact nine-slot status, estimate, and sprint pattern', () => {
  for (let parent = 1; parent <= 5; parent += 1) {
    const children = childrenOf(parent);
    assert.deepEqual(children.map((item) => item.status), expectedSlotStatuses);
    assert.deepEqual(children.map((item) => item.estimate), expectedSlotEstimates);
    assert.deepEqual(children.map((item) => item.sprint), [true, true, true, true, true, true, false, false, false]);
  }
});

test('all six stages have the exact overall counts including the five active epics', () => {
  const counts = Object.fromEntries(expectedStatuses.map((status) => [status, workItems.filter((item) => item.status === status).length]));
  assert.deepEqual(counts, expectedCounts);
  assert.equal(workItems.filter((item) => item.status === 'In progress' && item.kind !== 'Epic').length, 5);
});

test('the sprint contains thirty issues, 100 points, 40 completed, 60 remaining, and 10 blocked points', () => {
  const sprint = workItems.filter((item) => item.sprint);
  const done = sprint.filter((item) => item.status === 'Done');
  const blocked = sprint.filter((item) => item.status === 'Blocked');
  assert.equal(sprint.length, 30);
  assert.equal(sumPoints(sprint), 100);
  assert.equal(sumPoints(sprint), config.sprint.baselinePoints);
  assert.equal(done.length, 10);
  assert.equal(sumPoints(done), 40);
  assert.equal(sumPoints(sprint.filter((item) => item.status !== 'Done')), 60);
  assert.equal(blocked.length, 5);
  assert.equal(sumPoints(blocked), 10);
});

test('epics add no estimated points and the non-sprint child scope stays separate', () => {
  const epics = workItems.filter((item) => item.kind === 'Epic');
  const children = workItems.filter((item) => item.kind !== 'Epic');
  assert.equal(sumPoints(epics), 0);
  assert.equal(sumPoints(children), 180);
  assert.equal(sumPoints(workItems), 180);
  assert.equal(sumPoints(children.filter((item) => !item.sprint)), 80);
  for (let parent = 1; parent <= 5; parent += 1) {
    assert.equal(sumPoints(childrenOf(parent)), 36);
    assert.equal(sumPoints(childrenOf(parent).filter((item) => item.sprint)), 20);
  }
});

test('summarize returns the exact requested default metrics from the catalogue', () => {
  assert.deepEqual(summarize(), {
    total: 50,
    byStatus: expectedCounts,
    sprintItems: 30,
    sprintPoints: 100,
    completedSprintPoints: 40,
    remainingSprintPoints: 60,
    epics: 5,
    children: 45,
    dependencyEdges: 15,
  });
  assert.deepEqual(summarize(workItems), summarize());
});

test('summarize handles empty input without substituting baseline points or omitting stages', () => {
  assert.deepEqual(summarize([]), {
    total: 0,
    byStatus: Object.fromEntries(expectedStatuses.map((status) => [status, 0])),
    sprintItems: 0,
    sprintPoints: 0,
    completedSprintPoints: 0,
    remainingSprintPoints: 0,
    epics: 0,
    children: 0,
    dependencyEdges: 0,
  });
});

test('summarize uses supplied values without mutation and never counts estimated epics', () => {
  const supplied = structuredClone([workItems[0], ...childrenOf(1).slice(0, 6)]);
  supplied[0].sprint = true;
  supplied[0].estimate = 999;
  supplied[1].estimate = 7;
  const before = structuredClone(supplied);
  assert.deepEqual(summarize(supplied), {
    total: 7,
    byStatus: { Backlog: 0, Ready: 1, 'In progress': 2, 'In review': 1, Blocked: 1, Done: 2 },
    sprintItems: 6,
    sprintPoints: 22,
    completedSprintPoints: 10,
    remainingSprintPoints: 12,
    epics: 1,
    children: 6,
    dependencyEdges: 3,
  });
  assert.deepEqual(supplied, before);
});

test('all planned dates are real ordered calendar days within the launch horizon', () => {
  for (const item of workItems) {
    assertCalendarDay(item.start, `Start #${item.number}`);
    assertCalendarDay(item.target, `Target #${item.number}`);
    assert.ok(item.start >= '2026-11-02', `Earliest start #${item.number}`);
    assert.ok(item.start <= item.target, `Date order #${item.number}`);
    assert.ok(item.target <= '2026-11-27', `Launch horizon #${item.number}`);
    if (item.parent !== null) {
      const parent = byNumber.get(item.parent);
      assert.ok(parent.start <= item.start && item.target <= parent.target, `Epic date envelope #${item.number}`);
    }
  }
});

test('sprint dates stay inside the sprint while follow-on children start after it', () => {
  for (const item of workItems) {
    if (item.sprint) {
      assert.ok(item.start >= config.sprint.start, `Sprint start #${item.number}`);
      assert.ok(item.target <= config.sprint.end, `Sprint end #${item.number}`);
    } else if (item.kind !== 'Epic') {
      assert.ok(item.start > config.sprint.end, `Follow-on start #${item.number}`);
    }
    if (item.status === 'In progress' || item.status === 'In review' || item.status === 'Blocked') {
      assert.ok(item.start <= config.sprint.asOf, `Active as-of start #${item.number}`);
    }
  }
});

test('only the two Done children per group have the exact declared simulated completion days', () => {
  for (let parent = 1; parent <= 5; parent += 1) {
    const children = childrenOf(parent);
    assert.deepEqual(children.slice(0, 2).map((item) => item.doneDate), expectedDoneDates[parent - 1]);
  }
  for (const item of workItems) {
    if (item.status === 'Done') {
      assertCalendarDay(item.doneDate, `Done day #${item.number}`);
      assert.ok(item.start <= item.doneDate && item.doneDate <= item.target, `Completion window #${item.number}`);
      assert.ok(item.doneDate <= config.sprint.asOf, `No future completion #${item.number}`);
    } else {
      assert.equal(item.doneDate, null, `Unfinished #${item.number}`);
    }
  }
});

test('simulated chronological totals reach forty points on November 9 with no future completions', () => {
  const timeline = [
    ['2026-11-02', 5],
    ['2026-11-03', 13],
    ['2026-11-04', 21],
    ['2026-11-05', 29],
    ['2026-11-06', 37],
    ['2026-11-09', 40],
  ];
  const completed = workItems.filter((item) => item.status === 'Done');
  assert.deepEqual([...new Set(completed.map((item) => item.doneDate))].sort(), timeline.map(([day]) => day));
  let previous = 0;
  for (const [day, expected] of timeline) {
    const cumulative = sumPoints(completed.filter((item) => item.doneDate <= day));
    assert.equal(cumulative, expected, day);
    assert.ok(cumulative >= previous && cumulative <= 40);
    previous = cumulative;
  }
  assert.equal(sumPoints(completed.filter((item) => item.doneDate > config.sprint.asOf)), 0);
});

test('native state seeds are closed/completed only for the ten Done items', () => {
  for (const item of workItems) {
    assert.equal(item.state, item.status === 'Done' ? 'closed' : 'open', `State #${item.number}`);
    assert.equal(item.stateReason, item.status === 'Done' ? 'completed' : null, `State reason #${item.number}`);
    assert.ok(!Object.hasOwn(item, 'closedAt'), 'Simulated dates must not impersonate native timestamps');
    assert.ok(!Object.hasOwn(item, 'assignee'), 'Fictional roles must not impersonate real assignees');
  }
  assert.equal(workItems.filter((item) => item.state === 'closed').length, 10);
});

test('all parent and dependency references are valid unique integer links with no self edges', () => {
  let edges = 0;
  for (const item of workItems) {
    if (item.parent !== null) {
      assert.ok(Number.isInteger(item.parent));
      assert.notEqual(item.parent, item.number);
      assert.equal(byNumber.get(item.parent)?.kind, 'Epic');
    }
    assert.equal(new Set(item.blockedBy).size, item.blockedBy.length);
    for (const dependency of item.blockedBy) {
      assert.ok(Number.isInteger(dependency));
      assert.ok(byNumber.has(dependency));
      assert.notEqual(dependency, item.number);
      assert.equal(byNumber.get(dependency).parent, item.parent);
      edges += 1;
    }
  }
  assert.equal(edges, 15);
});

test('the dependency graph is a DAG and the graph assertion detects a cycle fixture', () => {
  assertAcyclic(workItems);
  assert.throws(() => assertAcyclic([
    { number: 1, blockedBy: [2] },
    { number: 2, blockedBy: [1] },
  ]), /Dependency cycle/);
});

test('all five blocked slots have genuine unresolved prerequisites and resolved chains remain visible', () => {
  for (let parent = 1; parent <= 5; parent += 1) {
    const children = childrenOf(parent);
    const [doneOne, doneTwo, review, active, , blocked] = children;
    assert.deepEqual(blocked.blockedBy, [active.number]);
    assert.equal(active.status, 'In progress');
    assert.equal(active.state, 'open');
    assert.deepEqual(active.blockedBy, [doneOne.number]);
    assert.deepEqual(review.blockedBy, [doneTwo.number]);
  }
  for (const item of workItems) {
    if (item.status === 'Blocked') {
      assert.ok(item.blockedBy.some((number) => byNumber.get(number).status !== 'Done'));
    } else {
      assert.ok(item.blockedBy.every((number) => byNumber.get(number).status === 'Done'));
    }
  }
});

test('every child has three or four substantial specific acceptance criteria and a fictional role', () => {
  const allCriteria = [];
  for (const item of workItems) {
    assert.ok(item.acceptance.length >= 3 && item.acceptance.length <= 4, `Criteria count #${item.number}`);
    assert.equal(new Set(item.acceptance).size, item.acceptance.length);
    for (const criterion of item.acceptance) {
      assert.equal(typeof criterion, 'string');
      assert.ok(criterion.trim().length >= 60, `Criterion #${item.number}: ${criterion}`);
      assert.doesNotMatch(criterion, /^(works|done|tests pass|acceptance criterion|todo)\b/i);
      assert.doesNotMatch(criterion, /lorem ipsum|tbd|placeholder/i);
      allCriteria.push(criterion);
    }
    assert.ok(item.role.length >= 15, `Role #${item.number}`);
    assert.doesNotMatch(item.role, /@|https?:|github\.com/i);
    assert.ok(item.role.split(' ').length >= 2);
  }
  assert.equal(new Set(allCriteria).size, allCriteria.length, 'Criteria must be scenario-specific, not copied filler');
});

test('issueBody generates one stable ownership marker and does not mutate the exported data', () => {
  const before = structuredClone({ config, workItems });
  for (const item of workItems) {
    const body = issueBody(item);
    assert.equal(body, issueBody(item));
    assert.ok(body.startsWith(`<!-- citypulse-demo:item:${item.number} -->\n`));
    assert.equal((body.match(/<!-- citypulse-demo:item:\d+ -->/g) ?? []).length, 1);
    assert.ok(body.length > 1_500, `Readable body #${item.number}`);
    assert.ok(body.endsWith('\n') && !body.endsWith('\n\n'));
  }
  assert.deepEqual({ config, workItems }, before);
});

test('every body conspicuously discloses seeded fiction and the real native timestamp limitation', () => {
  for (const item of workItems) {
    const body = issueBody(item);
    assert.match(body, /> \*\*SEEDED \/ FICTIONAL DELIVERY DEMO - no application is implemented\.\*\*/);
    assert.match(body, /not proof that an app was built, tested, or deployed/);
    assert.match(body, /Real native timestamps start at creation in GitHub/);
    assert.match(body, /explicitly simulated history, not real GitHub closedAt timestamps/);
    assert.match(body, /declarations to provision, not evidence that native links already exist/);
    assert.doesNotMatch(body, /tests passed|all tests pass|deployed successfully|https?:\/\/[^\s)]+\.(?:azurewebsites\.net|netlify\.app|vercel\.app)/i);
  }
});

test('body metadata includes delivery values and hierarchy links list all nine children for each epic', () => {
  for (const item of workItems) {
    const body = issueBody(item);
    assert.ok(body.includes(`## Summary\n${item.summary}`));
    assert.ok(body.includes('| Field | Declared demo value |\n| --- | --- |'));
    const fields = [
      ['Native issue type', item.type], ['Delivery kind', item.kind], ['Seeded project status', item.status],
      ['Priority', item.priority], ['Team', item.team], ['Workstream', item.workstream], ['Risk', item.risk],
      ['Illustrative start', item.start], ['Illustrative target', item.target], ['Scenario as of', '2026-11-09'],
    ];
    for (const [field, value] of fields) assert.ok(body.includes(`| ${field} | ${value} |`), `#${item.number} ${field}`);
    assert.ok(body.includes(`| Estimate | ${item.estimate} points`));
    assert.ok(body.includes(`| Sprint | ${item.sprint ? config.sprint.title : 'Not in Sprint 1'} |`));
    if (item.kind === 'Epic') {
      const list = body.split('\n').filter((line) => /^\d+\. \[#\d+\]/.test(line));
      assert.deepEqual(list, childrenOf(item.number).map((child, index) =>
        `${index + 1}. [#${child.number}](${issueUrl(child.number)}) - ${child.title}`));
      assert.match(body, /one of the 50 counted issues/);
      assert.match(body, /zero-point estimate prevents double-counting/);
    } else {
      assert.ok(body.includes(`Parent epic: [#${item.parent}](${issueUrl(item.parent)}).`));
    }
  }
});

test('acceptance checkboxes are checked if and only if the item is seeded Done', () => {
  for (const item of workItems) {
    const body = issueBody(item);
    const lines = body.split('\n').filter((line) => /^- \[[ x]\] /.test(line));
    assert.deepEqual(lines, item.acceptance.map((criterion) => `- [${item.status === 'Done' ? 'x' : ' '}] ${criterion}`));
    assert.equal((body.match(/^- \[x\] /gm) ?? []).length, item.status === 'Done' ? item.acceptance.length : 0);
  }
});

test('dependency bodies link to every declared issue and distinguish seeded resolution from open blockers', () => {
  for (const item of workItems) {
    const body = issueBody(item);
    const lines = body.split('\n').filter((line) => line.startsWith('- Depends on '));
    assert.equal(lines.length, item.blockedBy.length);
    if (item.blockedBy.length === 0) assert.ok(body.includes('No declared blocked-by dependencies.'));
    item.blockedBy.forEach((number, index) => {
      const dependency = byNumber.get(number);
      assert.ok(lines[index].includes(`[#${number}](${issueUrl(number)})`));
      assert.ok(lines[index].includes(dependency.title));
      assert.ok(lines[index].includes(dependency.status === 'Done'
        ? '(resolved in the seeded scenario: Done)'
        : `(unresolved in the seeded scenario: ${dependency.status})`));
    });
  }
});

test('bodies separate fictional roles from the real actor and preserve a scenario-specific progress note', () => {
  for (const item of workItems) {
    const body = issueBody(item);
    assert.ok(body.includes(`Scenario role: **${item.role}** (fictional role, not a GitHub username).`));
    assert.match(body, /only the authenticated real actor or intentionally leave this issue unassigned/);
    assert.match(body, /A fictional role is not a real assignee/);
    assert.ok(body.includes(`## Scenario-specific progress note\n${item.notes}\n`));
    assert.doesNotMatch(body, /@[a-z\d][a-z\d-]*/i);
  }
});

test('only Done bodies declare an explicitly simulated completion day, never a native closure date', () => {
  for (const item of workItems) {
    const body = issueBody(item);
    if (item.status === 'Done') {
      assert.ok(body.includes(`| Declared illustrative completion day | ${item.doneDate} (simulated; not a real GitHub closedAt) |`));
      assert.match(body, /\| Declared native state \| closed \/ completed \|/);
      assert.ok(item.doneDate <= '2026-11-09');
    } else {
      assert.ok(body.includes('| Declared illustrative completion day | None; this item is not Done |'));
      assert.match(body, /\| Declared native state \| open \|/);
    }
  }
});
