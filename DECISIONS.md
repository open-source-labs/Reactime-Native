# Architectural Decision Log

This document records key engineering decisions made during the development of Reactime Native: what we decided, why, what alternatives we considered, and what tradeoffs we accepted.

Dates reflect when the decision was actively discussed and confirmed — not necessarily the date code was merged. This log will be updated as new decisions are made.

---

## How to Read This Log

Each entry follows this structure:

- **Decision** — what we chose
- **Context** — why the decision needed to be made
- **Alternatives considered** — what else was on the table
- **Rationale** — why we chose what we chose
- **Tradeoffs accepted** — what we gave up
- **Status** — `confirmed` | `revisit` | `superseded`

---

## Decision 001 — WebSockets as the Transport Layer

**Date:** September 2025
**Status:** Confirmed

**Decision:** Use the native WebSocket API (not Socket.IO or other abstractions) for bidirectional communication between the React Native app, the relay server, and the browser debug UI.

**Context:** Reactime Native needs persistent, real-time, bidirectional communication across three runtime environments that share no memory: the React Native mobile app (where the Fiber tree lives), a Node.js relay server, and a browser-based debugging UI. A transport protocol had to be chosen before meaningful architecture work could proceed.

**Alternatives Considered:**

| Option | Why We Considered It | Why We Rejected It |
|---|---|---|
| Socket.IO | Auto-reconnect, rooms/namespaces, broad familiarity | Historically buggy in React Native; requires matching client/server versions; adds ~40KB; abstraction layer obscures errors |
| HTTP Polling | Simple to implement | Inefficient and laggy; not suitable for real-time state streaming |
| Server-Sent Events (SSE) | Simple, built-in reconnect | Unidirectional only — cannot send commands from browser back to mobile app |
| gRPC-web | Typed contracts, streaming support | Heavy setup overhead; poor React Native support; significant overkill for this use case |

**Rationale:** WebSockets are the standard protocol for developer tooling requiring live bidirectional communication — Chrome DevTools, React DevTools, and Flipper all use WebSocket-based protocols for the same reason. Native WebSocket API works in both React Native and the browser without additional dependencies, giving us full control over connection lifecycle and message format.

**Tradeoffs Accepted:** We are responsible for implementing reconnection logic and error handling manually, rather than relying on Socket.IO's built-in abstractions. This is additional work but gives us more predictable behavior in the React Native environment specifically.

---

## Decision 002 — Fork-and-Refactor Over Greenfield Rewrite

**Date:** February 2026
**Status:** Confirmed

**Decision:** Refactor the existing Reactime Native codebase rather than rewrite from scratch, after the project stalled due to WebSocket connectivity issues.

**Context:** The project stalled when WebSocket connections failed inconsistently across team members' devices. With the original team no longer active and one contributor picking up the work, the question was whether to fix the existing codebase or start over.

**Alternatives Considered:**

| Option | Pros | Cons |
|---|---|---|
| Greenfield rewrite | Clean slate; no inherited technical debt | 2–3x time cost; loses commit history and OSP contribution record; risk of reintroducing solved problems |
| Fork-and-refactor | Preserves architecture, history, and working components | Inherits existing patterns and any unresolved technical debt |

**Rationale:** Diagnosis of the codebase revealed that the *architecture* was sound — the three-part relay pipeline (RN app → WebSocket server → browser UI) was the right design. The failures were environmental: hardcoded IP addresses that broke when DHCP leases changed, and message serialization bugs introduced by AI-assisted autocomplete. These are configuration issues, not architectural flaws. A rewrite would have rebuilt the same architecture with new risk.

**Tradeoffs Accepted:** We inherited some patterns and code written by teammates who were no longer available to explain intent. This required careful code reading and some refactoring to improve clarity and maintainability.

**What This Means for the Codebase:** Rewrites are rarely justified by "the code is messy." They are justified when the architecture is fundamentally wrong or the technology stack is incompatible with requirements. Neither was true here.

---

## Decision 003 — Redux Toolkit for Browser UI State Management

**Date:** September 2025 (implemented); rationale articulated February 2026
**Status:** Confirmed

**Decision:** Use Redux Toolkit with `createSlice` for state management in the browser debugging UI, rather than local React component state or a lighter alternative like Zustand.

**Context:** The browser UI needs to manage a growing array of state snapshots received over WebSocket, track a `currentIndex` for time-travel scrubbing, and synchronize multiple components (timeline slider, snapshot view, metrics panel) to the same data simultaneously. The choice of state management approach shapes the entire UI architecture.

