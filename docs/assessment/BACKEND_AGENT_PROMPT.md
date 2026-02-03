# Backend Agent Prompt: CLAIM'N Assessment System Implementation

> This document is a self-contained prompt for a backend developer/agent working on a separate on-prem machine. It contains everything needed to implement the assessment scoring engine and fix the API endpoints in the Go backend (`claimn-api`).

---

## Project Context

CLAIM'N has a personality assessment tool that determines a user's archetype (Achiever, Optimizer, Networker, Grinder, Philosopher) and scores them across 5 life pillars (Identity, Emotional, Physical, Connection, Mission). The assessment was originally built in PHP/WordPress, then ported to a Next.js app (`claimn-web`). Now it needs to work through a Go API backend (`claimn-api`) serving a React SPA (`claimn-members-spa`).

**The database is the SINGLE SOURCE OF TRUTH.** All table schemas, content, and data shapes described here come from the actual Supabase database.

---

## Your Task

Rewrite the assessment handlers in the Go backend to:

1. **Fix the questions endpoint** — currently queries the WRONG tables (`assessment_questions`) instead of the correct `questions` + `question_options` tables
2. **Port the scoring engine** from TypeScript to Go — the full calculation and insight generation logic
3. **Fix the submit endpoint** — accept structured responses, run server-side scoring, save results with correct JSONB shapes
4. **Fix the results endpoints** — return data matching the actual `assessment_results` table shape
5. **Add a content endpoint** — expose the `content` table for frontend report rendering

---

## Go Backend Architecture & Patterns

### File Location
`handlers/v2/members/assessments_handlers.go`

### Handler Pattern
```go
package members

import (
    "encoding/json"
    "fmt"
    "net/http"
    "time"
    "math"

    "github.com/gorilla/mux"
    "github.com/msand72/claimn-api-v2/infrastructure/database"
    "github.com/msand72/claimn-api-v2/middleware"
    "github.com/msand72/claimn-api-v2/pkg/pagination"
)

type AssessmentsHandlers struct {
    dbClients *database.DatabaseClients
}

func NewAssessmentsHandlers(dbClients *database.DatabaseClients) *AssessmentsHandlers {
    return &AssessmentsHandlers{dbClients: dbClients}
}
```

### Database Client Methods
The DB client uses Supabase PostgREST HTTP API. Available methods:

```go
// SELECT — returns []map[string]interface{}
data, err := h.dbClients.Web.Query(ctx, "table_name", map[string]string{
    "select": "*",
    "column":  "eq.value",       // equals filter
    "order":   "sort_order.asc", // ordering
    "limit":   "100",
})

// INSERT — returns map[string]interface{} (the created record)
result, err := h.dbClients.Web.Insert(ctx, "table_name", map[string]interface{}{
    "column1": "value1",
    "column2": 42,
})

// UPDATE — returns error only
err := h.dbClients.Web.Update(ctx, "table_name",
    map[string]string{"id": "eq.some-uuid"},     // filter
    map[string]interface{}{"column": "new_value"}, // data
)

// DELETE
err := h.dbClients.Web.Delete(ctx, "table_name", map[string]string{"id": "eq.some-uuid"})

// GET BY ID
data, err := h.dbClients.Web.GetByID(ctx, "table_name", "uuid-string")

// COUNT
count, err := h.dbClients.Web.Count(ctx, "table_name", map[string]string{"column": "eq.value"})
```

### Authentication Pattern
Every handler starts with:
```go
user, err := middleware.GetV2UserFromContext(r.Context())
if err != nil {
    respondV2Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated", nil)
    return
}
// user.ID is the Supabase auth.users UUID
```

### Error Response Pattern
```go
respondV2Error(w http.ResponseWriter, status int, code string, message string, details map[string]interface{})
// Codes: "UNAUTHORIZED", "NOT_FOUND", "VALIDATION_ERROR", "INTERNAL_ERROR"
```

### Success Response Pattern
```go
w.Header().Set("Content-Type", "application/json")
w.WriteHeader(http.StatusOK) // or http.StatusCreated
json.NewEncoder(w).Encode(responseData)
```

