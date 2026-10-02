import { type APIRequestContext, type Locator, type Page, expect, test } from '@playwright/test';

import { makeEpisodes, makeOthers, pageCount, titlesOnPage } from './show-fixtures.ts';

const STUB = 'http://127.0.0.1:4010';
const EPISODES = 'TV Episodes';
const OTHERS = 'Movies, Shorts & Specials';

interface Control {
  episodes: number;
  others: number;
  delays?: Array<{ table: 'episodes' | 'others'; page: number; ms: number }>;
}

const configure = async (request: APIRequestContext, control: Control) => {
  const response = await request.post(`${STUB}/__control`, { data: control });
  expect(response.ok()).toBe(true);
};

const requestLog = async (request: APIRequestContext) =>
  (await (await request.get(`${STUB}/__log`)).json()) as {
    log: Array<{ table: string; page: number; types: string[] }>;
    unhandled: string[];
  };

/** One of the two tables with its pagination: the column under that heading */
const column = (page: Page, heading: string): Locator =>
  page.getByRole('heading', { name: heading, exact: true }).locator('xpath=ancestor::div[contains(@class,"col")][1]');

const titles = (col: Locator) => col.locator('tbody a').allTextContents();
const activePage = async (col: Locator) =>
  (
    (await col
      .locator('nav li.active')
      .first()
      .textContent({ timeout: 2000 })
      .catch(() => null)) ?? ''
  ).trim();
const topNav = (col: Locator) => col.getByRole('navigation').first();
const goToPage = (col: Locator, n: number) =>
  topNav(col)
    .getByRole('link', { name: String(n), exact: true })
    .click();
const param = (page: Page, name: string) => new URL(page.url()).searchParams.get(name);

/** Waits until the table lists exactly these titles, on this page */
const expectPage = async (col: Locator, entries: ReturnType<typeof makeEpisodes>, pageNumber: number) => {
  await expect
    .poll(() => titles(col), { message: `titles on page ${pageNumber}`, timeout: 5000 })
    .toEqual(titlesOnPage(entries, pageNumber));
  if (pageCount(entries) > 1) await expect.poll(() => activePage(col), { message: 'active page', timeout: 5000 }).toBe(String(pageNumber));
};

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (error) => {
    throw error;
  });
});

const COMBINATIONS: Array<[string, number, number]> = [
  ['nothing at all', 0, 0],
  ['one page each', 5, 3],
  ['exactly one full page each', 8, 8],
  ['episodes on two pages, others on one', 9, 4],
  ['others on two pages, episodes on one', 4, 9],
  ['both on three pages', 17, 17],
  ['many episodes, a few others', 60, 12],
  ['few episodes, many others', 5, 40],
  ['both many', 60, 40],
  ['only episodes', 25, 0],
  ['only others', 0, 25],
];

for (const [name, episodeCount, otherCount] of COMBINATIONS) {
  test.describe(`${name} (${episodeCount} episodes, ${otherCount} movies, shorts and specials)`, () => {
    const episodes = makeEpisodes(episodeCount);
    const others = makeOthers(otherCount);
    const tables = [
      { heading: EPISODES, entries: episodes, param: 'eppage' },
      { heading: OTHERS, entries: others, param: 'page' },
    ];

    test.beforeEach(async ({ request }) => configure(request, { episodes: episodeCount, others: otherCount }));

    test('lists the first page of both tables', async ({ page }) => {
      await page.goto('/show');
      for (const { heading, entries } of tables) {
        const col = column(page, heading);
        await expectPage(col, entries, 1);
        // Pagination only shows up when there is more than one page
        await expect(topNav(col)).toHaveCount(pageCount(entries) > 1 ? 1 : 0);
      }
    });

    for (const { heading, entries, param: queryParam } of tables.filter((t) => pageCount(t.entries) > 1)) {
      test(`${heading}: steps forward through every page and back again`, async ({ page }) => {
        await page.goto('/show');
        const col = column(page, heading);
        const last = pageCount(entries);

        for (let n = 2; n <= last; n++) {
          await goToPage(col, n);
          await expectPage(col, entries, n);
          expect(param(page, queryParam)).toBe(String(n));
        }
        for (let n = last - 1; n >= 1; n--) {
          await goToPage(col, n);
          await expectPage(col, entries, n);
          expect(param(page, queryParam)).toBe(n === 1 ? null : String(n));
        }
      });
    }

    test('the other table stays on its page while one table changes pages', async ({ page }) => {
      const paged = tables.filter((t) => pageCount(t.entries) > 1);
      test.skip(paged.length < 2, 'needs two tables with more than one page');
      await page.goto('/show');
      const [first, second] = paged;
      await goToPage(column(page, first.heading), 2);
      await goToPage(column(page, second.heading), 2);
      await expectPage(column(page, first.heading), first.entries, 2);
      await expectPage(column(page, second.heading), second.entries, 2);
      expect(param(page, first.param)).toBe('2');
      expect(param(page, second.param)).toBe('2');
    });
  });
}

