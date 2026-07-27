import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'context-select',
    loadComponent: () => import('./pages/context-select/context-select.component').then(m => m.ContextSelectComponent)
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
