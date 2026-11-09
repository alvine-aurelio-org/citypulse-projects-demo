import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { config, workItems, summarize } from '../demo/catalog.mjs';
import { buildReports, findStaleReports } from '../lib/reporting.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const files = [];
function walk(folder) {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    if (['.git', 'node_modules', '.demo-cache'].includes(entry.name)) continue;
    const path = join(folder, entry.name);
    if (entry.isDirectory()) walk(path);
    else files.push(path);
  }
}
walk(root);
const data = summarize();
assert.equal(data.total, 50);
assert.equal(data.sprintPoints, config.sprint.baselinePoints);
assert.equal(data.remainingSprintPoints, 60);
assert.equal(workItems.filter((item) => item.type === 'Bug').length, 8);
for (const path of files) {
  const text = readFileSync(path, 'utf8').replaceAll('\r\n', '\n');
  assert.ok(text.endsWith('\n') && !text.endsWith('\n\n'), `${relative(root, path)}: one final newline required`);
  assert.doesNotMatch(text, /[ \t]+$/m, `${relative(root, path)}: trailing whitespace`);
  if (path.endsWith('.mjs')) {
    const result = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
    assert.equal(result.status, 0, `${relative(root, path)}: ${result.stderr}`);
  }
}
const expectedReports = buildReports();
const persistedReports = Object.fromEntries(Object.keys(expectedReports)
  .map((path) => [path, readFileSync(join(root, path), 'utf8')]));
const stale = findStaleReports(persistedReports, expectedReports);
assert.deepEqual(stale, [], `Stale or missing reports: ${JSON.stringify(stale)}`);
for (const name of ['README.md', 'docs/demo-guide.md', 'docs/capabilities.md']) {
  const text = readFileSync(join(root, name), 'utf8');
  assert.match(text, /fictional/i, `${name}: disclose fictional delivery`);
  assert.match(text, /50/);
  assert.match(text, /sprint/i);
}
console.log(`PASS: ${files.length} files, exactly 50 issues, 100 sprint points, deterministic reports and source hygiene.`);
