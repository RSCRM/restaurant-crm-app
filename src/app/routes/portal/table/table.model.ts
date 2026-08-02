export interface AvailableTable {
  id: string;
  areaId: string;
  areaName: string;
  tableNumber: string;
  capacity: number;
  status: 'AVAILABLE';
}

export interface PagingResponse<T> {
  totalElement: number;
  data: T[];
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
