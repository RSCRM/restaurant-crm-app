import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { catchError, debounceTime, EMPTY, finalize, Subject, switchMap } from 'rxjs';

import { UserResponse } from '../../user/user.model';
import { UserService } from '../../user/user.service';
import { OrganizationResponse } from '../organization.model';
import { OrganizationService } from '../organization.service';

interface ModalData {
  mode: 'create' | 'edit';
  organization?: OrganizationResponse;
}

@Component({
  selector: 'app-organization-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NzFormModule, NzInputModule, NzSelectModule, NzButtonModule, I18nPipe],
  templateUrl: './organization-form.component.html',
  styleUrl: './organization-form.component.less'
})
export class OrganizationFormComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private modalRef = inject(NzModalRef);
  private orgService = inject(OrganizationService);
  private userService = inject(UserService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private modalData = inject<ModalData | null>(NZ_MODAL_DATA, { optional: true });

  mode: 'create' | 'edit' = 'create';
  organization: OrganizationResponse | null = null;
  loading = false;
  userLoading = false;
  users: UserResponse[] = [];
  private userSearch$ = new Subject<string>();

  form = this.fb.group({
    ownerId: this.fb.control('', [Validators.required]),
    organizationName: this.fb.control('', [Validators.required, Validators.maxLength(150)]),
    taxCode: this.fb.control('', [Validators.maxLength(50)]),
    address: this.fb.control('', [Validators.maxLength(255)]),
    phone: this.fb.control('', [Validators.maxLength(20)]),
    email: this.fb.control('', [Validators.email, Validators.maxLength(100)])
  });

  ngOnInit(): void {
    this.loadUsers();

    this.userSearch$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(300),
        switchMap(keyword => {
          this.userLoading = true;
          this.cdr.markForCheck();
          return this.userService.searchUsers(keyword ? { username: keyword } : {}, 1, 30).pipe(
            finalize(() => {
              this.userLoading = false;
              this.cdr.markForCheck();
            })
          );
        })
      )
      .subscribe(res => {
        this.users = res.data;
        this.cdr.markForCheck();
      });

    if (this.modalData?.mode === 'edit' && this.modalData.organization) {
      this.mode = 'edit';
      this.organization = this.modalData.organization;
      this.form.patchValue({
        ownerId: this.organization.ownerId,
        organizationName: this.organization.organizationName,
        taxCode: this.organization.taxCode || '',
        address: this.organization.address || '',
        phone: this.organization.phone || '',
        email: this.organization.email || ''
      });
      this.form.controls.ownerId.disable();
    }
  }

  loadUsers(): void {
    this.userLoading = true;
    this.cdr.markForCheck();
    this.userService
      .searchUsers({}, 1, 30)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => EMPTY),
        finalize(() => {
          this.userLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(res => {
        this.users = res.data;
        this.cdr.markForCheck();
      });
  }

  onUserSearch(keyword: string): void {
    this.userSearch$.next(keyword);
  }

  submit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.cdr.markForCheck();

    if (this.mode === 'create') {
      this.submitCreate();
    } else {
      this.submitUpdate();
    }
  }

  private submitCreate(): void {
    const raw = this.form.getRawValue();

    this.orgService
      .createOrganization({
        ownerId: raw.ownerId,
        organizationName: raw.organizationName,
        taxCode: raw.taxCode || undefined,
        address: raw.address || undefined,
        phone: raw.phone || undefined,
        email: raw.email || undefined
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.message.error('Tạo tổ chức thất bại');
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(() => {
        this.message.success('Tạo tổ chức thành công');
        this.modalRef.destroy(true);
      });
  }

  private submitUpdate(): void {
    if (!this.organization) return;

    const raw = this.form.getRawValue();

    this.orgService
      .updateOrganization(this.organization.id, {
        organizationName: raw.organizationName,
        taxCode: raw.taxCode || undefined,
        address: raw.address || undefined,
        phone: raw.phone || undefined,
        email: raw.email || undefined
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.message.error('Cập nhật tổ chức thất bại');
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(() => {
        this.message.success('Cập nhật tổ chức thành công');
        this.modalRef.destroy(true);
      });
  }

  close(): void {
    this.modalRef.destroy();
  }
}
