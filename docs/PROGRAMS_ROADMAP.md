# Programs Section — Full Implementation Roadmap

> Last updated: 2026-02-13

## Overview

The Programs section is designed as a structured cohort-based learning journey. The database and admin backend fully support a rich program experience, but the member-facing frontend only surfaces a fraction of it. This document tracks what's been built, what's in progress, and what remains.

---

## Architecture Summary

```
programs
  ├── program_cohorts (groups going through together)
  ├── program_sprints (sequenced learning blocks)
  │     └── sprint_goals (trackable goals per sprint)
  ├── program_enrollments (user enrollment + progress)
  │     ├── assessment_baseline / midline / final
  │     └── milestones (jsonb)
  ├── program_assessments + questions (baseline/midline/final)
  ├── program_applications (selective admission)
  ├── program_completions (graduation + certificates)
  ├── accountability_groups (trios/pairs)
  │     └── accountability_check_ins (weekly updates)
  ├── member_sprint_progress (per-sprint per-user tracking)
  └── peer_reviews (peer feedback)
```

---

## Current State — What's Built

### Frontend Pages

| Page | Route | Status | Description |
|------|-------|--------|-------------|
| ProgramsPage | `/programs` | Done | Browse/filter programs, see enrolled stats, search |
| ProgramDetailPage | `/programs/:id` | Done | View objectives, prerequisites, sprints, enroll |
| ProgramsSprintsPage | `/programs/sprints` | Done | Browse all sprints, filter by status, join sprints |
| ProgramsReviewsPage | `/programs/reviews` | Done | Give/receive peer reviews with ratings |

### Frontend Hooks (all working)

| Hook | Endpoint | Status |
|------|----------|--------|
| `usePrograms()` | `GET /members/programs` | Done |
| `useProgram(id)` | `GET /members/programs/{id}` | Done |
| `useEnrolledPrograms()` | `GET /members/programs/enrolled` | Done |
| `useEnrollProgram()` | `POST /members/programs/enroll` | Done |
| `useUpdateProgramProgress()` | `PUT /members/programs/{id}/progress` | Done (unused in UI) |
| `useSprints(programId?)` | `GET /members/programs/sprints` | Done |
| `useSprint(id)` | `GET /members/programs/sprints/{id}` | Done |
| `useJoinSprint()` | `POST /members/programs/sprints/join` | Done |
| `usePeerReviews()` | `GET /members/programs/reviews` | Done |
| `usePeerReview(id)` | `GET /members/programs/reviews/{id}` | Done |
| `useSubmitPeerReview()` | `PUT /members/programs/reviews/{id}` | Done |

### Backend Member Endpoints (all exist)

| Method | Endpoint | Status |
|--------|----------|--------|
| GET | `/members/programs` | Done |
| GET | `/members/programs/{id}` | Done |
| GET | `/members/programs/enrolled` | Done |
| POST | `/members/programs/enroll` | Done |
| PUT | `/members/programs/{id}/progress` | Done |
| GET | `/members/programs/sprints` | Done |
| GET | `/members/programs/{id}/sprints` | Done |
| GET | `/members/programs/sprints/{id}` | Done |
| POST | `/members/programs/sprints/join` | Done |
| GET | `/members/programs/reviews` | Done |
| GET | `/members/programs/reviews/{id}` | Done |
| PUT | `/members/programs/reviews/{id}` | Done |

### What Was Done Recently

- [x] Extended `Program` type with `objectives`, `prerequisites`, `tier`, `duration_months`
- [x] Created `ProgramDetailPage.tsx` with Overview tab (objectives, prerequisites, structure stats) and Sprints tab
- [x] Added `/programs/:id` route to App.tsx
- [x] Updated ProgramsPage cards to link to detail page instead of dead-end routes
- [x] Removed enrollment from catalog (moved to detail page where users can read about the program first)
- [x] Cleaned up unused enrollment code from ProgramsPage

---

## Phase 1 — Sprint Progress Tracking

**Goal:** Let users track their progress through individual sprints with goal completion.

### What the DB supports

- `member_sprint_progress`: status, progress_percentage, goals_completed, total_goals, started_at, completed_at, notes
- `sprint_goals`: title, description, category, target_metric, is_required, sequence_order

