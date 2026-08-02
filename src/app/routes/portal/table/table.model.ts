export interface OccupiedTable {
  id: string;
  areaId: string;
  areaName: string;
  tableNumber: string;
  capacity: number;
  status: 'OCCUPIED';
}

export interface PagingResponse<T> {
  data: T[];
}

export interface TableSession {
  id: string;
  tableId: string;
  tableNumber: string;
  guestName: string;
  partySize: number;
  status: 'ACTIVE' | 'CLOSED';
  endedAt: string | null;
}
