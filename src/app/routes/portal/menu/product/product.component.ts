import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
import { ProductFormComponent } from './product-form/product-form.component';
import { selectBranchId, selectHasPermission, selectIsOwnerContext, selectSelectedContext } from '../../../auth/store/auth.selectors';
import { OrganizationBranchResponse } from '../../branch/branch.model';
import { BranchService } from '../../branch/branch.service';
import { menuErrorMessage } from '../menu-error';
import { CategoryResponse, ProductResponse } from '../menu.model';
import { MenuService } from '../menu.service';

interface ProductFilter {
  categoryId: string | null;
  status: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  branchId: string | null;
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
  private branchService = inject(BranchService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private store = inject(Store);
  private router = inject(Router);

  branchId: string | null = null;
  isOwnerContext = false;
  branches: OrganizationBranchResponse[] = [];

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
  filter: ProductFilter = { categoryId: null, status: null, minPrice: null, maxPrice: null, branchId: null };
  showFilter = false;

  statusOptions = [
    { label: 'Đang bán', value: 'AVAILABLE' },
    { label: 'Ngừng bán', value: 'UNAVAILABLE' }
  ];

  get columns(): STColumn[] {
    const cols: STColumn[] = [
      { title: { i18n: 'app.portal.menu.product.image' }, width: 70, render: 'image' },
      { title: { i18n: 'app.portal.menu.product.name' }, width: 200, index: 'productName' },
      { title: { i18n: 'app.portal.menu.product.category' }, width: 150, render: 'category' }
    ];
    if (this.isOwnerContext) {
      cols.push({ title: { i18n: 'app.portal.menu.product.filter.branch' }, width: 150, render: 'branch' });
    }
    cols.push(
      { title: { i18n: 'app.portal.menu.product.price' }, width: 120, render: 'price' },
      { title: { i18n: 'app.portal.menu.product.status' }, width: 110, render: 'status' },
      { title: { i18n: 'app.portal.menu.product.requiresPreparation' }, width: 170, render: 'prep' },
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
            i18n: 'app.portal.menu.product.detail',
            icon: 'eye',
            click: item => this.goToDetail(item)
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
    );
    return cols;
  }

  ngOnInit(): void {
    combineLatest([this.store.select(selectBranchId), this.store.select(selectIsOwnerContext), this.store.select(selectSelectedContext)])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([branchId, isOwner, context]) => {
        this.branchId = branchId;
        this.isOwnerContext = isOwner;

        if (isOwner) {
          if (context?.organizationId && this.branches.length === 0) {
            this.loadBranches(context.organizationId);
          }
          this.loadData();
          return;
        }

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

  private loadBranches(organizationId: string): void {
    this.branchService
      .getBranches(organizationId, { page: 1, size: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        this.branches = res.data;
        this.cdr.markForCheck();
      });
  }

  get effectiveBranchId(): string | null {
    return this.isOwnerContext ? this.filter.branchId : this.branchId;
  }

  branchName(branchId: string | null): string {
    if (!branchId) return '-';
    return this.branches.find(b => b.id === branchId)?.branchName ?? '-';
  }

  categoryName(categoryId: string | null): string {
    if (!categoryId) return 'Chưa phân loại';
    return this.categories.find(c => c.id === categoryId)?.categoryName ?? 'Chưa phân loại';
  }

  onBranchFilterChange(branchId: string | null): void {
    this.filter.branchId = branchId;
    this.filter.categoryId = null;
    this.categories = [];
    if (branchId) this.loadCategories(branchId);
    this.search();
  }

  loadData(): void {
    if (!this.branchId && !this.isOwnerContext) {
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
        let items = res.data;
        if (this.filter.categoryId) items = items.filter(p => p.categoryId === this.filter.categoryId);
        if (this.filter.branchId) items = items.filter(p => p.branchId === this.filter.branchId);
        this.data = items;
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
    this.filter = { categoryId: null, status: null, minPrice: null, maxPrice: null, branchId: null };
    this.categories = [];
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
      this.filter.maxPrice !== null ||
      this.filter.branchId !== null
    );
  }

  openCreate(): void {
    const branchId = this.effectiveBranchId;
    if (!branchId) {
      this.message.warning('Vui lòng chọn chi nhánh');
      return;
    }
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: ProductFormComponent,
      nzWidth: 600,
      nzFooter: null,
      nzData: { branchId, categories: this.categories }
    });
    modalRef.afterClose.subscribe(result => {
      if (result) this.loadData();
    });
  }

  openEdit(product: ProductResponse): void {
    this.menuService
      .listCategories(product.branchId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(categories => {
        const modalRef = this.modal.create({
          nzTitle: undefined,
          nzContent: ProductFormComponent,
          nzWidth: 600,
          nzFooter: null,
          nzData: { branchId: product.branchId, categories, product }
        });
        modalRef.afterClose.subscribe(result => {
          if (result) this.loadData();
        });
      });
  }

  goToDetail(product: ProductResponse): void {
    this.router.navigate(['/portal/menu/product', product.id, 'detail']);
  }

  openCategoryManager(): void {
    const branchId = this.effectiveBranchId;
    if (!branchId) {
      this.message.warning('Vui lòng chọn chi nhánh');
      return;
    }
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: CategoryManagerComponent,
      nzWidth: 700,
      nzData: { branchId }
    });
    modalRef.afterClose.subscribe(() => {
      this.loadCategories(branchId);
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
