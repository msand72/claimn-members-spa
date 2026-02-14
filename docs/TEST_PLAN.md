# Test Plan — CLAIM'N Members SPA

**Created:** 2026-02-13
**Last Updated:** 2026-02-13
**Status:** ALL PHASES COMPLETE — 207 tests passing across 20 files
**Framework:** Vitest + React Testing Library + MSW

---

## Implementation Progress

| Phase | Status | Files | Tests |
|-------|--------|-------|-------|
| 1 — Infrastructure | DONE | 5 config/setup files | — |
| 2 — Utility tests | DONE | 6 | 100 |
| 3 — API Client tests | DONE | 1 | 11 |
| 4 — API Hooks | DONE | 7 | 55 |
| 5 — Component tests | DONE | 1 | 10 |
| 6 — Page integration | DONE | 3 | 26 |
| 7 — Regression tests | DONE | 1 | 10 |
| 8 — CI integration | DONE | package.json updated | — |
| **Total** | **COMPLETE** | **20** | **207 passing** |

### Files Created

```
vitest.config.ts                          # Vitest configuration
src/test/setup.ts                         # Global test setup (jsdom, MSW, mocks)
src/test/mocks/server.ts                  # MSW server instance
src/test/mocks/handlers.ts                # MSW request handlers (happy path)
src/test/utils.tsx                        # Custom render with providers
src/test/smoke.test.ts                    # 2 infrastructure smoke tests
src/test/regression.test.ts               # 10 regression tests for fixed bugs
src/lib/url-validation.test.ts            # 18 tests — redirect safety, URL validation
src/lib/isChunkLoadError.test.ts          # 8 tests — chunk error detection
src/lib/protocol-plan.test.ts             # 15 tests — protocol tag parsing, plan generation
src/lib/image-utils.test.ts              # 10 tests — file validation, blob conversion
src/lib/constants.test.ts                # 21 tests — archetypes, pillars, KPIs, stale times
src/lib/api/client.test.ts              # 28 tests — safeArray, safePagination, is404Error
src/lib/api/client.request.test.ts      # 11 tests — ApiClient HTTP methods, auth, errors
src/components/ReportModal.test.tsx      # 10 tests — modal state, submit, cancel, pending
src/lib/api/hooks/useFeed.test.ts        # 7 tests — feed CRUD, likes, comments
src/lib/api/hooks/useMessages.test.ts    # 5 tests — conversations, send, report, read, delete
src/lib/api/hooks/useExperts.test.ts     # 7 tests — experts, sessions, reschedule, notes
src/lib/api/hooks/useProfile.test.ts     # 2 tests — get and update profile
src/lib/api/hooks/useGoals.test.ts       # 3 tests — goals CRUD with filters
src/lib/api/hooks/useConnections.test.ts # 5 tests — connections CRUD, accept/reject
src/lib/api/hooks/remaining-hooks.test.ts # 19 tests — protocols, billing, notifications,
                                          #   journey, circles, events, action items,
                                          #   subscription, interests, onboarding, dashboard,
                                          #   network, settings
src/pages/LoginPage.test.tsx              # 7 tests — form, auth, redirect, error states
src/pages/FeedPage.test.tsx              # 9 tests — posts, create, like, comments, report
src/pages/ExpertSessionsPage.test.tsx    # 10 tests — sessions, filter, reschedule, error/empty
```

---

## Previous State

- **Comprehensive audit completed** — 49 routes, 93 API endpoints, 22 bugs fixed, security hardened
- **Existing documentation** — BUGS.md, HARDENING_PROGRESS.md, BUG_REPORTING_SYSTEM.md, FRONTEND_BUG_REPORTING_SPEC.md

---

## Stack

| Tool | Purpose |
|------|---------|
| **Vitest** | Test runner (native Vite integration, ESM, fast) |
| **@testing-library/react** | Component rendering + user interaction |
| **@testing-library/jest-dom** | DOM assertion matchers |
| **@testing-library/user-event** | Realistic user event simulation |
| **MSW** (Mock Service Worker) | API request interception for hook/integration tests |
| **jsdom** | Browser environment simulation |

---

## Phase 1: Infrastructure Setup

### 1.1 Install dependencies

```bash
npm i -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event msw jsdom
```

### 1.2 Configuration files

**`vitest.config.ts`** — Extends vite.config.ts, adds jsdom environment, setup file, coverage

**`src/test/setup.ts`** — Global test setup:
- Import `@testing-library/jest-dom/vitest`
- MSW server start/stop/reset between tests
- Mock `window.matchMedia`, `IntersectionObserver`, `ResizeObserver`
- Mock `import.meta.env` values

