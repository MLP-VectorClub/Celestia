import { type Page, expect, test } from '@playwright/test';

const STUB = 'http://127.0.0.1:4010';
/** Items per page in the stub's lists */
const PER_PAGE = 5;
const COUNT = 12;

type List = 'changes' | 'tags' | 'events' | 'history' | 'personal' | 'contributions';

/** The paginated pages that change their page without a reload: the list they stub, where they are and what their items are called */
const PAGES: Array<{ name: string; list: List; path: string; item: string }> = [
  { name: 'major changes', list: 'changes', path: '/cg/pony/changes', item: 'Change' },
  { name: 'tags', list: 'tags', path: '/cg/pony/tags', item: 'Tag' },
  { name: 'events', list: 'events', path: '/events', item: 'Event' },
  { name: 'personal guide', list: 'personal', path: '/users/9001/cg', item: 'Pony' },
  { name: 'point history', list: 'history', path: '/users/9001/cg/point-history', item: 'Reason' },
  { name: 'contributions', list: 'contributions', path: '/users/9001/contrib/cms-provided', item: 'Pony' },
];

const expected = (item: string, pageNumber: number) =>
  Array.from(
    { length: Math.min(PER_PAGE, COUNT - (pageNumber - 1) * PER_PAGE) },
    (_, i) => `${item} ${String((pageNumber - 1) * PER_PAGE + i + 1).padStart(2, '0')}`
  );

const pagination = (page: Page) => page.getByRole('navigation', { name: 'pagination' }).first();
const goTo = (page: Page, n: number) =>
  pagination(page)
    .getByRole('button', { name: String(n), exact: true })
    .click();
const activePage = (page: Page) => pagination(page).locator('li.active').first().textContent();
const pageParam = (page: Page) => new URL(page.url()).searchParams.get('page');

/** The names of the items on the page, each once (some are linked twice) */
const names = async (page: Page, item: string) => {
  const found = await page.getByText(new RegExp(`^${item} \\d+$`)).allTextContents();
  return [...new Set(found.map((name) => name.trim()))];
};

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (error) => {
    throw error;
  });
});

for (const { name, list, path, item } of PAGES) {
  test.describe(`${name} pagination`, () => {
    test.beforeEach(async ({ request }) => {
      const response = await request.post(`${STUB}/__control`, { data: { lists: { [list]: COUNT } } });
      expect(response.ok()).toBe(true);
    });

    test('shows the page that was clicked, without a reload', async ({ page }) => {
      await page.goto(path);
      await expect.poll(() => names(page, item)).toEqual(expected(item, 1));

      await goTo(page, 2);
      await expect.poll(() => names(page, item)).toEqual(expected(item, 2));
      expect(pageParam(page)).toBe('2');
      await expect.poll(() => activePage(page)).toBe('2');

      await goTo(page, 3);
      await expect.poll(() => names(page, item)).toEqual(expected(item, 3));
      await expect.poll(() => activePage(page)).toBe('3');

      await goTo(page, 1);
      await expect.poll(() => names(page, item)).toEqual(expected(item, 1));
      expect(pageParam(page)).toBeNull();
      await expect.poll(() => activePage(page)).toBe('1');
    });

    test('opened on a later page, shows it and can go back to the first', async ({ page }) => {
      await page.goto(`${path}?page=2`);
      await expect.poll(() => names(page, item)).toEqual(expected(item, 2));
      await expect.poll(() => activePage(page)).toBe('2');

      await goTo(page, 1);
      await expect.poll(() => names(page, item)).toEqual(expected(item, 1));
      await expect.poll(() => activePage(page)).toBe('1');
    });

    test('follows the back and forward buttons', async ({ page }) => {
      await page.goto(path);
      await expect.poll(() => names(page, item)).toEqual(expected(item, 1));
      await goTo(page, 2);
      await expect.poll(() => names(page, item)).toEqual(expected(item, 2));

      await page.goBack();
      await expect.poll(() => names(page, item)).toEqual(expected(item, 1));
      await page.goForward();
      await expect.poll(() => names(page, item)).toEqual(expected(item, 2));
    });
  });
}
