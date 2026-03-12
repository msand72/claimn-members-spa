# CLAIM'N Members Portal — Product Summary

*Last updated: 2026-02-21*

---

## Overview

The CLAIM'N Members Portal is a full-featured React 19 single-page application serving as the digital backbone of the CLAIM'N men's transformation platform. Members use it to track their personal growth across five life pillars, participate in a private community, work with coaches and experts, follow structured protocols, and measure progress through data-driven assessments.

**Production:** `https://members.claimn.co`
**Backend:** Go API at `https://api.claimn.co` (87+ endpoints)

---

## Platform at a Glance

| Metric | Count |
|--------|------:|
| Routes | 57 |
| Pages | 55 |
| API hook modules | 28 |
| Glass UI components | 14 |
| Feature components | 42 |
| Context providers | 3 |

---

## Core Capabilities

### 1. Personality Assessment & Archetype Profiling

A 30-question assessment built on Big Five personality science (1–7 Likert scale) that maps members to one of six archetypes:

- **The Achiever** — Goal-oriented, results-driven
- **The Optimizer** — Systems thinker, efficiency-focused
- **The Networker** — Relationship builder, connector
- **The Grinder** — Discipline-focused, consistency-driven
- **The Philosopher** — Meaning-seeker, introspective
- **The Integrator** — Balanced, holistically developed

The scoring engine uses z-score normalization and cosine similarity matching to determine primary and secondary archetypes, pillar scores (5 pillars, 0–7 scale), a consistency/reliability metric, and personalized micro-insights and integration insights. Scoring runs server-side with a client-side fallback.

Members can take the assessment during onboarding or retake it at any time to track personality evolution.

### 2. Printable Assessment Report

A multi-page PDF-ready report generated entirely client-side, containing:

- **Cover page** — Archetype name, match percentage, secondary archetype, full description
- **Strengths & blind spots** — Parsed from archetype-specific content
- **Pillar scores** — All five pillars displayed as progress bars with level classifications
- **Archetype rankings** — All six archetypes scored and ranked
- **Consistency score** — Response reliability metric
- **Integration insights** — Cross-pillar analysis
- **Action plan** — Prioritized recommendations (high/medium/low)

### 3. Transformation Tracking (Premium)

Members on the Coaching tier get access to a full transformation management suite:

- **Goals** — Create, track, and complete goals tied to specific pillars
- **Action items** — Granular task tracking linked to goals
- **Protocols** — Structured multi-step programs with enrollment and progress tracking
- **KPIs** — Track both action metrics (habit streaks, session attendance, protocol completion) and biological metrics (sleep, HRV, stress, energy, weight, nutrition). Supports bidirectional targets (increase or decrease).
- **Milestones** — Major achievement tracking along the transformation journey
- **Accountability** — Group accountability with check-ins

### 4. Coaching & Expert Network

- **Expert directory** — Browse and view expert profiles
- **Session booking** — Calendar-based booking for coaching sessions
- **Session history & notes** — Track past sessions with attached notes
- **Quarterly reviews** — Structured reviews with star ratings and coach feedback
- **Coaching resources** — Curated materials from coaches
- **Ask Expert** — Floating CTA available across the app for quick expert consultation

### 5. Programs & Sprints

- **Program enrollment** — Browse and join structured programs
- **Program detail** — View sprints, cohort members, assessments, and accountability check-ins
- **Sprint tracking** — Individual sprint goals with status tracking and detail pages
- **Program assessments** — Scale-based questionnaires tied to program stages
- **Program reviews** — Review and reflect on completed programs

### 6. Community

- **Feed** — Community post feed with engagement
- **Direct messaging** — Private member-to-member messaging
- **Connections** — Send, accept, and manage connection requests
- **Member network** — Searchable member directory
- **Circles** — Group-based communities with detail views
- **Interest groups** — 20 interest categories (from Strength & Combat Sports to Biohacking & Performance)

### 7. Shop & Subscriptions

- **Protocol marketplace** — Browse and purchase protocols
- **Circle marketplace** — Browse and join paid circles
- **Tier upgrades** — Upgrade subscription tier in-app
- **Billing management** — View and manage subscription, payment history
- **Stripe integration** — Secure payment processing

### 8. Events

