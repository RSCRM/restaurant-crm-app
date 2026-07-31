import '@angular/compiler';
import { HttpErrorResponse } from '@angular/common/http';
import { AlainI18NService } from '@delon/theme';
import { describe, expect, it } from 'vitest';

import { getHttpErrorMessage } from './helper';

const i18n = {
  currentLang: 'vi-VN',
  fanyi: (key: string) =>
    ({
      'error.USER_1008': 'Số điện thoại đã tồn tại',
      'profile.update-failed': 'Không thể cập nhật thông tin'
    })[key] ?? key
} as AlainI18NService;

describe('getHttpErrorMessage', () => {
  it('uses the localized error code instead of the English API message', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        errorMessage: {
          errorCode: 'USER_1008',
          message: 'Phone number already exists'
        }
      }
    });

    expect(getHttpErrorMessage(i18n, error, 'profile.update-failed')).toBe('Số điện thoại đã tồn tại');
  });

  it('uses the localized fallback for an unknown error code', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        errorMessage: {
          errorCode: 'UNKNOWN',
          message: 'English API message'
        }
      }
    });

    expect(getHttpErrorMessage(i18n, error, 'profile.update-failed')).toBe('Không thể cập nhật thông tin');
  });
});
