# CLAIM'N Members SPA - START HERE

**Read this ENTIRE document before making any changes to this codebase.**

*Last updated: 2026-02-15*

---

## Table of Contents

1. [What Is This?](#what-is-this)
2. [Agent Separation Policy](#agent-separation-policy)
3. [Tech Stack](#tech-stack)
4. [Getting Started](#getting-started)
5. [Project Structure](#project-structure)
6. [Architecture Overview](#architecture-overview)
7. [Routing](#routing)
8. [Authentication](#authentication)
9. [API Layer](#api-layer)
10. [State Management](#state-management)
11. [Styling & Theme System](#styling--theme-system)
12. [Component Library (Glass UI)](#component-library-glass-ui)
13. [Page Inventory](#page-inventory)
14. [Domain Concepts](#domain-concepts)
15. [Navigation System](#navigation-system)
16. [Environment & Deployment](#environment--deployment)
17. [Common Patterns](#common-patterns)
18. [Gotchas & Hard-Won Lessons](#gotchas--hard-won-lessons)
19. [Database Schema Reference](#database-schema-reference)
20. [Reference Locations](#reference-locations)

---

## What Is This?

The CLAIM'N Members SPA is a **React single-page application** for the CLAIM'N men's transformation platform. It serves as the member-facing portal where users manage their profiles, track transformation goals, participate in community features, book coaching sessions, and follow structured protocols.

- **Production URL:** `https://members.claimn.co`
- **Backend API:** `https://api.claimn.co` (Go-based, separate repo)
- **52 pages**, **26 API hook files**, **14 Glass UI components**
- **87+ Go API endpoints** integrated via `/api/v2/members/*`

---

## Agent Separation Policy

**Frontend and backend are handled by SEPARATE agents.**

| Repo | Agent | Purpose |
|------|-------|---------|
| `claimn-members-spa` (this) | Frontend agent | React SPA |
| `claimn-admin-spa` | Frontend agent | Admin panel |
| `server-infra` | Backend agent | Go API, database |
| `claimn-web` | Reference only | Next.js marketing site, migration docs |

If you need backend changes (new endpoints, schema changes), **write a prompt file** to `/Users/maxsandberg/projects/server-infra/AGENT_PROMPT.md` with the exact changes needed. The backend agent runs on a separate on-prem machine and will execute the prompt independently. Never push to or directly modify `server-infra`. See CLAUDE.md "Backend Change Requests" section for the full protocol.

---

## 📚 External API Integration Protocol

**BEFORE modifying ANY external API integration:**

1. **Ask for API Documentation** - Request the official API documentation URL
2. **Read Documentation Thoroughly** - Study auth, data structures, endpoints, rate limits
3. **Understand the Data Model** - Know exactly how the API structures its data
4. **Verify When Uncertain** - Ask the user rather than guessing
5. **Test Carefully** - Changes to external APIs can break integrations for hours

**Why:** Incorrect assumptions about external APIs can cause 6+ hours of debugging.

See CLAUDE.md "External API Integration Protocol" section for full details.

---

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| **Framework** | React | 19.2 |
| **Language** | TypeScript | 5.9 (strict mode) |
| **Build Tool** | Vite | 7.2 |
| **Routing** | React Router | 7.13 |
| **Server State** | TanStack React Query | 5.90 |
| **Client State** | Zustand (available), Context API | 5.0 |
| **Styling** | Tailwind CSS | 4.1 |
| **Forms** | React Hook Form + Zod validation | 7.71 / 4.3 |
| **UI Primitives** | Radix UI (dialog, dropdown, tabs, tooltip) | Latest |
| **Icons** | Lucide React | 0.563 |
| **Charts** | Recharts | 3.7 |
| **Animation** | Framer Motion | 12.29 |
| **Dates** | date-fns | 4.1 |
| **Deployment** | Vercel | SPA config |

---

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm
- Access to the Go backend running locally or use production API

### Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd claimn-members-spa
npm install

# 2. Create environment file
cp .env.example .env

# 3. Configure .env
# VITE_API_URL=http://localhost:3001   (local Go backend)
# VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-key

# 4. Start dev server
npm run dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | TypeScript check + Vite production build |
| `npm run lint` | ESLint across all files |
| `npm run preview` | Preview production build locally |

### Build Verification

```bash
# Always run before committing to catch type errors
npm run build
```

The build must pass with **zero TypeScript errors** before deployment.

---

## Project Structure

```
claimn-members-spa/
├── public/
│   └── fonts/
│       └── Neutraface_2.ttf          # Custom brand font
├── src/
│   ├── main.tsx                       # Entry point (StrictMode + ErrorBoundary)
│   ├── App.tsx                        # Router, providers, route definitions
│   ├── fonts.css                      # @font-face declarations (import FIRST)
│   ├── index.css                      # Tailwind + CSS variables + Google Fonts
│   ├── vite-env.d.ts                  # Vite type definitions
│   │
│   ├── contexts/                      # React Context providers
│   │   ├── AuthContext.tsx            #   Auth state, signIn/signOut, user info
│   │   └── ThemeContext.tsx           #   Light/dark theme toggle
│   │
│   ├── components/
│   │   ├── ui/                        # Glass UI component library (14 components)
│   │   │   ├── GlassCard.tsx
│   │   │   ├── GlassButton.tsx
│   │   │   ├── GlassInput.tsx
│   │   │   ├── GlassModal.tsx
│   │   │   ├── GlassDropdown.tsx
│   │   │   ├── GlassTabs.tsx
│   │   │   ├── GlassTable.tsx
│   │   │   ├── GlassMultiSelect.tsx
│   │   │   ├── GlassBadge.tsx
│   │   │   ├── GlassAlert.tsx
│   │   │   ├── GlassAvatar.tsx
│   │   │   ├── GlassStatsCard.tsx
│   │   │   ├── BackgroundPattern.tsx
│   │   │   └── ThemeToggle.tsx
│   │   │
│   │   ├── layout/                    # Layout shell components
│   │   │   ├── MainLayout.tsx         #   Responsive sidebar + content
│   │   │   ├── GlassSidebar.tsx       #   Desktop navigation sidebar
│   │   │   ├── MobileHeader.tsx       #   Mobile top header
│   │   │   ├── MobileBottomNav.tsx    #   Mobile bottom navigation bar
│   │   │   ├── SectionTopBar.tsx      #   Section-specific tab/stepper bar
│   │   │   └── sectionNav.ts          #   Section navigation config
│   │   │
│   │   ├── ProtectedRoute.tsx         # Auth guard + onboarding redirect
│   │   ├── RequireTier.tsx            # Subscription tier gate
│   │   ├── RequireUserType.tsx        # User type check
│   │   ├── ErrorBoundary.tsx          # Root error boundary
│   │   ├── RouteErrorBoundary.tsx     # Route-level errors (404, etc.)
│   │   ├── PageErrorBoundary.tsx      # Per-page error boundary
│   │   ├── LoadingSpinner.tsx         # Loading indicator
│   │   ├── EmptyState.tsx             # Empty state display
│   │   ├── ErrorCard.tsx              # Error display card
│   │   ├── PlanBuilder.tsx            # Protocol planning interface
│   │   ├── AskExpertButton.tsx        # Expert consultation CTA
│   │   └── [journey widgets]          # JourneyWidget, SmartPrompts, etc.
│   │
│   ├── hooks/                         # Standalone custom hooks
│   │   ├── useInterests.ts
│   │   └── useInterestGroups.ts
│   │
│   ├── lib/                           # Core utilities & services
│   │   ├── auth.ts                    # Token management, login/logout, refresh
│   │   ├── constants.ts               # Archetypes, pillars, KPI types, statuses
│   │   ├── utils.ts                   # General utilities
│   │   ├── image-utils.ts             # Image processing helpers
│   │   ├── protocol-plan.ts           # Protocol planning logic
│   │   ├── isChunkLoadError.ts        # Stale chunk detection
│   │   │
│   │   ���── assessment/                # Assessment system
│   │   │   ├── questions.ts           #   30 assessment questions
│   │   │   └── scoring.ts            #   Scoring algorithm
│   │   │
│   │   └── api/                       # API client & React Query hooks
│   │       ├── client.ts              #   Fetch-based API client + helpers
│   │       ├── types.ts               #   TypeScript interfaces for API
│   │       ├── index.ts               #   Barrel exports
│   │       └── hooks/                 #   26 React Query hook files
│   │           ├── useProfile.ts
│   │           ├── useFeed.ts
│   │           ├── useGoals.ts
│   │           ├── useProtocols.ts
│   │           ├── useExperts.ts
│   │           ├── ... (26 total)
│   │           └── index.ts           #   Barrel re-exports
│   │
│   └── pages/                         # Route page components (52 files)
│       ├── HubPage.tsx                # Landing page (/)
│       ├── LoginPage.tsx              # Auth
│       ├── ProfilePage.tsx            # User profile
│       ├── GoalsPage.tsx              # Goals list
│       ├── ... (52 total)
│       └── onboarding/                # 5-step onboarding flow
│           ├── OnboardingWelcomePage.tsx
│           ├── OnboardingAssessmentPage.tsx
│           ├── OnboardingResultsPage.tsx
│           ├── OnboardingChallengePage.tsx
│           └── OnboardingPathPage.tsx
│
├── package.json
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── vercel.json                        # Deployment: font headers + SPA rewrites
├── index.html                         # HTML shell
├── .env.example                       # Environment variable template
└── START_HERE.md                      # This file
```

---

## Architecture Overview

### Provider Stack

The app wraps the entire component tree in nested providers (see `App.tsx`):

```
ErrorBoundary          → Catches React render crashes
  QueryClientProvider   → TanStack React Query (server state cache)
    ThemeProvider        → Light/dark theme context
      AuthProvider       → User session, auth methods
        RouterProvider   → React Router (all routes)
```

### Data Flow

```
User Action → Page Component → React Query Hook → API Client → Go Backend
                                    ↓                              ↓
                              Cache (5min stale)          /api/v2/members/*
                                    ↓
                              Re-render with data
```

### Key Architectural Decisions

1. **Lazy-loaded pages** — Every page uses `lazyWithRetry()` for code splitting with automatic stale chunk recovery after deploys
2. **React Query for ALL server state** — No manual fetch/useEffect patterns; all API data goes through query hooks
3. **Glass UI component library** — All UI uses the custom Glass design system (glassmorphism + brand colors)
4. **Tier-based access control** — Routes are wrapped with `Protected` (auth only) or `PremiumProtected` (coaching tier+)
5. **Token exchange flow** — Login gets GoTrue token, then exchanges it for a Go-issued JWT with user_type

---

## Routing

Defined in `src/App.tsx` using React Router v7 with `createBrowserRouter`.

### Route Protection Levels

| Wrapper | Access | Used For |
|---------|--------|----------|
| None | Public | `/login`, `/forgot-password`, `/reset-password` |
| `<Protected>` | Authenticated | Most pages (hub, profile, community, shop, etc.) |
| `<PremiumProtected>` | Coaching tier+ | Transformation features (goals, protocols, KPIs, etc.) |

### Route Map

```
Public:
  /login                    → LoginPage
  /forgot-password          → ForgotPasswordPage
  /reset-password           → ResetPasswordPage

Protected (auth required):
  /                         → HubPage (landing)
  /profile                  → ProfilePage
  /billing                  → BillingPage
  /resources                → ResourcesPage

  /onboarding/*             → 5-step onboarding flow (welcome → assessment → results → challenge → path)

  /feed                     → FeedPage
  /messages                 → MessagesPage
  /connections              → ConnectionsPage
  /circles                  → CirclesPage
  /circles/:id              → CircleDetailPage
  /network                  → NetworkPage
  /interest-groups          → InterestGroupsPage

  /shop                     → ShopPage
  /shop/protocols           → ShopProtocolsPage
  /shop/protocols/:slug     → ShopProtocolDetailPage
  /shop/circles             → ShopCirclesPage
  /shop/upgrade             → ShopUpgradePage
  /shop/success             → ShopSuccessPage

  /experts                  → ExpertsPage
  /experts/:id              → ExpertProfilePage
  /book-session             → BookSessionPage
  /expert-sessions          → ExpertSessionsPage

  /events                   → EventsPage
  /events/:id               → EventDetailPage

  /programs                 → ProgramsPage
  /programs/sprints         → ProgramsSprintsPage
  /programs/reviews         → ProgramsReviewsPage

  /coaching/sessions        → CoachingSessionsPage
  /coaching/resources       → CoachingResourcesPage
  /coaching/session-notes   → SessionNotesPage

  /assessment               → AssessmentPage
  /assessment/take          → AssessmentTakePage
  /assessment/results       → AssessmentResultsPage

Premium Protected (coaching tier required):
  /goals                    → GoalsPage
  /goals/:id                → GoalDetailPage
  /action-items             → ActionItemsPage
  /protocols                → ProtocolsPage
  /protocols/:slug          → ProtocolDetailPage
  /my-protocols             → MyProtocolsPage
  /kpis                     → KPIsPage
  /milestones               → MilestonesPage
  /accountability           → AccountabilityPage
```

### Adding a New Route

1. Create the page component in `src/pages/`
2. Add a lazy import in `App.tsx` using `lazyWithRetry()`
3. Add the route entry in the router config with appropriate protection wrapper
4. If it belongs to a navigation section, add it to `sectionNav.ts`

---

## Authentication

### Flow

```
1. User submits email + password
2. POST /api/v2/auth/login → GoTrue-issued tokens (local self-hosted GoTrue)
3. POST /api/v2/auth/exchange → Go JWT with user_type (fallback: use original token)
4. GET /api/v2/auth/me → User profile data
5. Tokens stored in localStorage
6. Auto-refresh scheduled 5 minutes before expiry
```

### Key Files

- `src/lib/auth.ts` — Token storage, login/logout, refresh logic, exchange
- `src/contexts/AuthContext.tsx` — React context, `useAuth()` hook

### Token Storage (localStorage)

| Key | Content |
|-----|---------|
| `claimn_access_token` | JWT access token |
| `claimn_refresh_token` | Refresh token |
| `claimn_expires_at` | Unix timestamp (seconds) |

### User Types

```typescript
type UserType = 'guest' | 'member' | 'client' | 'expert' | 'admin' | 'superadmin'
```

- `admin` and `superadmin` bypass all tier requirements
- `hasAccess(...types)` checks the current user's type (admins always pass)

### Using Auth in Components

```tsx
import { useAuth } from '../contexts/AuthContext'

function MyComponent() {
  const { user, userType, hasAccess, signOut } = useAuth()

  if (hasAccess('expert', 'admin')) {
    // expert or admin-only logic
  }

  return <p>Hello, {user?.display_name}</p>
}
```

---

## API Layer

### Architecture

```
src/lib/api/
├── client.ts     → ApiClient class (fetch wrapper with auth headers)
├── types.ts      → TypeScript interfaces for all API entities
├── index.ts      → Barrel exports
└── hooks/        → 26 React Query hook files (queries + mutations)
```

### API Client (`src/lib/api/client.ts`)

- Singleton `api` instance with `get`, `post`, `put`, `delete`, `uploadFile` methods
- Auto-attaches Bearer token from localStorage
- Auto-detects API base URL (production vs. development)
- Strips trailing slashes (Go backend returns 404 on trailing slashes)
- Logs response shapes in development for debugging
- Stores all errors in `window.__apiErrors` (inspect via browser console)

### Safe Data Extraction Helpers

The backend response format can vary. These helpers handle all variants safely:

| Helper | Purpose |
|--------|---------|
| `safeArray<T>(response)` | Extracts array from `data`, `items`, `results`, or bare array |
| `safePagination(response)` | Extracts pagination from `pagination`, `meta`, or `paging` |
| `safeString(obj, key, fallback)` | Safe string field access |
| `unwrapData<T>(response)` | Unwrap `{ data: T }` wrapper |
| `is404Error(error)` | Check if error is 404 |

### React Query Hooks

All 26 hook files live in `src/lib/api/hooks/`. Each file exports query hooks and mutation hooks.

| Hook File | Domain |
|-----------|--------|
| `useProfile` | Member profile CRUD |
| `useDashboard` | Dashboard data |
| `useNetwork` | Network/member directory |
| `useConnections` | Connection requests |
| `useFeed` | Community feed posts |
| `useMessages` | Direct messaging |
| `useCircles` | Circles (groups) |
| `useGoals` | Goal tracking |
| `useActionItems` | Action items |
| `useProtocols` | Protocol enrollment/progress |
| `useExperts` | Expert directory |
| `useMyExpert` | Assigned expert |
| `useCoachingSessions` | Coaching session booking |
| `useResources` | Learning resources |
| `usePrograms` | Program enrollment |
| `useAssessments` | Assessment submission/results |
| `useEvents` | Events/calendar |
| `useBilling` | Subscription & billing |
| `useSubscription` | Subscription status |
| `useNotifications` | Notifications |
| `useOnboarding` | Onboarding progress |
| `useJourney` | Journey tracking |
| `useJournal` | Journal entries |
| `useMilestones` | Milestone tracking |
| `useAccountability` | Accountability groups |
| `useInterests` | Interest categories |
| `useCommunityQuestions` | Community Q&A |

### Using Hooks in Pages

```tsx
import { useGoals, useCreateGoal } from '../lib/api/hooks'

function GoalsPage() {
  const { data, isLoading, error } = useGoals()
  const createGoal = useCreateGoal()

  const handleCreate = () => {
    createGoal.mutate({ title: 'New Goal', pillar: 'physical' })
  }

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorCard error={error} />

  const goals = safeArray(data)
  return goals.map(goal => <GoalCard key={goal.id} goal={goal} />)
}
```

### Query Client Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5 minutes
      retry: (failureCount, error) => {
        if (status >= 400 && status < 500) return false  // No retry on 4xx
        return failureCount < 1                           // 1 retry for others
      },
    },
  },
})
```

---

## State Management

### Three Layers

| Layer | Tool | Scope | Usage |
|-------|------|-------|-------|
| **Server State** | TanStack React Query | API data | All backend data fetching & caching |
| **Global Client State** | Context API | App-wide | Auth (user/session), Theme (light/dark) |
| **Local State** | React.useState | Component | Forms, modals, UI toggles |

Zustand is installed and available but **not currently in use**. It's there if complex client-side state management is needed in the future.

### Rule of Thumb

- Fetching from API? Use a React Query hook from `src/lib/api/hooks/`
- Need auth or theme info? Use `useAuth()` or `useTheme()` context hooks
- Everything else? Use local component state

---

## Styling & Theme System

### Tailwind CSS 4.1

All styling uses Tailwind utility classes. Custom theme values are defined in `tailwind.config.js`.

### Brand Color Palette

| Color | Hex | Tailwind Class | Usage |
|-------|-----|----------------|-------|
| Charcoal | `#1C1C1E` | `text-charcoal`, `bg-charcoal` | Dark backgrounds, text |
| Jordbrun | `#5E503F` | `text-jordbrun`, `bg-jordbrun` | Physical pillar |
| Sand Beige | `#E5D9C7` | `text-sandbeige`, `bg-sandbeige` | Warm accents |
| Oliv | `#3A4A42` | `text-oliv`, `bg-oliv` | Emotional pillar, success states |
| Dimblag | `#A1B1C6` | `text-dimblag`, `bg-dimblag` | Muted/secondary text |
| Koppar | `#B87333` | `text-koppar`, `bg-koppar` | **Primary accent**, CTAs |
| Kalkvit | `#F9F7F4` | `text-kalkvit`, `bg-kalkvit` | Theme-adaptive (see below) |
| Tegelrod | `#B54A46` | `text-tegelrod`, `bg-tegelrod` | Errors, high priority |
| Skogsgron | `#6B8E6F` | `text-skogsgron`, `bg-skogsgron` | Success, completed states |
| Glass Dark | `#0A0A0B` | `bg-glass-dark` | Dark mode background |

### Theme System (Light/Dark)

The `kalkvit` color **switches meaning** based on theme:

| Mode | `--color-kalkvit` resolves to | Effect |
|------|-------------------------------|--------|
| Dark (default) | Cream white (`#F9F7F4`) | Light text on dark bg |
| Light | Charcoal (`#1C1C1E`) | Dark text on light bg |

**Always use `text-kalkvit`** for primary text — it adapts automatically.

Theme is controlled via `ThemeContext` and toggled with the `ThemeToggle` component. It applies the `.light` CSS class to `:root`.

### Typography

| Font | Tailwind Class | Usage |
|------|----------------|-------|
| **Neutraface 2 Display** | `font-display` | Hero titles, h1, h3 card titles, large stat numbers |
| **Playfair Display** | `font-serif` | h2 section headings, subtitles, taglines (often italic) |
| **Lato** | `font-sans` | Body text, buttons, labels, small text |

**Import order matters** in `main.tsx`:
```tsx
import './fonts.css'  // MUST come before index.css
import './index.css'
```

### Glass Morphism Variants

Dark theme glass uses 95% opaque dark backgrounds (5% transparent). Light theme uses white with varying opacity.

```css
/* Base Glass — cards, panels, nav bars */
background-color: rgba(28, 28, 30, 0.95);   /* dark theme */
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.15);

/* Elevated Glass — modals, mobile drawer */
background-color: rgba(28, 28, 30, 0.95);   /* dark theme */
backdrop-filter: blur(24px);
border: 1px solid rgba(255, 255, 255, 0.2);

/* Dropdown Glass — context menus, dropdown panels */
background-color: rgba(28, 28, 30, 0.95);   /* dark theme */
backdrop-filter: blur(32px);
border: 1px solid rgba(255, 255, 255, 0.2);

/* Accent Glass — CTAs, featured items */
background: linear-gradient(135deg, rgba(184, 115, 51, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%);
border: 1px solid rgba(184, 115, 51, 0.25);
```

These are defined as utility classes (`glass-base`, `glass-elevated`, `glass-dropdown`) in `src/index.css` inside `@layer utilities`. To change opacity globally, edit the `background-color` values there — do NOT use inline styles or media query overrides.

---

## Component Library (Glass UI)

All reusable UI components live in `src/components/ui/` and follow the Glass design system.

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `GlassCard` | Container with glass background | `variant`, `className` |
| `GlassButton` | Styled button | `variant` (primary/secondary/ghost/danger), `size`, `loading` |
| `GlassInput` | Form input field | Standard input props + glass styling |
| `GlassModal` | Dialog overlay (Radix UI) | `open`, `onClose`, `title` |
| `GlassDropdown` | Dropdown menu (Radix UI) | `items`, `trigger` |
| `GlassTabs` | Tabbed interface (Radix UI) | `tabs`, `activeTab` |
| `GlassTable` | Data table | `columns`, `data`, `pagination` |
| `GlassMultiSelect` | Multi-select dropdown | `options`, `value`, `onChange` |
| `GlassBadge` | Status/category badge | `variant`, `color` |
| `GlassAlert` | Alert/notification bar | `type` (info/success/warning/error) |
| `GlassAvatar` | User avatar with fallback | `src`, `name`, `size` |
| `GlassStatsCard` | Statistics display card | `title`, `value`, `change` |
| `BackgroundPattern` | Animated background | Used in layout |
| `ThemeToggle` | Light/dark mode switch | Uses ThemeContext |

### Shared Page Components

| Component | Purpose |
|-----------|---------|
| `LoadingSpinner` | Full-page or inline loading state |
| `EmptyState` | Empty list/data display with icon + message |
| `ErrorCard` | Error display with retry option |
| `ProtectedRoute` | Auth + onboarding check wrapper |
| `RequireTier` | Subscription tier gate |
| `PlanBuilder` | Protocol/goal planning form |
| `AskExpertButton` | Floating CTA to contact expert |

---

## Page Inventory

### Auth Pages (3)
| Page | Route | Purpose |
|------|-------|---------|
| LoginPage | `/login` | Email/password login |
| ForgotPasswordPage | `/forgot-password` | Request password reset email |
| ResetPasswordPage | `/reset-password` | Set new password via token |

### Onboarding (5)
| Page | Route | Purpose |
|------|-------|---------|
| OnboardingWelcomePage | `/onboarding/welcome` | Welcome + archetype intro |
| OnboardingAssessmentPage | `/onboarding/assessment` | 30-question assessment |
| OnboardingResultsPage | `/onboarding/results` | Assessment results + archetype |
| OnboardingChallengePage | `/onboarding/challenge` | 7-day challenge intro |
| OnboardingPathPage | `/onboarding/path` | Choose transformation path |

### Core (4)
| Page | Route | Purpose |
|------|-------|---------|
| HubPage | `/` | Landing page / main hub |
| ProfilePage | `/profile` | User profile edit |
| BillingPage | `/billing` | Subscription management |
| ResourcesPage | `/resources` | Learning materials |

### Community (6)
| Page | Route | Purpose |
|------|-------|---------|
| FeedPage | `/feed` | Community posts feed |
| MessagesPage | `/messages` | Direct messaging |
| ConnectionsPage | `/connections` | Connection requests |
| CirclesPage | `/circles` | Circle membership |
| CircleDetailPage | `/circles/:id` | Single circle view |
| NetworkPage | `/network` | Member directory |

### Transformation Tracking (11) — Premium
| Page | Route | Purpose |
|------|-------|---------|
| AssessmentPage | `/assessment` | Assessment landing |
| AssessmentTakePage | `/assessment/take` | Take assessment |
| AssessmentResultsPage | `/assessment/results` | View results |
| GoalsPage | `/goals` | Goals list |
| GoalDetailPage | `/goals/:id` | Single goal view |
| ActionItemsPage | `/action-items` | Action items list |
| ProtocolsPage | `/protocols` | Protocol catalog |
| ProtocolDetailPage | `/protocols/:slug` | Protocol details |
| MyProtocolsPage | `/my-protocols` | Enrolled protocols |
| KPIsPage | `/kpis` | KPI tracking dashboard |
| MilestonesPage | `/milestones` | Milestone tracking |
| AccountabilityPage | `/accountability` | Accountability groups |

### Coaching & Experts (8)
| Page | Route | Purpose |
|------|-------|---------|
| ExpertsPage | `/experts` | Expert directory |
| ExpertProfilePage | `/experts/:id` | Expert profile |
| BookSessionPage | `/book-session` | Session booking (calendar) |
| ExpertSessionsPage | `/expert-sessions` | My expert sessions |
| CoachingSessionsPage | `/coaching/sessions` | Coaching session history |
| CoachingResourcesPage | `/coaching/resources` | Coaching materials |
| SessionNotesPage | `/coaching/session-notes` | Session notes |
| InterestGroupsPage | `/interest-groups` | Interest-based groups |

### Events (2)
| Page | Route | Purpose |
|------|-------|---------|
| EventsPage | `/events` | Events calendar |
| EventDetailPage | `/events/:id` | Event details |

### Programs (3)
| Page | Route | Purpose |
|------|-------|---------|
| ProgramsPage | `/programs` | Enrolled programs |
| ProgramsSprintsPage | `/programs/sprints` | Sprint tracking |
| ProgramsReviewsPage | `/programs/reviews` | Program reviews |

### Shop (6)
| Page | Route | Purpose |
|------|-------|---------|
| ShopPage | `/shop` | Shop landing |
| ShopProtocolsPage | `/shop/protocols` | Browse protocols |
| ShopProtocolDetailPage | `/shop/protocols/:slug` | Protocol purchase |
| ShopCirclesPage | `/shop/circles` | Browse circles |
| ShopUpgradePage | `/shop/upgrade` | Tier upgrade |
| ShopSuccessPage | `/shop/success` | Purchase confirmation |

---

## Domain Concepts

### The 6 Archetypes

Member personality types determined by Big Five assessment scoring (z-score + cosine similarity matching):

1. **The Achiever** — Goal-oriented, results-driven
2. **The Optimizer** — Systems thinker, efficiency-focused
3. **The Networker** — Relationship builder, connector
4. **The Grinder** — Discipline-focused, consistency-driven
5. **The Philosopher** — Meaning-seeker, introspective
6. **The Integrator** — Balanced, holistically developed

### The 5 Pillars

Core areas of transformation:

| Pillar | ID | Color | Description |
|--------|----|-------|-------------|
| Identity & Purpose | `identity` | koppar | Values, purpose, life direction |
| Emotional & Mental | `emotional` | oliv | Stress resilience, emotional regulation |
| Physical & Vital | `physical` | jordbrun | Sleep, nutrition, performance |
| Connection & Leadership | `connection` | charcoal | Relationships, leadership presence |
| Mission & Mastery | `mission` | koppar | Flow states, deliberate practice |

### KPI Types

Tracked metrics, split into two categories:

- **Action KPIs:** protocol_completion, habit_streak, session_attendance, circle_participation, connection_activities
- **Biological KPIs:** sleep_hours, sleep_quality, hrv, stress_level, energy_level, weight, exercise_frequency, nutrition_score

### Subscription Tiers

| Tier | Access Level |
|------|-------------|
| Free/Guest | Public pages, assessment |
| Member | Community, feed, connections, shop |
| Coaching | All above + transformation tracking (goals, protocols, KPIs, etc.) |

### Interest Categories (20)

Strength & Combat Sports, Outdoor Adventures, Endurance Sports, Water Sports, Golf & Racquet Sports, Cars & Racing, Motorcycles & Aviation, Entrepreneurship & Startups, Investing, Leadership & Career, Building & Making, Cooking & Food Culture, Photography & Content Creation, Reading & Philosophy, Music & Arts, Gaming & Strategy, Fatherhood & Family, Travel & Exploration, Spirits & Socializing, Biohacking & Performance

---

## Navigation System

### Section-Based Navigation

Navigation is organized into 6 sections, defined in `src/components/layout/sectionNav.ts`:

| Section | Label | Base Path | Pages |
|---------|-------|-----------|-------|
| `dashboard` | The Hub | `/` | Hub only |
| `growth` | My Plan | `/goals` | Assessment, Goals, Protocols, Actions, Milestones, KPIs, Accountability |
| `community` | Community | `/feed` | Feed, Messages, Connections, Network, Circles, Groups |
| `coaching` | Coaching & Experts | `/experts` | Experts, Book Session, Sessions, Notes, Materials, Events |
| `programs` | Programs | `/programs` | Programs, Sprints, Reviews |
| `shop` | Shop | `/shop` | Browse, Protocols, Circles, Upgrade |

### Layout Components

- **Desktop:** `GlassSidebar` (left) shows section icons; `SectionTopBar` shows tabs/stepper for the active section
- **Mobile:** `MobileHeader` (top) + `MobileBottomNav` (bottom) for section switching

The `MainLayout` component orchestrates the responsive layout automatically. Most protected pages wrap their content in `<MainLayout>`.

---

## Environment & Deployment

### Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_API_URL` | Go backend URL | `http://localhost:3001` (dev) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe public key | `pk_test_...` |
| `VITE_BUG_REPORT_API_URL` | Bug report endpoint | `https://api.claimn.co/api/v2/public/bugs/report` |

**Note:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` exist in `.env.example` as legacy entries but are **not used** by the frontend. The backend handles all database access via the Go API. Authentication is handled by a self-hosted GoTrue instance behind the Go API.

### API URL Auto-Detection

The API base URL is determined automatically in `src/lib/auth.ts`:

1. If `VITE_API_URL` env var is set → use it
2. If hostname is `members.claimn.co` → `https://api.claimn.co`
3. Fallback → `http://localhost:3001`

### Vercel Deployment

Configured via `vercel.json`:

- **Font headers:** Proper MIME type, 1-year immutable cache, CORS for `.ttf` files
- **SPA rewrite:** All non-file routes → `index.html` (enables client-side routing)

### Build Process

```
npm run build
  → tsc -b          (TypeScript type check — must pass with zero errors)
  → vite build      (production bundle in dist/)
```

Vercel auto-deploys on push to `master`.

---

## Common Patterns

### Creating a New Page

```tsx
// src/pages/MyNewPage.tsx
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard } from '../components/ui/GlassCard'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useMyData } from '../lib/api/hooks'
import { safeArray } from '../lib/api/client'

export default function MyNewPage() {
  const { data, isLoading } = useMyData()

  if (isLoading) return <MainLayout><LoadingSpinner /></MainLayout>

  const items = safeArray(data)

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-display text-kalkvit">My Page</h1>
        {items.map(item => (
          <GlassCard key={item.id}>
            {/* content */}
          </GlassCard>
        ))}
      </div>
    </MainLayout>
  )
}
```

### Creating a New API Hook

```tsx
// src/lib/api/hooks/useMyFeature.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, safeArray } from '../client'
import type { MyEntity } from '../types'

export function useMyFeatures() {
  return useQuery({
    queryKey: ['my-features'],
    queryFn: async () => {
      const data = await api.get('/members/my-features')
      return safeArray<MyEntity>(data)
    },
  })
}

export function useCreateMyFeature() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<MyEntity>) =>
      api.post('/members/my-features', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-features'] }),
  })
}
```

### Form Pattern (React Hook Form + Zod)

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1, 'Required'),
  pillar: z.enum(['identity', 'emotional', 'physical', 'connection', 'mission']),
})

type FormData = z.infer<typeof schema>

function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data: FormData) => { /* mutation.mutate(data) */ }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <GlassInput {...register('title')} error={errors.title?.message} />
      <GlassButton type="submit">Save</GlassButton>
    </form>
  )
}
```

### Debug: Inspecting API Errors

In the browser console:
```js
// See all API errors from this session
window.__apiErrors

// Enable response shape logging on production
localStorage.setItem('api_debug', '1')
```

---

## Gotchas & Hard-Won Lessons

### NEVER GUESS

Always check the actual source: Go API handlers, OpenAPI spec (`api.claimn.co/api/docs`), or `server-infra/claimn-api/` code. This has burned us multiple times.

### Font Loading (took 10+ failed attempts)

The correct setup:
1. Font file: `public/fonts/Neutraface_2.ttf`
2. Font name MUST be exactly `'Neutraface 2 Display'` (embedded in the TTF)
3. Import `fonts.css` BEFORE `index.css` in `main.tsx`
4. `vercel.json` must have headers for font MIME type + CORS

**What DOESN'T work:**
- Font in `src/assets/fonts/` with Vite import (fails in production)
- Dynamic JS font injection (unreliable)
- External font URLs (CORS issues)
- Wrong font-family names (`'Neutraface 2'`, `'Neutraface 2 Display Bold'`)
- Missing quotes around font names with spaces in Tailwind config

### Go Backend Trailing Slashes

The Go backend returns **404 on trailing slashes**. The API client strips them automatically, but be aware if making direct fetch calls.

### Database Table Names

| Wrong | Correct |
|-------|---------|
| `members` | `member_profiles` |
| `id` column | `user_id` (primary key) |
| `full_name` | `display_name` |
| `phone` | `whatsapp_number` |
| `location` | `city` + `country` (separate columns) |
| `pillar_focus: string` | `pillar_focus: string[]` (it's an ARRAY) |

### Stale Chunk Errors After Deploys

Handled automatically by `lazyWithRetry()` in `App.tsx`. When a deploy changes chunk hashes, users with cached pages get an auto-reload (once per session per route, to prevent loops).

### CSS Variable Order

The Google Fonts `@import` MUST be the first line in `index.css`, before any Tailwind imports. `fonts.css` must import before `index.css` in `main.tsx`.

### Admin Users and Tier Paywall

Admin and superadmin users bypass tier requirements automatically via `hasAccess()` in AuthContext and `RequireTier` component.

### No Direct Database Access

The Web DB was migrated from Supabase Cloud to local PostgreSQL (Feb 2026). The frontend has **zero Supabase client dependencies** — no `@supabase/supabase-js`, no direct PostgREST queries, no Realtime subscriptions, no Supabase Storage calls. All data access goes through the Go API (`api.claimn.co`). Never add direct database access to this codebase.

### Glass Opacity — Edit the Utility Classes

Glass morphism opacity is controlled by `glass-base`, `glass-elevated`, and `glass-dropdown` utility classes in `src/index.css` (`@layer utilities`). To change opacity, edit the `background-color: rgba(...)` values there. Do NOT use inline styles, media query overrides, or targeted class overrides — they conflict with Tailwind CSS v4's cascade layer system.

---

## Database & Backend Infrastructure

### Architecture (as of Feb 2026)

The backend has been **fully migrated from Supabase Cloud to a self-hosted stack**:

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Database** | PostgreSQL 16 (local) | All data storage (100+ tables) |
| **API Gateway** | PostgREST | Database REST API (used internally by Go API) |
| **Auth** | GoTrue (self-hosted) | Authentication, JWT issuance |
| **File Storage** | MinIO | Avatar uploads, media files |
| **API Server** | Go (custom) | Primary API at `api.claimn.co` |

**The frontend does NOT access any of these directly.** All data access goes through the Go API (`/api/v2/*`). There is no Supabase JS client, no direct PostgREST queries, no Realtime subscriptions, and no Supabase Storage calls.

### `member_profiles` Table

```sql
user_id UUID PRIMARY KEY REFERENCES auth.users(id)
display_name TEXT
bio TEXT
archetype TEXT                    -- one of 6 archetypes
pillar_focus TEXT[]                -- ARRAY of pillar IDs
city TEXT
country TEXT
links JSONB                       -- social/professional links
visibility JSONB                  -- field-level visibility settings
avatar_url TEXT
whatsapp_number TEXT
notification_preferences JSONB    -- {"email_notifications": bool, "weekly_digest": bool}
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

### `member_settings` Table

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID UNIQUE REFERENCES auth.users(id)
assessment_sharing_consent BOOLEAN DEFAULT true
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

### Database Access Rules

1. **All data access goes through the Go API** — never bypass it
2. **No direct Supabase/PostgREST queries** from the frontend
3. **No Supabase Realtime** — use polling via React Query if live updates are needed
4. **No Supabase Storage** — file uploads go through Go API endpoints (e.g., `POST /api/v2/members/avatar`)
5. **API documentation** is available at `https://api.claimn.co/api/docs` (Swagger UI)

---

## Reference Locations

### Backend API Documentation

- **Swagger UI:** `https://api.claimn.co/api/docs`
- **OpenAPI Spec:** `server-infra/claimn-api/handlers/docs/static/openapi.yaml`
- **Go Handlers:** `server-infra/claimn-api/handlers/v2/members/` (profile, feed, goals, etc.)
- **Backend START_HERE:** `server-infra/claimn-api/START_HERE.md`

### Migration & Design Docs (in claimn-web — historical reference)

```
/claimn-web/docs/migration 2.0/
├── Glass Component Kit 2.tsx           # Design reference (CRITICAL)
├── MEMBERS_SPA_COMPLETE_PLAN.md        # Full implementation plan
├── MEMBERS_SPA_GAP_ANALYSIS.md         # Data structure corrections
├── MEMBERS_SPA_STATUS_REPORT.md        # Status report
```

### Audit & Status Docs (in claimn-web root — historical reference)

```
/claimn-web/
├── 260202-CLAIMN-MEMBERS-SPA-AUDIT.md  # Full codebase audit
├── 260129_MEMBERS_SPA_FULL_AUDIT_AND_FIX_PLAN.md
├── 260202_2300_MEMBERS_NAV_AUDIT.md    # Navigation audit
```

### Database Migrations (LEGACY — migrated to local PostgreSQL)

The database was originally managed via Supabase Cloud with migrations in `claimn-web/supabase/migrations/`. As of Feb 2026, the database runs on a self-hosted PostgreSQL 16 instance. Schema changes are now handled via the backend agent (write to `server-infra/AGENT_PROMPT.md`).

---

*Compiled from members-spa development, audit reports, and codebase analysis. Updated Feb 2026 to reflect migration from Supabase Cloud to self-hosted PostgreSQL + GoTrue + MinIO stack.*
