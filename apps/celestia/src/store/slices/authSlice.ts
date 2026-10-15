import { PayloadAction, createSlice, isAction } from '@reduxjs/toolkit';
import { User } from '@went.tf/mlp-vectorclub-api-types';
import { HYDRATE } from 'next-redux-wrapper';

import {
  registerThunk,
  signInPasskeyThunk,
  signInThunk,
  signInTwoFactorPasskeyThunk,
  signInTwoFactorThunk,
  signOutThunk,
} from 'src/store/thunks';
import { AuthModalSide, FailsafeUser, Nullable, Status, UnifiedErrorResponse } from 'src/types';
import { TwoFactorChallenge, isTwoFactorRequired } from 'src/types/auth';

export interface AuthState {
  /** The visitor as the server saw them while rendering, `null` for guests. Only used as the starting point of the user query */
  initialUser: User | null;
  signIn: {
    status: Status;
    error: Nullable<UnifiedErrorResponse>;
  };
  /** Signing in with a passkey alone (kept apart from `signIn`: its errors are not about the e-mail address or password) */
  passkey: {
    status: Status;
    error: Nullable<UnifiedErrorResponse>;
  };
  /** The second step of a sign in: the challenge the API handed out after the password, and how answering it went */
  twoFactor: {
    challenge: Nullable<TwoFactorChallenge>;
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
}

const initialState: AuthState = {
  initialUser: null,
  signIn: {
    status: Status.INIT,
    error: null,
  },
  passkey: {
    status: Status.INIT,
    error: null,
  },
  twoFactor: {
    challenge: null,
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
};

const clearModalState = (state: typeof initialState) => {
  state.authModal.open = false;
  state.signIn = { ...initialState.signIn };
  state.passkey = { ...initialState.passkey };
  state.twoFactor = { ...initialState.twoFactor };
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
    /** Gives up on answering the challenge (it ran out, or the visitor wants another way in): the sign in form again */
    backToSignIn(state, _action: PayloadAction) {
      state.twoFactor = { ...initialState.twoFactor };
      state.signIn = { ...initialState.signIn };
      state.authModal.side = AuthModalSide.SIGN_IN;
    },
    /** A wrong code was shown, the field is a new one now */
    clearTwoFactorError(state, _action: PayloadAction) {
      state.twoFactor.error = null;
      if (state.twoFactor.status === Status.FAILURE) state.twoFactor.status = Status.INIT;
    },
    setInitialUser(state, action: PayloadAction<User | null>) {
      state.initialUser = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signInThunk.pending, (state: AuthState) => {
        state.signIn.status = Status.LOAD;
      })
      .addCase(signInThunk.fulfilled, (state: AuthState, action) => {
        if (isTwoFactorRequired(action.payload)) {
          // Nobody is signed in yet, the dialog moves on to the second step
          state.signIn = { ...initialState.signIn };
          state.twoFactor = { ...initialState.twoFactor, challenge: action.payload.twoFactor };
          state.authModal.side = AuthModalSide.TWO_FACTOR;
          return;
        }
        state.signIn.status = Status.SUCCESS;
        afterAuthChange(state, action.payload);
      })
      .addCase(signInThunk.rejected, (state, action) => {
        state.signIn.status = Status.FAILURE;
        state.signIn.error = action.payload as UnifiedErrorResponse;
      })
      .addCase(signInPasskeyThunk.pending, (state) => {
        state.passkey.status = Status.LOAD;
        state.passkey.error = null;
      })
      .addCase(signInPasskeyThunk.fulfilled, (state, action: PayloadAction<User>) => {
        state.passkey.status = Status.SUCCESS;
        afterAuthChange(state, action.payload);
      })
      .addCase(signInPasskeyThunk.rejected, (state, action) => {
        state.passkey.status = Status.FAILURE;
        state.passkey.error = action.payload as UnifiedErrorResponse;
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
        state.register.error = action.payload as UnifiedErrorResponse;
      })
      .addMatcher(
        (action) => signInTwoFactorThunk.pending.match(action) || signInTwoFactorPasskeyThunk.pending.match(action),
        (state: AuthState) => {
          state.twoFactor.status = Status.LOAD;
          state.twoFactor.error = null;
        }
      )
      .addMatcher(
        (action) => signInTwoFactorThunk.fulfilled.match(action) || signInTwoFactorPasskeyThunk.fulfilled.match(action),
        (state: AuthState, action: PayloadAction<User>) => {
          state.twoFactor.status = Status.SUCCESS;
          afterAuthChange(state, action.payload);
        }
      )
      .addMatcher(
        (action) => signInTwoFactorThunk.rejected.match(action) || signInTwoFactorPasskeyThunk.rejected.match(action),
        (state: AuthState, action: PayloadAction<unknown>) => {
          state.twoFactor.status = Status.FAILURE;
          state.twoFactor.error = action.payload as UnifiedErrorResponse;
        }
      )
      .addMatcher(
        (action): action is PayloadAction<{ auth: AuthState }> => isAction(action) && action.type === HYDRATE,
        (state: AuthState, action: PayloadAction<{ auth: AuthState }>) => ({ ...state, ...action.payload.auth })
      );
  },
});

export const authActions = authSlice.actions;

export default authSlice.reducer;
