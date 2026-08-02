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
