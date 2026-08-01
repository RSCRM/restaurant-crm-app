import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { getHttpErrorMessage } from '@core';
import { ALAIN_I18N_TOKEN } from '@delon/theme';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { catchError, exhaustMap, map, of, switchMap, tap } from 'rxjs';

import { AuthActions } from './auth.actions';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private router = inject(Router);
  private notification = inject(NzNotificationService);
  private i18n = inject(ALAIN_I18N_TOKEN);

  // Init: Restore auth state from localStorage on app startup
  init$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.init),
      switchMap(() => {
        const accessToken = this.authService.getAccessToken();
        if (accessToken) {
          const systemRoles = this.authService.getSystemRoles();
          const contextToken = this.authService.getContextToken();
          this.authService.setToken(contextToken ?? accessToken, 72 * 60 * 60 * 1000);
          const permissions = contextToken ? this.authService.getPermissions(contextToken) : [];
          return of(AuthActions.restoreAuth({ accessToken, systemRoles, contextToken, permissions }));
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
            return of(AuthActions.loginFailure({ error: getHttpErrorMessage(this.i18n, err, 'app.login.failed') }));
          })
        )
      )
    )
  );

  // Step 2: After login success → persist accessToken & systemRoles, redirect by role
  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(({ accessToken, systemRoles }) => {
          this.authService.setAccessToken(accessToken);
          this.authService.setSystemRoles(systemRoles);
          this.authService.setToken(accessToken, 72 * 60 * 60 * 1000);
          if (systemRoles.includes('ADMIN')) {
            this.router.navigate(['/admin/dashboard']);
          } else {
            // USER: redirect to context-select within portal
            this.router.navigate(['/portal/context-select']);
          }
        })
      ),
    { dispatch: false }
  );

  // Step 3: Select context → call /auth/context with accessToken
  selectContext$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.selectContext),
      switchMap(({ organizationId, employeeId, role }) => {
        const accessToken = this.authService.getAccessToken();
        return this.authService.selectContext({ organizationId, employeeId, role }, accessToken || '').pipe(
          map(response => {
            // contextToken is the main API token for business calls
            this.authService.setToken(response.contextToken, 72 * 60 * 60 * 1000);
            this.authService.setContextToken(response.contextToken);
            return AuthActions.selectContextSuccess({
              contextToken: response.contextToken,
              permissions: this.authService.getPermissions(response.contextToken)
            });
          }),
          catchError(err => {
            return of(AuthActions.selectContextFailure({ error: getHttpErrorMessage(this.i18n, err, 'context.select-failed') }));
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
          this.router.navigate(['/portal/dashboard']);
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
          this.router.navigate(['/auth/login']);
        })
      ),
    { dispatch: false }
  );

  loginFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginFailure, AuthActions.selectContextFailure),
        tap(({ error }) => {
          this.notification.error(this.i18n.fanyi('common.error'), error);
        })
      ),
    { dispatch: false }
  );
}
