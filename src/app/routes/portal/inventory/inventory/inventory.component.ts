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

import {
  STChange,
  STColumn,
  STComponent,
  STModule
} from '@delon/abc/st';
import { PageHeaderModule } from '@delon/abc/page-header';
import { I18nPipe } from '@delon/theme';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
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

import {
  InventoryCategoryResponse,
  InventoryCategoryStatus,
  InventoryResponse,
  InventorySearchRequest,
  InventoryStatus
} from '../inventory.model';
import { InventoryService } from '../inventory.service';
import { InventoryFormComponent } from '../inventory-form/inventory-form.component';
import { NzSwitchComponent } from 'ng-zorro-antd/switch';
import { ALAIN_I18N_TOKEN } from '@delon/theme';
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

    STModule,
    I18nPipe,
    NzSwitchComponent
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
  private readonly i18n = inject(ALAIN_I18N_TOKEN);
  readonly inventoryStatus = InventoryStatus;

  data: InventoryResponse[] = [];

  categoryOptions: InventoryCategoryResponse[] = [];

  total = 0;
  currentPage = 1;
  pageSize = 10;

  loading = false;

  showFilter = false;

  filter: InventorySearchRequest = this.createDefaultFilter();

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
    },
    {
      label: 'app.inventory.status.inactive',
      value: InventoryStatus.INACTIVE
    }
  ];

  columns: STColumn[] = [
    {
      title: { i18n: 'app.inventory.inventoryName' },
      index: 'inventoryName',
      width: 220
    },
    {
      title: { i18n: 'app.inventory.category' },
      index: 'inventoryCategoryName',
      width: 180
    },
    {
      title: { i18n: 'app.inventory.unit' },
      index: 'unit',
      width: 120
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
      width: 160
    },
    {
      title: { i18n: 'app.inventory.status' },
      index: 'status',
      render: 'status',
      width: 140
    },
    {
      title: { i18n: 'app.inventory.actions' },
      fixed: 'right',
      width: 120,
      buttons: [
        {
          i18n: 'app.inventory.edit',
          icon: 'edit',
          click: item => this.openEdit(item)
        }
      ]
    },
    {
      title: { i18n: 'app.inventory.enabled' },
      render: 'statusSwitch',
      width: 100
    }
  ];

  ngOnInit(): void {
    this.loadCategories();
    this.loadData();
  }

  private createDefaultFilter(): InventorySearchRequest {
    return {
      inventoryName: '',
      inventoryCategoryId: undefined,
      status: undefined,
      quantityFrom: undefined,
      quantityTo: undefined,
      minimumQuantityFrom: undefined,
      minimumQuantityTo: undefined
    };
  }

  loadCategories(): void {
    this.inventoryService
      .getInventoryCategories({
        page: 1,
        size: 1000
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        this.categoryOptions = res.data;
        this.cdr.markForCheck();
      });
  }

  loadData(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.inventoryService
      .searchInventories(this.filter, this.currentPage, this.pageSize)
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
      .subscribe(res => {
        this.data = res.data;
        this.total = res.totalElement;
        this.cdr.markForCheck();
      });
  }

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

  search(): void {
    this.currentPage = 1;
    this.loadData();
  }

  clearFilter(): void {
    this.filter = this.createDefaultFilter();
    this.currentPage = 1;
    this.loadData();
  }

  toggleFilter(): void {
    this.showFilter = !this.showFilter;
  }

  get hasActiveFilter(): boolean {
    return Object.values(this.filter).some(value => value !== null && value !== undefined && value !== '');
  }

  confirmToggle(item: InventoryResponse): void {
    const enable = item.status === InventoryStatus.INACTIVE;

    if (
      enable &&
      item.inventoryCategoryStatus === InventoryCategoryStatus.INACTIVE
    ) {
      this.modal.info({
        nzTitle: this.i18n.fanyi('app.inventory.confirm.title'),
        nzContent: this.i18n.fanyi(
          'app.inventory.categoryInactive'
        ),
        nzOkText: "OK"
      });

      return;
    }

    this.modal.confirm({
      nzTitle: this.i18n.fanyi('app.inventory.confirm.title'),
      nzContent: this.i18n.fanyi(
        enable
          ? 'app.inventory.enableConfirm'
          : 'app.inventory.disableConfirm'
      ),
      nzOnOk: () => this.updateStatus(item)
    });
  }

  private updateStatus(item: InventoryResponse): void {
    this.inventoryService
      .updateInventoryStatus(item.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.message.error(
            this.i18n.fanyi('app.inventory.updateStatusFailed')
          );
          return EMPTY;
        })
      )
      .subscribe(updated => {
        item.status = updated.status;
        this.message.success(
          this.i18n.fanyi('app.inventory.updateStatusSuccess')
        );
        this.cdr.markForCheck();
      });
  }

  openCreate(): void {
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: InventoryFormComponent,
      nzWidth: 650,
      nzFooter: null, // <-- add this
      nzData: null
    });

    modalRef.afterClose.subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }

  openEdit(inventory: InventoryResponse): void {
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: InventoryFormComponent,
      nzWidth: 650,
      nzFooter: null, // <-- add this
      nzData: inventory
    });

    modalRef.afterClose.subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }

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
