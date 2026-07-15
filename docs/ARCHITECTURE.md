# StadiaIQ Architecture

This document describes the technical architecture of StadiaIQ — an AI-powered
stadium operations platform built with Express 5, React 19, Vite, and
Google Gemini.

---

## Table of Contents

- [System Overview](#system-overview)
- [Client Architecture](#client-architecture)
- [Server Architecture](#server-architecture)
- [API Routes](#api-routes)
- [AI Integration](#ai-integration)
- [Data Layer](#data-layer)
- [Google Cloud Services](#google-cloud-services)
- [Deployment](#deployment)

---

## System Overview

StadiaIQ is an **Express 5 monolith** that serves two responsibilities from a
single Node.js process:

1. **React SPA** — A Vite-built single-page application delivered as static
   assets. In production the compiled `dist/` output is served by Express via
   `express.static`.
2. **REST API** — A set of JSON endpoints under `/api/*` that handle wayfinding,
   chat, incident management, strategic decisions, telemetry, and
   sustainability data.

```
┌─────────────────────────────────────────────────┐
│                   Browser                       │
│  ┌───────────┐  ┌───────────┐  ┌─────────────┐ │
│  │ FanPortal │  │StaffPortal│  │ AdminPortal │ │
│  └─────┬─────┘  └─────┬─────┘  └──────┬──────┘ │
│        │               │               │        │
│        └───────────┬───┘───────────────┘        │
│                    │ fetch()                     │
└────────────────────┼────────────────────────────┘
                     │
        ┌────────────▼────────────┐
        │     Express 5 Server    │
        │  ┌────────────────────┐ │
        │  │   Middleware Stack │ │
        │  │  Helmet ▸ CORS ▸   │ │
        │  │  Rate Limit ▸ XSS  │ │
        │  │  ▸ Request ID ▸    │ │
        │  │  JSON Enforcer     │ │
        │  └────────┬───────────┘ │
        │           │             │
        │  ┌────────▼───────────┐ │
        │  │    Route Handlers  │ │
        │  │   + Zod Schemas    │ │
        │  └────────┬───────────┘ │
        │           │             │
        │  ┌────────▼───────────┐ │
        │  │  Gemini AI Client  │ │
        │  │  + TTL Cache       │ │
        │  └────────────────────┘ │
        │           │             │
        │  ┌────────▼───────────┐ │
        │  │  In-Memory Store   │ │
        │  └────────────────────┘ │
        └─────────────────────────┘
```

---

## Client Architecture

The client is a **React 19** application scaffolded with **Vite**. It uses
functional components exclusively and manages state through React hooks.

### Core Components

| Component         | Role                                                      |
| ----------------- | --------------------------------------------------------- |
| **`FanPortal`**   | Public fan experience — wayfinding, AI chat, eco-tracker  |
| **`StaffPortal`** | Operational interface — structured incident intake form   |
| **`AdminPortal`** | Strategic dashboard — AI decision support queries         |
| **`WayfinderMap`**| Interactive SVG stadium map with zone highlighting        |
| **`Header`**      | Navigation bar with portal switcher and theme toggle      |

### Role-Based Portals

The application renders one of three portal views based on the active role
selection in the `Header`. Each portal is a self-contained component tree with
its own API integration:

- **Fan** → `FanPortal` → calls `/api/wayfind`, `/api/chat`,
  `/api/sustainability`
- **Staff** → `StaffPortal` → calls `/api/log-incident-raw`, `/api/incidents`
- **Admin** → `AdminPortal` → calls `/api/decision`, `/api/telemetry`,
  `/api/incidents`

### Theming

Dark and light themes are implemented with CSS custom properties on `:root`.
The `Header` component exposes a toggle that writes the preference to
`localStorage` and applies a `data-theme` attribute to `<html>`. All components
consume theme tokens (e.g., `--color-bg`, `--color-text`, `--color-accent`)
rather than hard-coded color values.

### Accessibility

- Semantic HTML5 landmarks (`<header>`, `<main>`, `<nav>`, `<section>`)
- ARIA labels on interactive elements (buttons, form inputs, map zones)
- Visible `:focus-visible` indicators on all focusable elements
- Color contrast ratios meeting WCAG AA in both themes
- Keyboard-navigable portal switching and form submission

---

## Server Architecture

The server is an **Express 5** application that processes every request through
a layered middleware stack before reaching route handlers.

### Middleware Stack (execution order)

| #  | Middleware             | Responsibility                                     |
| -- | ---------------------- | -------------------------------------------------- |
| 1  | **Helmet**             | Sets security-oriented HTTP headers including a strict Content Security Policy with allowlisted sources |
| 2  | **CORS**               | Restricts cross-origin requests to the expected client origin; explicitly declares allowed methods and headers |
| 3  | **Rate Limiter**       | IP-based sliding-window rate limiting; tighter limits on AI-powered endpoints |
| 4  | **Request ID**         | Generates a UUID v4 for each request; attaches it to `req`, response headers, and log context |
| 5  | **XSS Sanitizer**      | Strips dangerous HTML and script content from all incoming request body fields |
| 6  | **JSON Enforcer**      | Rejects non-JSON `Content-Type` on `POST`/`PUT`/`PATCH` routes with a `415` response |
| 7  | **`express.json()`**   | Parses JSON request bodies with a size limit                                   |
| 8  | **Static Assets**      | Serves the Vite-built `dist/` directory in production                          |

### Error Handling

A centralized error handler at the end of the middleware chain catches thrown
errors and Zod validation failures. It returns a consistent JSON envelope:

```json
{
  "error": "Human-readable message",
  "requestId": "uuid-v4",
  "details": []
}
```

Zod `ZodError` instances are detected and their `.issues` array is mapped into
the `details` field with path, expected type, and received value for each
validation failure.

---

## API Routes

All routes are mounted under `/api` and return JSON responses.

| Method | Path                    | Portal | Description                                      |
| ------ | ----------------------- | ------ | ------------------------------------------------ |
| POST   | `/api/wayfind`          | Fan    | Accepts a natural-language destination query; returns AI-generated wayfinding directions and a zone highlight ID for the SVG map |
| POST   | `/api/chat`             | Fan    | General-purpose AI chat for venue questions (food, facilities, events, accessibility) |
| POST   | `/api/log-incident-raw` | Staff  | Receives structured incident reports; validates with Zod; stores in the in-memory datastore |
| POST   | `/api/decision`         | Admin  | Forwards a strategic operations question to Gemini; returns structured JSON with recommendations, confidence scores, and data references |
| GET    | `/api/telemetry`        | Admin  | Returns simulated real-time telemetry data (crowd density per zone, ingress/egress rates, wait times) |
| GET    | `/api/sustainability`   | Fan    | Returns eco-impact metrics (energy usage, waste diversion rate, water consumption, carbon offset) |
| GET    | `/api/incidents`        | Staff/Admin | Retrieves logged incidents from the in-memory datastore with optional status filter |

### Request Validation

Every `POST` route defines a Zod schema that validates the request body
immediately after JSON parsing. Example schema structure for `/api/wayfind`:

```js
const wayfindSchema = z.object({
  query: z.string().min(1).max(500),
  currentZone: z.string().optional(),
  accessibility: z.boolean().optional(),
});
```

Invalid requests receive a `400` response with Zod issue details before any
business logic or Gemini API call executes.

---

## AI Integration

StadiaIQ integrates with **Google Gemini 2.5 Flash** for all AI features.

### Request Flow

1. Route handler receives a validated request body.
2. The request payload is normalized and hashed with **SHA-256** to produce a
   cache key.
3. The cache is checked for a matching entry that has not exceeded its TTL.
4. On cache **miss**, the Gemini client sends a prompt to `gemini-2.5-flash`
   with `responseMimeType: "application/json"` to enforce structured output.
5. The raw Gemini response is parsed against a **Zod schema** specific to that
   endpoint's expected AI output shape.
6. Validated responses are stored in the cache and returned to the client.

### Model Fallback

If the primary `gemini-2.5-flash` model returns an error (rate limit, transient
failure, or model unavailability), the system retries with the fallback model
**`gemini-1.5-flash`**. The fallback preserves the same prompt and Zod
validation pipeline. If both models fail, a structured error response is
returned to the client.

### Structured Output

All Gemini prompts instruct the model to respond in a specific JSON schema.
The response is then validated with Zod on the server side. This dual
constraint — model-level `responseMimeType` plus server-level Zod parsing —
ensures that malformed AI output never reaches the client.

### Caching

- **Key:** SHA-256 hash of the JSON-stringified, key-sorted request payload
- **Storage:** In-memory `Map` object
- **TTL:** Configurable per endpoint (default: 5 minutes for wayfinding,
  10 minutes for decision support)
- **Eviction:** Lazy — expired entries are removed on the next read attempt

---

## Data Layer

StadiaIQ uses an **in-memory datastore** implemented as plain JavaScript
objects and arrays within the server process.

### Stores

| Store              | Structure     | Contents                                   |
| ------------------ | ------------- | ------------------------------------------ |
| `incidents`        | Array         | Logged incident objects from Staff Portal   |
| `telemetryState`   | Object        | Simulated zone-level crowd metrics          |
| `sustainabilityState` | Object     | Simulated eco-impact metrics                |
| `aiCache`          | Map           | SHA-256 keyed Gemini response cache         |

### Telemetry Simulation

A periodic interval (configurable, default 30 seconds) updates the
`telemetryState` object with randomized but realistic fluctuations to crowd
density, ingress/egress rates, and wait times across stadium zones. This
simulates a live data feed for the Admin Portal dashboard without requiring
external IoT infrastructure.

> **Production note:** In a production deployment these stores would be backed
> by Firestore, BigQuery, or Redis. The in-memory implementation allows the
> application to run with zero external dependencies for development and
> demonstration purposes.

---

## Google Cloud Services

StadiaIQ references or integrates with the following **12 Google Cloud
services**:

| #  | Service                  | Integration Point                                  |
| -- | ------------------------ | -------------------------------------------------- |
| 1  | **Gemini (AI)**          | Primary AI backend — wayfinding, chat, decisions   |
| 2  | **Cloud Logging**        | Structured request/error logs with request ID correlation |
| 3  | **Cloud Storage**        | Static asset hosting and backup storage             |
| 4  | **BigQuery**             | Historical telemetry and incident analytics         |
| 5  | **Secret Manager**       | Secure storage for `GEMINI_API_KEY` and other credentials |
| 6  | **Error Reporting**      | Automatic capture and grouping of server-side exceptions |
| 7  | **Cloud Run**            | Containerized deployment target for the Express monolith |
| 8  | **Firebase Auth**        | Authentication hooks for role-based portal access   |
| 9  | **Firestore**            | Persistent document store for incidents and user preferences |
| 10 | **Google Fonts**         | Typography — loaded via CSP-allowlisted stylesheet link |
| 11 | **Maps (references)**    | Venue location context and geospatial data references |
| 12 | **reCAPTCHA**            | Bot protection hooks for public-facing form submissions |

> **Current state:** Services 1 (Gemini) is actively integrated. Services 2–12
> have integration hooks, configuration references, or planned implementation
> paths defined in the codebase. The application is designed to run fully
> functional with only the Gemini API key; all other services degrade gracefully
> when unavailable.

---

## Deployment

StadiaIQ is deployed on **Vercel** using a hybrid architecture:

### Build Pipeline

```
npm run build
  → Vite compiles React 19 SPA → dist/
  → Vercel packages Express 5 server → api/ serverless functions
```

### Vercel Configuration

| Aspect               | Configuration                                    |
| -------------------- | ------------------------------------------------ |
| **Framework**        | Vite                                             |
| **Build command**    | `npm run build`                                  |
| **Output directory** | `dist`                                           |
| **Serverless functions** | Express 5 API routes in `api/` directory     |
| **Environment vars** | `GEMINI_API_KEY`, `NODE_ENV`, `RATE_LIMIT_WINDOW`, `RATE_LIMIT_MAX` |
| **Regions**          | Auto (edge-optimized static, single-region serverless) |

### Static Assets

Vite-built HTML, CSS, JS, and SVG assets are served from Vercel's global CDN
with immutable cache headers on hashed filenames. The `index.html` entry point
uses `no-cache` to ensure clients always receive the latest application shell.

### Serverless Functions

Express route handlers are deployed as Vercel serverless functions. Each
incoming `/api/*` request invokes the Express middleware stack and route handler
within a serverless execution context. Cold starts are mitigated by keeping the
dependency tree lean and avoiding heavy initialization in the module scope.

### Alternative: Cloud Run

For deployments requiring persistent WebSocket connections, longer execution
timeouts, or a traditional container environment, the application can be
deployed to **Google Cloud Run** using the included `Dockerfile`. The Cloud Run
deployment runs the full Express 5 server as a long-lived process rather than
per-request serverless invocations.

---

*Last updated: 2026-07-15*
