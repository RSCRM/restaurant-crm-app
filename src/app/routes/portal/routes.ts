import { Routes } from '@angular/router';

import { contextGuard } from '../auth/guards/context.guard';
import { permissionGuard } from '../auth/guards/permission.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'context-select', pathMatch: 'full' },
  {
    path: 'context-select',
    loadComponent: () => import('./context-select/context-select.component').then(m => m.ContextSelectComponent)
  },
  {
    path: 'dashboard',
    canActivate: [contextGuard],
    loadComponent: () => import('./dashboard/portal-dashboard.component').then(m => m.PortalDashboardComponent)
  },
  {
    path: 'branch',
    canActivate: [contextGuard, permissionGuard('ORGANIZATION_BRANCH_VIEW')],
    loadComponent: () => import('./branch/branch.component').then(m => m.BranchComponent)
  },
  {
    path: 'order',
    canActivate: [contextGuard, permissionGuard('ORDER_READ')],
    loadComponent: () => import('./order/order.component').then(m => m.OrderComponent)
  },
  {
    path: 'menu',
    canActivate: [contextGuard, permissionGuard('MENU_MANAGE')],
    loadComponent: () => import('./menu/menu.component').then(m => m.MenuComponent)
  },
  {
    path: 'table',
    canActivate: [contextGuard, permissionGuard('TABLE_MANAGE')],
    loadComponent: () => import('./table/table.component').then(m => m.TableComponent)
  },
  {
    path: 'booking',
    canActivate: [contextGuard],
    loadComponent: () => import('./booking/booking.component').then(m => m.BookingComponent)
  },
  {
    path: 'inventory',
    canActivate: [contextGuard, permissionGuard('INGREDIENT_VIEW')],
    loadComponent: () => import('./inventory/inventory.component').then(m => m.InventoryComponent)
  },
  {
    path: 'employee',
    canActivate: [contextGuard, permissionGuard('STAFF_MANAGE')],
    loadComponent: () => import('./employee/employee.component').then(m => m.EmployeeComponent)
  },
  {
    path: 'invoice',
    canActivate: [contextGuard, permissionGuard('PAYMENT_READ')],
    loadComponent: () => import('./invoice/invoice.component').then(m => m.InvoiceComponent)
  }
];
