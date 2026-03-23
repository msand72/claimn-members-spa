# AI Coaching System — Frontend Implementation Plan

**Created:** 2026-03-23
**Status:** Not started
**Owner:** Frontend agent (members-spa)
**Backend dependency:** AI coaching endpoints on `api.claimn.co/api/v2/members/coaching/ai/*`
**Backend status:** All 17 endpoints deployed (16 member + 1 unread-count). All GET endpoints return clean JSON (empty arrays/null or structured errors, never 500 with HTML). Confirmed 2026-03-23.

---

## Guiding Principles

1. **Progressive delivery** — each phase is standalone and shippable
2. **Minimal blast radius** — new files only; existing pages touched with 1-2 line additions
3. **Graceful degradation** — all coaching data is optional; if endpoints fail, sections hide silently
4. **Mobile-first** — every surface designed for 375px first, enhanced for desktop

---

## API Endpoints Reference

All require `Authorization: Bearer <token>`. Base: `/api/v2/members/coaching/ai`

### Preferences
| Method | Path | Notes |
|--------|------|-------|
| GET | `/preferences` | Returns ai_coaching_enabled, tone, frequency, pillar focus, etc. |
| PUT | `/preferences` | Update preferences |

### Insights
| Method | Path | Notes |
|--------|------|-------|
| GET | `/insights?page=1&limit=20&type=&pillar=&unread=` | Paginated, filterable |
| GET | `/insights/latest` | Max 3, for Hub display |
| POST | `/insights/{id}/read` | Mark as read |
| POST | `/insights/{id}/dismiss` | Dismiss insight |

### Plan
| Method | Path | Notes |
|--------|------|-------|
| GET | `/plan` | Returns active plan or null |
| POST | `/plan/generate` | Takes 3-5 seconds |
| PUT | `/plan/accept` | Moves draft → active |
| PUT | `/plan/items/{id}` | Body: `{ status: "completed"\|"skipped"\|"deferred" }` |
| DELETE | `/plan` | Archives current plan |

### Chat
| Method | Path | Notes |
|--------|------|-------|
| GET | `/chat/conversations` | List conversations |
| GET | `/chat/conversations/{id}?page=1&limit=50` | Messages in conversation |
| POST | `/chat/messages` | Body: `{ conversation_id?, content }`. Returns AI response. |

### Unread Count (for sidebar badge)
| Method | Path | Notes |
|--------|------|-------|
| GET | `/insights/unread-count` | Returns `{ count: N }`. Lightweight, no pagination. |

---

## Phase 1: Coach Panel on Hub + Hooks + Preferences

**Goal:** Member sees AI insights on the Hub. Can enable/disable AI coaching.

### New files
- [x] `src/lib/api/hooks/useCoaching.ts` — React Query hooks (preferences, insights latest, read, dismiss)
- [x] `src/components/coaching/CoachPanel.tsx` — Hub widget with opt-in + insight display

### Modified files
- [x] `src/lib/api/hooks/index.ts` — export new hooks (as `aiCoachingKeys` to avoid conflict with existing `coachingKeys`)
- [x] `src/pages/HubPage.tsx` — import + render CoachPanel (wrapped in PageErrorBoundary, after StatsRow before 2-column grid)

### Hook specifications
```
useCoachingPreferences()        → GET /preferences — staleTime: 5min
useUpdateCoachingPreferences()  → PUT /preferences — mutation, invalidates preferences
useCoachingInsightsLatest()     → GET /insights/latest — staleTime: 30s
useReadInsight()                → POST /insights/{id}/read — mutation, invalidates unread count
useDismissInsight()             → POST /insights/{id}/dismiss — mutation, optimistic remove, invalidates unread count
useCoachingUnreadCount()        → GET /insights/unread-count — staleTime: 60s, for sidebar badge
```

All hooks: `retry: false` on 4xx, `suspense: false`, errors handled at component level.

