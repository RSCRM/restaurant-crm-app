import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
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
        path: 'organization',
        loadComponent: () => import('./organization/organization.component').then(m => m.OrganizationComponent)
      },
      {
        path: 'user',
        loadComponent: () => import('./user/user.component').then(m => m.UserComponent)
      }
    ]
  }
];
