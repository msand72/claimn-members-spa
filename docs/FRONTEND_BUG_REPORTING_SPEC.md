# Frontend Bug Reporting System - Implementation Spec

## Purpose

We're building an **automated bug handling system** for Claimn. When users encounter errors in the app, we want to:

1. **Capture everything automatically** - error details, screenshot, what the user was doing
2. **Let users report with one click** - minimal friction, just describe what happened
3. **Let users report manually** - "Report a Bug" button for visual/behavioral bugs that don't crash
4. **Catch ALL errors** - not just React crashes, but also unhandled promises, async errors, API failures
5. **Send to AI for analysis** - n8n workflow triggers Claude to analyze and triage
6. **Escalate critical bugs** - Slack DM + email to owner for urgent issues

This replaces the current experience where errors just show "Something went wrong" and users have no way to report them.

---

## User Experience

### Flow 1: Automatic (Error Crashes a Component)

```
ERROR OCCURS (e.g., component crashes)
     │
     ▼
┌─────────────────────────────────────────┐
│  TOAST (bottom-right corner)            │
│  ┌───────────────────────────────────┐  │
│  │ 🐛 Something went wrong           │  │
│  │                                   │  │
│  │ Help us fix this issue.           │  │
│  │                                   │  │
│  │ [Report Bug]  [Dismiss]           │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
     │
     │ User clicks "Report Bug"
     ▼
┌─────────────────────────────────────────────────────┐
│  MODAL (GlassModal)                                 │
│  ┌───────────────────────────────────────────────┐  │
│  │  Report a Bug                                 │  │
│  │                                               │  │
│  │  📸 Screenshot captured                       │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │ [Thumbnail of error state]              │  │  │
│  │  │                        [Remove]         │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  │                                               │  │
│  │  What were you trying to do?                  │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │ [Textarea for user description]         │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  │                                               │  │
│  │  ▼ Error details (collapsed)                  │  │
│  │  ─────────────────────────────────────────    │  │
│  │  TypeError: Cannot read property 'x'          │  │
│  │  at DashboardWidget (Dashboard.tsx:42)        │  │
│  │  ─────────────────────────────────────────    │  │
│  │                                               │  │
│  │         [Send Report]    [Cancel]             │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
     │
     │ User clicks "Send Report"
     ▼
┌─────────────────────────────────────────┐
│  ✅ Bug report sent!                    │
│     We'll look into this.               │
└─────────────────────────────────────────┘
```

### Flow 2: Manual (User-Initiated Report)

