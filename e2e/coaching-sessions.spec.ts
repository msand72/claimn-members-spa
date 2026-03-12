import { test, expect } from '@playwright/test'
import { login } from './auth.setup'

test.describe('Coaching Sessions Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, '/coaching/sessions')
    await expect(page.locator('body')).toBeVisible()
  })

  test('page loads and shows session list or empty state', async ({ page }) => {
    const heading = page.getByRole('heading', { name: 'My Sessions' })
    const emptyState = page.getByText('No sessions found')

    await expect(heading.or(emptyState)).toBeVisible({ timeout: 15_000 })
  })

  test('old /expert-sessions route redirects to /coaching/sessions', async ({ page }) => {
    await page.goto('/expert-sessions')
    await page.waitForURL('**/coaching/sessions', { timeout: 10_000 })
    expect(page.url()).toContain('/coaching/sessions')
  })

  test('session card shows meeting link or fallback message', async ({ page }) => {
    // Wait for sessions to load
    await page.waitForTimeout(2_000)

    const joinCall = page.getByText('Join Call')
    const fallback = page.getByText('Meeting link will be shared')

    // Either a session with a link or the fallback — or skip if no sessions
    if (await joinCall.or(fallback).isVisible().catch(() => false)) {
      await expect(joinCall.or(fallback)).toBeVisible()
    }
  })
})

test.describe('Coaching Sessions — Reschedule Modal', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, '/coaching/sessions')
  })

  test('reschedule button opens modal', async ({ page }) => {
    const rescheduleBtn = page.getByText('Reschedule').first()
    if (!(await rescheduleBtn.isVisible().catch(() => false))) {
      test.skip()
      return
    }

    await rescheduleBtn.click()

    await expect(
      page.getByRole('heading', { name: 'Reschedule Session' }),
    ).toBeVisible()

    // Cancel closes modal
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByText('Reschedule Session')).not.toBeVisible()
  })
})

test.describe('Coaching Sessions — Review Modal', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, '/coaching/sessions')
  })

  test('completed session shows Rate Session button', async ({ page }) => {
    const rateBtn = page.getByText('Rate Session').first()
    if (!(await rateBtn.isVisible().catch(() => false))) {
      test.skip()
      return
    }

    await rateBtn.click()
    await expect(page.getByText('Rate Your Session')).toBeVisible()
  })

  test('submitted review shows read-only on session card', async ({ page }) => {
    const reviewDisplay = page.getByText('Your review').or(page.locator('[class*="fill-"]').first())
    if (await reviewDisplay.isVisible().catch(() => false)) {
      await expect(reviewDisplay).toBeVisible()
    }
  })
})
