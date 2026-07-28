import { createFeatureSelector, createSelector } from '@ngrx/store';

import { AuthState } from './auth.state';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectAccessToken = createSelector(selectAuthState, s => s.accessToken);
export const selectContextToken = createSelector(selectAuthState, s => s.contextToken);
export const selectContexts = createSelector(selectAuthState, s => s.contexts);
export const selectSystemRoles = createSelector(selectAuthState, s => s.systemRoles);
export const selectAuthUser = createSelector(selectAuthState, s => s.user);
export const selectPermissions = createSelector(selectAuthState, s => s.permissions);
export const selectAuthLoading = createSelector(selectAuthState, s => s.loading);
export const selectAuthError = createSelector(selectAuthState, s => s.error);

export const selectIsAuthenticated = createSelector(selectAccessToken, token => !!token);

export const selectIsAdmin = createSelector(selectSystemRoles, roles => roles.includes('ADMIN'));

export const selectHasPermission = (permission: string) =>
  createSelector(selectPermissions, perms => perms.includes(permission));
