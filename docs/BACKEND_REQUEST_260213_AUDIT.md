# Backend API Changes Request — Combined Audit (2026-02-13)

> From comprehensive audits of both **members-spa** and **admin-spa** codebases.
> All frontend fixes have been applied. The items below require **backend verification or changes**.

---

## IMPORTANT: Admin-SPA Safety

**Do NOT modify any handler that serves `/api/v2/admin/*` routes in a way that changes existing response shapes or breaks existing behavior.** Both the admin-spa and members-spa depend on the same backend — changes must be backwards-compatible.

---

## Part A: Members-SPA Backend Issues

### A1. CRITICAL — Messages image upload endpoint may not exist
- **Frontend location:** `members-spa/src/pages/MessagesPage.tsx:370-398`
- **Endpoint:** `POST /members/messages/upload`
- **Issue:** Frontend code is complete (compress image, upload via POST, send message with `image_url`). However, this endpoint may not exist in the backend. The feed equivalent (`POST /members/feed/upload`) works correctly.
- **Action:** Verify `/members/messages/upload` endpoint exists and returns `{ url: string }`. If it doesn't exist, create it following the same pattern as `/members/feed/upload`.

### A2. CRITICAL — Assessment result by ID endpoint needed
- **Frontend location:** `members-spa/src/pages/AssessmentResultsPage.tsx`
- **Endpoint:** `GET /members/assessments/results/{id}`
- **Issue:** OnboardingResultsPage navigates to `/assessment/results?id={resultId}` but AssessmentResultsPage can only fetch the latest result. The frontend is ready to use a by-ID endpoint when available.
- **Action:** Add `GET /members/assessments/results/{id}` endpoint that returns a single assessment result by ID. Should use the same response shape as `GET /members/assessments/results/latest`.

### A3. CRITICAL — Protocol progress POST vs PUT method mismatch
- **Frontend location:** `members-spa/src/lib/api/hooks/useProtocols.ts:233`
- **Endpoint:** `POST /members/protocols/{id}/progress`
- **Issue:** Frontend sends `POST` but OpenAPI spec only defines `PUT` on this path. The `useUpdateProtocolProgress` hook (line 345) correctly uses PUT. The spec also has `POST /members/protocols/{slug}/progress` (slug variant, not id).
- **Action:** Verify if POST is accepted at `/members/protocols/{id}/progress`. If not, either:
  - (a) Add POST support to the handler, OR
  - (b) Confirm that only PUT should be used and we'll update the frontend.

### A4. CRITICAL — Checkout request body fields mismatch
- **Frontend location:** `members-spa/src/lib/api/hooks/useBilling.ts:36`
- **Endpoint:** `POST /members/billing/checkout`
- **Issue:** Frontend sends `{ item_type, item_slug, plan_tier }` but OpenAPI spec requires `{ price_id }` (a Stripe price ID). None of the frontend fields match.
- **Action:** Verify which fields the checkout handler actually accepts. If it accepts `item_type/item_slug/plan_tier`, update the OpenAPI spec. If it expects `price_id`, we need to update the frontend.

### A5. HIGH — Avatar upload multipart field name
- **Frontend location:** `members-spa/src/lib/api/hooks/useProfile.ts:39`
- **Endpoint:** `POST /members/profile/avatar`
- **Issue:** Frontend sends the file with field name `avatar`, but OpenAPI spec says the field name should be `file`.
- **Action:** Verify which field name the handler reads. If it expects `file`, we'll update the frontend. If it accepts `avatar`, update the spec.

### A6. MEDIUM — Quarterly reviews endpoint not in OpenAPI spec
- **Frontend location:** `members-spa/src/lib/api/hooks/useQuarterlyReviews.ts:41`
- **Endpoint:** `GET /members/coaching/quarterly-reviews`
- **Issue:** Frontend fetches this endpoint but it's not documented in the OpenAPI spec.
- **Action:** Verify the endpoint exists and add it to the OpenAPI spec.

---

## Part B: Admin-SPA Backend Issues

