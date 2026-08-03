import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import { MOCK_CATEGORIES, MOCK_COMBOS, MOCK_MODIFIER_GROUPS, MOCK_MODIFIER_OPTIONS, MOCK_PRODUCTS } from './menu.mock';
import {
  CategoryResponse,
  ComboItemRequest,
  ComboItemResponse,
  ComboResponse,
  CreateCategoryRequest,
  CreateComboRequest,
  CreateModifierGroupRequest,
  CreateModifierOptionRequest,
  CreateProductRequest,
  MENU_STATUS_AVAILABLE,
  ModifierGroupResponse,
  ModifierOptionResponse,
  ProductResponse
} from './menu.model';

const MOCK_DELAY = 300;

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function resolveImageUrl(imageFile: File | null | undefined, currentImageUrl: string | null): string | null {
  if (imageFile) return URL.createObjectURL(imageFile);
  return currentImageUrl;
}

@Injectable({ providedIn: 'root' })
export class MenuService {
  private categories: CategoryResponse[] = JSON.parse(JSON.stringify(MOCK_CATEGORIES));
  private products: ProductResponse[] = JSON.parse(JSON.stringify(MOCK_PRODUCTS));
  private modifierGroups: ModifierGroupResponse[] = JSON.parse(JSON.stringify(MOCK_MODIFIER_GROUPS));
  private modifierOptions: ModifierOptionResponse[] = JSON.parse(JSON.stringify(MOCK_MODIFIER_OPTIONS));
  private combos: ComboResponse[] = JSON.parse(JSON.stringify(MOCK_COMBOS));

  listCategories(branchId: string): Observable<CategoryResponse[]> {
    return of(this.categories.filter(c => c.branchId === branchId)).pipe(delay(MOCK_DELAY));
  }

  createCategory(request: CreateCategoryRequest): Observable<CategoryResponse> {
    const category: CategoryResponse = {
      id: generateId('cat'),
      branchId: request.branchId,
      categoryName: request.categoryName,
      description: request.description ?? null,
      displayOrder: request.displayOrder ?? null
    };
    this.categories = [...this.categories, category];
    return of(category).pipe(delay(MOCK_DELAY));
  }

  updateCategory(categoryId: string, request: CreateCategoryRequest): Observable<CategoryResponse> {
    const index = this.categories.findIndex(c => c.id === categoryId);
    if (index === -1) return throwError(() => new Error('Không tìm thấy danh mục'));

    const updated: CategoryResponse = {
      ...this.categories[index],
      categoryName: request.categoryName,
      description: request.description ?? null,
      displayOrder: request.displayOrder ?? null
    };
    this.categories = this.categories.map(c => (c.id === categoryId ? updated : c));
    return of(updated).pipe(delay(MOCK_DELAY));
  }

  deleteCategory(categoryId: string): Observable<void> {
    const productCount = this.products.filter(p => p.categoryId === categoryId).length;
    if (productCount > 0) {
      return throwError(() => new Error(`Danh mục đang có ${productCount} món, vui lòng chuyển món sang danh mục khác trước.`)).pipe(
        delay(MOCK_DELAY)
      );
    }
    this.categories = this.categories.filter(c => c.id !== categoryId);
    return of(undefined).pipe(delay(MOCK_DELAY));
  }

  listProducts(branchId: string): Observable<ProductResponse[]> {
    return of(this.products.filter(p => p.branchId === branchId)).pipe(delay(MOCK_DELAY));
  }

  createProduct(request: CreateProductRequest, imageFile?: File | null): Observable<ProductResponse> {
    const product: ProductResponse = {
      id: generateId('prod'),
      branchId: request.branchId,
      categoryId: request.categoryId ?? null,
      productName: request.productName,
      description: request.description ?? null,
      price: request.price,
      imageUrl: resolveImageUrl(imageFile, null),
      status: request.status ?? MENU_STATUS_AVAILABLE,
      requiresPreparation: request.requiresPreparation ?? false
    };
    this.products = [...this.products, product];
    return of(product).pipe(delay(MOCK_DELAY));
  }

