import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';

import { selectHasContext } from '../store/auth.selectors';

export const contextGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectHasContext).pipe(
    take(1),
    map(hasContext => {
      if (hasContext) return true;
      return router.createUrlTree(['/portal/context-select']);
    })
  );
};
