// Declarative demo data only: this module implements no app and makes no API calls.
// state/stateReason describe the intended native seed, not existing GitHub metadata.
export const config = {
  owner: 'alvine-aurelio-org',
  repo: 'citypulse-projects-demo',
  projectTitle: 'CityPulse | Digital Service Launch',
  sprint: {
    title: 'Sprint 1 - Citizen beta',
    start: '2026-11-02',
    end: '2026-11-13',
    duration: 12,
    asOf: '2026-11-09',
    baselinePoints: 100,
  },
  statuses: [
    { name: 'Backlog', color: 'GRAY', description: 'Uncommitted work awaiting discovery or prioritisation.' },
    { name: 'Ready', color: 'BLUE', description: 'Scoped work that can be selected when capacity is available.' },
    { name: 'In progress', color: 'YELLOW', description: 'Work placed in an active delivery stage in the seeded scenario.' },
    { name: 'In review', color: 'PURPLE', description: 'Work awaiting a scenario review or acceptance decision.' },
    { name: 'Blocked', color: 'RED', description: 'Work waiting on an unresolved native issue dependency.' },
    { name: 'Done', color: 'GREEN', description: 'Illustrative completed work, not evidence of implemented functionality.' },
  ],
  priorities: [
    { name: 'P0 - Critical', color: 'RED', description: 'A privacy, reliability, or launch decision that must not be bypassed.' },
    { name: 'P1 - High', color: 'ORANGE', description: 'Important work on the citizen beta or operations critical path.' },
    { name: 'P2 - Normal', color: 'BLUE', description: 'Planned delivery work outside the immediate critical path.' },
    { name: 'P3 - Low', color: 'GRAY', description: 'An exploratory or incremental improvement with flexible timing.' },
  ],
  teams: [
    { name: 'Product', color: 'PURPLE', description: 'Fictional service scope, policy, and release decision team.' },
    { name: 'Experience', color: 'PINK', description: 'Fictional citizen journeys, content, and accessibility team.' },
    { name: 'Platform', color: 'BLUE', description: 'Fictional integration, security, and reliability team.' },
    { name: 'Service Ops', color: 'ORANGE', description: 'Fictional staff triage, support, and incident coordination team.' },
    { name: 'Quality', color: 'GREEN', description: 'Fictional acceptance, accessibility, and risk review team.' },
  ],
  risks: [
    { name: 'Low', color: 'GREEN', description: 'Contained scope with no identified cross-team prerequisite.' },
    { name: 'Medium', color: 'YELLOW', description: 'A policy, usability, or coordination question needs attention.' },
    { name: 'High', color: 'RED', description: 'Privacy, service continuity, or a delivery prerequisite is at risk.' },
  ],
  milestones: [
    { title: 'Citizen beta', description: 'Illustrative decision gate for the first citizen-facing beta scope.', due_on: '2026-11-13T23:59:59Z' },
    { title: 'Operations readiness', description: 'Illustrative decision gate for staff support and operational ownership.', due_on: '2026-11-20T23:59:59Z' },
    { title: 'Public launch', description: 'Illustrative decision gate for a future public launch, not a deployment claim.', due_on: '2026-11-27T23:59:59Z' },
  ],
  // These are view provisioning seeds; the provisioner can adapt native filter syntax.
  views: [
    { name: '01 - Portfolio backlog', layout: 'TABLE_LAYOUT', filter: '' },
    { name: '02 - Delivery board', layout: 'BOARD_LAYOUT', filter: '-label:epic' },
    { name: '03 - Sprint 1 board', layout: 'BOARD_LAYOUT', filter: 'sprint:"Sprint 1 - Citizen beta"' },
    { name: '04 - Release roadmap', layout: 'ROADMAP_LAYOUT', filter: 'label:epic' },
    { name: '05 - Team workload', layout: 'TABLE_LAYOUT', filter: 'is:open -label:epic' },
    { name: '06 - Risks and blockers', layout: 'BOARD_LAYOUT', filter: 'status:Blocked' },
    { name: '07 - Bug triage', layout: 'TABLE_LAYOUT', filter: 'type:Bug' },
  ],
};

