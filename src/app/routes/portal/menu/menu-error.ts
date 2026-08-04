import { HttpErrorResponse } from '@angular/common/http';

interface MenuApiErrorBody {
  errorMessage: { errorCode: string; message: string } | null;
}

const MENU_ERROR_MESSAGES: Record<string, string> = {
  MENU_1000: 'Không tìm thấy danh mục.',
  MENU_1001: 'Tên danh mục đã tồn tại trong chi nhánh này.',
  MENU_1002: 'Vui lòng nhập tên danh mục.',
  MENU_1010: 'Không tìm thấy món.',
  MENU_1011: 'Tên món đã tồn tại trong chi nhánh này.',
  MENU_1012: 'Vui lòng nhập tên món.',
  MENU_1013: 'Thiếu thông tin chi nhánh.',
  MENU_1014: 'Danh mục không thuộc chi nhánh này.',
  MENU_1020: 'Không tìm thấy nhóm tuỳ chọn.',
  MENU_1021: 'Tên nhóm đã tồn tại cho món này.',
  MENU_1022: 'Vui lòng nhập tên nhóm.',
  MENU_1023: 'Không tìm thấy tuỳ chọn.',
  MENU_1024: 'Vui lòng nhập tên tuỳ chọn.',
  MENU_1030: 'Không tìm thấy combo.',
  MENU_1031: 'Tên combo đã tồn tại trong chi nhánh này.',
  MENU_1032: 'Vui lòng nhập tên combo.',
  MENU_1033: 'Thiếu thông tin chi nhánh.',
  MENU_1040: 'Không tìm thấy món trong combo.',
  MENU_1041: 'Món này đã có trong combo.',
  MENU_1042: 'Món không thuộc chi nhánh của combo.',
  MENU_1043: 'Mỗi nhóm tuỳ chọn của món phải chọn đúng một tuỳ chọn.',
  MENU_1044: 'Vui lòng chọn món.'
};

const AUTHZ_ERROR_MESSAGE = 'Bạn không có quyền thực hiện thao tác này.';
const DEFAULT_ERROR_MESSAGE = 'Có lỗi xảy ra, vui lòng thử lại.';

export function extractErrorCode(err: HttpErrorResponse): string | null {
  const body = err.error as MenuApiErrorBody | null;
  return body?.errorMessage?.errorCode ?? null;
}

export function menuErrorMessage(err: HttpErrorResponse): string {
  const code = extractErrorCode(err);
  if (!code) return DEFAULT_ERROR_MESSAGE;
  if (code.startsWith('AUTHZ')) return AUTHZ_ERROR_MESSAGE;
  return MENU_ERROR_MESSAGES[code] ?? DEFAULT_ERROR_MESSAGE;
}
