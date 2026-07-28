import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';

import { selectHasPermission } from '../store/auth.selectors';

export function permissionGuard(permission: string): CanActivateFn {
  return () => {
    const store = inject(Store);
    const router = inject(Router);

    return store.select(selectHasPermission(permission)).pipe(
      take(1),
      map(has => {
        if (has) return true;
        return router.createUrlTree(['/portal/dashboard']);
      })
    );
  };
}
