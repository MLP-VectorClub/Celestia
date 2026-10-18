import { expect, test } from '@playwright/test';

import { validateBreadcrumbListJsonLd } from '../src/utils/structured-data';

const STUB = 'http://127.0.0.1:4010';

/** Pages that render breadcrumbs against the stub API, by kind: lists, a show entry, a guide, a profile, a tool and an admin page */
const PAGES = ['/show', '/episode/S1E1-Episode-S1E1', '/cg/pony', '/cg/pony/full', '/cg/picker', '/users/9001/contrib/requests'];

test.beforeEach(async ({ request }) => {
  const response = await request.post(`${STUB}/__control`, { data: { episodes: 3, others: 1 } });
  expect(response.ok()).toBe(true);
});

for (const path of PAGES) {
  test(`the structured data of ${path} is valid`, async ({ page }) => {
    await page.goto(path);
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.length, 'the page has structured data').toBeGreaterThan(0);
    for (const block of blocks) {
      const data = JSON.parse(block);
      if (data['@type'] === 'BreadcrumbList') expect(validateBreadcrumbListJsonLd(data)).toEqual([]);
    }
  });
}
