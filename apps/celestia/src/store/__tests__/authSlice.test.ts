import { configureStore } from '@reduxjs/toolkit';
import { QueryClient } from '@tanstack/react-query';
import { HYDRATE } from 'next-redux-wrapper';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserService } from 'src/services';
import authReducer, { authActions } from 'src/store/slices/authSlice';
import { registerThunk, signInThunk, signOutThunk } from 'src/store/thunks';
import { AuthModalSide, Status } from 'src/types';
import { ENDPOINTS } from 'src/utils/endpoints';

vi.mock('src/services', () => ({
  UserService: { signIn: vi.fn(), signOut: vi.fn(), register: vi.fn(), getMe: vi.fn() },
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
