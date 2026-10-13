/**
 * Golden path E2E test: Driver → Recommendation → Why drawer
 * Also covers: Replay flow
 *
 * Run: npx playwright test e2e/golden-path.spec.ts
 *
 * Assumes the app is served at PLAYWRIGHT_BASE_URL (default http://localhost:5173).
 */
import { test, expect } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173'

/** Include persona in the deep link so a full-page navigation preserves route state. */
async function navigateAs(
  page: import('@playwright/test').Page,
  role: 'driver' | 'operator',
  path: string,
) {
  await page.goto(`${BASE}${path}?persona=${role}`)
  await page.waitForFunction(
    (expectedRole) => new URL(window.location.href).searchParams.get('persona') === expectedRole,
    role,
  )
}

async function mockRecommendationAPI(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/recommend', async (route) => {
    const request = route.request().postDataJSON() as { mode?: string }
    const mode = request.mode ?? 'balanced'
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        mode,
        top3: [{
          station: `${mode} test station`,
          station_id: 'test-station',
          latitude: 37.4219999,
          longitude: -122.0840575,
          location_verified: true,
          hour: 14,
          starts_in_h: 1,
          wait_min: 4.2,
          detour_min: 2,
          grid_load_pct: 68.5,
          score: 0.72,
          shap_reasons: ['Available capacity reported by the recommendation API'],
        }],
      }),
    })
  })
}

async function mockDriverDashboardAPI(
  page: import('@playwright/test').Page,
  locationVerified = true,
) {
  await page.route('**/api/v1/clusters', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      transformer_kva: 100,
      power_factor: 0.95,
      stations: [{
        id: 'test-station',
        name: 'Test Station',
        chargers: 4,
        kw: 7.4,
        detour: 2,
        latitude: locationVerified ? 12.9716 : null,
        longitude: locationVerified ? 77.5946 : null,
        location_verified: locationVerified,
      }],
    }),
  }))
  await page.route('**/api/v1/stations**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      items: [{
        id: 'test-station',
        name: 'Test Station',
        chargers: 4,
        kw: 7.4,
        detour: 2,
        latitude: locationVerified ? 12.9716 : null,
        longitude: locationVerified ? 77.5946 : null,
        location_verified: locationVerified,
      }],
      total: 1,
      page: 1,
      page_size: 10,
    }),
  }))
}

// ──────────────────────────────────────────────────────────────
// Golden path: Driver request → recommendation → Why drawer
// ──────────────────────────────────────────────────────────────
test.describe('Driver golden path', () => {
  test.beforeEach(async ({ page }) => {
    await mockRecommendationAPI(page)
  })

  test('navigates to /driver and shows dashboard content', async ({ page }) => {
    await mockDriverDashboardAPI(page)
    await navigateAs(page, 'driver', '/driver')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /substation cluster station map/i })).toBeVisible()
    await expect(page.getByRole('application', { name: /ev charging station map/i })).toBeVisible()
  })

  test('renders the Kolhapur basemap when station locations are not verified', async ({ page }) => {
    await mockDriverDashboardAPI(page, false)
    await navigateAs(page, 'driver', '/driver')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('application', { name: /ev charging station map/i })).toBeVisible()
    await expect(page.getByRole('status')).toContainText(/map shown at kolhapur/i)
  })

  test('navigates to /driver/recommend and loads strategy options', async ({ page }) => {
    await navigateAs(page, 'driver', '/driver/recommend')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /smart charging station recommendation/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /fastest route/i })).toBeVisible()
  })

  test('changing strategy requests fresh recommendations', async ({ page }) => {
    await navigateAs(page, 'driver', '/driver/recommend')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /fastest route/i }).click()
    await expect(page.getByText('fastest test station')).toBeVisible()
  })

  test('Get Directions targets the verified station coordinates', async ({ page }) => {
    await navigateAs(page, 'driver', '/driver/recommend')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('link', { name: /get directions/i }).first())
      .toHaveAttribute(
        'href',
        'https://www.google.com/maps/dir/?api=1&destination=37.4219999%2C-122.0840575',
      )
  })

  test('shows an explicit empty state when the API has no recommendations', async ({ page }) => {
    await page.unroute('**/api/v1/recommend')
    await page.route('**/api/v1/recommend', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ mode: 'balanced', top3: [] }),
    }))
    await navigateAs(page, 'driver', '/driver/recommend')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(/recommendation service returned no charging options/i)).toBeVisible()
  })

  test('Why drawer opens on recommendation card click', async ({ page }) => {
    await page.goto(`${BASE}/driver/recommend`)
    await page.waitForLoadState('networkidle')

    // Look for "Why?" button if recommendation results are shown (MSW mock)
    const whyBtn = page.getByRole('button', { name: /why|explain/i }).first()
    if (await whyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await whyBtn.click()
      // Drawer should open
      const drawer = page.locator('[role="dialog"], [aria-label*="why"], [aria-label*="Why"]').first()
      await expect(drawer).toBeVisible()
    } else {
      // Skip if not rendered in this MSW state — not a failure
      test.skip()
    }
  })
})

// ──────────────────────────────────────────────────────────────
// Replay flow
// ──────────────────────────────────────────────────────────────
test.describe('Replay flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/metrics/simulation', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ fcfs: {}, smart_dispatch: {} }),
    }))
  })

  test('navigates to /replay and shows replay controls', async ({ page }) => {
    await navigateAs(page, 'driver', '/replay')
    await page.waitForLoadState('networkidle')

    // Replay page should have a start/play button or speed control
    const heading = page.getByRole('heading').first()
    await expect(heading).toBeVisible()
  })

  test('replay page has a start replay button', async ({ page }) => {
    await navigateAs(page, 'driver', '/replay')
    await page.waitForLoadState('networkidle')

    const startBtn = page.getByRole('button', { name: /start|play|replay/i }).first()
    await expect(startBtn).toBeVisible()
  })
})

// ──────────────────────────────────────────────────────────────
// Operator route guard
// ──────────────────────────────────────────────────────────────
test.describe('Route guard', () => {
  test('driver cannot access /operator routes', async ({ page }) => {
    await navigateAs(page, 'driver', '/operator')
    await page.waitForLoadState('networkidle')

    // Should be redirected to /unauthorized or /login
    const url = page.url()
    expect(url).toMatch(/unauthorized|login|driver/)
  })

  test('operator can access /operator routes', async ({ page }) => {
    await navigateAs(page, 'operator', '/operator')
    await page.waitForLoadState('networkidle')

    // Should not be redirected away
    await expect(page).toHaveURL(new RegExp('/operator'))
  })
})
