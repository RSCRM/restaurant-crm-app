import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { OrgRoleResponse } from '../org-role.model';

interface ModalData {
  role: OrgRoleResponse;
}

/** Chỉ đọc — dựng từ dữ liệu dòng vì A2 đã trả kèm mảng permissions, không cần gọi lại A3. */
@Component({
  selector: 'app-org-role-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NzButtonModule, NzDescriptionsModule, NzTagModule, I18nPipe],
  templateUrl: './org-role-detail.component.html',
  styleUrl: './org-role-detail.component.less'
})
export class OrgRoleDetailComponent {
  private modalRef = inject(NzModalRef);
  private modalData = inject<ModalData>(NZ_MODAL_DATA);

  role = this.modalData.role;

  close(): void {
    this.modalRef.destroy();
  }
}
