import { type APIRequestContext, expect, test } from '@playwright/test';

const STUB = 'http://127.0.0.1:4010';

interface Control {
  episodes?: number;
  others?: number;
  failures?: Array<{ path: string; status: number; retryAfter?: number }>;
}

const configure = async (request: APIRequestContext, control: Control) => {
  const response = await request.post(`${STUB}/__control`, { data: { episodes: 12, others: 4, ...control } });
  expect(response.ok()).toBe(true);
};

test.describe('pages whose data could not be fetched', () => {
  test('answer 429 with the rate limit message and the wait, and unlock the button when the wait is over', async ({ page, request }) => {
    await configure(request, { failures: [{ path: '/show', status: 429, retryAfter: 3 }] });
    const response = await page.goto('/show');

    expect(response?.status()).toBe(429);
    expect(response?.headers()['retry-after']).toBe('3');
    await expect(page.getByRole('heading', { name: 'Too many requests' })).toBeVisible();
    await expect(page.getByRole('alert').filter({ hasText: 'Too many requests' })).toContainText(
      'Too many requests, please try again in 3 seconds.'
    );
    const retry = page.getByRole('button', { name: 'Try again' });
    await expect(retry).toBeDisabled();
    // Unlocks by itself, nothing else is touched
    await expect(retry).toBeEnabled({ timeout: 6000 });
    // Not the show list, and not a missing page
    await expect(page.getByRole('table')).toHaveCount(0);
    await expect(page.getByText('404')).toHaveCount(0);
  });

  test('try again shows the page once the API answers again', async ({ page, request }) => {
    await configure(request, { failures: [{ path: '/show', status: 429, retryAfter: 1 }] });
    await page.goto('/show');
    await expect(page.getByRole('button', { name: 'Try again' })).toBeEnabled({ timeout: 5000 });

    await configure(request, {});
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByRole('heading', { name: 'TV Episodes', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Episode S1E12' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Too many requests' })).toHaveCount(0);
  });

  test('a rate limit without a wait time says to try later and does not lock the button', async ({ page, request }) => {
    await configure(request, { failures: [{ path: '/show', status: 429 }] });
    const response = await page.goto('/show');
    expect(response?.status()).toBe(429);
    expect(response?.headers()['retry-after']).toBeUndefined();
    await expect(page.getByRole('alert').filter({ hasText: 'Too many requests' })).toContainText('please try again in a little while');
    await expect(page.getByRole('button', { name: 'Try again' })).toBeEnabled();
  });

  test('answer 503 when the API is down', async ({ page, request }) => {
    await configure(request, { failures: [{ path: '/show', status: 503 }] });
    const response = await page.goto('/show');
    expect(response?.status()).toBe(503);
    await expect(page.getByRole('heading', { name: 'Temporarily unavailable' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try again' })).toBeEnabled();
  });

  test('answer 500 when the API fails', async ({ page, request }) => {
    await configure(request, { failures: [{ path: '/show', status: 500 }] });
    const response = await page.goto('/show');
    expect(response?.status()).toBe(500);
    await expect(page.getByRole('heading', { name: 'Something went wrong' })).toBeVisible();
    await expect(page.getByText('Error 500!')).toBeVisible();
  });

  test('an episode page that cannot look its episode up answers with the failure, not 404', async ({ page, request }) => {
    await configure(request, { failures: [{ path: '/show', status: 429, retryAfter: 5 }] });
    const response = await page.goto('/episode/S1E1-Episode-S1E1');
    expect(response?.status()).toBe(429);
    await expect(page.getByRole('alert').filter({ hasText: 'Too many requests' })).toContainText('try again in 5 seconds');
  });

  test('a missing episode is still a 404', async ({ page, request }) => {
    await configure(request, {});
    const response = await page.goto('/episode/S9E99-Nope');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Too many requests' })).toHaveCount(0);
  });

  test('a page that loads fine is still a 200', async ({ page, request }) => {
    await configure(request, {});
    const response = await page.goto('/show');
    expect(response?.status()).toBe(200);
  });
});