**`src/test/mocks/handlers.ts`** — MSW request handlers for all API endpoints

**`src/test/mocks/server.ts`** — MSW server instance

**`src/test/utils.tsx`** — Custom `render()` wrapper with providers:
- `QueryClientProvider` (fresh client per test)
- `MemoryRouter` (for route-dependent components)

### 1.3 Package.json scripts

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

### 1.4 TypeScript config

Add `"types": ["vitest/globals"]` to tsconfig. Exclude test files from build via `tsconfig.app.json`:
```json
"exclude": ["src/**/*.test.ts", "src/**/*.test.tsx", "src/test/**"]
```

---

## Phase 2: Utility & Helper Tests (100 tests, 6 files)

Pure functions with no DOM or React dependencies.

### 2.1 `src/lib/url-validation.test.ts` — 18 tests

| Function | Test Cases |
|----------|-----------|
| `isSafeRedirect` | Valid `/path`, rejects `//evil.com`, rejects `/@inject`, rejects empty |
| `sanitizeRedirect` | Returns URL when safe, returns fallback when unsafe, handles null |
| `isAllowedExternalUrl` | Accepts Stripe hosts, rejects http, rejects invalid URL |
| `safeOpenUrl` | Accepts http/https, rejects `javascript:`, rejects `data:` |

### 2.2 `src/lib/isChunkLoadError.test.ts` — 8 tests

Detects Chrome/Firefox/Safari/webpack chunk errors, SyntaxError from 404, rejects normal Error.

### 2.3 `src/lib/protocol-plan.test.ts` — 15 tests

| Function | Test Cases |
|----------|-----------|
| `getProtocolSlugFromGoal` | Extracts slug, returns null if no tag, handles null |
| `stripProtocolTag` | Removes tag, trims whitespace, handles null |
| `addProtocolTag` | Adds tag, replaces existing, handles empty |
| `generatePlanFromProtocol` | Creates goals from steps/sections, fallback, target date |

### 2.4 `src/lib/image-utils.test.ts` — 10 tests

Validates JPEG/PNG/GIF/WebP, rejects non-image, rejects oversized, custom maxSizeMB, blobToFile.

### 2.5 `src/lib/api/client.test.ts` — 28 tests

| Function | Test Cases |
|----------|-----------|
| `safeArray` | Extracts from `{data}`, `{items}`, `{results}`, bare array, returns `[]` for null |
| `safePagination` | Extracts from `{pagination}`, `{meta}`, defaults |
| `safeString` | Returns string, fallback for missing/empty |
| `unwrapData` | Unwraps `{data: obj}`, as-is, null |
| `is404Error` | `{status: 404}`, `{statusCode: 404}`, false for others |

### 2.6 `src/lib/constants.test.ts` — 21 tests

Archetypes (6), Pillars (5), getPillar, getKpiType, REPORT_REASONS (5), STALE_TIME ordering.

---

## Phase 3: API Client Tests (11 tests, 1 file)

### `src/lib/api/client.request.test.ts`

Tests using MSW to intercept fetch calls:

| Scenario | Test |
|----------|------|
| GET request | Correct URL, auth header, parsed JSON |
| GET with params | Query string built, undefined omitted |
| POST request | JSON body, correct Content-Type |
| PUT/PATCH/DELETE | Correct HTTP method |
| Trailing slash | Stripped from endpoint |
| 401 response | Clears tokens, throws "Session expired" |
| 204 No Content | Returns empty object |
| Error response | Throws `{ error: { code, message }, status }` |

---

## Phase 4: API Hook Tests (55 tests, 7 files)

Each hook tested with MSW. Verifies correct endpoint, HTTP method, request body, and query params.

| File | Tests | Key Hooks |
|------|-------|-----------|
| `useFeed.test.ts` | 7 | useFeed, useCreatePost, useLikePost, useUnlikePost, useDeletePost, useAddComment |
| `useMessages.test.ts` | 5 | useConversations, useSendMessage, useReportMessage, useMarkMessageRead, useDeleteMessage |
| `useExperts.test.ts` | 7 | useExperts, useCoachingSessions, useBookSession, useCancelSession, useRescheduleSession, useSessionNotes (404), useUpdateSessionNotes |
| `useProfile.test.ts` | 2 | useCurrentProfile, useUpdateProfile |
| `useGoals.test.ts` | 3 | useGoals (filters), useCreateGoal, useDeleteGoal |
| `useConnections.test.ts` | 5 | useConnections, useSendConnectionRequest, useAcceptConnection, useRejectConnection, useRemoveConnection |
| `remaining-hooks.test.ts` | 19 | useProtocols, useBilling, useNotifications, useJourney, useCircles, useEvents, useActionItems, useSubscription, useInterests, useOnboarding, useDashboard, useNetwork, useSettings |

