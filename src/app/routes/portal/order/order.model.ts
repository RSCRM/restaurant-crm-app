// === Enums ===

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

export enum OrderType {
  DINE_IN = 'DINE_IN',
  TAKEAWAY = 'TAKEAWAY',
  DELIVERY = 'DELIVERY'
}

// === Request DTOs ===

export interface CreateOrderRequest {
  branchId: string;
  tableId?: string;
  reservationId?: string;
  orderType: OrderType;
  customerName?: string;
  customerPhone?: string;
  note?: string;
  items: CreateOrderItemRequest[];
}

export interface CreateOrderItemRequest {
  productId?: string;
  comboId?: string;
  quantity: number;
  note?: string;
  modifiers?: CreateOrderItemModifierRequest[];
}

export interface CreateOrderItemModifierRequest {
  modifierOptionId: string;
  quantity: number;
  additionalPrice: number;
}

export interface AddOrderItemRequest {
  productId?: string;
  comboId?: string;
  quantity: number;
  note?: string;
  modifiers?: AddOrderItemModifierRequest[];
}

export interface AddOrderItemModifierRequest {
  modifierOptionId: string;
  quantity: number;
}

export interface UpdateOrderItemQuantityRequest {
  quantity: number;
}

export interface UpdateOrderItemModifiersRequest {
  modifiers: AddOrderItemModifierRequest[];
}

// === Response DTOs ===

export interface CreateOrderResponse {
  orderId: string;
}

export interface AddOrderItemResponse {
  orderItemId: string;
}

export interface CancelOrderResponse {
  cancelled: boolean;
  blockedItems: CancelOrderBlockedItemResponse[];
}

export interface CancelOrderBlockedItemResponse {
  orderItemId: string;
  productId: string | null;
  comboId: string | null;
  quantity: number;
  status: OrderItemStatus;
  note: string | null;
}

export interface OrderCookingStatusResponse {
  orderId: string;
  orderCode: string;
  tableId: string | null;
  customerPhone: string | null;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  items: OrderItemCookingStatusResponse[];
  updatedAt: string;
}

export interface OrderItemCookingStatusResponse {
  orderItemId: string;
  itemName: string;
  quantity: number;
  note: string | null;
  status: OrderItemStatus;
  updatedAt: string;
}