  updateProduct(productId: string, request: CreateProductRequest, imageFile?: File | null): Observable<ProductResponse> {
    const index = this.products.findIndex(p => p.id === productId);
    if (index === -1) return throwError(() => new Error('Không tìm thấy món'));

    const current = this.products[index];
    const updated: ProductResponse = {
      ...current,
      categoryId: request.categoryId ?? null,
      productName: request.productName,
      description: request.description ?? null,
      price: request.price,
      imageUrl: resolveImageUrl(imageFile, current.imageUrl),
      status: request.status ?? MENU_STATUS_AVAILABLE,
      requiresPreparation: request.requiresPreparation ?? false
    };
    this.products = this.products.map(p => (p.id === productId ? updated : p));
    return of(updated).pipe(delay(MOCK_DELAY));
  }

  deleteProduct(productId: string): Observable<void> {
    this.products = this.products.filter(p => p.id !== productId);
    this.modifierGroups = this.modifierGroups.filter(g => g.productId !== productId);
    return of(undefined).pipe(delay(MOCK_DELAY));
  }

  listModifierGroups(productId: string): Observable<ModifierGroupResponse[]> {
    return of(this.modifierGroups.filter(g => g.productId === productId)).pipe(delay(MOCK_DELAY));
  }

  createModifierGroup(productId: string, request: CreateModifierGroupRequest): Observable<ModifierGroupResponse> {
    const group: ModifierGroupResponse = {
      id: generateId('group'),
      productId,
      groupName: request.groupName,
      description: request.description ?? null,
      minSelection: request.minSelection,
      maxSelection: request.maxSelection
    };
    this.modifierGroups = [...this.modifierGroups, group];
    return of(group).pipe(delay(MOCK_DELAY));
  }

  updateModifierGroup(groupId: string, request: CreateModifierGroupRequest): Observable<ModifierGroupResponse> {
    const index = this.modifierGroups.findIndex(g => g.id === groupId);
    if (index === -1) return throwError(() => new Error('Không tìm thấy nhóm tuỳ chọn'));

    const updated: ModifierGroupResponse = {
      ...this.modifierGroups[index],
      groupName: request.groupName,
      description: request.description ?? null,
      minSelection: request.minSelection,
      maxSelection: request.maxSelection
    };
    this.modifierGroups = this.modifierGroups.map(g => (g.id === groupId ? updated : g));
    return of(updated).pipe(delay(MOCK_DELAY));
  }

  deleteModifierGroup(groupId: string): Observable<void> {
    this.modifierGroups = this.modifierGroups.filter(g => g.id !== groupId);
    this.modifierOptions = this.modifierOptions.filter(o => o.groupId !== groupId);
    return of(undefined).pipe(delay(MOCK_DELAY));
  }

  listModifierOptions(groupId: string): Observable<ModifierOptionResponse[]> {
    return of(this.modifierOptions.filter(o => o.groupId === groupId)).pipe(delay(MOCK_DELAY));
  }

  createModifierOption(groupId: string, request: CreateModifierOptionRequest): Observable<ModifierOptionResponse> {
    const option: ModifierOptionResponse = {
      id: generateId('option'),
      groupId,
      optionName: request.optionName,
      additionalPrice: request.additionalPrice,
      status: request.status ?? MENU_STATUS_AVAILABLE
    };
    this.modifierOptions = [...this.modifierOptions, option];
    return of(option).pipe(delay(MOCK_DELAY));
  }

