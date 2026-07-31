export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED'
}

export enum OrderItemStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  READY_TO_SERVE = 'READY_TO_SERVE',
  SERVED = 'SERVED',
  CANCELLED = 'CANCELLED'
}

export interface OrderItemCookingStatusResponse {
  orderItemId: string;
  itemName: string;
  quantity: number;
  note: string;
  status: OrderItemStatus;
  updatedAt: string;
}

export interface OrderCookingStatusResponse {
  orderId: string;
  orderCode: string;
  tableId: string;
  customerPhone: string;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  items: OrderItemCookingStatusResponse[];
  updatedAt: string;
}

export interface Product {
  id: string;
  productName: string;
  price: number;
  description?: string;
  imageUrl?: string;
  status: 'AVAILABLE' | 'UNAVAILABLE';
}
