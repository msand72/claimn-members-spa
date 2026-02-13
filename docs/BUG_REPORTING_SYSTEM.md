# Bug Reporting System - Implementation Report

**Date:** 2026-02-12
**Repo:** claimn-members-spa
**Branch:** master
**Commit:** `61d324e` (feat: Add frontend bug reporting system)
**Test commit:** `3ad2766` (test: Add temporary bug report test panel to HubPage)

---

## Overview

A frontend bug reporting system that automatically captures errors, allows manual bug reports, takes screenshots, and sends reports to the Claimn Go API. Reports flow through an automated pipeline: Go API → Supabase → n8n → AI analysis → severity routing → optional automated bug fix agent.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MEMBERS SPA                           │
│                                                          │
│  BugReportProvider (context)                             │
│  ├── GlobalErrorBoundary (wraps RouterProvider)          │
│  │   ├── Catches React render crashes                    │
│  │   ├── Auto-screenshot on crash                        │
│  │   └── Fallback UI: Try Again / Reload / Report Bug    │
│  ├── window.onerror listener                             │
│  ├── unhandledrejection listener                         │
│  ├── BugReportPanel (modal form)                         │
│  ├── BugReportToast (notifications)                      │
│  └── Sidebar "Report a Bug" button (manual reports)      │
│                                                          │
│  POST /api/v2/public/bugs/report (no auth)               │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
              Go API → Supabase + n8n
              → AI analysis → severity routing
              → automated bug fix agent (optional)
```

---

## Files Created (4 new files, 887 lines)

### 1. `src/contexts/BugReportContext.tsx` (499 lines)

Core context managing all bug reporting state and logic.

**Features:**
- Global error listeners (`window.onerror`, `unhandledrejection`)
- Error deduplication: hash-based (message + first stack frame), 60s dedup window
- Rate limiting: max 5 reports per 5 minutes
- Screenshot capture via `html2canvas` (JPEG 70%, max 1280px wide, 500KB cap)
- Offline queue with localStorage persistence, auto-flush on `online` event
- Toast state management (error/success/info variants, configurable duration)
- User action tracking (last 10 actions: clicks, navigation, inputs, API errors)

**Exports:**
- `BugReportProvider` - wraps app inside AuthProvider
- `useBugReport()` - hook for accessing context

**Key types:**
- `ErrorSource`: `'error_boundary' | 'window_onerror' | 'unhandled_rejection' | 'manual'`
- `BugReportPayload`: full payload sent to API (error, stack, screenshot, user info, browser info, actions)
- `UserAction`: tracked user actions with timestamps

**API endpoint:**
- `VITE_BUG_REPORT_API_URL` env var (default: `https://api.claimn.co/api/v2/public/bugs/report`)
- Public endpoint, no auth required
- Simple `fetch()` with `Content-Type: application/json`

### 2. `src/components/GlobalErrorBoundary.tsx` (121 lines)

Enhanced React error boundary integrated with BugReportContext.

**Architecture:**
- Inner class component `ErrorBoundaryInner` (required for `componentDidCatch`)
- Outer functional wrapper `GlobalErrorBoundary` connects to context via `useBugReport()`
- Bridge pattern: class component accepts `onError`, `onCaptureScreenshot`, `onOpenModal` props

**Behavior:**
- Auto-reload on stale chunk errors (preserves existing behavior from original ErrorBoundary)
- Captures screenshot before rendering fallback UI
- Notifies BugReportContext via `setPendingError()`
- Fallback UI: "Something went wrong" with Try Again, Reload, and Report Bug buttons
- Glass morphism styling consistent with app design

### 3. `src/components/BugReportPanel.tsx` (187 lines)

Modal form for submitting bug reports.

**Two modes:**
- **Auto mode** (triggered by error): screenshot thumbnail (removable), optional description, collapsible error details with stack trace
- **Manual mode** (triggered by sidebar button): "Capture Screenshot" button, required description (min 10 chars), no error details

