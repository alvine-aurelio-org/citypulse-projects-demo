import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { config, workItems, issueBody, summarize } from '../demo/catalog.mjs';
import {
  repository, projectMarker, rest, list, graphql, complete, verifiedContext,
  findProject, readProject, ownedIssueMap, mutation, fieldFragments,
} from '../lib/github.mjs';

const base = `repos/${repository}`;

export function issueLabels(item) {
  const labels = ['demo', item.kind.toLowerCase(),
    `area:${item.workstream.toLowerCase().replaceAll(' ', '-')}`];
  if (item.sprint) labels.push('sprint-1');
  if (item.status === 'Blocked') labels.push('blocked');
  if (item.risk === 'High') labels.push('risk:high');
  return labels;
}

export function milestoneTitle(item) {
  if (item.sprint) return 'Citizen beta';
  return item.target <= '2026-11-20' ? 'Operations readiness' : 'Public launch';
}

export function assigneesFor(item, actor = 'alvinea28') {
  return ['Backlog', 'Ready'].includes(item.status) ? [] : [actor];
}

function provisionLabels() {
  const names = new Set(workItems.flatMap(issueLabels));
  const existing = new Map(list(`${base}/labels`).map((label) => [label.name, label]));
  for (const name of names) {
    if (existing.has(name)) continue;
    const color = name === 'blocked' || name === 'risk:high' || name === 'bug' ? 'd73a4a'
      : name === 'epic' ? '8250df' : name === 'sprint-1' ? '0969da'
        : name.startsWith('area:') ? '0e8a7a' : '57606a';
    rest('POST', `${base}/labels`, { name, color, description: `CityPulse fictional demo: ${name}` });
  }
}

function provisionMilestones() {
  const existing = new Map(list(`${base}/milestones?state=all`).map((item) => [item.title, item]));
  for (const milestone of config.milestones) {
    if (!existing.has(milestone.title)) {
      existing.set(milestone.title, rest('POST', `${base}/milestones`, milestone));
    }
  }
  return existing;
}

export function provisionIssues() {
  const { actor } = verifiedContext();
  provisionLabels();
  const milestones = provisionMilestones();
  const before = list(`${base}/issues?state=all`);
  const existing = ownedIssueMap(before);
  assert.ok(before.every((issue) => !issue.pull_request), 'Provision issues before creating any demo pull requests');
  const highest = Math.max(0, ...existing.keys());
  assert.equal(highest, existing.size, 'The existing issue sequence has gaps; do not create duplicate replacements');
  for (const item of workItems) {
    const payload = {
      title: item.title, body: issueBody(item), type: item.type,
      labels: issueLabels(item), assignees: assigneesFor(item, actor.login),
      milestone: milestones.get(milestoneTitle(item)).number,
    };
    let remote = existing.get(item.number);
    if (!remote) {
      remote = rest('POST', `${base}/issues`, payload);
      assert.equal(remote.number, item.number, 'Unexpected number allocated; stop instead of creating more issues');
      existing.set(item.number, remote);
    } else {
      assert.equal(remote.title, item.title, 'Preserve presenter edits; catalogue title differs');
      assert.equal(remote.type?.name, item.type, `Native type differs for #${item.number}`);
    }
    if (remote.state !== item.state) {
      remote = rest('PATCH', `${base}/issues/${item.number}`, {
        state: item.state, ...(item.state === 'closed' ? { state_reason: 'completed' } : {}),
      });
      existing.set(item.number, remote);
    }
    console.log(`Issue #${item.number}: ${remote.state} / ${item.status}`);
  }
  for (const epic of workItems.filter((item) => item.kind === 'Epic')) {
    const current = new Set(list(`${base}/issues/${epic.number}/sub_issues`).map((issue) => issue.number));
    for (const child of workItems.filter((item) => item.parent === epic.number)) {
      if (!current.has(child.number)) {
        rest('POST', `${base}/issues/${epic.number}/sub_issues`, { sub_issue_id: existing.get(child.number).id });
      }
    }
    console.log(`Epic #${epic.number}: nine native sub-issues reconciled`);
  }
  for (const item of workItems.filter((issue) => issue.blockedBy.length)) {
    const current = new Set(list(`${base}/issues/${item.number}/dependencies/blocked_by`).map((issue) => issue.number));
    for (const blocker of item.blockedBy) {
      if (!current.has(blocker)) {
        rest('POST', `${base}/issues/${item.number}/dependencies/blocked_by`, { issue_id: existing.get(blocker).id });
      }
    }
  }
  console.log('Reconciled exactly 50 issues, 45 sub-issue links, and 15 native dependencies.');
  return existing;
}

