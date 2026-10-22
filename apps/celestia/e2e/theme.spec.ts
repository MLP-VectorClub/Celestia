import { type Page, expect, test } from '@playwright/test';

const STUB = 'http://127.0.0.1:4010';
const APP = 'http://127.0.0.1:4011';
const COOKIE = 'mlpvc-theme';

const setThemeCookie = (context: import('@playwright/test').BrowserContext, value: string) =>
  context.addCookies([{ name: COOKIE, value, url: APP }]);
const htmlTheme = (page: Page) => page.locator('html').getAttribute('data-bs-theme');
const bodyBackground = (page: Page) => page.locator('html').evaluate((html) => getComputedStyle(html).getPropertyValue('--bs-body-bg').trim());
const themeCookie = async (context: import('@playwright/test').BrowserContext) =>
  (await context.cookies(APP)).find((cookie) => cookie.name === COOKIE)?.value;

const LIGHT_BODY_BG = '#fff';
const DARK_BODY_BG = '#212529';

test.beforeEach(async ({ request }) => {
  const response = await request.post(`${STUB}/__control`, { data: { episodes: 1, others: 0 } });
  expect(response.ok()).toBe(true);
});

// The server renders the saved choice, so none of this needs JavaScript
test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('a saved dark choice is in the first HTML', async ({ page, context, request }) => {
    await setThemeCookie(context, 'dark');
    const html = await (await request.get(`${APP}/show`, { headers: { cookie: `${COOKIE}=dark` } })).text();
    expect(html).toMatch(/<html[^>]* data-bs-theme="dark"/);
    expect(html).toContain('<meta name="color-scheme" content="dark"');

    await page.goto('/show');
    expect(await htmlTheme(page)).toBe('dark');
    expect(await bodyBackground(page)).toBe(DARK_BODY_BG);
  });

  test('a saved light choice stays light on a dark device', async ({ page, context }) => {
    await setThemeCookie(context, 'light');
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/show');
    expect(await htmlTheme(page)).toBe('light');
    expect(await bodyBackground(page)).toBe(LIGHT_BODY_BG);
  });

  test('without a choice the device decides, in CSS', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/show');
    expect(await htmlTheme(page)).toBeNull();
    expect(await bodyBackground(page)).toBe(DARK_BODY_BG);

    await page.emulateMedia({ colorScheme: 'light' });
    expect(await bodyBackground(page)).toBe(LIGHT_BODY_BG);
  });

  // These were statically generated once, which would have left the choice out of the HTML
  for (const path of ['/about', '/about/privacy', '/cg/sprite']) {
    test(`${path} is rendered with the saved choice`, async ({ page, context }) => {
      await setThemeCookie(context, 'dark');
      await page.goto(path);
      expect(await htmlTheme(page)).toBe('dark');
    });
  }

  test('the theme button is disabled, it needs JavaScript', async ({ page }) => {
    await page.goto('/show');
    await expect(page.locator('#sidebar').getByRole('button', { name: /^Color theme:/ })).toBeDisabled();
  });

  test('ignores a cookie with an unknown value', async ({ page, context }) => {
    await setThemeCookie(context, 'purple');
    await page.goto('/show');
    expect(await htmlTheme(page)).toBeNull();
  });
});

test('the 404 page, the same file for everybody, shows the saved choice once it runs', async ({ page, context }) => {
  await setThemeCookie(context, 'dark');
  await page.goto('/no-such-page');
  await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark');
});

// The switcher's button is disabled in the server's HTML and enabled after hydration, and its label comes from the browser: none of that may make
// the first browser render differ from the server's HTML (React reports that as error 418, 423 or 425 in a production build)
test.describe('hydration', () => {
  for (const saved of [null, 'dark', 'light']) {
    test(`reports no mismatch with ${saved ? `a saved ${saved} theme` : 'no saved theme'}`, async ({ page, context }) => {
      if (saved) await setThemeCookie(context, saved);
      const problems: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') problems.push(message.text());
      });
      page.on('pageerror', (error) => problems.push(error.message));

      await page.goto('/show');
      await expect(page.locator('#sidebar').getByRole('button', { name: /^Color theme:/ })).toBeEnabled();
      expect(problems.filter((text) => /hydrat|did not match|#418|#423|#425/i.test(text))).toEqual([]);
    });
  }
});

