import { Routes } from '@angular/router';

export default [
  // {
  //   path: 'inventory-categories',
  //   loadComponent: () =>
  //     import('./inventory-category/inventory-category.component').then(
  //       m => m.IngredientCategoryComponent
  //     )
  // },
  {
    path: '',
    loadComponent: () => import('./inventory/inventory.component').then(m => m.InventoryComponent)
  },
  {
    path: 'transactions',
    loadComponent: () => import('./inventory-transaction/inventory-transaction.component').then(m => m.InventoryTransactionComponent)
  }
] as Routes;