function fieldMap(project) {
  return new Map(complete(project.fields, 'Project fields').map((field) => [field.name, field]));
}

export function fieldValuesFor(item, fields) {
  const select = (name, value) => {
    const field = fields.get(name);
    const option = field?.options?.find((candidate) => candidate.name === value);
    assert.ok(option?.id, `Missing ${name} option ${value}`);
    return [field.id, { singleSelectOptionId: option.id }];
  };
  const result = [
    select('Status', item.status), select('Priority', item.priority), select('Team', item.team),
    select('Workstream', item.workstream), select('Risk', item.risk),
    [fields.get('Estimate').id, { number: item.estimate }],
    [fields.get('Start date').id, { date: item.start }],
    [fields.get('Target date').id, { date: item.target }],
  ];
  if (item.sprint) {
    const field = fields.get('Sprint');
    const iterations = [...field.configuration.iterations, ...field.configuration.completedIterations];
    const iteration = iterations.find((entry) => entry.title === config.sprint.title);
    assert.ok(iteration?.id, 'The single expected sprint iteration is absent');
    result.push([field.id, { iterationId: iteration.id }]);
  }
  return result;
}

function provisionFields(project) {
  const fields = fieldMap(project);
  const status = fields.get('Status');
  assert.ok(status?.id, 'Default Status field is absent');
  const aliases = { Backlog: 'Todo', 'In progress': 'In Progress', Done: 'Done' };
  const statusOptions = config.statuses.map((option) => {
    const current = status.options.find((value) => value.name === option.name
      || value.name === aliases[option.name]);
    return { ...option, ...(current ? { id: current.id } : {}) };
  });
  if (JSON.stringify(status.options.map((option) => option.name)) !== JSON.stringify(config.statuses.map((option) => option.name))) {
    mutation('updateProjectV2Field', 'UpdateProjectV2FieldInput',
      { fieldId: status.id, singleSelectOptions: statusOptions }, `projectV2Field{${fieldFragments}}`);
  }
  const workstreams = workItems.slice(0, 5).map((item) => ({
    name: item.workstream, color: 'BLUE', description: `Fictional delivery workstream: ${item.workstream}`,
  }));
  const definitions = [
    { name: 'Priority', dataType: 'SINGLE_SELECT', singleSelectOptions: config.priorities },
    { name: 'Team', dataType: 'SINGLE_SELECT', singleSelectOptions: config.teams },
    { name: 'Workstream', dataType: 'SINGLE_SELECT', singleSelectOptions: workstreams },
    { name: 'Risk', dataType: 'SINGLE_SELECT', singleSelectOptions: config.risks },
    { name: 'Estimate', dataType: 'NUMBER' },
    { name: 'Start date', dataType: 'DATE' },
    { name: 'Target date', dataType: 'DATE' },
    { name: 'Sprint', dataType: 'ITERATION', iterationConfiguration: {
      duration: config.sprint.duration, startDate: config.sprint.start,
      iterations: [{ title: config.sprint.title, startDate: config.sprint.start, duration: config.sprint.duration }],
    } },
  ];
  for (const definition of definitions) {
    if (!fields.has(definition.name)) {
      mutation('createProjectV2Field', 'CreateProjectV2FieldInput',
        { projectId: project.id, ...definition }, `projectV2Field{${fieldFragments}}`);
    }
  }
  return fieldMap(readProject(project.id));
}

