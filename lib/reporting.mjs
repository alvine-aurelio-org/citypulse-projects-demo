import { config, workItems } from '../demo/catalog.mjs';

export const REPORT_PATHS = Object.freeze([
  'reports/sprint-1-burndown.svg',
  'reports/sprint-1-burndown.csv',
  'reports/sprint-1.md',
]);

export const HISTORY_NOTICE = 'ILLUSTRATIVE DEMO HISTORY - not native GitHub event history';

const PROVENANCE = `${HISTORY_NOTICE}; simulated completion dates; native closedAt records actual seed time, not backdated delivery; fictional state, no implemented product`;
const DAY_MS = 86_400_000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const STATUSES = new Set(config.statuses.map(({ name }) => name));

function parseDay(value, label) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new TypeError(`${label} must be a YYYY-MM-DD calendar date`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new RangeError(`${label} is not a real calendar date: ${value}`);
  }
  return date;
}

const isWeekday = (date) => date.getUTCDay() !== 0 && date.getUTCDay() !== 6;
const round = (value) => Number(value.toFixed(2));
const idealAt = (scope, count, day) => round(scope * (count - day) / count);

function calendar(sprint) {
  if (!sprint || typeof sprint !== 'object') throw new TypeError('Sprint configuration is required');
  const start = parseDay(sprint.start, 'Sprint start');
  const end = parseDay(sprint.end, 'Sprint end');
  const asOf = parseDay(sprint.asOf, 'Sprint asOf');
  const calendarDays = (end - start) / DAY_MS + 1;
  if (calendarDays < 1 || calendarDays > 366 || sprint.duration !== calendarDays) {
    throw new RangeError('Sprint duration must match its inclusive calendar dates (1 to 366 days)');
  }
  if (asOf < start || asOf > end || !isWeekday(asOf)) {
    throw new RangeError('Sprint asOf must be a weekday within the sprint for an end-of-day snapshot');
  }
  if (!Number.isSafeInteger(sprint.baselinePoints) || sprint.baselinePoints <= 0) {
    throw new RangeError('Sprint baselinePoints must be a positive safe integer');
  }
  if (typeof sprint.title !== 'string' || !sprint.title.trim()) {
    throw new TypeError('Sprint title is required');
  }
  const dates = [];
  for (let time = start.getTime(); time <= end.getTime(); time += DAY_MS) {
    const date = new Date(time);
    if (isWeekday(date)) dates.push(date.toISOString().slice(0, 10));
  }
  return { calendarDays, dates };
}

function committedItems(items, sprint) {
  if (!Array.isArray(items)) throw new TypeError('Work items must be an array');
  const selected = items.filter((item) => item?.sprint === true && item.kind !== 'Epic');
  const numbers = new Set();
  let points = 0;
  for (const item of selected) {
    if (!Number.isSafeInteger(item.number) || item.number <= 0 || numbers.has(item.number)) {
      throw new TypeError('Committed issues need unique positive integer numbers');
    }
    numbers.add(item.number);
    if (!Number.isSafeInteger(item.estimate) || item.estimate < 0) {
      throw new TypeError(`Issue #${item.number} needs a non-negative integer estimate`);
    }
    if (typeof item.title !== 'string' || !item.title.trim() || !STATUSES.has(item.status)) {
      throw new TypeError(`Issue #${item.number} needs a title and a known delivery status`);
    }
    points += item.estimate;
    if (!Number.isSafeInteger(points)) throw new RangeError('Committed estimates exceed safe integer precision');
    if (item.status === 'Done') {
      parseDay(item.doneDate, `Issue #${item.number} simulated doneDate`);
      if (item.doneDate < sprint.start || item.doneDate > sprint.end) {
        throw new RangeError(`Issue #${item.number} simulated doneDate must be within the sprint`);
      }
    } else if (item.doneDate !== null && item.doneDate !== undefined) {
      throw new TypeError(`Unfinished issue #${item.number} cannot declare a simulated doneDate`);
    }
  }
  if (points !== sprint.baselinePoints) {
    throw new RangeError(`Committed estimates (${points}) must equal the fixed kickoff baseline (${sprint.baselinePoints})`);
  }
  return selected;
}

