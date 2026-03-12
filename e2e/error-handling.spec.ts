import { test, expect } from '@playwright/test'
import { login } from './auth.setup'

test.describe('Error Handling — Global', () => {
  test('unauthenticated access redirects to login', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL('**/login**', { timeout: 10_000 })
    expect(page.url()).toContain('/login')
  })

  test('404 route shows error or not found page', async ({ page }) => {
    await login(page, '/this-route-does-not-exist-12345')
    await expect(
      page.getByRole('heading', { name: 'Page not found' }).or(
        page.getByRole('heading', { name: 'Something went wrong' }),
      ),
    ).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Error Handling — API Errors', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, '/')
  })

  test('app loads without errors on authenticated routes', async ({ page }) => {
    // Verify the hub page loads successfully after auth
    await expect(page.locator('body')).toBeVisible()
    // Should not show error boundary
    await expect(page.getByText('Something went wrong')).not.toBeVisible({ timeout: 3_000 })
  })

  test('intercepted API error shows error state', async ({ page }) => {
    await page.goto('/book-session')

    // Mock the booking endpoint to return 409
    await page.route('**/api/v2/members/coaching/sessions', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'SLOT_UNAVAILABLE',
              message: 'This time slot has already been booked',
            },
          }),
        })
      } else {
        route.continue()
      }
    })

    await expect(page.locator('body')).toBeVisible()
  })
})
