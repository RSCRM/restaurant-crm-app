import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'license',
    loadComponent: () => import('./license/license.component').then(m => m.LicenseComponent)
  },
  {
    path: 'license/:id/detail',
    loadComponent: () => import('./license/license-detail/license-detail.component').then(m => m.LicenseDetailComponent)
  },
  {
    path: 'organization',
    loadComponent: () => import('./organization/organization.component').then(m => m.OrganizationComponent)
  },
  {
    path: 'organization/:id/detail',
    loadComponent: () => import('./organization/organization-detail/organization-detail.component').then(m => m.OrganizationDetailComponent)
  },
  {
    path: 'user',
    loadComponent: () => import('./user/user.component').then(m => m.UserComponent)
  },
  {
    path: 'user/:id/detail',
    loadComponent: () => import('./user/user-detail/user-detail.component').then(m => m.UserDetailComponent)
  }
];
