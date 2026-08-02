import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'scan', pathMatch: 'full' },
  {
    path: 'scan',
    loadComponent: () => import('./qr-scanner/qr-scanner.component').then(m => m.QrScannerComponent)
  },
  {
    path: 'entry',
    loadComponent: () => import('./customer-form/customer-entry.component').then(m => m.CustomerEntryComponent)
  }
];
