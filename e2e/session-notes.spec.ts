import { test, expect } from '@playwright/test'
import { login } from './auth.setup'

test.describe('Session Notes Page', () => {
  test('no session selected shows prompt to go to My Sessions', async ({ page }) => {
    await login(page, '/coaching/session-notes')
    await expect(page.getByText('No session selected')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Go to My Sessions')).toBeVisible()
  })

  test('Go to My Sessions link navigates correctly', async ({ page }) => {
    await login(page, '/coaching/session-notes')
    await expect(page.getByText('Go to My Sessions')).toBeVisible({ timeout: 15_000 })
    await page.getByText('Go to My Sessions').click()
    await page.waitForURL('**/coaching/sessions', { timeout: 10_000 })
  })
})
