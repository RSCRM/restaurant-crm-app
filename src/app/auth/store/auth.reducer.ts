import { createReducer, on } from '@ngrx/store';

import { AuthActions } from './auth.actions';
import { AuthState, initialAuthState } from './auth.state';

export const authReducer = createReducer(
  initialAuthState,

  on(AuthActions.login, (state): AuthState => ({
    ...state,
    loading: true,
    error: null
  })),

  on(AuthActions.loginSuccess, (state, { accessToken, refreshToken, contexts, systemRoles }): AuthState => ({
    ...state,
    accessToken,
    refreshToken,
    contexts,
    systemRoles,
    loading: false,
    error: null
  })),

  on(AuthActions.loginFailure, (state, { error }): AuthState => ({
    ...state,
    loading: false,
    error
  })),

  on(AuthActions.selectContext, (state): AuthState => ({
    ...state,
    loading: true,
    error: null
  })),

  on(AuthActions.selectContextSuccess, (state, { contextToken }): AuthState => ({
    ...state,
    contextToken,
    loading: false,
    error: null
  })),

  on(AuthActions.selectContextFailure, (state, { error }): AuthState => ({
    ...state,
    loading: false,
    error
  })),

  on(AuthActions.logoutSuccess, (): AuthState => ({
    ...initialAuthState
  })),

  on(AuthActions.clearError, (state): AuthState => ({
    ...state,
    error: null
  }))
);