**Alternatives Considered:**

| Option | Why We Considered It | Why We Rejected It |
|---|---|---|
| Local React state (`useState`) | Simple, no dependencies | Prop-drilling across multiple deep components; no clean way to synchronize timeline position with snapshot view and metrics simultaneously |
| React Context | Built-in, no extra library | Re-renders entire tree on every snapshot update; performance degrades quickly with large snapshot histories |
| Zustand | Lightweight, minimal boilerplate | Less ecosystem tooling; team was more familiar with Redux patterns |
| Redux Toolkit | Industry standard, excellent DevTools, predictable | Heavier boilerplate than alternatives; steeper learning curve |

**Rationale:** The snapshot history array is inherently global state — multiple components need to read from it, and `currentIndex` needs to be a single source of truth across the timeline scrubber, snapshot view, and metrics panel simultaneously. Redux's unidirectional data flow makes the synchronization predictable and testable. Redux Toolkit's `createSlice` significantly reduces boilerplate, and typed `PayloadAction<T>` selectors improve reliability during TypeScript strict mode migration.

**Tradeoffs Accepted:** Redux is a heavier lift than simpler alternatives. The initial setup — configuring the store, writing slices, connecting WebSocket middleware — required meaningful upfront investment. In hindsight, this investment paid off in testability and predictable state behavior.

---

## Decision 004 — Serialized JSON Snapshots Over In-Memory Objects

**Date:** September–October 2025
**Status:** Confirmed

**Decision:** Serialize all Fiber tree snapshots to JSON before transmission and storage, rather than passing in-memory JavaScript objects through the pipeline.

**Context:** Snapshots of the React Fiber tree need to travel from the React Native app, through a Node.js WebSocket server, to a browser UI. These three environments share no memory space. A format had to be chosen for snapshot data in transit and at rest in the Redux store.

**Alternatives Considered:**

| Option | Consideration |
|---|---|
| In-memory JavaScript objects | Cannot cross runtime boundaries; would require a different architecture for each hop |
| Binary serialization (e.g., MessagePack) | More efficient at scale; adds complexity and tooling overhead; harder to debug |
| JSON serialization | Universal, human-readable, debuggable, works across all three environments |

**Rationale:** JSON is the lingua franca of cross-runtime communication. Beyond the technical requirement of crossing runtime boundaries, JSON serialization provides a secondary benefit: snapshots become portable artifacts. A developer can save, share, or log a snapshot history for async debugging — exactly what our Priya persona needs when she can't reproduce a bug live.

**Tradeoffs Accepted:** JSON is verbose compared to binary formats and serialization adds overhead. Complex or deeply nested Fiber trees can produce large payloads. For the current MVP scale this is acceptable; at larger scale, snapshot diffing or compression may be warranted.

**Known Limitation:** React Fiber nodes contain non-serializable values (functions, class instances, circular references). Preprocessing is required to strip or replace these before serialization. This preprocessing step is a potential source of data loss — some Fiber properties may be omitted from snapshots.

---

## Decision 005 — Browser-Based Debug UI Over In-App Overlay

**Date:** September 2025 (implicit in original architecture)
**Status:** Confirmed

**Decision:** Render the debugging interface in a browser window rather than as an overlay within the React Native app itself.

**Context:** A debugging interface needs to display somewhere. The two primary options were: embed it in the mobile app as a draggable overlay (similar to how some performance monitors work), or run it as a separate browser-based application.

**Alternatives Considered:**

| Option | Pros | Cons |
|---|---|---|
| In-app overlay | No separate environment needed; always co-located with app | Adds rendering overhead to the device; competes for screen space; harder to build rich UI on small screen; debug UI crashes affect app |
| Flipper plugin | Established integration path | Flipper has been deprecated by Meta; unreliable across RN versions |
| Browser-based UI (chosen) | Full screen; rich visualization; no device performance impact; familiar web dev stack | Requires cross-environment communication; more complex architecture |

**Rationale:** Keeping the debug UI in the browser means the heavy lifting — rendering timelines, diffing snapshots, displaying tree visualizations — happens on the developer's machine, not the device being debugged. This is the same principle used by Chrome DevTools and React DevTools for web. It also means the debug UI can be built with familiar web technologies (React, CSS, D3) rather than React Native UI primitives.

**Tradeoffs Accepted:** This choice requires the three-part WebSocket pipeline that is the primary architectural complexity of the project. A simpler in-app approach would have avoided that complexity at the cost of device performance and UI flexibility.