const tracks = [
  {
    workstream: 'Citizen onboarding',
    team: 'Experience',
    priority: 'P1 - High',
    risk: 'Medium',
    role: 'Resident journey designer',
    target: '2026-11-20',
    doneDates: ['2026-11-02', '2026-11-03'],
    summary: 'Shape a minimal, accessible citizen onboarding journey with transparent profile data, consent choices, and notification preferences for the fictional service.',
    acceptance: [
      'The proposed journey explains required profile data separately from optional personalisation.',
      'Keyboard, screen-reader, and assisted-service paths appear in the onboarding scope.',
      'Notification and consent decisions have named fictional delivery roles and child issues.',
    ],
    notes: 'The seeded epic stays In progress while beta profile decisions and later assisted or multilingual journeys occupy different delivery stages.',
    children: [
      {
        title: 'Define the minimum-data citizen profile',
        kind: 'Story',
        team: 'Product',
        role: 'Profile policy designer',
        summary: 'Describe a minimal beta profile with a preferred name and contact route, while keeping optional demographic details out of the default citizen journey.',
        acceptance: [
          'Profile requirements distinguish mandatory contact routing from an optional display name.',
          'Each retained field has a plain-language purpose and a correction or deletion path.',
          'An empty or withdrawn profile has an explicit next step without revealing another resident.',
        ],
        notes: 'Illustrative Done establishes a minimum-data baseline for the scenario; no profile service, resident records, or delivery evidence is included.',
      },
      {
        title: 'Specify consent and profile retention choices',
        kind: 'Task',
        team: 'Product',
        role: 'Privacy steward',
        summary: 'Frame consent, withdrawal, and retention decisions so the fictional beta does not confuse optional notifications with permission to process a service request.',
        acceptance: [
          'The proposed notice separates optional update consent from necessary service communication.',
          'Withdrawal examples explain what stops immediately and what request records must remain.',
          'A retention decision lists its fictional policy owner and unresolved legal review questions.',
        ],
        notes: 'The seeded completion day is a storytelling aid for the privacy discussion, not a real approval or a completed legal assessment.',
      },
      {
        title: 'Review the guided profile setup journey',
        kind: 'Story',
        role: 'Accessible interaction designer',
        summary: 'Describe a short, recoverable setup flow that lets a resident review profile choices, correct errors, and continue without completing optional fields.',
        acceptance: [
          'The proposed setup has a documented keyboard order from entry through final confirmation.',
          'Error examples preserve entered values and link the summary to each invalid field.',
          'A resident can skip optional details and review the contact route before confirming.',
        ],
        notes: 'In review is a seeded conversation about recoverable form errors and follows the illustrative consent decision; it is not evidence of a conducted usability review.',
      },
      {
        title: 'Draft the notification preference editing contract',
        kind: 'Story',
        team: 'Platform',
        role: 'Preference integration designer',
        summary: 'Define how a resident reads and changes channel preferences without losing an earlier choice when a slow client or concurrent update is involved.',
        acceptance: [
          'The proposed contract distinguishes service-critical notices from optional channel preferences.',
          'Concurrent edit examples include a version check and a recoverable conflict response.',
          'The journey explains pending, saved, and failed preference changes without claiming delivery.',
        ],
        notes: 'This seeded active contract depends on the minimum profile baseline and is the unresolved prerequisite for the slow-save conflict example.',
      },
      {
        title: 'Correct screen-reader association of profile errors',
        kind: 'Bug',
        team: 'Quality',
        role: 'Accessibility scenario reviewer',
        summary: 'Model a fictional accessibility defect where the profile error summary names a field but assistive technology cannot associate that field with its explanation.',
        acceptance: [
          'The proposed defect example identifies the email field and its missing error association.',
          'The intended correction connects the field, visible message, and focusable summary link.',
          'The acceptance scenario covers keyboard recovery without relying on colour alone.',
        ],
        notes: 'Ready means the invented accessibility example is scoped for discussion; no running form was inspected and no fix or test result is asserted.',
      },
      {
        title: 'Resolve preference overwrite after a slow save',
        kind: 'Bug',
        team: 'Platform',
        risk: 'High',
        role: 'Preference conflict reviewer',
        summary: 'Model a fictional lost-update defect where a delayed preference save overwrites a newer channel choice, requiring an agreed edit contract before resolution.',
        acceptance: [
          'The scenario orders two preference edits and names which delayed response would overwrite data.',
          'The proposed resolution rejects a stale version instead of silently replacing the newer choice.',
          'A conflict response offers a clear reload or retry path without implying a saved preference.',
        ],
        notes: 'Blocked is deliberate: this fictional defect waits for the in-progress preference editing contract, rather than representing an observed production incident.',
      },
      {
        title: 'Prepare an assisted citizen onboarding script',
        kind: 'Task',
        team: 'Service Ops',
        priority: 'P2 - Normal',
        risk: 'Low',
        role: 'Assisted-service guide',
        summary: 'Outline how a fictional support colleague can explain onboarding choices to a resident without collecting credentials or deciding optional consent on their behalf.',
        acceptance: [
          'The proposed script asks the resident to make consent choices rather than preselecting them.',
          'Support prompts explicitly avoid collecting passwords, authentication codes, or extra profile data.',
          'The handoff describes how a resident can continue independently or request an accessible route.',
        ],
        notes: 'This Ready item is intentionally outside Sprint 1 so the workload view can distinguish follow-on support preparation from the beta commitment.',
      },
      {
        title: 'Explore delegated access for trusted helpers',
        kind: 'Spike',
        team: 'Product',
        priority: 'P3 - Low',
        risk: 'High',
        role: 'Delegated-access researcher',
        summary: 'Explore the boundaries of a possible trusted-helper journey without assuming that a resident can safely share a login or that delegated authority already exists.',
        acceptance: [
          'The discovery questions distinguish a helper, a legal representative, and a shared credential.',
          'The options compare revocation, scope limits, and a resident-visible access history.',
          'The proposed outcome is a bounded recommendation with unanswered policy questions, not an implementation.',
        ],
        notes: 'Backlog preserves delegated-access uncertainty instead of treating a high-risk discovery topic as committed beta functionality.',
      },
      {
        title: 'Add multilingual onboarding guidance',
        kind: 'Story',
        priority: 'P2 - Normal',
        role: 'Inclusive content designer',
        summary: 'Plan plain-language onboarding guidance for additional languages while keeping privacy terminology, error recovery, and help routes consistent with the base journey.',
        acceptance: [
          'The proposed content inventory includes profile purposes, consent choices, and recovery messages.',
          'A language switch preserves the current step without implying that entered information was submitted.',
          'The review plan names translation ownership and a route for reporting unclear service terminology.',
        ],
        notes: 'This later onboarding story remains Backlog and is not included in the 100-point beta sprint baseline.',
      },
    ],
  },
  {
    workstream: 'Service catalogue',
    team: 'Product',
    priority: 'P1 - High',
    risk: 'Medium',
    role: 'Service catalogue curator',
    target: '2026-11-20',
    doneDates: ['2026-11-03', '2026-11-04'],
    summary: 'Shape a searchable, understandable service catalogue with accessible filters, current eligibility information, and accountable fictional publishing roles.',
    acceptance: [
      'Service cards describe eligibility, expected next steps, and the accountable publishing role.',
      'Search and filter scenarios include plain-language, accent, and accessibility considerations.',
      'Availability changes have an explicit publishing and stale-content handling path.',
    ],
    notes: 'The fictional catalogue epic stays active while publishing governance and stale availability handling remain open, with later content work outside the beta sprint.',
    children: [
      {
        title: 'Define searchable service cards',
        kind: 'Story',
        role: 'Service information architect',
        summary: 'Describe a consistent service card that helps a resident recognise a service, understand eligibility, and find the next step without navigating internal department names.',
        acceptance: [
          'Each proposed card has a citizen-facing name, plain-language purpose, and eligibility summary.',
          'A card identifies its next step and distinguishes an online request from an assisted service.',
          'The content model records the fictional publishing role and a review-due field.',
        ],
        notes: 'Illustrative Done supplies a catalogue baseline for the seeded timeline; it does not mean a catalogue or search index has been built.',
      },
      {
        title: 'Correct accent handling in catalogue query examples',
        kind: 'Bug',
        team: 'Experience',
        role: 'Search journey designer',
        summary: 'Model an invented search defect where accented and unaccented versions of a service term lead to inconsistent guidance, using synthetic service names only.',
        acceptance: [
          'The defect description pairs accented and unaccented queries for the same synthetic service.',
          'The proposed matching rule preserves the displayed service name while normalising comparison.',
          'A no-match example offers spelling guidance without revealing private or unpublished services.',
        ],
        notes: 'The closed demo state is simulated history for a fictional query defect, not evidence that a search engine was exercised or repaired.',
      },
      {
        title: 'Review accessible catalogue result filters',
        kind: 'Story',
        team: 'Experience',
        role: 'Catalogue accessibility designer',
        summary: 'Describe service result filters that expose selected values, explain an empty result set, and remain understandable to keyboard and screen-reader users.',
        acceptance: [
          'The proposed filter controls expose labels, selection state, and an operable clear action.',
          'Result-count announcements distinguish a pending query from an empty matching result.',
          'Removing a filter restores a predictable focus location and a readable service list.',
        ],
        notes: 'The seeded review follows the illustrative query-normalisation item and invites an accessibility discussion rather than claiming review evidence.',
      },
      {
        title: 'Define a governed service publishing workflow',
        kind: 'Story',
        team: 'Service Ops',
        role: 'Catalogue publishing coordinator',
        summary: 'Specify how fictional service owners propose, review, publish, and withdraw catalogue content while preserving an understandable citizen-facing availability message.',
        acceptance: [
          'The proposed lifecycle distinguishes draft, approved, published, and withdrawn service content.',
          'A publish decision records a fictional accountable role and a human-readable change reason.',
          'Withdrawal and correction examples explain how a resident finds an alternative next step.',
        ],
        notes: 'This seeded active workflow follows the service-card baseline and is the unresolved prerequisite for the stale-availability defect.',
      },
      {
        title: 'Prepare the service-owner publishing checklist',
        kind: 'Task',
        team: 'Service Ops',
        priority: 'P2 - Normal',
        risk: 'Low',
        role: 'Service content coordinator',
        summary: 'Draft a short publishing checklist covering contact routes, eligibility wording, review dates, and a fallback when a service cannot accept new requests.',
        acceptance: [
          'The proposed checklist asks for a current contact route and an accountable service role.',
          'Eligibility and expected response wording have a plain-language review prompt.',
          'The checklist includes a review-due date and an alternative for temporarily unavailable services.',
        ],
        notes: 'Ready represents a scoped content-governance task, not a signed-off publishing procedure or a live service listing.',
      },
      {
        title: 'Resolve stale service availability after an update',
        kind: 'Bug',
        team: 'Platform',
        risk: 'High',
        role: 'Catalogue consistency reviewer',
        summary: 'Model a fictional consistency defect where a newly withdrawn service still appears available in cached catalogue results until publishing semantics are defined.',
        acceptance: [
          'The scenario distinguishes the published service version from a stale cached result.',
          'The intended invalidation rule prevents a withdrawn service from inviting a new request.',
          'A fallback message explains temporary availability uncertainty without promising acceptance.',
        ],
        notes: 'The invented stale-content defect stays Blocked on the publishing workflow; no cache, production outage, or observed resident impact is claimed.',
      },
      {
        title: 'Map eligibility wording to plain-language prompts',
        kind: 'Task',
        team: 'Experience',
        priority: 'P2 - Normal',
        role: 'Service language editor',
        summary: 'Plan a content pass that turns internal eligibility terminology into clear resident questions without presenting a preliminary prompt as a formal eligibility decision.',
        acceptance: [
          'The proposed wording pairs an internal eligibility term with a plain-language resident prompt.',
          'Each prompt explains that guidance is not an authoritative eligibility determination.',
          'Uncertain answers lead to a named service contact route rather than a silent rejection.',
        ],
        notes: 'This post-sprint Ready task demonstrates follow-on content capacity without inflating the committed beta estimate.',
      },
      {
        title: 'Explore location-aware service discovery',
        kind: 'Spike',
        priority: 'P3 - Low',
        role: 'Service discovery researcher',
        summary: 'Explore whether area-based service guidance is useful without requesting precise location by default or assuming an address proves a resident is eligible.',
        acceptance: [
          'The discovery options compare a manually chosen area with optional coarse location input.',
          'The privacy questions explain location retention and a route that needs no location access.',
          'The proposed recommendation separates discovery convenience from an eligibility decision.',
        ],
        notes: 'Backlog makes the location question visible as discovery, not a delivered capability or a Sprint 1 commitment.',
      },
      {
        title: 'Add service catalogue change notices',
        kind: 'Story',
        team: 'Experience',
        priority: 'P2 - Normal',
        risk: 'Low',
        role: 'Service change communicator',
        summary: 'Plan understandable notices for material service changes so a resident can distinguish a new requirement, a temporary interruption, and a permanent withdrawal.',
        acceptance: [
          'The proposed notice identifies the affected service and the citizen-visible change.',
          'Temporary interruptions include an alternative contact route and a review expectation.',
          'A permanent withdrawal explains the next available route without implying automatic transfer.',
        ],
        notes: 'This later catalogue story remains Backlog until publishing semantics and the beta content baseline are no longer the immediate focus.',
      },
    ],
  },
  {
    workstream: 'Request tracking',
    team: 'Platform',
    priority: 'P1 - High',
    risk: 'High',
    role: 'Request journey architect',
    target: '2026-11-27',
    doneDates: ['2026-11-04', '2026-11-05'],
    summary: 'Shape private request references, understandable progress states, and controlled update notifications so citizens can follow a fictional service request safely.',
    acceptance: [
      'Public reference examples do not expose identity, internal queue names, or sequential case counts.',
      'Citizen-visible states and updates distinguish acknowledgement from a service decision.',
      'Internal notes, notification preferences, and delivery fallbacks have explicit child work.',
    ],
    notes: 'This seeded epic remains active because timeline semantics, private content boundaries, and later clarification journeys still have open delivery work.',
    children: [
      {
        title: 'Define non-identifying public request references',
        kind: 'Story',
        role: 'Request reference designer',
        summary: 'Specify citizen-facing reference examples that are easy to quote to support but do not reveal identity, service queue internals, or the total number of requests.',
        acceptance: [
          'The proposed reference format uses synthetic examples without names or sequential case counts.',
          'A reference alone is explicitly insufficient to authorise access to private request details.',
          'The support journey distinguishes quoting a reference from proving entitlement to the request.',
        ],
        notes: 'Illustrative Done anchors the tracking timeline only; no reference generator, identity system, or stored request is part of this demo.',
      },
      {
        title: 'Map citizen-visible request states',
        kind: 'Task',
        team: 'Product',
        risk: 'Medium',
        role: 'Request language steward',
        summary: 'Map internal handling concepts to clear citizen-facing request states, including received, more information needed, under review, and a decision communicated.',
        acceptance: [
          'Each proposed citizen state has a plain-language meaning and a next-step explanation.',
          'An acknowledgement is clearly different from acceptance, approval, or a final decision.',
          'Internal routing and staff-only investigation details are excluded from public state text.',
        ],
        notes: 'The simulated completion day supports the example burndown and is not a real product-policy approval or historical GitHub closure.',
      },
      {
        title: 'Correct duplicate acknowledgement wording',
        kind: 'Bug',
        team: 'Experience',
        risk: 'Medium',
        role: 'Request message reviewer',
        summary: 'Model a fictional messaging defect where retrying a request acknowledgement makes a resident think a second request was created rather than the first one confirmed.',
        acceptance: [
          'The scenario pairs an original acknowledgement and a retried message for one request reference.',
          'The intended wording identifies a repeated acknowledgement without inventing a second request.',
          'The message explains how to check the existing reference or seek help if the resident is unsure.',
        ],
        notes: 'In review is a seeded wording discussion after the illustrative state mapping, not a claim that duplicate messages were observed or tested.',
      },
      {
        title: 'Specify request timeline and state-change events',
        kind: 'Story',
        role: 'Request event contract designer',
        summary: 'Define a citizen-readable timeline from request acknowledgement to later updates, including event ordering, delayed delivery, and the boundary around staff-only content.',
        acceptance: [
          'The proposed event contract includes an event identifier, request reference, and public state.',
          'Out-of-order and repeated event examples do not move the citizen timeline backwards.',
          'A delayed update explains uncertainty without exposing internal staff notes or implying a decision.',
        ],
        notes: 'The active fictional timeline contract follows the reference baseline and blocks the delayed-update fallback until event semantics are agreed.',
      },
      {
        title: 'Remove internal staff notes from citizen message examples',
        kind: 'Bug',
        team: 'Quality',
        priority: 'P0 - Critical',
        role: 'Citizen privacy scenario reviewer',
        summary: 'Model an invented privacy defect in a notification template where staff-only notes could be mistaken for approved citizen-facing text, using entirely synthetic content.',
        acceptance: [
          'The synthetic defect example marks internal staff text separately from approved public wording.',
          'The proposed template contract permits only explicitly citizen-visible fields.',
          'A missing public message has a neutral fallback rather than inserting internal note content.',
        ],
        notes: 'The Critical priority describes the fictional privacy impact; it does not allege an actual data leak or an implemented notification system.',
      },
      {
        title: 'Prepare email fallback for delayed request updates',
        kind: 'Task',
        team: 'Service Ops',
        role: 'Request notification coordinator',
        summary: 'Outline a respectful fallback when a request update is delayed, with a clear distinction between pending delivery, a failed channel, and an unresolved service decision.',
        acceptance: [
          'The proposed fallback uses the same public request reference and an approved public state.',
          'Retry guidance respects optional notification choices and avoids duplicate urgent messages.',
          'A failed channel gives the resident a safe contact route without exposing private request content.',
        ],
        notes: 'This seeded Blocked task waits for the in-progress timeline event contract; no email was sent and no delivery failure is asserted.',
      },
      {
        title: 'Prepare a request notification preference matrix',
        kind: 'Task',
        team: 'Product',
        priority: 'P2 - Normal',
        risk: 'Medium',
        role: 'Notification policy mapper',
        summary: 'Plan a matrix showing which fictional request messages are necessary service communication and which optional updates should follow a resident channel preference.',
        acceptance: [
          'The proposed matrix names each message purpose and whether optional channel consent applies.',
          'Withdrawal and unavailable-channel examples identify a permissible alternative contact route.',
          'The matrix keeps message purpose separate from any assumption about successful delivery.',
        ],
        notes: 'This follow-on Ready item is outside the beta sprint and keeps notification policy visible without changing the illustrative baseline.',
      },
      {
        title: 'Explore intermittent-connectivity request drafts',
        kind: 'Spike',
        team: 'Experience',
        priority: 'P2 - Normal',
        role: 'Resilient journey researcher',
        summary: 'Explore how a resident might recover an unfinished request during intermittent connectivity without assuming sensitive drafts can safely remain on a shared device.',
        acceptance: [
          'The discovery options compare an explicit save action with an unsaved in-memory draft.',
          'Shared-device questions cover expiry, sign-out, and accidental exposure of request details.',
          'The proposed recommendation explains recovery limits and avoids promising offline submission.',
        ],
        notes: 'Backlog captures a research question about privacy and resilience; it does not advertise an offline capability.',
      },
      {
        title: 'Add citizen clarification and attachment guidance',
        kind: 'Story',
        team: 'Experience',
        priority: 'P2 - Normal',
        role: 'Clarification journey designer',
        summary: 'Plan a clear route for a citizen asked to clarify a request, with safe attachment guidance, deadline explanations, and an alternative when a document cannot be supplied.',
        acceptance: [
          'The proposed clarification explains the missing information without revealing staff-only notes.',
          'Attachment guidance covers permitted content, sensitive-data warnings, and an assisted alternative.',
          'A resident who cannot meet a stated deadline sees a contact route rather than an implied rejection.',
        ],
        notes: 'This public-launch-horizon story remains Backlog and has no simulated completion day or claim of an implemented upload flow.',
      },
    ],
  },
  {
    workstream: 'Staff operations',
    team: 'Service Ops',
    priority: 'P1 - High',
    risk: 'Medium',
    role: 'Triage service coordinator',
    target: '2026-11-20',
    doneDates: ['2026-11-05', '2026-11-06'],
    summary: 'Shape an accessible staff triage queue with clear ownership, routing, escalation, and shift handover practices for the fictional service operations team.',
    acceptance: [
      'Queue scope separates staff-only operational information from citizen-visible request content.',
      'Routing and reassignment decisions have an accountable fictional role and a recoverable path.',
      'Keyboard triage, escalation, and shift handover appear as explicit delivery work.',
    ],
    notes: 'The seeded operations epic stays active while routing, assignment consistency, and a dependent keyboard walkthrough remain unfinished.',
    children: [
      {
        title: 'Define the staff triage queue contract',
        kind: 'Story',
        role: 'Triage queue designer',
        summary: 'Specify the minimum information a fictional staff colleague needs to triage a request without exposing unnecessary citizen details or confusing queue ownership with a decision.',
        acceptance: [
          'The proposed queue row includes a request reference, service category, age, and current owner role.',
          'Private request details are excluded from the default list unless needed for the triage purpose.',
          'Queue ownership is explicitly different from a citizen-visible acceptance or final decision.',
        ],
        notes: 'Illustrative Done supplies a staff-workflow baseline, not a running queue or evidence that staff handled any real requests.',
      },
      {
        title: 'Prepare escalation and ownership handover rules',
        kind: 'Task',
        role: 'Escalation policy coordinator',
        summary: 'Frame how a fictional request moves between service roles when responsibility is unclear, a response is overdue, or a specialist decision is required.',
        acceptance: [
          'The proposed rules name the sending role, receiving role, and the reason for an escalation.',
          'An unaccepted handover retains a visible accountable role instead of silently dropping ownership.',
          'An overdue example distinguishes an internal escalation from a promise made to the citizen.',
        ],
        notes: 'The seeded closed state is a simulated policy milestone and does not imply an approved operations process or completed real handover.',
      },
      {
        title: 'Review the accessible staff queue layout',
        kind: 'Story',
        team: 'Experience',
        role: 'Staff accessibility designer',
        summary: 'Describe a readable triage queue that works with keyboard navigation, exposes sorting clearly, and distinguishes operational urgency without relying on colour alone.',
        acceptance: [
          'The proposed layout gives every queue column a readable heading and a meaningful sort state.',
          'Keyboard movement between queue rows and request details has a documented return-focus path.',
          'Urgency and ownership changes have text equivalents rather than colour-only indicators.',
        ],
        notes: 'In review is a seeded staff-accessibility conversation following the illustrative handover rules, not an assertion of a completed accessibility assessment.',
      },
      {
        title: 'Specify triage routing and reassignment events',
        kind: 'Story',
        team: 'Platform',
        risk: 'High',
        role: 'Triage routing contract designer',
        summary: 'Define how a fictional triage action records routing and reassignment while handling stale ownership, an unavailable receiving team, and a recoverable failed update.',
        acceptance: [
          'The proposed event identifies the previous owner role, requested owner role, and routing reason.',
          'A stale ownership example requires an explicit refresh before a conflicting reassignment.',
          'An unavailable destination leaves a visible accountable role and a clear recovery action.',
        ],
        notes: 'The seeded active routing contract follows the queue baseline and is the unresolved prerequisite for the keyboard routing walkthrough.',
      },
      {
        title: 'Correct ownership display after a queue refresh',
        kind: 'Bug',
        team: 'Platform',
        risk: 'High',
        role: 'Queue consistency reviewer',
        summary: 'Model a fictional queue defect where a refreshed row shows an old owner role after reassignment, risking duplicate triage decisions in the example workflow.',
        acceptance: [
          'The synthetic example distinguishes the latest ownership version from an older displayed row.',
          'The intended refresh behaviour shows the latest owner role or an explicit stale-data warning.',
          'A colleague cannot mistake a failed refresh for confirmation that their reassignment succeeded.',
        ],
        notes: 'Ready scopes an invented consistency defect for the demo; it is not an observed queue incident or a claim that a fix was verified.',
      },
      {
        title: 'Prepare the keyboard-only routing walkthrough',
        kind: 'Task',
        team: 'Quality',
        role: 'Keyboard workflow scenario author',
        summary: 'Outline a keyboard-only triage walkthrough from selecting a request to routing it, reading the outcome, and recovering when ownership changed during the action.',
        acceptance: [
          'The proposed walkthrough lists keyboard actions for selecting, routing, and confirming a request.',
          'Success, conflict, and unavailable-destination examples identify the next focus location.',
          'The scenario records expected announcements without asserting any browser or assistive-tool result.',
        ],
        notes: 'Blocked is intentional because keyboard outcomes depend on the unfinished routing contract; the walkthrough is not a passed test.',
      },
      {
        title: 'Draft the operations shift handover template',
        kind: 'Task',
        priority: 'P2 - Normal',
        risk: 'Low',
        role: 'Shift continuity coordinator',
        summary: 'Plan a short handover template that makes unresolved queue ownership, urgent follow-ups, and escalation contacts visible without copying private request narratives.',
        acceptance: [
          'The proposed handover lists request references, accountable roles, and the next required action.',
          'Urgent follow-ups include a reason and a contact route without promising a service decision.',
          'The template excludes unnecessary citizen details and explains where authorised staff find context.',
        ],
        notes: 'This post-beta Ready task illustrates operations preparation outside Sprint 1 and makes no claim that a real shift handover occurred.',
      },
      {
        title: 'Explore service-demand categories for triage',
        kind: 'Spike',
        team: 'Product',
        priority: 'P3 - Low',
        role: 'Service demand researcher',
        summary: 'Explore a small, explainable demand taxonomy for triage and capacity discussions without inferring sensitive resident attributes from request categories.',
        acceptance: [
          'The discovery options use synthetic service categories rather than personal or protected attributes.',
          'The proposed taxonomy explains ambiguous requests and a route for staff to suggest corrections.',
          'The recommendation separates workload grouping from any automated eligibility or priority decision.',
        ],
        notes: 'Backlog keeps demand taxonomy exploratory and avoids implying that automated triage or resident profiling exists.',
      },
      {
        title: 'Add bulk triage preview and confirmation',
        kind: 'Story',
        team: 'Experience',
        priority: 'P2 - Normal',
        risk: 'High',
        role: 'Bulk-action interaction designer',
        summary: 'Plan a guarded bulk routing journey where a fictional staff colleague can see exactly which requests will change and recover when only some requested updates are accepted.',
        acceptance: [
          'The proposed preview lists selected request references and the intended owner role before confirmation.',
          'A partially accepted action identifies unchanged requests without implying all updates succeeded.',
          'The recovery journey preserves a readable result and avoids silently repeating a successful update.',
        ],
        notes: 'This later operations story remains Backlog because bulk actions should not obscure the unfinished single-request ownership decisions.',
      },
    ],
  },
  {
    workstream: 'Release and reliability',
    team: 'Platform',
    priority: 'P1 - High',
    risk: 'High',
    role: 'Release reliability steward',
    target: '2026-11-27',
    doneDates: ['2026-11-06', '2026-11-09'],
    summary: 'Shape a fictional beta-to-launch decision framework covering service-level objectives, privacy boundaries, health signals, incident response, and rollback readiness.',
    acceptance: [
      'The proposed release gates distinguish service health, security questions, and a human launch decision.',
      'SLO and error-budget examples have defined scope and avoid claiming measured production performance.',
      'Alert routing, bounded telemetry, and rollback ownership are represented by explicit child issues.',
    ],
    notes: 'The seeded reliability epic remains active through the public-launch horizon; nothing in this catalogue represents a deployed service or a real release approval.',
    children: [
      {
        title: 'Define beta SLO and error-budget policy',
        kind: 'Task',
        priority: 'P0 - Critical',
        role: 'Service objective designer',
        summary: 'Define an illustrative beta service-level objective and error-budget decision policy with a clear user journey, observation window, and explicit limits on interpretation.',
        acceptance: [
          'The proposed SLO names the citizen journey, a success condition, and the observation window.',
          'The error-budget example explains a release pause decision without inventing measured availability.',
          'Low-traffic and missing-signal cases are marked inconclusive rather than automatically healthy.',
        ],
        notes: 'Illustrative Done provides the reliability baseline for a simulated burndown; there are no production measurements or approved service guarantees.',
      },
      {
        title: 'Prepare release threat-model boundaries',
        kind: 'Task',
        team: 'Quality',
        role: 'Threat-model facilitator',
        summary: 'Outline the fictional release trust boundaries around profile access, request references, staff-only notes, notification content, and operational telemetry.',
        acceptance: [
          'The proposed boundary inventory separates citizens, staff roles, service integrations, and telemetry.',
          'Each example names a plausible disclosure or authorisation question using synthetic information.',
          'Open threats retain a fictional accountable role and are not described as an approved security assessment.',
        ],
        notes: 'The simulated completion day is the scenario as-of day; it is not a past security sign-off, real GitHub closure date, or assertion of a secure application.',
      },
      {
        title: 'Review synthetic citizen-journey monitoring scenarios',
        kind: 'Task',
        team: 'Quality',
        risk: 'Medium',
        role: 'Synthetic monitoring scenario author',
        summary: 'Describe synthetic checks for service discovery and request status journeys using invented data, with clear separation between a failed check and a real citizen-impact incident.',
        acceptance: [
          'The proposed scenarios use synthetic identities and references rather than resident information.',
          'A failure description separates unavailable service, stale data, and an inconclusive observation.',
          'Expected evidence lists useful signal fields without claiming that any monitoring check ran.',
        ],
        notes: 'In review is a seeded monitoring-design discussion following the illustrative threat boundaries, not a successful synthetic check or a health claim.',
      },
      {
        title: 'Specify release health signals and alert routing',
        kind: 'Task',
        priority: 'P0 - Critical',
        role: 'Health signal contract designer',
        summary: 'Specify bounded health signals and fictional alert ownership for the beta journey, including missing telemetry, service errors, and a safe escalation route.',
        acceptance: [
          'The proposed signals distinguish user-journey failure, request latency, and missing observations.',
          'Alert examples name a fictional first-response role, escalation route, and suppression rationale.',
          'Metric dimensions exclude citizen identifiers and have a documented cardinality budget.',
        ],
        notes: 'The active seeded signal contract follows the SLO baseline and blocks the unbounded-metric-label defect until allowed dimensions are decided.',
      },
      {
        title: 'Prepare the error-budget release decision checklist',
        kind: 'Task',
        team: 'Service Ops',
        role: 'Release decision coordinator',
        summary: 'Draft a human release decision checklist that uses the illustrative error budget while recording uncertainty, outstanding privacy questions, and a possible decision to pause.',
        acceptance: [
          'The proposed checklist asks for the observation window and explicitly identifies missing evidence.',
          'An exhausted-budget example records a pause decision and a named fictional decision role.',
          'A favourable signal alone cannot override unresolved privacy or ownership concerns.',
        ],
        notes: 'Ready is a seeded planning state for a decision aid; it is not permission to release and does not assert an available error-budget measurement.',
      },
      {
        title: 'Correct unbounded labels in request-count telemetry',
        kind: 'Bug',
        role: 'Telemetry privacy reviewer',
        summary: 'Model a fictional telemetry defect where a request reference is used as a metric label, creating unbounded series and unnecessary disclosure risk before any service is built.',
        acceptance: [
          'The synthetic defect example shows why per-request references create an unbounded metric dimension.',
          'The intended correction uses a bounded service category and excludes citizen or request identifiers.',
          'The scenario documents an allowed-dimension budget and a way to flag unexpected new values.',
        ],
        notes: 'This invented defect stays Blocked on the health-signal contract; there is no real telemetry stream, measured cardinality issue, or deployed fix.',
      },
      {
        title: 'Draft rollback and incident response runbooks',
        kind: 'Task',
        team: 'Service Ops',
        role: 'Incident continuity planner',
        summary: 'Plan fictional response and rollback runbooks that clarify who can pause intake, communicate uncertainty, preserve necessary evidence, and decide a safe recovery path.',
        acceptance: [
          'The proposed runbooks name fictional incident coordination, communication, and rollback roles.',
          'A rollback decision considers request integrity and a safe alternative contact route for residents.',
          'Recovery prompts require fresh evidence and do not treat a completed checklist as service health.',
        ],
        notes: 'This follow-on Ready task deliberately sits outside Sprint 1; no incident occurred and no rollback was executed.',
      },
      {
        title: 'Explore public-launch load modelling assumptions',
        kind: 'Spike',
        team: 'Quality',
        priority: 'P2 - Normal',
        risk: 'Medium',
        role: 'Capacity modelling researcher',
        summary: 'Explore plausible public-launch demand shapes using invented volumes, distinguishing a modelling assumption from evidence of tested capacity or a commitment to service performance.',
        acceptance: [
          'The discovery brief labels every demand volume, concurrency value, and arrival pattern as assumed.',
          'The options include a sudden catalogue surge and a slower staff-processing bottleneck.',
          'The proposed outcome lists evidence still needed before any capacity or latency claim is made.',
        ],
        notes: 'Backlog makes load uncertainty visible; no traffic was generated and no capacity benchmark or performance result is supplied.',
      },
      {
        title: 'Add the public-launch readiness decision record',
        kind: 'Story',
        team: 'Product',
        priority: 'P0 - Critical',
        role: 'Public-launch decision steward',
        summary: 'Plan a transparent launch decision record that brings together outstanding service, privacy, accessibility, and operations questions without confusing seeded issue status with delivery proof.',
        acceptance: [
          'The proposed record distinguishes declared scope, unresolved risks, and independently required evidence.',
          'A fictional accountable decision role can explicitly choose not to launch when evidence is missing.',
          'The decision template states that demo Done issues do not prove a built, tested, or deployed service.',
        ],
        notes: 'This public-launch-horizon story remains Backlog; the milestone is a planning date rather than a real release, approval, or deployed endpoint.',
      },
    ],
  },
];

