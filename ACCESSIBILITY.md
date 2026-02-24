# Reactime Native — Accessibility

## Compliance Target

**WCAG 2.1 Level AA** for the browser debugger UI.

---

## Status

### Implemented

#### 1.4.1 Use of Color
- Connection status indicator communicates state visually **and** with text — not color alone
- **Rationale:** Supports users who cannot distinguish color states. The status chip shows both a color and a text label (e.g. "OPEN", "CLOSED").
- **WCAG:** SC 1.4.1 — color is not the only visual means of conveying information

#### 4.1.3 Status Messages
- Explicit error messages surfaced in the UI rather than silent failures
- **Rationale:** Opaque failures are an accessibility barrier. Developers need to know *why* a connection failed, not just that it did.
- **Test coverage:** `server.test.ts` integration tests verify malformed JSON does not crash the server process — the server must stay alive to surface error state.

#### 4.1.2 Name, Role, Value — Timeline Slider
- `aria-label="timeline slider"` applied to `<Slider>` unconditionally
- `disabled={true}` when `snapshotsLength === 0` (slider is inert but always rendered)
- `role="group"` + `aria-label="Snapshot timeline"` on the outer wrapper div
- rc-slider handle automatically receives `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- **Rationale:** An unlabeled slider is invisible to screen readers. The wrapper group label gives screen reader users context before they encounter the handle.
- **Engineering note:** See Decision 13 in CLAUDE.md for the shift-left + WCAG tradeoff analysis.

#### 2.1.1 Keyboard — Timeline Scrubber
- Arrow keys on the slider handle step through snapshots one index at a time
- rc-slider's native `onKeyDown` fires `onChange` → `handleSliderChange` → `dispatch(jumpToSnapshot)` — the Redux store updates on every keystroke
- `disabled` when no snapshots are loaded, so the inert control is not in the tab order
- **WCAG:** SC 2.1.1 — all functionality available via keyboard

#### 2.4.7 Focus Visible — Slider Handle
- Teal box-shadow focus ring (`0 0 0 3px rgba(20,184,166,0.45)`) applied via `.rc-slider-handle:focus` in `global.scss`
- rc-slider's default CSS suppresses the native outline; the custom ring restores a visible indicator that matches the design system
- **WCAG:** SC 2.4.7 — keyboard focus indicator is visible

---

### In Progress

#### 4.1.3 / 1.3.1 — Screen Reader Support for Timeline
- Snapshot state changes are visual only — no ARIA live regions to announce updates
- **Needed:** `aria-live="polite"` region on the snapshot panel so screen reader users hear state updates as they navigate the timeline
- **Status:** Deferred; tracked for next iteration

---

### Planned

#### 2.4.3 Focus Order
- Focus behavior when navigating between snapshots is currently unpredictable
- **Needed:** Logical focus order on timeline navigation; `aria-describedby` linking timeline position to snapshot content
- **Status:** Not yet implemented

#### 1.4.3 Contrast Minimum
- Metrics displays and state diff views have not been audited for contrast ratios
- **Needed:** Minimum 4.5:1 for normal text, 3:1 for large text — full audit with axe DevTools
- **Status:** Unaudited

---

## How to Audit Locally

1. Install the [axe DevTools browser extension](https://www.deque.com/axe/devtools/) (Chrome or Firefox)
2. Start the debugger UI: `cd client && npm run dev`
3. Open http://localhost:5173 in your browser
4. Open DevTools → axe DevTools tab → **Scan all of my page**
5. Review violations — filter by WCAG 2.1 AA to match our compliance target
6. For keyboard testing: tab through the UI, verify the focus ring is visible on the slider handle, press arrow keys to step through snapshots

---

## Guiding Principle

Accessibility in a developer tool matters — developers who use assistive technology deserve the same debugging experience as everyone else. Gaps noted above are known and prioritized for future iterations.
