import { createFeatureSelector, createSelector } from '@ngrx/store';

import { AuthState } from './auth.state';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectAccessToken = createSelector(selectAuthState, s => s.accessToken);
export const selectContexts = createSelector(selectAuthState, s => s.contexts);
export const selectSelectedContext = createSelector(selectAuthState, s => s.selectedContext);
export const selectSystemRoles = createSelector(selectAuthState, s => s.systemRoles);
export const selectAuthLoading = createSelector(selectAuthState, s => s.loading);
export const selectAuthError = createSelector(selectAuthState, s => s.error);

export const selectIsAuthenticated = createSelector(selectAccessToken, token => !!token);
export const selectIsAdmin = createSelector(selectSystemRoles, roles => (roles || []).includes('ADMIN'));
export const selectHasContext = createSelector(selectAuthState, state => !!state.contextToken);
export const selectSelectedOrganizationId = createSelector(selectSelectedContext, context => context?.organizationId ?? null);
export const selectSelectedBranchId = createSelector(selectSelectedContext, context => context?.branchId ?? null);
export const selectSelectedRole = createSelector(selectSelectedContext, context => context?.role ?? null);
export const selectSelectedDataScope = createSelector(selectSelectedContext, context => context?.dataScope ?? null);

export const selectPermissions = createSelector(selectAuthState, state => state.permissions ?? []);

export const selectHasPermission = (permission: string | string[]) =>
  createSelector(selectPermissions, selectIsAdmin, (perms, isAdmin) => {
    if (isAdmin) return true;
    const requiredPermissions = Array.isArray(permission) ? permission : [permission];
    return requiredPermissions.some(item => perms.includes(item));
  });
