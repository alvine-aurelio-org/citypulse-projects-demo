import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { config, workItems } from '../demo/catalog.mjs';
import { gh, rest, complete, ownedIssueMap, repository, projectMarker } from '../lib/github.mjs';
import { assigneesFor, milestoneTitle, issueLabels, fieldValuesFor, viewConfigurationFor, main } from '../tools/provision-demo.mjs';

test('provisioning is bound to the single requested demo repository', () => {
  assert.equal(repository, 'alvine-aurelio-org/citypulse-projects-demo');
  assert.match(projectMarker, /citypulse-demo/);
  assert.throws(() => rest('POST', 'repos/another-org/another-repo/issues', {}), /Unapproved API route/);
  assert.throws(() => rest('POST', 'orgs/alvine-aurelio-org/repos', {}), /Unapproved API route/);
  assert.throws(() => rest('GET', 'orgs/another-org'), /Unapproved API route/);
});

test('writes need an explicit exact --apply and read-only verification accepts no write flag', () => {
  for (const mode of ['issues', 'project']) {
    assert.throws(() => main([mode]), /explicit --apply/);
    assert.throws(() => main([mode, '--force']), /explicit --apply/);
    assert.throws(() => main([mode, '--apply', '--force']), /explicit --apply/);
  }
  assert.throws(() => main(['verify', '--apply']), /read-only/);
  assert.throws(() => main(['delete', '--apply']), /Choose issues/);
});

test('GitHub CLI uses JSON stdin rather than quote-sensitive arguments or token extraction', () => {
  let observed;
  const runner = (command, args, options) => {
    observed = { command, args, options };
    return { status: 0, stdout: '{"ok":true}', stderr: '' };
  };
  const input = { body: 'A "quoted" line\nwith Unicode: \u2014', number: 7 };
  assert.deepEqual(gh(['api', 'graphql', '--input', '-'], input, runner), { ok: true });
  assert.deepEqual(JSON.parse(observed.options.input), input);
  assert.equal(observed.options.encoding, 'utf8');
  assert.ok(!observed.args.some((arg) => arg.includes('gho_') || arg === 'token'));
});

test('CLI errors and malformed data fail instead of implying a successful mutation', () => {
  assert.throws(() => gh([], null, () => ({ status: 1, stderr: 'HTTP 403' })), /HTTP 403/);
  assert.throws(() => gh([], null, () => ({ error: new Error('not installed') })), /not installed/);
  assert.throws(() => gh([], null, () => ({ status: 0, stdout: '<html>error</html>' })), SyntaxError);
  assert.equal(gh([], undefined, () => ({ status: 0, stdout: '' })), null);
});

test('GraphQL connections must be complete, unredacted, and count-matched', () => {
  const connection = { nodes: [{ id: 'a' }], totalCount: 1, pageInfo: { hasNextPage: false } };
  assert.deepEqual(complete(connection, 'test'), [{ id: 'a' }]);
  assert.throws(() => complete({ ...connection, pageInfo: { hasNextPage: true } }, 'test'), /incomplete pagination/);
  assert.throws(() => complete({ ...connection, totalCount: 2 }, 'test'), /count mismatch/);
  assert.throws(() => complete({ ...connection, nodes: [null] }, 'test'), /redacted/);
  assert.throws(() => complete(null, 'test'), /missing connection/);
});

test('native ownership markers and exact issue numbers are required', () => {
  const issue = { number: 1, body: '<!-- citypulse-demo:item:1 -->' };
  assert.equal(ownedIssueMap([issue]).get(1), issue);
  assert.throws(() => ownedIssueMap([{ number: 1, body: 'unowned' }]), /marker/);
  assert.throws(() => ownedIssueMap([{ ...issue, number: 2 }]), /differs/);
  assert.throws(() => ownedIssueMap([issue, issue]), /Duplicate/);
  assert.throws(() => ownedIssueMap([{ number: 51, body: '<!-- citypulse-demo:item:51 -->' }]), /scope/);
  assert.equal(ownedIssueMap([{ number: 51, pull_request: {}, body: '' }]).size, 0);
});

