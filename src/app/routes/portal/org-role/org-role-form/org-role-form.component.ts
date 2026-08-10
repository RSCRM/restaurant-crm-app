import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ALAIN_I18N_TOKEN, I18nPipe } from '@delon/theme';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { catchError, EMPTY, finalize } from 'rxjs';

import { mapApiError } from '../../../../shared/utils/api-error';
import { OrgPermissionResponse, OrgRoleResponse } from '../org-role.model';
import { OrgRoleService } from '../org-role.service';

interface ModalData {
  mode: 'create' | 'edit';
  role?: OrgRoleResponse;
}

@Component({
  selector: 'app-org-role-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NzAlertModule, NzButtonModule, NzCheckboxModule, NzFormModule, NzInputModule, NzSpinModule, I18nPipe],
  templateUrl: './org-role-form.component.html',
  styleUrl: './org-role-form.component.less'
})
export class OrgRoleFormComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private modalRef = inject(NzModalRef);
  private orgRoleService = inject(OrgRoleService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private i18n = inject(ALAIN_I18N_TOKEN);
  private modalData = inject<ModalData | null>(NZ_MODAL_DATA, { optional: true });

  mode: 'create' | 'edit' = 'create';
  role: OrgRoleResponse | null = null;
  permissions: OrgPermissionResponse[] = [];
  selectedPermissionIds = new Set<string>();
  loading = false;
  permissionLoading = false;
  errorText = '';

  form = this.fb.group({
    roleName: this.fb.control('', [Validators.required, Validators.maxLength(50)])
  });

  ngOnInit(): void {
    if (this.modalData?.mode === 'edit' && this.modalData.role) {
      this.mode = 'edit';
      this.role = this.modalData.role;
      this.form.patchValue({ roleName: this.role.roleName });
      this.role.permissions.forEach(p => this.selectedPermissionIds.add(p.id));
    }
    this.loadPermissions();
  }

  private loadPermissions(): void {
    this.permissionLoading = true;
    this.orgRoleService
      .listPermissions()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          this.errorText = mapApiError(err, key => this.i18n.fanyi(key));
          this.permissions = [];
          return EMPTY;
        }),
        finalize(() => {
          this.permissionLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(permissions => {
        // Ten permission luon dang PREFIX_PHAN_CON_LAI nen sap xep alphabet tren chuoi day du
        // tu gom cac permission cung prefix nam lien nhau. Danh sach van phang, khong chia dau muc.
        this.permissions = permissions.sort((a, b) => a.permissionName.localeCompare(b.permissionName));
        this.cdr.markForCheck();
      });
  }

  isChecked(id: string): boolean {
    return this.selectedPermissionIds.has(id);
  }

  toggle(id: string, checked: boolean): void {
    if (checked) {
      this.selectedPermissionIds.add(id);
    } else {
      this.selectedPermissionIds.delete(id);
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorText = '';
    this.loading = true;
    this.cdr.markForCheck();

    const request = {
      roleName: this.form.getRawValue().roleName,
      permissionIds: Array.from(this.selectedPermissionIds)
    };

    const call$ = this.mode === 'create' ? this.orgRoleService.createRole(request) : this.orgRoleService.updateRole(this.role!.id, request);

    call$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          this.errorText = mapApiError(err, key => this.i18n.fanyi(key));
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(() => {
        this.message.success(
          this.i18n.fanyi(this.mode === 'create' ? 'app.org-role.form.createSuccess' : 'app.org-role.form.updateSuccess')
        );
        this.modalRef.destroy(true);
      });
  }

  close(): void {
    this.modalRef.destroy();
  }
}
