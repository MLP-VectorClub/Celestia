import { expect, test } from '@playwright/test';

const STUB = 'http://127.0.0.1:4010';

/** The footer is fixed to the bottom of the window on wide screens, so the page keeps room for it below the content */
const mainPaddingBottom = (page: import('@playwright/test').Page) =>
  page.locator('#main').evaluate((main) => parseFloat(getComputedStyle(main).paddingBottom));

test.beforeEach(async ({ request }) => {
  const response = await request.post(`${STUB}/__control`, { data: { episodes: 1, others: 0 } });
  expect(response.ok()).toBe(true);
});

test.describe('the content area', () => {
  test('leaves room for the fixed footer below the last content', async ({ page }) => {
    await page.goto('/show');
    const footerHeight = (await page.locator('#footer').boundingBox())!.height;
    expect(await mainPaddingBottom(page)).toBeGreaterThanOrEqual(footerHeight);
  });

  test('the last link of a long page can be clicked, it is not under the footer', async ({ page }) => {
    await page.goto('/episode/S1E1-Episode-S1E1');
    await page.getByRole('link', { name: 'All shows' }).click();
    await page.waitForURL(/\/show/);
  });

  test('the color picker fills the area without spacing', async ({ page }) => {
    await page.goto('/cg/picker');
    expect(await mainPaddingBottom(page)).toBe(0);
    expect(await page.locator('#main').evaluate((main) => parseFloat(getComputedStyle(main).paddingLeft))).toBe(0);
  });
});
