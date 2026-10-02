import { type Store, type ThunkDispatch, type UnknownAction, configureStore } from '@reduxjs/toolkit';
import { MakeStore, createWrapper } from 'next-redux-wrapper';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import { requestUserFetcher } from 'src/fetchers/auth';
import { getQueryClient } from 'src/store/queryClient';
import { rootReducer } from 'src/store/rootReducer';
import { authActions } from 'src/store/slices/authSlice';
import { WithAppThunkExtra } from 'src/store/thunkTypes';

const createStore = () => {
  const extraArgument: WithAppThunkExtra['extra'] = {
    // Thunks using this only run in the browser, where this is the same client _app provides
    queryCache: getQueryClient(),
  };
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ thunk: { extraArgument } }),
  });
};

type StoreType = ReturnType<typeof createStore>;
export type RootState = ReturnType<StoreType['getState']>;
export type AppDispatch = ThunkDispatch<RootState, WithAppThunkExtra['extra'], UnknownAction>;

// create a makeStore function
const makeStore: MakeStore<Store<RootState>> = () => createStore();

const baseWrapper = createWrapper<Store<RootState>>(makeStore, {
  debug: false,
});

/**
 * The wrapper every page uses. Besides what next-redux-wrapper does, each server-side render first finds out who is signed in, so
 * pages are rendered for the actual visitor (see `useAuth`)
 */
export const wrapper: typeof baseWrapper = {
  ...baseWrapper,
  getServerSideProps: (callback) =>
    baseWrapper.getServerSideProps((store) => async (ctx) => {
      store.dispatch(authActions.setInitialUser(await requestUserFetcher(ctx.req)));
      return callback(store)(ctx);
    }),
};

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
