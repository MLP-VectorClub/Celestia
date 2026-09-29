import { createAsyncThunk } from '@reduxjs/toolkit';
import { QueryClient } from '@tanstack/react-query';

import { PostUsersRequest, PostUsersSigninRequest, User } from '@mlp-vectorclub/api-types';
import { UserService } from 'src/services';
import { WithAppThunkExtra } from 'src/store/thunkTypes';
import { ENDPOINTS, requestPromiseMapper } from 'src/utils';

const thunkModule = 'auth';

const invalidateUserSpecificQueries = (queryCache: QueryClient) => {
  // TODO Potentially introduce more granular query filtering to only invalidate ones that use auth data
  void queryCache.refetchQueries();
};

export const signInThunk = createAsyncThunk<User, PostUsersSigninRequest, WithAppThunkExtra>(
  `${thunkModule}/signIn`,
  async (params, { rejectWithValue, extra }) => {
    try {
      await requestPromiseMapper(UserService.signIn(params));
      const data = await requestPromiseMapper(UserService.getMe());

      extra.queryCache.setQueryData([ENDPOINTS.USERS_ME], data);
      invalidateUserSpecificQueries(extra.queryCache);
      return data;
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

export const registerThunk = createAsyncThunk<User, PostUsersRequest, WithAppThunkExtra>(
  `${thunkModule}/register`,
  async (params, { rejectWithValue, extra }) => {
    try {
      await requestPromiseMapper(UserService.register(params));
      const data = await requestPromiseMapper(UserService.getMe());

      extra.queryCache.setQueryData([ENDPOINTS.USERS_ME], data);
      invalidateUserSpecificQueries(extra.queryCache);
      return data;
    } catch (e) {
      return rejectWithValue(e);
    }
  }
);
