import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzUploadChangeParam, NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { catchError, EMPTY, finalize } from 'rxjs';

import { CategoryResponse, MENU_STATUS_AVAILABLE, MENU_STATUS_UNAVAILABLE, ProductResponse } from '../../menu.model';
import { MenuService } from '../../menu.service';

interface ProductFormModalData {
  branchId: string;
  categories: CategoryResponse[];
  product?: ProductResponse;
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    NzButtonModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzSwitchModule,
    NzUploadModule,
    I18nPipe
  ],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.less'
})
export class ProductFormComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private modalRef = inject(NzModalRef);
  private menuService = inject(MenuService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private modalData = inject<ProductFormModalData | null>(NZ_MODAL_DATA, { optional: true });

  isEdit = false;
  loading = false;
  categories: CategoryResponse[] = [];
  fileList: NzUploadFile[] = [];

  statusOptions = [
    { label: 'Đang bán', value: MENU_STATUS_AVAILABLE },
    { label: 'Ngừng bán', value: MENU_STATUS_UNAVAILABLE }
  ];

  formatterCurrency = (value: number): string => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  parserCurrency = (value: string): number => Number(value.replace(/,/g, ''));

  form = this.fb.group({
    productName: this.fb.control('', [Validators.required, Validators.maxLength(150)]),
    categoryId: this.fb.control<string | null>(null),
    description: this.fb.control(''),
    price: this.fb.control(0, [Validators.required, Validators.min(0)]),
    status: this.fb.control(MENU_STATUS_AVAILABLE, [Validators.required, Validators.maxLength(20)]),
    requiresPreparation: this.fb.control(false)
  });

  ngOnInit(): void {
    this.categories = this.modalData?.categories ?? [];

    if (this.modalData?.product) {
      this.isEdit = true;
      const product = this.modalData.product;
      this.form.patchValue({
        productName: product.productName,
        categoryId: product.categoryId,
        description: product.description ?? '',
        price: product.price,
        status: product.status,
        requiresPreparation: product.requiresPreparation
      });
      if (product.imageUrl) {
        this.fileList = [{ uid: '-1', name: product.productName, status: 'done', url: product.imageUrl }];
      }
    }
  }

  beforeUpload = (): boolean => false;

  handleUploadChange(info: NzUploadChangeParam): void {
    const file = info.file.originFileObj;
    if (!file) {
      this.fileList = info.fileList;
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      info.file.thumbUrl = reader.result as string;
      this.fileList = [info.file];
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  removeImage = (): boolean => {
    this.fileList = [];
    return true;
  };

  private get selectedImageFile(): File | null {
    return this.fileList[0]?.originFileObj ?? null;
  }

  submit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.cdr.markForCheck();
    const raw = this.form.getRawValue();
    const branchId = this.modalData?.branchId ?? '';
    const request = {
      branchId,
      categoryId: raw.categoryId ?? undefined,
      productName: raw.productName,
      description: raw.description || undefined,
      price: raw.price,
      status: raw.status,
      requiresPreparation: raw.requiresPreparation
    };

    const request$ =
      this.isEdit && this.modalData?.product
        ? this.menuService.updateProduct(this.modalData.product.id, request, this.selectedImageFile)
        : this.menuService.createProduct(request, this.selectedImageFile);

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.message.error(this.isEdit ? 'Cập nhật món thất bại' : 'Tạo món thất bại');
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(() => {
        this.message.success(this.isEdit ? 'Cập nhật món thành công' : 'Tạo món thành công');
        this.modalRef.destroy(true);
      });
  }

  close(): void {
    this.modalRef.destroy();
  }
}
