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

---

## Known Gaps — Future Work

### Keyboard Navigation
- Timeline scrubber currently relies on mouse interaction
- **Needed:** Full keyboard operability — arrow keys to step through snapshots
- **WCAG reference:** Success Criterion 2.1.1 (Keyboard) — all functionality available via keyboard
- **Status:** Not yet implemented

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
