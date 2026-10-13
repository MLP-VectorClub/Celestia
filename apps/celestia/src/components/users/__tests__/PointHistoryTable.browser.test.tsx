import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { PointHistoryTable, formatAmount } from 'src/components/users/PointHistoryTable';
import { IntlTestProvider } from 'src/test-utils/IntlTestProvider';

type Entries = Parameters<typeof PointHistoryTable>[0]['entries'];

const entry = (changeType: string, reason: string, amount: number, data: unknown = null, id = 1) =>
  ({ id, changeType, reason, amount, data, createdAt: '2026-10-01T00:00:00+00:00' }) as Entries[number];

const renderTable = (entries: Entries) =>
  render(
    <IntlTestProvider>
      <PointHistoryTable entries={entries} ownerId={9001} />
    </IntlTestProvider>
  );

describe('formatAmount', () => {
  it('uses a plus for gains and a real minus for spending', () => {
    expect(formatAmount(5)).toBe('+5');
    expect(formatAmount(-10)).toBe('−10');
    expect(formatAmount(0)).toBe('0');
  });
});

describe('PointHistoryTable', () => {
  it('colors rows by gain and loss and has the four columns', async () => {
    const screen = await renderTable([
      entry('free_trial', 'Free slot', 10, null, 1),
      entry('appearance_add', 'Appearance created', -10, { id: 3, label: 'Pony' }, 2),
    ]);
    for (const name of ['Reason', 'Details', 'Amount', 'When'])
      await expect.element(screen.getByText(name, { exact: true }).first()).toBeVisible();
    await expect.element(screen.getByText("This one's on the house")).toBeVisible();
    expect(screen.getByTestId('history-free_trial').element().className).toMatch(/gain/);
    expect(screen.getByTestId('history-appearance_add').element().className).toMatch(/loss/);
  });

  it('shows staff who granted points, with the comment, and everybody else only that it was a staff member', async () => {
    const staff = await renderTable([entry('manual_give', 'Manually given', 5, { by: 7, byName: 'TestAdmin', comment: 'Nice work' })]);
    await expect.element(staff.getByRole('link', { name: 'TestAdmin' })).toHaveAttribute('href', expect.stringContaining('/users/7'));
    await expect.element(staff.getByText('Nice work')).toBeVisible();
    await staff.unmount();

    const owner = await renderTable([entry('manual_take', 'Manually taken', -2, { comment: 'Oops' })]);
    await expect.element(owner.getByText(/By a staff member/)).toBeVisible();
    await expect.element(owner.getByRole('link')).not.toBeInTheDocument();
  });

  it('links a post and an appearance, and marks the ones that are gone', async () => {
    const screen = await renderTable([
      entry('post_approved', 'Post approved', 1, { id: 35, gone: false }, 1),
      entry('post_unapproved', 'Post un-approved', -1, { id: 36, gone: true }, 2),
      entry('appearance_add', 'Appearance created', -10, { id: 4, label: 'Secret Pony', private: true, gone: false }, 3),
      entry('appearance_del', 'Appearance deleted', 10, { id: 5, label: 'Old Pony', gone: true }, 4),
    ]);
    // 35 in base 36 is "z"
    await expect.element(screen.getByRole('link', { name: 'Post #35' })).toHaveAttribute('href', '/s/z');
    await expect.element(screen.getByText('Post #36')).toBeVisible();
    await expect.element(screen.getByRole('link', { name: 'Post #36' })).not.toBeInTheDocument();
    await expect
      .element(screen.getByRole('link', { name: 'Secret Pony' }))
      .toHaveAttribute('href', expect.stringContaining('/users/9001/cg/v/4'));
    await expect.element(screen.getByText(/Old Pony/)).toBeVisible();
    await expect.element(screen.getByRole('link', { name: /Old Pony/ })).not.toBeInTheDocument();
  });

  it('shows the data of a type it does not know as it is', async () => {
    const screen = await renderTable([entry('staff_join', 'Joined staff', 10, { since: 'then' })]);
    await expect.element(screen.getByText(/"since": "then"/)).toBeVisible();
  });
});
