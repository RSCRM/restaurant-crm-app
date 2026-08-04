import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, finalize } from 'rxjs';

import { FormsModule } from '@angular/forms';

import {
  STChange,
  STColumn,
  STModule
} from '@delon/abc/st';
import { PageHeaderModule } from '@delon/abc/page-header';
import { I18nPipe } from '@delon/theme';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

import {
  InventoryTransactionDirection,
  InventoryTransactionResponse,
  InventoryTransactionSearchRequest,
  InventoryTransactionType,
  PagingResponse
} from '../inventory.model';
import { InventoryService } from '../inventory.service';
import { InventoryTransactionFormComponent } from '../inventory-transaction-form/inventory-transaction-form.component';

@Component({
  selector: 'app-inventory-transaction',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,

    PageHeaderModule,
    STModule,

    NzCardModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    NzIconModule,
    NzTagModule,
    NzModalModule,

    I18nPipe
  ],
  templateUrl: './inventory-transaction.component.html',
  styleUrl: './inventory-transaction.component.less'
})
export class InventoryTransactionComponent implements OnInit {
  private readonly inventoryService = inject(InventoryService);
  private readonly modal = inject(NzModalService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly message = inject(NzMessageService);
  private readonly destroyRef = inject(DestroyRef);

  loading = false;

  transactions: InventoryTransactionResponse[] = [];

  total = 0;
  currentPage = 1;
  pageSize = 10;

  filter: InventoryTransactionSearchRequest = {};

  readonly transactionTypes = Object.values(InventoryTransactionType);
  readonly transactionDirections = Object.values(
    InventoryTransactionDirection
  );

  columns: STColumn[] = [
    {
      title: { i18n: 'app.inventory.transaction.inventory' },
      index: 'inventoryName',
      width: 220
    },
    {
      title: { i18n: 'app.inventory.transaction.type' },
      render: 'type',
      width: 150
    },
    {
      title: { i18n: 'app.inventory.transaction.direction' },
      render: 'direction',
      width: 130
    },
    {
      title: { i18n: 'app.inventory.transaction.quantity' },
      index: 'quantity',
      type: 'number',
      width: 120
    },
    {
      title: { i18n: 'app.inventory.transaction.employee' },
      index: 'employeeName',
      width: 180
    },
    {
      title: { i18n: 'app.inventory.transaction.note' },
      index: 'note'
    },
    {
      title: { i18n: 'app.inventory.transaction.transactionTime' },
      index: 'transactionTime',
      type: 'date',
      width: 180
    }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.inventoryService
      .searchTransactions(
        this.filter,
        this.currentPage,
        this.pageSize
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.transactions = [];
          this.total = 0;
          this.message.error('Load inventory transactions failed');
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe((res: PagingResponse<InventoryTransactionResponse>) => {
        this.transactions = res.data;
        this.total = res.totalElement;
        this.cdr.markForCheck();
      });
  }

  openCreate(): void {
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: InventoryTransactionFormComponent,
      nzWidth: 700,
      nzData: null,
      nzFooter: null
    });

    modalRef.afterClose.subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }

  search(): void {
    this.currentPage = 1;
    this.loadData();
  }

  reset(): void {
    this.filter = {};
    this.currentPage = 1;
    this.loadData();
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

  getDirectionColor(direction: InventoryTransactionDirection): string {
    switch (direction) {
      case InventoryTransactionDirection.IN:
        return 'success';

      case InventoryTransactionDirection.OUT:
        return 'error';

      default:
        return 'default';
    }
  }

  getDirectionLabel(direction: InventoryTransactionDirection): string {
    switch (direction) {
      case InventoryTransactionDirection.IN:
        return 'app.inventory.transaction.direction.in';

      case InventoryTransactionDirection.OUT:
        return 'app.inventory.transaction.direction.out';

      default:
        return direction;
    }
  }

  getTypeLabel(type: InventoryTransactionType): string {
    switch (type) {
      case InventoryTransactionType.PURCHASE:
        return 'app.inventory.transaction.type.purchase';

      case InventoryTransactionType.SALE:
        return 'app.inventory.transaction.type.sale';

      case InventoryTransactionType.ADJUSTMENT:
        return 'app.inventory.transaction.type.adjustment';

      case InventoryTransactionType.WASTE:
        return 'app.inventory.transaction.type.waste';

      case InventoryTransactionType.RETURN:
        return 'app.inventory.transaction.type.return';

      default:
        return type;
    }
  }
}
