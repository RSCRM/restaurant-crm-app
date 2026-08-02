export interface TableItem {
  id: string;
  areaId: string;
  areaName: string;
  tableNumber: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
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
}
