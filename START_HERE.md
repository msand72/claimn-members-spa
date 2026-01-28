# CLAIM'N Members SPA - Start Here

**IMPORTANT: Read this ENTIRE document before making any changes.**

---

## LEARNINGS FROM MEMBERS SPA BUILD

### Critical Lessons Learned

1. **NEVER GUESS** - Always check the actual source: database schema, claimn-web codebase, migration docs
2. **Font loading took 10+ attempts** - The correct approach is documented below
3. **Typography hierarchy matters** - Follow Glass Component Kit 2 exactly
4. **Check claimn-web for reference** - It's the working production site

---

## MANDATORY First Steps

1. **Read the migration docs** in `/claimn-web/docs/migration 2.0/`
2. **Get the full database schema** from Supabase (see Database Schema Discovery section below)
3. **Check the constants** in `src/lib/constants.ts`
4. **Read Glass Component Kit 2** at `/claimn-web/docs/migration 2.0/Glass Component Kit 2.tsx`
5. **NEVER guess** table names, column names, or data types

---

## 🔍 DATABASE SCHEMA DISCOVERY

### Supabase Connection Details

```
Project URL: https://onzzadpetfvpfbpfylmt.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uenphZHBldGZ2cGZicGZ5bG10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NzczNjIsImV4cCI6MjA2OTQ1MzM2Mn0.NSqBSkD-I881sM9yppxiTtK7O9qCS_QrZ3wx5YjVQZk
Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uenphZHBldGZ2cGZicGZ5bG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg3NzM2MiwiZXhwIjoyMDY5NDUzMzYyfQ.A7AE43uGV2VPs9_ck8e-jn345nkshXWUyqYvWRAbum4
```

### Run These SQL Queries (in Supabase SQL Editor)

**Query 1: List ALL tables in public schema**
```sql
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Query 2: Get ALL columns for ALL tables**
```sql
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

**Query 3: Get foreign key relationships**
```sql
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

**Query 4: Get check constraints (enum values)**
```sql
SELECT
  tc.table_name,
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'CHECK'
ORDER BY tc.table_name;
```

**Query 5: Get RLS policies**
```sql
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Test User for API Testing

```
Email: apitest@claimn.com
Password: TestPassword123!
User ID: dc0581ab-9f27-41e8-b7f3-8486157ebfa8
```

**Get JWT token via curl:**
```bash
curl -X POST 'https://onzzadpetfvpfbpfylmt.supabase.co/auth/v1/token?grant_type=password' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uenphZHBldGZ2cGZicGZ5bG10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NzczNjIsImV4cCI6MjA2OTQ1MzM2Mn0.NSqBSkD-I881sM9yppxiTtK7O9qCS_QrZ3wx5YjVQZk' \
  -H 'Content-Type: application/json' \
  -d '{"email": "apitest@claimn.com", "password": "TestPassword123!"}'
```

---

## FONTS (CRITICAL - LEARNED THE HARD WAY)

### The CORRECT Approach (after many failed attempts)

**Font file location:** `public/fonts/Neutraface_2.ttf`

**fonts.css** (in `src/fonts.css`):
```css
@font-face {
  font-family: 'Neutraface 2 Display';
  src: url('/fonts/Neutraface_2.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Neutraface 2 Display';
  src: url('/fonts/Neutraface_2.ttf') format('truetype');
  font-weight: bold;
  font-style: normal;
  font-display: swap;
}

:root {
  --font-neutraface: 'Neutraface 2 Display';
  --font-playfair: 'Playfair Display';
  --font-lato: 'Lato';
}
```

**main.tsx** - Import order matters:
```tsx
import './fonts.css'  // MUST come first
import './index.css'
```

**tailwind.config.js**:
```js
fontFamily: {
  display: ['var(--font-neutraface)', 'Montserrat', 'sans-serif'],
  serif: ['var(--font-playfair)', 'Georgia', 'serif'],
  sans: ['var(--font-lato)', 'system-ui', 'sans-serif'],
},
```

**vercel.json** - Headers for font files:
```json
{
  "headers": [
    {
      "source": "/fonts/(.*).ttf",
      "headers": [
        { "key": "Content-Type", "value": "font/ttf" },
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" },
        { "key": "Access-Control-Allow-Origin", "value": "*" }
      ]
    }
  ]
}
```

### What DOESN'T Work (we tried all of these):

1. ❌ Font in `src/assets/fonts/` with Vite import - doesn't work in production
2. ❌ Dynamic JavaScript injection of @font-face - unreliable
3. ❌ External font URLs - CORS issues
4. ❌ Wrong font-family names ('Neutraface 2', 'Neutraface 2 Display Bold') - must be exact
5. ❌ Missing quotes around font names with spaces in Tailwind - breaks CSS

### Key Insight

The font-family name MUST be exactly `'Neutraface 2 Display'` - this is the name embedded in the TTF file itself. Check `/claimn-web/src/app/globals.css` for reference.

---

## TYPOGRAPHY SYSTEM (from Glass Component Kit 2)

| Font | Tailwind Class | Usage |
|------|---------------|-------|
| **Neutraface 2 Display** | `font-display` | Hero titles, h1, h3 card titles, large stat numbers |
| **Playfair Display** | `font-serif` | h2 section headings, subtitles, taglines (often italic) |
| **Lato** | `font-sans` | Body text, buttons, labels, small text |

### Google Fonts Import (in index.css)

```css
@import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Montserrat:wght@400;500;600;700&display=swap');
```

This MUST be the first line in index.css, before any Tailwind imports.

---

## THEME SYSTEM (Light/Dark Mode)

### CSS Variables (in index.css)

