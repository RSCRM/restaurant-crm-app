import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { catchError, EMPTY, finalize } from 'rxjs';

import { OrderService } from '../order.service';

@Component({
  selector: 'app-update-modifiers-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NzFormModule, NzInputModule, NzInputNumberModule, NzButtonModule, NzIconModule, I18nPipe],
  template: `
    <div class="modal-header">
      <div class="modal-title">{{ 'app.order.updateModifiers.title' | i18n }}</div>
    </div>
    <form nz-form [formGroup]="form" (ngSubmit)="submit()" nzLayout="vertical">
      <div class="modifiers-section">
        <div class="modifiers-header">
          <span>{{ 'app.order.form.modifiers' | i18n }}</span>
          <button nz-button nzType="dashed" type="button" (click)="addModifier()">
            <span nz-icon nzType="plus" nzTheme="outline"></span>
            {{ 'app.order.form.addModifier' | i18n }}
          </button>
        </div>
        @for (mod of modifiers.controls; track $index; let i = $index) {
          <div class="modifier-row" [formGroupName]="i">
            <nz-form-item>
              <nz-form-label>{{ 'app.order.form.modifierOptionId' | i18n }}</nz-form-label>
              <nz-form-control>
                <input nz-input formControlName="modifierOptionId" [placeholder]="'app.order.form.modifierOptionIdPlaceholder' | i18n" />
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>{{ 'app.order.form.modifierQty' | i18n }}</nz-form-label>
              <nz-form-control>
                <nz-input-number formControlName="quantity" [nzMin]="1" />
              </nz-form-control>
            </nz-form-item>
            <button nz-button nzType="text" nzDanger type="button" (click)="removeModifier(i)">
              <span nz-icon nzType="delete" nzTheme="outline"></span>
            </button>
          </div>
        }
      </div>

      <div class="modal-footer">
        <button nz-button type="button" (click)="close()">{{ 'app.order.form.cancel' | i18n }}</button>
        <button nz-button type="submit" nzType="primary" [nzLoading]="loading">
          {{ 'app.order.updateModifiers.submit' | i18n }}
        </button>
      </div>
    </form>
  `,
  styles: [
    `
      .modal-header {
        margin-bottom: 16px;
      }
      .modal-title {
        font-size: 18px;
        font-weight: 600;
      }
      .modifiers-section {
        border: 1px solid #f0f0f0;
        border-radius: 4px;
        padding: 12px;
        margin-bottom: 16px;
      }
      .modifiers-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .modifier-row {
        display: flex;
        gap: 8px;
        align-items: start;
      }
      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 16px;
      }
    `
  ]
})
export class UpdateModifiersFormComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private modalRef = inject(NzModalRef);
  private orderService = inject(OrderService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private modalData = inject<{ orderId: string; orderItemId: string }>(NZ_MODAL_DATA);

  loading = false;
  form: FormGroup = this.fb.group({});
  modifiers: FormArray = this.fb.array([]);

  ngOnInit(): void {}

  createModifierGroup(): FormGroup {
    return this.fb.group({
      modifierOptionId: this.fb.control('', [Validators.required]),
      quantity: this.fb.control(1, [Validators.required, Validators.min(1)])
    });
  }

  addModifier(): void {
    this.modifiers.push(this.createModifierGroup());
  }

  removeModifier(index: number): void {
    this.modifiers.removeAt(index);
  }

  submit(): void {
    this.loading = true;
    this.cdr.markForCheck();

    const modifiers = this.modifiers.controls.map(c => c.getRawValue());

    this.orderService
      .updateOrderItemModifiers(this.modalData.orderId, this.modalData.orderItemId, { modifiers })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.message.error('Cập nhật modifier thất bại');
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(() => {
        this.message.success('Cập nhật modifier thành công');
        this.modalRef.destroy(true);
      });
  }

  close(): void {
    this.modalRef.destroy();
  }
}
