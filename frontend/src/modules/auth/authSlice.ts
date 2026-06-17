import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@hrms/shared-types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
}

const storageKey = "hrms-auth";

const getInitialState = (): AuthState => {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return { user: null, accessToken: null, refreshToken: null };
  }

  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    return { user: null, accessToken: null, refreshToken: null };
  }
};

const persistState = (state: AuthState) => {
  localStorage.setItem(storageKey, JSON.stringify(state));
};

const authSlice = createSlice({
  name: "auth",
  initialState: getInitialState(),
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      persistState(state);
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      localStorage.removeItem(storageKey);
    },
    clearMustChangePassword: (state) => {
      if (state.user) {
        state.user.must_change_password = false;
        persistState(state);
      }
    }
  }
});

export const { setCredentials, logout, clearMustChangePassword } = authSlice.actions;
export default authSlice.reducer;
