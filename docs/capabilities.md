# What is native, what is illustrative

## Scope and ownership

Exactly one private repository is used: **alvine-aurelio-org/citypulse-projects-demo**.
Exactly one private organization-owned GitHub Project is linked to it. GitHub does
not store modern Projects inside a Git repository; the repository's Projects tab
is the native entry point to its linked organization Project.

There are **50 native issues**, including the five epic issues. The Project has
the same 50 issue items, with no extra drafts or pull-request cards. Each epic has
nine native sub-issues. Epics are represented as Feature-type issues with an
**epic** label; the organization-level type catalogue is not changed for this demo.

## Native capabilities used

| Surface | Implementation |
| --- | --- |
| Work items | Real issues with Feature, Task, and Bug native types |
| Portfolio hierarchy | 5 real epic issues, 45 native sub-issue relationships |
| Dependencies | 15 native blocked-by relationships, including 5 unresolved blockers |
| States | 40 open and 10 closed-completed issues; Done matches native completion |
| Project lifecycle | Six configured Status options with meaningful colours |
| Planning | Priority, Estimate, Team, Workstream, Risk, iteration and date fields |
| Sprint | One explicitly configured iteration; 30 committed child issues / 100 points |
| Views | Seven saved table, board, and roadmap views over the same items |
| Roadmap | Epic bars based on declared Start date and Target date planning fields |
| Release horizons | Three native milestones with November 2026 due dates |
| Ownership | Actual operator assignments plus intentionally unassigned discovery work |
| Insights | Saved current charts; native historical burn-up starts with real events |
| Communication | Native At risk Project update with risk, mitigation, and next action |
| Automation | Native Project workflow settings; no stored Project token in CI |
| Repository hygiene | Issue/PR templates, private visibility, no real personal data |
| Quality | Node built-in tests and an offline, credential-free GitHub Actions workflow |

“Team” and the scenario roles are **fictional delivery metadata**. They neither
pretend that extra people worked on the project nor create GitHub teams, memberships,
or permissions. The real authenticated operator is the only assigned account.

## Reporting provenance

The [burndown](../reports/sprint-1-burndown.svg) is a conventional single-sprint
chart generated from the [declared catalogue](../demo/catalog.mjs). Its
[daily CSV](../reports/sprint-1-burndown.csv) and [narrative report](../reports/sprint-1.md)
make the calculations inspectable.

- **Baseline:** 100 points from the 30 committed non-epic issues.
- **Completion:** subtract the full estimate only on an item's declared simulated
  completion day. Review, Ready, Blocked, and In progress receive zero partial credit.
- **Time axis:** ten Monday-to-Friday working days, November 2–13, 2026.
- **Cutoff:** November 9 EOD. Earlier actual-looking daily values are explicitly
  **illustrative demo history**; future actuals are blank.
- **Ideal:** a straight line from 100 at kickoff to zero at the end of workday ten.
- **Current checkpoint:** 40 completed, 60 remaining, versus 40 ideal remaining.
- **No double count:** five zero-point epics and 15 uncommitted children are excluded.

The real GitHub issue `created_at`, `closed_at`, event, and Project activity
timestamps are **not rewritten**. A new environment cannot truthfully contain
weeks of native past delivery activity. Its native historical chart is GitHub's
**burn-up**, while the repository burndown is a separate, explicitly simulated
presentation artifact. Native current charts are calculated from the actual
Project fields and current issue states.

References:

- [GitHub: current and historical Insights](https://docs.github.com/en/issues/planning-and-tracking-with-projects/viewing-insights-from-your-project/about-insights-for-projects)
- [GitHub: configuring charts](https://docs.github.com/en/issues/planning-and-tracking-with-projects/viewing-insights-from-your-project/configuring-charts)
- [GitHub: iteration fields](https://docs.github.com/en/issues/planning-and-tracking-with-projects/understanding-fields/about-iteration-fields)
- [GitHub: Project filtering](https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/filtering-projects)
- [GitHub: native sub-issue API](https://docs.github.com/en/rest/issues/sub-issues)
- [GitHub: native issue dependencies](https://docs.github.com/en/rest/issues/issue-dependencies)

## Maintainer safety model

The provisioner is bound to this exact organization and repository. It verifies
the real actor, private visibility, native IDs, and the issue ownership markers.
It requires an explicit mutation flag; live verification is read-only. Secrets
are handled only by the standard GitHub CLI credential store.

Creation is reconciled against existing numbered markers before resuming. A
numbering gap, unowned issue, duplicate marker, second matching Project, foreign
Project item, incomplete pagination, or missing access fails closed. Native parent
and dependency relationships are read before any missing relationship is added.
The scripts do not delete, replace, force-push, or change global Git/Azure settings.

Rerunning Project seeding intentionally restores catalogue field values; it is a
maintainer operation, not a presentation step. It must not be used to overwrite
unreviewed audience changes. Native saved layout grouping and chart configuration
are verified separately through GitHub's UI because not every UI option has a
public mutation API. Auto-archive remains off to preserve the fixed Insights scope.

## Deliberate non-goals

This is a full **project-management demonstration**, not an implemented citizen
service. It does not claim production code, a public deployment, real resident
data, a real multi-person delivery team, security approval, or real sprint velocity.
No additional repositories or cloud services are provisioned.
