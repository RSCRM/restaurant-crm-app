import { createReducer, on } from '@ngrx/store';

import { AuthActions } from './auth.actions';
import { AuthState, initialAuthState } from './auth.state';

export const authReducer = createReducer(
  initialAuthState,

  on(AuthActions.restoreAuth, (state, { accessToken, systemRoles, contextToken, permissions }): AuthState => ({
    ...state,
    accessToken,
    systemRoles,
    contextToken,
    permissions
  })),

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
    permissions: [],
    loading: true,
    error: null
  })),

  on(AuthActions.selectContextSuccess, (state, { contextToken, permissions }): AuthState => ({
    ...state,
    contextToken,
    permissions,
    loading: false,
    error: null
  })),

  on(AuthActions.selectContextFailure, (state, { error }): AuthState => ({
    ...state,
    loading: false,
    error
  })),

  on(AuthActions.clearContext, (state): AuthState => ({
    ...state,
    contextToken: null,
    permissions: []
  })),

  on(AuthActions.logoutSuccess, (): AuthState => ({
    ...initialAuthState
  })),

  on(AuthActions.clearError, (state): AuthState => ({
    ...state,
    error: null
  }))
);
