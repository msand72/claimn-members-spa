import { type Page } from '@playwright/test'

const API_URL = process.env.E2E_API_URL || 'https://api.claimn.co'
const TEST_EMAIL = process.env.E2E_EMAIL || 'max.sandberg@imply.se'
const TEST_PASSWORD = process.env.E2E_PASSWORD || '24Zy3002xA'

/**
 * Authenticate by calling the login API and setting localStorage tokens,
 * then reload so the auth context picks them up.
 */
export async function login(page: Page, targetPath = '/') {
  await page.goto('/login')
  await page.waitForLoadState('domcontentloaded')

  const authResult = await page.evaluate(
    async ({ email, password, apiUrl }) => {
      const resp = await fetch(`${apiUrl}/api/v2/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!resp.ok) return { error: `Login failed: ${resp.status}` }
      const data = await resp.json()
      localStorage.setItem('claimn_access_token', data.access_token)
      localStorage.setItem('claimn_refresh_token', data.refresh_token)
      localStorage.setItem('claimn_expires_at', String(data.expires_at))
      return { ok: true }
    },
    { email: TEST_EMAIL, password: TEST_PASSWORD, apiUrl: API_URL },
  )

  if ('error' in authResult) {
    throw new Error(authResult.error as string)
  }

  await page.goto(targetPath)
  await page.waitForLoadState('networkidle')
}

/**
 * Helper to get the stored access token from the page context.
 */
export async function getToken(page: Page): Promise<string> {
  return page.evaluate(() => localStorage.getItem('claimn_access_token') || '')
}
