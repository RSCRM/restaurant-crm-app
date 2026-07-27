import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse, HttpResponseBase } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { ALLOW_ANONYMOUS, DA_SERVICE_TOKEN } from '@delon/auth';
import { IGNORE_BASE_URL } from '@delon/theme';
import { environment } from '@env/environment';
import { Observable, of, throwError, mergeMap, catchError } from 'rxjs';

import { ReThrowHttpError, checkStatus, getAdditionalHeaders, toLogin } from './helper';
import { tryRefreshToken } from './refresh-token';

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

  // Add auth token if not anonymous
  const headers: Record<string, string> = getAdditionalHeaders(req.headers);
  if (!isAnonymous) {
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
