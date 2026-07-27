import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { catchError, exhaustMap, map, of, switchMap, take, tap } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { AuthActions } from './auth.actions';
import { selectAccessToken } from './auth.selectors';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private router = inject(Router);
  private notification = inject(NzNotificationService);
  private store = inject(Store);

  // Step 1: Login → get accessToken + contexts + systemRoles
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ email, password }) =>
        this.authService.login({ email, password }).pipe(
          map(response => {
            return AuthActions.loginSuccess({
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
              contexts: response.contexts || [],
              systemRoles: response.systemRoles || []
            });
          }),
          catchError(err => {
            const message = err?.error?.errorMessage?.message || err?.error?.message || err?.message || 'Đăng nhập thất bại';
            return of(AuthActions.loginFailure({ error: message }));
          })
        )
      )
    )
  );

  // Step 2: After login success → check systemRoles
  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(({ accessToken, systemRoles }) => {
          if (systemRoles.includes('ADMIN')) {
            this.authService.setToken(accessToken, 72 * 60 * 60 * 1000);
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate(['/auth/context-select']);
          }
        })
      ),
    { dispatch: false }
  );

  // Step 3: Select context → call /auth/context with accessToken
  selectContext$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.selectContext),
      switchMap(({ organizationId, employeeId, role }) =>
        this.store.select(selectAccessToken).pipe(
          take(1),
          switchMap(accessToken =>
            this.authService.selectContext({ organizationId, employeeId, role }, accessToken || '').pipe(
              map(response => {
                this.authService.setToken(response.contextToken, 72 * 60 * 60 * 1000);
                return AuthActions.selectContextSuccess({
                  contextToken: response.contextToken
                });
              }),
              catchError(err => {
                const message = err?.error?.errorMessage?.message || err?.error?.message || err?.message || 'Chọn context thất bại';
                return of(AuthActions.selectContextFailure({ error: message }));
              })
            )
          )
        )
      )
    )
  );

  // Step 4: After context success → redirect to portal
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
            return AuthActions.logoutSuccess();
          }),
          catchError(() => {
            this.authService.clearToken();
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
          this.notification.error('Lỗi', error);
        })
      ),
    { dispatch: false }
  );
}
