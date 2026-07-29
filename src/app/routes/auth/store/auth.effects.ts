import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { catchError, exhaustMap, map, of, switchMap, tap } from 'rxjs';

import { AuthActions } from './auth.actions';
import { SelectedContext } from './auth.state';
import { TokenPayload } from '../models/auth.model';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private router = inject(Router);
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
          const restoredContext = this.getContextState(contextToken);
          const persistedContext = this.authService.getSelectedContext();
          const contexts = this.authService.getContexts();
          return of(
            AuthActions.restoreAuth({
              accessToken,
              systemRoles,
              contexts,
              contextToken,
              permissions: restoredContext.permissions,
              selectedContext: this.mergeSelectedContext(restoredContext.selectedContext, persistedContext)
            })
          );
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
  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap({
          next: ({ accessToken, contexts, systemRoles }) => {
            this.authService.setAccessToken(accessToken);
            this.authService.setContexts(contexts);
            this.authService.setSystemRoles(systemRoles);
            if (systemRoles.includes('ADMIN')) {
              // ADMIN: use accessToken as the main API token
              this.authService.setToken(accessToken, 72 * 60 * 60 * 1000);
              this.router.navigate(['/admin/dashboard']);
            } else {
              // USER: redirect to context-select within portal
              this.router.navigate(['/portal/context-select']);
            }
          }
        })
      ),
    { dispatch: false }
  );

  // Step 3: Select context → call /auth/context with accessToken
  selectContext$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.selectContext),
      switchMap(({ organizationId, organizationName, employeeId, branchId, branchName, role }) => {
        const accessToken = this.authService.getAccessToken();
        return this.authService.selectContext({ organizationId, employeeId, role }, accessToken || '').pipe(
          map(response => {
            // contextToken is the main API token for business calls
            this.authService.setToken(response.contextToken, 72 * 60 * 60 * 1000);
            this.authService.setContextToken(response.contextToken);
            const contextState = this.getContextState(response.contextToken);
            const selectedContext = this.mergeSelectedContext(contextState.selectedContext, {
              employeeId: employeeId ?? null,
              organizationId,
              organizationName: organizationName ?? null,
              branchId: branchId ?? null,
              branchName: branchName ?? null,
              role
            });
            this.authService.setSelectedContext(selectedContext);
            return AuthActions.selectContextSuccess({
              contextToken: response.contextToken,
              permissions: contextState.permissions,
              selectedContext
            });
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
        tap({
          next: () => {
            this.router.navigate(['/portal/dashboard']);
          }
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
        tap({
          next: () => {
            this.router.navigate(['/auth/login']);
          }
        })
      ),
    { dispatch: false }
  );

  loginFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginFailure, AuthActions.selectContextFailure),
        tap({
          next: ({ error }) => {
            this.notification.error('Lỗi', error);
          }
        })
      ),
    { dispatch: false }
  );

  private getContextState(contextToken: string | null): { permissions: string[]; selectedContext: SelectedContext | null } {
    if (!contextToken) {
      return { permissions: [], selectedContext: null };
    }

    const payload = this.authService.parseJwtPayload(contextToken) as Partial<TokenPayload>;
    const selectedContext: SelectedContext = {
      employeeId: this.toNullableString(payload.employeeId),
      organizationId: this.toNullableString(payload.organizationId),
      organizationName: null,
      branchId: this.toNullableString(payload.branchId),
      branchName: null,
      role: this.toNullableString(payload.orgRole)
    };

    return {
      permissions: this.toStringArray(payload.permission),
      selectedContext
    };
  }

  private toNullableString(value: unknown): string | null {
    return typeof value === 'string' && value.length > 0 ? value : null;
  }

  private toStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }

    return typeof value === 'string' && value.length > 0 ? [value] : [];
  }

  private mergeSelectedContext(tokenContext: SelectedContext | null, savedContext: SelectedContext | null): SelectedContext | null {
    if (!tokenContext && !savedContext) return null;

    return {
      employeeId: tokenContext?.employeeId ?? savedContext?.employeeId ?? null,
      organizationId: tokenContext?.organizationId ?? savedContext?.organizationId ?? null,
      organizationName: savedContext?.organizationName ?? tokenContext?.organizationName ?? null,
      branchId: tokenContext?.branchId ?? savedContext?.branchId ?? null,
      branchName: savedContext?.branchName ?? tokenContext?.branchName ?? null,
      role: tokenContext?.role ?? savedContext?.role ?? null
    };
  }
}