### Backend needed

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/members/programs/sprints/{id}/progress` | Get user's progress for a sprint |
| PUT | `/members/programs/sprints/{id}/progress` | Update sprint progress (mark goals complete) |
| GET | `/members/programs/sprints/{id}/goals` | Get goals for a sprint |
| PUT | `/members/programs/sprints/{id}/goals/{goalId}/complete` | Mark a goal as complete |

### Frontend work

- [x] Add `SprintDetailPage` at `/programs/sprints/:id`
  - Show sprint info, focus area, duration
  - List sprint goals with checkboxes (trackable)
  - Progress bar based on goals_completed / total_goals
  - Notes field for sprint reflections
- [x] Add hooks: `useSprintProgress()`, `useSprintGoals()`, `useUpdateSprintProgress()`, `useCompleteSprintGoal()`
- [x] Add types: `SprintGoal`, `MemberSprintProgress`
- [x] Update `ProgramDetailPage` sprint cards to link to sprint detail
- [x] Update `ProgramsSprintsPage` "View Progress" button to link to sprint detail
- [x] Add route `/programs/sprints/:id` to App.tsx

### Progress

- [x] Backend endpoints created
- [x] Frontend types added
- [x] Frontend hooks added
- [x] SprintDetailPage created
- [x] Routes and navigation updated
- [ ] Tested end-to-end

---

## Phase 2 — Program Assessments

**Goal:** Let users take assessments at baseline, midline, and final stages of their program enrollment.

### What the DB supports

- `program_assessments`: name, type (baseline|midline|final|custom), program_id, week_number, is_required, question_ids, total_possible_score, passing_score
- `program_assessment_questions`: text, question_type, category, options, scale_min/max, scoring_config, weight
- `program_assessment_results`: (linked from enrollment via baseline_result_id, midline_result_id, final_result_id)
- `program_enrollments`: assessment_baseline, assessment_midline, assessment_final (jsonb snapshots)

### Backend needed

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/members/programs/{id}/assessments` | Get available assessments for enrolled program |
| GET | `/members/programs/assessments/{id}` | Get assessment with questions |
| POST | `/members/programs/assessments/{id}/submit` | Submit assessment answers |
| GET | `/members/programs/{id}/assessment-results` | Get user's assessment results (baseline/midline/final) |

### Frontend work

- [x] Add `ProgramAssessmentPage` at `/programs/:id/assessment/:assessmentId`
  - Show assessment questions (scale, multiple choice, text, boolean)
  - Submit answers
  - Show results with scores and pass/fail
- [x] Add assessment progress indicator to `ProgramDetailPage`
  - Show which assessments are completed (baseline/midline/final)
  - Link to take next assessment
  - Assessments tab with progress bar and per-assessment cards
- [x] Add hooks: `useProgramAssessments()`, `useProgramAssessment()`, `useSubmitProgramAssessment()`, `useProgramAssessmentResults()`
- [x] Add types: `ProgramAssessment`, `ProgramAssessmentQuestion`, `ProgramAssessmentResult`, `ProgramAssessmentOption`, `SubmitProgramAssessmentRequest`

### Progress

- [x] Backend endpoints created
- [x] Frontend types added
- [x] Frontend hooks added
- [x] ProgramAssessmentPage created
- [x] Assessment indicators on ProgramDetailPage
- [ ] Tested end-to-end

---

## Phase 3 — Cohorts

**Goal:** Show users their cohort (group going through a program together) with fellow members.

### What the DB supports

- `program_cohorts`: name, description, status (planned|active|completed|archived), start_date, end_date, max_participants
- `program_cohort_members`: cohort_id, member_id, joined_at