### CoachPanel behavior
- **AI not enabled:** GlassCard with brain icon, "AI Coach" title, one-line description, "Enable AI Coaching" GlassButton → calls PUT preferences with `{ ai_coaching_enabled: true }`
- **AI enabled:** GlassCard with latest 2-3 insights as compact rows (pillar dot + title + truncated body + time-ago). Tap insight → GlassModal with full body + "Mark as read" + action link
- Bottom: "Ask your coach..." input (disabled until Phase 3 — shows "Coming soon" tooltip)
- "View all insights →" link to `/coaching/ai` (built in Phase 2; link works once route exists)
- **Loading:** Skeleton rows matching insight height
- **Error/timeout:** `if (error || !data) return null` — section hides, Hub unaffected

### Acceptance criteria
- [ ] Enable/disable toggle works, persists across page reload
- [ ] Insights render with pillar colors, time-ago, truncated body
- [ ] Tap insight → modal with full body, mark as read, dismiss
- [ ] Backend down → panel hides silently, rest of Hub works
- [ ] Mobile: card is full-width, insight rows stack vertically

---

## Phase 2: Insights Page + Sidebar Badge

**Goal:** Dedicated page to browse all insights. Sidebar shows unread count.

### New files
- [x] `src/pages/CoachingInsightsPage.tsx` — insights list with pillar/type filters
- [x] `src/components/coaching/InsightCard.tsx` — reusable insight display card

### Modified files
- [x] `src/App.tsx` — add lazy route `/coaching/ai`
- [x] `src/components/layout/sectionNav.ts` — register under coaching section, added "AI Coach" tab
- [x] `src/components/layout/GlassSidebar.tsx` — unread badge on Coaching nav item
- [x] `src/lib/api/hooks/useCoaching.ts` — added `useCoachingInsights(params)` paginated hook
- [x] `src/lib/api/hooks/index.ts` — exported new hook + types

### Hook additions
```
useCoachingInsights(filters)  → GET /insights — paginated, filterable by type/pillar/unread
```

### CoachingInsightsPage layout
- Header: "AI Coach" title
- Filter tabs: GlassTabs for pillar (All, Identity, Emotional, Physical, Connection, Mission)
- Type filter: secondary tabs or dropdown (Daily, Weekly, Nudge, All)
- Insight list: InsightCard components, paginated with "Load more" button
- Each InsightCard: pillar left-border color, title, body (expandable on tap), time-ago, priority badge if high/urgent, dismiss button (ghost, appears on hover / always visible on mobile)
- Empty state: "No insights yet. Your AI coach will start generating personalized insights based on your activity."

### Sidebar unread badge
- Only fetch if `ai_coaching_enabled` is true (from cached preferences)
- Use `useCoachingUnreadCount()` → `GET /insights/unread-count` → `{ count: N }` (lightweight, no pagination)
- Red dot + count on "Coaching & Experts" nav item (same pattern as notifications)

### Acceptance criteria
- [ ] Navigate to /coaching/ai, page renders with insights
- [ ] Filter by pillar — list updates
- [ ] Filter by type — list updates
- [ ] Mark as read → unread count decreases
- [ ] Dismiss → insight removed from list (optimistic)
- [ ] Pagination: load more button works
- [ ] Sidebar badge shows correct unread count
- [ ] AI disabled → no badge shown
- [ ] Empty state renders when no insights

---

## Phase 3: AI Chat

**Goal:** Standard AI chat interface. NOT a messaging clone.

### New files
- [x] `src/pages/CoachingChatPage.tsx` — full-screen chat with optimistic messages + loading bubble
- [x] `src/components/coaching/ChatQuickChips.tsx` — conversation starter pills

### Modified files
- [x] `src/App.tsx` — add lazy route `/coaching/ai/chat`
- [x] `src/components/coaching/CoachPanel.tsx` — "Ask your coach..." bar navigates to chat
- [x] `src/lib/api/hooks/useCoaching.ts` — added chat hooks (conversations, messages, send)
- [x] `src/lib/api/hooks/index.ts` — exported chat hooks + types
- [x] `src/components/layout/sectionNav.ts` — added /coaching/ai/chat to allPaths

