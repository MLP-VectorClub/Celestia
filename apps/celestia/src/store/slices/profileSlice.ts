import { createSlice, isAction, PayloadAction } from '@reduxjs/toolkit';
import { HYDRATE } from 'next-redux-wrapper';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ProfileState {}

const initialState: ProfileState = {};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addMatcher(
      (action): action is PayloadAction<{ profile: ProfileState }> => isAction(action) && action.type === HYDRATE,
      (state: ProfileState, action: PayloadAction<{ profile: ProfileState }>) => ({ ...state, ...action.payload.profile })
    );
  },
});

export const profileActions = profileSlice.actions;

export default profileSlice.reducer;
