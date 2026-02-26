# Reactime Native

## What This Project Is
An open-source time-travel debugging tool for React Native developers.
It captures Redux state snapshots in a running React Native app and streams
them to a browser-based UI, enabling developers to scrub through state history
and debug state management issues.

## Team & Contributions

**Published Medium article:** [Reactime Native: Time-Travel Debugging for React Native](https://medium.com/@ansara.hooks/coming-soon-reactime-for-react-native-c8b1c603d205)

**Jamila Gibson** — Scrum lead, Jira board manager
- **State management:** Redux state architecture, scoped Redux actions
- **Testing:** Implemented Vitest testing suite, mocked and tested
  React Native → WebSockets → React Browser data flow
- **Networking:** Fixed and implemented bidirectional WebSocket data flow,
  dynamic IP resolution, auto-reconnect with exponential backoff,
  connection status visibility in UI
- **UI components:** Built snapshot viewer, timeline scrubber and playback controls,
  metrics panel, snapshot diff view, component tree visualization, and connection
  status indicator; rendered data stream simulation in browser
- **Accessibility:** WCAG 2.1 AA compliance — keyboard navigation (2.1.1),
  focus visibility (2.4.7), name/role/value (4.1.2), use of color (1.4.1)

**Ansara**
- **Infrastructure:** npm package creation
- **Networking:** Established WebSocket connection

**Will**
- **React Native layer:** Fiber tree access and traversal
- **Data pipeline:** Serialized stateful data into JSON for WebSocket streaming
- **State management:** Redux middleware for socket/WebSocket message handling
- **In progress:** Full fiber tree capture (currently capturing stateful data
  at each node only), reformatting data shape to comply with Reactime's frontend

---

## Tech Stack
- **React Native** (demo app)
- **TypeScript** (strict mode)
- **Redux Toolkit** (state capture + browser UI state)
- **WebSockets** (real-time bridge between RN app and browser UI)
- **Vitest + React Testing Library** (testing)
- **Node.js** (WebSocket server)

---

## Architecture Overview

### Data Flow
```
React Native App
  → Redux middleware intercepts state changes
  → WebSocket client sends snapshots to Node server
  → Browser UI receives and renders timeline
```

### Key Components
- **WebSocket server** — Node.js bridge between RN app and browser UI
- **Redux middleware** — intercepts dispatched actions and captures state diffs
- **Browser UI** — timeline scrubber, snapshot viewer, state diff display
- **Demo app** — React Native app used to test the debugger itself

---

## Engineering Decision Log

### Decision 1: Refactor vs. Rewrite
**Context:** Project stalled due to WebSocket connectivity failures across
different dev environments.

**Decision:** Refactor existing codebase.

**Rationale:** The three-part relay architecture (RN agent → WebSocket server
→ browser debugger) was sound. The failure was in IP configuration, not design.
Rewrites are only justified when the architecture itself is wrong.

**Tradeoff:** Speed and preserved Git history vs. a clean slate.

---

### Decision 2: Native WebSocket vs. Socket.IO vs. Alternatives
**Context:** Needed real-time communication between RN app and browser UI.

**Decision:** Native WebSocket API — no Socket.IO or abstraction layer.

**Alternatives considered:**
- Socket.IO — adds ~40KB, historically causes compatibility issues in React Native
- Server-Sent Events — unidirectional only
- gRPC-web — heavy setup, poor RN support
- Polling — too laggy for a real-time debugger

**Tradeoff:** Manual reconnection logic in exchange for full control,
zero dependencies, and reliable RN compatibility.

---

### Decision 3: One-Way Data Flow (MVP Scope)
**Context:** Initial goal included bidirectional flow for true time-travel
(rewinding state back into the RN app). This was the primary blocker causing
the project stall.

**Decision:** Ship one-way flow first (RN app → browser UI). Treat
bidirectional as a future iteration.

**Rationale:** One-way flow delivers the core value — observing state over
time. Bidirectional adds significant complexity with high risk of blocking
a working MVP indefinitely.

**Tradeoff:** Reduced scope in exchange for a shippable, demonstrable tool.

---

### Decision 4: Redux Toolkit Slice Architecture
**Context:** Browser UI needed to manage snapshot history, timeline index,
and performance metrics without prop drilling.

**Decision:** Feature-based slices (`snapshotSlice`, `metricSlice`) with a
centralized WebSocket listener routing messages by channel type using a
unified message envelope: `{ channel, type, payload }`.

**Tradeoff:** Higher initial setup vs. simpler local state, justified by
the number of components requiring shared access to snapshot history.

---

### Decision 5: Props-Based SnapshotView
**Context:** Needed `SnapshotView` to be testable in isolation.

**Decision:** Pass data via props rather than connecting directly to Redux.
`MainContainer` owns the store connection and passes data down.

**Tradeoff:** More wiring in the container, but `SnapshotView` is independently
testable and reusable without a Redux provider.

---

### Decision 6: Mocked Tests vs. Live Integration Tests
**Context:** WebSocket-dependent components need test coverage without
requiring a live RN app, server, and browser UI running simultaneously.

**Decision:** Mock `react-redux`, stub WebSocket connections, use synthetic
snapshot data.

**Tradeoff:** Mocks don't catch integration failures, but tests run reliably
in CI and provide fast feedback during development.

---

### Decision 7: wsConfig.ts for Dynamic IP Resolution (RN Side)
**Context:** The RN demo app had a hardcoded IP address (`10.0.0.157`) pointing
to one developer's laptop. This broke the WebSocket connection on any other
machine. A previous attempt using Expo's `Constants.manifest` APIs was
commented out because it wasn't reliable across SDK versions.

**Decision:** Extract IP resolution into a dedicated `wsConfig.ts` module
with a prioritized fallback chain:
1. `EXPO_PUBLIC_WS_HOST` env var — explicit override for any machine
2. `Constants.expoConfig?.hostUri` — Expo Go / dev client auto-detection
3. `10.0.2.2` on Android — routes to host machine from an emulator
4. `'localhost'` — safe fallback for iOS simulator

**Rationale:** Centralizing resolution in one file makes the logic auditable
and testable. Any developer can set `EXPO_PUBLIC_WS_HOST=<their LAN IP>` in
`.env.local` without touching application code. The fallback chain means it
works out of the box in most environments with zero config.

**Tradeoff:** Slightly more indirection vs. a one-liner hardcode, but removes
a class of environment-specific bugs that previously blocked the whole team.

**Follow-up (caught by tests):** Writing the unit tests revealed that the
initial implementation passed the env var directly into the URL template
without sanitization. A value like `ws://192.168.1.1` would produce
`ws://ws://192.168.1.1:8080`; `192.168.1.1:9999` would produce
`ws://192.168.1.1:9999:8080`. Both are syntactically valid URLs that fail
silently at connection time. A `sanitizeHost()` helper was added to strip
any leading scheme and embedded port before interpolation.

---

### Decision 8: Shift-Left Testing for wsConfig.ts
**Context:** `WS_URL` is computed at module load time — a silent failure
(e.g. `ws://undefined:8080` or `ws://:8080`) would pass code review, build
successfully, and only surface at runtime on a physical device.

**Decision:** Write unit tests covering all four fallback steps in the
priority chain, the contract shape (`ws://<host>:8080`), and the three
silent failure modes before wiring the module into the app.

**Rationale:** These bugs are cheap to catch in CI and expensive to catch
on a device. Testing the failure modes (`undefined`, empty string, unusual
port) makes the shift-left intent explicit rather than incidental.

**Tradeoff:** Requires `vi.resetModules()` + `vi.doMock()` + dynamic
`import()` per test to re-evaluate a module with top-level side effects —
slightly more setup than standard mocking, but necessary given the
module's architecture.

---

### Decision 9: Server Refactor for Testability
**Context:** `server.js` had a top-level side effect — importing the file
immediately started a WebSocket server on port 8080, binding the port at
require-time. This made isolated unit testing impossible without spinning up
a real server for every test run.

**Decision:** Extracted `broadcast(wss, senderWs, parsed)` as a named function,
wrapped server construction in a `createServer(port, host)` factory, and added
a `require.main === module` guard to separate library behavior from CLI behavior.
Added `module.exports = { broadcast, createServer }` to expose both for tests.

**Rationale:** The `require.main === module` pattern is idiomatic Node.js — it's
what makes npm packages testable without special setup. Extracting `broadcast()`
allows the routing logic (sender exclusion, non-OPEN client skipping, single-client
echo) to be tested with mock objects and zero I/O.

**Tradeoff:** Slightly more indirection in the server file, but `broadcast()` is
now pure and `createServer()` is side-effect-free on import — the cost is minimal
and the gain in testability is significant.

---

### Decision 10: Layered Server Testing Strategy (Unit + Integration)
**Context:** Server logic has two distinct failure surfaces: routing algorithm
correctness (pure logic) and network behavior correctness (real TCP, frame parsing,
malformed input, disconnect handling).

**Decision:** Two test layers in `server.test.ts`:
- **Unit tests** — mock `ws` client objects, test `broadcast()` in pure isolation
- **Integration tests** — real `WebSocketServer` on port 8081, real connections,
  `beforeEach`/`afterEach` teardown for clean state

**Rationale:** Unit tests catch logic bugs instantly without I/O. Integration tests
catch seam failures — malformed JSON that crashes the process, connections that
close mid-message, the single-client echo path under real TCP. Both layers together
give confidence the unit shipped matches the unit tested.

**Tradeoff:** Integration tests are slower and port-dependent; flaky if port 8081
is occupied. Mitigated by explicit teardown and a dedicated test port.

---

### Decision 11: React Native Component Testing — RTL over react-test-renderer
**Context:** `MobileSample.tsx` uses React Native primitives (View, Pressable,
Text) and opens a native WebSocket connection on mount. Neither works in a Node.js
test environment. An initial implementation used `react-test-renderer`, but that
package was deprecated in React 18/19. Three alternatives were evaluated:

1. **`react-test-renderer`** — deprecated; React team explicitly recommends
   migrating away. Peer dependency version pinning caused install friction
   (`react@19.1.0` vs. renderer requiring `^19.2.4`).
2. **`@testing-library/react-native`** — the RTL equivalent for real RN primitives,
   but requires Babel transforms (`babel-jest`, `babel-preset-react-native`) to
   handle RN's non-standard JS. Adding Babel inside a Vitest project introduces
   two competing transform pipelines (esbuild + Babel), which is fragile,
   poorly documented, and conflicts with Vite's ESM-native architecture.
3. **`@testing-library/react` + jsdom** — DOM-focused RTL. Works natively with
   Vitest/esbuild. No Babel required. Compatible with the existing `client/`
   test setup.

**Decision:** Use `@testing-library/react` with jsdom and a three-part shim
strategy in `MobileSample.unit.test.tsx`:
1. **`vi.mock('react-native')`** — replace View/Pressable/Text with DOM-compatible
   elements (div/button/span); RTL queries against this real DOM via jsdom
2. **`vi.stubGlobal('WebSocket', MockWebSocket)`** — replace global WebSocket with
   a vi.fn() factory returning a controllable mock socket
3. **`vi.mock('./wsConfig')`** — return a fixed URL, no env/Expo/Platform resolution

A `// @vitest-environment jsdom` per-file directive overrides the environment for
the unit test only, keeping the integration test in `node`.

**Rationale:** Since react-native is already shimmed to DOM elements, the component
renders as HTML — RTL + jsdom is the natural fit. It stays entirely within the
Vitest/esbuild ecosystem, requires no Babel config, and matches the toolchain
already in use in `client/`. Buttons are queried by accessible role + name
(`getByRole('button', { name: '+1' })`), which is more resilient to refactors
than internal tree traversal.

**Tradeoff:** Real layout, native gesture handling, and platform-specific rendering
are not covered. Acceptable for unit testing logic; native behavior requires a
device or Detox E2E tests.

---

### Decision 12: Three-Layer Integration Test (wsConfig → WebSocket → Redux)
**Context:** The three layers of the data pipeline (URL resolution, WebSocket
transport, Redux state update) were tested in isolation but never together.
A silent composition failure — correct config, correct transport, wrong slice
dispatch — would not be caught by any existing test.

**Decision:** `websocket.integration.test.ts` validates the full pipeline in one
test suite, organized by layer:
- **Layer 1:** `wsConfig` resolves the correct URL from `EXPO_PUBLIC_WS_HOST`
- **Layer 2:** Real `ws` server on port 8081 + native WebSocket clients for
  connect, send, broadcast, and sender-exclusion assertions
- **Layer 3:** Inline `snapshotSlice` + `configureStore` verifying `addSnapshot`
  updates store state and fires subscribed listeners
- **Full round trip:** RN client → server broadcast → browser client → Redux store

**Rationale:** Integration tests catch the seams — the points where the layers
hand off to each other. The round-trip test is the highest-confidence assertion
we have that the system works as a whole before connecting real devices.

**Tradeoff:** Requires real port binding and teardown; `snapshotSlice` is inlined
rather than imported from `client/` to keep the test self-contained without
cross-package imports. The inline slice mirrors the real one and is kept minimal.

---

### Decision 13: TimelineSlider Empty State — Always-Render with Disabled Slider
**Context:** `TimelineSlider` had an early-return guard that rendered an empty
state message ("No snapshots available...") when `snapshotsLength === 0`. A unit
test was written expecting a slider with `max=0` — the test and component were out
of sync after the guard was added. Two options were evaluated against shift-left
principles and WCAG 2.1 AA:

- **Option A** — accept the empty state message, update the test to assert it.
  Shift-left concern: the `safeMax`/`safeValue` boundary math for the zero case
  becomes untestable (component early-returns before the slider renders).
  WCAG benefit: a plain `<p>` is semantically clean, no inert interactive elements.
- **Option B** — always render the slider; pass `disabled` and `aria-label` when
  `snapshotsLength === 0`. Shift-left benefit: full boundary coverage preserved.
  WCAG benefit: `aria-label="timeline slider"` satisfies 4.1.2 (Name, Role, Value);
  `disabled` satisfies 2.1.1 (Keyboard) by making the inert control non-focusable.

**Decision:** Option B. Always render `<Slider>`, pass `disabled={isEmpty}` and
`aria-label="timeline slider"`. `isEmpty = snapshotsLength === 0`.

**Rationale:** Option B satisfies both requirements simultaneously. The shift-left
coverage gap in Option A was real — the zero-snapshot boundary case is exactly the
kind of silent edge case shift-left is meant to catch. Option A without accessibility
attributes would fail WCAG 4.1.2 and 2.1.1; Option B with attributes satisfies both.

**Tradeoff:** Slightly more component state (`isEmpty` flag, conditional `disabled`
prop) vs. the simpler early-return. The overhead is minimal; the gain is full test
coverage of the zero-snapshot math and WCAG 2.1 AA compliance for the slider.

---

### Decision 14: SnapshotView Test Realignment and Anchored Regex Pattern
**Context:** `SnapshotView` tests were written when the component used `useSelector`.
After the component was refactored to be props-based (Decision 5), the tests were
never updated — they mocked `react-redux` (which `SnapshotView` no longer imports)
and called `render(<SnapshotView />)` with no props. All six tests failed silently:
rendered `Total: | Index: ` because props were `undefined`.

A secondary issue: non-anchored regex patterns like `/Total:\s*3\s*\|\s*Index:\s*1/i`
match any element whose `textContent` contains the substring — including parent
container divs. RTL's `getByText` throws when multiple elements match.

**Decision:** (1) Remove the `react-redux` mock — `SnapshotView` is props-based
and never imports it. (2) Pass explicit props in each `render()` call, mirroring
the real call site in `MainContainer`. (3) Use anchored regexes
(`/^Total:\s*3\s*\|\s*Index:\s*1$/i`) for Total|Index assertions and function
matchers scoped to `<pre>` for JSON content assertions.

**Rationale:** Aligns tests with the component's actual interface. Tests now
document exactly what `MainContainer` passes, making them readable as a specification.
Anchored regexes are the correct RTL pattern when target text appears as a substring
in parent container `textContent` — they prevent false positives without requiring
brittle `data-testid` coupling.

**Tradeoff:** Tests are more verbose (explicit props per test vs. shared mock state).
Each test is now self-contained and readable without cross-referencing mock setup —
the verbosity is a feature.

---

### Decision 15: TimelineControls — Stale Closure Prevention via useRef
**Context:** The play/pause interval needs to read `currentIndex` and
`snapshotsLength` at callback execution time. Both are Redux state values;
reading them directly inside `setInterval` produces stale closures — the
callback captures the values at creation time, not when it fires. The
interval ID itself cannot live in Redux because timer IDs are not serializable.

**Decision:** Store `currentIndex` and `snapshotsLength` in refs
(`currentIndexRef`, `snapshotsLengthRef`) updated on every render via
`useEffect`. The interval callback reads from refs. The interval ID lives
in `intervalRef`, not Redux state.

**Rationale:** Refs are synchronously updated before the next timer tick.
This pattern is more predictable than `useCallback` with deps because it
doesn't recreate the interval on every state change, eliminating the risk
of missing a tick during rapid state updates.

**Tradeoff:** More verbose component state (three refs) vs. `useCallback`.
The explicit refs make the stale-closure problem and its solution visible
to the next developer — a deliberate documentation choice.

---

### Decision 16: diffSnapshots — Arrays Treated as Atomic, Objects Diffed Recursively
**Context:** State values may include arrays. Diffing arrays element-by-element
requires an LCS algorithm to handle insertions, deletions, and reordering —
significant complexity for minimal benefit in a debugging tool where the
typical state shape is primitive values and plain objects.

**Decision:** Arrays are compared atomically via `JSON.stringify`. A changed
array appears as a single `changed` node with `prevValue`/`nextValue`. Plain
objects are diffed recursively. An `isPlainObject` guard cleanly separates
the two cases.

**Rationale:** Recursive object diffing covers the common case with high
signal. Array element diffing is rare in simple RN app state and expensive
to implement correctly. Upgrading to LCS-based array diffing in a future
iteration requires touching only `diffSnapshots.ts`.

**Tradeoff:** Large array changes show as a single node rather than
per-element diff. Acceptable for alpha; the `isPlainObject` boundary is the
correct extension point when LCS diffing is added.

---

### Decision 17: normalizeFiberSnapshot — Adapter Pattern Decouples ComponentTree from Raw Data Shape
**Context:** `ComponentTree` needs a `FiberNode[]` tree structure. Current
snapshot data is a flat object (`{ count: 5, letter: 'b' }`). Will's fiber
serialization work (in progress on `feat/fiber-capture`) will produce a
different shape. Building `ComponentTree` directly against the current flat
shape would require a full refactor when Will's work lands.

**Decision:** Extract `normalizeFiberSnapshot.ts` as an adapter layer between
raw snapshot payloads and the `FiberNode` type consumed by `ComponentTree`.
The adapter handles three shapes: future fiber tree (`name` + `children[]`),
debug panel shape (`component` + `state` + `props`), and flat RN state.

**Rationale:** Adapter pattern isolates the data transformation concern.
`ComponentTree`, its tests, and all visual behavior remain stable regardless
of the raw snapshot shape. Only the adapter file needs updating when Will's
fiber tree serialization lands — documented explicitly in the file header.

**Tradeoff:** One extra indirection layer. The tradeoff deliberately favors
future-proofing because Will's shape change is a known, imminent event.

---

### Decision 18: ComponentTree WCAG — APG Tree Widget Keyboard Pattern
**Context:** The collapsible component tree is an interactive widget. WCAG
2.1.1 (Keyboard) requires all functionality to be available via keyboard.
Screen readers expose tree widgets with specific expectations: arrow keys to
navigate and expand/collapse, Enter/Space to toggle.

**Decision:** Each node header handles `onKeyDown` with ArrowRight (expand),
ArrowLeft (collapse), Enter/Space (toggle). Roles: `role="tree"` on the
container, `role="treeitem"` on each node, `role="group"` on child lists.
`tabIndex={0}` on all visible node headers. `aria-expanded` on nodes with
children.

**Rationale:** Follows the ARIA Authoring Practices Guide (APG) tree widget
pattern. A fully keyboard-navigable tree signals accessibility maturity beyond
what most debugger tools implement.

**Tradeoff:** `tabIndex={0}` on every node header means Tab cycles through all
visible nodes — APG recommends roving `tabIndex` for large trees. Acceptable
for alpha; roving `tabIndex` is a known improvement for when the full fiber
tree lands and node counts grow significantly.

---

### Decision 19: LagMetrics Display — Scrollable List over Carousel or Windowed View
**Context:** LagMetrics appended new items to an unbounded list, causing the
CommitMetrics table to be pushed down the page as lag samples accumulated.
Three options were evaluated to contain the component to a fixed height.

**Alternatives considered:**
1. **Fixed-height windowed list (`overflow: hidden`)** — Static container, 3 items
   visible, no scroll. Rejected: `overflow: hidden` creates an inconsistency — screen
   reader users traverse all DOM nodes and access all items, while sighted users can
   only see 3 with no mechanism to reach older entries. Fails WCAG 1.3.1 (information
   not equally accessible to all users).
2. **Single-item vertical carousel** — Shows one item at a time; auto-advances or
   manual prev/next. Rejected: auto-advancing violates WCAG 2.2.2 (Pause, Stop, Hide)
   without a pause control. Manual-only adds interaction burden and sacrifices trend
   context — seeing 3 readings (`52ms → 14ms → 48ms`) is more useful for debugging
   than a single isolated value.
3. **Fixed-height scrollable list** — Selected.

**Decision:** Wrap `<ol>` in a `div` with `overflowY: 'auto'`, `maxHeight`, and
`tabIndex={0}`. Add `aria-label` naming the region.

**Rationale:** WCAG 2.1.1 requires all content to be keyboard-reachable. WCAG 1.3.1
requires information to be equally accessible to all users. The scrollable container
satisfies both. The stats summary (avg, max, count) above the list gives aggregate
context without requiring any scrolling.

**Tradeoff:** `tabIndex={0}` on a non-semantic wrapper div adds a tab stop that isn't
a native interactive element. Mitigated by `aria-label` (names the region for AT) and
the global `div[tabindex="0"]:focus-visible` rule (visible focus ring for sighted
keyboard users).

---

### Decision 20: Serialized JSON Snapshots Over In-Memory Objects
**Context:** Snapshots of the React Fiber tree need to travel from the React Native
app, through a Node.js WebSocket server, to a browser UI. These three environments
share no memory space. A format had to be chosen for snapshot data in transit and
at rest in the Redux store.

**Decision:** Serialize all Fiber tree snapshots to JSON before transmission and
storage. Do not pass in-memory JavaScript objects through the pipeline.

**Rationale:** JSON is the lingua franca of cross-runtime communication — universal,
human-readable, debuggable, and works across all three environments without additional
dependencies. Serialization also makes snapshots portable artifacts: they can be
saved, shared, or logged for async debugging.

**Known limitation:** React Fiber nodes contain non-serializable values (functions,
class instances, circular references). Preprocessing strips or replaces these before
serialization. This step is a potential source of data loss — some Fiber properties
may be omitted. When working on snapshot serialization, verify that the output shape
is complete and strip only what is strictly necessary.

**Tradeoff:** JSON is verbose. Complex or deeply nested Fiber trees can produce large
payloads. Acceptable at current MVP scale; snapshot diffing or compression may be
warranted at larger scale.

---

### Decision 21: TypeScript Strict Mode
**Context:** The codebase was initially written with permissive TypeScript — many
implicit `any` types, especially around Fiber tree traversal functions and WebSocket
event handlers. This made the code easier to write initially but harder to maintain
and refactor safely.

**Decision:** `"strict": true` in tsconfig. All new code must satisfy strict mode.
Implicit `any` is not acceptable except where React internals are genuinely untyped.

**Rationale:** Fiber node properties (`memoizedState`, `child`, `sibling`,
`elementType`) do not always exist. Strict mode forces explicit null handling at
compile time, surfacing potential runtime crashes before they happen. Type coverage
after migration: **91.72% across 2,599 type nodes**. The remaining ~8% is intentional
`any` on Fiber properties where the React internals provide no type information.

**Tradeoff:** All new code requires explicit null guards, interface definitions, and
typed action payloads. Default to explicit types over inference in ambiguous cases
when generating code for this codebase.
### Decision 20: `aria-disabled` over `disabled` on Timeline Control Buttons
**Context:** Play, Back, and Forward buttons in `TimelineControls` used the
HTML `disabled` attribute to communicate an inactive state when no snapshots
are loaded. `disabled` removes elements from the tab order entirely — keyboard
users Tab past them without knowing they exist.

**Decision:** Replace `disabled` with `aria-disabled` on all three buttons.
Click handlers already guard against empty state (`if (isEmpty) return`), so
no logic changes are needed.

**Rationale:** WCAG 4.1.2 (Name, Role, Value) requires interactive controls
to expose their state. `aria-disabled="true"` keeps buttons focusable and
announces them as "dimmed" or "unavailable" to screen readers, giving users
the full picture of available controls regardless of current state. `disabled`
is appropriate for form submission contexts; `aria-disabled` is appropriate
for application controls that are contextually unavailable.

**Tradeoff:** Keyboard users Tab to buttons that cannot currently be activated.
Acceptable — the visual styling still communicates inactive state, and screen
reader announcement of `aria-disabled` is unambiguous. No interactive content
is hidden.

---

### Decision 21: Debug Panel — Inline Sidebar over Position:Fixed Overlay
**Context:** `ConnectionDebugger` was rendered as a `position: fixed` overlay
at the top-left of the viewport. Fixed-position elements inside a flex container
interact unpredictably with Chromium's focus traversal algorithm — the debug
panel buttons were unreachable via keyboard navigation despite having no
`tabIndex={-1}` restriction.

**Decision:** Restructure `ConnectionDebugger` as an inline sidebar: a 200px
`flexShrink: 0` column inside the top-half flex row, with `borderRight` separator.
Remove `position: fixed` and all `tabIndex={-1}` restrictions on its buttons.

**Rationale:** In-flow elements follow predictable DOM tab order. The sidebar
approach puts the debug panel in the natural Tab sequence (left column → right
column) matching the visual layout. A separate investigation confirmed the
keyboard issue was also a Safari-specific behavior (Safari skips
`div[tabindex]` elements by default unless Full Keyboard Access is enabled) —
but the inline sidebar improves spatial clarity and focus order in all browsers.

**Tradeoff:** The debug panel now occupies a fixed 200px column in the top
half of the layout. Acceptable for the alpha debug panel; the column wrapper
is marked with a comment for removal when the debug panel is retired.

---

### Decision 22: Explicit `onKeyDown` Scroll Handlers over Native Browser Scroll
**Context:** CommitMetrics and LagMetrics scroll containers (`tabIndex={0}`
divs with `overflowY: 'auto'`) required a prior mouse click to "activate"
before arrow keys would scroll them. This is a browser-native behavior:
Chromium requires an explicit pointer interaction to designate a scroll target
before keyboard scrolling is handed to it.

**Decision:** Add explicit `onKeyDown` handlers to both scroll containers.
ArrowDown/ArrowUp call `e.currentTarget.scrollBy({ top: ±40, behavior: 'smooth' })`
and `e.preventDefault()` to suppress page-level scroll interference.

**Rationale:** WCAG 2.1.1 requires all functionality to be operable via keyboard
without requiring prior mouse interaction. Relying on browser-native scroll
activation is an invisible prerequisite that fails this criterion. Explicit
handlers eliminate the dependency entirely.

**Tradeoff:** The handlers duplicate behavior the browser provides natively in
some conditions. The duplication is intentional — it makes the keyboard
contract explicit and removes the activation prerequisite.

---

### Decision 23: Timeline Scrubber Position — Above Metrics via CSS Grid `auto` Row
**Context:** `TimelineControls` was placed after `<main>` in the outer flex
column, rendering it at the very bottom of the viewport below the metrics
panel. This created two problems: (1) UX — the timeline control that drives
which snapshot is displayed sat below the metrics it affects, breaking the
causal reading order. (2) WCAG 2.4.3 (Focus Order) — Tab focus reached
metrics scroll containers before the playback controls, opposite to the
logical action flow.

**Alternatives considered:**
- Keep scrubber at bottom: simple, matches video-player convention, but
  breaks the causal chain and inverts focus order relative to content.
- Move scrubber inside the grid with `gridTemplateRows: '1fr 1fr'`: scrubber
  competes for space with snapshot and metrics halves — no guarantee it won't
  shrink at small viewport sizes.

**Decision:** Move `TimelineControls` into the CSS Grid as the middle row.
Change `gridTemplateRows` from `'1fr 1fr'` to `'1fr auto 1fr'`. Place
`<TimelineControls />` between the snapshot row and the metrics row in the
JSX.

**Rationale:** CSS Grid resolves `auto` rows first (sized to content), then
distributes remaining space across `fr` rows. The scrubber row is guaranteed
to always be exactly its natural content height — it cannot shrink. This is
a stronger guarantee than `flexShrink: 0` in a flex container. Focus order
becomes: snapshot tabs → scrubber controls → metrics, matching the visual
layout and the logical user flow (navigate to a point in time → see
performance data for that moment).

**Tradeoff:** Scrubber is now inside `<main>` rather than a sibling. The
`borderTop` separator on `TimelineControls` provides the same visual break.
No behavioral regressions; WCAG 2.4.3 focus order is improved.

---

### Decision 24: Responsive Metrics Panel — Flex Height Propagation over Fixed `maxHeight`
**Context:** `CommitMetrics` table wrapper had a hardcoded `maxHeight: 220`.
At any viewport size, the table was capped at 220px, causing a scrollbar with
more than ~6 rows visible. When the metrics section was constrained by the
`1fr` grid row at small viewports, content could visually crowd the scrubber.

**Alternatives considered:**
- `overflow: 'auto'` on the metrics section: works, but adds a section-level
  scrollbar that the user found undesirable.
- Keep `maxHeight: 220`: simple but fixed; wastes vertical space on large
  displays and always shows a scrollbar with real data.
- Flex height propagation: propagate `flex: 1, minHeight: 0` from the grid
  section → MetricsPanel → `cardWide` → CommitMetrics outer div → table wrapper.

**Decision:** Propagate flex height through the chain. Key changes:
- `MainContainer` metrics section: add `display: 'flex', flexDirection: 'column'`
- `MetricsPanel` panel: add `flex: 1, minHeight: 0, overflow: 'hidden'`
- `MetricsPanel` cardWide: add `flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column'`
- `CommitMetrics` outer div: add `display: 'flex', flexDirection: 'column', height: '100%'`
- `CommitMetrics` tableWrapperStyle: replace `maxHeight: 220` with `flex: 1, minHeight: 0`

**Rationale:** The table now fills available viewport height. At large viewports,
more rows are visible without scrolling. At small viewports, a scrollbar appears
only when the content genuinely cannot fit — the expected, correct behavior.
`minHeight: 0` is required on flex children to allow shrinking below content
height (browsers default `min-height: auto` on flex children).

**Tradeoff:** Touches four files across two components. The propagation is
mechanical but requires understanding the full flex chain. The `minHeight: 0`
requirement is a known CSS flex gotcha — documented here so the next developer
doesn't remove it thinking it's redundant.

---

## Accessibility
See [ACCESSIBILITY.md](./ACCESSIBILITY.md) for a full log of accessibility
decisions made and known gaps with WCAG references.

---

## Commands
```bash
# Start WebSocket server
node server/server.js

# Start React Native demo app
cd rn-demo-app && npx react-native start
npx react-native run-ios   # or run-android

# Run tests
npx vitest
```

---

## Notes for Claude
- When exploring unfamiliar parts of the codebase, explain architecture
  before suggesting changes
- Trace data flow end-to-end when asked: RN middleware → WebSocket server
  → browser UI → Redux slice
- When a new engineering decision is made, add it to the decision log above
  with context, decision, rationale, and tradeoff
- Proactively flag WCAG implications of any UI changes and update
  ACCESSIBILITY.md accordingly
- Accessibility is a first-class concern — note gaps and improvements
  alongside feature work
- See `.claude/CLAUDE.private.md` for private interview context (local only,
  not tracked in git)