export function provisionProject() {
  const { repo } = verifiedContext();
  const issues = ownedIssueMap(list(`${base}/issues?state=all`));
  assert.equal(issues.size, 50, 'Create and reconcile exactly 50 native issues first');
  const found = findProject();
  let project = found.project;
  if (!project) {
    project = mutation('createProjectV2', 'CreateProjectV2Input', {
      ownerId: found.organizationId, repositoryId: repo.node_id, title: config.projectTitle,
    }, 'projectV2{id number title url public}').projectV2;
    console.log(`Created the one linked Project: ${project.url}`);
  }
  const projectReadme = `${projectMarker}\n# CityPulse | Digital Service Launch\n\n` +
    `One repository, exactly **50 real issues**, five epics, seven saved views, one sprint.\n\n` +
    `**[START THE DEMO](https://github.com/${repository})** · ` +
    `[Single-sprint burndown](https://github.com/${repository}/blob/main/reports/sprint-1.md) · ` +
    `[Presenter guide](https://github.com/${repository}/blob/main/docs/demo-guide.md)\n\n` +
    `Sprint 1 - Citizen beta: November 2–13, 2026. **30 issues / 100 points; 40 completed / 60 remaining.**\n\n` +
    `Scenario as of November 9 EOD: **At risk**; 20 points behind the ideal; five blocked issues (10 points).\n\n` +
    `**Fictional delivery demo.** Native issues, links, fields, and states are real. Historical daily completions ` +
    `in the repository burndown are explicitly simulated, not backdated GitHub events or evidence of an implemented application. ` +
    `Team names and scenario roles are fictional; real assignees are actual GitHub accounts.\n`;
  mutation('updateProjectV2', 'UpdateProjectV2Input', {
    projectId: project.id, public: false,
    shortDescription: '50 real issues | 5 epics | 1 sprint | boards, roadmap, workload, dependencies, Insights and burndown',
    readme: projectReadme,
  }, 'projectV2{id number url public}');
  project = readProject(project.id, true);
  const fields = provisionFields(project);
  const currentItems = complete(project.items, 'Project items');
  const itemByNumber = new Map();
  for (const item of currentItems) {
    assert.equal(item.type, 'ISSUE', 'Do not silently remove or ignore unexpected non-issue Project items');
    assert.equal(item.content?.repository.nameWithOwner, repository, 'Foreign repository in the demo Project');
    assert.ok(issues.has(item.content.number), 'Unexpected issue in the demo Project');
    assert.ok(!itemByNumber.has(item.content.number), 'Duplicate Project issue');
    itemByNumber.set(item.content.number, item);
  }
  for (const item of workItems) {
    let projectItem = itemByNumber.get(item.number);
    if (!projectItem) {
      projectItem = mutation('addProjectV2ItemById', 'AddProjectV2ItemByIdInput', {
        projectId: project.id, contentId: issues.get(item.number).node_id,
      }, 'item{id}').item;
    }
    const values = fieldValuesFor(item, fields);
    const variables = {};
    const declarations = [];
    const operations = values.map(([fieldId, value], index) => {
      const key = `v${index}`;
      declarations.push(`$${key}:UpdateProjectV2ItemFieldValueInput!`);
      variables[key] = { projectId: project.id, itemId: projectItem.id, fieldId, value };
      return `${key}:updateProjectV2ItemFieldValue(input:$${key}){projectV2Item{id}}`;
    });
    graphql(`mutation(${declarations.join(',')}){${operations.join('\n')}}`, variables);
    console.log(`Project issue #${item.number}: ${item.status}${item.sprint ? ' / Sprint 1' : ''}`);
  }
  const refreshed = readProject(project.id);
  const views = complete(refreshed.views, 'Project views');
  for (const [index, desired] of config.views.entries()) {
    let view = views.find((entry) => entry.name === desired.name);
    if (!view && index === 0) view = views.find((entry) => entry.name === 'View 1');
    const visibleNames = desired.layout === 'ROADMAP_LAYOUT'
      ? ['Title', 'Status', 'Start date', 'Target date', 'Sub-issues progress']
      : ['Title', 'Assignees', 'Status', 'Priority', 'Estimate', 'Team', 'Sprint', 'Issue type', 'Parent issue', 'Milestone', 'Risk'];
    const configuration = { visibleFieldIds: visibleNames.map((name) => fields.get(name)?.id).filter(Boolean) };
    if (!view) {
      view = mutation('createProjectV2View', 'CreateProjectV2ViewInput', {
        projectId: project.id, name: desired.name, layout: desired.layout, configuration,
      }, 'projectV2View{id number name}').projectV2View;
    }
    mutation('updateProjectV2View', 'UpdateProjectV2ViewInput', {
      viewId: view.id, name: desired.name, layout: desired.layout, filter: desired.filter, configuration,
    }, 'projectV2View{id number name layout filter}');
    console.log(`Saved view ${view.number}: ${desired.name}`);
  }
  const updates = complete(refreshed.statusUpdates, 'Project updates');
  const marker = '<!-- citypulse-demo:status:baseline -->';
  if (!updates.some((update) => update.body?.includes(marker))) {
    mutation('createProjectV2StatusUpdate', 'CreateProjectV2StatusUpdateInput', {
      projectId: project.id, status: 'AT_RISK', startDate: config.sprint.start, targetDate: config.sprint.end,
      body: `${marker}\n## Sprint 1: citizen beta is at risk\n\n` +
        `**Fictional scenario, November 9 EOD.** 30 committed issues / 100 points; ` +
        `10 Done issues / 40 points, 60 points remaining versus the ideal 40.\n\n` +
        `**Risk:** five open prerequisites block five issues (10 points). Review-stage work is not complete.\n\n` +
        `**Mitigation:** finish current integration decisions and review work before pulling new backlog. ` +
        `The five epic roll-ups must not be added again to the sprint estimates.\n\n` +
        `**Next action:** inspect the Risks and blockers view, then the native blocked-by links. ` +
        `Reconfirm beta scope before the November 13 planning gate.\n\n` +
        `[Single-sprint burndown and provenance](https://github.com/${repository}/blob/main/reports/sprint-1.md). ` +
        `Earlier completion days are simulated, not native historical events or real delivery claims.`,
    }, 'statusUpdate{id status startDate targetDate}');
  }
  console.log(`Project ready for UI layout/Insights verification: ${project.url}`);
  return readProject(project.id, true);
}

