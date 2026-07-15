# Security Policy

The StadiaIQ team takes the security of our platform seriously. This document
describes which versions receive security updates, how to report
vulnerabilities, and the security measures currently in place.

---

## Supported Versions

| Version   | Status              | Notes                          |
| --------- | ------------------- | ------------------------------ |
| **1.0.x** | ✅ Supported        | Active development and patches |
| < 1.0     | ❌ Not supported    | Pre-release, no guarantees     |

Only the latest patch release within a supported minor version receives security
fixes. We recommend always running the most recent `1.0.x` release.

---

## Reporting a Vulnerability

> **Do NOT open a public GitHub issue for security vulnerabilities.**

If you discover a security vulnerability in StadiaIQ, please report it
responsibly:

1. **Email:** Send a detailed report to **security@stadiaiq.dev**
2. **Include:**
   - A description of the vulnerability and its potential impact
   - Step-by-step instructions to reproduce the issue
   - The affected component (API route, middleware, client portal, etc.)
   - Your suggested severity (Critical / High / Medium / Low)
   - Any proposed fix, if available

### Response timeline

| Stage                     | Target              |
| ------------------------- | ------------------- |
| Acknowledgment            | Within 48 hours     |
| Initial assessment        | Within 5 business days |
| Patch development & test  | Within 14 business days |
| Coordinated disclosure    | After patch release  |

We will work with reporters to coordinate disclosure and will credit
contributors in the release notes (unless anonymity is requested).

---

## Security Measures

StadiaIQ implements multiple layers of defense across the Express 5 middleware
stack and application logic.

### HTTP Security Headers — Helmet CSP

The server applies **Helmet** middleware with a strict Content Security Policy.
Script sources, style sources, and connection endpoints are explicitly
allowlisted. Inline scripts are blocked by default; any required inline
resources use nonce-based exceptions.

### Cross-Origin Resource Sharing (CORS)

CORS is configured to allow requests only from the expected client origin in
production. Credentials, allowed methods, and permitted headers are explicitly
declared — wildcard origins are never used in deployed environments.

### Rate Limiting

All API endpoints are protected by a rate limiter that restricts the number of
requests per IP within a sliding time window. AI-powered endpoints (`/api/chat`,
`/api/decision`, `/api/wayfind`) enforce tighter limits to prevent abuse of the
Gemini integration.

### XSS Sanitization

Every incoming request body is passed through an XSS sanitizer middleware that
strips dangerous HTML and script content before the data reaches any route
handler or Zod schema. This provides defense-in-depth beyond React's built-in
JSX escaping on the client side.

### Request ID Tracing

Each inbound request is assigned a unique request ID (UUID v4) via middleware.
This ID is attached to log entries, error reports, and response headers,
enabling end-to-end tracing across the middleware stack and any downstream Google
Cloud Logging integration.

### Zod Input Validation

All API request bodies are validated against strict **Zod schemas** before
processing. Schemas define exact field types, string constraints, enum values,
and nested object shapes. Requests that fail validation receive a structured
error response and are never forwarded to business logic or the Gemini API.

### SHA-256 Cache Hashing

AI responses from Gemini 2.5 Flash are cached using a **SHA-256 hash** of the
normalized request payload as the cache key. This prevents cache-key collisions
and ensures that cached responses are only served for semantically identical
requests. The hashing mechanism uses Node.js built-in `crypto` with no external
dependencies.

---

## Responsible Disclosure

We follow a coordinated disclosure model. After a vulnerability is confirmed and
a patch is released:

1. The reporter is notified and credited.
2. A security advisory is published via GitHub Security Advisories.
3. The fix is documented in [CHANGELOG.md](./CHANGELOG.md) under the relevant
   release.

---

Thank you for helping keep StadiaIQ and its users safe.
