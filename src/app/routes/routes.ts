import { Routes } from '@angular/router';

import { adminGuard } from './auth/guards/admin.guard';
import { authGuard } from './auth/guards/auth.guard';
import { portalGuard } from './auth/guards/portal.guard';
import { LayoutAdmin } from '../layout/admin/admin';
import { LayoutBlank } from '../layout/blank/blank';
import { LayoutPortal } from '../layout/portal/portal';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/routes').then(m => m.routes)
  },
  {
    path: 'admin',
    component: LayoutAdmin,
    canActivate: [authGuard, adminGuard],
    loadChildren: () => import('./admin/routes').then(m => m.routes)
  },
  {
    path: 'portal',
    component: LayoutPortal,
    canActivate: [authGuard, portalGuard],
    loadChildren: () => import('./portal/routes').then(m => m.routes)
  },
  {
    path: 'customer',
    component: LayoutBlank,
    loadChildren: () => import('./customer/routes').then(m => m.routes),
    canActivate: []
  },
  {
    path: 'exception',
    loadChildren: () => import('./exception/routes').then(m => m.routes)
  },
  {
    path: '**',
    redirectTo: 'exception/404'
  }
];
