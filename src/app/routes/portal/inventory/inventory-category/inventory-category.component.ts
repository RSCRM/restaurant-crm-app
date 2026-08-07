import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { PageHeaderModule } from '@delon/abc/page-header';
import { STChange, STColumn, STModule } from '@delon/abc/st';
import { I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { EMPTY, catchError, finalize } from 'rxjs';

import { InventoryCategoryFormComponent } from '../inventory-category-form/inventory-category-form.component';
import { InventoryCategoryResponse, PagingResponse, PagingParams } from '../inventory.model';
import { InventoryService } from '../inventory.service';

@Component({
  selector: 'app-inventory-category',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, PageHeaderModule, STModule, NzCardModule, NzButtonModule, NzInputModule, NzIconModule, NzModalModule, I18nPipe],
  templateUrl: './inventory-category.component.html',
  styleUrl: './inventory-category.component.less'
})
export class InventoryCategoryComponent implements OnInit {
  private readonly inventoryService = inject(InventoryService);
  private readonly modal = inject(NzModalService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly message = inject(NzMessageService);
  private readonly destroyRef = inject(DestroyRef);

  loading = false;

  categories: InventoryCategoryResponse[] = [];

  /** Search text */
  searchKeyword = '';

  total = 0;
  currentPage = 1;
  pageSize = 10;

  columns: STColumn[] = [
    {
      title: { i18n: 'app.inventory.category.categoryName' },
      index: 'categoryName'
    },
    {
      title: { i18n: 'app.inventory.category.description' },
      index: 'description'
    },
    {
      title: { i18n: 'app.inventory.category.action' },
      width: 200,
      buttons: [
        {
          icon: 'edit',
          i18n: 'app.inventory.category.edit',
          click: record => this.openEdit(record)
        },
        {
          icon: 'delete',
          i18n: 'app.inventory.category.delete',
          type: 'del',
          pop: {
            title: 'app.inventory.category.deleteConfirm'
          },
          click: record => this.delete(record.id)
        }
      ]
    }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.cdr.markForCheck();

    const params: PagingParams = {
      page: this.currentPage,
      size: this.pageSize
    };

    const request =
      this.searchKeyword.trim().length > 0
        ? this.inventoryService.searchInventoryCategories(this.searchKeyword.trim(), this.currentPage, this.pageSize)
        : this.inventoryService.getInventoryCategories(params);

    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.categories = [];
          this.total = 0;
          this.message.error('Load inventory categories failed');
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe((res: PagingResponse<InventoryCategoryResponse>) => {
        this.categories = res.data;
        this.total = res.totalElement;
        this.cdr.markForCheck();
      });
  }

  openCreate(): void {
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: InventoryCategoryFormComponent,
      nzWidth: 700,
      nzFooter: null
    });

    modalRef.afterClose.subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }

  openEdit(category: InventoryCategoryResponse): void {
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: InventoryCategoryFormComponent,
      nzWidth: 700,
      nzFooter: null,
      nzData: category
    });

    modalRef.afterClose.subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }

  delete(id: string): void {
    this.inventoryService
      .deleteInventoryCategory(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.message.error('Delete inventory category failed');
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.message.success('Inventory category deleted successfully');
        this.loadData();
      });
  }

  search(): void {
    this.currentPage = 1;
    this.loadData();
  }

  reset(): void {
    this.searchKeyword = '';
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
}
