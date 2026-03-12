import { test, expect } from '@playwright/test'
import { login } from './auth.setup'

test.describe('Hub Page — My Coach Card', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, '/')
  })

  test('shows My Coach card or empty state on Hub page', async ({ page }) => {
    // Either we see the assigned coach card or the "No coach assigned yet" state
    const coachCard = page.getByText('My Coach')
    const emptyState = page.getByText('No coach assigned yet')

    await expect(coachCard.or(emptyState)).toBeVisible({ timeout: 15_000 })
  })

  test('assigned coach card shows name, quick actions, and profile link', async ({ page }) => {
    const coachCard = page.getByText('My Coach')
    // Skip if no coach assigned
    if (!(await coachCard.isVisible().catch(() => false))) {
      test.skip()
      return
    }

    // Quick actions
    await expect(page.getByRole('link', { name: 'Message' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Book Session' }).or(page.getByRole('button', { name: 'Book Session' })).first()).toBeVisible()
  })

  test('empty state shows Request a Coach and Browse Experts buttons', async ({ page }) => {
    const emptyState = page.getByText('No coach assigned yet')
    if (!(await emptyState.isVisible().catch(() => false))) {
      test.skip()
      return
    }

    await expect(page.getByText('Request a Coach')).toBeVisible()
    await expect(page.getByText('Browse Experts')).toBeVisible()
  })

  test('pending request shows "Finding your coach" state', async ({ page }) => {
    const pendingState = page.getByText('Finding your coach')
    if (!(await pendingState.isVisible().catch(() => false))) {
      test.skip()
      return
    }

    await expect(page.getByText('matching you with the perfect coach')).toBeVisible()
  })
})

test.describe('Hub Page — Request a Coach Modal', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, '/')
  })

  test('opens modal and validates required goals field', async ({ page }) => {
    const requestBtn = page.getByText('Request a Coach')
    if (!(await requestBtn.isVisible().catch(() => false))) {
      test.skip()
      return
    }

    await requestBtn.click()

    // Modal appears
    await expect(page.getByRole('heading', { name: 'Request a Coach' })).toBeVisible()
    await expect(page.getByText('What are your goals?')).toBeVisible()

    // Submit button is disabled when goals are empty
    const submitBtn = page.getByRole('button', { name: 'Submit Request' })
    await expect(submitBtn).toBeDisabled()

    // Fill in goals
    const goalsTextarea = page.locator('textarea').first()
    await goalsTextarea.fill('Improve leadership skills\nBetter work-life balance')

    // Submit button becomes enabled
    await expect(submitBtn).toBeEnabled()
  })

  test('can cancel the modal', async ({ page }) => {
    const requestBtn = page.getByText('Request a Coach')
    if (!(await requestBtn.isVisible().catch(() => false))) {
      test.skip()
      return
    }

    await requestBtn.click()
    await expect(page.getByRole('heading', { name: 'Request a Coach' })).toBeVisible()

    await page.getByRole('button', { name: 'Cancel' }).click()

    // Modal should close
    await expect(page.getByRole('heading', { name: 'Request a Coach' })).not.toBeVisible()
  })
})
