import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { TableMap } from './table.model';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../auth/models/auth.model';

@Injectable({ providedIn: 'root' })
export class TableService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.api.baseUrl}${environment.api['apiPrefix']}/erp/tables`;

  getMap(areaId?: string): Observable<TableMap> {
    const params = areaId ? new HttpParams().set('areaId', areaId) : undefined;
    return this.http.get<ApiResponse<TableMap>>(`${this.api}/map`, { params }).pipe(map(response => response.data));
  }
}