**UI:** Uses existing Glass UI components (`GlassModal`, `GlassButton`, `cn` utility). Loading spinner on submit button.

### 4. `src/components/BugReportToast.tsx` (80 lines)

Fixed-position toast container (bottom-right, z-60).

**Variants:**
- Error (tegelrod): 30s auto-dismiss, "Report Bug" + "Dismiss" buttons
- Success (skogsgron): 5s auto-dismiss, X button
- Info (koppar): 5s auto-dismiss, X button

Max 1 toast visible at a time. Uses `animate-in slide-in-from-right fade-in` animation.

---

## Files Modified (4 files)

### 5. `src/App.tsx`

Provider hierarchy updated:

```tsx
<QueryClientProvider>
  <ThemeProvider>
    <AuthProvider>
      <BugReportProvider>              {/* NEW */}
        <GlobalErrorBoundary>          {/* NEW */}
          <RouterProvider router={router} />
        </GlobalErrorBoundary>
        <BugReportPanel />             {/* NEW */}
        <BugReportToast />             {/* NEW */}
      </BugReportProvider>
    </AuthProvider>
  </ThemeProvider>
</QueryClientProvider>
```

**Rationale:**
- BugReportProvider inside AuthProvider → access to `user.id` and `user.email`
- GlobalErrorBoundary wraps RouterProvider → catches all route-level crashes
- BugReportPanel + BugReportToast outside boundary → always rendered even during crashes

### 6. `src/components/layout/GlassSidebar.tsx`

Added "Report a Bug" button in the bottom section, above "Sign Out":
- Uses `Bug` icon from lucide-react
- Calls `useBugReport().openManualReport()`
- Styled like existing sidebar items (subtle, not attention-grabbing)

### 7. `.env.example`

Added:
```
# Bug Reporting (public endpoint, no auth needed)
VITE_BUG_REPORT_API_URL=https://api.claimn.co/api/v2/public/bugs/report
```

### 8. `package.json`

Added dependency: `html2canvas` (screenshot capture)

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| html2canvas | latest | Client-side screenshot capture |

---

## API Payload

```json
{
  "error_message": "string",
  "stack_trace": "string | null",
  "component_tree": "string | null (React componentStack)",
  "error_source": "error_boundary | window_onerror | unhandled_rejection | manual",
  "screenshot": "data:image/jpeg;base64,... | null",
  "user_id": "string | null",
  "user_email": "string | null",
  "user_description": "string | null",
  "user_actions": [{ "type": "click|navigation|input|submit|api_error", "target": "...", "timestamp": 123, "url": "..." }],
  "browser_info": { "userAgent": "...", "viewport": {...}, "language": "...", "platform": "...", "cookiesEnabled": true, "timezone": "..." },
  "url": "current page URL",
  "source_app": "members-spa"
}
```

---

## Error Capture Methods

| Method | Trigger | Handler | Toast Duration |
|--------|---------|---------|----------------|
| Error Boundary | React render crash | `componentDidCatch` → `setPendingError()` | 30s with Report Bug button |
| Window Error | Uncaught throw (e.g. in setTimeout) | `window.addEventListener('error')` | 30s with Report Bug button |
| Unhandled Rejection | `Promise.reject()` without catch | `window.addEventListener('unhandledrejection')` | 30s with Report Bug button |
| Manual Report | Sidebar "Report a Bug" button | `openManualReport()` → modal immediately | N/A (modal opens directly) |

---

## Backend Pipeline (for reference)

```
Frontend POST → Go API → Supabase INSERT + n8n webhook
                                          ↓
                                    AI analysis (Claude)
                                    Severity classification
                                          ↓
                              ┌───────────┼───────────┐
                              │           │           │
                           LOW        MEDIUM      HIGH/CRITICAL
                          Log only   Slack #bugs   Slack + Agent
                                                  Auto-fix PR
```

Backup trigger: Supabase `pg_net` trigger on INSERT also calls n8n (catches direct inserts).

---

## Pilot Test Results

