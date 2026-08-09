export enum InventoryCategoryStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export enum InventoryStatus {
  GOOD = 'GOOD',
  LOW = 'LOW',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  INACTIVE = 'INACTIVE'
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

/* ===========================
 * REQUESTS
 * =========================== */

export interface CreateInventoryCategoryRequest {
  categoryName: string;
  description?: string;
}

export interface UpdateInventoryCategoryRequest {
  categoryName?: string;
  description?: string;
}

export interface UpdateInventoryCategoryStatusRequest {
  status: InventoryCategoryStatus;
}

export interface CreateInventoryRequest {
  inventoryCategoryId: string;
  inventoryName: string;
  unit: string;
  description?: string;
  minimumQuantity: number;
}

export interface UpdateInventoryRequest {
  inventoryCategoryId?: string;
  inventoryName?: string;
  unit?: string;
  description?: string;
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

export interface CreateBatchInventoryTransactionRequest {
  transactions: CreateInventoryTransactionRequest[];
}

/* ===========================
 * RESPONSES
 * =========================== */

export interface InventoryCategoryResponse {
  id: string;
  branchId: string;
  categoryName: string;
  description: string;
  status: InventoryCategoryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryResponse {
  id: string;
  branchId: string;
  inventoryCategoryId: string;
  inventoryCategoryName: string;
  inventoryCategoryStatus: InventoryCategoryStatus;
  inventoryName: string;
  unit: string;
  description: string;

  quantity: number;
  minimumQuantity: number;

  status: InventoryStatus;

  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransactionResponse {
  id: string;

  inventoryId: string;
  inventoryName: string;

  employeeId: string | null;
  employeeName: string | null;

  transactionType: InventoryTransactionType;
  transactionDirection: InventoryTransactionDirection;

  quantity: number;
  note: string | null;

  transactionTime: string;

  createdAt: string;
  updatedAt: string;
}

/* ===========================
 * SEARCH REQUESTS
 * =========================== */

export interface InventorySearchRequest {
  // Search
  inventoryName?: string;

  // Filter
  inventoryCategoryId?: string;
  status?: InventoryStatus;

  quantityFrom?: number;
  quantityTo?: number;

  minimumQuantityFrom?: number;
  minimumQuantityTo?: number;

  createdAtFrom?: string;
  createdAtTo?: string;
}

export interface InventoryTransactionSearchRequest {
  // Search
  inventoryName?: string;
  employeeName?: string;

  // Filter
  transactionType?: InventoryTransactionType;
  transactionDirection?: InventoryTransactionDirection;

  quantityFrom?: number;
  quantityTo?: number;

  transactionTimeFrom?: string;
  transactionTimeTo?: string;
}

/* ===========================
 * PAGING
 * =========================== */

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
