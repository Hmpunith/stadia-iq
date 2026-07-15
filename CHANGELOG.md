# Changelog

All notable changes to StadiaIQ are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-07-15

### Added

- **Fan Portal** — Public-facing interface with AI-powered wayfinding, real-time
  chat assistance, and a live eco-impact tracker displaying sustainability
  metrics for the venue.
- **Staff Portal** — Operational dashboard for stadium personnel with a
  structured incident intake form. Incident reports are processed through Zod
  validation and logged to the in-memory datastore.
- **Admin Portal** — Strategic command center with AI-driven decision support.
  Administrators can query Gemini 2.5 Flash for crowd-flow analysis, resource
  allocation guidance, and operational recommendations with structured JSON
  responses.
- **SVG Wayfinder Map** — Interactive, accessible stadium map rendered as inline
  SVG. Zones are color-coded by crowd density and respond to wayfinding queries
  with highlighted route paths.
- **Dark / Light Theme** — System-aware theme toggle with CSS custom properties.
  User preference persists across sessions via `localStorage`. All portals and
  the wayfinder map adapt to the active theme.
- **WCAG AA Accessibility** — Semantic HTML landmarks, ARIA labels on
  interactive elements, visible focus indicators, sufficient color contrast
  ratios in both themes, and keyboard-navigable portal switching.
- **69 Unit Tests** — Comprehensive Vitest test suite covering Express route
  handlers, Zod schema validation (valid and malformed payloads), middleware
  behavior (rate limiting, XSS sanitization, request ID injection), React
  component rendering, and AI response caching logic.
- **CI Workflow** — GitHub Actions pipeline that runs ESLint, Prettier checks,
  and `vitest run` on every push and pull request targeting `main`.
- **CodeQL Workflow** — GitHub Actions CodeQL analysis for JavaScript,
  configured to scan on push, PR, and a weekly schedule to detect security
  vulnerabilities and code-quality issues.

### Security

- **Helmet CSP** — Strict Content Security Policy via Helmet middleware.
  Script, style, font, image, and connect sources are explicitly allowlisted.
  Inline scripts are blocked; required inline resources use nonce-based
  exceptions.
- **Rate Limiting** — IP-based sliding-window rate limiter on all API endpoints.
  AI-powered routes (`/api/chat`, `/api/decision`, `/api/wayfind`) enforce
  tighter per-IP limits to prevent Gemini API abuse.
- **XSS Sanitization** — Middleware-level HTML and script tag stripping on all
  incoming request bodies before route handling. Provides defense-in-depth
  beyond React's built-in JSX output escaping.
- **Zod Input Validation** — Every API endpoint validates request bodies against
  strict Zod schemas defining field types, string constraints, enums, and nested
  object shapes. Malformed requests receive structured 400 error responses and
  never reach business logic or the Gemini API.

---

[1.0.0]: https://github.com/stadiaiq/stadia-iq/releases/tag/v1.0.0
