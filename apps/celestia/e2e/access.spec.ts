import { type APIRequestContext, type Page, expect, test } from '@playwright/test';

const STUB = 'http://127.0.0.1:4010';

interface Control {
  signedIn?: boolean;
  userRole?: string;
}

const configure = async (request: APIRequestContext, control: Control) => {
  const response = await request.post(`${STUB}/__control`, { data: { episodes: 1, others: 0, ...control } });
  expect(response.ok()).toBe(true);
};

/** Without a cookie the server renders the page for a guest without asking the API who the visitor is */
const signInCookie = async (page: Page) =>
  page.context().addCookies([{ name: 'mlp_vector_club_session', value: 'e2e', url: 'http://127.0.0.1:4011' }]);

test.describe('pages that are not for everybody answer 403 with the reason', () => {
  for (const path of ['/admin', '/admin/logs', '/admin/notices', '/admin/useful-links', '/admin/settings']) {
    test(`${path} is for staff only: guests and members get 403`, async ({ page, request }) => {
      await configure(request, {});
      const guest = await page.goto(path);
      expect(guest?.status()).toBe(403);
      await expect(page.getByText('Error 403!')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Access denied' })).toBeVisible();

      await configure(request, { signedIn: true, userRole: 'member' });
      await signInCookie(page);
      const member = await page.goto(path);
      expect(member?.status()).toBe(403);
    });
  }

  test('staff get the admin pages', async ({ page, request }) => {
    await configure(request, { signedIn: true, userRole: 'admin' });
    await signInCookie(page);
    for (const path of ['/admin', '/admin/logs', '/admin/useful-links']) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.getByText('Error 403!')).toHaveCount(0);
    }
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Admin Area' })).toBeVisible();
  });

  test('the account settings of a user are for that user only', async ({ page, request }) => {
    await configure(request, {});
    const guest = await page.goto('/users/9001/account');
    expect(guest?.status()).toBe(403);
    await expect(page.getByText('Error 403!')).toBeVisible();

    await configure(request, { signedIn: true, userRole: 'user' });
    await signInCookie(page);
    const owner = await page.goto('/users/9001/account');
    expect(owner?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'Account Settings' })).toBeVisible();

    const other = await page.goto('/users/9002/account');
    expect(other?.status()).toBe(403);
  });

  test('the requests of a user are not shown to others, who are told there is no such page', async ({ page, request }) => {
    await configure(request, {});
    expect((await page.goto('/users/9001/contrib/requests'))?.status()).toBe(404);

    await configure(request, { signedIn: true, userRole: 'user' });
    await signInCookie(page);
    expect((await page.goto('/users/9001/contrib/requests'))?.status()).toBe(200);
    expect((await page.goto('/users/9001/contrib/reservations'))?.status()).toBe(200);
  });
});
