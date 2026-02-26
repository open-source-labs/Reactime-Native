# Contributing to Reactime Native

Thank you for your interest in helping build Reactime Native! We're porting the time-travel debugging experience of [Reactime](https://github.com/open-source-labs/reactime) to React Native — and we need contributors who care about developer tooling, mobile debugging, and building tools that work for everyone. Every contribution matters, whether it's a bug fix, a new feature, a test, or an accessibility improvement.

## New Contributor Guide

Whether you're new to open source or a seasoned contributor, start here:

- **Read the [README](README.md).**
  It explains what Reactime Native does, how the architecture works, and what we're building toward.
- **Read [Who Is This For?](PERSONAS.md).**
  Understanding the users we're designing for will help you make better decisions about what to build and how.
- **Explore these helpful resources:**
  - [Finding ways to contribute to open source on GitHub](https://docs.github.com/en/get-started/exploring-projects-on-github/finding-ways-to-contribute-to-open-source-on-github)
  - [Set up Git](https://docs.github.com/en/get-started/quickstart/set-up-git)
  - [GitHub flow](https://docs.github.com/en/get-started/quickstart/github-flow)
  - [Collaborating with pull requests](https://docs.github.com/en/github/collaborating-with-pull-requests)

## Getting Started

Reactime Native bridges three runtime environments: a React Native mobile app, a Node.js WebSocket server, and a browser-based debugging UI. Understanding how data flows across those three environments will help you orient quickly.

The core pipeline is:

```
React Native App (Fiber tree) → WebSocket Server → Redux Store → Browser UI
```

For a deeper dive into the codebase architecture, see [CLAUDE.md](CLAUDE.md).

## How We Work

Reactime Native uses a **Scrum-based workflow** to keep contributions organized and reviewable. Here's what that means for you as a contributor:

- Work is organized into **issues** that represent discrete, scoped tasks
- We use **labels** to signal priority, type, and which user persona a change serves
- We hold lightweight **sprint reviews** — if you want to be involved, open an issue and say so!
- Contributors are encouraged to **comment on issues before starting work** so we can avoid duplication

You don't need to be part of the core team to contribute — but flagging your intent in an issue before opening a PR helps everyone.

## Issues

### Finding an Issue

Browse our [open issues](../../issues). Look for these labels to find a good starting point:

| Label | What it means |
|---|---|
| `good first issue` | Scoped, well-defined, great for onboarding |
| `accessibility` | WCAG compliance, ARIA, keyboard nav, contrast — high priority |
| `bug` | Something broken that needs fixing |
| `architecture` | Deeper work on the WebSocket bridge, Redux middleware, or Fiber tree traversal |
| `docs` | Documentation, README, or contributor guide improvements |

We don't officially assign issues — if something interests you, comment and jump in.

### Creating a New Issue

1. **Search first.** Check [existing issues](../../issues) before opening a new one.
2. **Be specific.** Include what you expected, what happened, and the environment (RN version, OS, simulator vs. device).
3. **Tag the persona if relevant.** If your issue affects a specific user type (e.g., a QA engineer trying to capture a11y regression artifacts), say so — it helps us prioritize.

### Accessibility Issues

Accessibility contributions are a **first-class priority** for Reactime Native. We are committed to WCAG 2.1 AA compliance in the browser debugging UI. If you find an accessibility gap — in the timeline scrubber, the snapshot view, the metrics panel, anywhere — please open an issue tagged `accessibility`. These will be reviewed and prioritized quickly.

Current open accessibility goals include:

- `aria-live` region for state change announcements — screen reader users do not currently hear when the timeline updates
- Full contrast audit against WCAG 1.4.3 (4.5:1 minimum for normal text, 3:1 for large text)
- High-contrast theme toggle
- Color-independent indicators in the metric panel diff view (shape or label in addition to color)

If you want to work on any of these, we'd love your help.

## Making Changes

### Small Edits

For typos, broken links, or small wording fixes in docs — click **Edit this file** directly on GitHub, make your change, and open a PR. No local setup needed.

### Larger Changes

1. **Fork the repository** and clone your fork locally.

   - **GitHub Desktop:** [Getting started with GitHub Desktop](https://docs.github.com/en/desktop/installing-and-configuring-github-desktop/getting-started-with-github-desktop)
   - **Command line:**
     ```bash
     git clone https://github.com/YOUR-USERNAME/reactime-native.git
     cd reactime-native
     ```

2. **Install dependencies.**
   ```bash
   npm install
   ```

3. **Create a working branch** with a descriptive name:
   ```bash
   git checkout -b feature/keyboard-timeline-nav
   git checkout -b fix/websocket-reconnect
   git checkout -b docs/update-architecture-diagram
   ```

4. **Make your changes.** See [CLAUDE.md](CLAUDE.md) for environment setup, WebSocket testing, and running the browser UI locally.

5. **Run tests before committing.**
   ```bash
   npm test
   ```

### Commit Your Changes

Write commit messages that describe *what* changed and *why* — not just *what*:

```
# Good
fix: restore WebSocket connection on RN app reload
feat: add keyboard navigation to timeline scrubber (closes #42)
docs: add ARIA role rationale to browser UI components

# Less helpful
fix: bug fix
update stuff
```

We loosely follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) — `fix:`, `feat:`, `docs:`, `chore:`, `test:`, `a11y:` are all valid prefixes.

## Opening a Pull Request

Once your changes are pushed:

1. **Open a PR** from your branch against `main`.
2. **Fill out the PR template.** Describe what you changed, why, and how you tested it.
3. **Link the issue** your PR addresses using [GitHub's closing keywords](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue) (e.g., `closes #12`).
4. **Allow maintainer edits** so we can help keep your branch up to date if needed.
5. **Address review feedback.** Apply suggested changes directly in the GitHub UI, or push new commits to your branch.
6. **Resolve conversations** once you've addressed each comment.
7. **Handle merge conflicts** — [this guide](https://github.com/skills/resolve-merge-conflicts) can help if you get stuck.

## Your PR is Merged!

**Congratulations and thank you!** Once your PR is merged, your work becomes part of Reactime Native. We appreciate every contribution — from a one-line accessibility fix to a major architectural change — and we hope you'll stick around.

> Questions? Ideas? Open an issue or start a discussion. We're building this together.

---

Happy debugging, and welcome to the Reactime Native community!
