import { Routes } from '@angular/router';

import { DashboardWelcomeComponent } from './welcome/welcome.component';

export const routes: Routes = [
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
  { path: 'welcome', component: DashboardWelcomeComponent }
];
