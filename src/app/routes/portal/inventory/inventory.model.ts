export enum InventoryStatus {
  GOOD = 'GOOD',
  LOW = 'LOW',
  OUT_OF_STOCK = 'OUT_OF_STOCK'
}

export enum InventoryTransactionDirection {
  IN = 'IN',
  OUT = 'OUT'
}

export enum InventoryTransactionType {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  ADJUSTMENT = 'ADJUSTMENT',
  WASTE = 'WASTE',
  RETURN = 'RETURN'
}

export interface CreateIngredientCategoryRequest {
  categoryName: string;
  description?: string;
}

export interface CreateIngredientRequest {
  ingredientCategoryId: string;
  ingredientName: string;
  unit: string;
  description?: string;
}

export interface UpdateIngredientRequest {
  ingredientCategoryId?: string;
  ingredientName?: string;
  unit?: string;
  description?: string;
}

export interface UpdateIngredientCategoryRequest {
  categoryName?: string;
  description?: string;
}

export interface CreateInventoryRequest {
  ingredientId: string;
  quantity: number;
  minimumQuantity: number;
}

export interface UpdateInventoryRequest {
  minimumQuantity?: number;
}

export interface CreateInventoryTransactionRequest {
  inventoryId: string;
  employeeId?: string;
  transactionType: InventoryTransactionType;
  transactionDirection: InventoryTransactionDirection;
  quantity: number;
  note?: string;
}


export interface IngredientCategoryResponse {
  id: string;
  branchId: string;
  categoryName: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface IngredientResponse {
  id: string;
  branchId: string;
  ingredientCategoryId: string;
  ingredientName: string;
  unit: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryResponse {
  id: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  minimumQuantity: number;
  status: InventoryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransactionResponse {
  id: string;
  inventoryId: string;
  ingredientName: string;
  employeeId: string | null;
  transactionType: InventoryTransactionType;
  transactionDirection: InventoryTransactionDirection;
  quantity: number;
  note: string | null;
  transactionTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventorySearchRequest {
  ingredientName?: string;

  status?: InventoryStatus;

  quantityFrom?: number;
  quantityTo?: number;

  minimumQuantityFrom?: number;
  minimumQuantityTo?: number;

  createdAtFrom?: string;
  createdAtTo?: string;
}

export interface InventoryTransactionSearchRequest {
  ingredientName?: string;

  transactionType?: InventoryTransactionType;
  transactionDirection?: InventoryTransactionDirection;

  quantityFrom?: number;
  quantityTo?: number;

  transactionTimeFrom?: string;
  transactionTimeTo?: string;

  employeeId?: string;
}

export interface PagingResponse<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElement: number;
  data: T[];
}

export interface PagingParams {
  page: number;
  size: number;
  direction?: 'ASC' | 'DESC';
  field?: string;
}
