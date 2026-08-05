export enum InvoiceStatus {
  PAID = 'PAID',
  REFUNDED = 'REFUNDED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANKING = 'BANKING',
  CREDIT_CARD = 'CREDIT_CARD'
}

export interface InvoiceResponse {
  id: string;
  orderId: string;
  invoiceCode: string;
  orderCode: string;
  branchId: string;
  tableId: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  status: InvoiceStatus;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  paidAt: string;
  note: string;
  items: InvoiceItemResponse[];
}

export interface InvoiceItemResponse {
  id: string;
  productId: string;
  comboId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  note: string;
  modifiers: InvoiceItemModifierResponse[];
}

export interface InvoiceItemModifierResponse {
  modifierOptionId: string;
  modifierName: string;
  additionalPrice: number;
  quantity: number;
}

export interface CheckoutRequest {
  orderId: string;
  paymentMethod: PaymentMethod;
  note?: string;
  voucherCode?: string;
}

export interface CustomerVoucherApplicableResponse {
  customerVoucherId: string;
  voucherSn: string;
  title: string;
  discountPercent: number;
  minBillAmount: number;
  pointsRequired?: number;
  status: string;
  expiredAt: string;
  voucherCode?: string;
  isApplicable: boolean;
  reason: string;
}
