import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';

import { selectIsOwner } from '../store/auth.selectors';

export const ownerGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectIsOwner).pipe(
    take(1),
    map(isOwner => {
      if (isOwner) return true;
      return router.createUrlTree(['/portal/dashboard']);
    })
  );
};
