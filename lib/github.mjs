import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { config } from '../demo/catalog.mjs';

export const repository = `${config.owner}/${config.repo}`;
export const apiVersion = '2026-03-10';
export const projectMarker = '<!-- citypulse-demo:project:v1 -->';

export function gh(args, input, runner = spawnSync) {
  const result = runner(process.platform === 'win32' ? 'gh.exe' : 'gh', args, {
    encoding: 'utf8',
    input: input === undefined ? undefined : JSON.stringify(input),
    maxBuffer: 16 * 1024 * 1024,
    windowsHide: true,
    timeout: 120_000,
  });
  if (result.error) throw new Error(`GitHub CLI could not run: ${result.error.message}`);
  if (result.status !== 0) {
    throw new Error(`GitHub CLI failed (${result.status}): ${(result.stderr ?? '').trim()}`);
  }
  const text = (result.stdout ?? '').trim();
  return text === '' ? null : JSON.parse(text);
}

export function rest(method, endpoint, body) {
  assert.ok(endpoint.startsWith(`repos/${repository}/`) || endpoint === `repos/${repository}`
    || endpoint === 'user' || endpoint === `orgs/${config.owner}`
    || endpoint === `user/memberships/orgs/${config.owner}`
    || endpoint === `orgs/${config.owner}/issue-types`, `Unapproved API route: ${endpoint}`);
  const args = ['api', '--method', method, endpoint,
    '-H', 'Accept: application/vnd.github+json', '-H', `X-GitHub-Api-Version: ${apiVersion}`];
  if (body !== undefined) args.push('--input', '-');
  return gh(args, body);
}

export function list(endpoint) {
  const results = [];
  for (let page = 1; page <= 100; page += 1) {
    const join = endpoint.includes('?') ? '&' : '?';
    const batch = rest('GET', `${endpoint}${join}per_page=100&page=${page}`);
    assert.ok(Array.isArray(batch), `Expected a paginated array: ${endpoint}`);
    results.push(...batch);
    if (batch.length < 100) return results;
  }
  throw new Error(`Pagination bound exceeded: ${endpoint}`);
}

export function graphql(query, variables = {}) {
  const result = gh(['api', 'graphql', '--input', '-'], { query, variables });
  if (result?.errors?.length) throw new Error(`GraphQL: ${JSON.stringify(result.errors)}`);
  assert.ok(result?.data, 'GraphQL returned no data');
  return result.data;
}

export function complete(connection, label) {
  assert.ok(connection && Array.isArray(connection.nodes), `${label}: missing connection`);
  assert.equal(connection.pageInfo?.hasNextPage, false, `${label}: incomplete pagination`);
  assert.ok(connection.nodes.every(Boolean), `${label}: inaccessible or redacted record`);
  if (connection.totalCount !== undefined) {
    assert.equal(connection.nodes.length, connection.totalCount, `${label}: count mismatch`);
  }
  return connection.nodes;
}

export function verifiedContext() {
  const actor = rest('GET', 'user');
  assert.equal(actor.login, 'alvinea28', 'Unexpected authenticated operator; do not switch accounts automatically');
  const membership = rest('GET', `user/memberships/orgs/${config.owner}`);
  assert.equal(membership.organization?.login, config.owner);
  assert.equal(membership.state, 'active');
  const repo = rest('GET', `repos/${repository}`);
  assert.equal(repo.full_name, repository);
  assert.equal(repo.private, true, 'Keep this demo private unless its owner explicitly changes visibility');
  assert.ok(repo.permissions?.admin || repo.permissions?.maintain || repo.permissions?.push);
  return { actor, repo };
}