const deliverySlots = [
  { status: 'Done', estimate: 5, sprint: true },
  { status: 'Done', estimate: 3, sprint: true },
  { status: 'In review', estimate: 3, sprint: true },
  { status: 'In progress', estimate: 5, sprint: true },
  { status: 'Ready', estimate: 2, sprint: true },
  { status: 'Blocked', estimate: 2, sprint: true },
  { status: 'Ready', estimate: 3, sprint: false },
  { status: 'Backlog', estimate: 5, sprint: false },
  { status: 'Backlog', estimate: 8, sprint: false },
];

const typeByKind = { Epic: 'Feature', Story: 'Feature', Task: 'Task', Bug: 'Bug', Spike: 'Task' };

const epicItems = tracks.map((track, index) => ({
  number: index + 1,
  title: `[EPIC] ${track.workstream}`,
  type: 'Feature',
  kind: 'Epic',
  parent: null,
  estimate: 0,
  sprint: false,
  status: 'In progress',
  priority: track.priority,
  team: track.team,
  workstream: track.workstream,
  risk: track.risk,
  start: config.sprint.start,
  target: track.target,
  doneDate: null,
  blockedBy: [],
  role: track.role,
  summary: track.summary,
  acceptance: track.acceptance,
  notes: track.notes,
  state: 'open',
  stateReason: null,
}));

