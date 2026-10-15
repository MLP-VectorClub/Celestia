import { configureStore } from '@reduxjs/toolkit';
import { QueryClient } from '@tanstack/react-query';
import { HYDRATE } from 'next-redux-wrapper';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserService } from 'src/services';
import authReducer, { authActions } from 'src/store/slices/authSlice';
import {
  registerThunk,
  signInPasskeyThunk,
  signInThunk,
  signInTwoFactorPasskeyThunk,
  signInTwoFactorThunk,
  signOutThunk,
} from 'src/store/thunks';
import { AuthModalSide, Status, UnifiedErrorResponseTypes } from 'src/types';
import { ENDPOINTS } from 'src/utils/endpoints';

vi.mock('src/services', () => ({
  UserService: {
    signIn: vi.fn(),
    signOut: vi.fn(),
    register: vi.fn(),
    getMe: vi.fn(),
    signInTwoFactor: vi.fn(),
    signInTwoFactorPasskey: vi.fn(),
    signInPasskey: vi.fn(),
  },
}));

const user = { id: 3, name: 'Tester' };
const service = vi.mocked(UserService);
const ok = (data: unknown) => Promise.resolve({ data, status: 200, headers: {} }) as never;
const fail = (status: number, data: unknown) => Promise.reject({ isAxiosError: true, response: { status, data, headers: {} } }) as never;

const makeStore = () => {
  const queryCache = new QueryClient();
  vi.spyOn(queryCache, 'refetchQueries').mockResolvedValue();
  const store = configureStore({
    reducer: { auth: authReducer },
    middleware: (getDefault) => getDefault({ thunk: { extraArgument: { queryCache } } }),
  });
  return { store, queryCache };
};

beforeEach(() => {
  vi.resetAllMocks();
  service.getMe.mockReturnValue(ok({ user }));
});

describe('auth modal', () => {
  it('opens on the requested side, defaulting to sign in, and closing resets the forms', () => {
    const { store } = makeStore();
    store.dispatch(authActions.openAuthModal(AuthModalSide.REGISTER));
    expect(store.getState().auth.authModal).toEqual({ open: true, side: AuthModalSide.REGISTER });
    store.dispatch(authActions.openAuthModal(null));
    expect(store.getState().auth.authModal.side).toBe(AuthModalSide.SIGN_IN);

    store.dispatch(authActions.closeAuthModal());
    expect(store.getState().auth.authModal.open).toBe(false);
    expect(store.getState().auth.signIn.status).toBe(Status.INIT);
  });

  it('remembers the visitor the server rendered the page for', () => {
    const { store } = makeStore();
    store.dispatch(authActions.setInitialUser(user as never));
    expect(store.getState().auth.initialUser).toEqual(user);
    store.dispatch(authActions.setInitialUser(null));
    expect(store.getState().auth.initialUser).toBeNull();
  });

  it('takes over the state the server rendered with', () => {
    const { store } = makeStore();
    store.dispatch({ type: HYDRATE, payload: { auth: { initialUser: user } } });
    expect(store.getState().auth.initialUser).toEqual(user);
  });
});

describe('signInThunk', () => {
  it('signs in, stores the user for the user query, refetches and closes the modal', async () => {
    service.signIn.mockReturnValue(ok({}));
    const { store, queryCache } = makeStore();
    store.dispatch(authActions.openAuthModal(null));

    const pending = store.dispatch(signInThunk({ username: 'a', password: 'b' } as never));
    expect(store.getState().auth.signIn.status).toBe(Status.LOAD);
    await pending;

    expect(queryCache.getQueryData([ENDPOINTS.USERS_ME])).toEqual(user);
    expect(queryCache.refetchQueries).toHaveBeenCalled();
    expect(store.getState().auth.authModal.open).toBe(false);
    expect(store.getState().auth.signIn.status).toBe(Status.INIT);
  });

  it('keeps the API error for the form when the credentials are refused', async () => {
    service.signIn.mockReturnValue(fail(422, { message: 'Invalid', errors: { username: ['Unknown user'] } }));
    const { store, queryCache } = makeStore();
    store.dispatch(authActions.openAuthModal(null));
    await store.dispatch(signInThunk({ username: 'a', password: 'b' } as never));

    const { signIn, authModal } = store.getState().auth;
    expect(signIn.status).toBe(Status.FAILURE);
    expect(signIn.error).toMatchObject({ errors: { username: ['Unknown user'] } });
    expect(authModal.open).toBe(true);
    expect(queryCache.getQueryData([ENDPOINTS.USERS_ME])).toBeUndefined();
  });
});