### Route Registration
In `handlers/routes.go`, inside `SetupMemberV2Routes()`:
```go
assessmentsHandlers := members.NewAssessmentsHandlers(dbClients)

router.HandleFunc("/members/assessments", assessmentsHandlers.GetAssessments).Methods("GET")
router.HandleFunc("/members/assessments/results/latest", assessmentsHandlers.GetLatestResults).Methods("GET")
router.HandleFunc("/members/assessments/content", assessmentsHandlers.GetAssessmentContent).Methods("GET")  // NEW
router.HandleFunc("/members/assessments/{id}", assessmentsHandlers.GetAssessment).Methods("GET")
router.HandleFunc("/members/assessments/{id}/questions", assessmentsHandlers.GetAssessmentQuestions).Methods("GET")
router.HandleFunc("/members/assessments/{id}/results", assessmentsHandlers.GetAssessmentResults).Methods("GET")
router.HandleFunc("/members/assessments/{id}/submit", assessmentsHandlers.SubmitAssessment).Methods("POST")
```

**IMPORTANT:** The `/members/assessments/content` and `/members/assessments/results/latest` routes MUST be registered BEFORE `/members/assessments/{id}` — otherwise gorilla/mux will match "content" and "results" as an `{id}` parameter.

---

## Database Tables (Supabase — Source of Truth)

### `questions` table
```sql
-- The personality assessment questions (archetype + pillar questions)
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
question_text   TEXT              -- The question text shown to users (original column name from seed)
question_key    VARCHAR(255)      -- e.g. "arch_q1", "pillar_identity_1"
question_type   VARCHAR(50)       -- "archetype" or "pillar"
pillar_category VARCHAR(100)      -- For pillar questions: "identity", "emotional", "physical", "connection", "mission"
is_reverse_scored BOOLEAN DEFAULT false
is_active       BOOLEAN DEFAULT true
sort_order      INTEGER DEFAULT 0
created_at      TIMESTAMPTZ DEFAULT NOW()
updated_at      TIMESTAMPTZ DEFAULT NOW()
```

### `question_options` table
```sql
-- Options for each question
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
question_id     UUID REFERENCES questions(id)
option_key      VARCHAR(255)      -- For archetype questions: "achiever", "optimizer", etc.
option_text     TEXT              -- Display text for the option
option_value    INTEGER           -- For pillar Likert: 1-7
sort_order      INTEGER DEFAULT 0
```

### `assessments` table
```sql
-- Assessment catalog (there is typically ONE personality assessment)
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
title           VARCHAR(255)
description     TEXT
category        VARCHAR(100)
type            VARCHAR(50)
question_count  INTEGER
estimated_time  INTEGER
image_url       TEXT
tags            TEXT[]
created_at      TIMESTAMPTZ DEFAULT NOW()
updated_at      TIMESTAMPTZ DEFAULT NOW()
```

### `responses` table
```sql
-- Individual question responses from a user's assessment session
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
assessment_id   UUID              -- References assessments.id
question_id     UUID              -- References questions.id
question_key    VARCHAR(255)      -- Denormalized for easy lookup
response_value  VARCHAR(255)      -- Archetype name OR Likert value as string
created_at      TIMESTAMPTZ DEFAULT NOW()
```

### `assessment_results` table
```sql
-- Computed results stored as JSONB
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
assessment_id         UUID              -- References assessments.id
user_id               UUID              -- References auth.users(id) — ADD THIS (current code doesn't save it)
primary_archetype     VARCHAR(100)      -- e.g. "optimizer"
secondary_archetype   VARCHAR(100)      -- e.g. "achiever" or empty string
archetype_scores      JSONB             -- {"achiever":2,"optimizer":3,"networker":0,"grinder":1,"philosopher":0}
pillar_scores         JSONB             -- {"identity":{"raw":5.2,"level":"moderate","percentage":74},...}
consistency_score     DECIMAL           -- 0.0 to 1.0
micro_insights        JSONB             -- Array of insight objects
integration_insights  JSONB             -- Array of insight objects
created_at            TIMESTAMPTZ DEFAULT NOW()
```