- **Events calendar** — Browse upcoming events
- **Event detail** — View event info, RSVP, and details

### 9. Notifications

- **Notification center** — Typed notifications (goal, KPI, protocol, message, session, etc.) with contextual icons and read/unread state

### 10. Onboarding Flow

A guided 5-step onboarding sequence for new members:

1. **Welcome** — Platform introduction and archetype overview
2. **Assessment** — 30-question personality assessment
3. **Results** — Archetype reveal with pillar scores
4. **Challenge** — 7-day introductory challenge
5. **Path** — Choose a transformation path

### 11. Smart Prompts (Journey System)

Contextual, priority-based prompts that surface relevant next actions for members:

- Priority levels (high/medium/low) with distinct visual treatment
- Dismissible with 24-hour localStorage persistence
- Integrated into the Journey Widget alongside active protocol cards, recommended protocols, and a progress timeline

### 12. In-App Bug Reporting

A full error tracking and reporting system:

- Captures unhandled errors (ErrorBoundary, window.onerror, unhandled rejections)
- Records user action history (clicks, navigation, input, form submissions, API errors)
- Collects browser fingerprint (UA, viewport, language, platform, timezone)
- Screenshot capture via html2canvas
- User description field for context
- Submits structured reports to backend API

---

## Technical Architecture

### Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript 5.9 (strict) |
| Build | Vite 7.2 |
| Routing | React Router 7.13 (57 routes, lazy-loaded) |
| Server state | TanStack React Query 5.90 |
| Styling | Tailwind CSS 4.1 + custom Glass morphism system |
| Forms | React Hook Form 7.71 + Zod 4.3 |
| UI primitives | Radix UI (dialog, dropdown, tabs, tooltip) |
| Charts | Recharts 3.7 |
| Animation | Framer Motion 12.29 |
| Deployment | Vercel (auto-deploy on push to master) |

### Design System — Glass UI

A custom glassmorphism component library with 14 reusable components (GlassCard, GlassButton, GlassInput, GlassModal, GlassDropdown, GlassTabs, GlassTable, GlassMultiSelect, GlassBadge, GlassAlert, GlassAvatar, GlassStatsCard, BackgroundPattern, ThemeToggle).

Dark and light themes with automatic color adaptation. Brand typography using Neutraface 2 Display (hero), Playfair Display (headings), and Lato (body).

### Access Control

Three-layer protection:

| Layer | Mechanism | Scope |
|-------|-----------|-------|
| Authentication | ProtectedRoute + AuthContext | All non-public pages |
| Role-based | RequireUserType | Expert/admin-specific views |
| Subscription tier | RequireTier / PremiumProtected | Transformation tracking features |

Admin and superadmin users bypass all tier restrictions.

### Error Resilience

- **Three-tier error boundaries** — Global, route-level, and page-level
- **Stale chunk recovery** — `lazyWithRetry()` auto-reloads once per session on deploy-caused chunk errors
- **Mutation error toasts** — Global toast notifications for failed API mutations
- **Smart retry logic** — React Query skips retries on 4xx, retries 5xx once

### Backend Integration

All data flows through a Go API (`api.claimn.co`) via 28 React Query hook modules. No direct database access — the frontend has zero Supabase client dependencies. The backend runs on self-hosted PostgreSQL 16, GoTrue (auth), and MinIO (file storage).

---

## Feature Areas by Route Count

| Area | Routes | Tier |
|------|-------:|------|
| Authentication & onboarding | 8 | Public / Auth |
| Core (hub, profile, billing, resources) | 4 | Auth |
| Community (feed, messages, connections, circles, network, groups) | 7 | Auth |
| Shop & subscriptions | 6 | Auth |
| Coaching & experts | 8 | Auth |
| Events | 2 | Auth |
| Programs & sprints | 5 | Auth |
| Assessment | 3 | Auth |
| Transformation tracking (goals, protocols, KPIs, milestones, accountability) | 9 | Premium |
| Notifications | 1 | Auth |
| Other (interest groups, action items) | 4 | Auth / Premium |

---

## What's In Progress

- **Journal system** — API hooks fully wired (create, read, update, delete, list with pagination) but no frontend page yet. Backend-ready, awaiting UI build.
