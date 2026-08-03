import { Routes } from '@angular/router';

import { customerSessionGuard } from './guards/customer-session.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'scan', pathMatch: 'full' },
  {
    path: 'scan',
    loadComponent: () => import('./qr-scanner/qr-scanner.component').then(m => m.QrScannerComponent)
  },
  {
    path: 'verify',
    loadComponent: () => import('./customer-form/customer-entry.component').then(m => m.CustomerEntryComponent)
  },
  {
    path: 'join',
    loadComponent: () => import('./join/join.component').then(m => m.JoinComponent)
  },
  {
    path: 'session',
    canActivate: [customerSessionGuard],
    loadComponent: () => import('./session/session.component').then(m => m.SessionComponent)
  }
];
