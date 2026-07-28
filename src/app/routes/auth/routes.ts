import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'context-select',
    loadComponent: () => import('./context-select/context-select.component').then(m => m.ContextSelectComponent)
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
