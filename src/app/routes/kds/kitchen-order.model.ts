export type OrderItemStatus = 'PENDING' | 'IN_PROGRESS' | 'READY_TO_SERVE' | 'SERVED' | 'CANCELLED';

export interface KitchenOrderItem {
  orderItemId: string;
  /** Null when the product/combo behind the item cannot be resolved. */
  itemName: string | null;
  quantity: number;
  /** Null for orders with no table (take-away). */
  tableNumber: string | null;
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
