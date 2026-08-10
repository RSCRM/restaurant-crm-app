// === Enums ===

export enum SessionMemberRole {
  OWNER = 'OWNER',
  MEMBER = 'MEMBER'
}

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

export enum CustomerOrderStage {
  RECEIVED = 'RECEIVED',
  COOKING = 'COOKING',
  READY_TO_SERVE = 'READY_TO_SERVE',
  SERVED = 'SERVED',
  CANCELLED = 'CANCELLED'
}

// === QR Resolve ===

export interface QrResolveRequest {
  qrToken: string;
}

export interface QrResolveResponse {
  organizationId: string;
  branchId: string;
  branchName: string;
  areaName: string;
  tableNumber: string;
  capacity: number;
  tableStatus: string;
  joinable: boolean;
  hasActiveSession: boolean;
}

// === OTP ===

export interface OtpRequestRequest {
  qrToken: string;
  customerPhone: string;
}

export interface OtpRequestResponse {
  maskedPhone: string;
  expiresAt: string;
  resendAvailableAt: string;
  attemptsAllowed: number;
}

export interface OtpVerifyRequest {
  qrToken: string;
  customerPhone: string;
  otpCode: string;
}

export interface OtpVerifyResponse {
  otpTicket: string;
  ticketExpiresAt: string;
}

// === QR Session ===

export interface QrSessionStartRequest {
  qrToken: string;
  customerPhone: string;
  otpTicket: string;
}

export interface QrSessionResponse {
  sessionId: string;
  deviceId: string;
  role: SessionMemberRole;
  sessionToken: string;
  sessionExpiresAt: string;
  groupQrToken: string;
  groupQrExpiresAt: string;
  memberCount: number;
  orderId: string;
  organizationId: string;
  branchId: string;
  tableId: string;
  tableNumber: string;
}

// === Customer Menu ===

export interface CustomerMenuResponse {
  branchId: string;
  categories: MenuCategoryResponse[];
  combos: MenuComboResponse[];
  modifierGroups: MenuModifierGroupResponse[];
}

export interface MenuCategoryResponse {
  categoryId: string;
  categoryName: string;
  products: MenuProductResponse[];
}

export interface MenuProductResponse {
  productId: string;
  productName: string;
  description: string;
  price: number;
  imageUrl: string;
  available: boolean;
  requiresPreparation: boolean;
}

export interface MenuComboResponse {
  comboId: string;
  comboName: string;
  description: string;
  price: number;
  imageUrl: string;
  available: boolean;
  items: MenuProductResponse[];
}

export interface MenuModifierGroupResponse {
  modifierGroupId: string;
  groupName: string;
  description: string;
  minSelection: number;
  maxSelection: number;
  options: MenuModifierOptionResponse[];
}

export interface MenuModifierOptionResponse {
  modifierOptionId: string;
  optionName: string;
  additionalPrice: number;
  available: boolean;
}

// === Group Cart ===

export interface GroupCartAddItemRequest {
  productId?: string;
  comboId?: string;
  quantity: number;
  note?: string;
  modifierOptionIds?: string[];
}

export interface GroupCartUpdateItemRequest {
  quantity: number;
  note?: string;
  modifierOptionIds?: string[];
}

export interface GroupCartResponse {
  sessionId: string;
  tableId: string;
  role: SessionMemberRole;
  items: GroupCartItemResponse[];
  subtotal: number;
  itemCount: number;
  submitAllowed: boolean;
}

export interface GroupCartItemResponse {
  cartItemId: string;
  productId: string;
  comboId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  note: string;
  modifiers: GroupCartItemModifierResponse[];
  addedByDeviceId: string;
  lockedByDeviceId: string;
}

export interface GroupCartItemModifierResponse {
  modifierOptionId: string;
  optionName: string;
  additionalPrice: number;
}

export interface GroupCartSubmitResponse {
  orderId: string;
  itemCount: number;
  subtotal: number;
}

// === Customer Order Tracking ===

export interface CustomerOrderTrackingResponse {
  hasActiveOrder: boolean;
  orderId: string;
  orderCode: string;
  tableId: string;
  orderStatus: OrderStatus;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  summary: CustomerOrderTrackingSummaryResponse;
  items: CustomerOrderTrackingItemResponse[];
  updatedAt: string;
}

export interface CustomerOrderTrackingSummaryResponse {
  total: number;
  received: number;
  cooking: number;
  readyToServe: number;
  served: number;
  cancelled: number;
}

export interface CustomerOrderTrackingItemResponse {
  orderItemId: string;
  itemName: string;
  quantity: number;
  note: string;
  status: OrderItemStatus;
  customerStage: CustomerOrderStage;
  stageOrder: number;
  updatedAt: string;
}

// === Customer Vouchers & Loyalty Points ===

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

export interface CustomerPointWalletResponse {
  customerId: string;
  organizationId: string;
  currentPoints: number;
  lifetimePoints: number;
}

// === Legacy compat (kept for QR scanner) ===

export interface CustomerResponse {
  id: string;
  phone: string;
  fullName: string;
  points: number;
}
