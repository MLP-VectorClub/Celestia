import { type Store, type ThunkDispatch, type UnknownAction, configureStore } from '@reduxjs/toolkit';
import { MakeStore, createWrapper } from 'next-redux-wrapper';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import { getQueryClient } from 'src/store/queryClient';
import { rootReducer } from 'src/store/rootReducer';
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

// export an assembled wrapper
export const wrapper = createWrapper<Store<RootState>>(makeStore, {
  debug: false,
});

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
