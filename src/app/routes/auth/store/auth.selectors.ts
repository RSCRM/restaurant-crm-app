import { createFeatureSelector, createSelector } from '@ngrx/store';

import { AuthState } from './auth.state';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectAccessToken = createSelector(selectAuthState, s => s.accessToken);
export const selectContextToken = createSelector(selectAuthState, s => s.contextToken);
export const selectContexts = createSelector(selectAuthState, s => s.contexts);
export const selectSelectedContext = createSelector(selectAuthState, s => s.selectedContext);
export const selectSystemRoles = createSelector(selectAuthState, s => s.systemRoles);
export const selectAuthUser = createSelector(selectAuthState, s => s.user);
export const selectPermissions = createSelector(selectAuthState, s => s.permissions);
export const selectAuthLoading = createSelector(selectAuthState, s => s.loading);
export const selectAuthError = createSelector(selectAuthState, s => s.error);

export const selectIsAuthenticated = createSelector(selectAccessToken, token => !!token);

export const selectIsAdmin = createSelector(selectSystemRoles, roles => roles.includes('ADMIN'));

export const selectHasContext = createSelector(selectContextToken, token => !!token);
export const selectSelectedOrganizationId = createSelector(selectSelectedContext, context => context?.organizationId ?? null);
export const selectSelectedOrganizationName = createSelector(selectSelectedContext, context => context?.organizationName ?? null);
export const selectSelectedBranchId = createSelector(selectSelectedContext, context => context?.branchId ?? null);
export const selectSelectedBranchName = createSelector(selectSelectedContext, context => context?.branchName ?? null);
export const selectSelectedRole = createSelector(selectSelectedContext, context => context?.role ?? null);

export const selectHasPermission = (permission: string | string[]) =>
  createSelector(selectPermissions, selectSelectedRole, (perms, role) => {
    if (role === 'OWNER') return true;
    const permissions = Array.isArray(permission) ? permission : [permission];
    return permissions.some(item => perms.includes(item));
  });
