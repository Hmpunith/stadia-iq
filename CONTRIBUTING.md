# Contributing to StadiaIQ

Thank you for your interest in improving StadiaIQ! This document explains how to
set up your local environment, follow our conventions, and submit changes.

## Table of Contents

- [Getting Started](#getting-started)
- [Code Style](#code-style)
- [Branching Strategy](#branching-strategy)
- [Testing](#testing)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Issue Guidelines](#issue-guidelines)

---

## Getting Started

1. **Fork & clone** the repository:

   ```bash
   git clone https://github.com/<your-username>/stadia-iq.git
   cd stadia-iq
   ```

2. **Install dependencies** (Node 20+ required):

   ```bash
   npm install
   ```

3. **Start the development server** (Vite + Express 5):

   ```bash
   npm run dev
   ```

   This launches the Vite dev server for the React 19 client and the Express 5
   API server concurrently. The client proxies API requests to the backend
   automatically.

4. **Verify everything works** by opening `http://localhost:5173` in your
   browser. You should see the Fan Portal landing page.

> **Note:** The AI features require a `GEMINI_API_KEY` environment variable.
> Copy `.env.example` to `.env` and add your key. Without it the app falls back
> to placeholder responses.

---

## Code Style

StadiaIQ enforces a consistent style through **ESLint** and **Prettier**.

| Tool       | Config File            | Purpose                                |
| ---------- | ---------------------- | -------------------------------------- |
| ESLint     | `eslint.config.js`     | Linting for JS/JSX, React 19 rules    |
| Prettier   | `.prettierrc`          | Formatting (2-space indent, single quotes, trailing commas) |

### Key rules

- **Single quotes** for strings, **no semicolons** omitted — we keep semicolons.
- **Functional components only** — no class components in React code.
- **Zod schemas** live alongside the route or component that consumes them.
- **Named exports** are preferred over default exports (except for page-level
  components).

Run the linter before committing:

```bash
npm run lint
```

Auto-fix formatting:

```bash
npm run format
```

---

## Branching Strategy

We use a **trunk-based** workflow with short-lived feature branches.

| Branch        | Purpose                              |
| ------------- | ------------------------------------ |
| `main`        | Production-ready code, always green  |
| `feature/*`   | New features — branch off `main`     |
| `fix/*`       | Bug fixes — branch off `main`        |
| `docs/*`      | Documentation-only changes           |

### Creating a branch

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

- Keep branches focused — one feature or fix per branch.
- Rebase on `main` before opening a PR to maintain a linear history.

---

## Testing

StadiaIQ uses **Vitest** as its test runner, chosen for native Vite integration
and fast ESM execution.

### Running tests

```bash
# Run all tests once
npx vitest run

# Watch mode during development
npx vitest

# Run tests with coverage
npx vitest run --coverage
```

### Test conventions

- **File naming:** `*.test.js` or `*.test.jsx`, co-located next to the source
  file.
- **Server tests** exercise Express route handlers, middleware chains, and Zod
  schema validation.
- **Client tests** use Vitest's jsdom environment for React component rendering.
- Aim for meaningful assertions — validate Zod parse outcomes, HTTP status
  codes, and rendered UI states rather than implementation details.
- The project currently maintains **69 unit tests**. Any new feature must
  include tests that cover the happy path and at least one error path.

---

## Submitting a Pull Request

1. Push your branch to your fork.
2. Open a PR against `main` on the upstream repository.
3. Fill out the PR template:
   - **What** does this change do?
   - **Why** is it needed?
   - **How** was it tested?
4. Ensure CI passes — the GitHub Actions workflow runs linting, Vitest, and
   CodeQL analysis on every PR.
5. Request a review from at least one maintainer.
6. After approval, the maintainer will squash-merge your PR.

### PR checklist

- [ ] Tests added or updated for the change
- [ ] `npx vitest run` passes locally
- [ ] `npm run lint` reports no errors
- [ ] Zod schemas updated if API request/response shapes changed
- [ ] CHANGELOG.md updated under `[Unreleased]` if user-facing

---

## Issue Guidelines

- **Bug reports** should include: steps to reproduce, expected behavior, actual
  behavior, browser/Node version, and which portal (Fan/Staff/Admin) is
  affected.
- **Feature requests** should describe the use case and which portal the feature
  belongs to.
- Tag issues with the appropriate label: `fan-portal`, `staff-portal`,
  `admin-portal`, `api`, `ai`, `accessibility`, or `security`.

---

Thank you for helping make stadium experiences smarter. We appreciate every
contribution, whether it is a typo fix or a major feature!
