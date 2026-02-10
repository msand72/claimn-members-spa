# Hardening Progress — claimn-members-spa

**Started:** 2026-02-10
**Status:** Complete

---

## Phase 1: Critical Security Fixes

| Task | Description | Status |
|------|-------------|--------|
| 1.1 | Create URL validation utility (`src/lib/url-validation.ts`) | [x] |
| 1.2 | Fix open redirect in LoginPage | [x] |
| 1.3 | Fix open redirect in AssessmentTakePage | [x] |
| 1.4 | Validate checkout redirect URLs (3 files) | [x] |
| 1.5 | Add security headers to vercel.json | [x] |
| 1.6 | Add .env patterns to .gitignore | [x] |

**Phase 1 verified:** [x] `npm run build` passes | [ ] Manual redirect test

---

## Phase 2: API Client Hardening

| Task | Description | Status |
|------|-------------|--------|
| 2.1 | Add 401 interceptor to API client | [x] |
| 2.2 | Add request timeouts (30s API, 120s upload, 15s auth) | [x] |
| 2.3 | Lock down debug mode in production | [x] |
| 2.4 | Guard window.__apiErrors in production | [x] |
| 2.5 | Add cross-tab session sync | [x] |

**Phase 2 verified:** [x] `npm run build` passes | [ ] Expired token test | [ ] Cross-tab logout test

---

## Phase 3: Query & Mutation Resilience

| Task | Description | Status |
|------|-------------|--------|
| 3.1 | Add `enabled` guards to 13 unguarded queries (7 files) | [x] |
| 3.2 | Add global mutation error handler in QueryClient | [x] |
| 3.3 | Wrap JSON.parse calls in try-catch (2 files) | [x] |
| 3.4 | Harden token exchange fallback logging | [x] |

**Phase 3 verified:** [x] `npm run build` passes | [ ] No 401 flash on load

---

## Phase 4: UI Resilience

| Task | Description | Status |
|------|-------------|--------|
| 4.1 | Wrap HubPage sections in PageErrorBoundary (9 sections) | [x] |
| 4.2 | Clean up uncleared setTimeout calls (6 files) | [x] |
| 4.3 | Validate URLs in window.open() calls (11 instances, 6 files) | [x] |

**Phase 4 verified:** [x] `npm run build` passes | [ ] HubPage section isolation test

---

## Phase 5: Data Integrity

| Task | Description | Status |
|------|-------------|--------|
| 5.1 | Add isPending guards to critical mutations | [x] |
| 5.2 | Add basic input validation before mutations | [x] |
| 5.3 | Add optimistic updates to high-frequency mutations | [x] |

**Phase 5 verified:** [x] `npm run build` passes | [ ] Double-click test

---

## Phase 6: Polish & Observability

| Task | Description | Status |
|------|-------------|--------|
| 6.1 | Standardize safeArray usage in HubPage (7 replacements) | [x] |
| 6.2 | Gate console output in production (already done in Phase 2) | [x] |
| 6.3 | Add confirmation dialog to destructive actions (ConnectionsPage) | [x] |
| 6.4 | Fix array index keys in dynamic lists (HubPage upcoming) | [x] |

**Phase 6 verified:** [x] `npm run build` passes

---

## Summary

| Phase | Tasks | Done | Status |
|-------|-------|------|--------|
| 1 — Critical Security | 6 | 6 | Complete |
| 2 — API Client | 5 | 5 | Complete |
| 3 — Query/Mutation | 4 | 4 | Complete |
| 4 — UI Resilience | 3 | 3 | Complete |
| 5 — Data Integrity | 3 | 3 | Complete |
| 6 — Polish | 4 | 4 | Complete |
| **Total** | **25** | **25** | **All Complete** |
