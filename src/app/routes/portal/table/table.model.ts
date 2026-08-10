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

export interface TableContext {
  branchId: string;
  areaId: string;
  areaName: string;
  table: TableStatus;
}

export function findTableContext(map: TableMap, tableId: string): TableContext | null {
  for (const area of map.areas) {
    const table = area.tables.find(item => item.id === tableId);
    if (table) return { branchId: map.branchId, areaId: area.id, areaName: area.areaName, table };
  }
  return null;
}

export interface SaveTableRequest {
  areaId: string;
  tableNumber: string;
  capacity: number;
  status?: RestaurantTableStatus;
  positionX?: number | null;
  positionY?: number | null;
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

export type TableBookingStatus = 'PENDING' | 'CONFIRMED' | 'SEATED' | 'CANCELLED' | 'EXPIRED';

export interface TableBooking {
  id: string;
  tableId: string | null;
  customerPhone: string;
  bookingTime: string;
  guestCount: number;
  status: TableBookingStatus;
  note: string | null;
}

export function isBookingDue(bookingTime: string, now = Date.now()): boolean {
  return new Date(bookingTime).getTime() <= now;
}

export function isBookingLocked(bookingTime: string, now = Date.now()): boolean {
  return new Date(bookingTime).getTime() <= now + 15 * 60_000;
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
