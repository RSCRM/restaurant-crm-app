import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule, NzTableQueryParams } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { finalize, Subscription } from 'rxjs';

import {
  RegisterGuestRequest,
  RestaurantTableStatus,
  TableAreaMap,
  TableSearchItem,
  TableStatus
} from './table.model';
import { TableService } from './table.service';

@Component({
  selector: 'app-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzCardModule,
    NzEmptyModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzModalModule,
    NzSelectModule,
    NzSpinModule,
    NzTableModule,
    NzTagModule,
    I18nPipe
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.less'
})
export class TableComponent implements OnInit {
  private readonly tableService = inject(TableService);
  private readonly message = inject(NzMessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  mapLoading = false;
  searchLoading = false;
  saving = false;
  modalVisible = false;

  selectedAreaId: string | null = null;
  areas: TableAreaMap[] = [];

  keyword = '';
  status: RestaurantTableStatus | null = null;
  minCapacity: number | null = null;
  page = 1;
  size = 10;
  total = 0;
  tables: TableSearchItem[] = [];

  selectedTable: TableStatus | TableSearchItem | null = null;
  form: RegisterGuestRequest = { tableId: '', guestName: '', partySize: 1 };
  private searchSubscription?: Subscription;

  ngOnInit(): void {
    this.reload();
  }

  get visibleAreas(): TableAreaMap[] {
    return this.selectedAreaId ? this.areas.filter(area => area.id === this.selectedAreaId) : this.areas;
  }

  reload(): void {
    this.loadMap();
    this.search();
  }

  loadMap(): void {
    this.mapLoading = true;
    this.tableService
      .getMap()
      .pipe(
        finalize(() => {
          this.mapLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: map => (this.areas = map.areas),
        error: () => this.message.error('Không thể tải sơ đồ bàn')
      });
  }

  search(resetPage = false): void {
    if (resetPage) this.page = 1;
    this.searchSubscription?.unsubscribe();
    this.searchLoading = true;
    this.searchSubscription = this.tableService
      .search({
        keyword: this.keyword.trim() || undefined,
        status: this.status ?? undefined,
        minCapacity: this.minCapacity ?? undefined,
        page: this.page,
        size: this.size
      })
      .pipe(
        finalize(() => {
          this.searchLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: result => {
          this.tables = result.data;
          this.total = result.totalElement;
        },
        error: () => this.message.error('Không thể tìm kiếm bàn')
      });
  }

  reset(): void {
    this.keyword = '';
    this.status = null;
    this.minCapacity = null;
    this.search(true);
  }

  onQuery(params: NzTableQueryParams): void {
    if (params.pageIndex !== this.page || params.pageSize !== this.size) {
      this.page = params.pageIndex;
      this.size = params.pageSize;
      this.search();
    }
  }

  openRegistration(table: TableStatus | TableSearchItem): void {
    if (table.status !== 'AVAILABLE') return;
    this.selectedTable = table;
    this.form = { tableId: table.id, guestName: '', partySize: 1 };
    this.modalVisible = true;
  }

  submit(): void {
    const guestName = this.form.guestName.trim();
    const phone = this.form.guestPhone?.trim();
    if (!guestName || this.form.partySize < 1 || this.form.partySize > (this.selectedTable?.capacity ?? 0)) {
      this.message.warning('Vui lòng nhập đủ thông tin và đúng số lượng khách');
      return;
    }
    if (phone && !/^\d{9,15}$/.test(phone)) {
      this.message.warning('Số điện thoại phải có từ 9 đến 15 chữ số');
      return;
    }

    this.saving = true;
    this.tableService
      .registerGuest({ ...this.form, guestName, guestPhone: phone || undefined })
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.modalVisible = false;
          this.message.success('Đăng ký khách vào bàn thành công');
          this.reload();
        },
        error: error => this.message.error(error?.error?.errorMessage?.message ?? 'Không thể đăng ký khách vào bàn')
      });
  }

  statusColor(status: RestaurantTableStatus): string {
    return status === 'AVAILABLE' ? 'green' : status === 'OCCUPIED' ? 'red' : 'gold';
  }
}
