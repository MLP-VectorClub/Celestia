import { type APIRequestContext, type Page, expect, test } from '@playwright/test';

const STUB = 'http://127.0.0.1:4010';

interface Control {
  signedIn?: boolean;
  userRole?: string;
  usefulLinks?: Array<{ id: number; label: string; url: string; title: string | null; minRole: string }>;
}

const configure = async (request: APIRequestContext, control: Control) => {
  const response = await request.post(`${STUB}/__control`, { data: { episodes: 3, others: 1, ...control } });
  expect(response.ok()).toBe(true);
};

/** Without a cookie the server renders the page for a guest without asking the API who the visitor is */
const signInCookie = async (page: Page) =>
  page.context().addCookies([{ name: 'mlp_vector_club_session', value: 'e2e', url: 'http://127.0.0.1:4011' }]);

/** The links of the header navigation in the order they are shown (the sidebar has a copy for small screens that is hidden here) */
const headerLinks = (page: Page) => page.locator('header nav .nav-link, header .navbar-nav .nav-link').allTextContents();

test.describe('the header navigation follows the order of the old site', () => {
  test('for guests', async ({ page, request }) => {
    await configure(request, {});
    await page.goto('/show');
    expect((await headerLinks(page)).map((t) => t.trim())).toEqual([
      'Color Guides',
      'Latest Episode',
      'Show',
      'Events',
      'Members',
      'About',
      'MLP-VectorClub',
    ]);
  });

  test('for members: Home first, and Account before Members', async ({ page, request }) => {
    await configure(request, { signedIn: true, userRole: 'member' });
    await signInCookie(page);
    await page.goto('/show');
    expect((await headerLinks(page)).map((t) => t.trim())).toEqual([
      'Home',
      'Color Guides',
      'Latest Episode',
      'Show',
      'Events',
      'Account',
      'Members',
      'About',
      'MLP-VectorClub',
    ]);
  });

  test('for staff: Users and Admin after Account', async ({ page, request }) => {
    await configure(request, { signedIn: true, userRole: 'admin' });
    await signInCookie(page);
    await page.goto('/show');
    expect((await headerLinks(page)).map((t) => t.trim())).toEqual([
      'Home',
      'Color Guides',
      'Latest Episode',
      'Show',
      'Events',
      'Account',
      'Users',
      'Admin',
      'About',
      'MLP-VectorClub',
    ]);
  });

  test('Latest Episode is a working link', async ({ page, request }) => {
    await configure(request, {});
    await page.goto('/show');
    const link = page.getByRole('navigation').getByRole('link', { name: 'Latest Episode' }).first();
    await expect(link).toHaveAttribute('href', '/episode/latest');
    await expect(link).not.toHaveClass(/disabled/);
  });
});

test.describe('the useful links in the sidebar', () => {
  const usefulLinks = [
    { id: 1, label: 'Sprite template generator', url: '#sprite-tpl', title: null, minRole: 'guest' },
    { id: 2, label: 'Discord server', url: 'https://discord.example/join', title: 'Chat with us', minRole: 'guest' },
    { id: 3, label: 'Staff handbook', url: '/about', title: null, minRole: 'staff' },
  ];

  test('are listed in order for a signed in visitor', async ({ page, request }) => {
    await configure(request, { signedIn: true, userRole: 'member', usefulLinks });
    await signInCookie(page);
    await page.goto('/show');
    const links = page.locator('#sidebar .links');
    await expect(links.getByRole('heading', { name: 'Useful links' })).toBeVisible();
    await expect(links.getByRole('link')).toHaveText(['Sprite template generator', 'Discord server', 'Staff handbook']);
    await expect(links.getByRole('link', { name: 'Sprite template generator' })).toHaveAttribute('href', '/cg/sprite');
    await expect(links.getByRole('link', { name: 'Discord server' })).toHaveAttribute('href', 'https://discord.example/join');
  });

  test('are not shown to guests, who get none from the API', async ({ page, request }) => {
    await configure(request, { signedIn: false, usefulLinks });
    await page.goto('/show');
    await expect(page.locator('#sidebar')).toBeVisible();
    await expect(page.locator('#sidebar .links')).toHaveCount(0);
  });
});
