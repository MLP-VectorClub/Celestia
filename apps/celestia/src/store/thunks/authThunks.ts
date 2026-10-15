import { createAsyncThunk } from '@reduxjs/toolkit';
import { QueryClient } from '@tanstack/react-query';
import { User } from '@went.tf/mlp-vectorclub-api-types';

import { currentUserFetcher } from 'src/fetchers/auth';
import { UserService } from 'src/services';
import { WithAppThunkExtra } from 'src/store/thunkTypes';
import {
  PostUsersSigninPasskeyRequest,
  PostUsersSigninRequest,
  PostUsersSigninTwoFactorPasskeyRequest,
  PostUsersSigninTwoFactorRequest,
  TwoFactorRequired,
  isTwoFactorRequired,
} from 'src/types/auth';
import { ENDPOINTS, requestPromiseMapper } from 'src/utils';

const thunkModule = 'auth';

const invalidateUserSpecificQueries = (queryCache: QueryClient) => {
  // TODO Potentially introduce more granular query filtering to only invalidate ones that use auth data
  void queryCache.refetchQueries();
};

/** What every way of signing in does once the API has accepted it: the visitor is asked for and put into the caches that depend on them */
const finishSignIn = async (queryCache: QueryClient): Promise<User> => {
  const data = await currentUserFetcher();

  queryCache.setQueryData([ENDPOINTS.USERS_ME], data);
  invalidateUserSpecificQueries(queryCache);
  return data;
};

/** The user, or the challenge to answer first when the account has a second factor (nobody is signed in then) */
export const signInThunk = createAsyncThunk<User | TwoFactorRequired, PostUsersSigninRequest, WithAppThunkExtra>(
  `${thunkModule}/signIn`,
  async (params, { rejectWithValue, extra }) => {
    try {
      const result = await requestPromiseMapper(UserService.signIn(params));
      if (isTwoFactorRequired(result)) return { twoFactor: result.twoFactor };

      return await finishSignIn(extra.queryCache);
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

/** The second step: a code of the authenticator app or a recovery code */
export const signInTwoFactorThunk = createAsyncThunk<User, PostUsersSigninTwoFactorRequest, WithAppThunkExtra>(
  `${thunkModule}/signInTwoFactor`,
  async (params, { rejectWithValue, extra }) => {
    try {
      await requestPromiseMapper(UserService.signInTwoFactor(params));
      return await finishSignIn(extra.queryCache);
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

/** The second step with a passkey, `credential` is what the browser made for the options of `UserService.twoFactorPasskeyOptions` */
export const signInTwoFactorPasskeyThunk = createAsyncThunk<User, PostUsersSigninTwoFactorPasskeyRequest, WithAppThunkExtra>(
  `${thunkModule}/signInTwoFactorPasskey`,
  async (params, { rejectWithValue, extra }) => {
    try {
      await requestPromiseMapper(UserService.signInTwoFactorPasskey(params));
      return await finishSignIn(extra.queryCache);
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

/** Signing in with a passkey alone, no password: `credential` is what the browser made for the options of `UserService.passkeyOptions` */
export const signInPasskeyThunk = createAsyncThunk<User, PostUsersSigninPasskeyRequest, WithAppThunkExtra>(
  `${thunkModule}/signInPasskey`,
  async (params, { rejectWithValue, extra }) => {
    try {
      await requestPromiseMapper(UserService.signInPasskey(params));
      return await finishSignIn(extra.queryCache);
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);

export const signOutThunk = createAsyncThunk<void, void, WithAppThunkExtra>(
  `${thunkModule}/signOut`,
  async (_, { rejectWithValue, extra }) => {
    try {
      await requestPromiseMapper(UserService.signOut());

      extra.queryCache.setQueryData([ENDPOINTS.USERS_ME], undefined);
      invalidateUserSpecificQueries(extra.queryCache);
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);
