import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { I18nPipe } from '@delon/theme';
import { Store } from '@ngrx/store';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTableModule } from 'ng-zorro-antd/table';
import { catchError, combineLatest, EMPTY, finalize, forkJoin } from 'rxjs';

import { selectHasPermission, selectIsOwnerContext } from '../../../../auth/store/auth.selectors';
import { menuErrorMessage } from '../../menu-error';
import { CategoryResponse } from '../../menu.model';
import { MenuService } from '../../menu.service';

interface CategoryManagerModalData {
  branchId: string;
}

@Component({
  selector: 'app-category-manager',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    NzButtonModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    NzPopconfirmModule,
    NzTableModule,
    I18nPipe
  ],
  templateUrl: './category-manager.component.html',
  styleUrl: './category-manager.component.less'
})
export class CategoryManagerComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private modalRef = inject(NzModalRef);
  private menuService = inject(MenuService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private modalData = inject<CategoryManagerModalData | null>(NZ_MODAL_DATA, { optional: true });
  private store = inject(Store);

  branchId = '';
  loading = false;
  saving = false;
  formVisible = false;
  editingCategory: CategoryResponse | null = null;

  canAddCategory = true;
  canUpdateCategory = true;
  canDeleteCategory = true;

  categories: CategoryResponse[] = [];
  productCountByCategory: Record<string, number> = {};

  form = this.fb.group({
    categoryName: this.fb.control('', [Validators.required, Validators.maxLength(100)]),
    description: this.fb.control('', [Validators.maxLength(255)]),
    displayOrder: this.fb.control<number | null>(null)
  });

  ngOnInit(): void {
    this.branchId = this.modalData?.branchId ?? '';
    this.loadData();

    combineLatest([
      this.store.select(selectIsOwnerContext),
      this.store.select(selectHasPermission('CATEGORY_ADD')),
      this.store.select(selectHasPermission('CATEGORY_UPDATE')),
      this.store.select(selectHasPermission('CATEGORY_DELETE'))
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([isOwner, canAdd, canUpdate, canDelete]) => {
        this.canAddCategory = isOwner || canAdd;
        this.canUpdateCategory = isOwner || canUpdate;
        this.canDeleteCategory = isOwner || canDelete;
        this.cdr.markForCheck();
      });
  }

  loadData(): void {
    this.loading = true;
    this.cdr.markForCheck();

    forkJoin([this.menuService.listCategories(this.branchId), this.menuService.listProducts(this.branchId)])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(([categories, products]) => {
        this.categories = categories;
        const counts: Record<string, number> = {};
        products.forEach(product => {
          if (!product.categoryId) return;
          counts[product.categoryId] = (counts[product.categoryId] ?? 0) + 1;
        });
        this.productCountByCategory = counts;
        this.cdr.markForCheck();
      });
  }

  productCount(categoryId: string): number {
    return this.productCountByCategory[categoryId] ?? 0;
  }

  openCreateForm(): void {
    this.editingCategory = null;
    this.form.reset({ categoryName: '', description: '', displayOrder: null });
    this.formVisible = true;
  }

  openEditForm(category: CategoryResponse): void {
    this.editingCategory = category;
    this.form.reset({
      categoryName: category.categoryName,
      description: category.description ?? '',
      displayOrder: category.displayOrder
    });
    this.formVisible = true;
  }

  cancelForm(): void {
    this.formVisible = false;
    this.editingCategory = null;
  }

  submitForm(): void {
    if (this.form.invalid) return;

    this.saving = true;
    this.cdr.markForCheck();
    const raw = this.form.getRawValue();

    const request$ = this.editingCategory
      ? this.menuService.updateCategory(this.editingCategory.id, {
          categoryName: raw.categoryName,
          description: raw.description || undefined,
          displayOrder: raw.displayOrder ?? undefined
        })
      : this.menuService.createCategory({
          branchId: this.branchId,
          categoryName: raw.categoryName,
          description: raw.description || undefined,
          displayOrder: raw.displayOrder ?? undefined
        });

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err: HttpErrorResponse) => {
          this.message.error(menuErrorMessage(err));
          return EMPTY;
        }),
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(() => {
        this.message.success(this.editingCategory ? 'Cập nhật danh mục thành công' : 'Tạo danh mục thành công');
        this.formVisible = false;
        this.editingCategory = null;
        this.loadData();
      });
  }

  deleteCategory(category: CategoryResponse): void {
    this.menuService
      .deleteCategory(category.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err: HttpErrorResponse) => {
          this.message.error(menuErrorMessage(err));
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.message.success('Xoá danh mục thành công');
        this.loadData();
      });
  }

  close(): void {
    this.modalRef.destroy();
  }
}
