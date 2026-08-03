import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzUploadChangeParam, NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { catchError, EMPTY, finalize, forkJoin, of, switchMap } from 'rxjs';

import {
  ComboResponse,
  MENU_STATUS_AVAILABLE,
  MENU_STATUS_UNAVAILABLE,
  ModifierGroupResponse,
  ModifierOptionResponse,
  ProductResponse
} from '../../menu.model';
import { MenuService } from '../../menu.service';

interface ComboFormModalData {
  branchId: string;
  combo?: ComboResponse;
}

interface ComboItemRow {
  productId: string | null;
  quantity: number;
  selections: Record<string, string | null>;
}

@Component({
  selector: 'app-combo-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzTableModule,
    NzUploadModule,
    I18nPipe
  ],
  templateUrl: './combo-form.component.html',
  styleUrl: './combo-form.component.less'
})
export class ComboFormComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private modalRef = inject(NzModalRef);
  private menuService = inject(MenuService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private modalData = inject<ComboFormModalData | null>(NZ_MODAL_DATA, { optional: true });

  isEdit = false;
  loading = false;
  loadingReference = true;
  fileList: NzUploadFile[] = [];

  products: ProductResponse[] = [];
  groupsByProduct: Record<string, ModifierGroupResponse[]> = {};
  optionsByGroup: Record<string, ModifierOptionResponse[]> = {};
  optionToGroup: Record<string, string> = {};

  rows: ComboItemRow[] = [this.createRow()];

  statusOptions = [
    { label: 'Đang bán', value: MENU_STATUS_AVAILABLE },
    { label: 'Ngừng bán', value: MENU_STATUS_UNAVAILABLE }
  ];

  formatterCurrency = (value: number): string => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  parserCurrency = (value: string): number => Number(value.replace(/,/g, ''));

  form = this.fb.group({
    comboName: this.fb.control('', [Validators.required, Validators.maxLength(150)]),
    description: this.fb.control(''),
    price: this.fb.control(0, [Validators.required, Validators.min(0)]),
    status: this.fb.control(MENU_STATUS_AVAILABLE, [Validators.required, Validators.maxLength(20)])
  });

  private createRow(): ComboItemRow {
    return { productId: null, quantity: 1, selections: {} };
  }

  ngOnInit(): void {
    const branchId = this.modalData?.branchId ?? '';
    const combo = this.modalData?.combo;
    this.isEdit = !!combo;

    if (combo) {
      this.form.patchValue({
        comboName: combo.comboName,
        description: combo.description ?? '',
        price: combo.price,
        status: combo.status
      });
      if (combo.imageUrl) {
        this.fileList = [{ uid: '-1', name: combo.comboName, status: 'done', url: combo.imageUrl }];
      }
    }

    this.menuService
      .listProducts(branchId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(products => {
          this.products = products;
          if (products.length === 0) return of([] as ModifierGroupResponse[][]);
          return forkJoin(products.map(product => this.menuService.listModifierGroups(product.id)));
        }),
        switchMap(groupLists => {
          this.products.forEach((product, index) => {
            this.groupsByProduct[product.id] = groupLists[index] ?? [];
          });
          const allGroups = groupLists.flat();
          if (allGroups.length === 0) return of([] as ModifierOptionResponse[][]);
          return forkJoin(allGroups.map(group => this.menuService.listModifierOptions(group.id))).pipe(
            switchMap(optionLists => {
              allGroups.forEach((group, index) => {
                const options = optionLists[index] ?? [];
                this.optionsByGroup[group.id] = options;
                options.forEach(option => {
                  this.optionToGroup[option.id] = group.id;
                });
              });
              return of(optionLists);
            })
          );
        }),
        finalize(() => {
          this.loadingReference = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(() => {
        if (combo && combo.items.length > 0) {
          this.rows = combo.items.map(item => {
            const selections: Record<string, string | null> = {};
            item.modifierOptionIds.forEach(optionId => {
              const groupId = this.optionToGroup[optionId];
              if (groupId) selections[groupId] = optionId;
            });
            return { productId: item.productId, quantity: item.quantity, selections };
          });
        }
        this.cdr.markForCheck();
      });
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

  productName(productId: string | null): string {
    return this.products.find(p => p.id === productId)?.productName ?? '';
  }

  groupsOf(productId: string | null): ModifierGroupResponse[] {
    return productId ? (this.groupsByProduct[productId] ?? []) : [];
  }

  optionsOf(groupId: string): ModifierOptionResponse[] {
    return this.optionsByGroup[groupId] ?? [];
  }

  addRow(): void {
    this.rows = [...this.rows, this.createRow()];
  }

  removeRow(index: number): void {
    this.rows = this.rows.filter((_, i) => i !== index);
  }

  onProductChange(row: ComboItemRow): void {
    row.selections = {};
    this.cdr.markForCheck();
  }

  submit(): void {
    if (this.form.invalid) return;

    const activeRows = this.rows.filter(row => row.productId);
    if (activeRows.length === 0) {
      this.message.warning('Vui lòng thêm ít nhất 1 món vào combo');
      return;
    }

    for (const row of activeRows) {
      if (row.quantity < 1) {
        this.message.warning(`Số lượng của "${this.productName(row.productId)}" phải lớn hơn hoặc bằng 1`);
        return;
      }
      const missingGroup = this.groupsOf(row.productId).find(group => !row.selections[group.id]);
      if (missingGroup) {
        this.message.warning(`Chưa chọn "${missingGroup.groupName}" cho món "${this.productName(row.productId)}"`);
        return;
      }
    }

    this.loading = true;
    this.cdr.markForCheck();
    const raw = this.form.getRawValue();
    const branchId = this.modalData?.branchId ?? '';
    const comboRequest = {
      branchId,
      comboName: raw.comboName,
      description: raw.description || undefined,
      price: raw.price,
      status: raw.status
    };

    const combo$ =
      this.isEdit && this.modalData?.combo
        ? this.menuService.updateCombo(this.modalData.combo.id, comboRequest, this.selectedImageFile)
        : this.menuService.createCombo(comboRequest, this.selectedImageFile);

    combo$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(combo => {
          const existingItemIds = this.modalData?.combo?.items.map(item => item.id) ?? [];
          const deletions = existingItemIds.map(itemId => this.menuService.deleteComboItem(itemId));
          const creations = activeRows.map(row => {
            if (row.productId === null) throw new Error('productId is required');
            return this.menuService.addComboItem(combo.id, {
              productId: row.productId,
              quantity: row.quantity,
              modifierOptionIds: Object.values(row.selections).filter((id): id is string => id !== null)
            });
          });
          const pending = [...deletions, ...creations];
          if (pending.length === 0) return of([]);
          return forkJoin(pending);
        }),
        catchError(() => {
          this.message.error(this.isEdit ? 'Cập nhật combo thất bại' : 'Tạo combo thất bại');
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(() => {
        this.message.success(this.isEdit ? 'Cập nhật combo thành công' : 'Tạo combo thành công');
        this.modalRef.destroy(true);
      });
  }

  close(): void {
    this.modalRef.destroy();
  }
}