### `content` table
```sql
-- Content lookup table for report text (all assessment report prose comes from here)
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
content_key     VARCHAR(255) UNIQUE  -- e.g. "optimizer_identity_low", "achiever_strengths"
content_text    TEXT                  -- The actual text content
created_at      TIMESTAMPTZ DEFAULT NOW()
updated_at      TIMESTAMPTZ DEFAULT NOW()
```

**Content key patterns used by the scoring engine:**
- `{archetype}_{pillar}_{level}` — pillar-specific insight (e.g. `optimizer_identity_low`)
- `{primary}_synergy_{highPillar}_{lowPillar}` — gap analysis text
- `{primary}_{secondary}_integration` — dual archetype integration
- `{primary}_integration_single` — single archetype focus
- `{archetype}_title` — archetype display name
- `{archetype}_subtitle` — archetype tagline
- `{archetype}_strengths` — strengths description
- `{archetype}_action_30d` — 30-day action items
- `{archetype}_action_90d` — 90-day action items
- `{archetype}_action_6m` — 6-month action items

---

## Endpoint Specifications

### 1. `GET /members/assessments/{id}/questions`

**Current (BROKEN):** Queries `assessment_questions` table (wrong table).

**Fix:** Query `questions` table joined with `question_options`.

```go
// 1. Verify assessment exists
// 2. Query questions table (is_active = true, ordered by sort_order)
// 3. For each question, query question_options (ordered by sort_order)
// 4. Return structured response
```

**Response shape:**
```json
{
  "questions": [
    {
      "id": "uuid",
      "question_key": "arch_q1",
      "question_text": "When faced with a challenge, you tend to...",
      "question_type": "archetype",
      "sort_order": 1,
      "options": [
        { "id": "uuid", "option_key": "achiever", "option_text": "Set a clear goal and go after it" },
        { "id": "uuid", "option_key": "optimizer", "option_text": "Analyze and find the most efficient approach" },
        { "id": "uuid", "option_key": "networker", "option_text": "Reach out to people who can help" },
        { "id": "uuid", "option_key": "grinder", "option_text": "Put your head down and push through" },
        { "id": "uuid", "option_key": "philosopher", "option_text": "Reflect on the deeper meaning" }
      ]
    },
    {
      "id": "uuid",
      "question_key": "pillar_identity_1",
      "question_text": "I have a clear sense of who I am.",
      "question_type": "pillar",
      "pillar_category": "identity",
      "is_reverse_scored": false,
      "sort_order": 7,
      "options": [
        { "value": 1, "label": "Strongly Disagree" },
        { "value": 2, "label": "Disagree" },
        { "value": 3, "label": "Somewhat Disagree" },
        { "value": 4, "label": "Neutral" },
        { "value": 5, "label": "Somewhat Agree" },
        { "value": 6, "label": "Agree" },
        { "value": 7, "label": "Strongly Agree" }
      ]
    }
  ]
}
```

