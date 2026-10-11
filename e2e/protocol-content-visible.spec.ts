import { test, expect, type Page } from '@playwright/test'

/**
 * Consumer gate: does the member portal actually SHOW what the corpus writes?
 *
 * Max, 2026-10-11: "I cant read the full protocols in the member-spa ... I am
 * quite sure not all content is shown". He was right, three times over, and
 * every producer-side check passed throughout:
 *
 *   - the database rows were verified field by field by the backend agent
 *   - the API serves all 16 translatable columns, measured
 *   - claimn-web's protocol-check.mjs ran 18 checks clean on every payload
 *
 * None of them could see the renderer. 25 of the 30 protocols are members-only,
 * so this page is the ONLY surface for most of the corpus, and three things
 * were hidden here while being correct everywhere else:
 *
 *   1. every implementation guide was collapsed by default, and opening one
 *      closed the other — the method of the protocol, behind a click
 *   2. `counts` and `cadence` were absent from the SuccessMetric type, so each
 *      measure showed a name and a number but not what reaching it means or
 *      when it is recorded
 *   3. guide items were flattened to `label: detail` strings, discarding the
 *      `note` field — so every footnote in the corpus rendered nowhere
 *
 * A second pass over the same page, same day, found three more:
 *
 *   4. the Scientific Foundation block was sliced to 300 characters behind a
 *      "Read more" — every block in the corpus is several times that
 *   5. only the current week's accordion was open, and `currentWeek` falls back
 *      to 1 on an unstarted protocol, so weeks 2..N of the plan were invisible
 *   6. `sub_category` — one of the 16 translatable columns, "Bio & Peptides" on
 *      the five peptide tracks — reached the client and was dropped
 *
 * Fully mocked: no credentials.
 */

const PROTOCOL = {
  id: 'e2e-guides',
  slug: 'presence',
  title: 'Presence',
  subtitle: 'Give the person in front of you your attention.',
  description: '<p>Short description.</p>',
  pillar: 'connection',
  sub_category: 'Bio & Peptides',
  headline_stat: '86% response to bids',
  duration_weeks: 4,
  scientific_foundation:
    'Loneliness raises mortality risk by about as much as smoking fifteen cigarettes a day, and the mechanism is not sadness but threat: a brain that reads the social world as unsafe runs its stress systems hotter, sleeps worse and repairs less. The intervention that moves the number is not more contact but contact that is answered. This sentence exists past the 300-character mark and must be on the page without a click.',
  scientific_citations: ['Holt-Lunstad et al., PLoS Medicine (2010)'],
  weeks: [
    { week: 1, title: 'Notice the bids', description: 'Week one.', tasks: [{ id: 't1', title: 'Log one bid a day' }] },
    { week: 2, title: 'Answer them', description: 'Week two.', tasks: [{ id: 't2', title: 'Turn toward three bids' }] },
    { week: 3, title: 'Make your own', description: 'Week three.', tasks: [{ id: 't3', title: 'Reach for contact once a day' }] },
    { week: 4, title: 'Hold the pattern', description: 'Week four.', tasks: [{ id: 't4', title: 'Review the week' }] },
  ],
  stats: [],
  protocol_sections: [],
  implementation_steps: [],
  success_metrics: [
    {
      kind: 'leading',
      title: 'Responses to bids',
      target: 'At least 5 a week',
      counts: 'Times you noticed a bid and turned toward it.',
      cadence: 'Every week, from week 1',
    },
  ],
  implementation_guides: [
    {
      title: 'A response to the small bids',
      icon: 'Heart',
      items: [
        { label: 'Notice', detail: 'Catch the moment your partner reaches for contact.', note: 'The Gottman Institute' },
        { label: 'Turn toward', detail: 'Answer it, however briefly.' },
      ],
    },
    {
      title: 'A weekly stretch where the child decides',
      icon: 'Star',
      items: [
        { label: 'Hand it over', detail: 'Let the child choose what you do.', note: 'ZERO TO THREE' },
      ],
    },
  ],
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
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    if (path.endsWith('/auth/me'))
      return json({ id: 'e2e-user', email: 'e2e@claimn.co', user_type: 'member', has_password: true, profile: { display_name: 'E2E' } })
    if (path.endsWith('/members/billing')) return json({ data: { subscription: { tier: 'coaching', status: 'active' } } })
    if (path.endsWith('/members/protocols/library/presence')) return json({ data: PROTOCOL })
    return json({ data: [] })
  })
}

test.describe('Protocol detail — all content is visible', () => {
  test.beforeEach(async ({ page }) => {
    await mockedSession(page)
    await page.goto('/protocols/presence')
    await expect(page.getByRole('heading', { level: 1, name: 'Presence' })).toBeVisible({ timeout: 15_000 })
  })

  test('every guide is open on arrival, without a click', async ({ page }) => {
    // The defect: useState(null) meant all guides started collapsed, so a
    // member saw headings and no method.
    await expect(page.getByText('Catch the moment your partner reaches for contact.')).toBeVisible()
    await expect(page.getByText('Let the child choose what you do.')).toBeVisible()
  })

  test('two guides can be open at the same time', async ({ page }) => {
    // The defect: `expandedId === guideId ? null : guideId` meant opening one
    // closed the other, so two guides could never be read together.
    const a = page.getByText('Answer it, however briefly.')
    const b = page.getByText('Let the child choose what you do.')
    await expect(a).toBeVisible()
    await expect(b).toBeVisible()
  })

  test('a measure shows all four parts, not just name and number', async ({ page }) => {
    await expect(page.getByText('Responses to bids')).toBeVisible()
    await expect(page.getByText('At least 5 a week')).toBeVisible()
    await expect(page.getByText('Times you noticed a bid and turned toward it.')).toBeVisible()
    await expect(page.getByText('Every week, from week 1')).toBeVisible()
  })

  test('footnotes render, numbered across the protocol rather than per guide', async ({ page }) => {
    await expect(page.getByText('The Gottman Institute')).toBeVisible()
    await expect(page.getByText('ZERO TO THREE')).toBeVisible()
    // Two different sources in two different guides must not both be `*`.
    const markers = await page.locator('sup').allTextContents()
    expect(markers).toEqual(['*', '**'])
  })

  test('the scientific foundation is shown in full, not sliced at 300 characters', async ({ page }) => {
    // The defect: a 300-character slice plus "..." behind a "Read more" button.
    // This sentence sits past that cut, so its visibility IS the assertion.
    await expect(
      page.getByText('This sentence exists past the 300-character mark and must be on the page without a click.')
    ).toBeVisible()
    await expect(page.getByText('Show less')).toBeVisible()
    await expect(page.getByText('Read more')).toHaveCount(0)
  })

  test('every week of the plan is open, not only week 1', async ({ page }) => {
    // The defect: useState(week.week === currentWeek), and currentWeek falls
    // back to 1 when nobody has started the protocol — so weeks 2, 3 and 4 of
    // the plan were behind three separate clicks.
    await expect(page.getByText('Log one bid a day')).toBeVisible()
    await expect(page.getByText('Turn toward three bids')).toBeVisible()
    await expect(page.getByText('Reach for contact once a day')).toBeVisible()
    await expect(page.getByText('Review the week')).toBeVisible()
  })

  test('the sub-pillar is shown, and the duration is not printed twice', async ({ page }) => {
    await expect(page.getByText('Bio & Peptides')).toBeVisible()
    // duration_weeks is 4 and the plan has 4 weeks, so the second, redundant
    // "N weeks" must not appear at all.
    await expect(page.getByText('4 weeks', { exact: true })).toHaveCount(1)
  })
})