---

## Decision 006 — TypeScript Strict Mode

**Date:** February 2026
**Status:** Confirmed

**Decision:** Migrate the codebase to TypeScript strict mode (`"strict": true` in tsconfig), replacing implicit `any` types throughout.

**Context:** The codebase was initially written with permissive TypeScript — many implicit `any` types, especially around Fiber tree traversal functions and WebSocket event handlers. This made the code easier to write initially but harder to maintain and refactor safely.

**Rationale:** The React Native Fiber tree has an inconsistent, undocumented structure. Properties on Fiber nodes (`memoizedState`, `child`, `sibling`, `elementType`) do not always exist. Strict mode forces explicit handling of these nullable properties at compile time, surfacing potential runtime crashes before they happen. This is especially important for a debugging tool — a tool that crashes is worse than no tool.

**Outcome:** After migration, type coverage measured at **91.72% across 2,599 type nodes** (measured with `type-coverage` npm package). The remaining ~8% consists primarily of Fiber node properties where the React internals are genuinely untyped and require `any` as an honest acknowledgment of that uncertainty.

**Tradeoffs Accepted:** Strict mode required significant upfront work to add null guards, explicit interface definitions, and typed Redux action payloads. It slowed initial development velocity in exchange for long-term refactoring safety and better contributor onboarding (typed selectors and interfaces reduce the cognitive load for new contributors reading the codebase).

---

## Decision 007 — Dynamic IP Resolution for WebSocket Connections

**Date:** February 2026
**Status:** Confirmed

**Decision:** Replace hardcoded IP addresses in the React Native app's WebSocket connection configuration with dynamic IP resolution via environment variables or auto-detection.

**Context:** The original codebase contained hardcoded IP addresses for the WebSocket server. This worked on the original developer's machine but broke silently for any other contributor or on any network where the DHCP lease had changed — which was the root cause of the "inconsistent connection failures" that stalled the project.

**Alternatives Considered:**

| Option | Consideration |
|---|---|
| Hardcoded IP | Zero setup; breaks on every new machine/network |
| Environment variable (`.env`) | Explicit configuration; requires each developer to set their own IP |
| ngrok tunnel | Allows remote/cross-network connections; requires account; introduces external dependency |
| Auto-detection via `Constants.expoConfig` | Works automatically in Expo environments; most ergonomic for contributors |

**Decision:** Implement auto-detection as the primary path, with environment variable override as a fallback. This means new contributors can clone and run without manual network configuration in most cases.

**Tradeoffs Accepted:** Auto-detection adds a small amount of code complexity. The ngrok path remains documented for contributors who need to test across different networks (e.g., physical device on a different subnet from the dev machine).

---

## Decision 008 — WCAG 2.1 AA Accessibility Compliance in the Browser UI

**Date:** February 2026
**Status:** In Progress

**Decision:** Treat WCAG 2.1 AA compliance in the browser debugging UI as a first-class engineering requirement, not a post-launch addition.

**Context:** Reactime Native is a tool built to help developers build better apps — including accessible apps. A debugging tool that developers with disabilities cannot use undermines that mission and narrows the field of who can contribute to or benefit from the project.

**Scope of Commitment:**
- Keyboard-navigable timeline scrubbing (no mouse required) — implemented
- Proper ARIA roles and labels on all interactive components in the browser UI — substantially implemented; remaining gap is an `aria-live` region for state change announcements
- Full contrast audit against WCAG 1.4.3 (4.5:1 minimum) — not yet audited
- High-contrast theme toggle — open
- Color-independent indicators in the metric panel diff view (shape/label in addition to color) — open

**Rationale:** Accessibility in developer tooling is underserved. Most dev tools treat it as an afterthought. This is a deliberate differentiator for Reactime Native and reflects the team's values around inclusive design. It is also consistent with the shift-left principle — embedding accessibility from the start costs significantly less than retrofitting it later.

**Status:** Partially implemented. ARIA labels and keyboard navigation are in progress. High-contrast theme and color-independent diff indicators are open roadmap items. Contributions welcome — see `CONTRIBUTING.md`.

---

## Decision 009 — One-Way Data Flow (MVP Scope)

**Date:** February 2026
**Status:** Confirmed — bidirectional flow is a planned future iteration

**Decision:** Ship one-way data flow first (React Native app → browser UI). Treat bidirectional state injection (browser UI → React Native app) as a future iteration.

