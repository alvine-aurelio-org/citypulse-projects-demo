# CityPulse · a complete GitHub Projects demo

**One repository. One linked Project. Fifty real issues. One focused sprint.**

A fictional city is launching a citizen-service portal: residents find a service,
submit a request, track progress, and receive updates; staff triage and resolve the
work. The scenario is familiar enough to explain in a minute and rich enough to
show the complete planning-to-delivery story.

> **Start with the repository's [Projects tab](https://github.com/alvine-aurelio-org/citypulse-projects-demo/projects).**
> Open **CityPulse | Digital Service Launch**, then choose **03 - Sprint 1 board**.
> Everything is pre-populated; presenters do not need to seed data or install tools.

![CityPulse Sprint 1 burndown: 100 committed, 40 completed, 60 remaining; illustrative demo history](reports/sprint-1-burndown.svg)

**[Sprint report and daily numbers](reports/sprint-1.md)** ·
**[Presentation guide](docs/demo-guide.md)** ·
**[Capabilities and boundaries](docs/capabilities.md)** ·
**[Auditable CSV](reports/sprint-1-burndown.csv)**

## The environment at a glance

| Capability | Ready-to-demo content |
| --- | --- |
| Portfolio | 5 real epic issues, each with 9 native sub-issues: **50 issues total** |
| Delivery lifecycle | Backlog **10**, Ready **10**, In progress **10**, In review **5**, Blocked **5**, Done **10** |
| One sprint | **Sprint 1 - Citizen beta**, November 2–13, 2026; 30 delivery issues, **100 points** |
| Progress | **40 completed / 60 remaining**; 5 blocked issues representing 10 points |
| Planning fields | Status, Priority, Estimate, Team, Workstream, Risk, Sprint, Start date, Target date |
| Native issue features | Feature / Task / Bug types, labels, milestones, actual assignees, parent-child progress, dependencies |
| Delivery horizons | Citizen beta → Operations readiness → Public launch |
| Reporting | Native Insights for live Project data, plus the single-sprint burndown shown above |
| Presenter experience | A guided 10–15 minute tour, realistic acceptance criteria, risk narrative, and repeatable verification |

**A point is counted once.** Epics have zero estimates; only their delivery children
contribute to effort. The sprint contains 30 of the 45 child issues. The remaining
15 children are deliberately outside the sprint, so backlog is not confused with commitment.

## Seven lenses on the same work

| Saved Project view | What to show |
| --- | --- |
| **01 - Portfolio backlog** | All 50 issues, priorities, teams, estimates, native types, and hierarchy |
| **02 - Delivery board** | All 45 delivery children moving through six lifecycle columns |
| **03 - Sprint 1 board** | Only the 30 committed sprint issues; effort totals tell the delivery story |
| **04 - Release roadmap** | Five epic date bars and the release horizon, without 45 child rows obscuring the big picture |
| **05 - Team workload** | Open delivery work grouped by fictional delivery team; points, not just issue count |
| **06 - Risks and blockers** | Five blocked issues and their native unresolved prerequisites |
| **07 - Bug triage** | Eight realistic Bug-type issues across the lifecycle |

The Project is organization-owned, as GitHub Projects are. It is explicitly linked
to this repository and surfaced in its Projects tab; no second repository is required.

## The sprint story

The scenario is frozen at **November 9, 2026, end of day**. Six of ten working days
have elapsed. The ideal line has **40 points remaining**, but the example has **60**:
it is **20 points behind the ideal**. Reviews and in-progress work earn no partial
completion credit. The next stand-up should focus on the five unresolved dependencies
and finishing review work, not starting more backlog.

### Important reporting distinction

This is **seeded, fictional delivery data**, not a claim that the CityPulse product
has been built, tested, approved, or deployed. GitHub issues and Project items are
real; their native creation/closure events occur when the environment is provisioned.

The burndown's earlier daily completions are **explicit illustrative history** derived
from the issue catalogue. They are **not backdated GitHub events**. Future actuals are
blank, never invented. GitHub's native historical Insights chart is a **burn-up**;
the ready-made burndown here supplies the conventional remaining-versus-ideal view.
See [reporting provenance](docs/capabilities.md#reporting-provenance).

## Five workstreams

1. **Citizen onboarding** — minimum-data profiles, consent, preferences, accessible setup.
2. **Service catalogue** — discoverable services, accessible filters, governed publishing.
3. **Request tracking** — request references, understandable statuses, notification journeys.
4. **Staff operations** — queue ownership, safe triage, escalation, support handoffs.
5. **Release and reliability** — service objectives, incident communication, launch decisions.

Only the verified real GitHub operator is assigned to sample issues. **Team** and
the roles in issue descriptions are fictional demo groupings, not fabricated users
or grants of organization access. Some Ready and Backlog issues remain unassigned
to make the ownership discussion useful.

## Maintenance, not presenter setup

Node.js 24 and the standard GitHub CLI are used by maintainers. There are **no npm
runtime dependencies**, no PATs or cloud resources, and no credentials in this repository.

- `npm test` checks the catalogue, reporting calculations, provisioning safety, and content.
- `npm run verify` validates checked-in reports, documentation, and source hygiene without GitHub access.
- `npm run verify:live` performs a read-only reconciliation against this exact demo repository and Project.
- The two `seed:*` scripts require normal GitHub authentication and reconcile existing demo markers;
  they do not create a second repository, delete existing work, or silently duplicate issues.

The credential-free validation workflow runs on pushes and pull requests. Native
Project automation remains in GitHub; its settings are documented in the guide.

## Keeping the demo credible

- All 50 native issues count toward the total, including the five epics.
- No extra draft items or pull requests are added to the 50-item Project.
- Dates and scenario progress are explicitly fictional; native state is independently verifiable.
- The burndown is checked against the exact sprint issue estimates and completion declarations.
- Changes made during a live presentation intentionally change the environment; the frozen
  report stays a clearly dated baseline until a maintainer deliberately updates the catalogue.
- Session publication and checks are recorded on the **dev** branch in the
  [daily work report](https://github.com/alvine-aurelio-org/citypulse-projects-demo/blob/dev/docs/daily%20work%20report/2026-11-09.md).