```
User clicks "Report a Bug" button (in sidebar/header/settings)
     │
     ▼
┌─────────────────────────────────────────────────────┐
│  MODAL (GlassModal)                                 │
│  ┌───────────────────────────────────────────────┐  │
│  │  Report a Bug                                 │  │
│  │                                               │  │
│  │  📸 [Capture Screenshot]                      │  │
│  │  (Screenshot taken on-demand when clicked)    │  │
│  │                                               │  │
│  │  What went wrong? *                           │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │ [Textarea - REQUIRED for manual]        │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  │                                               │  │
│  │  (No error details section - manual report)   │  │
│  │                                               │  │
│  │         [Send Report]    [Cancel]             │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Key differences from auto flow:**
- Description is **required** (no error context to fall back on)
- Screenshot is **on-demand** (button to capture), not automatic
- No error details section (no error object exists)
- `error_message` is set to `"[Manual Report] {user description first 100 chars}"`

---

## What Gets Captured

### Automatic (no user input needed)

| Data | Source | Purpose |
|------|--------|---------|
| Error message | `error.message` | What broke |
| Stack trace | `error.stack` | Where it broke |
| Component tree | React `errorInfo.componentStack` | Which component crashed |
| Screenshot | `html2canvas` at error time | Visual context |
| Last 10 actions | BugReportContext tracking | What user did before error |
| Browser info | `navigator` object | Environment details |
| Current URL | `window.location.href` | Which page |
| User ID | AuthContext | Who experienced it |
| User email | AuthContext | Contact info |

### User Provides

| Field | Required | Purpose |
|-------|----------|---------|
| Description | Optional | "What were you trying to do?" |
| Screenshot | Auto-included | Can remove if sensitive |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (claimn-members-spa)                │
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │ BugReportProvider│    │GlobalErrorBoundary│                   │
│  │ - tracks actions │◄───│ - catches React   │                   │
│  │ - stores error   │    │   render errors   │                   │
│  │ - manages modal  │    │ - captures screenshot                │
│  │ - dedup/throttle │    │ - shows toast     │                   │
│  │ - offline queue  │    └──────────────────┘                   │
│  │                  │                                            │
│  │                  │◄───┌──────────────────┐                   │
│  │                  │    │ Global Listeners  │                   │
│  │                  │    │ - window.onerror  │                   │
│  │                  │    │ - unhandled       │                   │
│  │                  │    │   rejection       │                   │
│  └────────┬─────────┘    └──────────────────┘                   │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │  BugReportPanel  │    │ "Report a Bug"   │                   │
│  │  - shows modal   │◄───│  button (manual) │                   │
│  │  - form UI       │    └──────────────────┘                   │
│  │  - submit button │                                           │
│  └────────┬─────────┘                                           │
└───────────┼─────────────────────────────────────────────────────┘
            │
            │ POST /api/v2/public/bugs/report
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  CLAIMN API (Go backend)                         │
│                  api.claimn.co                                   │
│                                                                  │
│  1. Validate payload                                             │
│  2. Insert into Supabase bug_reports table                       │
│  3. Trigger n8n webhook (async, non-blocking)                    │
│  4. Return 201 + bug_id to frontend                              │
└───────────┬──────────────────────┬──────────────────────────────┘
            │                      │
            │ Insert               │ POST /webhook/bug-report
            ▼                      ▼
┌──────────────────────┐  ┌─────────────────────────────────────┐
│  SUPABASE            │  │          N8N WORKFLOW                │
│  bug_reports table   │  │                                     │
│  - error_hash dedup  │  │  1. Receive bug report data         │
│  - occurrence_count  │  │  2. Claude API analysis + severity  │
│                      │  │  3. Update bug_reports in Supabase  │
│  pg_net trigger ─────┼──│  4. Route by severity:              │
│  (backup: also calls │  │     - LOW: Log only                 │
│   n8n on INSERT)     │  │     - MEDIUM: Slack #bugs           │
└──────────────────────┘  │     - HIGH: Slack #bugs-critical    │
                          │     - CRITICAL: Slack DM + Email    │
                          │  5. Trigger Bug Fix Agent (HMAC)    │
                          └─────────────────────────────────────┘
```

**Dual trigger mechanism:**
- **Primary:** Go API calls n8n webhook after Supabase insert (immediate, reliable)
- **Backup:** Supabase `pg_net` database trigger on INSERT (catches direct inserts)

---

## Components to Create

### 1. `src/contexts/BugReportContext.tsx`

**Purpose:** Global state for bug reporting, error catching, deduplication, and offline resilience

**State:**
- `recentActions: UserAction[]` - Last 10 user actions
- `pendingError: { error: Error, componentStack?: string, source: ErrorSource } | null`
- `isModalOpen: boolean`
- `isManualReport: boolean` - True when user opened modal manually (no error)
- `screenshot: string | null` - Base64 encoded (compressed)
- `isSubmitting: boolean`
- `offlineQueue: BugReportPayload[]` - Reports queued while offline

**Types:**
```typescript
type ErrorSource = 'error_boundary' | 'window_onerror' | 'unhandled_rejection' | 'manual'

interface UserAction {
  type: 'click' | 'navigation' | 'input' | 'submit' | 'api_error'
  target?: string      // e.g., "Submit button", "Dashboard link"
  value?: string       // e.g., form field value (sanitized)
  timestamp: number
  url: string
}
```

**Methods:**
- `trackAction(action)` - Called on clicks, navigation, form submits
- `setPendingError(error, source, componentStack?)` - Called by error boundary or global listeners
- `openModal()` / `closeModal()`
- `openManualReport()` - Opens modal in manual mode (no error, description required)
- `setScreenshot(base64)` - Stores compressed screenshot
- `captureScreenshot()` - On-demand capture (for manual reports)
- `submitReport(userDescription, includeScreenshot)` - POST to Supabase (or queue if offline)
- `flushOfflineQueue()` - Retry queued reports when back online

