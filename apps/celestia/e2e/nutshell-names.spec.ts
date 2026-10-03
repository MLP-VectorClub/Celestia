import { type APIRequestContext, type Page, expect, test } from '@playwright/test';

const STUB = 'http://127.0.0.1:4010';

const APPEARANCES = [
  { id: 1, label: 'Twilight Sparkle', nutshellNames: ['twily', 'sparkle butt'], characterTags: ['Twilight', 'Princess Twilight Sparkle'] },
  { id: 2, label: 'Rarity', nutshellNames: [] as string[] },
  { id: 3, label: 'Pinkie Pie', nutshellNames: ['pie face'] },
];

const configure = async (request: APIRequestContext, nutshell: boolean, signedIn = true) => {
  const response = await request.post(`${STUB}/__control`, { data: { signedIn, nutshell, appearances: APPEARANCES } });
  expect(response.ok()).toBe(true);
};

/** Without a cookie the server renders the page for a guest without asking the API who the visitor is */
const signInCookie = async (page: Page) =>
  page.context().addCookies([{ name: 'mlp_vector_club_session', value: 'e2e', url: 'http://127.0.0.1:4011' }]);

const names = (page: Page) => page.locator('h5 a').allTextContents();

test.describe('nutshell names on the guide list', () => {
  test('are not used unless the visitor turned them on', async ({ page, request }) => {
    await configure(request, false);
    await signInCookie(page);
    await page.goto('/cg/pony');
    await expect.poll(() => names(page)).toEqual(['Twilight Sparkle', 'Rarity', 'Pinkie Pie']);
    await expect(page.locator('body')).not.toHaveClass(/nutshell-names/);
    await expect(page.locator('link[href*="Comic+Neue"]')).toHaveCount(0);
  });

  test('replace the label with one of the names, or the lowercased label when there are none', async ({ page, request }) => {
    await configure(request, true);
    await signInCookie(page);
    await page.goto('/cg/pony');
    await expect.poll(async () => (await names(page))[1]).toBe('rarity');
    const [twilight, , pinkie] = await names(page);
    expect(['twily', 'sparkle butt']).toContain(twilight);
    expect(pinkie).toBe('pie face');
    // The links still go to the real address of the appearance
    await expect(page.locator('h5 a').first()).toHaveAttribute('href', /\/cg\/pony\/v\/1-Twilight-Sparkle/);
    // In the look of the event: the body class and the font of the old site
    await expect(page.locator('body')).toHaveClass(/nutshell-names/);
    await expect(page.locator('link[href*="Comic+Neue"]')).toHaveCount(1);
  });

  test('can pick the other name now and then, over several visits', async ({ page, request }) => {
    await configure(request, true);
    await signInCookie(page);
    const seen = new Set<string>();
    for (let i = 0; i < 12 && seen.size < 2; i++) {
      await page.goto('/cg/pony');
      await expect.poll(async () => (await names(page))[1]).toBe('rarity');
      seen.add((await names(page))[0]);
    }
    expect([...seen].sort()).toEqual(['sparkle butt', 'twily']);
  });

  test('are never used for signed out visitors', async ({ page, request }) => {
    await configure(request, true, false);
    await page.goto('/cg/pony');
    await expect.poll(() => names(page)).toEqual(['Twilight Sparkle', 'Rarity', 'Pinkie Pie']);
  });
});

test.describe('nutshell names on the full list', () => {
  test('rename the cards and list the real label as another name of the renamed ones', async ({ page, request }) => {
    await configure(request, true);
    await signInCookie(page);
    await page.goto('/cg/pony/full');
    const cards = page.locator('a.card');
    await expect.poll(async () => (await cards.locator('h3').allTextContents()).includes('rarity')).toBe(true);

    const headings = await cards.locator('h3').allTextContents();
    expect(headings).toHaveLength(3);
    // Twilight Sparkle was renamed and has character tags: AKA lists her real label first, in lowercase
    await expect(cards.nth(0)).toContainText('AKA twilight sparkle');
    // Rarity has no names of its own: nothing to be known as
    await expect(cards.nth(1)).not.toContainText('AKA');
    // Pinkie Pie has a name but no character tags: the real label is still listed
    await expect(cards.nth(2)).toContainText('AKA pinkie pie');
  });

  test('keep the real labels when the mode is off', async ({ page, request }) => {
    await configure(request, false);
    await signInCookie(page);
    await page.goto('/cg/pony/full');
    await expect(page.locator('a.card h3')).toHaveText(['Twilight Sparkle', 'Rarity', 'Pinkie Pie']);
    await expect(page.locator('a.card').first()).not.toContainText('AKA twilight sparkle');
  });
});
