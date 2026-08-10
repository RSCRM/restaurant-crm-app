import { HttpHeaders, HttpResponseBase } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DA_SERVICE_TOKEN } from '@delon/auth';
import { ALAIN_I18N_TOKEN } from '@delon/theme';
import { NzNotificationService } from 'ng-zorro-antd/notification';

export interface ReThrowHttpError {
  body: unknown;
  _throw: true;
}

export const CODEMESSAGE: Record<number, string> = {
  200: 'The server successfully returned the requested data.',
  201: 'The data was created or updated successfully.',
  202: 'The request has been accepted and is being processed asynchronously.',
  204: 'The data was deleted successfully.',
  400: 'The request is invalid. The server could not create or update the data.',
  401: 'Unauthorized. The token, username, or password is incorrect.',
  403: 'Access denied. You do not have permission to access this resource.',
  404: 'The requested resource was not found.',
  406: 'The requested format is not supported.',
  410: 'The requested resource has been permanently deleted and is no longer available.',
  422: 'A validation error occurred while creating the object.',
  500: 'An internal server error occurred. Please check the server.',
  502: 'Bad gateway.',
  503: 'The service is unavailable. The server is temporarily overloaded or under maintenance.',
  504: 'Gateway timeout.'
};

export function goTo(injector: Injector, url: string): void {
  setTimeout(() => injector.get(Router).navigateByUrl(url));
}

export function toLogin(injector: Injector): void {
  injector.get(NzNotificationService).error('Your session has expired. Please log in again.', '');
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

export function checkStatus(injector: Injector, ev: HttpResponseBase): void {
  if ((ev.status >= 200 && ev.status < 300) || ev.status === 401) {
    return;
  }

  const errortext = CODEMESSAGE[ev.status] || ev.status.toString();

  injector.get(NzNotificationService).error(`HTTP ${ev.status} Error`, `${ev.url}<br>${errortext}`);
}