describe('two-factor sign in', () => {
  const challenge = { challenge: 'token', methods: ['totp', 'recovery', 'passkey'] };

  const afterPassword = async () => {
    service.signIn.mockReturnValue(ok({ twoFactor: challenge }));
    const made = makeStore();
    made.store.dispatch(authActions.openAuthModal(null));
    await made.store.dispatch(signInThunk({ email: 'a', password: 'b' }));
    return made;
  };

  it('moves the dialog on to the second step instead of signing in when the API asks for a second factor', async () => {
    const { store, queryCache } = await afterPassword();

    const { authModal, twoFactor, signIn } = store.getState().auth;
    expect(authModal).toEqual({ open: true, side: AuthModalSide.TWO_FACTOR });
    expect(twoFactor.challenge).toEqual(challenge);
    expect(signIn.status).toBe(Status.INIT);
    // Nobody is signed in, so the user is not asked for
    expect(service.getMe).not.toHaveBeenCalled();
    expect(queryCache.getQueryData([ENDPOINTS.USERS_ME])).toBeUndefined();
  });

  it('signs in with the code and closes the dialog', async () => {
    const { store, queryCache } = await afterPassword();
    service.signInTwoFactor.mockReturnValue(ok({}));

    const pending = store.dispatch(signInTwoFactorThunk({ challenge: 'token', code: '123456' }));
    expect(store.getState().auth.twoFactor.status).toBe(Status.LOAD);
    await pending;

    expect(service.signInTwoFactor).toHaveBeenCalledWith({ challenge: 'token', code: '123456' });
    expect(queryCache.getQueryData([ENDPOINTS.USERS_ME])).toEqual(user);
    expect(store.getState().auth.authModal.open).toBe(false);
    expect(store.getState().auth.twoFactor.challenge).toBeNull();
  });

  it('keeps the dialog on the second step with the error when the code is wrong', async () => {
    const { store } = await afterPassword();
    service.signInTwoFactor.mockReturnValue(fail(401, { message: 'That code is not right' }));
    await store.dispatch(signInTwoFactorThunk({ challenge: 'token', code: '000000' }));

    const { twoFactor, authModal } = store.getState().auth;
    expect(twoFactor.status).toBe(Status.FAILURE);
    expect(twoFactor.error).toMatchObject({ type: UnifiedErrorResponseTypes.AUTHENTICATION_ERROR });
    expect(twoFactor.error).not.toHaveProperty('expired');
    expect(authModal).toEqual({ open: true, side: AuthModalSide.TWO_FACTOR });
    expect(twoFactor.challenge).toEqual(challenge);
  });

  it('knows when the challenge ran out', async () => {
    const { store } = await afterPassword();
    service.signInTwoFactor.mockReturnValue(fail(401, { message: 'expired', expired: true }));
    await store.dispatch(signInTwoFactorThunk({ challenge: 'token', code: '000000' }));

    expect(store.getState().auth.twoFactor.error).toMatchObject({ type: UnifiedErrorResponseTypes.AUTHENTICATION_ERROR, expired: true });
  });

  it('goes back to the sign in form and forgets the challenge', async () => {
    const { store } = await afterPassword();
    store.dispatch(authActions.backToSignIn());

    const { authModal, twoFactor } = store.getState().auth;
    expect(authModal).toEqual({ open: true, side: AuthModalSide.SIGN_IN });
    expect(twoFactor.challenge).toBeNull();
  });

  it('clears the error of a wrong code when the visitor switches to another way', async () => {
    const { store } = await afterPassword();
    service.signInTwoFactor.mockReturnValue(fail(401, {}));
    await store.dispatch(signInTwoFactorThunk({ challenge: 'token', code: '000000' }));
    store.dispatch(authActions.clearTwoFactorError());

    expect(store.getState().auth.twoFactor.error).toBeNull();
    expect(store.getState().auth.twoFactor.status).toBe(Status.INIT);
  });

  it('signs in with a passkey as the second factor', async () => {
    const { store, queryCache } = await afterPassword();
    service.signInTwoFactorPasskey.mockReturnValue(ok({}));
    await store.dispatch(signInTwoFactorPasskeyThunk({ challenge: 'token', passkeyChallenge: 'p', credential: { id: 'x' } as never }));

    expect(queryCache.getQueryData([ENDPOINTS.USERS_ME])).toEqual(user);
    expect(store.getState().auth.authModal.open).toBe(false);
  });
});

