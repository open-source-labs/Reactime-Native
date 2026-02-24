# Reactime Native — Accessibility Decision Log

## Decisions Made

### Connection Status Visibility
- Added real-time connection status indicator to the browser UI
- **Rationale:** State changes communicated visually AND programmatically — not just a color change. Supports users who cannot distinguish color states alone.
- **WCAG reference:** Success Criterion 1.4.1 (Use of Color) — color is not the only visual means of conveying information

### Error State UI
- Explicit error messages surfaced in the UI rather than silent failures
- **Rationale:** Users (developers) need to know *why* a connection failed, not just that it did. Opaque failures are an accessibility barrier.
- **WCAG reference:** Success Criterion 4.1.3 (Status Messages) — status messages surfaced without receiving focus

### Timeline Slider — Accessible Name and Disabled State (Decision 13)
- Added `aria-label="timeline slider"` to `<Slider>` unconditionally
- Added `disabled={true}` when `snapshotsLength === 0` (slider is inert but always rendered)
- **Rationale:** An unlabeled slider with no accessible name is invisible to screen
  readers. An inert but focusable slider that does nothing useful when empty
  violates keyboard operability expectations. Both attributes together mean the
  slider is always named and correctly non-interactive when there is no data.
- **WCAG reference:**
  - 4.1.2 (Name, Role, Value) — interactive controls must have an accessible name
  - 2.1.1 (Keyboard) — `disabled` ensures the inert slider is not in the tab order
- **Engineering note:** This decision was made alongside a shift-left testing
  concern — see Decision 13 in CLAUDE.md for the full tradeoff analysis.

---

## Known Gaps — Future Work

### Keyboard Navigation — Snapshot Stepping
- The timeline slider is now keyboard-accessible (arrow keys move the slider handle)
  and correctly disabled when no snapshots are loaded
- **Remaining gap:** No keyboard shortcut to step through snapshots one at a time
  (e.g. left/right arrow on the timeline panel itself, outside the slider handle)
- **Needed:** Trap focus or roving tabindex on the timeline panel so developers
  can step through snapshots without precise slider dragging
- **WCAG reference:** Success Criterion 2.1.1 (Keyboard) — all functionality
  available via keyboard
- **Status:** Partially addressed (slider accessible); stepping UX not yet implemented

### Screen Reader Support for Timeline
- Snapshot state diffs are visual only — no ARIA live regions to announce changes
- **Needed:** `aria-live` regions so screen reader users hear state updates as they navigate the timeline
- **WCAG reference:** Success Criterion 4.1.3 (Status Messages), 1.3.1 (Info and Relationships)
- **Status:** Not yet implemented

### Focus Management
- Focus behavior when navigating between snapshots is currently unpredictable
- **Needed:** `aria-describedby` linking timeline position to snapshot content; logical focus order on navigation
- **WCAG reference:** Success Criterion 2.4.3 (Focus Order), 2.4.7 (Focus Visible)
- **Status:** Not yet implemented

### Color Contrast Audit
- Metrics displays and state diff views have not been audited for contrast ratios
- **Needed:** Minimum 4.5:1 contrast ratio for normal text, 3:1 for large text
- **WCAG reference:** Success Criterion 1.4.3 (Contrast Minimum)
- **Status:** Unaudited

---

## Guiding Principle

Accessibility in a developer tool matters — developers who use assistive technology deserve the same debugging experience as everyone else. Gaps noted above are known and prioritized for future iterations.
