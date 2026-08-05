import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PageHeaderModule } from '@delon/abc/page-header';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { finalize, switchMap } from 'rxjs';

import { TableBooking, TableStatus } from './table.model';
import { TableService } from './table.service';

@Component({
  selector: 'app-table-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    RouterLink,
    PageHeaderModule,
    NzButtonModule,
    NzCardModule,
    NzEmptyModule,
    NzIconModule,
    NzSpinModule,
    NzTableModule,
    NzTagModule
  ],
  template: `
    <page-header [title]="table ? 'Lịch đặt ' + table.tableNumber : 'Chi tiết bàn'" />
    <nz-card>
      <div class="page-actions">
        <a nz-button routerLink="/portal/table"><span nz-icon nzType="arrow-left"></span> Quay lại</a>
      </div>
      <nz-spin [nzSpinning]="loading">
        @if (table) {
          <div class="table-summary">
            <strong>{{ table.tableNumber }}</strong
            ><span>{{ areaName }}</span
            ><span>{{ table.capacity }} chỗ</span>
          </div>
          <nz-table #bookingTable [nzData]="bookings" [nzFrontPagination]="false" [nzShowPagination]="false">
            <thead
              ><tr><th>Thời gian đặt</th><th>Số điện thoại</th><th>Số khách</th><th>Trạng thái</th><th>Ghi chú</th></tr></thead
            >
            <tbody>
              @for (booking of bookingTable.data; track booking.id) {
                <tr>
                  <td>{{ booking.bookingTime | date: 'dd/MM/yyyy HH:mm' }}</td
                  ><td>{{ booking.customerPhone || '-' }}</td>
                  <td>{{ booking.guestCount }}</td>
                  <td
                    ><nz-tag [nzColor]="booking.status === 'CONFIRMED' ? 'green' : 'gold'">{{
                      booking.status === 'CONFIRMED' ? 'Đã xác nhận' : 'Chờ xác nhận'
                    }}</nz-tag></td
                  >
                  <td>{{ booking.note || '-' }}</td>
                </tr>
              }
            </tbody>
          </nz-table>
          @if (!bookings.length && !loading) {
            <nz-empty nzNotFoundContent="Bàn chưa có lịch đặt sắp tới" />
          }
        }
      </nz-spin>
    </nz-card>
  `,
  styles: `
    .page-actions {
      margin-bottom: 16px;
    }
    .table-summary {
      display: flex;
      gap: 24px;
      align-items: center;
      margin-bottom: 16px;
      padding: 14px 16px;
      background: #fafafa;
    }
    .table-summary strong {
      font-size: 16px;
    }
  `
})
export class TableDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tableService = inject(TableService);
  private readonly message = inject(NzMessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  loading = true;
  table: TableStatus | null = null;
  areaName = '';
  bookings: TableBooking[] = [];

  ngOnInit(): void {
    const tableId = this.route.snapshot.paramMap.get('id') ?? '';
    this.tableService
      .getTableContext(tableId)
      .pipe(
        switchMap(context => {
          this.table = context.table;
          this.areaName = context.areaName;
          return this.tableService.getActiveBookings(context.branchId);
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: bookings => {
          this.bookings = bookings
            .filter(booking => booking.tableId === tableId)
            .sort((a, b) => +new Date(a.bookingTime) - +new Date(b.bookingTime));
        },
        error: () => this.message.error('Không thể tải lịch đặt của bàn')
      });
  }
}
