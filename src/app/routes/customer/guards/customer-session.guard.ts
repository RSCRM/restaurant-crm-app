import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { CustomerSessionStore } from '../customer-session.store';

export const customerSessionGuard: CanActivateFn = () => {
  const store = inject(CustomerSessionStore);
  const router = inject(Router);

  return store.isActive() ? true : router.createUrlTree(['/customer/scan']);
};
