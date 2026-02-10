# Backend Request: Fix API URL Configuration for Vercel Deployments

**Date:** 2026-02-10
**Priority:** HIGH
**Status:** PENDING
**Requested by:** Backend Agent

---

## Problem

Vercel preview deployments (e.g., `claimn-members-spa-git-develop-*.vercel.app`) are failing with:

```
localhost:3001/api/v2/auth/login:1 Failed to load resource: net::ERR_CONNECTION_REFUSED
```

This happens because:
1. `.env` has `VITE_API_URL=http://localhost:3001` (for local dev)
2. `src/lib/auth.ts` has hardcoded `return 'http://localhost:3001'`
3. Vercel runs in the cloud and cannot reach `localhost`

---

## Required Changes

### 1. Update Environment Configuration

**File:** `.env` (local development only)
```env
# Keep localhost for local development
VITE_API_URL=http://localhost:3001
```

**File:** `.env.production` (create if not exists)
```env
VITE_API_URL=https://api.claimn.co
```

### 2. Fix Hardcoded URL in auth.ts

**File:** `src/lib/auth.ts`

Find and remove any hardcoded localhost references:
```typescript
// BAD - Remove this:
return 'http://localhost:3001'

// GOOD - Use environment variable:
return import.meta.env.VITE_API_URL || 'https://api.claimn.co'
```

### 3. Set Vercel Environment Variable

In Vercel Dashboard → Project Settings → Environment Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_API_URL` | `https://api.claimn.co` | Production, Preview |

---

## API Information

- **Production API:** `https://api.claimn.co`
- **Local Development:** `http://localhost:3001`
- **API Documentation:** `https://api.claimn.co/api/docs` (requires admin auth)
- **OpenAPI Spec:** `https://api.claimn.co/api/docs/openapi.yaml`

---

## Testing

After implementing:

1. **Local:** Run `npm run dev` and verify API calls go to `localhost:3001`
2. **Vercel Preview:** Push to a branch, verify API calls go to `api.claimn.co`
3. **Production:** Deploy to main, verify API calls go to `api.claimn.co`

---

## Notes

- The backend API is running and healthy at `https://api.claimn.co`
- CORS is already configured to accept requests from Vercel preview domains
- Rate limiting is active: 100 requests/minute per IP
