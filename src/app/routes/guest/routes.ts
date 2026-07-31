import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'scan',
    loadComponent: () => import('./scan/scan.component').then(m => m.ScanComponent)
  },
  {
    path: 'table/:tableId',
    loadComponent: () => import('./cooking-status/cooking-status.component').then(m => m.CookingStatusComponent)
  },
  { path: '', redirectTo: 'scan', pathMatch: 'full' }
];