/** A start-of-day kickoff followed by weekday EOD snapshots; future actuals stay null. */
export function sprintRows(items = workItems, sprint = config.sprint) {
  const { dates } = calendar(sprint);
  const selected = committedItems(items, sprint);
  const scopePoints = sprint.baselinePoints;
  const completedBy = (date) => selected
    .filter((item) => item.status === 'Done' && item.doneDate <= date && item.doneDate <= sprint.asOf)
    .reduce((sum, item) => sum + item.estimate, 0);

  return [
    {
      date: sprint.start,
      phase: 'kickoff',
      idealRemaining: scopePoints,
      actualRemaining: scopePoints,
      scopePoints,
      provenance: PROVENANCE,
    },
    ...dates.map((date, index) => ({
      date,
      phase: 'end-of-day',
      idealRemaining: idealAt(scopePoints, dates.length, index + 1),
      actualRemaining: date <= sprint.asOf ? scopePoints - completedBy(date) : null,
      scopePoints,
      provenance: PROVENANCE,
    })),
  ];
}

function inspectRows(rows, sprint) {
  const { calendarDays, dates } = calendar(sprint);
  if (!Array.isArray(rows) || rows.length !== dates.length + 1) {
    throw new TypeError('Report rows must include kickoff and every sprint weekday');
  }
  let previousActual = sprint.baselinePoints;
  for (const [index, row] of rows.entries()) {
    const date = index === 0 ? sprint.start : dates[index - 1];
    const future = index > 0 && date > sprint.asOf;
    if (!row || row.date !== date || row.phase !== (index === 0 ? 'kickoff' : 'end-of-day')
      || row.scopePoints !== sprint.baselinePoints || row.provenance !== PROVENANCE
      || row.idealRemaining !== idealAt(sprint.baselinePoints, dates.length, index)) {
      throw new TypeError('Report rows disagree with the fixed sprint calendar, scope, or provenance');
    }
    if (future) {
      if (row.actualRemaining !== null) throw new TypeError('Future actual remaining points must be null, never projected');
    } else {
      if (!Number.isSafeInteger(row.actualRemaining) || row.actualRemaining < 0
        || row.actualRemaining > previousActual || (index === 0 && row.actualRemaining !== sprint.baselinePoints)) {
        throw new TypeError('Observed actuals must be non-increasing integer points from the kickoff baseline');
      }
      previousActual = row.actualRemaining;
    }
  }
  const observed = rows.filter((row) => row.actualRemaining !== null);
  const snapshot = observed.at(-1);
  const completed = sprint.baselinePoints - snapshot.actualRemaining;
  return {
    calendarDays,
    workingDays: dates.length,
    observed,
    observedDays: observed.length - 1,
    snapshot,
    completed,
    completionPercent: round(completed * 100 / sprint.baselinePoints),
    delta: round(snapshot.actualRemaining - snapshot.idealRemaining),
  };
}

