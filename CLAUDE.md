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
- **UI components:** Built snapshot, scrubber, and metrics components,
  rendered data stream simulation in browser

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