test.describe('the sidebar switcher', () => {
  // A button labelled with the current theme, opening a menu of the other two
  const toggle = (page: Page) => page.locator('#sidebar').getByRole('button', { name: /^Color theme:/ });
  const choose = async (page: Page, name: string) => {
    await toggle(page).click();
    await page.getByRole('menuitem', { name }).click();
  };

  test('is enabled once the page runs, and the server rendered it disabled', async ({ page, request }) => {
    const html = await (await request.get(`${APP}/show`)).text();
    const button = /<button[^>]*>/g.exec(html.slice(html.indexOf('aria-label="Color theme: System"') - 300)) ?? [''];
    expect(button[0]).toContain('aria-label="Color theme: System"');
    expect(button[0]).toContain('disabled=""');

    await page.goto('/show');
    await expect(toggle(page)).toBeEnabled();
  });

  test('is labelled with the current theme and lists the other two', async ({ page }) => {
    await page.goto('/show');
    await expect(toggle(page)).toHaveText('System');
    await toggle(page).click();
    await expect(page.getByRole('menuitem')).toHaveText(['Light', 'Dark']);

    await page.keyboard.press('Escape');
    await choose(page, 'Dark');
    await expect(toggle(page)).toHaveText('Dark');
    await toggle(page).click();
    await expect(page.getByRole('menuitem')).toHaveText(['System', 'Light']);
  });

  test('keeps the choice across reloads and goes back to system', async ({ page, context }) => {
    await page.goto('/show');

    await choose(page, 'Dark');
    expect(await htmlTheme(page)).toBe('dark');
    expect(await themeCookie(context)).toBe('dark');
    await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'dark');

    await page.reload();
    expect(await htmlTheme(page)).toBe('dark');
    await expect(toggle(page)).toHaveText('Dark');

    await choose(page, 'Light');
    expect(await htmlTheme(page)).toBe('light');
    expect(await bodyBackground(page)).toBe(LIGHT_BODY_BG);

    await choose(page, 'System');
    expect(await htmlTheme(page)).toBeNull();
    expect(await themeCookie(context)).toBeUndefined();
    await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'light dark');
  });

  test('follows the device while on system', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/show');
    expect(await bodyBackground(page)).toBe(DARK_BODY_BG);
    await page.emulateMedia({ colorScheme: 'light' });
    expect(await bodyBackground(page)).toBe(LIGHT_BODY_BG);
  });
});

// The breadcrumb bar and the sidebar are one blue band; they once came apart in dark because Bootstrap sets the breadcrumb's background
// variable on `.breadcrumb` itself, which a value set on its parent never reached
test.describe('the blue chrome', () => {
  const backgrounds = (page: Page) =>
    page.evaluate(() => ['#sidebar', '#breadcrumbs .breadcrumb', 'body'].map((selector) => getComputedStyle(document.querySelector(selector)!).backgroundColor));

  for (const choice of ['light', 'dark']) {
    test(`the sidebar, breadcrumbs and page edge match in ${choice}`, async ({ page, context }) => {
      await setThemeCookie(context, choice);
      await page.goto('/about');
      const [sidebar, breadcrumbs, body] = await backgrounds(page);
      expect(breadcrumbs).toBe(sidebar);
      expect(body).toBe(sidebar);
    });
  }

  test('and on a dark device with no saved choice', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/about');
    const [sidebar, breadcrumbs] = await backgrounds(page);
    expect(breadcrumbs).toBe(sidebar);
  });
});
