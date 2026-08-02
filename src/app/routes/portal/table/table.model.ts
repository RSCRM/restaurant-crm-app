export type RestaurantTableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';

export interface TableSearchItem {
  id: string;
  areaId: string;
  areaName: string;
  tableNumber: string;
  capacity: number;
  status: RestaurantTableStatus;
}

export interface PagingResponse<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElement: number;
  data: T[];
}

export interface TableSearchParams {
  keyword?: string;
  status?: RestaurantTableStatus;
  minCapacity?: number;
  page: number;
  size: number;
}
