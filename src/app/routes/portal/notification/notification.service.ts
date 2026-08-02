import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, NgZone } from '@angular/core';
import { map, Observable, Observer } from 'rxjs';

import { NotificationResponse, PagingParams, PagingResponse } from './notification.model';
import { ApiResponse } from '../../auth/models/auth.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private ngZone = inject(NgZone);

  private readonly API = '/api/v1/notifications';

  getNotifications(branchId: string, params: PagingParams): Observable<PagingResponse<NotificationResponse>> {
    const httpParams = new HttpParams().set('branchId', branchId).set('page', params.page.toString()).set('size', params.size.toString());

    return this.http.get<ApiResponse<PagingResponse<NotificationResponse>>>(this.API, { params: httpParams }).pipe(map(res => res.data));
  }

  subscribeBranchNotifications(branchId: string): Observable<NotificationResponse> {
    return new Observable((observer: Observer<NotificationResponse>) => {
      const sseUrl = `${this.API}/subscribe?branchId=${branchId}`;
      const eventSource = new EventSource(sseUrl);

      const handleEvent = (event: MessageEvent) => {
        this.ngZone.run(() => {
          try {
            const data: NotificationResponse = JSON.parse(event.data);
            observer.next(data);
          } catch (err) {
            console.error('Error parsing SSE Notification event:', err);
          }
        });
      };

      eventSource.addEventListener('READY_TO_SERVE', handleEvent as EventListener);
      eventSource.addEventListener('message', handleEvent as EventListener);

      eventSource.onerror = error => {
        this.ngZone.run(() => {
          console.warn('SSE Notification Connection Warning:', error);
        });
      };

      return () => {
        eventSource.removeEventListener('READY_TO_SERVE', handleEvent as EventListener);
        eventSource.removeEventListener('message', handleEvent as EventListener);
        eventSource.close();
      };
    });
  }
}
