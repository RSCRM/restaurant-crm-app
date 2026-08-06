import { Routes } from '@angular/router';

import { contextGuard } from '../auth/guards/context.guard';
import { ownerGuard } from '../auth/guards/owner.guard';
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
    path: 'order',
    canActivate: [contextGuard, permissionGuard('ORDER_READ')],
    loadComponent: () => import('./order/order.component').then(m => m.OrderComponent)
  },
  {
    path: 'order/:id/detail',
    loadComponent: () => import('./order/order-detail/order-detail.component').then(m => m.OrderDetailComponent)
  },
  {
    path: 'menu',
    canActivate: [contextGuard, permissionGuard('MENU_MANAGE')],
    children: [
      { path: '', redirectTo: 'product', pathMatch: 'full' },
      {
        path: 'product',
        loadComponent: () => import('./menu/product/product.component').then(m => m.ProductComponent)
      },
      {
        path: 'product/:id/detail',
        loadComponent: () => import('./menu/product/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
      },
      {
        path: 'combo',
        loadComponent: () => import('./menu/combo/combo.component').then(m => m.ComboComponent)
      }
    ]
  },
  {
    path: 'table/:id/detail',
    canActivate: [contextGuard, permissionGuard('TABLE_MAP_READ'), permissionGuard('BOOKING_READ')],
    loadComponent: () => import('./table/table-detail.component').then(m => m.TableDetailComponent)
  },
  {
    path: 'table',
    canActivate: [
      contextGuard,
      permissionGuard('TABLE_MAP_READ'),
      permissionGuard('TABLE_SEARCH_READ'),
      permissionGuard('TABLE_SESSION_CREATE')
    ],
    loadComponent: () => import('./table/table.component').then(m => m.TableComponent)
  },
  {
    path: 'booking',
    // canActivate: [contextGuard, permissionGuard('BOOKING_READ')],
    loadComponent: () => import('./booking/booking.component').then(m => m.BookingComponent)
  },
  {
    path: 'inventory',
    canActivate: [contextGuard, permissionGuard('INVENTORY_VIEW')],
    children: [
      { path: '', redirectTo: 'inventory', pathMatch: 'full' },
      {
        path: 'inventory-category',
        loadComponent: () => import('./inventory/inventory-category/inventory-category.component').then(m => m.InventoryCategoryComponent)
      },
      {
        path: 'inventory',
        loadComponent: () => import('./inventory/inventory/inventory.component').then(m => m.InventoryComponent)
      },
      {
        path: 'inventory-transaction',
        loadComponent: () =>
          import('./inventory/inventory-transaction/inventory-transaction.component').then(m => m.InventoryTransactionComponent)
      }
    ]
  },
  {
    path: 'employee',
    canActivate: [contextGuard, permissionGuard('EMPLOYEE_VIEW')],
    loadComponent: () => import('./employee/employee.component').then(m => m.EmployeeComponent)
  },
  {
    path: 'org-role',
    canActivate: [contextGuard, ownerGuard, permissionGuard('ORG_ROLE_MANAGE')],
    loadComponent: () => import('./org-role/org-role.component').then(m => m.OrgRoleComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'invoice',
    canActivate: [contextGuard, permissionGuard('PAYMENT_READ')],
    loadComponent: () => import('./invoice/invoice.component').then(m => m.InvoiceComponent)
  },
  {
    path: 'customer',
    canActivate: [contextGuard, permissionGuard('CUSTOMER_READ')],
    loadComponent: () => import('./customer/customer.component').then(m => m.CustomerComponent)
  },
  {
    path: 'attendance',
    canActivate: [contextGuard],
    loadComponent: () => import('./attendance/attendance.component').then(m => m.AttendanceComponent)
  },
  {
    path: 'schedule',
    canActivate: [contextGuard],
    loadComponent: () => import('./schedule/schedule.component').then(m => m.ScheduleComponent)
  }
];
