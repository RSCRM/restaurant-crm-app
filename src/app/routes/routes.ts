import { Routes } from '@angular/router';
import { authGuard } from '../auth/guards/auth.guard';
import { adminGuard } from '../auth/guards/admin.guard';
import { portalGuard } from '../auth/guards/portal.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('../auth/auth.routes').then(m => m.routes)
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadChildren: () => import('../admin/admin.routes').then(m => m.routes)
  },
  {
    path: 'portal',
    canActivate: [authGuard, portalGuard],
    loadChildren: () => import('../portal/portal.routes').then(m => m.routes)
  },
  { path: 'exception', loadChildren: () => import('./exception/routes').then(m => m.routes) },
  { path: '**', redirectTo: 'exception/404' }
];