test.describe('page changes in a long list (60 episodes, 40 movies, shorts and specials)', () => {
  const episodes = makeEpisodes(60);
  const others = makeOthers(40);

  test.beforeEach(async ({ request }) => configure(request, { episodes: 60, others: 40 }));

  test('going from page 3 to page 2 shows page 2', async ({ page }) => {
    await page.goto('/show?eppage=3');
    const col = column(page, EPISODES);
    await expectPage(col, episodes, 3);
    await goToPage(col, 2);
    await expectPage(col, episodes, 2);
    expect(param(page, 'eppage')).toBe('2');
  });

  test('going from page 1 to page 3 and then to page 2 shows page 2', async ({ page }) => {
    await page.goto('/show');
    const col = column(page, EPISODES);
    await goToPage(col, 3);
    await expectPage(col, episodes, 3);
    await goToPage(col, 2);
    await expectPage(col, episodes, 2);
  });

  test('switching between pages 1 and 2 over and over always follows the click', async ({ page }) => {
    await page.goto('/show');
    const col = column(page, EPISODES);
    for (let i = 0; i < 6; i++) {
      await goToPage(col, 2);
      await expectPage(col, episodes, 2);
      await goToPage(col, 1);
      await expectPage(col, episodes, 1);
    }
  });

  test('every page change asks the API for that page instead of reusing what the server rendered', async ({ page, request }) => {
    await page.goto('/show');
    const col = column(page, EPISODES);
    await goToPage(col, 2);
    await expectPage(col, episodes, 2);
    const { log } = await requestLog(request);
    expect(log.filter((call) => call.table === 'episodes').map((call) => call.page)).toContain(2);
  });

  test('a page that was visited before shows the right content again', async ({ page }) => {
    await page.goto('/show');
    const col = column(page, EPISODES);
    for (const n of [2, 3, 2, 1, 3, 1, 2]) {
      await goToPage(col, n);
      await expectPage(col, episodes, n);
    }
  });

  test('the two tables keep their own page numbers in the address', async ({ page }) => {
    await page.goto('/show');
    await goToPage(column(page, OTHERS), 2);
    await expectPage(column(page, OTHERS), others, 2);
    expect(param(page, 'page')).toBe('2');
    expect(param(page, 'eppage')).toBeNull();

    await goToPage(column(page, EPISODES), 3);
    await expectPage(column(page, EPISODES), episodes, 3);
    expect(param(page, 'page')).toBe('2');
    expect(param(page, 'eppage')).toBe('3');

    await goToPage(column(page, EPISODES), 1);
    await expectPage(column(page, EPISODES), episodes, 1);
    expect(param(page, 'page')).toBe('2');
    expect(param(page, 'eppage')).toBeNull();
    await expectPage(column(page, OTHERS), others, 2);
  });

  test('the browser back and forward buttons follow the pages', async ({ page }) => {
    await page.goto('/show');
    const col = column(page, EPISODES);
    await goToPage(col, 2);
    await expectPage(col, episodes, 2);
    await goToPage(col, 3);
    await expectPage(col, episodes, 3);

    await page.goBack();
    await expectPage(col, episodes, 2);
    await page.goBack();
    await expectPage(col, episodes, 1);
    await page.goForward();
    await expectPage(col, episodes, 2);
    await page.goForward();
    await expectPage(col, episodes, 3);
  });

  test('opening a page directly and then moving on works too', async ({ page }) => {
    await page.goto('/show?eppage=4&page=3');
    await expectPage(column(page, EPISODES), episodes, 4);
    await expectPage(column(page, OTHERS), others, 3);
    await goToPage(column(page, EPISODES), 5);
    await expectPage(column(page, EPISODES), episodes, 5);
    await goToPage(column(page, OTHERS), 4);
    await expectPage(column(page, OTHERS), others, 4);
    await expectPage(column(page, EPISODES), episodes, 5);
  });

  test('reloading in the middle of the list shows that page', async ({ page }) => {
    await page.goto('/show');
    const col = column(page, EPISODES);
    await goToPage(col, 2);
    await goToPage(col, 3);
    await expectPage(col, episodes, 3);
    await page.reload();
    await expectPage(column(page, EPISODES), episodes, 3);
  });

  test('the jump to page box goes to the page that was typed', async ({ page }) => {
    await page.goto('/show');
    const col = column(page, EPISODES);
    await topNav(col).locator('.page-item-ellipsis button').first().click();
    await page.locator('.tooltip-go-to-page input').fill('6');
    await page.locator('.tooltip-go-to-page').getByRole('link', { name: 'Go' }).click();
    await expectPage(col, episodes, 6);
    expect(param(page, 'eppage')).toBe('6');
  });

  test('a slow answer for an earlier click does not replace a later page', async ({ page, request }) => {
    await configure(request, { episodes: 60, others: 40, delays: [{ table: 'episodes', page: 2, ms: 1200 }] });
    await page.goto('/show');
    const col = column(page, EPISODES);
    await goToPage(col, 2);
    await goToPage(col, 3);
    await expectPage(col, episodes, 3);
    await page.waitForTimeout(1800);
    await expectPage(col, episodes, 3);
    expect(param(page, 'eppage')).toBe('3');
  });

  test('a page number that is not valid shows the first page', async ({ page }) => {
    for (const bad of ['abc', '0', '-2', '1.5x']) {
      await page.goto(`/show?eppage=${bad}`);
      await expectPage(column(page, EPISODES), episodes, 1);
    }
  });

  test('a page past the end shows an empty table and does not break the page', async ({ page }) => {
    await page.goto('/show?eppage=99');
    await expect.poll(() => titles(column(page, EPISODES))).toEqual([]);
    await expectPage(column(page, OTHERS), others, 1);
  });

  test('the movies, shorts and specials table asks for all three kinds', async ({ page, request }) => {
    await page.goto('/show');
    const { log } = await requestLog(request);
    const call = log.find((entry) => entry.table === 'others');
    expect(call?.types.sort()).toEqual(['movie', 'short', 'special']);
  });
});
