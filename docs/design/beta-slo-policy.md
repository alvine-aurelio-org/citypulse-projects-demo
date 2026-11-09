# Proposed citizen-beta SLO and error-budget policy

**Fictional design artifact for #42 and epic #5.** This is a proposed policy, not
measured production performance, a launched service, or an approved release gate.

## Journey and measurement boundary

The scenario journey is an authenticated resident submitting a valid synthetic
service request and receiving a non-duplicated acknowledgement reference. A
success includes a usable response and a durable acknowledgement decision; a
timeout or an ambiguous duplicate response is not counted as success.

The illustrative observation window is a rolling 28 days. Proposed measurement
uses aggregated eligible attempts and successful acknowledgements, with no resident
identifiers, free text, or request content in telemetry. A suggested 99.5% target
is a design input for discussion, not an observed achievement.

## Error budget and release decisions

For an example 10,000 eligible attempts, a 99.5% target permits 50 unsuccessful
attempts. This arithmetic is synthetic. If the agreed observation window consumes
that budget, pause optional releases, inspect the relevant signals, and document
a human decision before resuming changes. Do not equate a green deployment job
with a healthy citizen journey.

## Missing signals and low traffic

- With too few eligible attempts, mark the result **inconclusive**, not healthy.
- When the success signal is missing, mark the result **unknown**, not 100% success.
- Keep synthetic-monitor results separate from real eligible-request aggregates.
- Record exclusions, observation gaps, and unresolved instrumentation questions.
- A fictional service-reliability steward owns escalation; no real on-call roster is implied.
