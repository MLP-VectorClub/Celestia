import { type Locator, type Page, expect, test } from '@playwright/test';

const STUB = 'http://127.0.0.1:4010';
const PER_PAGE = 7;
const APPEARANCES = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  label: `Pony ${String(i + 1).padStart(2, '0')}`,
  nutshellNames: [] as string[],
}));
const labelsOnPage = (n: number) => APPEARANCES.slice((n - 1) * PER_PAGE, n * PER_PAGE).map((a) => a.label);

const names = (page: Page) => page.getByRole('link', { name: /^Pony \d+$/ }).allTextContents();
const topNav = (page: Page): Locator => page.getByRole('navigation', { name: 'pagination' }).first();
const activePage = (page: Page) => topNav(page).locator('li.active').first().textContent();

test.beforeEach(async ({ page, request }) => {
  page.on('pageerror', (error) => {
    throw error;
  });
  const response = await request.post(`${STUB}/__control`, { data: { signedIn: false, appearances: APPEARANCES } });
  expect(response.ok()).toBe(true);
});

test.describe('color guide pagination', () => {
  test('moves between pages without a reload and keeps the pagination visible', async ({ page }) => {
    await page.goto('/cg/pony');
    await expect.poll(() => names(page)).toEqual(labelsOnPage(1));

    await topNav(page).getByRole('button', { name: '2', exact: true }).click();
    await expect.poll(() => names(page)).toEqual(labelsOnPage(2));
    expect(new URL(page.url()).searchParams.get('page')).toBe('2');
    await expect.poll(() => activePage(page)).toBe('2');

    await topNav(page).getByRole('button', { name: '3', exact: true }).click();
    await expect.poll(() => names(page)).toEqual(labelsOnPage(3));
    await expect.poll(() => activePage(page)).toBe('3');

    await topNav(page).getByRole('button', { name: '1', exact: true }).click();
    await expect.poll(() => names(page)).toEqual(labelsOnPage(1));
    expect(new URL(page.url()).searchParams.has('page')).toBe(false);
  });

  test('renders the requested page on a direct visit and can go back from it', async ({ page }) => {
    await page.goto('/cg/pony?page=2');
    await expect.poll(() => names(page)).toEqual(labelsOnPage(2));
    await topNav(page).getByRole('button', { name: '1', exact: true }).click();
    await expect.poll(() => names(page)).toEqual(labelsOnPage(1));
  });

  test('does not scroll to the top when the page changes, which is what phones do on every press', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 400 });
    // The router scrolls with window.scrollTo(0, 0), which the page's smooth scrolling then animates, so the calls are recorded instead of the position
    await page.addInitScript(() => {
      const calls: unknown[][] = [];
      (window as unknown as { __scrollCalls: unknown[][] }).__scrollCalls = calls;
      const original = window.scrollTo.bind(window);
      window.scrollTo = ((...args: unknown[]) => {
        calls.push(args);
        return (original as (...a: unknown[]) => void)(...args);
      }) as typeof window.scrollTo;
    });
    await page.goto('/cg/pony');
    await expect.poll(() => names(page)).toEqual(labelsOnPage(1));
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await page.evaluate(() => ((window as unknown as { __scrollCalls: unknown[][] }).__scrollCalls.length = 0));

    await page.getByRole('navigation', { name: 'pagination' }).last().getByRole('button', { name: '2', exact: true }).click();
    await expect.poll(() => names(page)).toEqual(labelsOnPage(2));
    expect(await page.evaluate(() => (window as unknown as { __scrollCalls: unknown[][] }).__scrollCalls)).toEqual([]);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  });
});
