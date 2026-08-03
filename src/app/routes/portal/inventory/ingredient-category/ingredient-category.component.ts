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

import { PageHeaderModule } from '@delon/abc/page-header';
import { STChange, STColumn, STComponent, STModule } from '@delon/abc/st';
import { I18nPipe } from '@delon/theme';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';

import { IngredientCategoryFormComponent } from '../ingredient-category-form/ingredient-category-form.component';
import {
  IngredientCategoryResponse,
  PagingResponse
} from '../inventory.model';
import { InventoryService } from '../inventory.service';

@Component({
  selector: 'app-ingredient-category',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,

    PageHeaderModule,
    STModule,
    I18nPipe,

    NzCardModule,
    NzButtonModule,
    NzInputModule,
    NzIconModule,
    NzPopconfirmModule
  ],
  templateUrl: './ingredient-category.component.html',
  styleUrl: './ingredient-category.component.less'
})
export class IngredientCategoryComponent implements OnInit {
  @ViewChild('st') st!: STComponent;

  private readonly inventoryService = inject(InventoryService);
  private readonly modal = inject(NzModalService);
  private readonly message = inject(NzMessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // ============================================================
  // Table
  // ============================================================

  data: IngredientCategoryResponse[] = [];

  loading = false;

  total = 0;
  currentPage = 1;
  pageSize = 10;

  // ============================================================
  // Search
  // ============================================================

  keyword = '';

  // ============================================================
  // Columns
  // ============================================================

  columns: STColumn[] = [
    {
      title: { i18n: 'app.ingredientCategory.categoryName' },
      index: 'categoryName',
      width: 220
    },
    {
      title: { i18n: 'app.ingredientCategory.description' },
      index: 'description'
    },
    {
      title: { i18n: 'app.ingredientCategory.createdAt' },
      index: 'createdAt',
      type: 'date',
      width: 180
    },
    {
      title: { i18n: 'app.ingredientCategory.updatedAt' },
      index: 'updatedAt',
      type: 'date',
      width: 180
    },
    {
      title: { i18n: 'app.ingredientCategory.actions' },
      width: 220,
      fixed: 'right',
      buttons: [
        {
          i18n: 'app.ingredientCategory.edit',
          icon: 'edit',
          click: item => this.openEdit(item)
        },
        {
          i18n: 'app.ingredientCategory.delete',
          icon: 'delete',
          pop: {
            titleI18n: 'app.ingredientCategory.deleteConfirm'
          },
          click: item => this.delete(item)
        }
      ]
    }
  ];

  // ============================================================
  // Lifecycle
  // ============================================================

  ngOnInit(): void {
    this.loadData();
  }

  // ============================================================
  // Data
  // ============================================================

  loadData(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.inventoryService
      .getIngredientCategories({
        page: this.currentPage,
        size: this.pageSize
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.data = [];
          this.total = 0;
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe((res: PagingResponse<IngredientCategoryResponse>) => {
        let list = res.data;

        if (this.keyword.trim()) {
          const keyword = this.keyword.toLowerCase();

          list = list.filter(
            x =>
              x.categoryName.toLowerCase().includes(keyword) ||
              (x.description ?? '').toLowerCase().includes(keyword)
          );
        }

        this.data = list;
        this.total = res.totalElement;

        this.cdr.markForCheck();
      });
  }

  // ============================================================
  // Table Event
  // ============================================================

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

  // ============================================================
  // Search
  // ============================================================

  search(): void {
    this.currentPage = 1;
    this.loadData();
  }

  clearSearch(): void {
    this.keyword = '';
    this.currentPage = 1;
    this.loadData();
  }

  // ============================================================
  // Modal
  // ============================================================

  openCreate(): void {
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: IngredientCategoryFormComponent,
      nzWidth: 600,
      nzData: null
    });

    modalRef.afterClose.subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }

  openEdit(category: IngredientCategoryResponse): void {
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: IngredientCategoryFormComponent,
      nzWidth: 600,
      nzData: category
    });

    modalRef.afterClose.subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }

  // ============================================================
  // Delete
  // ============================================================

  delete(category: IngredientCategoryResponse): void {
    this.inventoryService
      .deleteIngredientCategory(category.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.message.error('Delete ingredient category failed');
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.message.success('Ingredient category deleted successfully');
        this.loadData();
      });
  }
}
