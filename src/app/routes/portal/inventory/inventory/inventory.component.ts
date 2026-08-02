import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { EMPTY, catchError, finalize } from 'rxjs';

import { STChange, STColumn, STComponent, STModule } from '@delon/abc/st';
import { PageHeaderModule } from '@delon/abc/page-header';
import { I18nPipe } from '@delon/theme';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';

// import { InventoryFormComponent } from '../inventory-form/inventory-form.component';
import {
  InventoryResponse,
  InventorySearchRequest,
  InventoryStatus,
  PagingResponse
} from '../inventory.model';
import { InventoryService } from '../inventory.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderModule,
    FormsModule,

    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzPopconfirmModule,
    NzFormModule,
    NzGridModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzDatePickerModule,

    STModule,
    I18nPipe
  ],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.less'
})
export class InventoryComponent implements OnInit {
  @ViewChild('st') st!: STComponent;

  private readonly inventoryService = inject(InventoryService);
  private readonly modal = inject(NzModalService);
  private readonly message = inject(NzMessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // ==========================================================
  // Table State
  // ==========================================================

  data: InventoryResponse[] = [];

  total = 0;
  currentPage = 1;
  pageSize = 10;

  loading = false;

  // ==========================================================
  // Filter
  // ==========================================================

  filter: InventorySearchRequest = {};

  showFilter = false;

  statusOptions = [
    {
      label: 'app.inventory.filter.all',
      value: null
    },
    {
      label: 'app.inventory.status.good',
      value: InventoryStatus.GOOD
    },
    {
      label: 'app.inventory.status.low',
      value: InventoryStatus.LOW
    },
    {
      label: 'app.inventory.status.outOfStock',
      value: InventoryStatus.OUT_OF_STOCK
    }
  ];

  // ==========================================================
  // Table
  // ==========================================================

  columns: STColumn[] = [
    {
      title: { i18n: 'app.inventory.ingredient' },
      index: 'ingredientName',
      width: 220
    },
    {
      title: { i18n: 'app.inventory.quantity' },
      index: 'quantity',
      type: 'number',
      width: 120
    },
    {
      title: { i18n: 'app.inventory.minimumQuantity' },
      index: 'minimumQuantity',
      type: 'number',
      width: 150
    },
    {
      title: { i18n: 'app.inventory.status' },
      index: 'status',
      render: 'status',
      width: 140
    },
    {
      title: { i18n: 'app.inventory.createdAt' },
      index: 'createdAt',
      type: 'date',
      width: 180
    },
    {
      title: { i18n: 'app.inventory.updatedAt' },
      index: 'updatedAt',
      type: 'date',
      width: 180
    },
    {
      title: { i18n: 'app.inventory.actions' },
      fixed: 'right',
      width: 120,
      buttons: [
        {
          i18n: 'app.inventory.edit',
          icon: 'edit',
          // click: item => this.openEdit(item)
        }
      ]
    }
  ];

  // ==========================================================
  // Lifecycle
  // ==========================================================

  ngOnInit(): void {
    this.loadData();
  }

  // ==========================================================
  // Data
  // ==========================================================

  loadData(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.inventoryService
      .searchInventories(
        this.filter,
        this.currentPage,
        this.pageSize
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.data = [];
          this.total = 0;

          this.message.error('Load inventory failed');

          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe((res: PagingResponse<InventoryResponse>) => {
        this.data = res.data;
        this.total = res.totalElement;

        this.cdr.markForCheck();
      });
  }

  // ==========================================================
  // Table Event
  // ==========================================================

  onSTChange(event: STChange): void {
    if (event.type === 'pi') {
      this.currentPage = event.pi!;
      this.loadData();
    }

    if (event.type === 'ps') {
      this.pageSize = event.ps!;
      this.currentPage = 1;
      this.loadData();
    }
  }

  // ==========================================================
  // Search
  // ==========================================================

  search(): void {
    this.currentPage = 1;
    this.loadData();
  }

  clearFilter(): void {
    this.filter = {};
    this.currentPage = 1;
    this.loadData();
  }

  toggleFilter(): void {
    this.showFilter = !this.showFilter;
  }

  get hasActiveFilter(): boolean {
    return Object.values(this.filter).some(
      value =>
        value !== null &&
        value !== undefined &&
        value !== ''
    );
  }

  // ==========================================================
  // Modal
  // ==========================================================

  // openCreate(): void {
  //   const modalRef = this.modal.create({
  //     nzTitle: undefined,
  //     nzContent: InventoryFormComponent,
  //     nzWidth: 650,
  //     nzData: null
  //   });
  //
  //   modalRef.afterClose.subscribe(result => {
  //     if (result) {
  //       this.loadData();
  //     }
  //   });
  // }
  //
  // openEdit(inventory: InventoryResponse): void {
  //   const modalRef = this.modal.create({
  //     nzTitle: undefined,
  //     nzContent: InventoryFormComponent,
  //     nzWidth: 650,
  //     nzData: inventory
  //   });
  //
  //   modalRef.afterClose.subscribe(result => {
  //     if (result) {
  //       this.loadData();
  //     }
  //   });
  // }

  // ==========================================================
  // Helpers
  // ==========================================================

  getStatusColor(status: InventoryStatus): string {
    switch (status) {
      case InventoryStatus.GOOD:
        return 'success';

      case InventoryStatus.LOW:
        return 'warning';

      case InventoryStatus.OUT_OF_STOCK:
        return 'error';

      default:
        return 'default';
    }
  }
}
