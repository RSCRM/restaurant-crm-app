/** Backend nhận ngày dạng `YYYY-MM-DD`, không nhận chuỗi ISO đầy đủ. */
export function toDateString(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Định dạng số điện thoại backend chấp nhận (B1 và B2). Số là duy nhất toàn hệ thống. */
export const PHONE_PATTERN = /^\+?[0-9]{9,15}$/;
