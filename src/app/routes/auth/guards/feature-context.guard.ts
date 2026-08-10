import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';

import { AuthActions } from '../store/auth.actions';
import { selectAuthState } from '../store/auth.selectors';
import { ContextInfo } from '../store/auth.state';

export const findSingleOwnerContext = (contexts: ContextInfo[]): ContextInfo | null => {
  const ownerContexts = contexts.filter(context => context.role === 'OWNER');
  return ownerContexts.length === 1 ? ownerContexts[0] : null;
};

export const featureContextGuard: CanActivateFn = (_route, state) => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectAuthState).pipe(
    take(1),
    map(auth => {
      if (auth.contextToken) return true;

      const context = findSingleOwnerContext(auth.contexts);
      if (!context) return router.createUrlTree(['/portal/context-select']);

      store.dispatch(
        AuthActions.selectContext({
          organizationId: context.organizationId,
          employeeId: context.employeeId ?? undefined,
          branchId: context.branchId ?? undefined,
          role: context.role,
          returnUrl: state.url
        })
      );
      return false;
    })
  );
};
