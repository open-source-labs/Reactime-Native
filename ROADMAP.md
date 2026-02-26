# Reactime Native — Roadmap

> **Status:** Active development — pre-npm release
> **Compliance target:** WCAG 2.1 Level AA (browser debugger UI)
> **Contribute:** [open-source-labs/Reactime-Native](https://github.com/open-source-labs/Reactime-Native)

---

## Milestone Overview

| Milestone | Theme | Status |
|---|---|---|
| [v0.2.0](#v020--core-functionality) | Core functionality complete | 🔧 In progress |
| [v0.3.0](#v030--npm-packaging) | npm packaging ready | 📋 Planned |
| [v1.0.0](#v100--production-release) | Production release | 📋 Planned |

---

## v0.2.0 — Core Functionality

These items complete the core value proposition of the tool: full state visibility and true time-travel replay.

### Blocking

- [ ] **Full Fiber tree capture** — Preserve the complete Fiber tree structure across serialization, not just stateful nodes. Will's work in progress on `feat/fiber-capture`. The frontend adapter layer (`normalizeFiberSnapshot.ts`) is already in place and waiting for the new data shape.

- [ ] **Bidirectional state replay** — Send a selected snapshot back through the WebSocket pipeline to rewind the RN app to that state. This is the "time-travel" in time-travel debugging; without it the tool is a state observer, not a state replayer.

### Supporting

- [ ] **Complete performance metrics serialization** — Extend commit metrics capture beyond the first render; ensure lag and first-render data is emitted consistently across the full app lifecycle.

---

## v0.3.0 — npm Packaging

These items make the tool installable via `npm install reactime-native` with a clean developer experience.

### API and Distribution

- [ ] **Clean npm package API** — Define the public entry point for the RN agent (`import { initReactimeNative } from 'reactime-native'`). Declare peer dependencies (`react`, `react-native`, `redux`). Set `main`, `types`, and `exports` fields in `package.json`.

- [ ] **Server distribution strategy** — Decide and implement how the WebSocket server is started: bundled CLI (`npx reactime-native`), separate package (`reactime-native-server`), or auto-started by the agent. This decision gates packaging.

- [ ] **Browser UI distribution** — Move the browser UI from a local Vite dev server to a distributable format: hosted web app, Chrome/Firefox DevTools panel, or bundled Electron app.

- [ ] **TypeScript types exported** — Ensure all public API types are explicitly exported for TypeScript consumers. Current strict mode coverage: 91.72%.

### Resilience

- [ ] **Browser-side WebSocket error boundaries** — Auto-reconnect is implemented on the RN side. The browser UI needs matching resilience: graceful degradation when the connection drops mid-session, reconnection with state preservation.

- [ ] **React error boundaries in browser UI** — Prevent a single component render failure from crashing the entire debugger.

### Documentation

- [ ] **Complete README** — Install instructions, configuration options, quick-start guide, and troubleshooting section targeted at developers adding Reactime Native to an existing RN project.

- [ ] **API reference** — Document all public configuration options for `initReactimeNative` and the WebSocket server.

---

## v1.0.0 — Production Release

These items bring the tool to production quality: polished UX, full accessibility compliance, and integration with the broader Reactime ecosystem.

### Integration

- [ ] **Reactime v.26 frontend UI integration** — Connect the RN-specific WebSocket/Redux pipeline to Reactime v.26's modern frontend, which was originally designed for the React/Chrome extension. Preserves the familiar Reactime developer experience for users coming from the web tool.

- [ ] **Chrome/Firefox DevTools panel** — Integrate the browser UI as a native DevTools panel rather than a separate browser window, matching the UX pattern developers expect from debugging tools.

### Accessibility (WCAG 2.1 AA gaps)

- [ ] **Contrast audit** — Full axe DevTools pass on all metrics displays, diff views, and component tree against the 4.5:1 minimum (WCAG 1.4.3). Metrics text and table cells not yet audited.

- [ ] **`aria-live` regions for snapshot changes** — Snapshot state changes are currently visual only. An `aria-live="polite"` region on the snapshot panel would announce updates to screen reader users as they navigate the timeline (WCAG 4.1.3 / 1.3.1).

- [ ] **Roving `tabIndex` in component tree** — Current implementation gives `tabIndex={0}` to every visible node header. APG recommends roving focus for large trees. Warranted when Will's full fiber tree serialization lands and node counts grow significantly.

### Performance and Quality

- [ ] **LCS array diffing in snapshot diff** — Arrays are currently compared atomically (via `JSON.stringify`). Element-level diffing via a Longest Common Subsequence algorithm would surface array insertions, deletions, and reordering as granular diff nodes. The `isPlainObject` boundary in `diffSnapshots.ts` is the explicit extension point.

- [ ] **Snapshot compression** — JSON snapshots of complex Fiber trees can produce large payloads. Evaluate delta compression or binary serialization for high-frequency state updates.

- [ ] **E2E tests (Detox)** — Current test coverage: unit (Vitest + RTL) and integration (real WebSocket server). Device-level behavior — native gesture handling, platform rendering, physical WebSocket connections — requires Detox E2E tests.

---

## Contributing

All roadmap items have corresponding GitHub Issues. Filter by milestone to find work at your level:

- 🔴 `blocking` — Must land before the next milestone ships
- 🟡 `enhancement` — Improvements that are planned but not blocking
- 🟢 `good first issue` — Well-scoped, documented, good entry point for new contributors
- ♿ `accessibility` — WCAG-related work

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions and contribution guidelines.

---

*Reactime Native is developed in partnership with [OSLabs](https://github.com/oslabs-beta).*