### Hook additions
```
useCoachingConversations()           → GET /chat/conversations
useCoachingMessages(conversationId)  → GET /chat/conversations/{id} — paginated
useSendCoachingMessage()             → POST /chat/messages — optimistic user msg + loading bubble
```

### Chat design (purpose-built, not MessagesPage clone)
- **No sidebar conversation list** — single active conversation (latest). History is a future enhancement.
- **Full-height layout:** Header ("AI Coach" + back arrow) → scrollable messages → fixed input at bottom
- **AI messages:** Left-aligned, glass-base background, brain/sparkle icon in GlassAvatar with koppar ring
- **User messages:** Right-aligned, koppar background, rounded corners
- **Input:** GlassInput + send button. Text only, no image upload.
- **Quick chips** (shown when conversation is empty): "How am I doing?", "Suggest a protocol", "Review my week", "Help me with a goal" — pill buttons above input. Tap sends as message.
- **Waiting state:** Pulsing "..." bubble on AI side appears instantly after user sends. Replaced with response when it arrives. Timeout after 15s → "Sorry, I couldn't respond right now. Try again." with retry button.
- **Optimistic:** User message appears immediately with temp ID.

### Mobile
- Full-screen chat, messages fill viewport
- Input fixed at bottom with safe-area padding (same `safe-area-bottom` pattern)
- Quick chips scroll horizontally if they overflow

### Acceptance criteria
- [ ] Open chat → empty state with quick chips
- [ ] Tap chip → message sent, AI responds
- [ ] Type message → send → appears instantly → AI responds within 1-15s
- [ ] AI timeout → error message inline with retry button
- [ ] Back button → navigates to /coaching/ai
- [ ] Mobile: full-screen, input at bottom, safe area respected
- [ ] CoachPanel "Ask your coach..." input now navigates to /coaching/ai/chat

---

## Phase 4: Plan Page

**Goal:** AI-generated weekly plan as a tab alongside goals in the growth section.

### New files
- [x] `src/pages/PlanPage.tsx` — plan view with day selector + generation animation
- [x] `src/components/coaching/PlanItemCard.tsx` — checkable plan item with pillar border

### Modified files
- [x] `src/App.tsx` — add lazy route `/plan` (PremiumProtected)
- [x] `src/components/layout/sectionNav.ts` — added Plan tab in growth section (Goals | Plan | Sessions | ...)
- [x] `src/lib/api/hooks/useCoaching.ts` — added plan hooks (get, generate, accept, update item, archive)
- [x] `src/lib/api/hooks/index.ts` — exported plan hooks + types

### Hook additions
```
useCoachingPlan()      → GET /plan
useGeneratePlan()      → POST /plan/generate — mutation
useAcceptPlan()        → PUT /plan/accept — mutation
useUpdatePlanItem()    → PUT /plan/items/{id} — mutation, optimistic
useArchivePlan()       → DELETE /plan — mutation
```

### Navigation: /goals stays primary
- "My Plan" growth section keeps `/goals` as the entry point
- `/plan` added as a tab in the section top bar: Goals | **Plan** | Protocols | KPIs | ...
- Both views coexist — member's own goals vs. AI's recommended plan

### PlanPage layout (mobile-first)
- **Day selector strip:** horizontal scroll of day pills (Mon–Sun + "Anytime"), today highlighted. Tap day → filters items below. Same interaction as BookingModal week view.
- **Item list:** filtered by selected day. PlanItemCard components.
- **Desktop (lg:):** Two-panel — day selector as vertical sidebar, items fill main area. NOT a 7-column grid.