### Backend needed

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/members/programs/{id}/cohort` | Get user's cohort for this program (with members) |

### Frontend work

- [x] Add Cohort tab to `ProgramDetailPage`
  - Show cohort name, description, date range
  - List cohort members with avatars
  - Show member count and max capacity
- [x] Add hook: `useProgramCohort(programId)`
- [x] Add types: `ProgramCohort`, `ProgramCohortMember`

### Progress

- [x] Backend endpoint enriched
- [x] Frontend types added
- [x] Frontend hook added
- [x] Cohort UI on ProgramDetailPage
- [ ] Tested end-to-end

---

## Phase 4 — Accountability Groups

**Goal:** Let users see their accountability group (trio/pair) and submit weekly check-ins.

### What the DB supports

- `accountability_groups`: name, group_type (trio|pair|small_group), max_members, facilitator_id, communication_channel, meeting_schedule
- `accountability_group_members`: group_id, member_id
- `accountability_check_ins`: progress_update, challenges, support_needed, commitments_for_next, week_rating (1-5), check_in_date

### Backend needed

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/members/programs/{id}/accountability` | Get user's accountability group for this program |
| GET | `/members/accountability/{groupId}/check-ins` | Get check-in history for the group |
| POST | `/members/accountability/{groupId}/check-ins` | Submit a weekly check-in |

### Frontend work

- [x] Add Accountability tab to `ProgramDetailPage`
  - Show group info (name, type, meeting schedule, communication channel)
  - Show group members with avatars (highlights current user)
  - Display recent check-ins from group members with star ratings
- [x] Add check-in form inline on Accountability tab
  - Fields: progress_update, challenges, support_needed, commitments_for_next, week_rating (1-5 star scale)
  - Submit check-in with success confirmation
- [x] Extend existing hooks: `useGroupCheckIns()` added, `useCreateCheckIn()` updated
- [x] Extend existing types: `AccountabilityGroup` and `AccountabilityMember` enriched with backend fields

### Progress

- [x] Backend endpoints already exist (`/members/accountability/my`, `/members/accountability/{id}`, `/members/accountability/groups/{id}/check-ins`)
- [x] Frontend types extended
- [x] Frontend hooks extended
- [x] Accountability UI on ProgramDetailPage
- [x] Check-in form component
- [ ] Tested end-to-end

---

## Phase 5 — Program Completions & Certificates

**Goal:** Surface program completion status, final scores, and certificate downloads.

### What the DB supports

- `program_completions`: completed_at, certificate_url, final_score, notes
- `program_enrollments.status`: 'active' | 'completed' | 'paused' | 'cancelled'

### Backend

Endpoint already exists: `GET /members/programs/completions?program_id={id}` — returns completion records with `final_score`, `certificate_url`, `completed_at`, `notes`.

### Frontend work

- [x] Add completion state to `ProgramDetailPage`
  - Congratulations banner with completion date and final score
  - Download certificate button (opens `certificate_url` in new tab)
  - "Completed" badge replaces "Enrolled" badge
  - "Review Material" button replaces "Continue Learning"
  - Progress bar hidden when completed
- [x] Add completion badge to `ProgramsPage` cards for completed programs
  - Trophy icon with "Completed" koppar badge
  - "View Certificate" button replaces "Continue Learning"
  - Progress bar hidden when completed
- [x] Add hook: `useProgramCompletion(programId)`
- [x] Add type: `ProgramCompletion`

### Progress

- [x] Backend endpoint already exists (`/members/programs/completions`)
- [x] Frontend types added
- [x] Frontend hook added
- [x] Completion UI on ProgramDetailPage
- [x] Completion badge on ProgramsPage
- [ ] Tested end-to-end

---

## Phase 6 — Program Applications

**Goal:** Let users apply to selective programs that require approval.

### What the DB supports

- `program_applications`: status (pending|accepted|rejected|waitlisted|withdrawn), motivation, answers (jsonb), submitted_at, reviewed_at, review_notes

### Backend endpoints (already exist)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/members/programs/applications?program_id={id}` | Get user's application for a program |
| POST | `/members/programs/applications` | Submit application (program_id, motivation, answers) |

### Backend needed (AGENT_PROMPT written)

| Change | Purpose |
|--------|---------|
| Add `requires_application` boolean to `programs` table + Program struct | Frontend needs to know which programs require applications |
| Fix Forge application flow | The Forge uses a separate public endpoint that bypasses the standard application system |

### Frontend work

- [x] Add application flow to `ProgramDetailPage`
  - If program requires application: show "Apply" button instead of "Enroll"
  - Application form: motivation text
  - Show application status (pending, accepted, rejected, waitlisted)
  - If accepted: show "Enroll Now" button
- [x] Add "By Application" badge on `ProgramsPage` cards for programs that require application
- [x] Add hooks: `useProgramApplication()`, `useSubmitApplication()`
- [x] Add types: `ProgramApplication`, `CreateApplicationRequest`
- [x] Add `requires_application` field to `Program` type

