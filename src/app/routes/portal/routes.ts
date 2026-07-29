import { Routes } from '@angular/router';

import { permissionGuard } from '../auth/guards/permission.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/portal-dashboard.component').then(m => m.PortalDashboardComponent)
  },
  {
    path: 'order',
    canActivate: [permissionGuard('ORDER_READ')],
    loadComponent: () => import('./order/order.component').then(m => m.OrderComponent)
  },
  {
    path: 'menu',
    canActivate: [permissionGuard('MENU_MANAGE')],
    loadComponent: () => import('./menu/menu.component').then(m => m.MenuComponent)
  },
  {
    path: 'table',
    canActivate: [permissionGuard('TABLE_MANAGE')],
    loadComponent: () => import('./table/table.component').then(m => m.TableComponent)
  },
  {
    path: 'booking',
    loadComponent: () => import('./booking/booking.component').then(m => m.BookingComponent)
  },
  {
    path: 'inventory',
    canActivate: [permissionGuard('INGREDIENT_VIEW')],
    loadComponent: () => import('./inventory/inventory.component').then(m => m.InventoryComponent)
  },
  {
    path: 'employee',
    canActivate: [permissionGuard('STAFF_MANAGE')],
    loadComponent: () => import('./employee/employee.component').then(m => m.EmployeeComponent)
  },
  {
    path: 'invoice',
    canActivate: [permissionGuard('PAYMENT_READ')],
    loadComponent: () => import('./invoice/invoice.component').then(m => m.InvoiceComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('../account/profile/profile.component').then(m => m.ProfileComponent)
  }
];
