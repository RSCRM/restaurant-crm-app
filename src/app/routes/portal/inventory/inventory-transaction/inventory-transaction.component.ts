import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PageHeaderModule } from '@delon/abc/page-header';
import { STChange, STColumn, STModule } from '@delon/abc/st';
import { I18nPipe } from '@delon/theme';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';

import {
  InventoryTransactionDirection,
  InventoryTransactionResponse,
  InventoryTransactionSearchRequest,
  InventoryTransactionType,
  PagingResponse
} from '../inventory.model';
import { InventoryService } from '../inventory.service';

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
    I18nPipe
  ],
  templateUrl: './inventory-transaction.component.html',
  styleUrl: './inventory-transaction.component.less'
})
export class InventoryTransactionComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private cdr = inject(ChangeDetectorRef);
  private message = inject(NzMessageService);

  loading = false;

  transactions: InventoryTransactionResponse[] = [];

  total = 0;
  currentPage = 1;
  pageSize = 10;

  filter: InventoryTransactionSearchRequest = {};

  transactionTypes = Object.values(InventoryTransactionType);
  transactionDirections = Object.values(InventoryTransactionDirection);

  columns: STColumn[] = [
    {
      title: { i18n: 'app.inventory.transaction.ingredient' },
      index: 'ingredientName',
      width: 220
    },
    {
      title: { i18n: 'app.inventory.transaction.type' },
      width: 150,
      render: 'type'
    },
    {
      title: { i18n: 'app.inventory.transaction.direction' },
      width: 130,
      render: 'direction'
    },
    {
      title: { i18n: 'app.inventory.transaction.quantity' },
      index: 'quantity',
      type: 'number',
      width: 120
    },
    {
      title: { i18n: 'app.inventory.transaction.employee' },
      index: 'employeeId',
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
      .subscribe({
        next: (res: PagingResponse<InventoryTransactionResponse>) => {
          this.transactions = res.data;
          this.total = res.totalElement;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.message.error('app.inventory.transaction.loadError');
          this.cdr.markForCheck();
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

  onSTChange(e: STChange): void {
    if (e.type === 'pi') {
      this.currentPage = e.pi!;
      this.loadData();
    }

    if (e.type === 'ps') {
      this.pageSize = e.ps!;
      this.currentPage = 1;
      this.loadData();
    }
  }

  getDirectionColor(direction: InventoryTransactionDirection): string {
    return direction === InventoryTransactionDirection.IN ? 'success' : 'error';
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
