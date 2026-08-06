import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { OrganizationBranchResponse, OrganizationBranchStatus } from '../branch.model';

@Component({
  selector: 'app-branch-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [I18nPipe, NzButtonModule, NzDescriptionsModule, NzTagModule],
  templateUrl: './branch-detail.component.html',
  styleUrl: './branch-detail.component.less'
})
export class BranchDetailComponent {
  private modalRef = inject(NzModalRef);

  branch = inject<OrganizationBranchResponse>(NZ_MODAL_DATA);

  getBranchStatusColor(status: OrganizationBranchStatus | null | undefined): string {
    switch (status) {
      case OrganizationBranchStatus.ACTIVE:
        return 'success';
      case OrganizationBranchStatus.CLOSED:
        return 'error';
      case OrganizationBranchStatus.INACTIVE:
        return 'warning';
      default:
        return 'default';
    }
  }

  getBranchStatusKey(status: OrganizationBranchStatus | null | undefined): string {
    return status ? `branch.status.${status.toLowerCase()}` : 'common.emptyValue';
  }

  close(): void {
    this.modalRef.destroy();
  }
}
