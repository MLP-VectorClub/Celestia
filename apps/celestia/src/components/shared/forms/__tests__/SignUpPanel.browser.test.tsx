import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import SignUpPanel from 'src/components/shared/forms/SignUpPanel';
import { IntlTestProvider } from 'src/test-utils/IntlTestProvider';

const state = vi.hoisted(() => ({ dispatch: vi.fn(), signInWith: vi.fn(), opened: vi.fn() }));

vi.mock('src/hooks/social-signin', () => ({
  useSocialSignIn: () => (provider: string, title: string) => () => {
    state.signInWith(provider, title);
    state.opened();
  },
}));
vi.mock('src/store', () => ({ useAppDispatch: () => state.dispatch }));
vi.mock('src/store/slices', () => ({ authActions: { openAuthModal: (side: unknown) => ({ type: 'open', side }) } }));
vi.mock('src/components/shared/ExternalLink', () => ({
  default: ({ children }: { children: unknown }) => <a href="/privacy">{children as never}</a>,
}));
vi.mock('src/fancy-config', () => ({ SOCIAL_PROVIDERS: { deviantart: { name: 'DeviantArt', renderIcon: () => null } } }));

describe('SignUpPanel', () => {
  beforeEach(() => {
    Object.values(state).forEach((fn) => fn.mockReset());
  });

  it('offers nothing but DeviantArt: no name, e-mail or password to fill in', async () => {
    const screen = await render(
      <IntlTestProvider>
        <SignUpPanel />
      </IntlTestProvider>
    );

    await expect.element(screen.getByText(/created from your DeviantArt name/)).toBeVisible();
    await expect.element(screen.getByLabelText('Password')).not.toBeInTheDocument();
    await expect.element(screen.getByLabelText('E-Mail Address')).not.toBeInTheDocument();
  });

  it('needs the privacy policy accepted before it opens the DeviantArt sign in', async () => {
    const screen = await render(
      <IntlTestProvider>
        <SignUpPanel />
      </IntlTestProvider>
    );

    await expect.element(screen.getByRole('button', { name: 'Sign up with DeviantArt' })).toBeDisabled();
    await screen.getByLabelText(/I accept the/).click();
    await screen.getByRole('button', { name: 'Sign up with DeviantArt' }).click();

    expect(state.signInWith).toHaveBeenCalledWith('deviantart', 'Sign up with DeviantArt');
  });

  it('goes back to the sign in form for those who have an account', async () => {
    const screen = await render(
      <IntlTestProvider>
        <SignUpPanel />
      </IntlTestProvider>
    );
    await screen.getByText('Already have an account? Sign in here!').click();

    expect(state.dispatch).toHaveBeenCalledWith({ type: 'open', side: 0 });
  });
});
