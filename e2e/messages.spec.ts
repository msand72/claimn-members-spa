import { test, expect } from '@playwright/test'
import { login } from './auth.setup'

test.describe('Messages Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, '/messages')
  })

  test('messages page loads', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Messages' }),
    ).toBeVisible({ timeout: 15_000 })
  })

  test('conversations list polls for updates', async ({ page }) => {
    test.setTimeout(60_000)

    // Intercept conversation list requests and count them
    let fetchCount = 0
    await page.route('**/api/v2/members/messages/conversations**', (route) => {
      fetchCount++
      route.continue()
    })

    // Wait enough time for at least 2 polls (15s interval)
    await page.waitForTimeout(35_000)

    // Should have made at least 2 requests (initial + poll)
    expect(fetchCount).toBeGreaterThanOrEqual(2)
  })
})
