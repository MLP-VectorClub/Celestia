import AxeBuilder from '@axe-core/playwright';
import { type Page, expect, test } from '@playwright/test';

const STUB = 'http://127.0.0.1:4010';
const APP = 'http://127.0.0.1:4011';

/** Pages a signed out visitor sees, with the stub holding enough data for lists and cards to show */
const PUBLIC_PAGES = [
  '/show',
  '/episode/S1E1-Episode-S1E1',
  '/events',
  '/cg',
  '/cg/pony',
  '/cg/pony/full',
  '/cg/pony/tags',
  '/cg/pony/changes',
  '/cg/picker',
  '/cg/blending',
  '/cg/blending-reverse',
  '/about',
  '/about/privacy',
  '/users',
  '/components',
];
const MEMBER_PAGES = ['/users/9001/account', '/admin'];

const THEMES = [
  { name: 'light', cookie: 'light', scheme: 'light' },
  { name: 'dark', cookie: 'dark', scheme: 'light' },
  // No saved choice, the device is dark: the CSS media query decides
  { name: 'system (dark device)', cookie: null, scheme: 'dark' },
] as const;

const APPEARANCES = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1,
  label: `Pony ${i + 1}`,
  nutshellNames: [],
  characterTags: ['Twilight Sparkle'],
}));

/**
 * Failures of WCAG AA text contrast (axe's color-contrast rule), described so a failing run says what to change.
 *
 * Axe reports what it cannot work out as "incomplete" instead of failing it, which would leave a lot unchecked, so some things are done to let
 * it see: the window is made as tall as the page (it cannot place what is below the fold), the 7% grid of the page area is switched off, rounded corners are squared (at a corner the point under the mouse is the parent, which axe takes for an overlap), transitions are (a dialog that is still fading in has blended colors), and the header
 * and footer are hidden. Those two are translucent and overlap the page, which axe cannot resolve: their text is checked in
 * `src/scss/__tests__/theme-contrast.test.ts` against the worst backdrop (white). Whatever axe still cannot work out is a failure too, except
 * for `UNDETERMINED_OK`: elements on pictures, a glyph that is not text, and elements whose text is the plain body text on the body background
 * (form fields with Bootstrap's background icon, the cards of the full list), which the test above covers.
 */
const UNDETERMINED_OK = [
  /\.user-name/,
  /^select$/,
  /arrow$/,
  /^#components-(select|valid|invalid)$/,
  // The text of the full list's cards: body text (a line of it at 75%) on the card's body background, which axe reports as overlapped although
  // nothing is (the hit test is clean)
  /^a\[href\$="[^"]*"\] > \.p-2\.[\w-]*cardBody\.card-body( > .*)?$/,
  // The captions in the pills tinted by a vector app: the app's icon is a pseudo element over the pill, which axe cannot see through. Their colors
  // are fixed, checked against every pill background in `src/scss/__tests__/user-pill-contrast.test.ts`
  /^\.app-\w+ > .*__caption$/,
  // The two buttons above the full list, the same white-on-teal buttons as the ones audited on /cg
  /^\.btn-guide-link\.btn-sm\[href\$="pony"\]$/,
  /^a\[href\$="changes"\]$/,
];

const contrastProblems = async (page: Page) => {
  await page.addStyleTag({
    content: '#main { background-image: none !important; } *, *::before, *::after { transition: none !important; animation: none !important; border-radius: 0 !important; } #header, #footer { visibility: hidden !important; }',
  });
  // Axe cannot place what is below the fold either: the window is made as tall as the page
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: 1280, height: Math.min(Math.max(height, 720), 8000) });
  await page.waitForTimeout(300);
  const { violations, incomplete } = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
  const describe = (node: (typeof violations)[number]['nodes'][number]) => {
    const data = (node.any[0]?.data ?? {}) as { fgColor?: string; bgColor?: string; contrastRatio?: number; expectedContrastRatio?: string };
    return `${node.target.join(' ')}: ${data.fgColor} on ${data.bgColor} = ${data.contrastRatio} (needs ${data.expectedContrastRatio})`;
  };
  const undetermined = incomplete
    .flatMap((result) => result.nodes)
    .filter((node) => !UNDETERMINED_OK.some((ok) => ok.test(node.target.join(' '))))
    .map((node) => `${node.target.join(' ')}: could not be checked (${node.any[0]?.message ?? 'unknown'})`);
  return [...violations.flatMap((violation) => violation.nodes.map(describe)), ...undetermined];
};

for (const theme of THEMES) {
  test.describe(`${theme.name} theme`, () => {
    test.beforeEach(async ({ page, context, request }) => {
      await page.emulateMedia({ colorScheme: theme.scheme });
      if (theme.cookie) await context.addCookies([{ name: 'mlpvc-theme', value: theme.cookie, url: APP }]);
      const control = { episodes: 3, others: 2, appearances: APPEARANCES, lists: { changes: 6, tags: 6, events: 6, history: 6, personal: 6, contributions: 6 } };
      expect((await request.post(`${STUB}/__control`, { data: { ...control, signedIn: false } })).ok()).toBe(true);
    });

    for (const path of PUBLIC_PAGES) {
      test(`${path} has enough text contrast`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        // The page itself: a redirect or an error page would check the wrong thing
        expect(new URL(page.url()).pathname).toBe(path);
        expect(await contrastProblems(page)).toEqual([]);
      });
    }

    test('the open theme menu has enough text contrast', async ({ page }) => {
      await page.goto('/show');
      await page.locator('#sidebar').getByRole('button', { name: /^Color theme:/ }).click();
      await expect(page.getByRole('menuitem').first()).toBeVisible();
      expect(await contrastProblems(page)).toEqual([]);
    });

    test('the sign in dialog has enough text contrast', async ({ page }) => {
      await page.goto('/show');
      await page.getByRole('button', { name: /sign in/i }).first().click();
      await expect(page.getByRole('dialog')).toBeVisible();
      expect(await contrastProblems(page)).toEqual([]);
    });

    for (const path of MEMBER_PAGES) {
      test(`${path} has enough text contrast when signed in`, async ({ page, context, request }) => {
        await context.addCookies([{ name: 'mlp_vector_club_session', value: 'e2e', url: APP }]);
        await request.post(`${STUB}/__control`, {
          data: { episodes: 1, others: 0, signedIn: true, userRole: 'admin', appearances: APPEARANCES, lists: { history: 6 } },
        });
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        // The real page, not the "403 Unauthorized" a missing session shows
        await expect(page.getByRole('heading', { name: '403 Unauthorized' })).toHaveCount(0);
        expect(await contrastProblems(page)).toEqual([]);
      });
    }
  });
}