describe('signInPasskeyThunk', () => {
  it('signs in without a password and closes the dialog', async () => {
    service.signInPasskey.mockReturnValue(ok({}));
    const { store, queryCache } = makeStore();
    store.dispatch(authActions.openAuthModal(null));
    await store.dispatch(signInPasskeyThunk({ challenge: 'c', credential: { id: 'x' } as never, remember: true }));

    expect(queryCache.getQueryData([ENDPOINTS.USERS_ME])).toEqual(user);
    expect(store.getState().auth.authModal.open).toBe(false);
  });

  it('keeps its error apart from the password form', async () => {
    service.signInPasskey.mockReturnValue(fail(401, { message: 'That passkey was not accepted' }));
    const { store } = makeStore();
    store.dispatch(authActions.openAuthModal(null));
    await store.dispatch(signInPasskeyThunk({ challenge: 'c', credential: { id: 'x' } as never }));

    const { passkey, signIn, authModal } = store.getState().auth;
    expect(passkey.status).toBe(Status.FAILURE);
    expect(passkey.error).toMatchObject({ type: UnifiedErrorResponseTypes.AUTHENTICATION_ERROR });
    expect(signIn.error).toBeNull();
    expect(authModal.open).toBe(true);
  });
});

describe('signOutThunk', () => {
  it('refetches everything so the user query learns the visitor is a guest', async () => {
    service.signOut.mockReturnValue(ok({}));
    const { store, queryCache } = makeStore();
    queryCache.setQueryData([ENDPOINTS.USERS_ME], user);
    await store.dispatch(signOutThunk());
    expect(service.signOut).toHaveBeenCalledTimes(1);

    // The cached user is not dropped here (React Query ignores `undefined` data), the refetch of /users/me is what ends the session in the UI
    expect(queryCache.refetchQueries).toHaveBeenCalled();
    expect(store.getState().auth.signOut.status).toBe(Status.SUCCESS);
  });

  it('keeps the error when signing out fails', async () => {
    service.signOut.mockReturnValue(fail(500, { message: 'Broken' }));
    const { store } = makeStore();
    await store.dispatch(signOutThunk());
    expect(store.getState().auth.signOut.status).toBe(Status.FAILURE);
    expect(store.getState().auth.signOut.error).not.toBeNull();
  });
});

describe('registerThunk', () => {
  it('registers and signs the new user in', async () => {
    service.register.mockReturnValue(ok({}));
    const { store, queryCache } = makeStore();
    await store.dispatch(registerThunk({ name: 'x' } as never));
    expect(queryCache.getQueryData([ENDPOINTS.USERS_ME])).toEqual(user);
    expect(store.getState().auth.register.status).toBe(Status.INIT);
  });

  it('keeps the API error with its field messages for the form', async () => {
    service.register.mockReturnValue(fail(422, { message: 'Invalid', errors: { email: ['Taken'] } }));
    const { store } = makeStore();
    await store.dispatch(registerThunk({ name: 'x' } as never));
    expect(store.getState().auth.register.status).toBe(Status.FAILURE);
    expect(store.getState().auth.register.error).toMatchObject({ errors: { email: ['Taken'] } });
  });
});
