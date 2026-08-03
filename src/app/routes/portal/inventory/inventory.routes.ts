import { Routes } from '@angular/router';

export default [
  {
    path: 'ingredient-categories',
    loadComponent: () =>
      import('./ingredient-category/ingredient-category.component').then(
        m => m.IngredientCategoryComponent
      )
  },
  {
    path: 'ingredients',
    loadComponent: () =>
      import('./ingredient/ingredient.component').then(
        m => m.IngredientComponent
      )
  },
  {
    path: '',
    loadComponent: () =>
      import('./inventory/inventory.component').then(
        m => m.InventoryComponent
      )
  },
  {
    path: 'transactions',
    loadComponent: () =>
      import('./inventory-transaction/inventory-transaction.component').then(
        m => m.InventoryTransactionComponent
      )
  }
] as Routes;