### B1. CRITICAL — Verify `assignClientToExpert` request body field name
- **Endpoint:** `PUT /admin/experts/{id}/clients`
- **Issue:** The OpenAPI spec (`openapi.yaml`) documents the request body as `{ member_id: string }`, but the admin frontend was previously sending `{ client_id: string }`. The admin-spa frontend has been fixed to send `member_id` per the spec.
- **Action:** Confirm the backend handler actually reads `member_id` from the request body (not `client_id`). If the backend was reading `client_id`, it needs to be updated to match the spec, or both the spec and frontend need to revert.

### B2. MEDIUM — Add pagination to 9 sub-resource endpoints
These endpoints currently return raw JSON arrays. For members with many records, this could cause performance issues. They should return the standard paginated wrapper: `{ "data": [...], "total": N, "page": N, "page_size": N }`, consistent with other paginated endpoints.

**Endpoints needing pagination:**
1. `GET /admin/members/{id}/goals`
2. `GET /admin/members/{id}/protocols`
3. `GET /admin/members/{id}/kpis`
4. `GET /admin/members/{id}/milestones`
5. `GET /admin/members/{id}/assessments`
6. `GET /admin/community/questions`
7. `GET /admin/community/questions/{id}/answers`
8. `GET /admin/programs/{id}/accountability`
9. `GET /admin/members/needs-attention`

- **Action:** Consider adding `page` and `page_size` query params and returning the paginated wrapper. Default to returning all results when params are omitted (backwards compatible).

### B3. LOW — OpenAPI spec documentation gaps (107+ endpoints)
The OpenAPI spec at `claimn-api/handlers/docs/static/openapi.yaml` documents ~68 admin paths, but the admin frontend uses ~175+ endpoints. These undocumented feature groups are working in production but missing from the spec:

- Coaching sessions (7), Brotherhood calls (5), GO sessions (5)
- Events/attendance (3), Circles (5), Interests (4)
- Assessments — areas, templates, questions, results, analytics (15)
- Program assessments + questions (10), Achievements (4)
- Leads (1), Subscriptions (1), Surveys (10)
- Testimonials + Expert testimonials (10)
- Expert sessions/purchases/availability/clients (10)
- Journal (5), Notifications (6)
- Social content — posts, comments, likes, messages, conversations, connections (18)
- Junction table CRUD — circle-members, member-interests, etc. (11)
- Admin user management (5)
- Program sub-resources — cohorts, applications, accountability, sprints, completions (16)
- Member sub-resource CRUD — goals, kpis, milestones, actions, protocols, reviews (17)

- **Action:** When time permits, add these endpoints to the OpenAPI spec for documentation completeness. This is a maintenance/hygiene task, not urgent.

### B4. INFO — 4 spec-documented endpoints with no frontend usage

| Endpoint | Method | Status |
|----------|--------|--------|
| `/admin/programs/{id}/enrollments` | GET | No frontend UI |
| `/admin/media` | GET | No frontend UI |
| `/admin/media/upload` | POST | No frontend UI |
| `/admin/media/{id}` | PUT, DELETE | No frontend UI |

- **Action:** No change needed. The admin-spa may build media library UI in a future phase. Just flagging for awareness.

---

## Resolution Status (updated 2026-02-13)

| Item | Status | Resolution |
|------|--------|------------|
| A1 | RESOLVED | Endpoint exists, field name `image` matches frontend |
| A2 | RESOLVED | Backend added `GET /members/assessments/results/{id}`, frontend wired up |
| A3 | RESOLVED | Backend added POST alias to protocol progress route |
| A4 | RESOLVED | Frontend updated to send `price_id` + `tier`, env vars for Stripe price IDs |
| A5 | RESOLVED | Backend confirmed `avatar` is correct, OpenAPI spec updated |
| A6 | RESOLVED | Backend added quarterly reviews endpoint + OpenAPI spec |
| B1 | RESOLVED | Backend confirmed handler reads `member_id` (matches spec + frontend) |
| B2 | RESOLVED | Backend added opt-in pagination to 7 admin endpoints |
| B3 | OPEN | Documentation hygiene — not urgent |
| B4 | INFO | No action needed |