**Context:** The original goal included true time-travel: rewinding state back into the running RN app. This required a reverse channel from the browser UI back through the WebSocket server into the RN app's Redux store — and was the primary scope blocker that stalled the project.

**Rationale:** One-way flow delivers the core value: observing state over time. The browser UI already has full snapshot history and can scrub, diff, and replay. Bidirectional flow adds significant implementation complexity — state injection into a running RN app requires reconciling the injected state with the live component tree — with high risk of blocking a working MVP indefinitely.

**Tradeoffs Accepted:** The tool is currently an observer, not a controller. Developers cannot jump to a snapshot and have the RN app reflect that state. This is the highest-value feature on the roadmap. The existing WebSocket pipeline supports it — this is a scope decision, not an architectural limitation.

---

## Decision 010 — normalizeFiberSnapshot as Adapter Layer

**Date:** February 2026
**Status:** Confirmed

**Decision:** Extract `normalizeFiberSnapshot.ts` as an adapter between raw snapshot payloads and the `FiberNode` type consumed by `ComponentTree`, rather than building `ComponentTree` directly against the current snapshot shape.

**Context:** Full fiber tree serialization (in progress on `feat/fiber-capture`) will produce a different data shape than the current flat snapshot object. Building `ComponentTree` directly against the current shape would require a full component refactor when that work lands.

**Alternatives Considered:**

| Option | Consideration |
|---|---|
| Build ComponentTree against current flat shape | Simpler now; requires full refactor when fiber shape lands |
| Adapter layer (chosen) | One extra indirection; ComponentTree and its tests remain stable across shape changes |

**Rationale:** The data shape change is a known, imminent event on a named branch — not speculative future-proofing. The adapter isolates the transformation concern so `ComponentTree`, its tests, and all visual behavior are unaffected when the shape changes. Only `normalizeFiberSnapshot.ts` needs updating, and that contract is documented explicitly at the top of the file.

**Tradeoffs Accepted:** One extra indirection layer. Justified because the upcoming shape change is certain, not hypothetical.

---

## Decision 011 — React Native Component Testing: RTL + jsdom Over react-test-renderer

**Date:** February 2026
**Status:** Confirmed

**Decision:** Use `@testing-library/react` with jsdom and `vi.mock` shims to test React Native components, rather than `react-test-renderer` or `@testing-library/react-native`.

**Context:** React Native components use primitives and platform APIs unavailable in a Node.js test environment. Three approaches were evaluated before settling on the current strategy.

**Alternatives Considered:**

| Option | Why Rejected |
|---|---|
| `react-test-renderer` | Deprecated in React 18/19; peer dependency version conflicts with react@19 |
| `@testing-library/react-native` | Requires Babel transforms (`babel-jest`, `babel-preset-react-native`); conflicts with Vitest/esbuild's ESM-native architecture — two competing transform pipelines |
| `@testing-library/react` + jsdom (chosen) | Works natively with Vitest/esbuild; no Babel config required; matches existing client test toolchain |

**Decision:** Three-part shim strategy in RN component test files:
1. `vi.mock('react-native')` — replace View/Pressable/Text with DOM-compatible elements (div/button/span)
2. `vi.stubGlobal('WebSocket', MockWebSocket)` — replace global WebSocket with a controllable vi.fn() factory
3. `vi.mock('./wsConfig')` — return a fixed URL; no Expo/Platform resolution runs

**Tradeoffs Accepted:** Real layout, native gesture handling, and platform-specific rendering are not covered. Acceptable for unit testing logic and behavior; native rendering requires a device or Detox E2E tests. Contributors writing RN component tests should follow this same three-part shim pattern.

---

## Decisions Under Consideration

| Topic | Question | Notes |
|---|---|---|
| Bidirectional time-travel | Should the browser UI be able to send "jump to snapshot X" commands back to the mobile app to hot-reload state? | Technically feasible with the existing WebSocket pipeline; significant implementation work; highest-value feature for the core use case |
| Snapshot diffing | Should the metrics panel show diffs between snapshots rather than (or in addition to) full snapshots? | Would reduce payload size and improve readability for large component trees |
| Flipper plugin | Should RTN offer a Flipper integration path? | Flipper has been deprecated by Meta; likely not worth investment |
| New Architecture / Fabric support | How does RTN's Fiber tree traversal need to change for RN's New Architecture? | Significant open question as New Architecture adoption grows |

---

*Last updated: February 2026. To propose a new decision entry, open an issue tagged `architecture`.*