test('only actual operator accounts are assigned, and Ready and Backlog stay unassigned', () => {
  assert.equal(workItems.filter((item) => assigneesFor(item).length).length, 30);
  for (const item of workItems) {
    assert.deepEqual(assigneesFor(item), ['Ready', 'Backlog'].includes(item.status) ? [] : ['alvinea28']);
    assert.deepEqual(assigneesFor(item, 'verified-actor'), ['Ready', 'Backlog'].includes(item.status) ? [] : ['verified-actor']);
  }
});

test('all sprint issues use only the beta milestone and every issue has a defined release horizon', () => {
  for (const item of workItems) {
    assert.ok(config.milestones.some((milestone) => milestone.title === milestoneTitle(item)));
    if (item.sprint) assert.equal(milestoneTitle(item), 'Citizen beta');
  }
});

test('labels are deliberate and exactly 30 issues have the single-sprint label', () => {
  assert.equal(workItems.filter((item) => issueLabels(item).includes('sprint-1')).length, 30);
  assert.equal(workItems.filter((item) => issueLabels(item).includes('epic')).length, 5);
  assert.equal(workItems.filter((item) => issueLabels(item).includes('blocked')).length, 5);
  assert.equal(workItems.filter((item) => issueLabels(item).includes('bug')).length, 8);
  for (const item of workItems) assert.equal(new Set(issueLabels(item)).size, issueLabels(item).length);
});

function mockFields() {
  const result = new Map([
    ['Status', config.statuses], ['Priority', config.priorities], ['Team', config.teams],
    ['Risk', config.risks], ['Workstream', workItems.slice(0, 5).map((item) => ({ name: item.workstream }))],
  ].map(([name, options]) => [name, { id: name, options: options.map((option) => ({ ...option, id: option.name })) }]));
  for (const name of ['Estimate', 'Start date', 'Target date']) result.set(name, { id: name });
  result.set('Sprint', { id: 'Sprint', configuration: {
    iterations: [{ id: 'sprint-1', title: config.sprint.title }], completedIterations: [],
  } });
  return result;
}

test('field provisioning never adds epics or uncommitted children to the sprint', () => {
  const fields = mockFields();
  for (const item of workItems) {
    const values = new Map(fieldValuesFor(item, fields));
    assert.equal(values.size, item.sprint ? 9 : 8);
    assert.equal(values.has('Sprint'), item.sprint);
    assert.deepEqual(values.get('Estimate'), { number: item.estimate });
    assert.deepEqual(values.get('Status'), { singleSelectOptionId: item.status });
    if (item.sprint) assert.deepEqual(values.get('Sprint'), { iterationId: 'sprint-1' });
  }
});

test('missing native options fail instead of selecting the first available value', () => {
  const fields = mockFields();
  fields.get('Priority').options = [];
  assert.throws(() => fieldValuesFor(workItems[0], fields), /Missing Priority/);
});

test('roadmap creation omits unsupported visible-field configuration', () => {
  const fields = mockFields();
  assert.deepEqual(viewConfigurationFor('ROADMAP_LAYOUT', fields), {});
  assert.ok(viewConfigurationFor('TABLE_LAYOUT', fields).configuration.visibleFieldIds.includes('Estimate'));
  assert.ok(viewConfigurationFor('BOARD_LAYOUT', fields).configuration.visibleFieldIds.includes('Status'));
});

test('no destructive operations, credential reads, or global context changes are implemented', () => {
  const source = readFileSync(new URL('../tools/provision-demo.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /rest\('DELETE'|deleteProjectV2|deleteIssue|replace_parent:\s*true|auth token|git reset|git push.*force|az account set/);
  assert.match(source, /verifiedContext/);
  assert.match(source, /--apply/);
});