function xml(value) {
  const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
  return String(value).toWellFormed()
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, '\ufffd')
    .replace(/[&<>"']/g, (character) => entities[character]);
}

function markdown(value) {
  return String(value).toWellFormed().replace(/[\r\n]+/g, ' ')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replace(/([\\`*_[\]|()!])/g, '\\$1');
}

function shortLabel(value, limit) {
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text.length > limit ? `${text.slice(0, limit - 1)}\u2026` : text;
}

function prettyDay(value, year = true) {
  const date = parseDay(value, 'Display date');
  return `${value.slice(8)} ${MONTHS[date.getUTCMonth()]}${year ? ` ${value.slice(0, 4)}` : ''}`;
}

/** Self-contained, accessible SVG; no fonts, scripts, images, or network resources. */
export function renderBurndownSvg(rows = sprintRows(), { sprint = config.sprint, projectTitle = config.projectTitle } = {}) {
  const metrics = inspectRows(rows, sprint);
  const { snapshot, observedDays, workingDays, completed, completionPercent, delta } = metrics;
  const left = 104;
  const right = 1144;
  const top = 282;
  const bottom = 492;
  const x = (index) => round(left + index * (right - left) / workingDays);
  const y = (points) => round(bottom - points * (bottom - top) / sprint.baselinePoints);
  const path = (points) => points.map(([px, py], index) => `${index === 0 ? 'M' : 'L'} ${px} ${py}`).join(' ');
  const actualPoints = metrics.observed.map((row, index) => [x(index), y(row.actualRemaining)]);
  const idealPoints = rows.map((row, index) => [x(index), y(row.idealRemaining)]);
  const asOfX = x(observedDays);
  const pointLabelX = asOfX > right - 120 ? asOfX - 14 : asOfX + 14;
  const pointAnchor = asOfX > right - 120 ? 'end' : 'start';
  const markerX = Math.max(left, Math.min(asOfX - 100, right - 200));
  const pace = delta > 0 ? 'behind ideal' : delta < 0 ? 'ahead of ideal' : 'on the ideal line';
  const cards = [
    [`${sprint.baselinePoints} committed`, 'Fixed kickoff baseline', '#b6c4df'],
    [`${completed} completed`, `${completionPercent}% complete; Done points only`, '#55e6ce'],
    [`${snapshot.actualRemaining} remaining`, 'Unfinished estimates retained in full', '#e3eaf8'],
    [`${delta > 0 ? '+' : ''}${delta} points`, `${pace} at ${prettyDay(sprint.asOf, false)} EOD`, '#c8b7ff'],
  ].map(([value, note, accent], index) => {
    const cardX = 48 + index * 280;
    return `  <g>
    <rect x="${cardX}" y="118" width="264" height="84" rx="14" fill="#141f36" stroke="#2b3853"/>
    <rect x="${cardX + 20}" y="132" width="28" height="3" rx="1.5" fill="${accent}"/>
    <text x="${cardX + 20}" y="163" font-size="25" font-weight="700" fill="${accent}">${xml(value)}</text>
    <text x="${cardX + 20}" y="186" font-size="11.5" fill="#acbad3">${xml(note)}</text>
  </g>`;
  }).join('\n');
  const grid = Array.from({ length: 6 }, (_, index) => {
    const points = round(sprint.baselinePoints * (5 - index) / 5);
    return `    <line x1="${left}" y1="${y(points)}" x2="${right}" y2="${y(points)}" stroke="#2a3650"/>
    <text x="88" y="${y(points) + 4}" text-anchor="end" font-size="12" fill="#aebbd2">${points}</text>`;
  }).join('\n');
  const ticks = rows.map((row, index) => `    <g>
      <line x1="${x(index)}" y1="${bottom}" x2="${x(index)}" y2="${bottom + 6}" stroke="#62718e"/>
      <text x="${x(index)}" y="518" text-anchor="middle" font-size="11" fill="#aebbd2">${index === 0 ? 'Kickoff' : WEEKDAYS[parseDay(row.date, 'Tick date').getUTCDay()]}</text>
      <text x="${x(index)}" y="535" text-anchor="middle" font-size="12" fill="#e0e8f7">${xml(prettyDay(row.date, false))}</text>
    </g>`).join('\n');
  const points = rows.map((row, index) => {
    const actual = row.actualRemaining === null ? '' : row.actualRemaining;
    const label = `${row.date} ${row.phase}: ideal ${row.idealRemaining}, actual ${actual === '' ? 'not observed' : actual}, scope ${row.scopePoints} story points. ${HISTORY_NOTICE}.`;
    return `    <g class="report-row" data-date="${xml(row.date)}" data-phase="${xml(row.phase)}" data-ideal-remaining="${row.idealRemaining}" data-actual-remaining="${actual}" data-scope-points="${row.scopePoints}" data-provenance="${xml(row.provenance)}">
      <title>${xml(label)}</title>
      <circle class="ideal-point" cx="${x(index)}" cy="${y(row.idealRemaining)}" r="3" fill="#c0b5e5"/>
${row.actualRemaining === null ? '' : `      <circle class="actual-point" cx="${x(index)}" cy="${y(row.actualRemaining)}" r="${index === observedDays ? 6 : 4.5}" fill="#55e6ce" stroke="#0b1428" stroke-width="2"/>\n`}    </g>`;
  }).join('\n');
  const description = `${projectTitle}. ${sprint.title}, ${sprint.start} to ${sprint.end}, ${metrics.calendarDays} calendar days and ${workingDays} weekdays. As of ${sprint.asOf} end of working day ${observedDays}: ${sprint.baselinePoints} committed, ${completed} completed (${completionPercent}%), ${snapshot.actualRemaining} actual remaining versus ${snapshot.idealRemaining} ideal; ${Math.abs(delta)} points ${pace}. Kickoff is start of day; daily marks are weekday end of day. Future actuals are not observed and have no line or projection. ${HISTORY_NOTICE}. Completion days are simulated. Native closedAt records the actual seed run (2026-11-09 in this scenario), not these illustrative dates. No product is implemented.`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="650" viewBox="0 0 1200 650" role="img" aria-labelledby="burndown-title burndown-desc" focusable="false" font-family="system-ui, -apple-system, Segoe UI, sans-serif">
  <title id="burndown-title">${xml(`${projectTitle} - ${sprint.title} story-point burndown`)}</title>
  <desc id="burndown-desc">${xml(description)}</desc>
  <defs>
    <linearGradient id="background" x2="0" y2="1"><stop stop-color="#111d36"/><stop offset="1" stop-color="#0a1224"/></linearGradient>
    <linearGradient id="actual-fill" x2="0" y2="1"><stop stop-color="#55e6ce" stop-opacity="0.16"/><stop offset="1" stop-color="#55e6ce" stop-opacity="0.01"/></linearGradient>
  </defs>
  <rect width="1200" height="650" rx="20" fill="url(#background)"/>
  <text x="48" y="30" font-size="11" font-weight="600" letter-spacing="1.5" fill="#96abc9">CITYPULSE / FICTIONAL DELIVERY SCENARIO</text>
  <text x="48" y="66" font-size="28" font-weight="700" fill="#f2f6ff">${xml(shortLabel(`${projectTitle} / Sprint burndown`, 65))}</text>
  <text x="48" y="93" font-size="13.5" fill="#b2c0d8">${xml(shortLabel(`${sprint.title} | ${prettyDay(sprint.start)} - ${prettyDay(sprint.end)} | ${metrics.calendarDays} calendar days / ${workingDays} weekdays`, 145))}</text>
${cards}
  <text x="104" y="236" font-size="11" font-weight="600" letter-spacing="1" fill="#aebbd2">REMAINING STORY POINTS</text>
  <line x1="678" y1="232" x2="710" y2="232" stroke="#55e6ce" stroke-width="3"/>
  <text x="720" y="236" font-size="12" fill="#d5e0f3">Actual (simulated)</text>
  <line x1="914" y1="232" x2="946" y2="232" stroke="#c0b5e5" stroke-width="2" stroke-dasharray="7 6"/>
  <text x="956" y="236" font-size="12" fill="#d5e0f3">Ideal (weekday plan)</text>
${observedDays < workingDays ? `  <rect x="${asOfX}" y="${top}" width="${round(right - asOfX)}" height="${bottom - top}" fill="#b9b4e8" fill-opacity="0.055"/>
  <text x="${round((asOfX + right) / 2)}" y="305" text-anchor="middle" font-size="10.5" letter-spacing="0.7" fill="#a8a6c1">FUTURE / NOT OBSERVED</text>\n` : ''}  <g id="axes">
${grid}
    <line x1="${left}" y1="${top}" x2="${left}" y2="${bottom}" stroke="#62718e"/>
    <line x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}" stroke="#62718e"/>
${ticks}
  </g>
  <path id="actual-area" d="${path(actualPoints)} L ${asOfX} ${bottom} L ${left} ${bottom} Z" fill="url(#actual-fill)"/>
  <path id="ideal-line" d="${path(idealPoints)}" fill="none" stroke="#c0b5e5" stroke-width="2" stroke-dasharray="7 6"/>
  <path id="actual-line" d="${path(actualPoints)}" fill="none" stroke="#55e6ce" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  <line id="as-of-marker" x1="${asOfX}" y1="276" x2="${asOfX}" y2="${bottom}" stroke="#55e6ce" stroke-opacity="0.7" stroke-dasharray="4 5"/>
  <rect x="${markerX}" y="250" width="200" height="24" rx="12" fill="#183a44" stroke="#387b7a"/>
  <text x="${markerX + 100}" y="266" text-anchor="middle" font-size="10.5" font-weight="600" fill="#9af4e3">${xml(`AS OF ${prettyDay(sprint.asOf).toUpperCase()} | DAY ${observedDays}/${workingDays}`)}</text>
${points}
  <text x="116" y="315" font-size="11" fill="#c6d3e8">${xml(`${sprint.baselinePoints} kickoff (start of day)`)}</text>
  <text x="${pointLabelX}" y="${Math.max(top + 16, y(snapshot.actualRemaining) - 12)}" text-anchor="${pointAnchor}" font-size="12" font-weight="700" fill="#80f1dd">${xml(`${snapshot.actualRemaining} actual`)}</text>
${delta === 0 ? '' : `  <text x="${pointLabelX}" y="${Math.max(top + 16, y(snapshot.idealRemaining) - 10)}" text-anchor="${pointAnchor}" font-size="12" fill="#d1c4f4">${xml(`${snapshot.idealRemaining} ideal`)}</text>\n`}  <line x1="48" y1="558" x2="1152" y2="558" stroke="#293650"/>
  <text x="48" y="583" font-size="13" fill="#b5c3db">${xml(`${completionPercent}% complete | ${observedDays} of ${workingDays} working days observed | In progress / In review earn no completed credit`)}</text>
  <text x="48" y="612" font-size="14" font-weight="700" fill="#e2d9ff">${xml(HISTORY_NOTICE)}</text>
  <text x="48" y="635" font-size="11.5" fill="#a6b5d0">Native closedAt uses real seed-day time (09 Nov 2026 in this scenario), never backdated delivery. No product is implemented.</text>
</svg>
`;
}

export function renderCsv(rows = sprintRows(), { sprint = config.sprint } = {}) {
  inspectRows(rows, sprint);
  const fields = ['date', 'phase', 'idealRemaining', 'actualRemaining', 'scopePoints', 'provenance'];
  const cell = (value) => {
    const text = value === null ? '' : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  return [fields.join(','), ...rows.map((row) => fields.map((field) => cell(row[field])).join(','))].join('\n') + '\n';
}

export function renderSprintMarkdown(rows = sprintRows(), {
  items = workItems,
  sprint = config.sprint,
  owner = config.owner,
  repo = config.repo,
  projectTitle = config.projectTitle,
} = {}) {
  const metrics = inspectRows(rows, sprint);
  const selected = committedItems(items, sprint);
  const expectedRows = sprintRows(items, sprint);
  if (rows.some((row, index) => row.actualRemaining !== expectedRows[index].actualRemaining)) {
    throw new TypeError('Markdown issue evidence must match the supplied daily rows');
  }
  if (!/^[a-z\d][a-z\d-]{0,38}$/i.test(owner) || !/^[a-z\d_.-]+$/i.test(repo) || repo === '.' || repo === '..') {
    throw new TypeError('Issue links need a valid GitHub owner and repository name');
  }
  const completedItems = selected
    .filter((item) => item.status === 'Done' && item.doneDate <= sprint.asOf)
    .sort((a, b) => a.doneDate < b.doneDate ? -1 : a.doneDate > b.doneDate ? 1 : a.number - b.number);
  const blocked = selected.filter((item) => item.status === 'Blocked');
  const blockedPoints = blocked.reduce((sum, item) => sum + item.estimate, 0);
  const epics = items.filter((item) => item?.kind === 'Epic');
  const outside = items.filter((item) => item?.kind !== 'Epic' && item?.sprint !== true);
  const pace = metrics.delta > 0 ? 'behind ideal' : metrics.delta < 0 ? 'ahead of ideal' : 'on ideal';
  const table = rows.map((row) => `| ${row.date} | ${row.phase === 'kickoff' ? 'Kickoff - start of day' : 'Weekday end of day'} | ${row.idealRemaining} | ${row.actualRemaining === null ? 'not observed' : row.actualRemaining} | ${row.scopePoints} |`);

  return [
    `# ${markdown(projectTitle)} - Sprint 1 delivery report`,
    '',
    `> **${HISTORY_NOTICE}**`,
    '> This repository is a fictional delivery/demo state, not an implemented product. Done does not prove that functionality was built, tested, approved, or deployed.',
    '',
    `![${markdown(`${sprint.title}: illustrative story-point burndown, as of ${sprint.asOf}`)}](sprint-1-burndown.svg)`,
    '',
    '## Sprint snapshot',
    '',
    `- **Sprint:** ${markdown(sprint.title)}; **${sprint.start} to ${sprint.end}**, inclusive.`,
    `- **Calendar:** ${metrics.calendarDays} calendar days / ${metrics.workingDays} weekday working days; weekends are omitted from daily rows.`,
    `- **As of:** ${sprint.asOf}, end of day UTC; working day **${metrics.observedDays} of ${metrics.workingDays}**.`,
    '',
    '| Metric | Declared scenario value |',
    '| --- | --- |',
    `| Committed scope | ${selected.length} issues / ${sprint.baselinePoints} story points |`,
    `| Completed | ${completedItems.length} Done issues / ${metrics.completed} story points |`,
    `| Remaining | ${metrics.snapshot.actualRemaining} story points |`,
    `| Completion | ${metrics.completionPercent}% of committed points |`,
    `| Blocked (part of remaining scope) | ${blocked.length} issues / ${blockedPoints} story points |`,
    `| Ideal remaining at the as-of EOD | ${metrics.snapshot.idealRemaining} story points |`,
    `| Difference from ideal | ${metrics.delta > 0 ? '+' : ''}${metrics.delta} points (${pace}) |`,
    '',
    `The **${selected.length} committed issues** total **${sprint.baselinePoints} points**: **${metrics.completed} completed** and **${metrics.snapshot.actualRemaining} remaining** (${metrics.completionPercent}% complete). At ${sprint.asOf} EOD, ideal remaining is **${metrics.snapshot.idealRemaining}** versus actual **${metrics.snapshot.actualRemaining}**, so the scenario is **${Math.abs(metrics.delta)} points ${pace}**. The **${blocked.length} blocked issues / ${blockedPoints} points** are included in, not added to, remaining work.`,
    '',
    `Scope excludes **${epics.length}${epics.every((item) => item.estimate === 0) ? ' zero-point' : ''} epics** and **${outside.length} non-sprint children**. Epics are always excluded, even if marked sprint=true, to prevent double counting. The kickoff baseline stays fixed at ${sprint.baselinePoints} points.`,
    '',
    '## Daily remaining points',
    '',
    'Kickoff is the start of the first calendar day, before any completion credit. Each later row is weekday end of day. Ideal work burns evenly over weekdays. Only full estimates of Done issues with a declared simulated doneDate at or before both the row date and the as-of cutoff earn completion credit. In progress and In review earn **no partial completed credit**.',
    '',
    '| Date (UTC) | Phase | Ideal remaining | Actual remaining | Scope points |',
    '| --- | --- | ---: | ---: | ---: |',
    ...table,
    '',
    '**not observed** means a future actual is null/empty, not zero. The actual line stops at the as-of marker; it contains no projection. [Download the auditable CSV](sprint-1-burndown.csv), including a provenance column on every data row.',
    '',
    '## Declared completed issues - simulated dates, not native timestamps',
    '',
    `These ${completedItems.length} numbered links identify declared demo Done issues only, not delivered functionality. The dates are **simulated completion dates**, not native GitHub closedAt timestamps.`,
    '',
    ...completedItems.map((item, index) => `${index + 1}. [#${item.number} - ${markdown(item.title)}](https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${item.number}) - **${item.estimate} points**; simulated completion: **${item.doneDate}**.`),
    '',
    '## Provenance and GitHub native charts',
    '',
    'The historical daily series is an explicitly illustrative scenario calculated locally from declared dates. Native closures in the planned **2026-11-09 seed run** retain their real seed-day timestamps; earlier scenario dates do not describe those native events. This report neither reads nor backdates GitHub event history, and it makes no application implementation, deployment, or live health claim.',
    '',
    '- GitHub\'s official [About insights for Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/viewing-insights-about-your-project/about-insights-for-projects) explains native project charts, including historical **burn-up** charts. Burn-up shows completed work increasing over time; this local burndown shows remaining points decreasing.',
    '- The official [Creating charts](https://docs.github.com/en/issues/planning-and-tracking-with-projects/viewing-insights-about-your-project/creating-charts) guide describes native chart configuration. These local reports do **not** seed native chart history or assert that a chart API supports historical event seeding.',
  ].join('\n') + '\n';
}

/** The only writable artifact paths. No clock, filesystem, network, or credentials are read. */
export function buildReports(items = workItems, settings = config) {
  const rows = sprintRows(items, settings.sprint);
  const options = { ...settings, items };
  return {
    [REPORT_PATHS[0]]: renderBurndownSvg(rows, options),
    [REPORT_PATHS[1]]: renderCsv(rows, options),
    [REPORT_PATHS[2]]: renderSprintMarkdown(rows, options),
  };
}

/** Compare only the allowlisted reports; CRLF is equivalent to LF, nothing else is trimmed. */
export function findStaleReports(persisted, expected = buildReports()) {
  if (!persisted || typeof persisted !== 'object') throw new TypeError('Persisted reports must be a path/content map');
  if (!expected || Object.keys(expected).length !== REPORT_PATHS.length
    || REPORT_PATHS.some((path) => typeof expected[path] !== 'string' || !Object.hasOwn(expected, path))) {
    throw new TypeError('Expected reports must contain exactly the three allowlisted report paths');
  }
  const normalize = (text) => text.replaceAll('\r\n', '\n');
  return REPORT_PATHS.flatMap((path) => {
    if (typeof persisted[path] !== 'string' || !Object.hasOwn(persisted, path)) return [{ path, reason: 'missing' }];
    return normalize(persisted[path]) === normalize(expected[path]) ? [] : [{ path, reason: 'stale' }];
  });
}
