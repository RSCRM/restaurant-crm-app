import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { catchError, exhaustMap, map, of, switchMap, tap } from 'rxjs';

import { AuthActions } from './auth.actions';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private notification = inject(NzNotificationService);

  // Init: Restore auth state from localStorage on app startup
  init$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.init),
      switchMap(() => {
        const accessToken = this.authService.getAccessToken();
        if (accessToken) {
          const systemRoles = this.authService.getSystemRoles();
          const contextToken = this.authService.getContextToken();
          // Restore contextToken into DA_SERVICE_TOKEN if exists
          if (contextToken) {
            this.authService.setToken(contextToken, 72 * 60 * 60 * 1000);
          }
          return of(AuthActions.restoreAuth({ accessToken, systemRoles, contextToken }));
        }
        return of();
      })
    )
  );

  // Step 1: Login → get accessToken + contexts + systemRoles
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ email, password }) =>
        this.authService.login({ email, password }).pipe(
          map(response =>
            AuthActions.loginSuccess({
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
              contexts: response.contexts || [],
              systemRoles: response.systemRoles || []
            })
          ),
          catchError(err => {
            const message = err?.error?.errorMessage?.message || err?.error?.message || err?.message || 'Đăng nhập thất bại';
            return of(AuthActions.loginFailure({ error: message }));
          })
        )
      )
    )
  );

  // Step 2: After login success → persist accessToken & systemRoles, redirect by role
  // Force full page reload to ensure clean layout switch (portal ↔ admin)
  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(({ accessToken, systemRoles }) => {
          this.authService.capturePendingAttendance();
          this.authService.setAccessToken(accessToken);
          this.authService.setSystemRoles(systemRoles);
          if (systemRoles.includes('ADMIN')) {
            this.authService.clearPendingAttendance();
            // ADMIN: use accessToken as the main API token
            this.authService.setToken(accessToken, 72 * 60 * 60 * 1000);
            window.location.href = '/#/admin/dashboard';
          } else {
            // USER: redirect to context-select within portal
            window.location.href = '/#/portal/context-select';
          }
        })
      ),
    { dispatch: false }
  );

  // Step 3: Select context → call /auth/context with accessToken
  selectContext$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.selectContext),
      switchMap(({ organizationId, employeeId, branchId, role }) => {
        const accessToken = this.authService.getAccessToken();
        return this.authService.selectContext({ organizationId, employeeId, branchId, role }, accessToken || '').pipe(
          map(response => {
            // contextToken is the main API token for business calls
            this.authService.setToken(response.contextToken, 72 * 60 * 60 * 1000);
            this.authService.setContextToken(response.contextToken);
            return AuthActions.selectContextSuccess({ contextToken: response.contextToken });
          }),
          catchError(err => {
            const message = err?.error?.errorMessage?.message || err?.error?.message || err?.message || 'Chọn context thất bại';
            return of(AuthActions.selectContextFailure({ error: message }));
          })
        );
      })
    )
  );

  // Step 4: After context success → redirect to portal dashboard
  selectContextSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.selectContextSuccess),
        tap(() => {
          // Reload to ensure portal layout picks up the new context state
          window.location.href = this.authService.hasPendingAttendance() ? '/#/portal/attendance' : '/#/portal/dashboard';
        })
      ),
    { dispatch: false }
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      exhaustMap(() =>
        this.authService.logout().pipe(
          map(() => {
            this.authService.clearToken();
            this.authService.clearPersistedAuth();
            return AuthActions.logoutSuccess();
          }),
          catchError(() => {
            this.authService.clearToken();
            this.authService.clearPersistedAuth();
            return of(AuthActions.logoutSuccess());
          })
        )
      )
    )
  );

  logoutSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logoutSuccess),
        tap(() => {
          // Force full page reload to clear all Angular component state,
          // subscriptions, and singleton services (MenuService, SettingsService).
          // This prevents stale portal layout from persisting when logging in as admin.
          window.location.href = '/#/auth/login';
        })
      ),
    { dispatch: false }
  );

  loginFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginFailure, AuthActions.selectContextFailure),
        tap(({ error }) => {
          this.notification.error('Lỗi', error);
        })
      ),
    { dispatch: false }
  );
}
