import { combineReducers } from '@reduxjs/toolkit';

import authReducer from 'src/store/slices/authSlice';
import coreReducer from 'src/store/slices/coreSlice';
import profileReducer from 'src/store/slices/profileSlice';

export const rootReducer = combineReducers({
  core: coreReducer,
  auth: authReducer,
  profile: profileReducer,
});