function readFieldValues(projectItem) {
  const fields = complete(projectItem.fieldValues, `Issue ${projectItem.content.number} field values`);
  return new Map(fields.filter((entry) => entry.field?.name).map((entry) => [entry.field.name,
    entry.name ?? entry.number ?? entry.date ?? entry.text ?? entry.title]));
}

export function verifyLive() {
  const { actor, repo } = verifiedContext();
  const issues = ownedIssueMap(list(`${base}/issues?state=all`));
  assert.equal(issues.size, 50, 'Expected exactly 50 native issues');
  const { project: found } = findProject();
  assert.ok(found?.id, 'The linked demo Project is absent');
  const project = readProject(found.id, true);
  const links = complete(project.repositories, 'Linked repositories');
  assert.deepEqual(links.map((entry) => entry.nameWithOwner), [repository]);
  const fields = fieldMap(project);
  const sprint = fields.get('Sprint');
  const iterations = [...sprint.configuration.iterations, ...sprint.configuration.completedIterations];
  assert.equal(iterations.length, 1, 'Exactly one sprint must be configured');
  assert.deepEqual({ title: iterations[0].title, startDate: iterations[0].startDate, duration: iterations[0].duration },
    { title: config.sprint.title, startDate: config.sprint.start, duration: config.sprint.duration });
  const projectItems = complete(project.items, 'Project items');
  assert.equal(projectItems.length, 50);
  const seen = new Set();
  const byStatus = Object.fromEntries(config.statuses.map((option) => [option.name, 0]));
  let sprintPoints = 0;
  let completedSprintPoints = 0;
  let sprintItems = 0;
  for (const entry of projectItems) {
    assert.equal(entry.type, 'ISSUE');
    assert.equal(entry.isArchived, false);
    assert.equal(entry.content?.repository.nameWithOwner, repository);
    const item = workItems.find((candidate) => candidate.number === entry.content.number);
    assert.ok(item, 'Unknown issue in Project');
    assert.ok(!seen.has(item.number), 'Duplicate issue in Project');
    seen.add(item.number);
    const issue = issues.get(item.number);
    assert.equal(issue.title, item.title);
    assert.equal(issue.type?.name, item.type, `Native type #${item.number}`);
    assert.equal(issue.state, item.state, `Native state #${item.number}`);
    if (item.state === 'closed') assert.equal(issue.state_reason, 'completed');
    assert.equal(issue.milestone?.title, milestoneTitle(item));
    assert.deepEqual(issue.assignees.map((user) => user.login).sort(), assigneesFor(item, actor.login).sort());
    for (const label of issueLabels(item)) assert.ok(issue.labels.some((entry) => entry.name === label));
    const values = readFieldValues(entry);
    for (const [name, expected] of [['Status', item.status], ['Priority', item.priority],
      ['Estimate', item.estimate], ['Team', item.team], ['Workstream', item.workstream],
      ['Risk', item.risk], ['Start date', item.start], ['Target date', item.target]]) {
      assert.equal(values.get(name), expected, `Issue #${item.number} ${name}`);
    }
    assert.equal(values.get('Sprint') ?? null, item.sprint ? config.sprint.title : null);
    byStatus[values.get('Status')] += 1;
    if (values.has('Sprint')) {
      sprintItems += 1;
      sprintPoints += values.get('Estimate');
      if (issue.state === 'closed') completedSprintPoints += values.get('Estimate');
    }
  }
  let subIssueLinks = 0;
  for (const epic of workItems.filter((item) => item.kind === 'Epic')) {
    const children = list(`${base}/issues/${epic.number}/sub_issues`);
    const expected = workItems.filter((item) => item.parent === epic.number).map((item) => item.number);
    assert.deepEqual(children.map((item) => item.number).sort((a, b) => a - b), expected);
    subIssueLinks += children.length;
  }
  let dependencyEdges = 0;
  for (const item of workItems.filter((issue) => issue.blockedBy.length)) {
    const blockers = list(`${base}/issues/${item.number}/dependencies/blocked_by`);
    assert.deepEqual(blockers.map((entry) => entry.number).sort((a, b) => a - b), [...item.blockedBy].sort((a, b) => a - b));
    dependencyEdges += blockers.length;
  }
  const expected = summarize();
  assert.deepEqual(byStatus, expected.byStatus);
  assert.equal(sprintItems, expected.sprintItems);
  assert.equal(sprintPoints, expected.sprintPoints);
  assert.equal(completedSprintPoints, expected.completedSprintPoints);
  const views = complete(project.views, 'Project views');
  assert.equal(views.length, config.views.length);
  for (const desired of config.views) {
    const view = views.find((entry) => entry.name === desired.name);
    assert.ok(view, `Missing saved view ${desired.name}`);
    assert.equal(view.layout, desired.layout);
    assert.equal(view.filter ?? '', desired.filter);
  }
  const updates = complete(project.statusUpdates, 'Project updates');
  assert.ok(updates.some((entry) => entry.status === 'AT_RISK'
    && entry.body?.includes('citypulse-demo:status:baseline')));
  const receipt = {
    verifiedAt: new Date().toISOString(), repository: repo.html_url,
    project: { id: project.id, number: project.number, url: project.url, private: !project.public },
    actor: actor.login, issues: issues.size, projectItems: projectItems.length,
    subIssueLinks, dependencyEdges, byStatus, sprintItems, sprintPoints,
    completedSprintPoints, remainingSprintPoints: sprintPoints - completedSprintPoints,
    views: views.map(({ number, name, layout, filter, groupByFields }) => ({
      number, name, layout, filter, groupBy: complete(groupByFields, `${name} grouping`).map((field) => field.name),
    })),
    workflows: complete(project.workflows, 'Project workflows'),
    reportingProvenance: 'Earlier burndown completion dates are illustrative scenario declarations, not native GitHub event history.',
  };
  console.log(JSON.stringify(receipt, null, 2));
  return receipt;
}

export function main(args = process.argv.slice(2)) {
  const [mode, ...flags] = args;
  assert.ok(['issues', 'project', 'verify'].includes(mode), 'Choose issues, project, or verify');
  if (mode !== 'verify') assert.deepEqual(flags, ['--apply'], 'Mutations require explicit --apply');
  else assert.equal(flags.length, 0, 'Live verification is read-only and accepts no mutation flags');
  if (mode === 'issues') return provisionIssues();
  if (mode === 'project') return provisionProject();
  return verifyLive();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
