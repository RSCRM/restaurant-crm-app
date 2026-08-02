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
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule, NzTableQueryParams } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { finalize, Subscription } from 'rxjs';

import {
  RestaurantTableStatus,
  TableAreaMap,
  TableSearchItem,
} from './table.model';
import { TableService } from './table.service';

@Component({
  selector: 'app-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NzButtonModule, NzCardModule, NzEmptyModule, NzSelectModule, NzSpinModule, NzTagModule, I18nPipe],
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

loading = false;

// Map
selectedAreaId: string | null = null;
areas: TableAreaMap[] = [];

// Search
keyword = '';
status: RestaurantTableStatus | null = null;
minCapacity: number | null = null;
page = 1;
size = 10;
total = 0;
tables: TableSearchItem[] = [];
private searchSubscription?: Subscription;

ngOnInit(): void {
  this.loadMap();
  this.search();
}

get visibleAreas(): TableAreaMap[] {
  return this.selectedAreaId
    ? this.areas.filter(area => area.id === this.selectedAreaId)
    : this.areas;
}

loadMap(): void {
  this.loading = true;
  this.tableService
    .getMap()
    // Giữ nguyên phần pipe/subscribe của nhánh UI bên dưới
}

search(resetPage = false): void {
  if (resetPage) this.page = 1;

  this.searchSubscription?.unsubscribe();
  this.loading = true;
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
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
next: map => {
  this.areas = map.areas;
  this.cdr.markForCheck();
},
error: () => {
  this.message.error('Không thể tải sơ đồ bàn');
  this.cdr.markForCheck();
}
});
}

// Trong search()
next: result => {
  this.tables = result.data;
  this.total = result.totalElement;
  this.cdr.markForCheck();
},
error: () => {
  this.message.error('Không thể tìm kiếm bàn');
  this.cdr.markForCheck();
}
});
}

reset(): void {
  this.keyword = '';
  this.status = null;
  this.minCapacity = null;
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
