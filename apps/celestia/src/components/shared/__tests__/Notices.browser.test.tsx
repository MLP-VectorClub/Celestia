import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import Notices from 'src/components/shared/Notices';
import { IntlTestProvider } from 'src/test-utils/IntlTestProvider';

const state = vi.hoisted(() => ({ readOnly: false }));

vi.mock('next/router', () => ({ useRouter: () => ({ isReady: true, asPath: '/cg', pathname: '/cg' }) }));
vi.mock('src/hooks', () => ({
  useConfig: () => ({ config: { readOnly: state.readOnly } }),
  useCurrentNotices: () => [{ id: 1, type: 'info', messageHtml: 'Hello from <a href="{path}">here</a>' }],
}));

const renderNotices = () =>
  render(
    <IntlTestProvider>
      <Notices />
    </IntlTestProvider>
  );

describe('Notices', () => {
  beforeEach(() => {
    state.readOnly = false;
  });

  it('shows the notices of the site', async () => {
    const screen = await renderNotices();
    await expect.element(screen.getByText(/Hello from/)).toBeVisible();
    await expect.element(screen.getByText(/read-only right now/)).not.toBeInTheDocument();
  });

  it('tells visitors the site is read-only while the API says so', async () => {
    state.readOnly = true;
    const screen = await renderNotices();
    await expect.element(screen.getByText(/read-only right now/)).toBeVisible();
    await expect.element(screen.getByText(/Hello from/)).toBeVisible();
  });
});