export function findProject() {
  const result = graphql(`query($owner:String!){organization(login:$owner){
    id projectsV2(first:100){totalCount pageInfo{hasNextPage} nodes{
      id number title url readme public
      repositories(first:100){nodes{nameWithOwner} pageInfo{hasNextPage}}
    }}
  }}`, { owner: config.owner });
  assert.ok(result.organization?.id, 'Expected organization is inaccessible');
  const projects = complete(result.organization.projectsV2, 'Organization Projects');
  const matches = projects.filter((project) => {
    const linked = complete(project.repositories, `Project ${project.number} repositories`)
      .some((repo) => repo.nameWithOwner === repository);
    return project.readme?.includes(projectMarker) || (project.title === config.projectTitle && linked);
  });
  assert.ok(matches.length <= 1, 'Multiple matching demo Projects; reconcile rather than create another');
  if (matches[0]) assert.equal(matches[0].public, false, 'The intended demo Project must remain private');
  return { organizationId: result.organization.id, project: matches[0] ?? null };
}

export const fieldFragments = `
  ... on ProjectV2Field {id name dataType}
  ... on ProjectV2SingleSelectField {id name dataType options{id name color description}}
  ... on ProjectV2IterationField {id name dataType configuration{
    iterations{id title startDate duration} completedIterations{id title startDate duration}
  }}
`;

export function readProject(id, includeItems = false) {
  const data = graphql(`query($id:ID!){node(id:$id){... on ProjectV2{
    id number title url readme public
    repositories(first:100){totalCount nodes{nameWithOwner} pageInfo{hasNextPage}}
    fields(first:100){totalCount nodes{${fieldFragments}} pageInfo{hasNextPage}}
    views(first:100){totalCount pageInfo{hasNextPage} nodes{
      id number name layout filter
      groupByFields(first:20){nodes{${fieldFragments}} pageInfo{hasNextPage}}
      verticalGroupByFields(first:20){nodes{${fieldFragments}} pageInfo{hasNextPage}}
      configuration{visibleFields(first:30){nodes{${fieldFragments}} pageInfo{hasNextPage}}}
    }}
    workflows(first:100){totalCount nodes{id number name enabled} pageInfo{hasNextPage}}
    statusUpdates(first:100){totalCount nodes{id body status startDate targetDate} pageInfo{hasNextPage}}
    ${includeItems ? `items(first:100){totalCount pageInfo{hasNextPage} nodes{
      id type isArchived content{... on Issue{id number title url state stateReason repository{nameWithOwner}}}
      fieldValues(first:30){pageInfo{hasNextPage} nodes{
        ... on ProjectV2ItemFieldSingleSelectValue{name optionId field{... on ProjectV2SingleSelectField{name}}}
        ... on ProjectV2ItemFieldNumberValue{number field{... on ProjectV2Field{name}}}
        ... on ProjectV2ItemFieldDateValue{date field{... on ProjectV2Field{name}}}
        ... on ProjectV2ItemFieldTextValue{text field{... on ProjectV2Field{name}}}
        ... on ProjectV2ItemFieldIterationValue{title iterationId startDate duration field{... on ProjectV2IterationField{name}}}
      }}
    }}` : ''}
  }}}`, { id });
  assert.equal(data.node?.id, id, 'Project identity mismatch');
  return data.node;
}

export function ownedIssueMap(issues) {
  const map = new Map();
  for (const issue of issues.filter((item) => !item.pull_request)) {
    const matches = [...(issue.body ?? '').matchAll(/<!-- citypulse-demo:item:(\d+) -->/g)];
    assert.equal(matches.length, 1, `Issue #${issue.number} lacks exactly one expected demo marker`);
    const number = Number(matches[0][1]);
    assert.equal(issue.number, number, `Stable issue number differs for marker ${number}`);
    assert.ok(number >= 1 && number <= 50, 'Issue marker outside the approved 50-item scope');
    assert.ok(!map.has(number), `Duplicate demo marker ${number}`);
    map.set(number, issue);
  }
  return map;
}

export function mutation(name, type, input, selection) {
  return graphql(`mutation($input:${type}!){${name}(input:$input){${selection}}}`, { input })[name];
}
