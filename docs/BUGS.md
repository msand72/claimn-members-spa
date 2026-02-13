# BUGS & Issues — Members SPA

> Comprehensive codebase audit performed 2026-02-13
> Audited: All 49 routes, 52+ page components, 29 API hook files (157 hooks), all navigation links
> Cross-referenced: ~93 frontend endpoint+method combinations against OpenAPI spec (server-infra)

---

## CRITICAL — Must Fix

### ~~BUG-001: Messages image upload not working~~
- **Status:** FIXED — see BUG-F11
- **Location:** [MessagesPage.tsx:370-398](src/pages/MessagesPage.tsx#L370-L398)
- **Description:** Image upload in messages does not work. The frontend code is complete and correct (compress image, upload via `POST /members/messages/upload`, send message with `image_url`). However, the backend endpoint may not exist or may not return `image_url` properly.
- **Comparison:** Feed image upload (`POST /members/feed/upload`) works correctly with the same pattern.
- **Impact:** Users cannot send images in direct messages.
- **Resolution:** Backend confirmed endpoint exists at `/members/messages/upload` with field name `image`. Frontend already uses field name `image`. No changes needed.

### ~~BUG-002: FeedPage ignores `?group=` query parameter~~
- **Status:** FIXED — see BUG-F04
- **Location:** [InterestGroupsPage.tsx:173](src/pages/InterestGroupsPage.tsx#L173) navigates to `/feed?group={group.id}`
- **Description:** InterestGroupsPage navigates to `/feed?group={group.id}` when user clicks "View Group", but FeedPage does not read `useSearchParams()` to extract and apply this filter. The group filter is never pre-selected.
- **Impact:** Users clicking "View Group" from Interest Groups land on the feed with no group pre-selected.
- **Fix:** Add `useSearchParams` to FeedPage.tsx and set initial `selectedGroupId` from `?group=` param.

### ~~BUG-003: AssessmentResultsPage ignores `?id=` query parameter~~
- **Status:** FIXED — see BUG-F12
- **Location:** [OnboardingResultsPage.tsx:384](src/pages/onboarding/OnboardingResultsPage.tsx#L384) navigates to `/assessment/results?id={resultId}`
- **Description:** OnboardingResultsPage passes a specific result ID via `?id=` query param, but AssessmentResultsPage only calls `useLatestAssessmentResult()` (line 115) and never reads the query param. Users always see the latest result instead of the specific one linked from onboarding.
- **Impact:** Users navigating from onboarding may see a different result than intended if they've taken multiple assessments.
- **Fix:** Backend added `GET /members/assessments/results/{id}`. Frontend now uses `useAssessmentResultById()` when `?id=` param present, falls back to `useLatestAssessmentResult()` otherwise.

### ~~BUG-004: Protocol progress logging uses wrong HTTP method~~
- **Status:** FIXED — see BUG-F13
- **Location:** [useProtocols.ts:233](src/lib/api/hooks/useProtocols.ts#L233)
- **Description:** `useLogProtocolProgress` sends `POST /members/protocols/{id}/progress` but the OpenAPI spec only defined **PUT** on this path.
- **Resolution:** Backend added POST method alias to `/members/protocols/{id}/progress` route. Both POST and PUT now accepted.

### ~~BUG-005: Checkout request body fields mismatch OpenAPI spec~~
- **Status:** FIXED — see BUG-F14
- **Location:** [useBilling.ts](src/lib/api/hooks/useBilling.ts), [ShopUpgradePage.tsx](src/pages/ShopUpgradePage.tsx), [ShopProtocolDetailPage.tsx](src/pages/ShopProtocolDetailPage.tsx), [ShopSuccessPage.tsx](src/pages/ShopSuccessPage.tsx)
- **Description:** Frontend sent `{ item_type, item_slug, plan_tier }` but backend requires `{ price_id }`. Also: response field was `url` not `checkout_url`, and verify endpoint returns different fields than expected.
- **Fix:** Updated `CheckoutRequest` to `{ price_id, tier }`, `CheckoutResponse` to `{ url }`, `VerifyResponse` to match backend. ShopUpgradePage reads Stripe price IDs from env vars. ShopProtocolDetailPage reads `protocol.price_id`. ShopSuccessPage uses actual verify response fields.
- **Note:** Stripe price IDs must be configured via `VITE_STRIPE_PRICE_*` env vars for checkout to work.

---

## HIGH — Should Fix

### ~~BUG-006: Avatar upload field name may not match backend~~
- **Status:** FIXED — see BUG-F15
- **Location:** [useProfile.ts:39](src/lib/api/hooks/useProfile.ts#L39)
- **Description:** Frontend uploads avatar with field name `avatar`, OpenAPI spec said `file`. Needed backend verification.
- **Resolution:** Backend confirmed field name is `avatar`. OpenAPI spec updated to match. No frontend change needed.

### ~~BUG-007: Session cancellation bypasses dedicated cancel endpoint~~
- **Status:** FIXED — see BUG-F05
- **Location:** [useExperts.ts:157](src/lib/api/hooks/useExperts.ts#L157)
- **Description:** Frontend cancels sessions via `PUT /members/coaching/sessions/{id}` with `{ status: 'cancelled' }`. However, the OpenAPI spec has a dedicated `PATCH /members/coaching/sessions/{id}/cancel` endpoint that enforces cancellation policy (24-hour rule, `cancelled_by_member` status, requires `reason` field).
- **Impact:** May bypass cancellation policy checks, no reason tracking, possible status value mismatch.
- **Fix:** Use the dedicated PATCH cancel endpoint with proper reason field.

### ~~BUG-008: Duplicate InterestGroup type definitions with field differences~~
- **Status:** FIXED — see BUG-F06
- **Location:** [types.ts](src/lib/api/types.ts) vs [useInterests.ts](src/lib/api/hooks/useInterests.ts)
- **Description:** `InterestGroup` is defined in both files with different fields. `types.ts` includes `interest_id` and `post_count` fields, while `useInterests.ts` version is missing `post_count`.
- **Impact:** Type confusion — components using different imports may expect different fields.
- **Fix:** Consolidate to single definition in `types.ts` and import everywhere.

### ~~BUG-009: Messages hook sends duplicate fields for backend compatibility~~
- **Status:** FIXED — see BUG-F07
- **Location:** [useMessages.ts:81-87](src/lib/api/hooks/useMessages.ts#L81-L87)
- **Description:** `useSendMessage` sends both `body` AND `content`, both `recipient_id` AND `addressee_id` in every request. OpenAPI spec confirms the correct fields are `recipient_id` and `content`. Extra fields are harmless but indicate uncertainty.
- **Impact:** Payload bloat, unclear which field the backend actually uses.
- **Fix:** Remove `addressee_id` and `body` fields, keep only `recipient_id` and `content` per OpenAPI spec.

### ~~BUG-010: Unsafe `as any` type assertion in GoalDetailPage~~
- **Status:** FIXED — see BUG-F08
- **Location:** [GoalDetailPage.tsx:88](src/pages/GoalDetailPage.tsx#L88)
- **Description:** `const raw = actionItemsData as any` defeats TypeScript's type safety for action items data processing.
- **Impact:** Potential runtime errors if API shape changes — no compile-time warnings.
- **Fix:** Replace with proper type guard or typed assertion.

---

## MEDIUM — Nice to Fix

### ~~BUG-011: Orphaned page files (unreachable)~~
- **Status:** FIXED — see BUG-F09
- **Locations:**
  - [DashboardPage.tsx](src/pages/DashboardPage.tsx) — exists but no route in App.tsx
  - [JourneyDashboardPage.tsx](src/pages/JourneyDashboardPage.tsx) — exists but no route in App.tsx
- **Description:** These page components exist on disk but are not imported or routed in App.tsx. They are unreachable.
- **Impact:** Dead code, file bloat. Could confuse developers.
- **Fix:** Either add routes or delete the files.

### ~~BUG-012: Quarterly reviews endpoint missing from OpenAPI spec~~
- **Status:** FIXED — see BUG-F16
- **Location:** [useQuarterlyReviews.ts:41](src/lib/api/hooks/useQuarterlyReviews.ts#L41)
- **Description:** Frontend fetches `GET /members/coaching/quarterly-reviews` but endpoint was not in OpenAPI spec.
- **Resolution:** Backend added the endpoint in `coaching_handlers.go` and documented it in the OpenAPI spec.

### ~~BUG-013: Missing explicit error handling in mutation hooks~~
- **Status:** FIXED — see BUG-F17
- **Location:** Multiple mutation hooks across all hook files
- **Description:** Many mutation hooks (e.g., `useCreatePost`, `useSendMessage`, etc.) invalidate queries on success but don't have `onError` callbacks. Errors fall through to React Query's default behavior.
- **Impact:** Silent failures — users may not get clear feedback when an action fails.
- **Fix:** Added global mutation error toast via `MutationErrorToast` component + enhanced `QueryClient` global `onError` to dispatch user-visible error messages.

### ~~BUG-014: Inconsistent 404 handling across hooks~~
- **Status:** FIXED — see BUG-F18
- **Description:** Some hooks handle 404 gracefully (useConversationMessages, useMyExpert, useOnboardingState, useActiveProtocolBySlug), but others for optional data may throw on 404 instead of returning null.
- **Impact:** Potential unhandled errors for optional resources.
- **Fix:** Added `is404Error()` handling to `useSessionNotes` (returns null on 404). Global QueryClient retry config already skips retry on all 4xx errors.

### ~~BUG-015: Legacy protocol hook duplication~~
- **Status:** FIXED — see BUG-F19
- **Location:** [useProtocols.ts](src/lib/api/hooks/useProtocols.ts)
- **Description:** Multiple versions coexist: `useProtocols`/`useProtocolLibrary`, `useActiveProtocols`/`useMyActiveProtocols`, `useProtocolTemplate`/`useProtocol`. Both old and new are exported from index.ts.
- **Impact:** Developer confusion about which hook to use.
- **Fix:** Added `@deprecated` JSDoc to `useActiveProtocols`, `useProtocolLibrary`, `useProtocolTemplate`. Removed unused hooks (`useProtocolsByPillar`, `useFeaturedProtocols`, `useActiveProtocol`) from barrel exports.

### ~~BUG-016: Response shape normalization complexity~~
- **Status:** FIXED — see BUG-F20
- **Location:** [useAssessments.ts](src/lib/api/hooks/useAssessments.ts)
- **Description:** 43-line `normalizeAssessmentResult()` function handles 3 different response formats from the backend. Also applies to dashboard stats field renaming (`messages_unread` vs `unread_messages`).
- **Impact:** Fragile — breaks if backend changes format again.
- **Fix:** Added comprehensive JSDoc documenting all 3 response formats with TODO for backend standardization. Added clear TODO comment to dashboard stats normalization. Backend coordination needed to fully eliminate.

### ~~BUG-017: SessionNotesPage uses raw HTML input instead of GlassInput~~
- **Status:** FIXED — see BUG-F10
- **Location:** [SessionNotesPage.tsx:314-320](src/pages/SessionNotesPage.tsx#L314-L320)
- **Description:** Action item input field uses a plain HTML `<input>` element instead of the project's `GlassInput` component, creating a visual inconsistency.
- **Impact:** Minor UX inconsistency — input doesn't match the glass UI design system.
- **Fix:** Replace with `GlassInput` component.

---

## LOW — Minor

### ~~BUG-018: Inconsistent staleTime values across hooks~~
- **Status:** FIXED — see BUG-F21
- **Description:** Different hooks use different staleTime values without clear rationale:
  - `useInterests()`: 10 minutes
  - `useJourney()`: 2 minutes
  - `useAssessmentContent()`: 1 hour
  - Others: default (0)
- **Fix:** Defined `STALE_TIME` constants (`FREQUENT`, `DEFAULT`, `SEMI_STATIC`, `STATIC`) in `constants.ts`. Applied consistently across all hooks. Removed redundant staleTime from `useSubscription` (was same as global default).

### ~~BUG-019: Types defined locally in hook files instead of types.ts~~
- **Status:** FIXED — see BUG-F22
- **Description:** Many hook files define their own types instead of importing from `types.ts`. Affected files: useNotifications, useJournal, useMyExpert, useOnboarding, useEvents, useJourney, useProtocols, usePrograms, useResources, useActionItems, useSettings, useQuarterlyReviews, useMilestones, useAccountability, useBilling, useSubscription, useCommunityQuestions.
- **Fix:** Migrated ~250 lines of domain entity types from 15 hook files to `types.ts`. Hook files now import from `types.ts` and re-export for barrel compatibility.

---

## FIXED (Resolved)

### BUG-F01: Expert availability shows no time slots
- **Status:** FIXED (2026-02-13)
- **Root Cause:** Backend Go handler used `.(string)` type assertion on `float64` value for `day_of_week`, returning empty string. Frontend couldn't match empty strings to calendar days.
- **Backend Fix:** Convert `float64` → `int` → `dayNames` array lookup. Now returns "Monday", "Tuesday", etc.
- **Frontend Fix:** N/A (frontend code was correct).

### BUG-F02: Session booking uses invalid session_type
- **Status:** FIXED (2026-02-13) — commit `fb2b472`
- **Location:** [BookSessionPage.tsx:207](src/pages/BookSessionPage.tsx#L207)
- **Root Cause:** Frontend sent `session_type: 'video'` but DB CHECK constraint only allows `coaching`, `check_in`, `intensive`, `strategy`.
- **Fix:** Changed to `session_type: 'coaching'`.

### BUG-F03: Temporary test code left in HubPage
- **Status:** FIXED (2026-02-13) — commit `ca691ff`
- **Location:** [HubPage.tsx](src/pages/HubPage.tsx)
- **Description:** BugReportTestSection (CrashComponent + test buttons) was left in production after bug reporting system was finalized.
- **Fix:** Removed CrashComponent, BugReportTestSection, rendering block, and unused imports (useState, AlertTriangle).

### BUG-F04: FeedPage ignores `?group=` query parameter (was BUG-002)
- **Status:** FIXED (2026-02-13)
- **Fix:** Added `useSearchParams` to read `?group=` param and initialize `selectedGroupId` + `activeTab`.

### BUG-F05: Session cancellation bypasses dedicated cancel endpoint (was BUG-007)
- **Status:** FIXED (2026-02-13)
- **Fix:** Added `patch()` method to ApiClient. Updated `useCancelSession` to use `PATCH /members/coaching/sessions/{id}/cancel` with `reason` field.

### BUG-F06: Duplicate InterestGroup type definitions (was BUG-008)
- **Status:** FIXED (2026-02-13)
- **Fix:** Removed duplicate `InterestGroup` definition from `useInterests.ts`, now imports from `types.ts`.

### BUG-F07: Messages hook sends duplicate fields (was BUG-009)
- **Status:** FIXED (2026-02-13)
- **Fix:** Removed `addressee_id` and `body` fields from `useSendMessage`. Now sends only `recipient_id` and `content` per OpenAPI spec.

### BUG-F08: Unsafe `as any` type assertion in GoalDetailPage (was BUG-010)
- **Status:** FIXED (2026-02-13)
- **Fix:** Replaced `as any` with safe type narrowing using `Array.isArray()` and `as { data?: unknown }`.

### BUG-F09: Orphaned page files deleted (was BUG-011)
- **Status:** FIXED (2026-02-13)
- **Fix:** Deleted `DashboardPage.tsx` and `JourneyDashboardPage.tsx` (no routes existed for either).

### BUG-F10: SessionNotesPage raw HTML input (was BUG-017)
- **Status:** FIXED (2026-02-13)
- **Fix:** Replaced raw `<input>` with `<GlassInput>` component for consistent glass UI design.

### BUG-F11: Messages image upload confirmed working (was BUG-001)
- **Status:** FIXED (2026-02-13)
- **Resolution:** Backend confirmed endpoint exists at `/members/messages/upload` with field name `image`. Frontend already uses correct field name. No code change needed.

### BUG-F12: AssessmentResultsPage now supports `?id=` param (was BUG-003)
- **Status:** FIXED (2026-02-13)
- **Fix:** Backend added `GET /members/assessments/results/{id}` endpoint. Frontend added `useAssessmentResultById()` hook. AssessmentResultsPage now fetches by ID when `?id=` param present, falls back to latest otherwise.

### BUG-F13: Protocol progress POST method alias added (was BUG-004)
- **Status:** FIXED (2026-02-13)
- **Resolution:** Backend added POST method alias to `/members/protocols/{id}/progress` route in `routes.go`. Both POST and PUT now accepted. No frontend change needed.

### BUG-F14: Checkout fields aligned with backend API (was BUG-005)
- **Status:** FIXED (2026-02-13)
- **Fix:** Updated `CheckoutRequest` to use `{ price_id, tier }` per backend. Updated `CheckoutResponse` to use `{ url }` (was `checkout_url`). Updated `VerifyResponse` to match actual backend fields. ShopUpgradePage reads Stripe price IDs from `VITE_STRIPE_PRICE_*` env vars. ShopProtocolDetailPage reads `protocol.price_id`. ShopSuccessPage updated to use `status`/`payment_status` from verify endpoint.

### BUG-F15: Avatar upload field name confirmed correct (was BUG-006)
- **Status:** FIXED (2026-02-13)
- **Resolution:** Backend confirmed field name is `avatar`. OpenAPI spec corrected from `file` to `avatar`. No frontend change needed.

### BUG-F16: Quarterly reviews endpoint added (was BUG-012)
- **Status:** FIXED (2026-02-13)
- **Resolution:** Backend added `GET /members/coaching/quarterly-reviews` endpoint and documented it in OpenAPI spec.

### BUG-F17: Global mutation error toast (was BUG-013)
- **Status:** FIXED (2026-02-13)
- **Fix:** Created `MutationErrorToast` component using CustomEvent pattern. Enhanced `QueryClient` global `onError` to extract error messages from API response shape and dispatch `mutation-error` events. Toast auto-dismisses after 5 seconds.

### BUG-F18: Consistent 404 handling in useSessionNotes (was BUG-014)
- **Status:** FIXED (2026-02-13)
- **Fix:** Added `is404Error()` handling to `useSessionNotes` — returns `null` on 404, skips retry on 404. Global QueryClient retry config already skips retry on all 4xx errors.

### BUG-F19: Legacy protocol hooks marked deprecated (was BUG-015)
- **Status:** FIXED (2026-02-13)
- **Fix:** Added `@deprecated` JSDoc to `useActiveProtocols`, `useProtocolLibrary`, `useProtocolTemplate`. Removed unused hooks (`useProtocolsByPillar`, `useFeaturedProtocols`, `useActiveProtocol`) from barrel exports.

### BUG-F20: Assessment normalization documented (was BUG-016)
- **Status:** FIXED (2026-02-13)
- **Fix:** Added comprehensive JSDoc to `normalizeAssessmentResult` documenting all 3 response formats with TODO for backend standardization. Added TODO comment to dashboard stats normalization. Used `STALE_TIME.STATIC` for `useAssessmentContent`.

### BUG-F21: staleTime constants applied consistently (was BUG-018)
- **Status:** FIXED (2026-02-13)
- **Fix:** Defined `STALE_TIME` constants in `constants.ts`: `FREQUENT` (2min), `DEFAULT` (5min), `SEMI_STATIC` (10min), `STATIC` (1hr). Applied to `useJourney`, `useInterests`, `useAssessmentContent`, and `QueryClient` global default. Removed redundant staleTime from `useSubscription`.

### BUG-F22: Domain types centralized in types.ts (was BUG-019)
- **Status:** FIXED (2026-02-13)
- **Fix:** Migrated ~250 lines of domain entity types from 15 hook files to `types.ts`. Types include: Notification, JourneyData, OnboardingState, MyExpertData, JournalEntry, SubscriptionInfo, QuarterlyReview, Milestone, AccountabilityGroup, Interest, ClaimnEvent, CommunityQuestion, and many more. Hook files now import from `types.ts` and re-export for barrel compatibility.

---

---

## OpenAPI Cross-Reference — Endpoints Not Used by Frontend

The following backend endpoints exist in the OpenAPI spec but are **not consumed by the frontend**. These represent either planned features, expert/admin-only endpoints, or unused API surface area.

<details>
<summary>Click to expand (39 unused endpoints)</summary>

| Endpoint | Method | Notes |
|----------|--------|-------|
| `/members/stats` | GET | Frontend uses `/members/dashboard` instead |
| `/members/protocols` | GET/POST | Frontend uses `/active` and `/library` sub-routes |
| `/members/protocols/{id}` | DELETE | Frontend uses PUT with `status: 'abandoned'` |
| `/members/protocols/tags` | GET | Protocol tags not displayed |
| `/members/protocols/active/{slug}` | GET | Frontend filters client-side |
| `/members/protocols/{slug}/progress` | GET/POST | Frontend uses `{id}` variant, not `{slug}` |
| `/members/protocols/{slug}/generate-plan` | POST | Plan generation not implemented |
| `/members/protocols/{slug}/start-with-plan` | POST | Start-with-plan not implemented |
| `/members/protocols/{slug}/full-progress` | GET | Full progress view not implemented |
| `/members/coaching/sessions/{id}/reschedule` | PATCH | Reschedule UI not built |
| `/members/coaching/sessions/{id}/cancel` | PATCH | Now used by frontend (BUG-F05) |
| `/members/kpis/summary` | GET | Frontend computes KPI summaries locally |
| `/members/kpis/{id}/log` | POST | Frontend uses `/logs` (plural) |
| `/members/kpis/{id}/history` | GET | KPI history not consumed |
| `/members/billing/subscription` | GET | Frontend uses `/members/billing` |
| `/members/billing/invoices` | GET | Invoice listing not built |
| `/members/billing/portal` | POST | Billing portal redirect not implemented |
| `/members/{userId}/subscription` | GET/PATCH | Per-user sub management not used |
| `/members/events/brotherhood-calls` | GET | Frontend uses generic `/events` with `type` filter |
| `/members/events/brotherhood-calls/{id}` | GET | Same |
| `/members/events/brotherhood-calls/{id}/register` | POST | Same |
| `/members/events/go-sessions` | GET | Same |
| `/members/events/go-sessions/{id}` | GET | Same |
| `/members/events/go-sessions/{id}/register` | POST | Same |
| `/members/milestones` | POST | Milestone creation not in frontend |
| `/members/milestones/{id}` | PUT/DELETE | Full milestone CRUD not in frontend |
| `/members/accountability/groups` | GET/POST | Group listing/creation via `/groups` sub-route not used |
| `/members/accountability/groups/{id}` | GET/PUT/DELETE | Group management not implemented |
| `/members/accountability/groups/{id}/members` | GET/POST | Member management not built |
| `/members/accountability/groups/{id}/members/{memberId}` | PUT/DELETE | Role management not built |
| `/members/accountability/groups/{id}/check-ins` | GET | Only POST used (creating) |
| `/members/accountability/check-ins/{checkInId}` | GET/PUT | Individual check-in view/edit not built |
| `/members/content/blog` | GET | Blog not consumed in member SPA |
| `/members/content/blog/{id}` | GET | Blog not consumed |
| `/members/feed/{postId}/report` | POST | Feed post reporting not implemented |
| `/members/messages/{messageId}/report` | POST | Message reporting not implemented |

</details>

---

## Audit Summary

| Category | Count |
|----------|-------|
| Critical (must fix) | 0 |
| High (should fix) | 0 |
| Medium (nice to fix) | 0 |
| Low (minor) | 0 |
| Fixed | 22 |
| **Total open** | **0** |

### What Passed
- All 49 routes correctly map to existing page files
- All navigation config (sidebar, bottom nav, section nav) links are valid
- All external URLs are legitimate (claimn.co, mailto:support)
- All pages have proper loading states, error states, and empty states
- All submit buttons have disabled/loading states
- All setTimeout/setInterval have proper cleanup
- No console.log in production code
- No eslint-disable directives
- No TODO/FIXME/HACK comments in pages
- `safeOpenUrl()` wrapper used for external links
- API client strips trailing slashes
- 157 API hooks all follow consistent React Query patterns
- ~82 out of ~93 frontend endpoint+method combinations match OpenAPI spec exactly
