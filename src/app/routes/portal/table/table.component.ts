import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule, NzTableQueryParams } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { finalize, firstValueFrom, Subscription } from 'rxjs';

import { RestaurantTableStatus, TableAreaMap, TableSearchItem } from './table.model';
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
    NzInputModule,
    NzInputNumberModule,
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
  private readonly modal = inject(NzModalService);
  private readonly message = inject(NzMessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  mapLoading = false;
  searchLoading = false;
  transferOptionsLoading = false;
  transferring = false;

  selectedAreaId: string | null = null;
  areas: TableAreaMap[] = [];

  keyword = '';
  status: RestaurantTableStatus | null = null;
  minCapacity: number | null = null;
  page = 1;
  size = 10;
  total = 0;
  tables: TableSearchItem[] = [];

  occupiedTables: TableSearchItem[] = [];
  availableTables: TableSearchItem[] = [];
  sourceTableId: string | null = null;
  targetTableId: string | null = null;
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
    this.loadTransferOptions();
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

  loadTransferOptions(): void {
    this.transferOptionsLoading = true;
    this.tableService
      .getTransferOptions()
      .pipe(
        finalize(() => {
          this.transferOptionsLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: options => {
          this.occupiedTables = options.occupied;
          this.availableTables = options.available;
        },
        error: () => this.message.error('Không thể tải danh sách chuyển bàn')
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

  confirmTransfer(): void {
    if (!this.sourceTableId || !this.targetTableId) {
      this.message.warning('Vui lòng chọn bàn nguồn và bàn đích');
      return;
    }
    const source = this.occupiedTables.find(table => table.id === this.sourceTableId)?.tableNumber;
    const target = this.availableTables.find(table => table.id === this.targetTableId)?.tableNumber;
    this.modal.confirm({
      nzTitle: 'Xác nhận chuyển bàn',
      nzContent: `Chuyển khách từ bàn ${source} sang bàn ${target}?`,
      nzOnOk: () => this.transfer()
    });
  }

  statusColor(status: RestaurantTableStatus): string {
    return status === 'AVAILABLE' ? 'green' : status === 'OCCUPIED' ? 'red' : 'gold';
  }

  private async transfer(): Promise<void> {
    this.transferring = true;
    this.cdr.markForCheck();
    try {
      await firstValueFrom(this.tableService.transfer(this.sourceTableId!, this.targetTableId!));
      this.sourceTableId = null;
      this.targetTableId = null;
      this.message.success('Chuyển bàn thành công');
      this.reload();
    } catch (error: unknown) {
      const detail = (error as { error?: { errorMessage?: { message?: string } } }).error?.errorMessage?.message;
      this.message.error(detail ?? 'Không thể chuyển bàn');
    } finally {
      this.transferring = false;
      this.cdr.markForCheck();
    }
  }
}
