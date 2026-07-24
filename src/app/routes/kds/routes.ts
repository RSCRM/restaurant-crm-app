import { Routes } from '@angular/router';

import { KitchenOrderComponent } from './kitchen-order/kitchen-order.component';

export const routes: Routes = [
  { path: '', redirectTo: 'orders', pathMatch: 'full' },
  { path: 'orders', component: KitchenOrderComponent }
];
