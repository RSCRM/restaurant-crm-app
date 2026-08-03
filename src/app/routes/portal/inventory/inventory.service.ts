import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '@env/environment';
import { Observable, map } from 'rxjs';

import { ApiResponse } from '../../auth/models/auth.model';
import {
  CreateIngredientCategoryRequest,
  UpdateIngredientCategoryRequest,
  IngredientCategoryResponse,

  CreateIngredientRequest,
  UpdateIngredientRequest,
  IngredientResponse,

  CreateInventoryRequest,
  UpdateInventoryRequest,
  InventorySearchRequest,
  InventoryResponse,

  CreateInventoryTransactionRequest,
  InventoryTransactionSearchRequest,
  InventoryTransactionResponse,

  PagingParams,
  PagingResponse
} from './inventory.model';

const API = environment.api['apiPrefix'];

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private http = inject(HttpClient);

  private readonly CATEGORY_API = `${API}/erp/ingredient-categories`;
  private readonly INGREDIENT_API = `${API}/erp/ingredients`;
  private readonly INVENTORY_API = `${API}/erp/inventories`;
  private readonly TRANSACTION_API = `${API}/erp/inventory-transactions`;

  // ============================================================
  // Ingredient Category
  // ============================================================

  getIngredientCategories(params: PagingParams): Observable<PagingResponse<IngredientCategoryResponse>> {
    const httpParams = new HttpParams()
      .set('page', params.page)
      .set('size', params.size);

    return this.http
      .get<ApiResponse<PagingResponse<IngredientCategoryResponse>>>(this.CATEGORY_API, { params: httpParams })
      .pipe(map(res => res.data));
  }

  getIngredientCategory(id: string): Observable<IngredientCategoryResponse> {
    return this.http
      .get<ApiResponse<IngredientCategoryResponse>>(`${this.CATEGORY_API}/${id}`)
      .pipe(map(res => res.data));
  }

  createIngredientCategory(request: CreateIngredientCategoryRequest): Observable<IngredientCategoryResponse> {
    return this.http
      .post<ApiResponse<IngredientCategoryResponse>>(this.CATEGORY_API, request)
      .pipe(map(res => res.data));
  }

  updateIngredientCategory(
    id: string,
    request: UpdateIngredientCategoryRequest
  ): Observable<IngredientCategoryResponse> {
    return this.http
      .patch<ApiResponse<IngredientCategoryResponse>>(`${this.CATEGORY_API}/${id}`, request)
      .pipe(map(res => res.data));
  }

  deleteIngredientCategory(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.CATEGORY_API}/${id}`)
      .pipe(map(res => res.data));
  }

  // ============================================================
  // Ingredient
  // ============================================================

  getIngredients(params: PagingParams): Observable<PagingResponse<IngredientResponse>> {
    const httpParams = new HttpParams()
      .set('page', params.page)
      .set('size', params.size);

    return this.http
      .get<ApiResponse<PagingResponse<IngredientResponse>>>(this.INGREDIENT_API, { params: httpParams })
      .pipe(map(res => res.data));
  }

  getIngredient(id: string): Observable<IngredientResponse> {
    return this.http
      .get<ApiResponse<IngredientResponse>>(`${this.INGREDIENT_API}/${id}`)
      .pipe(map(res => res.data));
  }

  searchIngredients(
    ingredientName: string,
    page = 1,
    size = 10
  ): Observable<PagingResponse<IngredientResponse>> {
    const params = new HttpParams()
      .set('ingredientName', ingredientName)
      .set('page', page)
      .set('size', size);

    return this.http
      .get<ApiResponse<PagingResponse<IngredientResponse>>>(`${this.INGREDIENT_API}/search`, { params })
      .pipe(map(res => res.data));
  }

  getIngredientsByCategory(
    categoryId: string,
    page = 1,
    size = 10
  ): Observable<PagingResponse<IngredientResponse>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http
      .get<ApiResponse<PagingResponse<IngredientResponse>>>(
        `${this.INGREDIENT_API}/category/${categoryId}`,
        { params }
      )
      .pipe(map(res => res.data));
  }

  createIngredient(request: CreateIngredientRequest): Observable<IngredientResponse> {
    return this.http
      .post<ApiResponse<IngredientResponse>>(this.INGREDIENT_API, request)
      .pipe(map(res => res.data));
  }

  updateIngredient(
    id: string,
    request: UpdateIngredientRequest
  ): Observable<IngredientResponse> {
    return this.http
      .patch<ApiResponse<IngredientResponse>>(`${this.INGREDIENT_API}/${id}`, request)
      .pipe(map(res => res.data));
  }

  deleteIngredient(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.INGREDIENT_API}/${id}`)
      .pipe(map(res => res.data));
  }

  // ============================================================
  // Inventory
  // ============================================================

  getInventories(params: PagingParams): Observable<PagingResponse<InventoryResponse>> {
    let httpParams = new HttpParams()
      .set('page', params.page)
      .set('size', params.size);

    if (params.direction) httpParams = httpParams.set('direction', params.direction);
    if (params.field) httpParams = httpParams.set('field', params.field);

    return this.http
      .get<ApiResponse<PagingResponse<InventoryResponse>>>(this.INVENTORY_API, { params: httpParams })
      .pipe(map(res => res.data));
  }

  getInventory(id: string): Observable<InventoryResponse> {
    return this.http
      .get<ApiResponse<InventoryResponse>>(`${this.INVENTORY_API}/${id}`)
      .pipe(map(res => res.data));
  }

  getInventoryByIngredient(ingredientId: string): Observable<InventoryResponse> {
    return this.http
      .get<ApiResponse<InventoryResponse>>(`${this.INVENTORY_API}/ingredient/${ingredientId}`)
      .pipe(map(res => res.data));
  }

  searchInventories(
    filter: InventorySearchRequest,
    page = 1,
    size = 10,
    direction = 'DESC',
    field = 'createdAt'
  ): Observable<PagingResponse<InventoryResponse>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('direction', direction)
      .set('field', field);

    return this.http
      .post<ApiResponse<PagingResponse<InventoryResponse>>>(`${this.INVENTORY_API}/search`, filter, { params })
      .pipe(map(res => res.data));
  }

  createInventory(request: CreateInventoryRequest): Observable<InventoryResponse> {
    return this.http
      .post<ApiResponse<InventoryResponse>>(this.INVENTORY_API, request)
      .pipe(map(res => res.data));
  }

  updateInventory(
    id: string,
    request: UpdateInventoryRequest
  ): Observable<InventoryResponse> {
    return this.http
      .patch<ApiResponse<InventoryResponse>>(`${this.INVENTORY_API}/${id}`, request)
      .pipe(map(res => res.data));
  }

  // ============================================================
  // Inventory Transaction
  // ============================================================

  getTransactions(params: PagingParams): Observable<PagingResponse<InventoryTransactionResponse>> {
    let httpParams = new HttpParams()
      .set('page', params.page)
      .set('size', params.size);

    if (params.direction) httpParams = httpParams.set('direction', params.direction);
    if (params.field) httpParams = httpParams.set('field', params.field);

    return this.http
      .get<ApiResponse<PagingResponse<InventoryTransactionResponse>>>(this.TRANSACTION_API, { params: httpParams })
      .pipe(map(res => res.data));
  }

  getTransaction(id: string): Observable<InventoryTransactionResponse> {
    return this.http
      .get<ApiResponse<InventoryTransactionResponse>>(`${this.TRANSACTION_API}/${id}`)
      .pipe(map(res => res.data));
  }

  searchTransactions(
    filter: InventoryTransactionSearchRequest,
    page = 1,
    size = 10,
    direction = 'DESC',
    field = 'createdAt'
  ): Observable<PagingResponse<InventoryTransactionResponse>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('direction', direction)
      .set('field', field);

    return this.http
      .post<ApiResponse<PagingResponse<InventoryTransactionResponse>>>(
        `${this.TRANSACTION_API}/search`,
        filter,
        { params }
      )
      .pipe(map(res => res.data));
  }

  createTransaction(
    request: CreateInventoryTransactionRequest
  ): Observable<InventoryTransactionResponse> {
    return this.http
      .post<ApiResponse<InventoryTransactionResponse>>(this.TRANSACTION_API, request)
      .pipe(map(res => res.data));
  }
}
