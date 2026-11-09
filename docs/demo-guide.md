# CityPulse: the 15-minute presenter guide

## Before the audience arrives

1. Sign in to GitHub with an account that can read this private repository and its linked Project.
2. Open the repository README and its **Projects** tab in separate tabs.
3. Keep the [single-sprint report](../reports/sprint-1.md) open for the burndown segment.
4. Do not rerun seeding, create new issues, add drafts, or change permissions. The environment is already populated.

The delivery scenario is frozen at **November 9, 2026 EOD**. This makes repeated
presentations consistent even when the real date changes. Say explicitly that the
delivery history is illustrative and that the CityPulse service itself is fictional.

## 0:00–2:00 · The portfolio, without a wall of sticky notes

Open **01 - Portfolio backlog**.

- There are **50 real issues**: five epic issues and 45 delivery children.
- Select **#1 — [EPIC] Citizen onboarding**. Its native sub-issue section contains
  nine children, including two closed-completed examples. Parent-child progress
  is native GitHub data, not a manually maintained checklist masquerading as a hierarchy.
- Show issue type, priority, assignee, team, estimate, milestone, and scenario acceptance criteria.
- Explain that a zero-point epic prevents double-counting its children's effort.

**Talking point:** “The same issue can be an executive's roadmap item, a delivery
team's card, and a dependency. We do not copy it into three tracking systems.”

## 2:00–4:00 · A full delivery lifecycle

Switch to **02 - Delivery board**.

The filter excludes the five epics, leaving **45 delivery issues**. The six status
columns are Backlog, Ready, In progress, In review, Blocked, and Done. Five delivery
children are In progress; the full portfolio additionally has five active epics.

Open a card and show real issue details without leaving the Project. Show labels,
acceptance criteria, native issue type, and its parent. Priority is a planning field,
not an issue type. **Team** is a fictional demo grouping, not a GitHub access-control team.

**Optional interaction:** move an open Ready card to In progress, then return it
to Ready. Do not move a card into Done just to illustrate dragging: native automation
can close the underlying issue. Do not claim an animation proves persistence;
reload the view if demonstrating a real edit.

## 4:00–6:30 · One real sprint, not the whole backlog

Open **03 - Sprint 1 board**.

- The saved filter names **Sprint 1 - Citizen beta** explicitly. It does not use
  a rolling `@current` filter that will become empty after the workshop date.
- Dates: **November 2–13, 2026**, 12 calendar days inclusive, **10 working days**.
- Scope: **30 delivery issues / 100 estimated points**.
- Done: **10 issues / 40 points**. Remaining: **20 issues / 60 points**.
- In review: 5 issues / 15 points; In progress: 5 / 25; Ready: 5 / 10;
  Blocked: 5 / 10. Only Done earns completion credit.

Show the estimate sums on the board. Counting cards alone would hide the difference
between a two-point blocker and a five-point active story.

## 6:30–8:00 · Read the burndown honestly

Return to the README's embedded chart or open the [sprint report](../reports/sprint-1.md).

1. Start at the **100-point kickoff baseline**.
2. Follow the ideal dashed line to zero at the end of the tenth working day.
3. Follow the teal actual line only through **November 9 EOD**: **60 remaining**.
4. At that date, ideal remaining is **40**, so the example is **20 points behind**.
5. Future actuals are blank. The chart does not invent a successful sprint finish.
6. Link the CSV and its issue-level completion references to show that numbers are auditable.

**Required distinction:** “This conventional burndown uses declared illustrative
completion dates. We created the GitHub environment now; we did not backdate GitHub
events. Native Insights separately reads the real current state and event history.”

## 8:00–10:00 · Resolve the delivery conversation

Open **06 - Risks and blockers**, then **#11 — Resolve preference overwrite after a slow save**.

- Its native blocked-by relationship points to **#9**, an open In progress prerequisite.
- The dependency is not just text in the description: show the native relationship
  and reciprocal blocking relationship on the prerequisite.
- Compare a resolved dependency, such as **#8 → #7**, where the prerequisite is Done.
- Each of five workstreams has the same useful pattern: resolved baseline,
  active integration decision, and blocked follow-on scenario.

Open the Project's status update: **At risk**. Explain the mitigation—finish
current prerequisites and review work before adding more backlog. Five blocked
items represent ten of the sixty remaining sprint points, not another ten on top.

## 10:00–12:00 · Executive roadmap and capacity

Open **04 - Release roadmap**.

- Five epic date bars make the release horizon legible.
- Date fields are **Start date** and **Target date**, not issue creation timestamps.
- Sprint markers and the three repository milestones explain different planning concepts.
- Planning dates do not mean a real public service has launched.

Open **05 - Team workload**.

- Open, non-epic work is grouped by the five fictional delivery teams.
- Estimate sums show workload distribution, not proven individual capacity or velocity.
- Some Ready and Backlog issues are intentionally unassigned. Assigned examples
  use the verified real operator, not invented GitHub accounts.

## 12:00–14:00 · Insights, quality, and automation

Open native **Insights** from the Project toolbar.

- **Delivery status**: current issue counts across the six statuses.
- **Sprint 1 - Effort by status**: the single sprint's Estimate sum by Status.
- **Team workload**: open delivery Estimate sum by Team.
- **Sprint 1 - Native burn up**: real GitHub historical issue-state data, filtered
  to the sprint. Because the environment was created on one day, do not call it a
  multi-day historical delivery record. The separate burndown supplies that explicit demo narrative.

Open **07 - Bug triage** to show the eight native Bug-type issues across stages.
Then show the repository's credential-free validation workflow: it checks catalogue
integrity, reporting maths, documentation, and provisioning safety—not a fictional deployed service.

In **Project settings → Workflows**, show the saved native issue-close/reopen rules.
Closing an issue can set Done without a separate spreadsheet edit. Moving Done
may also close the issue when the corresponding workflow is enabled; explain the
actual saved rules before changing anything. Auto-archive is deliberately not used:
archiving items would remove them from Insights and obscure this fixed demo scope.

## 14:00–15:00 · Wrap up

“One repository connects the why, the delivery work, the dependencies, the sprint,
the roadmap, and the risk conversation. Every lens reuses the same 50 issues.”

Leave the audience on the **Sprint 1 board** or the README burndown. No extra
repository, cloud environment, subscription, sample user account, or token is needed.

## Presenter safety and repeatability

- Do not create another Project, re-import the issues, or add duplicate drafts.
- Do not delete, archive, or reopen Done issues merely to manufacture chart movement.
- Do not claim seeded acceptance checkboxes are actual test evidence.
- Do not ask for or display secrets; use the normal authenticated GitHub session.
- After a deliberate demo edit, return it to its original state and verify by reloading.
- A maintainer can run read-only live verification; a failure after audience edits
  means the frozen baseline differs, not that those edits should be overwritten automatically.