### Issues Found

- **The Forge** has a separate public application endpoint (`POST /api/v2/public/forge-application`) that bypasses the standard application system. Applications made via claimn-web's Forge form are NOT linked to member accounts and don't show in the members portal. This needs to be fixed — The Forge should use the same `POST /members/programs/applications` endpoint as every other program.

### Progress

- [x] Backend endpoints already exist (`GET /members/programs/applications`, `POST /members/programs/applications`)
- [x] Backend: `requires_application` column + struct field added
- [x] Frontend types added
- [x] Frontend hooks added
- [x] Application UI on ProgramDetailPage
- [ ] Tested end-to-end

---

## Phase 7 — Enhanced Program Detail Page

**Goal:** Bring all phases together into a polished program detail experience.

### Frontend work

- [ ] Redesign `ProgramDetailPage` tabs to include all sections:
  - Overview (objectives, prerequisites, structure) — **Done**
  - Sprints (with progress tracking) — Phase 1
  - My Progress (assessment results, milestones, completion)
  - Community (cohort members, accountability group, check-ins)
- [ ] Add program timeline visualization
  - Show months 1-12 with current position
  - Mark assessment points (baseline, midline, final)
  - Show sprint sequence
- [ ] Add progress dashboard to enrolled programs on `ProgramsPage`
  - Sprint completion count
  - Next upcoming assessment
  - Days until next check-in

### Progress

- [ ] Tab redesign
- [ ] Timeline visualization
- [ ] Progress dashboard on ProgramsPage
- [ ] Tested end-to-end

---

## Summary — Overall Progress

| Phase | Description | Backend | Frontend | Status |
|-------|-------------|---------|----------|--------|
| 0 | Program Detail Page | Done | Done | **Complete** |
| 1 | Sprint Progress Tracking | Done | Done | **Testing** |
| 2 | Program Assessments | Done | Done | **Testing** |
| 3 | Cohorts | Done | Done | **Testing** |
| 4 | Accountability Groups | Done (existing) | Done | **Testing** |
| 5 | Completions & Certificates | Done (existing) | Done | **Testing** |
| 6 | Program Applications | Done | Done | **Testing** |
| 7 | Enhanced Detail Page | N/A | Not started | Planned |

### Existing Backend (Admin-only, no member endpoints yet)

The admin backend already fully supports all of the above. These admin endpoints exist:

| Resource | Admin Endpoints | Member Endpoints |
|----------|----------------|-----------------|
| Programs | CRUD | List, Detail, Enroll |
| Cohorts | CRUD + Members | **Missing** |
| Sprints | CRUD + Participants | List, Detail, Join |
| Sprint Goals | Via sprint data | **Missing** |
| Sprint Progress | Via sprint data | **Missing** |
| Assessments | CRUD + Questions | **Missing** |
| Applications | List + Review | **Missing** |
| Accountability | CRUD + Members | **Missing** |
| Completions | List | **Missing** |

### Recommended Priority

1. **Phase 1 (Sprint Progress)** — Highest impact. Users can already join sprints but can't track progress. This makes the learning journey functional.
2. **Phase 4 (Accountability)** — High engagement. Weekly check-ins drive habit formation and community connection.
3. **Phase 2 (Assessments)** — Measures transformation. Baseline/midline/final shows users their growth.
4. **Phase 3 (Cohorts)** — Social proof. Seeing fellow members builds belonging.
5. **Phase 5 (Completions)** — Reward/recognition. Certificates are motivating but depend on earlier phases.
6. **Phase 6 (Applications)** — Only needed for selective programs. Lower priority.
7. **Phase 7 (Enhanced UI)** — Polish. Depends on all other phases.

---

## Notes

- All admin endpoints exist in `server-infra/claimn-api/handlers/v2/admin/`
- Member endpoints need to be added to `server-infra/claimn-api/handlers/v2/members/programs_handlers.go`
- Frontend hooks follow the pattern in `src/lib/api/hooks/usePrograms.ts`
- All new pages should use `lazyWithRetry()` in App.tsx and be wrapped in `<Protected>`
- DB tables and RLS policies already exist — no migrations needed