**Note:** For pillar questions, the 7-point Likert options can be generated server-side (they're always the same 1-7 scale). You don't need to store them in `question_options` — but if they ARE in the table, use them.

### 2. `POST /members/assessments/{id}/submit`

**Current (BROKEN):** Accepts flat `{ answers: [...] }` with client-computed scores, does trivial sum.

**Fix:** Accept structured responses, run full scoring engine server-side.

**Request body:**
```json
{
  "archetypeResponses": [
    { "questionKey": "arch_q1", "archetype": "optimizer" },
    { "questionKey": "arch_q2", "archetype": "achiever" },
    { "questionKey": "arch_q3", "archetype": "optimizer" },
    { "questionKey": "arch_q4", "archetype": "grinder" },
    { "questionKey": "arch_q5", "archetype": "optimizer" },
    { "questionKey": "arch_q6", "archetype": "achiever" }
  ],
  "pillarResponses": [
    { "questionKey": "pillar_identity_1", "pillar": "identity", "value": 5 },
    { "questionKey": "pillar_identity_2", "pillar": "identity", "value": 6 },
    { "questionKey": "pillar_emotional_1", "pillar": "emotional", "value": 3 },
    ...
  ]
}
```

**Processing steps:**
1. Validate assessment exists
2. Get question mappings: `SELECT id, question_key FROM questions`
3. Get content data: `SELECT content_key, content_text FROM content`
4. Create assessment record in `assessments` table (or use existing assessment ID)
5. Save each response to `responses` table
6. **Calculate archetype scores** (count per archetype)
7. **Calculate pillar scores** (average per pillar, 1-7 scale)
8. **Run scoring engine** (consistency, micro insights, integration insights)
9. Save to `assessment_results` with correct JSONB
10. Return results

**Response body:**
```json
{
  "success": true,
  "results": {
    "resultId": "uuid-of-assessment-results-record",
    "assessmentId": "uuid-of-assessment-record",
    "primary": "optimizer",
    "secondary": "achiever",
    "primaryPercentage": 50,
    "secondaryPercentage": 33,
    "archetypeScores": {
      "achiever": 2,
      "optimizer": 3,
      "networker": 0,
      "grinder": 1,
      "philosopher": 0
    },
    "pillarScores": {
      "identity": { "raw": 5.2, "level": "moderate", "percentage": 74 },
      "emotional": { "raw": 3.1, "level": "low", "percentage": 44 },
      "physical": { "raw": 6.0, "level": "high", "percentage": 86 },
      "connection": { "raw": 4.5, "level": "moderate", "percentage": 64 },
      "mission": { "raw": 5.8, "level": "high", "percentage": 83 }
    },
    "consistencyScore": 0.67,
    "microInsights": [ ... ],
    "integrationInsights": [ ... ]
  }
}
```

### 3. `GET /members/assessments/{id}/results`

Return the user's results for a specific assessment. Query `assessment_results` where `assessment_id = {id}` AND `user_id = {authenticated user}`.

**Response:** Return the `assessment_results` row as-is. The JSONB fields (`archetype_scores`, `pillar_scores`, `micro_insights`, `integration_insights`) should be passed through directly — they're already stored in the correct shape.

```json
{
  "id": "result-uuid",
  "assessment_id": "assessment-uuid",
  "user_id": "user-uuid",
  "primary_archetype": "optimizer",
  "secondary_archetype": "achiever",
  "archetype_scores": { "achiever": 2, "optimizer": 3, ... },
  "pillar_scores": { "identity": { "raw": 5.2, "level": "moderate", "percentage": 74 }, ... },
  "consistency_score": 0.67,
  "micro_insights": [ ... ],
  "integration_insights": [ ... ],
  "created_at": "2025-01-15T10:30:00Z"
}
```

### 4. `GET /members/assessments/results/latest`

Return the authenticated user's most recent assessment result. Query `assessment_results` where `user_id = {user}`, order by `created_at desc`, limit 1.

**Response:** Same shape as above (single result object, NOT an array).

### 5. `GET /members/assessments/content` (NEW)

Return the full content lookup table for the frontend to render reports.

```go
func (h *AssessmentsHandlers) GetAssessmentContent(w http.ResponseWriter, r *http.Request) {
    _, err := middleware.GetV2UserFromContext(r.Context())
    if err != nil {
        respondV2Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated", nil)
        return
    }

    contentData, err := h.dbClients.Web.Query(r.Context(), "content", map[string]string{
        "select": "content_key,content_text",
    })
    if err != nil {
        respondV2Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch content", nil)
        return
    }

    contentMap := make(map[string]string)
    for _, item := range contentData {
        if key, ok := item["content_key"].(string); ok {
            if text, ok := item["content_text"].(string); ok {
                contentMap[key] = text
            }
        }
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(contentMap)
}
```

### 6. `GET /members/assessments` (KEEP — minor fix)

Keep the existing paginated list endpoint. It queries the `assessments` table (catalog). No changes needed unless the table doesn't exist yet.

### 7. `GET /members/assessments/{id}` (KEEP — minor fix)

Keep the single assessment detail endpoint. No major changes needed.

---

## Scoring Engine — Port to Go

Port the following TypeScript functions to Go. All algorithms are exact ports from the original PHP.

### Data Structures

```go
// PillarScore represents a scored pillar
type PillarScore struct {
    Raw        float64 `json:"raw"`
    Level      string  `json:"level"`      // "low", "moderate", "high"
    Percentage int     `json:"percentage"`
}

// ArchetypeScores maps archetype name to count
type ArchetypeScores map[string]int

// Insight represents a generated insight
type Insight struct {
    Type              string  `json:"type"`
    Title             string  `json:"title"`
    InsightText       string  `json:"insight"`
    Priority          string  `json:"priority,omitempty"`
    Pillar            string  `json:"pillar,omitempty"`
    Archetype         string  `json:"archetype,omitempty"`
    Score             float64 `json:"score,omitempty"`
    Level             string  `json:"level,omitempty"`
    HighPillar        string  `json:"high_pillar,omitempty"`
    LowPillar         string  `json:"low_pillar,omitempty"`
    GapSize           float64 `json:"gap_size,omitempty"`
    HighScore         float64 `json:"high_score,omitempty"`
    LowScore          float64 `json:"low_score,omitempty"`
    StrongPillars     []string `json:"strong_pillars,omitempty"`
    WeakPillars       []string `json:"weak_pillars,omitempty"`
    DominanceLevel    string  `json:"dominance_level,omitempty"`
    PrimaryPercent    int     `json:"primary_percent,omitempty"`
    SecondaryPercent  int     `json:"secondary_percent,omitempty"`
    BalanceLevel      string  `json:"balance_level,omitempty"`
    MissingArchetype  string  `json:"missing_archetype,omitempty"`
    GapImplication    string  `json:"gap_implication,omitempty"`
    Archetypes        []string `json:"archetypes,omitempty"`
    ConsistencyScore  float64 `json:"consistency_score,omitempty"`
    FocusLevel        string  `json:"focus_level,omitempty"`
    LeveragePillar    string  `json:"leverage_pillar,omitempty"`
    DevelopmentPillar string  `json:"development_pillar,omitempty"`
}

// Valid archetypes
var validArchetypes = []string{"achiever", "optimizer", "networker", "grinder", "philosopher"}

// Valid pillars
var validPillars = []string{"identity", "emotional", "physical", "connection", "mission"}
```

### Function 1: `calculateConsistencyScore`

```
Input:  archetypeScores map (e.g. {"achiever":2, "optimizer":3, "networker":0, "grinder":1, "philosopher":0})
Output: float64 between 0.0 and 1.0

Algorithm:
1. If no scores, return 0.0
2. Find max and min values across all 5 archetypes
3. range = max - min
4. maxPossibleRange = 6 (all 6 archetype questions could go to one archetype)
5. consistency = 1 - (range / maxPossibleRange)
6. Round to 2 decimal places: math.Round(consistency * 100) / 100
```

### Function 2: `calculatePillarScores`

```
Input:  pillarGroups map[string][]int — grouped pillar response values (1-7 each)
Output: map[string]PillarScore

Algorithm:
For each pillar:
1. Calculate average of all response values
2. raw = math.Round(avg * 10) / 10
3. level = "low" if avg <= 3.5, "moderate" if avg <= 5.5, "high" if avg > 5.5
4. percentage = math.Round((avg / 7) * 100)  // NOTE: divide by 7, NOT 5
```

### Function 3: `generateMicroInsights`

```
Input:  primary archetype (string), pillarScores, contentData map[string]string
Output: []Insight (max 3)

Algorithm:
1. Sort pillars by raw score ascending (lowest first)
2. For each pillar (up to 3):
   a. Determine level: low (<=3.5), moderate (<=5.5), high (>5.5)
   b. Skip "high" pillars if insightCount == 0 and more pillars exist
   c. Look up content key: "{primary}_{pillar}_{level}"
   d. If content exists, create Insight{
        type: "pillar_analysis",
        pillar: pillar,
        archetype: primary,
        title: "{Pillar} Development Focus",
        insight: content text,
        score: raw score,
        level: level,
        priority: "high" if low, "medium" if moderate, "low" if high
      }
3. If no insights generated, add generic "Strong Foundation" insight
```

### Function 4: `generateAdvancedIntegrationInsights`

```
Input:  primary, secondary (nullable), archetypeScores, pillarScores, contentData
Output: []Insight (max 5)

Algorithm:
1. Call analyzePillarSynergies() → append results
2. Call analyzeArchetypeSpectrum() → append results
3. If no insights yet, call generateLegacyIntegrationInsights() → append results
4. Call identifyIntegrationOpportunities() → append results
5. Return first 5 insights only
```

### Function 5: `analyzePillarSynergies`

```
Input:  primary archetype, pillarScores, contentData
Output: []Insight

Algorithm:
1. Sort pillars by raw score descending
2. Get highest and lowest pillar names and scores
3. gap = highScore - lowScore

HIGH-LOW GAP ANALYSIS:
If gap >= 2.5 AND highScore >= 5.0 AND lowScore <= 4.0:
  - Look up content key: "{primary}_synergy_{highest}_{lowest}"
  - If found, create Insight{type: "pillar_synergy", title: "Pillar Gap Analysis", ...}

HIGH PILLAR SYNERGY:
- Find all pillars with raw >= 5.5
- If 2+ strong pillars:
  - Generate text using generateHighPillarSynergyInsight()
  - Create Insight{type: "strength_synergy", title: "Strength Combination", ...}

LOW PILLAR RISK:
- Find all pillars with raw <= 3.5
- If 2+ weak pillars:
  - Generate text using generateLowPillarRiskInsight()
  - Create Insight{type: "risk_pattern", title: "Development Priority Matrix", ...}
```

### Function 6: `analyzeArchetypeSpectrum`

```
Input:  primary, secondary, archetypeScores, contentData
Output: []Insight

Algorithm:
1. Sort archetypes by score descending
2. primaryPercent = math.Round((primaryScore / 6) * 100)
3. secondaryPercent = math.Round((secondaryScore / 6) * 100)

DOMINANCE (primaryPercent >= 70):
  Create Insight{type: "archetype_dominance", title: "Strong Archetype Focus",
    insight: "Your {primary} dominance ({percent}%) creates clear directional focus..."}

BALANCE (primaryPercent < 50 AND secondaryPercent >= 30):
  Create Insight{type: "archetype_balance", title: "Balanced Archetype Profile",
    insight: "Your balanced profile ({primary}: {x}%, {secondary}: {y}%) creates flexibility..."}

ZERO SCORES:
  For first archetype with score == 0:
    implication = getMissingArchetypeInsight(primary, missing)
    Create Insight{type: "archetype_gap", title: "Missing Archetype Traits",
      insight: "Your complete absence of {missing} traits suggests {implication}"}
```

### Function 7: `generateHighPillarSynergyInsight`

```
Input:  archetype string, highPillars []string, pillarData map[string]PillarScore
Output: string

Algorithm:
1. Capitalize and join pillar names with " and "
2. avgScore = average of all high pillar raw scores, rounded to 1 decimal
3. Look up archetype context:
   - optimizer → "creates systematic excellence across multiple domains"
   - achiever → "provides comprehensive foundation for high achievement"
   - networker → "enables authentic and sustainable relationship building"
   - grinder → "supports persistent effort across multiple life areas"
   - philosopher → "creates integrated wisdom expression"
   - default → "creates strong multi-domain development"
4. Return: "Your strength in {pillars} (average {avg}/7) {context}. This combination is uncommon and represents excellent foundational development that can be leveraged for significant impact."
```

### Function 8: `generateLowPillarRiskInsight`

```
Input:  archetype string, lowPillars []string, pillarData map[string]PillarScore
Output: string

Algorithm:
1. Capitalize and join pillar names
2. avgScore = average of low pillar raw scores, rounded to 1 decimal
3. Look up archetype risks:
   - optimizer → "may create systematic approaches that lack sustainability"
   - achiever → "may limit long-term achievement potential and satisfaction"
   - networker → "may lead to relationship burnout and authenticity challenges"
   - grinder → "may result in grinding without direction or sustainable foundation"
   - philosopher → "may create disconnected wisdom that lacks practical application"
   - default → "may limit overall development and effectiveness"
4. Return: "Your {pillars} development needs (average {avg}/7) require priority attention. For {archetype}s, weakness in these areas {risk}. Consider systematic development in these foundational areas."
```

### Function 9: `getMissingArchetypeInsight`

```
Input:  primary string, missing string
Output: string

Full lookup table:

optimizer missing:
  achiever → "you may optimize without clear goal direction"
  networker → "you may optimize in isolation without relationship consideration"
  grinder → "you may lack persistence when optimization becomes difficult"
  philosopher → "you may optimize without deeper values integration"

achiever missing:
  optimizer → "you may achieve goals inefficiently without systematic approaches"
  networker → "you may achieve in isolation without relationship support"
  grinder → "you may give up when achievement requires extended persistence"
  philosopher → "you may achieve without deeper meaning or values alignment"

networker missing:
  optimizer → "you may build relationships without systematic approaches"
  achiever → "you may network without clear achievement direction"
  grinder → "you may avoid relationship challenges that require persistence"
  philosopher → "you may connect without deeper wisdom or values integration"

grinder missing:
  optimizer → "you may persist without systematic improvement approaches"
  achiever → "you may grind without clear achievement direction"
  networker → "you may persist in isolation without relationship support"
  philosopher → "you may grind without deeper meaning or values integration"

philosopher missing:
  optimizer → "you may philosophize without systematic practical application"
  achiever → "you may develop wisdom without clear achievement direction"
  networker → "you may contemplate in isolation without relationship integration"
  grinder → "you may avoid the persistent effort needed to apply philosophical insights"

default → "you may be missing complementary traits that could enhance your primary approach"
```

### Function 10: `generateLegacyIntegrationInsights` (fallback)

```
Input:  primary, secondary (nullable), archetypeScores, pillarScores, contentData
Output: []Insight

Algorithm:
If secondary exists:
  - Look up content key: "{primary}_{secondary}_integration"
  - If found, create Insight{type: "dual_integration", title: "{Primary} + {Secondary} Synergy"}

If no secondary:
  - Calculate consistency = calculateConsistencyScore(archetypeScores)
  - focusLevel = "high" if consistency >= 0.8, "moderate" if >= 0.6, "low" otherwise
  - Look up content key: "{primary}_integration_single"
  - If found, create Insight{type: "single_focus", title: "Focused {Primary} Development"}
```

### Function 11: `identifyIntegrationOpportunities`

```
Input:  primary, pillarScores, contentData
Output: []Insight

Algorithm:
1. Sort pillars by raw score descending
2. Get highest pillar (name + score) and lowest pillar (name + score)
3. If highScore >= 5.5 AND lowScore <= 3.5:
   Create Insight{
     type: "leverage_opportunity",
     title: "Strength-Based Development Strategy",
     insight: "Your {highest} mastery ({highScore}/7) can be leveraged to develop {lowest} ({lowScore}/7). Apply the same systematic approach that created your {highest} success to {lowest} development."
   }
```

---

## Complete Submit Handler Flow

Here's the full pseudocode for the rewritten `SubmitAssessment` handler:

```
1. Authenticate user
2. Get assessment ID from URL path
3. Parse request body into SubmitAssessmentRequest struct
4. Validate: archetypeResponses and pillarResponses must exist

5. Query questions table: SELECT id, question_key FROM questions
   Build questionMap: map[questionKey] → questionId

6. Query content table: SELECT content_key, content_text FROM content
   Build contentData: map[contentKey] → contentText

7. Initialize archetypeScores = {achiever:0, optimizer:0, networker:0, grinder:0, philosopher:0}

8. For each archetypeResponse:
   a. Validate questionKey exists in questionMap
   b. Insert into responses table: {assessment_id, question_id, question_key, response_value: archetype}
   c. Increment archetypeScores[archetype]

9. Initialize pillarGroups = {identity:[], emotional:[], physical:[], connection:[], mission:[]}

10. For each pillarResponse:
    a. Validate questionKey exists in questionMap
    b. Parse value as int
    c. Insert into responses table: {assessment_id, question_id, question_key, response_value: value as string}
    d. Append value to pillarGroups[pillar]

11. Calculate pillarScores from pillarGroups (avg, level, percentage)

12. Sort archetypeScores descending → primary = highest, secondary = second highest (if > 0)

13. Calculate consistencyScore
14. Generate microInsights(primary, pillarScores, contentData)
15. Generate integrationInsights(primary, secondary, archetypeScores, pillarScores, contentData)

16. Insert into assessment_results:
    {
      assessment_id,
      user_id: user.ID,
      primary_archetype: primary,
      secondary_archetype: secondary or "",
      archetype_scores: archetypeScores (as JSON),
      pillar_scores: pillarScores (as JSON),
      consistency_score: consistencyScore,
      micro_insights: microInsights (as JSON),
      integration_insights: integrationInsights (as JSON)
    }

17. Return success response with resultId + full results
```

---

## Testing

After implementation, test with these curl commands:

```bash
# Get questions (should return archetype + pillar questions from `questions` table)
curl -H "Authorization: Bearer TOKEN" \
  https://api.claimn.co/api/v2/members/assessments/{id}/questions

# Submit assessment
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"archetypeResponses":[{"questionKey":"arch_q1","archetype":"optimizer"},{"questionKey":"arch_q2","archetype":"optimizer"},{"questionKey":"arch_q3","archetype":"achiever"},{"questionKey":"arch_q4","archetype":"optimizer"},{"questionKey":"arch_q5","archetype":"grinder"},{"questionKey":"arch_q6","archetype":"achiever"}],"pillarResponses":[{"questionKey":"pillar_identity_1","pillar":"identity","value":5},{"questionKey":"pillar_identity_2","pillar":"identity","value":6},{"questionKey":"pillar_emotional_1","pillar":"emotional","value":3},{"questionKey":"pillar_emotional_2","pillar":"emotional","value":4},{"questionKey":"pillar_physical_1","pillar":"physical","value":6},{"questionKey":"pillar_physical_2","pillar":"physical","value":7},{"questionKey":"pillar_connection_1","pillar":"connection","value":4},{"questionKey":"pillar_connection_2","pillar":"connection","value":5},{"questionKey":"pillar_mission_1","pillar":"mission","value":6},{"questionKey":"pillar_mission_2","pillar":"mission","value":5}]}' \
  https://api.claimn.co/api/v2/members/assessments/{id}/submit

# Get results
curl -H "Authorization: Bearer TOKEN" \
  https://api.claimn.co/api/v2/members/assessments/{id}/results

# Get latest results
curl -H "Authorization: Bearer TOKEN" \
  https://api.claimn.co/api/v2/members/assessments/results/latest

# Get content map
curl -H "Authorization: Bearer TOKEN" \
  https://api.claimn.co/api/v2/members/assessments/content
```

**Verify:**
- Questions endpoint returns questions from `questions` table (not `assessment_questions`)
- Submit creates records in `responses` table AND `assessment_results` table
- `assessment_results.archetype_scores` is JSONB with 5 archetype keys
- `assessment_results.pillar_scores` is JSONB with nested `{raw, level, percentage}` objects
- `assessment_results.micro_insights` and `integration_insights` are JSONB arrays of insight objects
- Results endpoints return these JSONB fields as-is (pass through)

---

## Dependencies

Only standard library + existing project dependencies:
- `math` (for Round, Abs)
- `sort` (for sorting slices)
- `strings` (for capitalize helper)
- `encoding/json` (already imported)
- `fmt` (already imported)
- No new go module dependencies needed

---

## Files to Modify

1. **`handlers/v2/members/assessments_handlers.go`** — Rewrite all handlers + add scoring functions (or split scoring into a separate file `handlers/v2/members/assessment_scoring.go`)
2. **`handlers/routes.go`** — Add the new `/members/assessments/content` route (line ~225, BEFORE the `{id}` route)

That's it. Two files.