**Action Tracking:**

Track actions by:
- Adding click listeners to important buttons
- Listening to route changes
- Wrapping form submits
- Intercepting API errors

**Global Error Listeners (set up in Provider's useEffect):**

```typescript
// Catch unhandled promise rejections (failed API calls, async errors)
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason instanceof Error
    ? event.reason
    : new Error(String(event.reason))
  setPendingError(error, 'unhandled_rejection')
  // Don't capture screenshot here - may not reflect the error visually
})

// Catch uncaught JS errors (event handlers, setTimeout, etc.)
window.addEventListener('error', (event) => {
  // Ignore errors from browser extensions or cross-origin scripts
  if (!event.filename || event.filename.includes('extension://')) return
  const error = event.error || new Error(event.message)
  setPendingError(error, 'window_onerror')
})
```

**Deduplication / Rate Limiting:**

```typescript
// Track recently reported error hashes to avoid duplicate submissions
const recentErrorHashes = useRef<Map<string, number>>(new Map()) // hash → timestamp

function getErrorHash(error: Error): string {
  // Simple hash: first line of message + first frame of stack
  const key = `${error.message}::${(error.stack || '').split('\n')[1] || ''}`
  return key
}

function isDuplicate(error: Error): boolean {
  const hash = getErrorHash(error)
  const lastSeen = recentErrorHashes.current.get(hash)
  const now = Date.now()
  if (lastSeen && now - lastSeen < 60_000) return true // Same error within 60s = duplicate
  recentErrorHashes.current.set(hash, now)
  return false
}
```

- **Throttle:** Max 5 reports per 5 minutes per session
- **Dedup window:** Same error (by message + first stack frame) within 60 seconds is suppressed
- **Toast dedup:** If a toast is already showing for an error, don't stack another one

**Offline Handling:**

```typescript
// On submit failure (network error), queue for retry
if (!navigator.onLine || error instanceof TypeError) {
  offlineQueue.push(payload)
  localStorage.setItem('bugReportQueue', JSON.stringify(offlineQueue))
  showToast('Bug report saved. Will send when back online.')
  return
}

// Listen for reconnection
window.addEventListener('online', flushOfflineQueue)
```

- Queued reports stored in `localStorage` (survives page refresh)
- Flushed automatically when `online` event fires
- On app startup, check for queued reports and flush

### 2. `src/components/GlobalErrorBoundary.tsx`

**Purpose:** Catch **React render errors** specifically (the only error type React error boundaries catch)

**Note:** This component only catches errors thrown during rendering, lifecycle methods, and constructors of child components. It does NOT catch errors in event handlers, async code, or server-side code. Those are handled by the global listeners in `BugReportContext`.

**Behavior:**
1. Wrap entire app (or specific sections)
2. On `componentDidCatch`:
   - Log error to console
   - Capture screenshot with `html2canvas` (compressed, see Screenshot section)
   - Call `useBugReport().setPendingError(error, 'error_boundary', componentStack)`
   - Show toast notification (if not duplicate)
3. Render fallback UI with "Try Again" and "Reload" options
4. Toast has "Report Bug" button that opens modal

### 3. `src/components/BugReportPanel.tsx`

**Purpose:** Modal for submitting bug report (both auto and manual modes)

**UI Elements:**
- Screenshot preview (thumbnail, removable)
  - Auto mode: screenshot already captured, shown as thumbnail
  - Manual mode: "Capture Screenshot" button (calls `captureScreenshot()` on demand)
- Textarea: "What were you trying to do?" / "What went wrong?"
  - Auto mode: optional
  - Manual mode: **required** (minimum 10 characters)
- Collapsible error details section (hidden in manual mode)
- "Send Report" button (primary, disabled until form is valid)
- "Cancel" button (secondary)

**On Submit:**
1. Show loading state on button
2. Call `submitReport(description, includeScreenshot)`
3. On success: close modal, show success toast
4. On error: show error message, keep modal open
5. On offline: close modal, show "saved for later" toast

### 4. `src/components/ReportBugButton.tsx`

**Purpose:** Persistent button for manual bug reporting

**Placement options** (choose one during implementation):
- Floating button in bottom-left corner (opposite to toasts)
- In the app sidebar/navigation
- In user settings/profile dropdown

**Behavior:**
- Calls `openManualReport()` from BugReportContext
- Always visible (but hidden during active error boundary fallback to avoid confusion)

---

## Screenshot Handling

Screenshots can be large (2-5MB+ as base64 on high-res screens). Compress before storing/sending.

**Capture & Compress:**
```typescript
async function captureScreenshot(): Promise<string | null> {
  try {
    const canvas = await html2canvas(document.body, {
      // Limit capture size for performance
      windowWidth: Math.min(window.innerWidth, 1920),
      windowHeight: Math.min(window.innerHeight, 1080),
      scale: 1, // Don't use devicePixelRatio (would 2-3x the size)
      logging: false,
      useCORS: true,
    })

    // Compress: resize if over 1280px wide, use JPEG at 70% quality
    const maxWidth = 1280
    let finalCanvas = canvas
    if (canvas.width > maxWidth) {
      const ratio = maxWidth / canvas.width
      const resized = document.createElement('canvas')
      resized.width = maxWidth
      resized.height = canvas.height * ratio
      resized.getContext('2d')!.drawImage(canvas, 0, 0, resized.width, resized.height)
      finalCanvas = resized
    }

    const dataUrl = finalCanvas.toDataURL('image/jpeg', 0.7)

    // Hard limit: reject if still over 500KB base64
    if (dataUrl.length > 500_000) {
      console.warn('Screenshot too large, reducing quality')
      return finalCanvas.toDataURL('image/jpeg', 0.4)
    }

    return dataUrl
  } catch (err) {
    console.error('Screenshot capture failed:', err)
    return null // Non-critical - submit report without screenshot
  }
}
```

**Limits:**
- Max dimensions: 1280px wide (auto-scaled)
- Format: JPEG at 70% quality (fallback to 40% if still too large)
- Hard cap: ~500KB base64 encoded
- Failure is non-blocking: report still submits without screenshot

---

## Toast Behavior

**Error Toast (auto-triggered):**
- Position: bottom-right corner
- Auto-dismiss: **30 seconds** (long enough for user to notice and act)
- Manual dismiss: "Dismiss" button or click X
- Max visible: **1 toast at a time** (new error replaces existing toast, doesn't stack)
- Contains: error icon, brief message, "Report Bug" button, "Dismiss" button

**Success Toast (after submit):**
- Position: bottom-right corner
- Auto-dismiss: **5 seconds**
- Message: "Bug report sent! We'll look into this."

**Offline Toast (queued for later):**
- Position: bottom-right corner
- Auto-dismiss: **5 seconds**
- Message: "Bug report saved. Will send when back online."

**Dedup rule:** If an error toast is already visible and the same error occurs again, do NOT show a second toast. Reset the auto-dismiss timer on the existing one.

---

## Database Schema

The `bug_reports` table already exists in the Agent database. Here's what to send:

```typescript
interface BugReportPayload {
  // Required
  error_message: string          // For manual reports: "[Manual Report] {description first 100 chars}"

  // Error details
  stack_trace: string | null
  component_tree: string | null  // React componentStack (null for non-boundary errors)
  error_source: ErrorSource      // 'error_boundary' | 'window_onerror' | 'unhandled_rejection' | 'manual'

  // Screenshot
  screenshot: string | null      // Compressed JPEG base64 data URL, max ~500KB (or null)

  // User context
  user_id: string | null         // From AuthContext (as string, not UUID)
  user_email: string | null      // From AuthContext
  user_description: string | null // What user typed (required for manual reports)
  user_actions: UserAction[]     // Last 10 actions (JSONB)
  browser_info: BrowserInfo      // Browser details (JSONB)
  url: string                    // Current page URL

  // App identifier
  source_app: 'members-spa'      // Always this value for members-spa
}

interface BrowserInfo {
  userAgent: string
  viewport: { width: number; height: number }
  language: string
  platform: string
  cookiesEnabled: boolean
  timezone: string
}
```

---

## API Details

### Endpoint

```
POST https://api.claimn.co/api/v2/public/bugs/report
```

This is a **public endpoint** (no auth required) — critical because users may be experiencing auth errors when they need to report a bug.

### Headers

```
Content-Type: application/json
```

No API key or auth token needed.

### Response

```json
// 201 Created
{
  "id": "d53d5d65-...",
  "status": "submitted",
  "message": "Bug report received. Thank you!"
}
```

### Environment Variables

Add to frontend `.env`:
```
VITE_BUG_REPORT_API_URL=https://api.claimn.co/api/v2/public/bugs/report
```

### Backend Environment (already configured)

In `claimn-api/.env.local`:
```
N8N_BUG_WEBHOOK_URL=https://n8n.claimn.co/webhook/bug-report
```

### Backup: Supabase Database Trigger

A `pg_net` trigger on the `bug_reports` table also calls n8n on INSERT. This catches any direct Supabase inserts that bypass the API. See migration: `claimn-api/migrations/20260212_bug_report_webhook_trigger.sql`

---

## Dependencies

```bash
npm install html2canvas
```

---

## Integration in App.tsx

```tsx
import { BugReportProvider } from './contexts/BugReportContext'
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary'
import { BugReportPanel } from './components/BugReportPanel'
import { ReportBugButton } from './components/ReportBugButton'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BugReportProvider>
            <GlobalErrorBoundary>
              <RouterProvider router={router} />
            </GlobalErrorBoundary>
            <BugReportPanel />
            <ReportBugButton />
          </BugReportProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
```

---

## Styling Notes

Use existing Glass UI components:
- `GlassModal` for the report modal
- `GlassButton` for buttons
- `GlassAlert` / `GlassToast` for notifications
- Follow existing color scheme (tegelrod for errors, koppar for primary)

---

## Testing

After implementation, test each error capture method:

### Test 1: React Error Boundary (render crash)
1. Add temporarily to any component: `throw new Error("Test error boundary")`
2. Verify toast appears with "Report Bug" button
3. Verify fallback UI shows with "Try Again" / "Reload"
4. Click "Report Bug" → modal opens with screenshot
5. Submit and verify in Supabase

### Test 2: Unhandled Promise Rejection (async error)
1. Add to any event handler: `Promise.reject(new Error("Test unhandled rejection"))`
2. Verify toast appears (no fallback UI - app keeps running)
3. Report and verify `source` shows in component_tree or error context

### Test 3: Window Error (event handler crash)
1. Add to a button onClick: `throw new Error("Test window error")`
2. Verify toast appears
3. Report and verify

### Test 4: Manual Report (no error)
1. Click "Report a Bug" button
2. Verify modal opens in manual mode (no error details, description required)
3. Click "Capture Screenshot" → verify screenshot appears
4. Submit with description → verify in Supabase with `error_message` starting with `[Manual Report]`

### Test 5: Deduplication
1. Trigger the same error 5 times rapidly (e.g., in a loop)
2. Verify only 1 toast appears (not 5)
3. Verify only 1 report is submitted

### Test 6: Rate Limiting
1. Trigger 6 different errors within 5 minutes
2. Verify the 6th is suppressed with a "Too many reports" message

### Test 7: Offline Handling
1. Open DevTools → Network → Offline
2. Trigger an error and submit report
3. Verify "saved for later" toast
4. Go back online
5. Verify report is flushed and appears in Supabase

### Verify in Supabase:
```sql
SELECT id, error_message, source_app, created_at
FROM bug_reports ORDER BY created_at DESC LIMIT 5;
```

---

## Pilot Test: ContentManager in claimn-cms

Before implementing the full bug reporting system in `claimn-members-spa`, we run a **scoped pilot test** using the ContentManager files in the `claimn-cms` repository. This validates the entire pipeline end-to-end on a contained, low-risk target.

### Why ContentManager?

- **Contained scope:** 2 files (`ContentManager.jsx` + `ContentManager.css`) — easy to review the agent's output
- **Real complexity:** 418-line React component with tabs, dynamic data loading, responsive design — not a trivial test
- **Different repo:** Tests the agent's ability to work across repositories (`claimn-cms` vs `claimn-members-spa`)
- **No Glass UI:** Uses lucide-react + Tailwind CSS + custom CSS variables, so the agent must adapt to the actual codebase patterns rather than assuming Glass UI
- **Low blast radius:** ContentManager is a content management feature, not auth or payment — safe to experiment on

### Target Files

| File | Path | Lines | Purpose |
|------|------|-------|---------|
| ContentManager.jsx | `src/components/content/ContentManager.jsx` | 418 | Main orchestrator: tab navigation, pillar loading, content workflows |
| ContentManager.css | `src/components/content/ContentManager.css` | 3,547 | Styles: layout, tabs, responsive, brand colors |

### How to Run the Test

**Step 1: Submit a test bug report via the API**

POST to the public bug report endpoint. This automatically inserts into Supabase AND triggers n8n.

```bash
curl -X POST https://api.claimn.co/api/v2/public/bugs/report \
  -H "Content-Type: application/json" \
  -d '{
    "error_message": "TypeError: Cannot read properties of undefined (reading '\''name'\'') in ContentManager when no content pillars exist",
    "stack_trace": "TypeError: Cannot read properties of undefined (reading '\''name'\'')\n    at ContentManager (src/components/content/ContentManager.jsx:142:38)\n    at renderWithHooks (react-dom.development.js:16305:18)\n    at mountIndeterminateComponent (react-dom.development.js:20074:13)",
    "component_tree": "App > Layout > ContentManager",
    "error_source": "error_boundary",
    "url": "https://cms.claimn.co/content",
    "source_app": "claimn-cms",
    "user_description": "I opened the Content Manager page. It crashed immediately. I think my account has no content pillars set up yet.",
    "browser_info": {"userAgent": "Mozilla/5.0 Chrome/131", "viewport": {"width": 1920, "height": 1080}, "language": "en", "platform": "Win32", "cookiesEnabled": true, "timezone": "Europe/Stockholm"},
    "user_actions": [{"type": "navigation", "target": "Content Manager", "timestamp": 1739000000000, "url": "https://cms.claimn.co/content"}, {"type": "click", "target": "Sidebar content link", "timestamp": 1738999990000, "url": "https://cms.claimn.co/dashboard"}]
  }'
```

Expected response: `201 Created` with `{"id": "<uuid>", "status": "submitted", ...}`

**Step 2: Observe the pipeline**

The API call triggers:
1. **Go API** → Inserts into Supabase + calls n8n webhook
2. **n8n** → Claude analyzes the bug, classifies severity and category
3. **n8n** → Updates `bug_reports` with analysis, routes by severity
4. **n8n** → If HIGH/CRITICAL, triggers bug fix agent via HMAC-signed POST
5. **Bug fix agent** → Oracle triages → Code Analyst fetches ContentManager.jsx from GitHub → Fix Generator creates patch → Review Validator approves/rejects → PR created on `develop` branch

**Step 3: Monitor each stage**

| Stage | Where to Check | What to Look For |
|-------|---------------|------------------|
| n8n execution | `https://n8n.claimn.co/executions` | All nodes green, Claude analysis populated |
| Bug report updated | Supabase `bug_reports` table | `status = 'in_progress'`, `severity`, `agent_analysis` fields filled |
| Agent triggered | Agent logs (`docker logs claimn-agentic-ai`) | `202 Accepted`, job enqueued |
| Oracle decision | `fix_attempts` table or agent logs | `oracle_decision = 'proceed'`, files locked |
| Code Analyst | Agent logs | Fetched `ContentManager.jsx` from GitHub |
| Fix Generator | Agent logs | Generated patch with confidence level |
| Review Validator | Agent logs | Gemini verdict (APPROVE/REJECT) |
| PR created | GitHub `claimn-cms` repo | New PR on `develop` branch: `fix/bug-{id}` |

**Step 4: Review the PR**

The agent should create a PR that:
- Adds a null check for content pillars (e.g., `pillars?.name` or early return when pillars is empty)
- Only modifies `ContentManager.jsx` (not the CSS file — this is a logic bug)
- Follows the existing code patterns (React hooks, lucide-react icons, Tailwind)
- Does NOT introduce Glass UI components (the repo doesn't use them)

### Expected Agent Behavior

Given the test bug (undefined property access when no pillars exist), the agent should:

1. **Oracle:** Accept (HIGH severity, has suggested files, `claimn-cms` in allowlist)
2. **Code Analyst:** Fetch `ContentManager.jsx`, identify the pillar loading logic around line 142, note the existing "No Pillars" warning UI that exists but crashes before reaching it
3. **Fix Generator:** Add a guard/null check before accessing pillar properties, e.g.:
   ```jsx
   // Before (crashes)
   const pillarName = pillars[0].name
   // After (safe)
   const pillarName = pillars?.[0]?.name ?? 'Default'
   ```
4. **Review Validator:** Approve — minimal change, addresses root cause, no new bugs introduced
5. **Task Runner:** Create branch `fix/bug-{first-8-chars}`, commit patch, open PR to `develop`

### Success Criteria

| Criteria | Pass | Fail |
|----------|------|------|
| Pipeline completes without errors | All n8n nodes green, agent returns 202 | Any node fails, agent returns 4xx/5xx |
| Bug correctly classified | Severity HIGH, category `ui` or `data` | Wrong severity or category |
| Agent creates a PR | PR appears on `claimn-cms` `develop` branch | No PR, or PR to wrong branch |
| Fix is correct | Null check added, app no longer crashes | Wrong fix, introduces new bugs, or touches unrelated files |
| Fix follows codebase patterns | Uses existing style (JSX, Tailwind, hooks) | Introduces Glass UI, wrong styling approach |
| Only target files modified | Only `ContentManager.jsx` changed | CSS or unrelated files modified |

### Follow-Up Actions

After the pilot test, regardless of outcome:

1. **Document results** — Record in `server-infra/docs/BUG_FIX_AGENT_TEST_RESULTS.md`:
   - Which stages succeeded/failed
   - Agent's analysis quality (did it understand the bug?)
   - Fix quality (correct? minimal? safe?)
   - Time from bug report to PR
   - API cost (Claude + Gemini tokens)

2. **If PR is correct** → Merge to `develop`, mark test as success, proceed to implement full bug reporting in `claimn-members-spa`

3. **If PR is wrong or no PR created** → Analyze where the pipeline broke:
   - Oracle rejected? Check triage rules, allowlist, severity threshold
   - Code Analyst failed? Check GitHub token permissions, file paths
   - Fix Generator produced bad patch? Review Claude prompt, adjust system instructions
   - Review Validator rejected? Check Gemini feedback, iterate on fix
   - Record specific failure mode and fix before retesting

4. **If agent skips the bug** → Check Oracle decision log:
   - Is `claimn-cms` in the `allowed_source_apps` list? (Currently: `members-spa`, `admin-spa`, `web` — may need to add `claimn-cms`)
   - Is severity threshold met?
   - Are suggested files populated?

5. **Adjust and retest** — Fix any issues found, re-insert a new bug report (don't reuse the same `bug_id`), and run again until the full pipeline passes

### Important: Allowlist Check

The bug fix agent's Oracle has an `allowed_source_apps` allowlist. Before running the test, verify `claimn-cms` is in the list:

```sql
-- Check agent config
SELECT * FROM agent_config WHERE key = 'allowed_source_apps';
```

If not present, add it:
```sql
UPDATE agent_config
SET value = '["members-spa", "admin-spa", "web", "claimn-cms"]'
WHERE key = 'allowed_source_apps';
```

Or update the agent's config in `claimn-agentic-ai` if it's hardcoded.

---

## Questions?

The backend documentation is in:
- `server-infra/docs/BUG_AUTOMATION_ARCHITECTURE.md` - Full system architecture
- `claimn-agentic-ai/supabase/migrations/20260208000000_bug_reports.sql` - Database schema

The n8n workflow will be set up separately to process incoming reports with AI.