### PlanItemCard
- Checkbox left side → PUT status: "completed" (optimistic strikethrough)
- Pillar color left border
- Title + description (1 line truncated)
- item_type GlassBadge ("Protocol", "Goal", "Habit", "Session")
- Frequency label (daily, 3x/week, etc.)
- Completed: strikethrough + 50% opacity

### Plan states
- **No plan:** EmptyState with brain icon, "Your AI coach can create a personalized growth plan" + "Generate My Plan" button
- **Generating (3-5s):** Animated progress steps: "Analyzing your goals..." → "Reviewing your protocols..." → "Building your plan..." (timed at 1s intervals, pure frontend animation)
- **Draft:** Plan visible, items NOT checkable. "Accept Plan" primary button + "Discard" ghost button at top.
- **Active:** Items checkable. "Regenerate" secondary button + "Archive" ghost button.

### Acceptance criteria
- [ ] No plan → empty state → generate → loading animation → plan appears as draft
- [ ] Accept plan → items become checkable
- [ ] Complete item → optimistic strikethrough + status update
- [ ] Day selector filters items correctly
- [ ] "Anytime" items always visible
- [ ] Regenerate → loading → new plan draft
- [ ] Archive → back to empty state
- [ ] Mobile: day selector scrolls horizontally, items stack vertically
- [ ] Desktop: two-panel layout
- [ ] /plan accessible as tab in growth section, /goals still primary

---

## Phase 5: Contextual Touches

**Goal:** Small, high-value integrations on existing pages. 1-5 lines each.

### Changes (each independent)
- [x] **GoalsPage.tsx:** SparklesIcon on goal cards with matching AI insights (`related_entity_type = 'member_goals'`)
- [x] **AssessmentResultsPage.tsx:** "AI Growth Plan" card shown when AI enabled + no plan exists, links to /plan
- [x] **NotificationsPage.tsx:** `ai_insight` type mapped to SparklesIcon

### Acceptance criteria
- [x] Goal card sparkle icon appears when relevant insight exists
- [x] Assessment results page shows plan prompt when AI enabled
- [x] AI insight notifications render with correct icon

---

## Files Summary

### New files (10 total across all phases)
```
Phase 1:  src/lib/api/hooks/useCoaching.ts
          src/components/coaching/CoachPanel.tsx
Phase 2:  src/pages/CoachingInsightsPage.tsx
          src/components/coaching/InsightCard.tsx
Phase 3:  src/pages/CoachingChatPage.tsx
          src/components/coaching/ChatQuickChips.tsx
Phase 4:  src/pages/PlanPage.tsx
          src/components/coaching/PlanItemCard.tsx
```

### Modified files (per phase, minimal changes)
```
Phase 1:  HubPage.tsx (+2 lines), hooks/index.ts (+1 line)
Phase 2:  App.tsx (+1 line), sectionNav.ts (+2 lines), GlassSidebar.tsx (+5 lines)
Phase 3:  App.tsx (+1 line), CoachPanel.tsx (enable input)
Phase 4:  App.tsx (+1 line), sectionNav.ts (+1 line)
Phase 5:  GoalsPage.tsx (+5 lines), AssessmentResultsPage.tsx (+10 lines), NotificationsPage.tsx (+3 lines)
```

---

## Estimated scope
| Phase | New files | Modified files | New lines (approx) |
|-------|-----------|---------------|-------------------|
| 1 | 2 | 2 | ~200 |
| 2 | 2 | 3 | ~250 |
| 3 | 2 | 2 | ~300 |
| 4 | 2 | 2 | ~350 |
| 5 | 0 | 3 | ~30 |

---

## What is NOT in this plan
- No changes to MessagesPage
- No changes to existing coaching/sessions/experts pages
- No "Ask AI Coach" on AskExpertButton
- No conversation history sidebar in chat (single-conversation in Phase 3)
- No real-time streaming of AI responses (request-response is fine for 1-3s)
- No 7-column weekly grid layout
- No replacement of /goals as primary nav entry
