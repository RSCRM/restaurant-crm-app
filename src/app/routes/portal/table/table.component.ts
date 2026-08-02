import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule, NzTableQueryParams } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { RestaurantTableStatus, TableSearchItem } from './table.model';
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
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
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

  keyword = '';
  status: RestaurantTableStatus | null = null;
  minCapacity: number | null = null;
  maxCapacity: number | null = null;
  page = 1;
  size = 10;
  total = 0;
  loading = false;
  tables: TableSearchItem[] = [];

  ngOnInit(): void {
    this.search();
  }

  search(resetPage = false): void {
    if (resetPage) this.page = 1;
    if (this.minCapacity != null && this.maxCapacity != null && this.minCapacity > this.maxCapacity) {
      this.message.warning('Sức chứa tối thiểu không thể lớn hơn tối đa');
      return;
    }

    this.loading = true;
    this.tableService
      .search({
        keyword: this.keyword.trim() || undefined,
        status: this.status ?? undefined,
        minCapacity: this.minCapacity ?? undefined,
        maxCapacity: this.maxCapacity ?? undefined,
        page: this.page,
        size: this.size
      })
      .subscribe({
        next: result => {
          this.tables = result.data;
          this.total = result.totalElement;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.message.error('Không thể tìm kiếm bàn');
          this.cdr.markForCheck();
        }
      });
  }

  reset(): void {
    this.keyword = '';
    this.status = null;
    this.minCapacity = null;
    this.maxCapacity = null;
    this.search(true);
  }

  onQuery(params: NzTableQueryParams): void {
    const { pageIndex, pageSize } = params;
    if (pageIndex !== this.page || pageSize !== this.size) {
      this.page = pageIndex;
      this.size = pageSize;
      this.search();
    }
  }

  statusColor(status: RestaurantTableStatus): string {
    return status === 'AVAILABLE' ? 'green' : status === 'OCCUPIED' ? 'red' : 'gold';
  }
}
