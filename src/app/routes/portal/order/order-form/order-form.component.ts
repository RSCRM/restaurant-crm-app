import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { I18nPipe } from '@delon/theme';
import { catchError, EMPTY, finalize } from 'rxjs';

import { OrderService } from '../order.service';
import { OrderType } from '../order.model';

@Component({
  selector: 'app-order-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    I18nPipe
  ],
  templateUrl: './order-form.component.html',
  styleUrl: './order-form.component.less'
})
export class OrderFormComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private modalRef = inject(NzModalRef);
  private orderService = inject(OrderService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private modalData = inject<{ branchId: string } | null>(NZ_MODAL_DATA, { optional: true });

  loading = false;

  orderTypeOptions = [
    { label: 'Dine In', value: OrderType.DINE_IN },
    { label: 'Takeaway', value: OrderType.TAKEAWAY },
    { label: 'Delivery', value: OrderType.DELIVERY }
  ];

  form: FormGroup = this.fb.group({
    branchId: this.fb.control('', [Validators.required]),
    tableId: this.fb.control(''),
    orderType: this.fb.control<OrderType>(OrderType.DINE_IN, [Validators.required]),
    customerName: this.fb.control('', [Validators.maxLength(100)]),
    customerPhone: this.fb.control('', [Validators.maxLength(20)]),
    note: this.fb.control('', [Validators.maxLength(255)]),
    items: this.fb.array([this.createItemGroup()])
  });

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  ngOnInit(): void {
    if (this.modalData?.branchId) {
      this.form.patchValue({ branchId: this.modalData.branchId });
    }
  }

  createItemGroup(): FormGroup {
    return this.fb.group({
      productId: this.fb.control(''),
      comboId: this.fb.control(''),
      quantity: this.fb.control(1, [Validators.required, Validators.min(1)]),
      note: this.fb.control('', [Validators.maxLength(255)])
    });
  }

  addItem(): void {
    this.items.push(this.createItemGroup());
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  submit(): void {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const validItems = raw.items.filter((item: any) => item.productId || item.comboId);

    if (validItems.length === 0) {
      this.message.warning('Vui lòng chọn ít nhất 1 sản phẩm');
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.orderService.createOrder({
      branchId: raw.branchId,
      tableId: raw.tableId || undefined,
      orderType: raw.orderType,
      customerName: raw.customerName || undefined,
      customerPhone: raw.customerPhone || undefined,
      note: raw.note || undefined,
      items: validItems.map((item: any) => ({
        productId: item.productId || undefined,
        comboId: item.comboId || undefined,
        quantity: item.quantity,
        note: item.note || undefined
      }))
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError(() => {
        this.message.error('Tạo đơn hàng thất bại');
        return EMPTY;
      }),
      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      })
    ).subscribe((res) => {
      this.message.success('Tạo đơn hàng thành công');
      this.modalRef.destroy(res.orderId);
    });
  }

  close(): void {
    this.modalRef.destroy();
  }
}
