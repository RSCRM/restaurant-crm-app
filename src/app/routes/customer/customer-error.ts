import { HttpErrorResponse } from '@angular/common/http';

import { CustomerApiError } from './customer.model';

export const OTP_TICKET_INVALID = 'TQR_1014';
export const CUSTOMER_LOCKED = 'OTP_1007';
export const TABLE_SESSION_EXISTS = 'TQR_1011';
export const GROUP_QR_EXPIRED = 'TQR_1012';
export const SESSION_ENDED = 'TQR_1006';
export const SESSION_EXPIRED = 'TQR_1007';

const FALLBACK_MESSAGE = 'Có lỗi xảy ra, vui lòng thử lại.';

export const CUSTOMER_ERROR_MESSAGES: Record<string, string> = {
  TQR_1000: 'Mã QR không hợp lệ. Vui lòng quét lại mã dán trên bàn.',
  TQR_1001: 'Mã QR không hợp lệ. Vui lòng quét lại mã dán trên bàn.',
  TQR_1002: 'Mã QR không hợp lệ. Vui lòng quét lại mã dán trên bàn.',
  TQR_1003: 'Mã QR đã hết hiệu lực. Vui lòng báo nhân viên.',
  TQR_1004: 'Mã QR không khớp với bàn này.',
  TQR_1005: 'Không tìm thấy bàn. Vui lòng báo nhân viên.',
  TQR_1006: 'Phiên gọi món đã kết thúc.',
  TQR_1007: 'Phiên đã hết hạn. Vui lòng quét lại mã QR trên bàn.',
  TQR_1008: 'Bàn đang thanh toán, không thể gọi thêm món.',
  TQR_1009: 'Bàn đã đủ số người tham gia.',
  TQR_1011: 'Bàn này đã có người mở phiên. Xin mã QR nhóm từ người đó để tham gia.',
  TQR_1012: 'Mã QR nhóm đã hết hạn. Xin chủ bàn tạo mã mới.',
  TQR_1013: 'Chỉ chủ bàn mới thực hiện được thao tác này.',
  TQR_1014: 'Xác thực đã hết hạn. Vui lòng nhập lại số điện thoại.',
  CUST_1001: 'Vui lòng nhập số điện thoại.',
  CUST_1002: 'Số điện thoại không hợp lệ.',
  OTP_1000: 'Mã OTP không đúng.',
  OTP_1001: 'Mã OTP đã hết hạn. Vui lòng gửi lại.',
  OTP_1002: 'Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.',
  OTP_1003: 'Số điện thoại tạm bị khoá. Vui lòng thử lại sau.',
  OTP_1004: 'Vui lòng đợi trước khi gửi lại mã.',
  OTP_1005: 'Bàn này đã yêu cầu mã quá nhiều lần. Vui lòng thử lại sau.',
  OTP_1007: 'Tài khoản của bạn đang bị khoá. Vui lòng liên hệ nhân viên.',
  OTP_1008: 'Mã OTP không dành cho bàn này.'
};

function isCustomerApiError(value: unknown): value is CustomerApiError {
  return typeof value === 'object' && value !== null && typeof (value as CustomerApiError).errorCode === 'string';
}

export function extractErrorCode(error: unknown): string | null {
  const body = error instanceof HttpErrorResponse ? error.error : error;
  const errorMessage = (body as { errorMessage?: unknown } | null)?.errorMessage;
  return isCustomerApiError(errorMessage) ? errorMessage.errorCode : null;
}

export function customerErrorMessage(error: unknown): string {
  const code = extractErrorCode(error);
  return (code && CUSTOMER_ERROR_MESSAGES[code]) || FALLBACK_MESSAGE;
}
