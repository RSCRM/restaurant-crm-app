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
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';

import { IngredientFormComponent } from '../ingredient-form/ingredient-form.component';
import {
  IngredientCategoryResponse,
  IngredientResponse,
  PagingResponse
} from '../inventory.model';
import { InventoryService } from '../inventory.service';

@Component({
  selector: 'app-ingredient',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,

    PageHeaderModule,
    STModule,
    I18nPipe,

    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzFormModule,
    NzGridModule,
    NzPopconfirmModule
  ],
  templateUrl: './ingredient.component.html',
  styleUrl: './ingredient.component.less'
})
export class IngredientComponent implements OnInit {
  @ViewChild('st') st!: STComponent;

  private readonly inventoryService = inject(InventoryService);
  private readonly modal = inject(NzModalService);
  private readonly message = inject(NzMessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // ============================================================
  // Table
  // ============================================================

  data: IngredientResponse[] = [];

  total = 0;
  currentPage = 1;
  pageSize = 10;

  loading = false;

  // ============================================================
  // Search
  // ============================================================

  keyword = '';
  selectedCategoryId?: string;

  categories: IngredientCategoryResponse[] = [];

  // ============================================================
  // Columns
  // ============================================================

  columns: STColumn[] = [
    {
      title: { i18n: 'app.ingredient.name' },
      index: 'ingredientName',
      width: 220
    },
    {
      title: { i18n: 'app.ingredient.unit' },
      index: 'unit',
      width: 120
    },
    {
      title: { i18n: 'app.ingredient.description' },
      index: 'description'
    },
    {
      title: { i18n: 'app.ingredient.createdAt' },
      index: 'createdAt',
      type: 'date',
      width: 180
    },
    {
      title: { i18n: 'app.ingredient.updatedAt' },
      index: 'updatedAt',
      type: 'date',
      width: 180
    },
    {
      title: { i18n: 'app.ingredient.actions' },
      width: 220,
      fixed: 'right',
      buttons: [
        {
          i18n: 'app.ingredient.edit',
          icon: 'edit',
          click: item => this.openEdit(item)
        },
        {
          i18n: 'app.ingredient.delete',
          icon: 'delete',
          pop: {
            titleI18n: 'app.ingredient.deleteConfirm'
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
    this.loadCategories();
    this.loadData();
  }

  // ============================================================
  // Data
  // ============================================================

  loadCategories(): void {
    this.inventoryService
      .getIngredientCategories({
        page: 1,
        size: 1000
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        this.categories = res.data;
        this.cdr.markForCheck();
      });
  }

  loadData(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.inventoryService
      .getIngredients({
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
      .subscribe((res: PagingResponse<IngredientResponse>) => {
        let list = res.data;

        if (this.keyword.trim()) {
          const keyword = this.keyword.toLowerCase();

          list = list.filter(item =>
            item.ingredientName.toLowerCase().includes(keyword)
          );
        }

        if (this.selectedCategoryId) {
          list = list.filter(
            item => item.ingredientCategoryId === this.selectedCategoryId
          );
        }

        this.data = list;
        this.total = res.totalElement;

        this.cdr.markForCheck();
      });
  }

  // ============================================================
  // Table Events
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

    if (this.selectedCategoryId) {
      this.loading = true;
      this.cdr.markForCheck();

      this.inventoryService
        .getIngredientsByCategory(
          this.selectedCategoryId,
          this.currentPage,
          this.pageSize
        )
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
        .subscribe(res => {
          let list = res.data;

          if (this.keyword.trim()) {
            const keyword = this.keyword.toLowerCase();
            list = list.filter(item =>
              item.ingredientName.toLowerCase().includes(keyword)
            );
          }

          this.data = list;
          this.total = res.totalElement;

          this.cdr.markForCheck();
        });

      return;
    }

    if (this.keyword.trim()) {
      this.loading = true;
      this.cdr.markForCheck();

      this.inventoryService
        .searchIngredients(
          this.keyword,
          this.currentPage,
          this.pageSize
        )
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
        .subscribe(res => {
          this.data = res.data;
          this.total = res.totalElement;

          this.cdr.markForCheck();
        });

      return;
    }

    this.loadData();
  }

  clearSearch(): void {
    this.keyword = '';
    this.selectedCategoryId = undefined;
    this.currentPage = 1;

    this.loadData();
  }

  // ============================================================
  // Modal
  // ============================================================

  openCreate(): void {
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: IngredientFormComponent,
      nzWidth: 650,
      nzData: null
    });

    modalRef.afterClose.subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }

  openEdit(ingredient: IngredientResponse): void {
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: IngredientFormComponent,
      nzWidth: 650,
      nzData: ingredient
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

  delete(ingredient: IngredientResponse): void {
    this.inventoryService
      .deleteIngredient(ingredient.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.message.error('Delete ingredient failed');
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.message.success('Ingredient deleted successfully');
        this.loadData();
      });
  }
}
