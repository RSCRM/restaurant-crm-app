import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';

import { selectIsAdmin, selectIsAuthenticated } from '../store/auth.selectors';

export const portalGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectIsAuthenticated).pipe(
    take(1),
    map(isAuth => {
      if (!isAuth) return router.createUrlTree(['/auth/login']);
      return true;
    })
  );
};
