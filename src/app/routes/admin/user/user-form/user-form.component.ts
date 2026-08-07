import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { catchError, EMPTY, finalize } from 'rxjs';

import { RoleResponse, UserResponse } from '../user.model';
import { UserService } from '../user.service';

interface ModalData {
  mode: 'create' | 'roles';
  user?: UserResponse;
}

@Component({
  selector: 'app-user-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NzFormModule, NzInputModule, NzButtonModule, NzSpinModule, I18nPipe],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.less'
})
export class UserFormComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private modalRef = inject(NzModalRef);
  private userService = inject(UserService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private modalData = inject<ModalData | null>(NZ_MODAL_DATA, { optional: true });

  mode: 'create' | 'roles' = 'create';
  user: UserResponse | null = null;
  loading = false;
  rolesLoading = false;
  roles: RoleResponse[] = [];
  selectedRoleIds = new Set<string>();

  createForm = this.fb.group({
    username: this.fb.control('', [Validators.required, Validators.minLength(5), Validators.maxLength(50)]),
    password: this.fb.control('', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]),
    email: this.fb.control('', [Validators.required, Validators.email]),
    fullName: this.fb.control('', [Validators.required]),
    phone: this.fb.control('', [Validators.required])
  });

  rolesForm = this.fb.group({
    roleIds: this.fb.control<string[]>([])
  });

  ngOnInit(): void {
    if (this.modalData?.mode === 'roles' && this.modalData.user) {
      this.mode = 'roles';
      this.user = this.modalData.user;
      this.selectedRoleIds = new Set(this.user.roles.map(r => r.id));
      this.rolesForm.patchValue({
        roleIds: this.user.roles.map(r => r.id)
      });
      this.loadRoles();
    }
  }

  loadRoles(): void {
    this.rolesLoading = true;
    this.cdr.markForCheck();

    this.userService
      .getRoles()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => EMPTY),
        finalize(() => {
          this.rolesLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(roles => {
        this.roles = roles;
        this.cdr.markForCheck();
      });
  }

  toggleRole(roleId: string): void {
    if (this.selectedRoleIds.has(roleId)) {
      this.selectedRoleIds.delete(roleId);
    } else {
      this.selectedRoleIds.add(roleId);
    }
    this.rolesForm.patchValue({
      roleIds: Array.from(this.selectedRoleIds)
    });
  }

  isRoleSelected(roleId: string): boolean {
    return this.selectedRoleIds.has(roleId);
  }

  submit(): void {
    if (this.mode === 'create') {
      this.submitCreate();
    } else {
      this.submitRoles();
    }
  }

  private submitCreate(): void {
    if (this.createForm.invalid) return;

    this.loading = true;
    this.cdr.markForCheck();
    const raw = this.createForm.getRawValue();

    this.userService
      .createUser({
        username: raw.username,
        password: raw.password,
        email: raw.email,
        fullName: raw.fullName,
        phone: raw.phone
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.message.error('Tạo người dùng thất bại');
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(() => {
        this.message.success('Tạo người dùng thành công');
        this.modalRef.destroy(true);
      });
  }

  private submitRoles(): void {
    if (!this.user) return;

    this.loading = true;
    this.cdr.markForCheck();
    const raw = this.rolesForm.getRawValue();

    this.userService
      .updateUserRoles(this.user.id, raw.roleIds)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.message.error('Cập nhật vai trò thất bại');
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(() => {
        this.message.success('Cập nhật vai trò thành công');
        this.modalRef.destroy(true);
      });
  }

  close(): void {
    this.modalRef.destroy();
  }
}
