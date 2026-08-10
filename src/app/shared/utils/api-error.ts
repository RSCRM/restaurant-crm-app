interface ApiErrorBody {
  errorMessage?: {
    errorCode?: string;
    message?: string;
  };
}

/**
 * Chuyển lỗi HTTP của backend thành câu hiển thị cho người dùng.
 *
 * Backend trả envelope `{ success: false, errorMessage: { errorCode, message } }`.
 * Ba tầng dự phòng: key i18n `error.<CODE>` → message tiếng Anh của backend → mã lỗi thô.
 * `fanyi` trả về chính key khi thiếu bản dịch, nên phải so sánh để biết có dịch được hay không.
 */
export function mapApiError(err: unknown, fanyi: (key: string) => string): string {
  const body = (err as { error?: ApiErrorBody } | null)?.error;
  const code = body?.errorMessage?.errorCode;
  const backendMessage = body?.errorMessage?.message;

  if (code) {
    const key = `error.${code}`;
    const translated = fanyi(key);
    if (translated !== key) return translated;
    if (backendMessage) return backendMessage;
    return code;
  }

  if (backendMessage) return backendMessage;
  return fanyi('error.unknown');
}
