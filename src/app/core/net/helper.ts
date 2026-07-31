import { HttpErrorResponse, HttpHeaders, HttpResponseBase } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DA_SERVICE_TOKEN } from '@delon/auth';
import { ALAIN_I18N_TOKEN, AlainI18NService } from '@delon/theme';
import { NzNotificationService } from 'ng-zorro-antd/notification';

export interface ReThrowHttpError {
  body: unknown;
  _throw: true;
}

interface ApiErrorPayload {
  errorMessage?: {
    errorCode?: string;
    message?: string;
  };
  message?: string;
}

export const CODEMESSAGE: Record<number, string> = {
  200: 'http.200',
  201: 'http.201',
  202: 'http.202',
  204: 'http.204',
  400: 'http.400',
  401: 'http.401',
  403: 'http.403',
  404: 'http.404',
  406: 'http.406',
  410: 'http.410',
  422: 'http.422',
  500: 'http.500',
  502: 'http.502',
  503: 'http.503',
  504: 'http.504'
};

export function goTo(injector: Injector, url: string): void {
  setTimeout(() => injector.get(Router).navigateByUrl(url));
}

export function toLogin(injector: Injector): void {
  injector.get(NzNotificationService).error(injector.get(ALAIN_I18N_TOKEN).fanyi('http.login-expired'), '');
  goTo(injector, injector.get(DA_SERVICE_TOKEN).login_url!);
}

export function getAdditionalHeaders(headers?: HttpHeaders): Record<string, string> {
  const res: Record<string, string> = {};
  const lang = inject(ALAIN_I18N_TOKEN).currentLang;
  if (!headers?.has('Accept-Language') && lang) {
    res['Accept-Language'] = lang;
  }

  return res;
}

export function getHttpErrorMessage(i18n: AlainI18NService, error: unknown, fallbackKey?: string): string {
  const httpError = error as HttpErrorResponse;
  const payload = httpError?.error as ApiErrorPayload | undefined;
  const errorCode = payload?.errorMessage?.errorCode;

  if (errorCode) {
    const errorKey = `error.${errorCode}`;
    const translated = i18n.fanyi(errorKey);
    if (translated !== errorKey) return translated;
  }

  const fallback = fallbackKey ?? CODEMESSAGE[httpError?.status] ?? 'common.error';
  if (!i18n.currentLang.startsWith('en')) return i18n.fanyi(fallback);

  return payload?.errorMessage?.message ?? payload?.message ?? httpError?.message ?? i18n.fanyi(fallback);
}

export function checkStatus(injector: Injector, ev: HttpResponseBase): void {
  if ((ev.status >= 200 && ev.status < 300) || ev.status === 401) {
    return;
  }

  const i18n = injector.get(ALAIN_I18N_TOKEN);
  const errortext = getHttpErrorMessage(i18n, ev);
  injector.get(NzNotificationService).error(i18n.fanyi('common.error'), errortext);
}