  updateModifierOption(optionId: string, request: CreateModifierOptionRequest): Observable<ModifierOptionResponse> {
    const index = this.modifierOptions.findIndex(o => o.id === optionId);
    if (index === -1) return throwError(() => new Error('Không tìm thấy tuỳ chọn'));

    const updated: ModifierOptionResponse = {
      ...this.modifierOptions[index],
      optionName: request.optionName,
      additionalPrice: request.additionalPrice,
      status: request.status ?? MENU_STATUS_AVAILABLE
    };
    this.modifierOptions = this.modifierOptions.map(o => (o.id === optionId ? updated : o));
    return of(updated).pipe(delay(MOCK_DELAY));
  }

  deleteModifierOption(optionId: string): Observable<void> {
    this.modifierOptions = this.modifierOptions.filter(o => o.id !== optionId);
    return of(undefined).pipe(delay(MOCK_DELAY));
  }

  listCombos(branchId: string): Observable<ComboResponse[]> {
    return of(this.combos.filter(c => c.branchId === branchId)).pipe(delay(MOCK_DELAY));
  }

  createCombo(request: CreateComboRequest, imageFile?: File | null): Observable<ComboResponse> {
    const combo: ComboResponse = {
      id: generateId('combo'),
      branchId: request.branchId,
      comboName: request.comboName,
      description: request.description ?? null,
      price: request.price,
      imageUrl: resolveImageUrl(imageFile, null),
      status: request.status ?? MENU_STATUS_AVAILABLE,
      items: []
    };
    this.combos = [...this.combos, combo];
    return of(combo).pipe(delay(MOCK_DELAY));
  }

  updateCombo(comboId: string, request: CreateComboRequest, imageFile?: File | null): Observable<ComboResponse> {
    const index = this.combos.findIndex(c => c.id === comboId);
    if (index === -1) return throwError(() => new Error('Không tìm thấy combo'));

    const current = this.combos[index];
    const updated: ComboResponse = {
      ...current,
      comboName: request.comboName,
      description: request.description ?? null,
      price: request.price,
      imageUrl: resolveImageUrl(imageFile, current.imageUrl),
      status: request.status ?? MENU_STATUS_AVAILABLE
    };
    this.combos = this.combos.map(c => (c.id === comboId ? updated : c));
    return of(updated).pipe(delay(MOCK_DELAY));
  }

  deleteCombo(comboId: string): Observable<void> {
    this.combos = this.combos.filter(c => c.id !== comboId);
    return of(undefined).pipe(delay(MOCK_DELAY));
  }

  addComboItem(comboId: string, request: ComboItemRequest): Observable<ComboItemResponse> {
    const item: ComboItemResponse = {
      id: generateId('combo-item'),
      comboId,
      productId: request.productId,
      quantity: request.quantity,
      modifierOptionIds: request.modifierOptionIds
    };
    this.combos = this.combos.map(c => (c.id === comboId ? { ...c, items: [...c.items, item] } : c));
    return of(item).pipe(delay(MOCK_DELAY));
  }

  updateComboItem(itemId: string, request: ComboItemRequest): Observable<ComboItemResponse> {
    const combo = this.combos.find(c => c.items.some(item => item.id === itemId));
    if (!combo) return throwError(() => new Error('Không tìm thấy món trong combo'));

    const existingItem = combo.items.find(item => item.id === itemId);
    if (!existingItem) return throwError(() => new Error('Không tìm thấy món trong combo'));

    const updatedItem: ComboItemResponse = {
      ...existingItem,
      productId: request.productId,
      quantity: request.quantity,
      modifierOptionIds: request.modifierOptionIds
    };
    this.combos = this.combos.map(c =>
      c.id === combo.id ? { ...c, items: c.items.map(item => (item.id === itemId ? updatedItem : item)) } : c
    );
    return of(updatedItem).pipe(delay(MOCK_DELAY));
  }

  deleteComboItem(itemId: string): Observable<void> {
    this.combos = this.combos.map(combo => ({ ...combo, items: combo.items.filter(item => item.id !== itemId) }));
    return of(undefined).pipe(delay(MOCK_DELAY));
  }
}
