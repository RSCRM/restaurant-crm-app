export type RestaurantTableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';

export interface TableStatus {
  id: string;
  tableNumber: string;
  capacity: number;
  status: RestaurantTableStatus;
  positionX: number | null;
  positionY: number | null;
}

export interface TableAreaMap {
  id: string;
  areaName: string;
  description: string | null;
  displayOrder: number | null;
  tables: TableStatus[];
}

export interface TableMap {
  branchId: string;
  areas: TableAreaMap[];
}

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

export interface RegisterGuestRequest {
  tableId: string;
  guestName: string;
  guestPhone?: string;
  partySize: number;
  note?: string;
}

export interface TableSession {
  id: string;
  tableId: string;
  tableNumber: string;
  guestName: string;
  guestPhone: string | null;
  partySize: number;
  status: 'ACTIVE' | 'CLOSED';
  startedAt: string;
  endedAt: string | null;
  note: string | null;
}
