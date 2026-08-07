import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '@env/environment';
import { Observable, map } from 'rxjs';

import {
  CreateInventoryCategoryRequest,
  UpdateInventoryCategoryRequest,
  InventoryCategoryResponse,
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
import { ApiResponse } from '../../auth/models/auth.model';

const API = environment.api['apiPrefix'];

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private http = inject(HttpClient);

  private readonly CATEGORY_API = `${API}/erp/inventory-categories`;
  private readonly INVENTORY_API = `${API}/erp/inventories`;
  private readonly TRANSACTION_API = `${API}/erp/inventory-transactions`;

  // ============================================================
  // Inventory Category
  // ============================================================

  getInventoryCategories(params: PagingParams): Observable<PagingResponse<InventoryCategoryResponse>> {
    const httpParams = new HttpParams().set('page', params.page).set('size', params.size);

    return this.http
      .get<ApiResponse<PagingResponse<InventoryCategoryResponse>>>(this.CATEGORY_API, {
        params: httpParams
      })
      .pipe(map(res => res.data));
  }

  getInventoryCategory(id: string): Observable<InventoryCategoryResponse> {
    return this.http.get<ApiResponse<InventoryCategoryResponse>>(`${this.CATEGORY_API}/${id}`).pipe(map(res => res.data));
  }

  searchInventoryCategories(categoryName: string, page = 1, size = 10): Observable<PagingResponse<InventoryCategoryResponse>> {
    const params = new HttpParams().set('categoryName', categoryName).set('page', page).set('size', size);

    return this.http
      .get<ApiResponse<PagingResponse<InventoryCategoryResponse>>>(`${this.CATEGORY_API}/search`, { params })
      .pipe(map(res => res.data));
  }

  createInventoryCategory(request: CreateInventoryCategoryRequest): Observable<InventoryCategoryResponse> {
    return this.http.post<ApiResponse<InventoryCategoryResponse>>(this.CATEGORY_API, request).pipe(map(res => res.data));
  }

  updateInventoryCategory(id: string, request: UpdateInventoryCategoryRequest): Observable<InventoryCategoryResponse> {
    return this.http.patch<ApiResponse<InventoryCategoryResponse>>(`${this.CATEGORY_API}/${id}`, request).pipe(map(res => res.data));
  }

  deleteInventoryCategory(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.CATEGORY_API}/${id}`).pipe(map(res => res.data));
  }

  // ============================================================
  // Inventory
  // ============================================================

  getInventories(params: PagingParams): Observable<PagingResponse<InventoryResponse>> {
    let httpParams = new HttpParams().set('page', params.page).set('size', params.size);

    if (params.direction) {
      httpParams = httpParams.set('direction', params.direction);
    }

    if (params.field) {
      httpParams = httpParams.set('field', params.field);
    }

    return this.http
      .get<ApiResponse<PagingResponse<InventoryResponse>>>(this.INVENTORY_API, {
        params: httpParams
      })
      .pipe(map(res => res.data));
  }

  getInventory(id: string): Observable<InventoryResponse> {
    return this.http.get<ApiResponse<InventoryResponse>>(`${this.INVENTORY_API}/${id}`).pipe(map(res => res.data));
  }

  getInventoriesByCategory(categoryId: string, page = 1, size = 10): Observable<PagingResponse<InventoryResponse>> {
    const params = new HttpParams().set('page', page).set('size', size);

    return this.http
      .get<ApiResponse<PagingResponse<InventoryResponse>>>(`${this.INVENTORY_API}/category/${categoryId}`, { params })
      .pipe(map(res => res.data));
  }

  searchInventories(
    filter: InventorySearchRequest,
    page = 1,
    size = 10,
    direction = 'DESC',
    field = 'createdAt'
  ): Observable<PagingResponse<InventoryResponse>> {
    const params = new HttpParams().set('page', page).set('size', size).set('direction', direction).set('field', field);

    return this.http
      .post<ApiResponse<PagingResponse<InventoryResponse>>>(`${this.INVENTORY_API}/search`, filter, { params })
      .pipe(map(res => res.data));
  }

  createInventory(request: CreateInventoryRequest): Observable<InventoryResponse> {
    return this.http.post<ApiResponse<InventoryResponse>>(this.INVENTORY_API, request).pipe(map(res => res.data));
  }

  updateInventory(id: string, request: UpdateInventoryRequest): Observable<InventoryResponse> {
    return this.http.patch<ApiResponse<InventoryResponse>>(`${this.INVENTORY_API}/${id}`, request).pipe(map(res => res.data));
  }

  deleteInventory(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.INVENTORY_API}/${id}`).pipe(map(res => res.data));
  }

  // ============================================================
  // Inventory Transaction
  // ============================================================

  getTransactions(params: PagingParams): Observable<PagingResponse<InventoryTransactionResponse>> {
    let httpParams = new HttpParams().set('page', params.page).set('size', params.size);

    if (params.direction) {
      httpParams = httpParams.set('direction', params.direction);
    }

    if (params.field) {
      httpParams = httpParams.set('field', params.field);
    }

    return this.http
      .get<ApiResponse<PagingResponse<InventoryTransactionResponse>>>(this.TRANSACTION_API, {
        params: httpParams
      })
      .pipe(map(res => res.data));
  }

  getTransaction(id: string): Observable<InventoryTransactionResponse> {
    return this.http.get<ApiResponse<InventoryTransactionResponse>>(`${this.TRANSACTION_API}/${id}`).pipe(map(res => res.data));
  }

  searchTransactions(
    filter: InventoryTransactionSearchRequest,
    page = 1,
    size = 10,
    direction = 'DESC',
    field = 'createdAt'
  ): Observable<PagingResponse<InventoryTransactionResponse>> {
    const params = new HttpParams().set('page', page).set('size', size).set('direction', direction).set('field', field);

    return this.http
      .post<ApiResponse<PagingResponse<InventoryTransactionResponse>>>(`${this.TRANSACTION_API}/search`, filter, { params })
      .pipe(map(res => res.data));
  }

  createTransaction(request: CreateInventoryTransactionRequest): Observable<InventoryTransactionResponse> {
    return this.http.post<ApiResponse<InventoryTransactionResponse>>(this.TRANSACTION_API, request).pipe(map(res => res.data));
  }
}
