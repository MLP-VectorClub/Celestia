import { createSlice, isAction, PayloadAction } from '@reduxjs/toolkit';
import { HYDRATE } from 'next-redux-wrapper';
import { AuthModalSide, FailsafeUser, Nullable, Status, UnifiedErrorResponse } from 'src/types';
import { User } from '@mlp-vectorclub/api-types';
import { registerThunk, signInThunk, signOutThunk } from 'src/store/thunks';

export interface AuthState {
  signIn: {
    status: Status;
    error: Nullable<UnifiedErrorResponse>;
  };
  signOut: {
    status: Status;
    error: Nullable<UnifiedErrorResponse>;
  };
  register: {
    status: Status;
    error: Nullable<UnifiedErrorResponse>;
  };
  registerOauth: {
    status: Status;
    error: Nullable<UnifiedErrorResponse>;
  };
  authModal: {
    open: boolean;
    side: AuthModalSide;
  };
  notifications: Record<string, unknown>[];
}

const initialState: AuthState = {
  signIn: {
    status: Status.INIT,
    error: null,
  },
  signOut: {
    status: Status.INIT,
    error: null,
  },
  register: {
    status: Status.INIT,
    error: null,
  },
  registerOauth: {
    status: Status.INIT,
    error: null,
  },
  authModal: {
    open: false,
    side: AuthModalSide.SIGN_IN,
  },
  notifications: [],
};

const clearModalState = (state: typeof initialState) => {
  state.authModal.open = false;
  state.signIn = { ...initialState.signIn };
  state.signOut = { ...initialState.signOut };
  state.register = { ...initialState.register };
};

const afterAuthChange = (state: typeof initialState, user?: FailsafeUser) => {
  if (user) {
    clearModalState(state);
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    openAuthModal(state, action: PayloadAction<Nullable<AuthModalSide>>) {
      state.authModal.open = true;
      state.authModal.side = action.payload || AuthModalSide.SIGN_IN;
    },
    closeAuthModal(state, _action: PayloadAction) {
      clearModalState(state);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signInThunk.pending, (state: AuthState) => {
        state.signIn.status = Status.LOAD;
      })
      .addCase(signInThunk.fulfilled, (state: AuthState, action: PayloadAction<User>) => {
        state.signIn.status = Status.SUCCESS;
        afterAuthChange(state, action.payload);
      })
      .addCase(signInThunk.rejected, (state, action) => {
        state.signIn.status = Status.FAILURE;
        state.signIn.error = action.payload as UnifiedErrorResponse;
      })
      .addCase(signOutThunk.pending, (state) => {
        state.signOut.status = Status.LOAD;
      })
      .addCase(signOutThunk.fulfilled, (state) => {
        state.signOut.status = Status.SUCCESS;
        afterAuthChange(state);
      })
      .addCase(signOutThunk.rejected, (state, action) => {
        state.signOut.status = Status.FAILURE;
        state.signOut.error = action.payload as UnifiedErrorResponse;
      })
      .addCase(registerThunk.pending, (state) => {
        state.register.status = Status.LOAD;
      })
      .addCase(registerThunk.fulfilled, (state, action: PayloadAction<User>) => {
        state.register.status = Status.SUCCESS;
        afterAuthChange(state, action.payload);
      })
      .addCase(registerThunk.rejected, (state: AuthState, action) => {
        state.register.status = Status.FAILURE;
        state.register.error = action.error as UnifiedErrorResponse;
      })
      .addMatcher(
        (action): action is PayloadAction<{ auth: AuthState }> => isAction(action) && action.type === HYDRATE,
        (state: AuthState, action: PayloadAction<{ auth: AuthState }>) => ({ ...state, ...action.payload.auth })
      );
  },
});

export const authActions = authSlice.actions;

export default authSlice.reducer;
