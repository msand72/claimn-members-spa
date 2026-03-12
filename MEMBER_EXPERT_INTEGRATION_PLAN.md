# Member-Expert Integration Plan

**Created:** 2026-03-07
**Status:** In Progress
**Scope:** members-spa, admin-spa, server-infra

This document tracks all issues and tasks needed to make member-expert interactions fully functional across the CLAIM'N platform.

---

## Table of Contents

1. [Phase 1: Critical Fixes](#phase-1-critical-fixes)
2. [Phase 2: Core Functionality Gaps](#phase-2-core-functionality-gaps)
3. [Phase 3: UX & Polish](#phase-3-ux--polish)
4. [Phase 4: Advanced Features](#phase-4-advanced-features)
5. [Cross-Cutting Concerns](#cross-cutting-concerns)

---

## Phase 1: Critical Fixes

These are blocking issues that break core member-expert workflows.

### 1.1 External Calendar Integration (Microsoft, Google, Calendly)

**Problem:** The booking system is fundamentally unreliable. Experts manage their real schedules in external calendars (Outlook, Google Calendar, Calendly), but CLAIM'N only has static recurring weekly availability slots. There is zero sync between external calendars and the internal system. If an expert has `calendar_url` set, members are just redirected to an external link and the booking never comes back into CLAIM'N. This creates two parallel systems that don't talk to each other.

**Current state:**
- `calendar_url` field exists on expert profile (plain text link, typically Calendly)
- `has_external_booking` is derived from `calendar_url != ""` — it's just a boolean flag
- If set, BookSessionPage shows "Book via external calendar" link instead of internal picker
- No OAuth, no webhooks, no sync infrastructure exists
- No calendar-related environment variables or API keys configured
- Admin-spa has no UI to connect/manage calendar integrations

**Supported providers (all first-class):**
- **Microsoft** (Outlook Calendar / Teams) — via Microsoft Graph API
- **Google** (Google Calendar / Google Meet) — via Google Calendar API
- **Calendly** — via Calendly API v2

**Architecture Decision:** Build a provider-agnostic calendar service with a common interface. Each provider implements the same contract:
- Read free/busy times from the expert's calendar
- Create calendar events when sessions are booked
- Auto-generate meeting links (Teams / Google Meet / Calendly-provided)
- Receive webhooks for external changes
- OAuth connect/disconnect flow

The backend implements a `CalendarProvider` interface so adding new providers later is straightforward.

**Tasks:**

#### 1.1A — Database Schema & Provider Interface

- [ ] **1.1.1** [server-infra] Add calendar integration fields to experts table
  - `calendar_provider` ENUM: `none`, `microsoft`, `google`, `calendly`
  - `calendar_access_token` TEXT (encrypted)
  - `calendar_refresh_token` TEXT (encrypted)
  - `calendar_token_expiry` TIMESTAMP
  - `calendar_connected_at` TIMESTAMP
  - `calendar_email` TEXT — the calendar account email
  - `calendar_event_id` on coaching_sessions table — to track pushed events
- [ ] **1.1.2** [server-infra] Define `CalendarProvider` interface in Go
  ```go
  type CalendarProvider interface {
      GetAuthURL(state string) string
      ExchangeToken(code string) (*CalendarTokens, error)
      RefreshToken(refreshToken string) (*CalendarTokens, error)
      GetFreeBusy(token string, date time.Time) ([]BusyBlock, error)
      CreateEvent(token string, event CalendarEvent) (eventID string, meetingURL string, err error)
      UpdateEvent(token string, eventID string, event CalendarEvent) error
      DeleteEvent(token string, eventID string) error
      SubscribeToChanges(token string, webhookURL string) (subscriptionID string, err error)
      RevokeToken(token string) error
  }
  ```
- [ ] **1.1.3** [server-infra] Implement provider-agnostic calendar endpoints
  - `GET /api/v2/expert/calendar/connect?provider=microsoft|google|calendly` — generate OAuth URL per provider
  - `GET /api/v2/expert/calendar/callback?provider=...` — handle OAuth callback, exchange code, store tokens
  - `DELETE /api/v2/expert/calendar/disconnect` — revoke tokens, clear connection (works for any provider)
  - `GET /api/v2/expert/calendar/status` — return: `{ connected, provider, email, connected_at }`

#### 1.1B — Microsoft Provider (Outlook / Teams)

- [ ] **1.1.4** [server-infra] Register CLAIM'N as an Azure AD application
  - Create app registration in Azure Portal
  - Required permissions: `Calendars.ReadWrite`, `OnlineMeetings.ReadWrite`, `User.Read`
  - Configure redirect URI for OAuth callback
- [ ] **1.1.5** [server-infra] Add Microsoft environment variables
  - `AZURE_CLIENT_ID` — Azure app client ID
  - `AZURE_CLIENT_SECRET` — Azure app client secret
  - `AZURE_TENANT_ID` — Azure tenant ID (or "common" for multi-tenant)
  - `AZURE_REDIRECT_URI` — OAuth callback URL
- [ ] **1.1.6** [server-infra] Implement `MicrosoftCalendarProvider`
  - OAuth: Microsoft identity platform v2.0 authorization flow
  - Free/busy: `POST /me/calendar/getSchedule` (Graph API)
  - Create event: `POST /me/events` with attendees, body, start/end
  - Auto-generate Teams meeting: set `isOnlineMeeting: true, onlineMeetingProvider: "teamsForBusiness"` on event creation — returns `onlineMeeting.joinUrl`
  - Update/delete event: `PATCH/DELETE /me/events/{id}`
  - Token refresh: tokens expire after 1 hour, auto-refresh via refresh token
  - Webhooks: `POST /subscriptions` for calendar change notifications (max 3-day expiry, auto-renew)
- [ ] **1.1.7** [server-infra] Implement Microsoft webhook receiver
  - `POST /api/v2/webhooks/microsoft-calendar` — receive change notifications
  - Handle validation request (respond with `validationToken`)
  - On external event change: invalidate free/busy cache for that expert
  - Implement subscription renewal cron (before 3-day expiry)

#### 1.1C — Google Provider (Google Calendar / Google Meet)

- [ ] **1.1.8** [server-infra] Register Google Cloud project with Calendar API
  - Enable Google Calendar API in Google Cloud Console
  - Create OAuth 2.0 credentials (Web application type)
  - Required scopes: `calendar.readonly`, `calendar.events`, `calendar.freebusy`
- [ ] **1.1.9** [server-infra] Add Google environment variables
  - `GOOGLE_CLIENT_ID` — Google OAuth client ID
  - `GOOGLE_CLIENT_SECRET` — Google OAuth client secret
  - `GOOGLE_REDIRECT_URI` — OAuth callback URL
- [ ] **1.1.10** [server-infra] Implement `GoogleCalendarProvider`
  - OAuth: Google OAuth 2.0 authorization flow with offline access (for refresh tokens)
  - Free/busy: `POST /freeBusy` (Google Calendar API)
  - Create event: `POST /calendars/primary/events` with `conferenceData` for Google Meet
  - Auto-generate Google Meet: set `conferenceDataVersion=1` + `createRequest` in conferenceData — returns Meet link
  - Update/delete event: `PATCH/DELETE /calendars/primary/events/{id}`
  - Token refresh: Google tokens expire after 1 hour, auto-refresh via refresh token
  - Webhooks: `POST /calendars/primary/events/watch` for push notifications (use `X-Goog-Channel-Token` for validation)
- [ ] **1.1.11** [server-infra] Implement Google webhook receiver
  - `POST /api/v2/webhooks/google-calendar` — receive push notifications
  - Google sends sync notifications (headers only, no body) — must then fetch changed events
  - Invalidate free/busy cache for affected expert
  - Handle channel expiration and renewal

#### 1.1D — Calendly Provider

- [ ] **1.1.12** [server-infra] Register Calendly OAuth application
  - Create app at developer.calendly.com
  - Required scopes: read events, read availability
- [ ] **1.1.13** [server-infra] Add Calendly environment variables
  - `CALENDLY_CLIENT_ID` — Calendly OAuth client ID
  - `CALENDLY_CLIENT_SECRET` — Calendly OAuth client secret
  - `CALENDLY_REDIRECT_URI` — OAuth callback URL
- [ ] **1.1.14** [server-infra] Implement `CalendlyProvider`
  - OAuth: Calendly OAuth 2.0 flow
  - Free/busy: `GET /scheduled_events` for the expert's event types — derive busy blocks from existing bookings
  - Create event: Calendly doesn't support server-side event creation the same way — for Calendly-connected experts, bookings go through Calendly widget (embedded or link), then sync back via webhook
  - Webhook sync: `POST /webhook_subscriptions` — subscribe to `invitee.created`, `invitee.canceled`
  - On `invitee.created`: create corresponding coaching session in CLAIM'N with meeting link from Calendly event
  - On `invitee.canceled`: update session status to cancelled
  - Token refresh: Calendly tokens expire, auto-refresh via refresh token
- [ ] **1.1.15** [server-infra] Implement Calendly webhook receiver
  - `POST /api/v2/webhooks/calendly` — receive event notifications
  - Verify webhook signature using signing key
  - On new booking: create internal coaching session, set `meeting_url` from Calendly event location
  - On cancellation: update session status
  - On reschedule: update session datetime + calendar event
- [ ] **1.1.16** [members-spa] For Calendly-connected experts: embed Calendly inline widget
  - Use Calendly embed SDK instead of redirecting to external URL
  - Pass prefill data (member name, email)
  - On successful Calendly booking, webhook creates the internal session
  - Show confirmation in CLAIM'N UI after webhook processes

#### 1.1E — Available Slots Endpoint (Provider-Agnostic)

- [ ] **1.1.17** [server-infra] Create unified available-slots endpoint
  - `GET /api/v2/members/experts/{id}/available-slots?date=2026-03-10&duration=60&timezone=America/New_York`
  - Logic:
    1. Fetch expert's recurring internal availability windows for that day-of-week
    2. If calendar connected (any provider): call provider's `GetFreeBusy()` for that date
    3. Subtract busy blocks from availability windows
    4. Subtract already-booked CLAIM'N sessions (prevents double-booking)
    5. Generate discrete time slots based on requested duration
    6. Convert to member's timezone (if provided)
    7. Return concrete available slots
  - For Calendly-connected experts: return available slots from Calendly's availability API instead of internal calculation
- [ ] **1.1.18** [server-infra] Cache free/busy data
  - Cache per expert per day, TTL 5-10 minutes
  - Invalidate on new booking or webhook notification
  - Fallback to internal-only slots if provider API is down
- [ ] **1.1.19** [members-spa] Update BookSessionPage to use available-slots endpoint
  - Replace client-side slot generation with server-provided concrete slots
  - Works for all experts: connected (any provider) and non-connected
  - Show loading state while fetching real availability
  - Remove the `calendar_url` redirect for MS/Google — all booking goes through CLAIM'N
  - For Calendly: show embedded widget instead (1.1.16)

#### 1.1F — Push Sessions to Calendar (CLAIM'N -> Calendar)

- [ ] **1.1.20** [server-infra] On session booking: create calendar event via provider
  - Call `CalendarProvider.CreateEvent()` for the expert's connected provider
  - Include: member name, session type, duration, goals, CLAIM'N session link
  - Store returned `calendar_event_id` on the session
  - Set returned `meeting_url` on the session (Teams / Google Meet / Calendly link)
  - Skip for Calendly (events created via Calendly flow, synced back by webhook)
- [ ] **1.1.21** [server-infra] On session cancel/reschedule: update/delete calendar event
  - Cancel: call `CalendarProvider.DeleteEvent()` or mark cancelled
  - Reschedule: call `CalendarProvider.UpdateEvent()` with new datetime
  - Handle gracefully if calendar event was already deleted externally
- [ ] **1.1.22** [server-infra] Token refresh middleware
  - Before any provider API call, check `calendar_token_expiry`
  - If expired: call `CalendarProvider.RefreshToken()`, update stored tokens
  - If refresh fails (revoked): mark calendar as disconnected, notify expert to re-connect

#### 1.1G — Admin-SPA Calendar Management UI

- [ ] **1.1.23** [admin-spa] Create "Connect Calendar" section in MyAvailabilityPage
  - Show current connection status: connected/disconnected, provider name, email, connected since
  - Three provider buttons: "Connect Microsoft Outlook", "Connect Google Calendar", "Connect Calendly"
  - Each button initiates OAuth flow for that provider
  - Only one provider can be connected at a time — switching disconnects the current one (with warning)
  - "Disconnect" button with confirmation dialog
  - After connection: show success state with provider icon + email
- [ ] **1.1.24** [admin-spa] Update availability page behavior when calendar is connected
  - Show banner: "Your availability is synced with [Outlook/Google Calendar/Calendly]"
  - For MS/Google: keep internal availability slots as "bookable hours" (defines when members CAN book), but free/busy overlay prevents conflicts
  - For Calendly: hide internal slot management, show "Managed via Calendly" with link to Calendly settings
  - Show last sync timestamp
- [ ] **1.1.25** [admin-spa] Handle OAuth callback redirect
  - After OAuth, provider redirects back to admin-spa with auth code
  - Admin-spa forwards code to backend callback endpoint
  - Show success/error state to expert

---

### 1.2 Double-Booking Prevention

**Problem:** Even without calendar sync, the internal system allows double-booking. Availability slots are recurring weekly windows (e.g., "Monday 09:00-12:00"). Nothing prevents two members from booking the same 10:00 AM Monday slot.

**Note:** If 1.1 is implemented fully, this is largely solved by the available-slots endpoint (1.1.7). These tasks cover the validation layer regardless.

**Tasks:**

- [ ] **1.2.1** [server-infra] Create concrete available-slots endpoint (if not done in 1.1.7)
  - `GET /api/v2/members/experts/{id}/available-slots?date=2026-03-10&duration=60`
  - Return concrete available time slots for a specific date
  - Subtract already-booked sessions from recurring availability windows
  - Account for session duration (90-min session blocks multiple slots)
- [ ] **1.2.2** [server-infra] Add server-side validation in `BookSession()` handler
  - Before creating session, verify the slot is still available
  - Check against both internal bookings AND external calendar (if connected)
  - Return clear error: `{ code: "SLOT_UNAVAILABLE", message: "This time slot has already been booked" }`
  - Use database-level locking or transaction to prevent race conditions
- [ ] **1.2.3** [members-spa] Update BookSessionPage to use server-provided slots
  - Replace client-side slot generation with available-slots API
  - Show "slot taken" feedback if booking fails due to conflict
  - Refresh available slots after a failed booking attempt
- [ ] **1.2.4** Test: book a slot as Member A, verify Member B cannot book the same slot

---

### 1.3 Timezone Handling in Booking

**Problem:** Expert availability is stored as day-of-week + time with a timezone field on the expert profile. The members-spa generates time slots without converting between the expert's timezone and the member's local timezone.

**Note:** If available-slots endpoint (1.1.7 / 1.2.1) handles timezone conversion server-side, this is largely solved. These tasks ensure it's complete end-to-end.

**Tasks:**

- [ ] **1.3.1** [server-infra] Ensure expert timezone is reliably stored and returned
  - Verify `experts.timezone` field is populated (e.g., "Europe/Stockholm")
  - Return timezone in expert profile and availability responses
- [ ] **1.3.2** [server-infra] Handle timezone conversion in available-slots endpoint
  - Accept member's timezone as query param: `?timezone=America/New_York`
  - Convert expert's availability windows to member's timezone
  - Return slots in the member's local time
  - Store booked sessions in UTC
- [ ] **1.3.3** [members-spa] Display times in member's local timezone
  - Detect member timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone`
  - Pass to API as query param
  - Show timezone indicator: "Times shown in your local time (EST)"
- [ ] **1.3.4** [admin-spa] Display session times in expert's timezone on their dashboard
- [ ] **1.3.5** Test: expert in Stockholm (CET) sets availability 14:00-17:00, member in New York sees 08:00-11:00 (EST)

---

### 1.4 Expert Messaging UI (admin-spa)

**Problem:** Members can send messages to experts, but experts have no UI to read or reply. Messaging is completely one-directional.

**Backend status:** API fully supports two-way messaging via `/api/v2/members/messages/*` using `user_id`. Experts authenticate as users so the same endpoints work.

**Tasks:**

- [ ] **1.4.1** [admin-spa] Determine which API namespace experts should use for messaging
  - Option A: Reuse `/api/v2/members/messages/*` endpoints (experts are users too)
  - Option B: Create dedicated `/api/v2/expert/messages/*` endpoints
  - Decision needed from backend team
- [ ] **1.4.2** [server-infra] Add expert messaging endpoints if Option B chosen
  - `GET /api/v2/expert/messages/conversations` — list conversations
  - `GET /api/v2/expert/messages/conversations/{id}` — get messages
  - `POST /api/v2/expert/messages` — send message
  - `PUT /api/v2/expert/messages/conversations/{id}/read` — mark read
  - `POST /api/v2/expert/messages/upload` — upload image
- [ ] **1.4.3** [admin-spa] Create MessagesPage for experts
  - Two-pane layout: conversation list + chat view
  - Search conversations by member name
  - Send text and image messages
  - Mark conversations as read
  - Show unread count in navigation
- [ ] **1.4.4** [admin-spa] Add Messages link to expert navigation/sidebar
- [ ] **1.4.5** [admin-spa] Add unread message count badge in nav
- [ ] **1.4.6** Test end-to-end: member sends message -> expert sees it -> expert replies -> member sees reply

---

## Phase 2: Core Functionality Gaps

These features exist partially but need completion to close the loop.

### 2.1 Reschedule Accept/Reject Flow

**Problem:** Members can request a reschedule (sends `proposed_datetime` + `reason`), but experts have no UI to see, accept, or reject these requests. Reschedule requests disappear into a void.

**Tasks:**

- [ ] **2.1.1** [server-infra] Verify/add expert endpoint to list pending reschedule requests
  - `GET /api/v2/expert/sessions/reschedule-requests` or filter existing sessions endpoint by `status=reschedule_requested`
- [ ] **2.1.2** [server-infra] Add endpoint for expert to accept or reject reschedule
  - `PATCH /api/v2/expert/sessions/{id}/reschedule-respond`
  - Body: `{ action: "accept" | "reject", message?: string }`
  - On accept: update session's `scheduled_at` to `reschedule_proposed_at`, set status back to "scheduled"
  - On accept + calendar connected: update calendar event via provider
  - On reject: set status back to "scheduled", optionally notify member
- [ ] **2.1.3** [admin-spa] Show reschedule requests in expert session dashboard
  - Highlight sessions with `status = "reschedule_requested"`
  - Show proposed new datetime and reason
  - Accept/Reject buttons with confirmation
- [ ] **2.1.4** [members-spa] Show reschedule request status to member
  - "Reschedule pending" indicator on the session card
  - Update session card when accepted/rejected
- [ ] **2.1.5** [both SPAs] Optional: notification/email when reschedule is requested/responded to

---

### 2.2 Review & Rating Submission

**Problem:** Members can see expert ratings and testimonials but cannot submit their own. There's no "Rate this session" flow after a completed session.

**Tasks:**

- [ ] **2.2.1** [server-infra] Create member review submission endpoint
  - `POST /api/v2/members/coaching/sessions/{id}/review`
  - Body: `{ rating: 1-5, comment?: string }`
  - Validate: session must be completed, member must be the session's member, one review per session
  - Update expert's aggregate rating and review count
- [ ] **2.2.2** [server-infra] Create endpoint to get member's review for a session
  - `GET /api/v2/members/coaching/sessions/{id}/review`
  - Returns existing review or 404
- [x] **2.2.3** [members-spa] Add "Rate Session" prompt after session completion — Done
  - Show on completed sessions that haven't been reviewed yet
  - Star rating (1-5) + optional text comment
  - Inline on ExpertSessionsPage or as a modal
- [x] **2.2.4** [members-spa] Show submitted review on session card (read-only after submission) — Done
- [ ] **2.2.5** [admin-spa] Show session reviews in expert dashboard / session detail
- [ ] **2.2.6** [server-infra] Auto-convert reviews into testimonials (or admin approval flow)
  - Option: reviews with 4+ stars and a comment become testimonial candidates
  - Admin approves before they appear on expert profile

---

### 2.3 Explicit Expert-Member Pairing

**Problem:** "My expert" is derived from the most recent session (`GetMyExpert` queries latest coaching session). If a member books a one-off session with a different expert, their assigned expert silently changes. There's no stable pairing.

**Tasks:**

- [ ] **2.3.1** [server-infra] Add explicit pairing table and endpoints
  - Table: `expert_member_assignments` (expert_id, member_id, assigned_at, assigned_by, status, notes)
  - `GET /api/v2/members/my-expert` — read from assignments table (fallback to session-based for migration)
  - `POST /api/v2/admin/experts/{id}/assign-client` — already exists, wire to new table
  - `DELETE /api/v2/admin/experts/{id}/unassign-client` — already exists, wire to new table
- [ ] **2.3.2** [server-infra] Migrate existing implicit pairings to explicit table
  - Script: for each member with coaching sessions, create assignment record for their most frequent expert
- [ ] **2.3.3** [members-spa] Update `useMyExpert` hook if API response changes
- [ ] **2.3.4** [members-spa] Add "My Coach" section to dashboard or profile
  - Show assigned expert with quick actions: Message, Book Session, View Profile
- [ ] **2.3.5** [admin-spa] Update assign/unassign to use new table (if API changes)
- [ ] **2.3.6** [members-spa] Optional: "Request a Coach" flow for unassigned members
  - Form: preferred specialties, goals, availability preferences
  - Creates a request that admins can fulfill

---

### 2.4 Meeting URL Generation

**Problem:** `meeting_url` on sessions is a plain text field. No one knows who should set it or when. If no one sets it, the "Join Call" button doesn't appear.

**Note:** If calendar integration (1.1) is implemented, meeting links are auto-generated (Teams for MS, Google Meet for Google, Calendly-provided link). This section covers the fallback for non-connected experts.

**Tasks:**

- [ ] **2.4.1** [server-infra] Add `default_meeting_url` to expert profile
  - Personal meeting room URL (Zoom, Teams, etc.)
  - Auto-populate `meeting_url` on new sessions from expert's default
- [ ] **2.4.2** [admin-spa] Add meeting URL field to expert profile edit
- [ ] **2.4.3** [admin-spa] Allow expert to set/edit meeting URL on individual sessions
  - In SessionWorkspacePage, editable meeting URL field
- [ ] **2.4.4** [members-spa] Show meeting URL prominently for upcoming sessions
  - "Join Call" button should be visible and clear
  - Show fallback message if no URL: "Your coach will share the meeting link before the session"
- [ ] **2.4.5** [both SPAs] Optional: countdown/reminder before session with meeting link

---

## Phase 3: UX & Polish

### 3.1 Consolidate Duplicate Session Pages (members-spa)

**Problem:** Members-spa has two separate session listing pages with overlapping functionality:
- `/expert-sessions` (ExpertSessionsPage) — focused on expert sessions with reschedule
- `/coaching/sessions` (CoachingSessionsPage) — focused on goals and progress

**Tasks:**

- [ ] **3.1.1** [members-spa] Audit both pages for unique vs overlapping features
  - ExpertSessionsPage: reschedule modal, message expert, join call, rating display
  - CoachingSessionsPage: goals emphasis, progress bars, recording links, resources
- [ ] **3.1.2** [members-spa] Merge into single unified sessions page
  - Keep the richer feature set from both
  - Single route: `/coaching/sessions` (more intuitive)
  - Tabs or filters for different views if needed
- [ ] **3.1.3** [members-spa] Remove orphaned page and update navigation
- [ ] **3.1.4** [members-spa] Update all internal links pointing to old route

---

### 3.2 Session Note Visibility Clarity

**Problem:** Backend supports `visible_to_client` flag on session notes, but there's no clear indicator on either side about which notes are shared.

**Tasks:**

- [ ] **3.2.1** [admin-spa] Verify `visible_to_client` toggle works in SessionWorkspacePage
  - Toggle should be prominent and clearly labeled
  - Default should be explicit (not accidentally shared)
- [ ] **3.2.2** [members-spa] Only show notes where `visible_to_client = true`
  - Verify SessionNotesPage filters correctly
- [ ] **3.2.3** [admin-spa] Visual indicator: "Shared with client" badge on visible notes
- [ ] **3.2.4** [admin-spa] Confirmation prompt when toggling note visibility

---

### 3.3 Real-Time Updates

**Problem:** No real-time sync — messages, session status changes, and booking confirmations require page refresh to appear.

**Tasks:**

- [ ] **3.3.1** [members-spa] Add polling for messages (short-term solution)
  - Poll conversations list every 15-30 seconds when on messages page
  - Poll unread count in nav every 60 seconds globally
- [ ] **3.3.2** [admin-spa] Add same polling for expert messaging
- [ ] **3.3.3** [both SPAs] Add polling for session status changes
  - When viewing upcoming sessions, poll every 60 seconds
- [ ] **3.3.4** [server-infra] Future: WebSocket support for real-time messaging
  - `/api/v2/ws/messages` — push new messages to connected clients
  - Requires infrastructure consideration (connection management, scaling)

---

### 3.4 Expert Earnings Dashboard (admin-spa)

**Problem:** Experts can't see their financial data — how much they've earned, pending sessions, payout history.

**Tasks:**

- [ ] **3.4.1** [server-infra] Create expert earnings endpoint
  - `GET /api/v2/expert/earnings`
  - Response: total earned, this month, pending sessions, completed sessions revenue
  - Pull from Stripe or internal session purchase records
- [ ] **3.4.2** [server-infra] Create expert earnings history endpoint
  - `GET /api/v2/expert/earnings/history?period=monthly`
  - Monthly/weekly breakdown of earnings
- [ ] **3.4.3** [admin-spa] Create EarningsDashboardPage for experts
  - Summary cards: total earned, this month, pending
  - Chart: earnings over time
  - List: recent completed sessions with amounts
- [ ] **3.4.4** [admin-spa] Add Earnings link to expert navigation

---

## Phase 4: Advanced Features

### 4.1 Member Onboarding -> Expert Matching

**Problem:** New members have no guided flow to get paired with an expert. They have to browse the experts page and figure it out themselves.

**Tasks:**

- [ ] **4.1.1** [members-spa] Design onboarding step for expert matching
  - After account creation / first login
  - Show: "Get paired with your personal coach"
  - Questionnaire: goals, preferred specialties, schedule preferences
- [ ] **4.1.2** [server-infra] Create matching request endpoint
  - `POST /api/v2/members/expert-match-request`
  - Body: `{ preferred_specialties[], goals[], availability_preferences, notes }`
  - Creates record for admin to review and assign
- [ ] **4.1.3** [admin-spa] Create match request queue for admins
  - List pending match requests
  - Show member preferences alongside available experts
  - One-click assign
- [ ] **4.1.4** [members-spa] Show matching status
  - "We're finding the perfect coach for you" -> "You've been matched with [Expert Name]!"

---

### 4.2 Session Reminders & Notifications

**Problem:** No reminder system for upcoming sessions. Members and experts may forget about scheduled sessions.

**Tasks:**

- [ ] **4.2.1** [server-infra] Implement email notification system for sessions
  - 24 hours before: email reminder with session details + meeting link
  - 1 hour before: email reminder
  - On booking: confirmation email to both member and expert
  - On cancellation: notification to the other party
  - On reschedule request: notification to expert
  - On reschedule response: notification to member
- [ ] **4.2.2** [server-infra] Add notification preferences endpoint
  - `GET/PUT /api/v2/members/notification-preferences`
  - Allow members to opt in/out of specific notification types
- [ ] **4.2.3** [members-spa] Add notification preferences to settings page
- [ ] **4.2.4** Future: push notifications / in-app notification center

---

## Cross-Cutting Concerns

### C.1 Data Consistency Between Tables

**Issue:** Backend uses two session tables (`coaching_sessions` with `coach_id` FK and `expert_sessions` with `expert_id` FK). Handlers fall back between them, which can cause inconsistencies.

**Tasks:**

- [ ] **C.1.1** [server-infra] Audit which table is used where and consolidate if possible
- [ ] **C.1.2** [server-infra] Ensure all handlers consistently query both tables or migrate to single table

---

### C.2 Error Handling Consistency

**Issue:** API error codes and handling vary across endpoints. Frontend error handling is inconsistent.

**Tasks:**

- [ ] **C.2.1** [server-infra] Standardize error response format across all member-expert endpoints
- [ ] **C.2.2** [members-spa] Add user-friendly error messages for all booking/messaging/payment failures
- [ ] **C.2.3** [admin-spa] Same error handling improvements

---

### C.3 Testing Strategy

**Tasks:**

- [ ] **C.3.1** Define end-to-end test scenarios for each interaction flow:
  - Member browses experts -> views profile -> books session -> pays -> attends -> reviews
  - Member sends message -> expert reads -> expert replies -> member reads
  - Member requests reschedule -> expert accepts/rejects -> member sees result
  - Admin assigns expert to member -> member sees "My Coach" -> member messages coach
  - Expert connects calendar (MS/Google/Calendly) -> member books -> event appears in expert's calendar -> meeting link auto-generated
- [ ] **C.3.2** Manual QA pass on all flows after each phase completion

---

## Progress Tracker

| Phase | Area | Status | Notes |
|-------|------|--------|-------|
| 1.1 | Calendar Integration (MS, Google, Calendly) | Not Started | Highest priority — enables reliable booking |
| 1.1A | DB Schema & Provider Interface | Done | Migration + calendar_handlers.go + provider.go |
| 1.1B | Microsoft Provider | Not Started | Outlook + Teams meeting links |
| 1.1C | Google Provider | Not Started | Google Calendar + Meet links |
| 1.1D | Calendly Provider | Not Started | Calendly widget + webhook sync |
| 1.1E | Available Slots Endpoint | Done | Backend deployed + members-spa BookSessionPage integrated with fallback |
| 1.1F | Push Sessions to Calendar | Not Started | Create/update/delete events |
| 1.1G | Admin-SPA Calendar UI | Done | Connect/disconnect/status + e2e tests |
| 1.2 | Double-Booking Prevention | Done | 409 SLOT_UNAVAILABLE in BookSession + frontend error handling |
| 1.3 | Timezone Handling | Done | Server-side conversion + timezone indicator in BookSessionPage |
| 1.4 | Expert Messaging UI | Done | ExpertMessagesPage + nav + routes |
| 2.1 | Reschedule Flow | Done | Backend endpoints + admin-spa Accept/Reject UI + members-spa status display |
| 2.2 | Review Submission | Done | All subtasks done. 2.2.6: auto-creates pending testimonial for 4+ star reviews with comment |
| 2.3 | Explicit Pairing | Done | Table exists, GetMyExpert fixed, My Coach card, backfill migration applied, Request a Coach modal. 2.3.5 admin-spa already works via existing endpoints |
| 2.4 | Meeting URL | Done | 2.4.1 backend done. 2.4.2 admin-spa profile edit done. 2.4.3 admin-spa session edit done. 2.4.4 members-spa fallback done. 2.4.5 not started (optional) |
| 3.1 | Consolidate Session Pages | Done | Merged ExpertSessionsPage into CoachingSessionsPage, old page deleted, redirect added |
| 3.2 | Note Visibility | Done | Backend filters server-side. Admin-spa: visibility toggle confirmation + "Shared with client" badge |
| 3.3 | Real-Time Updates | Partial | 3.3.1 done, 3.3.2 done (admin-spa polling + unread badge), 3.3.3 done. 3.3.4 not started (WebSocket, future) |
| 3.4 | Expert Earnings | Not Started | |
| 4.1 | Onboarding Matching | Partial | Backend: expert_match_requests table + 4 endpoints deployed. Members-spa: Request a Coach modal done. Admin-spa: match queue (4.1.3) not started |
| 4.2 | Session Reminders | Not Started | |
| C.1 | Data Consistency | Not Started | |
| C.2 | Error Handling | Done | C.2.2 members-spa done. C.2.3 admin-spa done (fixed error parsing, added toast feedback to silent mutations). C.2.1 backend already standardized (V2ErrorResponse) |
| C.3 | Testing | Not Started | |

---

## Decision Log

Record key decisions here as they're made.

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-07 | Plan created | Initial audit identified 10+ critical/high issues |
| 2026-03-07 | Calendar integration moved to Phase 1 | Without it, booking is fundamentally unreliable — two parallel systems |
| 2026-03-07 | All 3 calendar providers are first-class | Experts use different tools — MS, Google, and Calendly must all be supported from day one |
| 2026-03-07 | Provider-agnostic CalendarProvider interface | Common Go interface so all providers implement the same contract; easy to add new ones later |
| 2026-03-07 | Calendly uses embedded widget + webhook | Unlike MS/Google, Calendly doesn't support server-side event creation — bookings go through widget, sync back via webhook |

---

## Dependency Map

```
1.1 Calendar Integration (MS + Google + Calendly)
 |
 |-- 1.1A Schema & Interface (must be first)
 |     |-- 1.1B Microsoft Provider
 |     |-- 1.1C Google Provider      (can be parallel with 1.1B)
 |     |-- 1.1D Calendly Provider    (can be parallel with 1.1B)
 |
 |-- 1.1E Available Slots Endpoint (depends on 1.1A, enhanced by providers)
 |     |-- solves --> 1.2 Double-Booking (free/busy + validation)
 |     |-- solves --> 1.3 Timezone (server-side conversion)
 |
 |-- 1.1F Push to Calendar (depends on providers)
 |     |-- solves --> 2.4 Meeting URL (Teams/Meet/Calendly auto-links)
 |     |-- enables -> 2.1 Reschedule (calendar event updates)
 |
 |-- 1.1G Admin Calendar UI (depends on 1.1A endpoints)

1.4 Expert Messaging
 |-- fully independent, can be done in parallel with all of 1.1

2.3 Explicit Pairing
 |-- enables -> 2.4 default meeting URL per expert
 |-- enables -> 4.1 onboarding matching
```

---

## Notes

- **Backend changes** require prompts written for the backend agent (see CLAUDE.md agent separation policy)
- **admin-spa** is at `/Users/maxsandberg/projects/claimn-admin-spa`
- **server-infra** is at `/Users/maxsandberg/projects/server-infra`
- Always `git pull` server-infra before reading it
- Phase 1 items should be addressed before moving to Phase 2
- 1.1 (Calendar) and 1.4 (Messaging) can be worked on in parallel — they are independent
- The three calendar providers (1.1B, 1.1C, 1.1D) can be built in parallel once the interface (1.1A) is done
- **API Docs:**
  - Microsoft Graph: https://learn.microsoft.com/en-us/graph/api/overview
  - Azure app registration: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps
  - Google Calendar API: https://developers.google.com/calendar/api
  - Google Cloud Console: https://console.cloud.google.com/
  - Calendly API v2: https://developer.calendly.com/api-docs
  - Calendly developer portal: https://developer.calendly.com/
