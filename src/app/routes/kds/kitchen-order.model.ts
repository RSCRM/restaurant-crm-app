export type OrderItemStatus = 'PENDING' | 'IN_PROGRESS' | 'READY' | 'SERVED' | 'CANCELLED';

export interface KitchenOrderItem {
  orderItemId: string;
  dishName: string;
  quantity: number;
  tableNumber: string;
  note?: string;
  status: OrderItemStatus;
  priorityFlag: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  errorMessage?: { errorCode: string; message: string };
}
