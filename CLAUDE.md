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

### Decision 7: wsConfig.ts — Dynamic IP Resolution with sanitizeHost()
**Context:** The RN app had a hardcoded teammate IP address
(`ws://10.0.0.157:8080`). Every environment change required a source edit.
A commented-out Expo Constants attempt had been abandoned due to unreliability
across SDK versions.

**Decision:** Extracted host resolution into `wsConfig.ts` with a four-step
priority chain: env var override → Expo `hostUri` → Android emulator default
(`10.0.2.2`) → `localhost`. Added `sanitizeHost()` to strip malformed env
var values (e.g. `ws://192.168.1.1` → `192.168.1.1`) before interpolation.

**Rationale:** Any developer can now connect by dropping
`EXPO_PUBLIC_WS_HOST` into `.env.local` — no source changes required.
The fallback chain covers every supported environment without branching logic
in the consuming component.

**Tradeoff:** One additional module to maintain; tradeoff accepted because it
removes a recurring manual step and makes the tool usable out of the box.

---

### Decision 8: Shift-Left Testing for wsConfig.ts
**Context:** `WS_URL` is computed at module load time. Malformed values like
`ws://undefined:8080` are syntactically valid, pass TypeScript checks, and
only fail at runtime on a physical device — the worst possible moment to catch
a bug.

**Decision:** Wrote 9 unit tests before wiring the module into the app,
covering the priority chain, contract shape (must start with `ws://`, must
include port 8080), and three shift-left failure modes (undefined resolution,
empty host, malformed env var with embedded protocol).

**Outcome:** Tests caught a real bug — the initial implementation passed the
env var directly into the URL template, producing `ws://ws://192.168.1.1:8080`.
`sanitizeHost()` was added in direct response to the failing test, before
the bug reached the app.

**Tradeoff:** Shift-left tests require more setup than smoke tests; justified
here because the failure mode is silent and environment-specific.

---

### Decision 9: Server Refactored for Testability
**Context:** `server.js` originally started a WebSocket server on port 8080
as a top-level side effect — any `require()` of the file would bind the port.
The broadcast routing logic was inline inside the connection handler with no
way to test it in isolation.

**Decision:** Extracted two named, exported functions:
- `broadcast(wss, senderWs, parsed)` — pure routing logic, testable with
  mock objects
- `createServer(port, host)` — factory that constructs and returns the server
  without binding a port at import time

Guarded the auto-start with `if (require.main === module)` so the module is
safely importable in tests without side effects.

**Rationale:** Functions that cannot be called in isolation cannot be unit
tested. The `require.main` guard is the minimal, idiomatic Node.js pattern
for separating library behavior from CLI behavior.

**Tradeoff:** Slightly more surface area in the module's public API; accepted
because the alternative is untestable code in a critical data relay.

---

### Decision 10: Layered Server Testing Strategy (Unit + Integration)
**Context:** The server's broadcast logic had two distinct failure surfaces:
the routing algorithm itself (which clients receive a message) and the
full network stack (real WebSocket handshakes, TCP close events, JSON parsing).
A single test type cannot cover both efficiently.

**Decision:** Two-layer test suite in `server.test.ts`:
- **Unit tests** (4): mock ws client objects, test `broadcast()` directly —
  sender exclusion, readyState filtering, single-client echo mode, JSON
  serialization. No I/O, no ports, no flakiness.
- **Integration tests** (7): real server on port 8081 spun up/torn down per
  suite via `beforeEach`/`afterEach` — connection acceptance, A→B forwarding,
  sender non-receipt, ping/pong, malformed JSON error response, disconnect
  resilience, single-client debug mode.

**Rationale:** Unit tests catch logic bugs instantly with zero environment
dependencies. Integration tests catch what unit tests cannot: port binding,
TCP handshake behavior, and the full message parsing pipeline.

**Tradeoff:** Integration tests add real async I/O and are slower than unit
tests; mitigated by running on an isolated port (8081) and using
`Promise`-based helpers with proper teardown to prevent test pollution.

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