| Test | Result | Details |
|------|--------|---------|
| Direct Supabase INSERT | Blocked by RLS | `anon` role blocked; `public` role INSERT policy exists for API path |
| Service role INSERT | Success | Bug ID: `d53d5d65`, inserted into `bug_reports` table |
| Go API POST (first attempt) | 401 Unauthorized | API not rebuilt after endpoint was added |
| Go API POST (after rebuild) | 201 Created | Bug ID: `78ba3c5a`, pipeline triggered |
| `error_source` column | Added | Backend agent added via `ALTER TABLE` |
| `agent_configs` table | Populated | `bugfix` agent config with `allowed_source_apps` |

---

## Progress

### Completed

- [x] Install `html2canvas` dependency
- [x] Create `BugReportContext.tsx` - core context with all logic
- [x] Create `BugReportToast.tsx` - toast notification component
- [x] Create `BugReportPanel.tsx` - modal form component
- [x] Create `GlobalErrorBoundary.tsx` - enhanced error boundary
- [x] Modify `App.tsx` - add provider, boundary, panel, toast
- [x] Modify `GlassSidebar.tsx` - add "Report a Bug" button
- [x] Update `.env.example` - add `VITE_BUG_REPORT_API_URL`
- [x] Build verification - TypeScript compiles clean (0 errors)
- [x] Pilot test via Go API - 201 success, pipeline triggered
- [x] Committed and pushed to master (`61d324e`)
- [x] Test panel added to HubPage with 3 error trigger buttons (`3ad2766`)

### TODO - Frontend Testing

- [ ] Test Error Boundary crash button (HubPage test panel → button 1)
- [ ] Test Unhandled Rejection button (HubPage test panel → button 2)
- [ ] Test Window Error button (HubPage test panel → button 3)
- [ ] Test Manual Report via sidebar "Report a Bug" button
- [ ] Verify toast appears with "Report Bug" button on error
- [ ] Verify modal opens and form works (description, screenshot)
- [ ] Verify report submission returns success toast
- [ ] Verify deduplication (same error 5x rapidly → 1 toast)
- [ ] Verify rate limiting (6+ reports in 5 min → blocked)
- [ ] Test offline: disconnect network → submit → reconnect → verify flush
- [ ] Check `bug_reports` table in Agent Supabase for submitted reports
- [ ] Remove test panel from HubPage after testing

### TODO - Pipeline Verification

- [ ] Verify n8n workflow receives and processes reports
- [ ] Verify AI analysis populates `severity` and `agent_analysis` fields
- [ ] Verify severity-based routing (Slack notifications)
- [ ] Verify bug fix agent triggers on HIGH/CRITICAL severity
- [ ] Verify agent creates PR on correct repo

### TODO - Production Readiness

- [ ] Verify `VITE_BUG_REPORT_API_URL` is set in Vercel environment
- [ ] Test in production build (`npm run build && npm run preview`)
- [ ] Consider adding user action tracking to key interactions (navigation, form submits)
- [ ] Consider adding to claimn-cms (same system, `source_app: 'claimn-cms'`)
- [ ] Consider adding to claimn-admin-spa
- [ ] Consider adding to claimn-web

### Not Implemented (by design)

- **No changes to `main.tsx`**: Existing `ErrorBoundary` in main.tsx kept as outermost last-resort fallback (outside all providers). The new `GlobalErrorBoundary` provides bug report integration inside the provider stack.
- **No Supabase client**: Uses simple `fetch()` to Go API public endpoint. No anon key or auth headers needed.
- **No toast manager**: Toast state managed directly in BugReportContext (no existing toast system in the app).
- **No action tracking wired up yet**: The `trackAction()` method exists in context but is not yet called from app interactions. Can be added incrementally.

---

## Spec Reference

Full implementation spec: `server-infra/docs/FRONTEND_BUG_REPORTING_SPEC.md`
Backend architecture: `server-infra/docs/BUG_AUTOMATION_ARCHITECTURE.md`
Database schema: `claimn-agentic-ai/supabase/migrations/20260208000000_bug_reports.sql`