const childItems = tracks.flatMap((track, groupIndex) => {
  const first = 6 + groupIndex * 9;
  const schedules = [
    [config.sprint.start, track.doneDates[0]],
    [track.doneDates[0], track.doneDates[1]],
    [track.doneDates[1], '2026-11-10'],
    [track.doneDates[0], '2026-11-12'],
    ['2026-11-10', '2026-11-12'],
    ['2026-11-09', config.sprint.end],
    ['2026-11-16', '2026-11-18'],
    ['2026-11-16', '2026-11-20'],
    [track.target === '2026-11-20' ? '2026-11-19' : '2026-11-23', track.target],
  ];
  const dependencies = [[], [], [first + 1], [first], [], [first + 3], [], [], []];

  return track.children.map((item, slotIndex) => {
    const slot = deliverySlots[slotIndex];
    const [start, target] = schedules[slotIndex];
    const completed = slot.status === 'Done';

    return {
      number: first + slotIndex,
      title: item.title,
      type: typeByKind[item.kind],
      kind: item.kind,
      parent: groupIndex + 1,
      estimate: slot.estimate,
      sprint: slot.sprint,
      status: slot.status,
      priority: item.priority ?? track.priority,
      team: item.team ?? track.team,
      workstream: track.workstream,
      risk: item.risk ?? track.risk,
      start,
      target,
      doneDate: completed ? track.doneDates[slotIndex] : null,
      blockedBy: dependencies[slotIndex],
      role: item.role ?? track.role,
      summary: item.summary,
      acceptance: item.acceptance,
      notes: item.notes,
      state: completed ? 'closed' : 'open',
      stateReason: completed ? 'completed' : null,
    };
  });
});

