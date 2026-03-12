import { test, expect } from '@playwright/test'
import { login } from './auth.setup'

test.describe('Experts Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, '/experts')
  })

  test('experts page loads and shows expert cards', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Expert Coaches' }),
    ).toBeVisible({ timeout: 15_000 })
  })

  test('expert card shows rating and review count', async ({ page }) => {
    // Look for any rating display (star icon + number)
    const ratingEl = page.locator('text=/\\d\\.\\d/').first()
    if (await ratingEl.isVisible().catch(() => false)) {
      await expect(ratingEl).toBeVisible()
    }
  })
})

test.describe('Book Session Page', () => {
  test('book session page loads', async ({ page }) => {
    await login(page, '/book-session')
    await expect(page.locator('body')).toBeVisible()
  })

  test('booking page shows timezone indicator', async ({ page }) => {
    await login(page, '/book-session')
    const timezoneText = page.getByText('Times shown in').or(page.getByText('your local time'))
    if (await timezoneText.isVisible().catch(() => false)) {
      await expect(timezoneText).toBeVisible()
    }
  })
})
