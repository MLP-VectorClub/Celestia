import { type Store, type ThunkDispatch, type UnknownAction, configureStore } from '@reduxjs/toolkit';
import { MakeStore, createWrapper } from 'next-redux-wrapper';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import { requestUserFetcher } from 'src/fetchers/auth';
import { getQueryClient } from 'src/store/queryClient';
import { rootReducer } from 'src/store/rootReducer';
import { authActions } from 'src/store/slices/authSlice';
import { WithAppThunkExtra } from 'src/store/thunkTypes';
import { takeFetchFailure } from 'src/utils/fetch-failure';
import { typedServerSideTranslations } from 'src/utils/i18n';
import { setResponseStatus } from 'src/utils/initial-prop-helpers';

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
      const result = await callback(store)(ctx);

      // Data the page needs could not be fetched (rate limited, API down): answer with that status and let `_app` show why, instead of rendering
      // the page with nothing in it or reporting a missing page
      const failure = ctx.res ? takeFetchFailure(ctx.res) : undefined;
      if (!failure || 'redirect' in result) return result;
      setResponseStatus(ctx, failure.status);
      if (failure.status === 429 && failure.retryAfter) ctx.res.setHeader('Retry-After', String(failure.retryAfter));
      const props = 'props' in result ? await result.props : {};
      const messages =
        (props as { messages?: Record<string, unknown> }).messages ?? (await typedServerSideTranslations(ctx.locale)).messages;
      return { props: { ...props, messages, fetchFailure: failure } } as unknown as typeof result;
    }),
};

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
