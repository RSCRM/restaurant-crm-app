import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { PageHeaderModule } from '@delon/abc/page-header';
import { STChange, STColumn, STModule } from '@delon/abc/st';
import { I18nPipe } from '@delon/theme';
import { Store } from '@ngrx/store';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { catchError, combineLatest, EMPTY, finalize } from 'rxjs';

import { CategoryManagerComponent } from './category-manager/category-manager.component';
import { ModifierManagerComponent } from './modifier-manager/modifier-manager.component';
import { ProductFormComponent } from './product-form/product-form.component';
import { selectBranchId, selectHasPermission, selectIsOwnerContext } from '../../../auth/store/auth.selectors';
import { menuErrorMessage } from '../menu-error';
import { CategoryResponse, ProductResponse } from '../menu.model';
import { MenuService } from '../menu.service';

interface ProductFilter {
  categoryId: string | null;
  status: string | null;
  minPrice: number | null;
  maxPrice: number | null;
}

@Component({
  selector: 'app-menu-product',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    PageHeaderModule,
    STModule,
    NzAvatarModule,
    NzButtonModule,
    NzCardModule,
    NzFormModule,
    NzGridModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzTagModule,
    I18nPipe
  ],
  templateUrl: './product.component.html',
  styleUrl: './product.component.less'
})
export class ProductComponent implements OnInit {
  private menuService = inject(MenuService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private store = inject(Store);

  branchId: string | null = null;

  canAddProduct = true;
  canUpdateProduct = true;
  canDeleteProduct = true;

  data: ProductResponse[] = [];
  categories: CategoryResponse[] = [];

  total = 0;
  currentPage = 1;
  pageSize = 10;
  loading = false;

  searchValue = '';
  filter: ProductFilter = { categoryId: null, status: null, minPrice: null, maxPrice: null };
  showFilter = false;

  statusOptions = [
    { label: 'Đang bán', value: 'AVAILABLE' },
    { label: 'Ngừng bán', value: 'UNAVAILABLE' }
  ];

  columns: STColumn[] = [
    { title: { i18n: 'app.portal.menu.product.image' }, width: 70, render: 'image' },
    { title: { i18n: 'app.portal.menu.product.name' }, index: 'productName' },
    { title: { i18n: 'app.portal.menu.product.category' }, width: 150, render: 'category' },
    { title: { i18n: 'app.portal.menu.product.price' }, width: 120, render: 'price' },
    { title: { i18n: 'app.portal.menu.product.status' }, width: 110, render: 'status' },
    { title: { i18n: 'app.portal.menu.product.requiresPreparation' }, width: 130, render: 'prep' },
    {
      title: { i18n: 'app.portal.menu.product.actions' },
      width: 220,
      fixed: 'right',
      buttons: [
        {
          i18n: 'app.portal.menu.product.edit',
          icon: 'edit',
          iif: () => this.canUpdateProduct,
          click: item => this.openEdit(item)
        },
        {
          i18n: 'app.portal.menu.product.modifiers',
          icon: 'setting',
          iif: () => this.canUpdateProduct,
          click: item => this.openModifierManager(item)
        },
        {
          i18n: 'app.portal.menu.product.delete',
          icon: 'delete',
          iif: () => this.canDeleteProduct,
          pop: { titleI18n: 'app.portal.menu.product.deleteConfirm' },
          click: item => this.deleteProduct(item)
        }
      ]
    }
  ];

  ngOnInit(): void {
    this.store
      .select(selectBranchId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(branchId => {
        this.branchId = branchId;
        if (!branchId) {
          this.data = [];
          this.total = 0;
          this.cdr.markForCheck();
          return;
        }
        this.loadCategories(branchId);
        this.loadData();
      });

    combineLatest([
      this.store.select(selectIsOwnerContext),
      this.store.select(selectHasPermission('PRODUCT_ADD')),
      this.store.select(selectHasPermission('PRODUCT_UPDATE')),
      this.store.select(selectHasPermission('PRODUCT_DELETE'))
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([isOwner, canAdd, canUpdate, canDelete]) => {
        this.canAddProduct = isOwner || canAdd;
        this.canUpdateProduct = isOwner || canUpdate;
        this.canDeleteProduct = isOwner || canDelete;
        this.cdr.markForCheck();
      });
  }

  private loadCategories(branchId: string): void {
    this.menuService
      .listCategories(branchId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(categories => {
        this.categories = categories;
        this.cdr.markForCheck();
      });
  }

  categoryName(categoryId: string | null): string {
    if (!categoryId) return 'Chưa phân loại';
    return this.categories.find(c => c.id === categoryId)?.categoryName ?? 'Chưa phân loại';
  }

  loadData(): void {
    if (!this.branchId) {
      this.message.warning('Vui lòng chọn chi nhánh');
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.menuService
      .searchProducts(
        {
          productName: this.searchValue.trim() || undefined,
          priceFrom: this.filter.minPrice ?? undefined,
          priceTo: this.filter.maxPrice ?? undefined
        },
        this.currentPage,
        this.pageSize
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err: HttpErrorResponse) => {
          this.message.error(menuErrorMessage(err));
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
        this.total = res.totalElement;
        this.data = this.filter.categoryId ? res.data.filter(p => p.categoryId === this.filter.categoryId) : res.data;
      });
  }

  onSTChange(e: STChange): void {
    if (e.type === 'pi') {
      this.currentPage = e.pi ?? 1;
      this.loadData();
    } else if (e.type === 'ps') {
      this.pageSize = e.ps ?? 10;
      this.currentPage = 1;
      this.loadData();
    }
  }

  search(): void {
    this.currentPage = 1;
    this.loadData();
  }

  toggleFilter(): void {
    this.showFilter = !this.showFilter;
  }

  clearFilter(): void {
    this.filter = { categoryId: null, status: null, minPrice: null, maxPrice: null };
    this.searchValue = '';
    this.currentPage = 1;
    this.loadData();
  }

  get hasActiveFilter(): boolean {
    return (
      this.searchValue !== '' ||
      this.filter.categoryId !== null ||
      this.filter.status !== null ||
      this.filter.minPrice !== null ||
      this.filter.maxPrice !== null
    );
  }

  openCreate(): void {
    if (!this.branchId) {
      this.message.warning('Vui lòng chọn chi nhánh');
      return;
    }
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: ProductFormComponent,
      nzWidth: 600,
      nzData: { branchId: this.branchId, categories: this.categories }
    });
    modalRef.afterClose.subscribe(result => {
      if (result) this.loadData();
    });
  }

  openEdit(product: ProductResponse): void {
    if (!this.branchId) return;
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: ProductFormComponent,
      nzWidth: 600,
      nzData: { branchId: this.branchId, categories: this.categories, product }
    });
    modalRef.afterClose.subscribe(result => {
      if (result) this.loadData();
    });
  }

  openModifierManager(product: ProductResponse): void {
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: ModifierManagerComponent,
      nzWidth: 700,
      nzData: { product }
    });
    modalRef.afterClose.subscribe(() => this.loadData());
  }

  openCategoryManager(): void {
    if (!this.branchId) {
      this.message.warning('Vui lòng chọn chi nhánh');
      return;
    }
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: CategoryManagerComponent,
      nzWidth: 700,
      nzData: { branchId: this.branchId }
    });
    modalRef.afterClose.subscribe(() => {
      if (this.branchId) this.loadCategories(this.branchId);
      this.loadData();
    });
  }

  deleteProduct(product: ProductResponse): void {
    this.menuService
      .deleteProduct(product.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err: HttpErrorResponse) => {
          this.message.error(menuErrorMessage(err));
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.message.success('Xoá món thành công');
        this.loadData();
      });
  }
}