```css
:root {
  /* Dark theme (default) */
  --color-kalkvit: 249 247 244;  /* Cream white RGB */
  --text-primary: #F9F7F4;
  --bg-primary: #0A0A0B;
}

.light {
  --color-kalkvit: 28 28 30;  /* Charcoal RGB */
  --text-primary: #1C1C1E;
  --bg-primary: #F9F7F4;
}
```

### Key Pattern

The `kalkvit` color switches meaning based on theme:
- Dark mode: Cream white text on dark background
- Light mode: Charcoal text on light background

Use `text-kalkvit` and it automatically adapts.

---

## DATABASE SCHEMA (Key Tables)

### CRITICAL: Common Mistakes to Avoid

| Wrong | Correct | Notes |
|-------|---------|-------|
| `members` table | `member_profiles` | Table name |
| `id` column | `user_id` | Primary key for member lookup |
| `full_name` | `display_name` | Name field |
| `phone` | `whatsapp_number` | Phone field |
| `location` | `city` + `country` | Location is split |
| `pillar_focus: string` | `pillar_focus: string[]` | It's an ARRAY |

### `member_profiles` table

```sql
user_id UUID PRIMARY KEY REFERENCES auth.users(id)
display_name TEXT
bio TEXT
archetype TEXT -- one of 5 archetypes
pillar_focus TEXT[] -- ARRAY of pillar IDs
city TEXT
country TEXT
links JSONB
visibility JSONB
avatar_url TEXT
whatsapp_number TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

### The 5 Archetypes

1. The Achiever
2. The Optimizer
3. The Networker
4. The Grinder
5. The Philosopher

### The 5 Pillars

1. identity
2. emotional
3. physical
4. connection
5. mission

---

## GLASS UI SYSTEM

### Three Glass Variants (from Glass Component Kit 2)

```css
/* Base Glass */
.glass-base {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* Elevated Glass (modals, dropdowns) */
.glass-elevated {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
}

/* Accent Glass (CTAs, featured) */
.glass-accent {
  background: linear-gradient(135deg, rgba(184, 115, 51, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(184, 115, 51, 0.25);
}
```

### Brand Colors

```js
charcoal: '#1C1C1E',
jordbrun: '#5E503F',
sandbeige: '#E5D9C7',
oliv: '#3A4A42',
dimblag: '#A1B1C6',
koppar: '#B87333',      // Primary accent
kalkvit: '#F9F7F4',     // Cream white
tegelrod: '#B54A46',
skogsgron: '#6B8E6F',
```

---

## PROJECT STRUCTURE

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/constants.ts` | Archetypes, Pillars, KPI types |
| `src/lib/supabase.ts` | Supabase client |
| `src/contexts/AuthContext.tsx` | Authentication state |
| `src/contexts/ThemeContext.tsx` | Light/dark theme |
| `src/hooks/useProfile.ts` | Member profile queries |
| `src/fonts.css` | @font-face declarations |
| `src/index.css` | Tailwind + theme variables |
| `public/fonts/` | Font files |
| `vercel.json` | Deployment config |

---

## DEPLOYMENT (Vercel)

### vercel.json Configuration

```json
{
  "headers": [
    {
      "source": "/fonts/(.*).ttf",
      "headers": [
        { "key": "Content-Type", "value": "font/ttf" },
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" },
        { "key": "Access-Control-Allow-Origin", "value": "*" }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/:path((?!.*\\.).*)",
      "destination": "/index.html"
    }
  ]
}
```

The rewrite rule ensures SPA client-side routing works (all non-file routes serve index.html).

---

## REFERENCE LOCATIONS

### Migration Documentation

```
/Users/maxsandberg/claimn-web/docs/migration 2.0/
├── Glass Component Kit 2.tsx        # Design reference (CRITICAL)
├── MEMBERS_SPA_COMPLETE_PLAN.md     # Full implementation plan
├── MEMBERS_SPA_GAP_ANALYSIS.md      # Data structure corrections
├── MEMBERS_SPA_STATUS_REPORT.md     # Current status
```

### Database Migrations

```
/Users/maxsandberg/claimn-web/supabase/migrations/
├── 101_member_profiles.sql
├── 117_interests.sql
├── 131_program_assessments.sql
├── 132_interest_groups.sql
```

### Working Reference (claimn-web)

```
/Users/maxsandberg/claimn-web/
├── src/app/globals.css              # Font declarations reference
├── src/app/fonts.ts                 # Next.js font loading
├── tailwind.config.ts               # Tailwind config reference
├── public/fonts/Neutraface_2.ttf    # Font file source
```

---

## DEBUGGING TIPS

### Font Not Loading?

1. Check browser Network tab - is the font file being requested?
2. Check browser Console for errors
3. Verify font file exists in `public/fonts/`
4. Check vercel.json headers configuration
5. Clear browser cache completely
6. Check computed font-family in DevTools Elements panel

### Add Debug Logging (temporarily)

```typescript
// In main.tsx
document.fonts.ready.then(() => {
  console.log('Fonts loaded:')
  document.fonts.forEach(font => {
    console.log(`  ${font.family} - ${font.status}`)
  })
})
```

---

## CHECKLIST FOR ADMIN PAGES

Before starting admin pages development:

- [ ] Copy font setup from members-spa (public/fonts/, fonts.css, vercel.json)
- [ ] Use same Tailwind config for colors and fonts
- [ ] Follow Glass Component Kit 2 for UI components
- [ ] Use same typography hierarchy (Neutraface h1/h3, Playfair h2, Lato body)
- [ ] Implement same theme system (light/dark with kalkvit switching)
- [ ] Check database schema for admin-specific tables
- [ ] Review RLS policies for admin access

---

*Last updated: 2026-01-27*
*Learnings compiled from members-spa development session*
