export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SEATED = 'SEATED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export interface CreateBookingRequest {
  branchId: string;
  tableId?: string | null;
  customerPhone: string;
  bookingTime: string; // ISO String format
  guestCount: number;
  note?: string | null;
}

export interface UpdateBookingStatusRequest {
  status: BookingStatus;
}

export interface BookingResponse {
  id: string;
  branchId: string;
  tableId: string | null;
  customerId: string;
  customerPhone: string;
  bookingTime: string; // ISO String format
  guestCount: number;
  status: BookingStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PagingParams {
  page: number; // 1-based
  size: number;
  direction?: 'ASC' | 'DESC';
  field?: string;
}

export interface PagingResponse<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElement: number; // Keep this consistent with backend DTO name
  data: T[];
}

export enum RestaurantTableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED'
}

export interface TableSearchResponse {
  id: string;
  areaId: string;
  areaName: string;
  tableNumber: string;
  capacity: number;
  status: RestaurantTableStatus;
}