---

## Phase 5: Component Tests (10 tests, 1 file)

### `src/components/ReportModal.test.tsx`

| Test | Description |
|------|-------------|
| Renders when open | Modal visible with title, reason select |
| Custom title | Uses provided title prop |
| No details initially | Details textarea hidden until reason selected |
| Shows details on select | Selecting reason reveals textarea |
| Submit disabled | Button disabled without reason |
| Submit with reason + details | Calls onSubmit with `{ reason, details }` |
| Submit reason only | Details undefined when empty |
| Pending state | Button shows "Submitting..." and disabled |
| Cancel | Calls onClose |
| Not rendered when closed | Nothing in DOM when isOpen=false |

---

## Phase 6: Page Integration Tests (26 tests, 3 files)

Full page rendering with MSW API mocking and user interaction testing.

### `src/pages/LoginPage.test.tsx` — 7 tests

| Test | Description |
|------|-------------|
| Renders branding | CLAIM'N title, Members Portal, form fields |
| Forgot password link | Link visible |
| Calls signIn | Email + password submitted to auth |
| Navigates on success | Redirects to / after login |
| Redirect param | `?redirect=/goals` respected |
| Error display | Shows "Invalid credentials" on failure |
| Loading state | Button disabled, shows "Signing in..." |

### `src/pages/FeedPage.test.tsx` — 9 tests

| Test | Description |
|------|-------------|
| Renders page | Title, create post textarea visible |
| Displays post | Author name, content shown |
| Like/comment counts | Numbers displayed |
| Post button disabled | Empty textarea = disabled |
| Post button enabled | Text entered = enabled |
| Creates post | Content sent to API |
| Empty state | "No posts yet" when feed empty |
| Comments toggle | Click comment icon opens input |
| Report flow | More menu > Report Post > modal |

### `src/pages/ExpertSessionsPage.test.tsx` — 10 tests

| Test | Description |
|------|-------------|
| Page title | "My Sessions" and "Book New Session" |
| Session cards | Expert names displayed |
| Stats cards | Upcoming, Completed, Avg Rating |
| Filter buttons | all/upcoming/completed present |
| Join Call | Button visible for upcoming sessions |
| Empty state | "No sessions found" with book button |
| Error state | "Failed to load sessions" |
| Reschedule modal | Opens on button click |
| Disabled without datetime | Submit disabled until date entered |
| Reschedule success | Shows "Reschedule Requested" after submit |

---

## Phase 7: Regression Tests (10 tests, 1 file)

### `src/test/regression.test.ts`

| Bug | Regression Test |
|-----|----------------|
| BUG-F02 | `useBookSession` sends `session_type: 'coaching'` |
| BUG-F05 | `useCancelSession` calls PATCH /sessions/{id}/cancel |
| BUG-F07 | `useSendMessage` sends `content` + `recipient_id` |
| BUG-F14 | `useCheckout` sends `price_id` + `tier` |
| BUG-F17 | Global mutation error dispatches CustomEvent |
| BUG-F18 | `useSessionNotes` returns null on 404 |
| BUG-F21 | STALE_TIME constants correct |
| NEW | `useReportPost` POST /members/feed/{id}/report |
| NEW | `useReportMessage` POST /members/messages/{id}/report |
| NEW | `useRescheduleSession` PATCH /sessions/{id}/reschedule |

---

## Phase 8: CI Integration

### Package.json scripts

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

### TypeScript build exclusion

Test files excluded from production build via `tsconfig.app.json`:
```json
"exclude": ["src/**/*.test.ts", "src/**/*.test.tsx", "src/test/**"]
```

---

## Test Count Summary

| Phase | Files | Tests | Status |
|-------|-------|-------|--------|
| 2 — Utilities | 6 | 100 | DONE |
| 3 — API Client | 1 | 11 | DONE |
| 4 — API Hooks | 7 | 55 | DONE |
| 5 — Components | 1 | 10 | DONE |
| 6 — Page Integration | 3 | 26 | DONE |
| 7 — Regression | 1 | 10 | DONE |
| Smoke | 1 | 2 | — |
| **Total** | **20** | **207** | **ALL PASSING** |

Build: `npm run build` passes clean (0 TypeScript errors)
Tests: `npm test` — 207 tests, 20 files, ~4s runtime
