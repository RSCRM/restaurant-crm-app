import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponseBase } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { ALLOW_ANONYMOUS, DA_SERVICE_TOKEN } from '@delon/auth';
import { IGNORE_BASE_URL } from '@delon/theme';
import { environment } from '@env/environment';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { Observable, of, throwError, mergeMap, catchError } from 'rxjs';

import { ReThrowHttpError, checkStatus, getAdditionalHeaders, goTo, toLogin } from './helper';
import { tryRefreshToken } from './refresh-token';
import { CustomerSessionStore, USE_CUSTOMER_SESSION_TOKEN } from '../../routes/customer/customer-session.store';

function handleData(
  injector: Injector,
  ev: HttpResponseBase,
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  checkStatus(injector, ev);
  switch (ev.status) {
    case 200:
      break;
    case 401:
      if (isCustomerRequest(req)) {
        handleCustomerUnauthorized(injector, req);
        break;
      }
      if (environment.api.refreshTokenEnabled && environment.api.refreshTokenType === 're-request') {
        return tryRefreshToken(injector, ev, req, next);
      }
      toLogin(injector);
      break;
    case 403:
    case 404:
    case 500:
      break;
    default:
      if (ev instanceof HttpErrorResponse) {
        console.warn('HTTP Error', ev);
      }
      break;
  }
  if (ev instanceof HttpErrorResponse) {
    return throwError(() => ev);
  } else if ((ev as unknown as ReThrowHttpError)._throw === true) {
    return throwError(() => (ev as unknown as ReThrowHttpError).body);
  } else {
    return of(ev) as unknown as Observable<HttpEvent<unknown>>;
  }
}

function isCustomerRequest(req: HttpRequest<unknown>): boolean {
  return (
    req.context.get(USE_CUSTOMER_SESSION_TOKEN) === true ||
    req.url.includes('/api/v1/customer/') ||
    req.url.includes('/api/v1/public/customer/')
  );
}

function handleCustomerUnauthorized(injector: Injector, req: HttpRequest<unknown>): void {
  const isAuthenticated = req.context.get(USE_CUSTOMER_SESSION_TOKEN) === true || req.url.includes('/api/v1/customer/');
  if (!isAuthenticated) {
    return;
  }
  injector.get(CustomerSessionStore).clear();
  injector.get(NzNotificationService).error('Phiên đã hết hạn', 'Vui lòng quét lại mã QR trên bàn.');
  goTo(injector, '/customer/scan');
}

export const defaultInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip token for anonymous requests (login, register, etc.)
  const isAnonymous = req.context.get(ALLOW_ANONYMOUS);

  // Build URL with base prefix
  let url = req.url;
  if (!req.context.get(IGNORE_BASE_URL) && !url.startsWith('https://') && !url.startsWith('http://')) {
    const { baseUrl } = environment.api;
    if (baseUrl) {
      url = baseUrl + (baseUrl.endsWith('/') && url.startsWith('/') ? url.substring(1) : url);
    }
  }

  // Add auth token if not anonymous (skip if request already has Authorization header)
  const headers: Record<string, string> = getAdditionalHeaders(req.headers);
  if (req.context.get(USE_CUSTOMER_SESSION_TOKEN)) {
    const customerToken = inject(CustomerSessionStore).token();
    if (customerToken) {
      headers['Authorization'] = `Bearer ${customerToken}`;
    }
  } else if (!isAnonymous && !req.headers.has('Authorization')) {
    const tokenService = inject(DA_SERVICE_TOKEN);
    const token = tokenService.get()?.token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const newReq = req.clone({ url, setHeaders: headers });
  const injector = inject(Injector);

  return next(newReq).pipe(
    mergeMap(ev => {
      if (ev instanceof HttpResponseBase) {
        return handleData(injector, ev, newReq, next);
      }
      return of(ev);
    }),
    catchError((err: HttpErrorResponse) => handleData(injector, err, newReq, next))
  );
};
