# Guided profile setup: proposed design for review

**Fictional design proposal for issue #8. Not approved, implemented, or deployed.**
This document is intentionally held in an open pull request so a presenter can
show a real design diff, linked issue, CI, and pending human review without
pretending that the citizen-facing application exists.

## Proposed journey and keyboard order

1. **Introduction:** explain why a contact route is needed and what is optional.
   Focus moves from the page heading to the guidance and Continue action.
2. **Contact route:** focus moves through route choice, the selected contact field,
   its help text, and Continue. An optional display name is clearly marked optional.
3. **Preferences:** explain necessary service communication separately from optional
   updates. Optional preferences can be skipped without preventing the next step.
4. **Review:** present a plain-language summary of the contact route, optional fields,
   and update choices. Edit links return to the relevant field without losing values.
5. **Confirm:** the final action follows the summary. A proposed confirmation message
   distinguishes saved choices from a failed or still-pending submission.

The order must remain understandable using only a keyboard. A focused error
summary must be followed by usable links to fields, rather than relying on colour.
These are proposed requirements, not results from an accessibility test.

## Recoverable error example

Use the synthetic address **resident@example.invalid** in design examples only;
do not include real resident data. If a deliberately malformed synthetic address
is submitted, retain the user's entry and place a clear error explanation beside
the contact field. The summary links to that field, and the field is associated
with the explanation in the eventual accessible implementation.

A failed save must not erase the other entered values or claim that a preference
was saved. An unavailable service offers a retry or assisted route without
revealing another resident's details.

## Optional details and confirmation

The resident can skip the display name and optional updates. Before confirming,
the resident reviews the selected contact route and can correct it. An edit does
not itself send an update, create a service request, or accept optional consent.

## Requested human review

- [ ] Check the proposed focus order and the error-summary-to-field recovery path.
- [ ] Confirm that invalid input remains recoverable and entered values are preserved.
- [ ] Confirm that optional fields and updates can be skipped without coercive consent.
- [ ] Confirm that the final summary exposes the contact route before confirmation.

The pull request's automated checks validate the **demo repository and reports**.
They do not test a running profile form, replace these human review decisions,
or establish that the fictional citizen beta is ready to launch.
