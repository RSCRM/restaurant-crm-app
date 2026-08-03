export type OrderItemStatus = 'PENDING' | 'IN_PROGRESS' | 'READY_TO_SERVE' | 'SERVED' | 'CANCELLED';

/** One order-item card. Mirrors backend KdsItemResponse (feat/kitchen-display uc-scf-02). */
export interface KdsItem {
  orderItemId: string;
  orderCode: string | null;
  tableNumber: string | null;
  areaName: string | null;
  productName: string | null;
  comboName: string | null;
  quantity: number;
  note: string | null;
  modifiers: string | null;
  status: OrderItemStatus;
  createdAt: string;
}

/** Grouped waiting summary ("N phần cần làm"). Mirrors backend WaitingSummaryDto. */
export interface WaitingSummary {
  productName: string | null;
  comboName: string | null;
  note: string | null;
  modifiers: string | null;
  totalQuantity: number;
}

/** Mirrors backend KdsActiveResponse from GET /api/v1/kds/items?section=ACTIVE. */
export interface KdsActiveResponse {
  waitingSummary: WaitingSummary[];
  waitingItems: KdsItem[];
  preparingItems: KdsItem[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  errorMessage?: { errorCode: string; message: string };
}

/** Mirrors backend OrderItemResponse, returned by the order-item status-change endpoints. */
export interface OrderItemResponse {
  orderItemId: string;
  orderId: string;
  productId: string | null;
  comboId: string | null;
  quantity: number;
  status: OrderItemStatus;
}
