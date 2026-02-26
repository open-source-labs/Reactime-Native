# Who Is This For?

Reactime Native was built for developers who've hit the wall that every React Native debugger eventually runs into: existing tools show you **where you are**, but not **how you got there**.

React Native's built-in tooling — Flipper, React DevTools, Metro's fast refresh — are powerful for inspecting current state. But when a bug only surfaces after ten minutes of user interaction, or when a screen reader user reports getting stuck in a broken focus loop, a snapshot of *right now* isn't enough. You need a replayable history of state changes. That's what Reactime Native provides.

---

## The Developers We Had in Mind

### The Mobile-First Frontend Dev
You came from React on the web. You're comfortable with hooks, component state, and the mental model of React — but React Native's debugging ecosystem still feels fragmented. You want the time-travel debugging experience you may have used on the web, adapted for mobile. You also care about building accessible apps, and you need a way to trace *when* accessibility-relevant state changed — not just what it looks like right now.

**Reactime Native gives you:** a visual snapshot timeline of your app's state history, runnable in the browser while your simulator stays open.

---

### The Senior Engineer Debugging a Complex Regression
Your app has deep state — Redux slices, async flows, nested component trees. The bug you're chasing only happens after a specific sequence of interactions, and it's affecting how screen readers traverse your UI. Your current tools tell you what's in the store. They don't tell you what happened between snapshot 15 and snapshot 45.

**Reactime Native gives you:** a portable, shareable history of serialized state snapshots you can scrub through, diff, and hand off to a teammate — more useful than a screen recording.

---

### The Open-Source Contributor / Tool Builder
You're curious about how framework internals work. You want to contribute to developer tooling that has a real architectural challenge at its core — cross-runtime communication, fiber tree traversal, Redux middleware design. And you believe that dev tools themselves should be accessible, because a debugging tool that a developer with a disability can't use is a tool that narrows the field of who gets to build software.

**Reactime Native gives you:** an open, well-typed TypeScript codebase with a Scrum-led contribution workflow and a clear roadmap — including open issues around ARIA compliance, keyboard navigation, and high-contrast theming in the browser UI itself.

---

### The QA Engineer / SDET
You test state-driven UI behavior, including accessibility regressions. You know that a broken ARIA label or a shifted focus order often traces back to a specific state transition — not a static misconfiguration. Right now, when you catch one of these bugs during a live test session, you have no technical artifact to hand off to the dev team beyond a screen recording. You need something more precise.

**Reactime Native gives you:** time-stamped state snapshots captured during live test sessions, without any modifications to the app's source code — a shareable, reproducible artifact for every accessibility regression you find.

---

## The Core Insight

React Native's existing tools treat debugging as a **present-tense problem**. Reactime Native treats it as a **sequential problem** — because that's what bugs actually are. State doesn't just break; it *becomes* broken through a series of transitions. Accessibility failures in particular are almost always sequential: a modal closes, focus doesn't return, a live region never fires. The question isn't what the state is. It's what happened between here and there.

That's the gap Reactime Native is designed to close.

---

> **Accessibility note:** Reactime Native is committed to WCAG 2.1 AA compliance in the browser debugging UI itself — including keyboard-navigable timeline scrubbing, proper ARIA roles on all interactive components, and a high-contrast theme option. We believe a tool built to help developers build accessible apps has a particular obligation to be accessible itself. Contributions toward these goals are especially welcome — see our open issues.
