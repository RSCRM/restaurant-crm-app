export type SessionRole = 'OWNER' | 'MEMBER';

export interface CustomerApiError {
  errorCode: string;
  message: string;
}

export interface CustomerApiResponse<T> {
  success: boolean;
  errorMessage: CustomerApiError | null;
  data: T;
}

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

export interface QrSessionStartRequest {
  qrToken: string;
  customerPhone: string;
  otpTicket: string;
}

export interface QrSessionJoinRequest {
  groupQrToken: string;
}

export interface QrSessionResponse {
  sessionId: string;
  deviceId: string;
  role: SessionRole;
  sessionToken: string;
  sessionExpiresAt: string;
  groupQrToken: string | null;
  groupQrExpiresAt: string | null;
  memberCount: number;
  orderId: string | null;
  organizationId: string;
  branchId: string;
  tableId: string;
  tableNumber: string;
}

export interface OtpRequestBody {
  qrToken: string;
  customerPhone: string;
}

export interface OtpRequestResponse {
  maskedPhone: string;
  expiresAt: string;
  resendAvailableAt: string;
  attemptsAllowed: number;
}

export interface OtpVerifyBody {
  qrToken: string;
  customerPhone: string;
  otpCode: string;
}

export interface OtpVerifyResponse {
  otpTicket: string;
  ticketExpiresAt: string;
}

export interface CustomerSessionState {
  sessionToken: string;
  sessionExpiresAt: string;
  sessionId: string;
  deviceId: string;
  role: SessionRole;
  branchId: string;
  branchName: string;
  tableId: string;
  tableNumber: string;
}
