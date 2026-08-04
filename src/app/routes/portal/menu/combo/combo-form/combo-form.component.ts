import { HttpErrorResponse } from '@angular/common/http';
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

import { menuErrorMessage } from '../../menu-error';
import { ComboResponse, MENU_STATUS_AVAILABLE, MENU_STATUS_UNAVAILABLE, ModifierGroupResponse, ProductResponse } from '../../menu.model';
import { MenuService } from '../../menu.service';

interface ComboFormModalData {
  branchId: string;
  combo?: ComboResponse;
}

interface ComboItemRow {
  itemId: string | null;
  productId: string | null;
  quantity: number;
  selections: Record<string, string | null>;
}

interface ItemOperationOutcome {
  success: boolean;
  productName: string;
  operation: 'add' | 'update' | 'delete';
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

  rows: ComboItemRow[] = [this.createRow()];
  private originalItemIds: string[] = [];

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
    return { itemId: null, productId: null, quantity: 1, selections: {} };
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
      this.originalItemIds = combo.items.map(item => item.id);
      this.rows =
        combo.items.length > 0
          ? combo.items.map(item => ({ itemId: item.id, productId: item.productId, quantity: item.quantity, selections: {} }))
          : [this.createRow()];
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
        finalize(() => {
          this.loadingReference = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(groupLists => {
        this.products.forEach((product, index) => {
          this.groupsByProduct[product.id] = groupLists[index] ?? [];
        });
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

  productName(productId: string | null): string {
    return this.products.find(p => p.id === productId)?.productName ?? '';
  }

  groupsOf(productId: string | null): ModifierGroupResponse[] {
    return productId ? (this.groupsByProduct[productId] ?? []) : [];
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
    const comboFields = {
      comboName: raw.comboName,
      description: raw.description || undefined,
      price: raw.price,
      status: raw.status
    };

    const combo$ =
      this.isEdit && this.modalData?.combo
        ? this.menuService.updateCombo(this.modalData.combo.id, comboFields)
        : this.menuService.createCombo({ branchId: this.modalData?.branchId ?? '', ...comboFields });

    combo$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err: HttpErrorResponse) => {
          this.message.error(menuErrorMessage(err));
          return EMPTY;
        }),
        switchMap(combo => this.syncComboItems(combo.id, activeRows)),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(outcomes => {
        if (!outcomes) return;
        const failed = outcomes.filter(o => !o.success);
        if (failed.length > 0) {
          this.message.error(`Một số món xử lý thất bại: ${failed.map(f => f.productName).join(', ')}`);
        } else {
          this.message.success(this.isEdit ? 'Cập nhật combo thành công' : 'Tạo combo thành công');
        }
        this.modalRef.destroy(true);
      });
  }

  private syncComboItems(comboId: string, activeRows: ComboItemRow[]) {
    const activeItemIds = activeRows.map(row => row.itemId).filter((id): id is string => id !== null);
    const removedItemIds = this.originalItemIds.filter(id => !activeItemIds.includes(id));

    const operations = [
      ...activeRows.map(row => this.buildUpsertOperation(comboId, row)),
      ...removedItemIds.map(itemId => this.buildDeleteOperation(itemId))
    ];

    if (operations.length === 0) return of([] as ItemOperationOutcome[]);
    return forkJoin(operations);
  }

  private buildUpsertOperation(comboId: string, row: ComboItemRow) {
    if (row.productId === null) throw new Error('productId is required');
    const request = {
      productId: row.productId,
      quantity: row.quantity,
      modifierOptionIds: Object.values(row.selections).filter((id): id is string => id !== null)
    };
    const productName = this.productName(row.productId);

    const request$ = row.itemId ? this.menuService.updateComboItem(row.itemId, request) : this.menuService.addComboItem(comboId, request);

    return request$.pipe(
      switchMap(() => of<ItemOperationOutcome>({ success: true, productName, operation: row.itemId ? 'update' : 'add' })),
      catchError(() => of<ItemOperationOutcome>({ success: false, productName, operation: row.itemId ? 'update' : 'add' }))
    );
  }

  private buildDeleteOperation(itemId: string) {
    const originalRow = this.rows.find(row => row.itemId === itemId);
    const productName = originalRow ? this.productName(originalRow.productId) : itemId;

    return this.menuService.deleteComboItem(itemId).pipe(
      switchMap(() => of<ItemOperationOutcome>({ success: true, productName, operation: 'delete' })),
      catchError(() => of<ItemOperationOutcome>({ success: false, productName, operation: 'delete' }))
    );
  }

  close(): void {
    this.modalRef.destroy();
  }
}
