import { createFeatureSelector, createSelector } from '@ngrx/store';

import { AuthState, SelectedContext } from './auth.state';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectAccessToken = createSelector(selectAuthState, s => s.accessToken);
export const selectContextToken = createSelector(selectAuthState, s => s.contextToken);
export const selectContexts = createSelector(selectAuthState, s => s.contexts);
export const selectSystemRoles = createSelector(selectAuthState, s => s.systemRoles);
export const selectAuthUser = createSelector(selectAuthState, s => s.user);
export const selectAuthLoading = createSelector(selectAuthState, s => s.loading);
export const selectAuthError = createSelector(selectAuthState, s => s.error);

export const selectIsAuthenticated = createSelector(selectAccessToken, token => !!token);
export const selectIsAdmin = createSelector(selectSystemRoles, roles => (roles || []).includes('ADMIN'));
export const selectHasContext = createSelector(selectContextToken, token => !!token);

export const selectOrgRole = createSelector(selectContextToken, token => {
  if (!token) return null;
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload)).orgRole ?? null;
  } catch {
    return null;
  }
});

/**
 * Owner theo claim `orgRole` của context token. Đây là điều kiện backend dùng để gác Org Role APIs
 * (OrgRoleGuard.requireOwner), khác với `selectIsOwnerContext` bên dưới vốn dựa trên việc không có employeeId.
 */
export const selectIsOwner = createSelector(selectOrgRole, role => role === 'OWNER');

// Decode permissions dynamically from contextToken JWT or state
export const selectPermissions = createSelector(selectContextToken, selectAuthState, (token, state) => {
  if (state.permissions && state.permissions.length > 0) {
    return state.permissions;
  }
  if (!token) return [];
  try {
    const base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return payload.permission || [];
  } catch {
    return [];
  }
});

export const selectHasPermission = (permission: string) =>
  createSelector(selectPermissions, selectIsAdmin, (perms, isAdmin) => isAdmin || perms.includes(permission));

/**
 * Gộp mọi thứ layout portal cần để dựng menu vào một selector.
 * Không tách thành hai `store.select` rồi `combineLatest`: cả hai vế cùng dẫn xuất từ `contextToken`,
 * tách ra sẽ khiến `buildMenu()` chạy hai lần mỗi lần token đổi.
 */
export const selectPortalMenuState = createSelector(
  selectHasContext,
  selectIsOwner,
  selectPermissions,
  (hasContext, isOwner, permissions) => ({
    hasContext,
    canManageOrgRole: isOwner && permissions.includes('ORG_ROLE_MANAGE')
  })
);

export const selectBranchId = createSelector(selectContextToken, token => {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return typeof payload.branchId === 'string' ? payload.branchId : null;
  } catch {
    return null;
  }
});

export const selectIsOwnerContext = createSelector(selectContextToken, token => {
  if (!token) return false;
  try {
    const base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return !payload.employeeId;
  } catch {
    return false;
  }
});

export const selectSelectedContext = createSelector(selectContextToken, (token): SelectedContext | null => {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return {
      organizationId: payload.organizationId ?? '',
      branchId: payload.branchId ?? null,
      role: payload.orgRole ?? '',
      dataScope: payload.dataScope ?? null
    };
  } catch {
    return null;
  }
});
