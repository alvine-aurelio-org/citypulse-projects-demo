import { lstat, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { buildReports, findStaleReports, REPORT_PATHS } from '../lib/reporting.mjs';

const root = new URL('../', import.meta.url);
const directory = new URL('reports', root);

async function statIfPresent(url) {
  try {
    return await lstat(url);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function main(args) {
  if (args.length > 1 || (args.length === 1 && args[0] !== '--check')) {
    throw new Error('Usage: node tools/render-reports.mjs [--check]');
  }
  const check = args[0] === '--check';
  const expected = buildReports();
  // Refuse directory junctions/symlinks and file symlinks before reading or writing.
  const directoryStat = await statIfPresent(directory);
  if (directoryStat && (directoryStat.isSymbolicLink() || !directoryStat.isDirectory())) {
    throw new Error('Reports directory must be a real directory, not a symlink or junction');
  }
  const existing = new Map();
  for (const path of REPORT_PATHS) {
    const url = new URL(path, root);
    const stat = await statIfPresent(url);
    if (stat && (stat.isSymbolicLink() || !stat.isFile())) {
      throw new Error(`Report must be a regular file, not a symlink: ${path}`);
    }
    existing.set(path, { url, stat });
  }
  if (check) {
    const persisted = {};
    for (const [path, { url, stat }] of existing) {
      if (stat) persisted[path] = await readFile(url, 'utf8');
    }
    const differences = findStaleReports(persisted, expected);
    if (differences.length > 0) {
      for (const { path, reason } of differences) console.error(`${reason}: ${path}`);
      process.exitCode = 1;
      return;
    }
    console.log(`Reports are current (${REPORT_PATHS.length} files; CRLF normalized).`);
    return;
  }
  if (!directoryStat) await mkdir(directory);
  for (const [path, { url }] of existing) {
    // Both the target and its contents come exclusively from the fixed allowlist.
    await writeFile(fileURLToPath(url), expected[path], 'utf8');
    console.log(`Rendered ${path}`);
  }
}

try {
  await main(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
