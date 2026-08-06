import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PageHeaderModule } from '@delon/abc/page-header';
import { STColumn, STModule } from '@delon/abc/st';
import { ALAIN_I18N_TOKEN, I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { catchError, EMPTY, finalize } from 'rxjs';

import { OrgRoleDetailComponent } from './org-role-detail/org-role-detail.component';
import { OrgRoleFormComponent } from './org-role-form/org-role-form.component';
import { OrgRoleResponse } from './org-role.model';
import { OrgRoleService } from './org-role.service';

/**
 * Trang chỉ mở cho owner có ORG_ROLE_MANAGE (gác ở route), nên các nút không cần
 * điều kiện disable theo permission — vào được tới đây nghĩa là đã đủ quyền.
 */
@Component({
  selector: 'app-org-role',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderModule, STModule, NzButtonModule, NzCardModule, NzIconModule, NzTagModule, I18nPipe],
  templateUrl: './org-role.component.html',
  styleUrl: './org-role.component.less'
})
export class OrgRoleComponent implements OnInit {
  private orgRoleService = inject(OrgRoleService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private i18n = inject(ALAIN_I18N_TOKEN);

  data: OrgRoleResponse[] = [];
  loading = false;

  columns: STColumn[] = [
    { title: { i18n: 'app.org-role.col.roleName' }, index: 'roleName', width: 220 },
    { title: { i18n: 'app.org-role.col.permissionCount' }, width: 140, render: 'permissionCount' },
    {
      title: { i18n: 'app.org-role.col.actions' },
      width: 220,
      fixed: 'right',
      buttons: [
        { i18n: 'app.org-role.action.detail', icon: 'eye', click: item => this.openDetail(item as OrgRoleResponse) },
        { i18n: 'app.org-role.action.edit', icon: 'edit', click: item => this.openEdit(item as OrgRoleResponse) },
        {
          i18n: 'app.org-role.action.delete',
          icon: 'delete',
          pop: { titleI18n: 'app.org-role.deleteConfirm' },
          click: () => this.deleteRole()
        }
      ]
    }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.orgRoleService
      .listRoles()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.data = [];
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(roles => {
        this.data = roles;
        this.cdr.markForCheck();
      });
  }

  openCreate(): void {
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: OrgRoleFormComponent,
      nzWidth: 720,
      nzData: { mode: 'create' }
    });
    modalRef.afterClose.subscribe(result => {
      if (result) this.loadData();
    });
  }

  openEdit(role: OrgRoleResponse): void {
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: OrgRoleFormComponent,
      nzWidth: 720,
      nzData: { mode: 'edit', role }
    });
    modalRef.afterClose.subscribe(result => {
      if (result) this.loadData();
    });
  }

  openDetail(role: OrgRoleResponse): void {
    this.modal.create({
      nzTitle: undefined,
      nzContent: OrgRoleDetailComponent,
      nzWidth: 600,
      nzData: { role }
    });
  }

  /** Backend chưa có API xóa — nút giữ chỗ để gắn API sau. */
  deleteRole(): void {
    this.message.info(this.i18n.fanyi('app.org-role.deleteUnsupported'));
  }
}
