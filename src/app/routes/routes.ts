import { Routes } from '@angular/router';
import { authGuard } from './auth/guards/auth.guard';
import { adminGuard } from './auth/guards/admin.guard';
import { portalGuard } from './auth/guards/portal.guard';
import { LayoutAdmin } from '../layout/admin/admin';
import { LayoutPortal } from '../layout/portal/portal';
import { LayoutBlank } from '../layout/blank/blank';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
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
    path: 'guest',
    component: LayoutBlank,
    loadChildren: () => import('./guest/routes').then(m => m.routes)
  },
  { path: 'exception', loadChildren: () => import('./exception/routes').then(m => m.routes) },
  { path: '**', redirectTo: 'exception/404' }
];
