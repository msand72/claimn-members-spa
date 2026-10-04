import { test, expect, type Page } from '@playwright/test'

/**
 * Regression gate for the protocol detail hero header.
 *
 * The header is a two-column flex row: title + description on the left, the
 * "Expected Result" headline stat on the right. Headline stats in the live
 * library are full sentences (44-75 chars), not bare numbers. If the stat
 * column is allowed to size itself to its own content it claims most of the
 * row and squeezes the description into a one-word-wide column.
 *
 * This measures real rendered boxes rather than asserting on class names, so
 * it fails on the actual layout regression.
 *
 * Fully mocked: no credentials, and the stat text is fixed so the gate does
 * not quietly stop exercising the bug when library content changes.
 */

const LONG_STAT = "86% vs 33% turning toward bids in Gottman's follow-up"

const PROTOCOL = {
  id: 'e2e-presence',
  slug: 'presence',
  title: 'Presence',
  subtitle: 'Give the person in front of you your attention.',
  description:
    '<p>You can be at the table, on the sofa or in the same room and still have your attention somewhere else. A message arrives, the next task is already in your head, or you start thinking about what to say before the other person has finished. This protocol works with the small moments where presence is either given or lost.</p>',
  pillar: 'connection',
  headline_stat: LONG_STAT,
  duration_weeks: 4,
  weeks: [],
  stats: [],
  protocol_sections: [],
  implementation_steps: [],
  implementation_guides: [],
}

async function mockedSession(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('claimn_access_token', 'e2e-access-token')
    localStorage.setItem('claimn_refresh_token', 'e2e-refresh-token')
    localStorage.setItem('claimn_expires_at', String(Math.floor(Date.now() / 1000) + 3600))
  })

  await page.route('**/api/v2/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    const json = (body: unknown) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      })

    if (path.endsWith('/auth/me')) {
      return json({
        id: 'e2e-user',
        email: 'e2e@claimn.co',
        user_type: 'member',
        has_password: true,
        profile: { display_name: 'E2E' },
      })
    }
    if (path.endsWith('/members/billing')) {
      return json({ data: { subscription: { tier: 'coaching', status: 'active' } } })
    }
    if (path.endsWith('/members/protocols/library/presence')) {
      return json({ data: PROTOCOL })
    }
    return json({ data: [] })
  })
}

test.describe('Protocol detail hero header', () => {
  test('description column keeps its width next to a long headline stat', async ({ page }) => {
    await mockedSession(page)
    await page.goto('/protocols/presence')

    await expect(page.getByRole('heading', { level: 1, name: 'Presence' })).toBeVisible({
      timeout: 15_000,
    })

    const metrics = await page.evaluate(() => {
      const label = Array.from(document.querySelectorAll('p')).find(
        (p) => p.textContent?.trim() === 'Expected Result',
      )
      const statCol = label?.parentElement
      const row = statCol?.parentElement
      const heading = row?.querySelector('h1')
      if (!statCol || !row || !heading) return null
      return {
        rowWidth: row.getBoundingClientRect().width,
        statWidth: statCol.getBoundingClientRect().width,
        titleWidth: heading.getBoundingClientRect().width,
        statText: statCol.textContent?.replace('Expected Result', '').trim() ?? '',
      }
    })

    expect(metrics, 'hero header with an "Expected Result" stat should render').not.toBeNull()
    const { rowWidth, statWidth, titleWidth, statText } = metrics!

    // Guard the premise: a short stat would make this test pass trivially.
    expect(statText, 'fixture stat should reach the header unchanged').toBe(LONG_STAT)

    expect(
      titleWidth / rowWidth,
      `title/description column is ${Math.round((titleWidth / rowWidth) * 100)}% of the header row`,
    ).toBeGreaterThan(0.5)

    expect(
      statWidth / rowWidth,
      `headline stat column is ${Math.round((statWidth / rowWidth) * 100)}% of the header row`,
    ).toBeLessThan(0.4)
  })
})
