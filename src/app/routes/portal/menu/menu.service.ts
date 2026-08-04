import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  CategoryResponse,
  ComboItemRequest,
  ComboItemResponse,
  ComboResponse,
  ComboSearchRequest,
  CreateCategoryRequest,
  CreateComboRequest,
  CreateModifierGroupRequest,
  CreateModifierOptionRequest,
  CreateProductRequest,
  ModifierGroupResponse,
  ModifierOptionResponse,
  PagingResponse,
  ProductResponse,
  ProductSearchRequest,
  UpdateCategoryRequest,
  UpdateComboRequest,
  UpdateModifierGroupRequest,
  UpdateModifierOptionRequest,
  UpdateProductRequest
} from './menu.model';
import { ApiResponse } from '../../auth/models/auth.model';

function appendProductFormFields(form: FormData, request: CreateProductRequest | UpdateProductRequest): void {
  form.append('productName', request.productName);
  form.append('price', String(request.price));
  if (request.categoryId) form.append('categoryId', request.categoryId);
  if (request.description) form.append('description', request.description);
  if (request.status) form.append('status', request.status);
  if (request.requiresPreparation !== undefined) form.append('requiresPreparation', String(request.requiresPreparation));
}

@Injectable({ providedIn: 'root' })
export class MenuService {
  private http = inject(HttpClient);

  private readonly API = environment.api['apiPrefix'];
  private readonly CATEGORY_API = `${this.API}/erp/categories`;
  private readonly PRODUCT_API = `${this.API}/erp/products`;
  private readonly MODIFIER_GROUP_API = `${this.API}/erp/modifier-groups`;
  private readonly MODIFIER_OPTION_API = `${this.API}/erp/modifier-options`;
  private readonly COMBO_API = `${this.API}/erp/combos`;
  private readonly COMBO_ITEM_API = `${this.API}/erp/combo-items`;

  listCategories(branchId: string): Observable<CategoryResponse[]> {
    return this.http.get<ApiResponse<CategoryResponse[]>>(this.CATEGORY_API, { params: { branchId } }).pipe(map(res => res.data));
  }

  createCategory(request: CreateCategoryRequest): Observable<CategoryResponse> {
    return this.http.post<ApiResponse<CategoryResponse>>(this.CATEGORY_API, request).pipe(map(res => res.data));
  }

  updateCategory(categoryId: string, request: UpdateCategoryRequest): Observable<CategoryResponse> {
    return this.http.put<ApiResponse<CategoryResponse>>(`${this.CATEGORY_API}/${categoryId}`, request).pipe(map(res => res.data));
  }