export const workItems = [...epicItems, ...childItems];

const issueLink = (number) => `[#${number}](https://github.com/${config.owner}/${config.repo}/issues/${number})`;
const tableCell = (value) => String(value).replaceAll('|', '\\|').replace(/\r?\n/g, ' ');

export function issueBody(item) {
  const completed = item.status === 'Done';
  const hierarchy = item.kind === 'Epic'
    ? [
        'This epic is one of the 50 counted issues. Its zero-point estimate prevents double-counting child work.',
        '',
        'Declared child issues:',
        ...workItems.filter((child) => child.parent === item.number)
          .map((child, index) => `${index + 1}. ${issueLink(child.number)} - ${child.title}`),
      ].join('\n')
    : `Parent epic: ${issueLink(item.parent)}.`;
  const dependencies = item.blockedBy.length === 0
    ? 'No declared blocked-by dependencies.'
    : item.blockedBy.map((number) => {
        const dependency = workItems.find((candidate) => candidate.number === number);
        const resolution = dependency.status === 'Done'
          ? 'resolved in the seeded scenario: Done'
          : `unresolved in the seeded scenario: ${dependency.status}`;
        return `- Depends on ${issueLink(number)} - ${dependency.title} (${resolution}).`;
      }).join('\n');
  const metadata = [
    ['Native issue type', item.type],
    ['Delivery kind', item.kind],
    ['Declared native state', completed ? 'closed / completed' : 'open'],
    ['Seeded project status', item.status],
    ['Priority', item.priority],
    ['Team', item.team],
    ['Workstream', item.workstream],
    ['Risk', item.risk],
    ['Estimate', `${item.estimate} points${item.kind === 'Epic' ? ' (epic; excluded from sprint totals)' : ''}`],
    ['Sprint', item.sprint ? config.sprint.title : 'Not in Sprint 1'],
    ['Illustrative start', item.start],
    ['Illustrative target', item.target],
    ['Scenario as of', config.sprint.asOf],
    ['Declared illustrative completion day', completed ? `${item.doneDate} (simulated; not a real GitHub closedAt)` : 'None; this item is not Done'],
  ];

  return [
    `<!-- citypulse-demo:item:${item.number} -->`,
    '',
    '> **SEEDED / FICTIONAL DELIVERY DEMO - no application is implemented.**',
    '> All work items, acceptance checks, dates, roles, and progress notes are seeded fictional delivery data. Done is a demonstration state, not proof that an app was built, tested, or deployed.',
    '> Real native timestamps start at creation in GitHub. Earlier illustrative completion days are explicitly simulated history, not real GitHub closedAt timestamps. Dependencies below are declarations to provision, not evidence that native links already exist.',
    '',
    '## Summary',
    item.summary,
    '',
    '## Delivery metadata',
    '| Field | Declared demo value |',
    '| --- | --- |',
    ...metadata.map(([field, value]) => `| ${field} | ${tableCell(value)} |`),
    '',
    '## Hierarchy',
    hierarchy,
    '',
    '## Acceptance criteria (seeded, not verification evidence)',
    ...item.acceptance.map((criterion) => `- [${completed ? 'x' : ' '}] ${criterion}`),
    '',
    '## Declared dependencies',
    dependencies,
    '',
    '## Fictional role and real assignee',
    `Scenario role: **${item.role}** (fictional role, not a GitHub username).`,
    'The provisioner may assign only the authenticated real actor or intentionally leave this issue unassigned. A fictional role is not a real assignee.',
    '',
    '## Scenario-specific progress note',
    item.notes,
  ].join('\n') + '\n';
}

export function summarize(items = workItems) {
  const byStatus = Object.fromEntries(config.statuses.map(({ name }) => [name, 0]));
  let sprintItems = 0;
  let sprintPoints = 0;
  let completedSprintPoints = 0;
  let epics = 0;
  let children = 0;
  let dependencyEdges = 0;

  for (const item of items) {
    byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;
    dependencyEdges += item.blockedBy.length;
    if (item.parent !== null) children += 1;
    if (item.kind === 'Epic') {
      epics += 1;
      continue;
    }
    if (item.sprint) {
      sprintItems += 1;
      sprintPoints += item.estimate;
      if (item.status === 'Done') completedSprintPoints += item.estimate;
    }
  }

  return {
    total: items.length,
    byStatus,
    sprintItems,
    sprintPoints,
    completedSprintPoints,
    remainingSprintPoints: sprintPoints - completedSprintPoints,
    epics,
    children,
    dependencyEdges,
  };
}
