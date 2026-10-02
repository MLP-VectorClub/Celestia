import { type APIRequestContext, type Page, expect, test } from '@playwright/test';

const STUB = 'http://127.0.0.1:4010';
const EPISODE = '/episode/S1E1-Episode-S1E1';

interface Control {
  signedIn?: boolean;
  userVote?: number | null;
  votes?: Record<string, number>;
  alreadyVoted?: boolean;
  aired?: boolean;
}

const configure = async (request: APIRequestContext, control: Control) => {
  const response = await request.post(`${STUB}/__control`, { data: { episodes: 3, others: 0, ...control } });
  expect(response.ok()).toBe(true);
};

/** Without a cookie the server renders the page for a guest without asking the API who the visitor is */
const signInCookie = async (page: Page) =>
  page.context().addCookies([{ name: 'mlp_vector_club_session', value: 'e2e', url: 'http://127.0.0.1:4011' }]);

const sidebar = (page: Page) => page.locator('#sidebar');
const voting = (page: Page) => sidebar(page).locator('#voting');

test.describe('the rating of an episode', () => {
  test('is a sidebar section with the average and a totals link, and the totals stay hidden until asked for', async ({ page, request }) => {
    await configure(request, { votes: { '1': 1, '4': 2, '5': 5 } });
    await page.goto(EPISODE);

    await expect(voting(page)).toBeVisible();
    await expect(voting(page).getByRole('heading', { name: 'Rating' })).toBeVisible();
    await expect(voting(page)).toContainText('This episode is rated 4.25/5');
    await expect(voting(page).getByRole('img', { name: 'Rated 4.25 out of 5' })).toBeVisible();
    // Nothing about the totals on the page itself
    await expect(page.getByText(/votes? in total/)).toHaveCount(0);
    await expect(page.getByText("Here's how the votes are distributed")).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    // And it is not part of the page content
    await expect(page.locator('#content, main').locator('#voting')).toHaveCount(0);
  });

  test('opens the totals in a dialog when the link is clicked, and closes it again', async ({ page, request }) => {
    await configure(request, { votes: { '1': 1, '4': 2, '5': 5 } });
    await page.goto(EPISODE);

    await voting(page).getByRole('button', { name: 'Show totals' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Voting details')).toBeVisible();
    await expect(dialog.getByText("Here's how the votes are distributed:")).toBeVisible();
    await expect(dialog.getByText('1 muffin:')).toBeVisible();
    await expect(dialog.getByText('5 muffins:')).toBeVisible();
    await expect(dialog.getByText('8 votes in total')).toBeVisible();

    await dialog.getByRole('button', { name: 'Close', exact: true }).first().click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('shows that nobody voted yet, without a totals link', async ({ page, request }) => {
    await configure(request, {});
    await page.goto(EPISODE);
    await expect(voting(page)).toContainText('Nopony voted yet.');
    await expect(voting(page).getByRole('button', { name: 'Show totals' })).toHaveCount(0);
  });

  test('tells guests to sign in', async ({ page, request }) => {
    await configure(request, { votes: { '3': 1 } });
    await page.goto(EPISODE);
    await expect(voting(page)).toContainText('Sign in above to cast your vote!');
    await expect(voting(page).getByRole('button', { name: 'Cast your vote' })).toHaveCount(0);
  });

  test('never shows a rating to a guest, even when the API knows one', async ({ page, request }) => {
    await configure(request, { signedIn: false, votes: { '4': 3 }, userVote: 4 });
    await page.goto(EPISODE);
    await expect(voting(page)).toContainText('Sign in above to cast your vote!');
    await expect(voting(page)).not.toContainText('Your rating');
  });

  test('says when voting starts for an episode that has not aired', async ({ page, request }) => {
    await configure(request, { aired: false });
    await page.goto(EPISODE);
    await expect(voting(page)).toContainText('Voting will start');
    await expect(voting(page).getByRole('button', { name: 'Cast your vote' })).toHaveCount(0);
  });

  test('moves with the page: gone on other pages, back when returning to an episode', async ({ page, request }) => {
    await configure(request, { votes: { '5': 1 } });
    await page.goto(EPISODE);
    await expect(voting(page)).toBeVisible();
    await page.getByRole('link', { name: 'All shows' }).click();
    await page.waitForURL(/\/show/);
    await expect(page.locator('#voting')).toHaveCount(0);
    await page.goBack();
    await expect(voting(page)).toBeVisible();
  });

  test.describe('signed in', () => {
    test.beforeEach(async ({ page, request }) => {
      await configure(request, { signedIn: true, votes: { '4': 1 } });
      await signInCookie(page);
    });

    test('casts a vote with the muffins in a dialog and updates the rating', async ({ page, request }) => {
      await page.goto(EPISODE);
      await expect(voting(page)).toContainText('How would you rate the episode?');
      await voting(page).getByRole('button', { name: 'Cast your vote' }).click();

      const dialog = page.getByRole('dialog');
      await expect(dialog.getByText('Rate this episode')).toBeVisible();
      await expect(dialog.getByText('This cannot be changed later.')).toBeVisible();
      await expect(dialog.getByText('Your rating: ?/5')).toBeVisible();

      // Hovering previews the rating, clicking chooses it
      await dialog.getByRole('radio', { name: '5 muffins' }).hover();
      await expect(dialog.getByText('Your rating: 5/5')).toBeVisible();
      await dialog.getByRole('radio', { name: '2 muffins' }).click();
      await expect(dialog.getByRole('radio', { name: '2 muffins' })).toHaveAttribute('aria-checked', 'true');
      await dialog.getByRole('button', { name: 'Rate', exact: true }).click();

      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(voting(page)).toContainText('Your rating: 2 muffins');
      await expect(voting(page)).toContainText('This episode is rated 3/5');
      const { voteLog } = (await (await request.get(`${STUB}/__log`)).json()) as { voteLog: number[] };
      expect(voteLog).toEqual([2]);
    });

    test('asks to choose a rating before submitting', async ({ page }) => {
      await page.goto(EPISODE);
      await voting(page).getByRole('button', { name: 'Cast your vote' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Rate', exact: true }).click();
      await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Please choose a rating');
    });

    test('shows the rating the visitor gave before and does not offer to vote again', async ({ page, request }) => {
      await configure(request, { signedIn: true, votes: { '4': 3 }, userVote: 4 });
      await page.goto(EPISODE);
      await expect(voting(page)).toContainText('Your rating: 4 muffins');
      await expect(voting(page).getByRole('button', { name: 'Cast your vote' })).toHaveCount(0);
      await expect(voting(page)).not.toContainText('How would you rate the episode?');
    });

    test('keeps showing the rating after a reload', async ({ page }) => {
      await page.goto(EPISODE);
      await voting(page).getByRole('button', { name: 'Cast your vote' }).click();
      await page.getByRole('dialog').getByRole('radio', { name: '2 muffins' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Rate', exact: true }).click();
      await expect(voting(page)).toContainText('Your rating: 2 muffins');

      await page.reload();
      await expect(voting(page)).toContainText('Your rating: 2 muffins');
      await expect(voting(page).getByRole('button', { name: 'Cast your vote' })).toHaveCount(0);
    });

    test('can pick a rating with the keyboard', async ({ page }) => {
      await page.goto(EPISODE);
      await voting(page).getByRole('button', { name: 'Cast your vote' }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('radio', { name: '3 muffins' }).focus();
      await page.keyboard.press('Enter');
      await expect(dialog.getByRole('radio', { name: '3 muffins' })).toHaveAttribute('aria-checked', 'true');
    });

    test('shows the answer of the API when somebody already voted, and keeps the dialog open', async ({ page, request }) => {
      await configure(request, { signedIn: true, votes: { '4': 1 }, alreadyVoted: true });
      await page.goto(EPISODE);
      await voting(page).getByRole('button', { name: 'Cast your vote' }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('radio', { name: '1 muffin' }).click();
      await dialog.getByRole('button', { name: 'Rate', exact: true }).click();
      await expect(dialog.getByRole('alert')).toContainText('already voted');
      await expect(voting(page)).not.toContainText('Your rating:');
    });
  });
});