  deleteCategory(categoryId: string): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.CATEGORY_API}/${categoryId}`).pipe(map(() => undefined));
  }

  listProducts(branchId: string): Observable<ProductResponse[]> {
    return this.http.get<ApiResponse<ProductResponse[]>>(this.PRODUCT_API, { params: { branchId } }).pipe(map(res => res.data));
  }

  getProduct(productId: string): Observable<ProductResponse> {
    return this.http.get<ApiResponse<ProductResponse>>(`${this.PRODUCT_API}/${productId}`).pipe(map(res => res.data));
  }

  searchProducts(
    request: ProductSearchRequest,
    page = 1,
    size = 10,
    direction = 'DESC',
    field = 'createdAt'
  ): Observable<PagingResponse<ProductResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('direction', direction)
      .set('field', field);
    return this.http
      .post<ApiResponse<PagingResponse<ProductResponse>>>(`${this.PRODUCT_API}/search`, request, { params })
      .pipe(map(res => res.data));
  }

  createProduct(request: CreateProductRequest, imageFile?: File | null): Observable<ProductResponse> {
    const form = new FormData();
    form.append('branchId', request.branchId);
    appendProductFormFields(form, request);
    if (imageFile) form.append('image', imageFile);
    return this.http.post<ApiResponse<ProductResponse>>(this.PRODUCT_API, form).pipe(map(res => res.data));
  }

  updateProduct(productId: string, request: UpdateProductRequest, imageFile?: File | null): Observable<ProductResponse> {
    const form = new FormData();
    appendProductFormFields(form, request);
    if (imageFile) form.append('image', imageFile);
    return this.http.put<ApiResponse<ProductResponse>>(`${this.PRODUCT_API}/${productId}`, form).pipe(map(res => res.data));
  }

  deleteProduct(productId: string): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.PRODUCT_API}/${productId}`).pipe(map(() => undefined));
  }

  listModifierGroups(productId: string): Observable<ModifierGroupResponse[]> {
    return this.http
      .get<ApiResponse<ModifierGroupResponse[]>>(`${this.PRODUCT_API}/${productId}/modifier-groups`)
      .pipe(map(res => res.data));
  }

  createModifierGroup(productId: string, request: CreateModifierGroupRequest): Observable<ModifierGroupResponse> {
    return this.http
      .post<ApiResponse<ModifierGroupResponse>>(`${this.PRODUCT_API}/${productId}/modifier-groups`, request)
      .pipe(map(res => res.data));
  }

  updateModifierGroup(groupId: string, request: UpdateModifierGroupRequest): Observable<ModifierGroupResponse> {
    return this.http.put<ApiResponse<ModifierGroupResponse>>(`${this.MODIFIER_GROUP_API}/${groupId}`, request).pipe(map(res => res.data));
  }

  deleteModifierGroup(groupId: string): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.MODIFIER_GROUP_API}/${groupId}`).pipe(map(() => undefined));
  }

  createModifierOption(groupId: string, request: CreateModifierOptionRequest): Observable<ModifierOptionResponse> {
    return this.http
      .post<ApiResponse<ModifierOptionResponse>>(`${this.MODIFIER_GROUP_API}/${groupId}/options`, request)
      .pipe(map(res => res.data));
  }

  updateModifierOption(optionId: string, request: UpdateModifierOptionRequest): Observable<ModifierOptionResponse> {
    return this.http
      .put<ApiResponse<ModifierOptionResponse>>(`${this.MODIFIER_OPTION_API}/${optionId}`, request)
      .pipe(map(res => res.data));
  }

  deleteModifierOption(optionId: string): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.MODIFIER_OPTION_API}/${optionId}`).pipe(map(() => undefined));
  }

  listCombos(branchId: string): Observable<ComboResponse[]> {
    return this.http.get<ApiResponse<ComboResponse[]>>(this.COMBO_API, { params: { branchId } }).pipe(map(res => res.data));
  }

  searchCombos(
    request: ComboSearchRequest,
    page = 1,
    size = 10,
    direction = 'DESC',
    field = 'createdAt'
  ): Observable<PagingResponse<ComboResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('direction', direction)
      .set('field', field);
    return this.http
      .post<ApiResponse<PagingResponse<ComboResponse>>>(`${this.COMBO_API}/search`, request, { params })
      .pipe(map(res => res.data));
  }

  createCombo(request: CreateComboRequest): Observable<ComboResponse> {
    return this.http.post<ApiResponse<ComboResponse>>(this.COMBO_API, request).pipe(map(res => res.data));
  }

  updateCombo(comboId: string, request: UpdateComboRequest): Observable<ComboResponse> {
    return this.http.put<ApiResponse<ComboResponse>>(`${this.COMBO_API}/${comboId}`, request).pipe(map(res => res.data));
  }

  deleteCombo(comboId: string): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.COMBO_API}/${comboId}`).pipe(map(() => undefined));
  }

  addComboItem(comboId: string, request: ComboItemRequest): Observable<ComboItemResponse> {
    return this.http.post<ApiResponse<ComboItemResponse>>(`${this.COMBO_API}/${comboId}/items`, request).pipe(map(res => res.data));
  }

  updateComboItem(itemId: string, request: ComboItemRequest): Observable<ComboItemResponse> {
    return this.http.put<ApiResponse<ComboItemResponse>>(`${this.COMBO_ITEM_API}/${itemId}`, request).pipe(map(res => res.data));
  }

  deleteComboItem(itemId: string): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.COMBO_ITEM_API}/${itemId}`).pipe(map(() => undefined));
  }
}
