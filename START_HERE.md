# CLAIM'N Members SPA - Start Here

**IMPORTANT: Read this ENTIRE document before making any changes.**

## MANDATORY First Steps

1. **Read the migration docs** in `/claimn-web/docs/migration 2.0/`
2. **Get the full database schema** from Supabase (see instructions below)
3. **Check the constants** in `src/lib/constants.ts`
4. **NEVER guess** table names, column names, or data types

## Migration Documentation Location

All migration documentation is in the **claimn-web** repository:

```
/Users/maxsandberg/claimn-web/docs/migration 2.0/
```

### Key Documents (READ THESE FIRST)

1. **MEMBERS_SPA_COMPLETE_PLAN.md** - Full implementation plan with:
   - Interest system (database tables, how it works)
   - Assessment system (30 questions, scoring algorithm)
   - Goals & KPIs system
   - Page list and routes

2. **MEMBERS_SPA_GAP_ANALYSIS.md** - Data structure corrections:
   - Correct archetypes (5): The Achiever, The Optimizer, The Networker, The Grinder, The Philosopher
   - Correct pillars (5): identity, emotional, physical, connection, mission
   - Missing pages and features
   - Constants file structure

3. **MEMBERS_SPA_STATUS_REPORT.md** - Current implementation status:
   - 38 pages completed
   - Which features use mock data
   - API endpoints needed from backend

---

## Getting the FULL Database Schema

**BEFORE making any database-related changes, get the complete schema from Supabase.**

### Option 1: SQL Query in Supabase Dashboard (RECOMMENDED)

Go to Supabase Dashboard → SQL Editor and run:

```sql
-- Get all tables in public schema
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

Or for a specific table:
```sql
-- Get columns for member_profiles table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'member_profiles'
ORDER BY ordinal_position;
```

### Option 2: Supabase CLI

```bash
# Dump the entire schema
supabase db dump --schema public > schema.sql

# Or link to remote project first
supabase link --project-ref onzzadpetfvpfbpfylmt
supabase db pull
```

### Option 3: Read the Migration Files

All migrations are in:
```
/Users/maxsandberg/claimn-web/supabase/migrations/
```

Key migration files:
- `101_member_profiles.sql` - member_profiles table
- `117_interests.sql` - interests table
- `132_interest_groups.sql` - interest_groups table
- `131_program_assessments.sql` - assessment tables

### Option 4: PostgREST OpenAPI Spec

The Supabase REST API auto-generates OpenAPI documentation:
```
https://onzzadpetfvpfbpfylmt.supabase.co/rest/v1/
```

This shows all exposed tables and their columns.

---

## Database Schema (Key Tables)

### `member_profiles` table (NOT `members`)
```sql
user_id UUID PRIMARY KEY
display_name TEXT
bio TEXT
archetype TEXT -- one of 5 archetypes
pillar_focus TEXT[] -- array of pillar IDs
city TEXT
country TEXT
links JSONB
visibility JSONB
avatar_url TEXT
whatsapp_number TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

### `interests` table
```sql
id UUID PRIMARY KEY
name TEXT
slug TEXT
description TEXT
icon TEXT
sort_order INTEGER
```

### `member_interests` table
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES auth.users(id)
interest_id UUID REFERENCES interests(id)
```

---

## Key Files in Members SPA

| File | Purpose |
|------|---------|
| `src/lib/constants.ts` | Archetypes, Pillars, KPI types |
| `src/hooks/useProfile.ts` | Queries `member_profiles` table |
| `src/hooks/useInterests.ts` | Queries `interests` and `member_interests` |
| `src/pages/ProfilePage.tsx` | Profile editing with archetype, pillars, interests |
| `src/pages/DashboardPage.tsx` | Member dashboard |

---

## Common Mistakes to Avoid

1. **Wrong table name**: Use `member_profiles`, NOT `members`
2. **Wrong column**: Use `user_id`, NOT `id` for member lookup
3. **Wrong column**: Use `display_name`, NOT `full_name`
4. **pillar_focus is an array**: `PillarId[]`, not a single value
5. **No `phone` or `location` fields**: Use `city` and `country` separately

---

## Fonts

**CRITICAL: The font-family name MUST be exactly `'Neutraface 2 Display'`**

This matches claimn-web's globals.css. See `/claimn-web/src/app/globals.css` for reference.

### How it works:
1. Font file is in `src/assets/fonts/Neutraface_2.ttf`
2. Imported in `main.tsx` using Vite's asset import
3. @font-face is dynamically injected with the Vite-resolved URL
4. Tailwind config uses `font-display: ['Neutraface 2 Display', ...]`

### DO NOT:
- Use external URLs (CORS issues)
- Use the public folder (Vite doesn't process it correctly for fonts)
- Use any font-family name other than the exact embedded name

---

## Deployment

- Vercel hosting
- `vercel.json` has rewrites for SPA client-side routing
- Base URL is `/`

---

*Last updated: 2026-01-27*
