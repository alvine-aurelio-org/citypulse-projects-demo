# Verified CityPulse demo environment

**Date:** November 9, 2026. **Real operator:** alvinea28.

## Live native baseline

| Check | Observed result |
| --- | --- |
| Repository | One private repository, alvine-aurelio-org/citypulse-projects-demo; default branch main |
| Linked Project | One private organization Project, number 11, linked only to this repository |
| Issues and Project items | Exactly **50 native issues / 50 issue items**, no draft or PR cards |
| Issue states | **40 open / 10 closed-completed** |
| Native types | Feature **21**, Task **21**, Bug **8** |
| Hierarchy | 5 epic issues with 9 native children each: **45 sub-issue links** |
| Dependencies | **15 native blocked-by links**, including five unresolved blockers |
| Status distribution | Backlog 10; Ready 10; In progress 10; In review 5; Blocked 5; Done 10 |
| Sprint | One iteration, November 2–13, 2026; **30 issues / 100 points** |
| Completed and remaining | **40 completed / 60 remaining**; five blocked issues / 10 points |
| Milestones | Citizen beta November 13; Operations readiness November 20; Public launch November 27 |
| Saved views | Seven, with filters, grouping, date mapping, markers, and point sums configured |
| Native automation | Seven enabled workflows; auto-archive and broad auto-add are not enabled |
| Status communication | Native **At risk** update, sprint start and target dates, risk/mitigation/next action |

REST and GraphQL readback checked issue identities, markers, native state/type,
labels, assignees, milestones, hierarchy, dependencies, all custom field values,
the single iteration, repository linkage, Project item count, and saved view filters.
The view grouping and board columns are also asserted by read-only verification.

## Native UI configuration, saved and reloaded

| Saved chart | Configuration | Observed native data |
| --- | --- | --- |
| [Delivery status](https://github.com/orgs/alvine-aurelio-org/projects/11/insights/1) | Column; X Status; Y Count; no filter | Backlog 10, Ready 10, In progress 10, In review 5, Blocked 5, Done 10 |
| [Sprint 1 - Effort by status](https://github.com/orgs/alvine-aurelio-org/projects/11/insights/2) | Column; X Status; Y Sum of Estimate; explicit Sprint 1 filter | Ready 10, In progress 25, In review 15, Blocked 10, Done 40: **100 points** |
| [Team workload](https://github.com/orgs/alvine-aurelio-org/projects/11/insights/3) | Column; X Team; Y Sum of Estimate; open, non-epic filter | Product 26, Experience 52, Platform 28, Service Ops 20, Quality 14: **140 points** |
| [Sprint 1 - Native burn up](https://github.com/orgs/alvine-aurelio-org/projects/11/insights/4) | Stacked area; X Time; Y Sum of Estimate; explicit Sprint 1 filter; November 2–9 | November 9: **60 Open / 40 Completed**; no native pre-creation delivery history |

All four chart URLs were navigated afresh. Their persisted names, filters, layout,
axes, aggregate field, date range, and actual accessible chart points were inspected.
The default GitHub Burn up chart is retained in addition to the four custom charts.

The release roadmap uses **Start date + Target date**, five epic bars, and **Sprint +
Milestone** markers. Portfolio grouping is Workstream; workload grouping is Team;
blocker board columns are Workstream; bug triage grouping is Priority. Portfolio
and bug-triage Type columns are native UI settings, not inferred from the public
GraphQL field list, which currently omits that built-in field.

## Burndown provenance and local checks

- **79 tests passed**, zero failures, cancellations, skips, or todos at the assembly checkpoint.
- Strict content verification and deterministic report freshness passed.
- Actual SVG parses as SVG-namespace XML; chart coordinates, CSV rows, and Markdown totals agree.
- Only the 30 committed non-epic issues contribute to the 100-point sprint baseline.
- Ten declared, simulated completion days produce 40 completed points by November 9 EOD.
- The ideal has 40 remaining versus actual 60: **20 points behind the ideal**.
- Future actuals are blank. No GitHub event was backdated.

Hosted workflow results and final publication revisions are retained in the
dev-branch [daily work report](https://github.com/alvine-aurelio-org/citypulse-projects-demo/blob/dev/docs/daily%20work%20report/2026-11-09.md).

## Evidence boundaries

This verifies a real, populated **GitHub project-management environment**, not a
working deployed citizen-service product. Work-item narratives, proposed designs,
role names, past completion dates, and seeded acceptance checks are fictional.
Only the normal real GitHub operator is assigned. No extra organization accounts,
permissions, repositories, Projects, or cloud resources were created for the story.

The conventional repository burndown is illustrative. Native historical Insights
uses real issue events from environment creation on November 9; it is not offered
as evidence that the earlier simulated work actually occurred.
