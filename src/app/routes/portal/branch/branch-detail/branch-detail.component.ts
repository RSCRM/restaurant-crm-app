import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { OrganizationBranchResponse, OrganizationBranchStatus } from '../branch.model';

export interface BranchDetailModalData {
  branch: OrganizationBranchResponse;
  canEdit: boolean;
}

export interface BranchDetailModalResult {
  action: 'edit';
  branch: OrganizationBranchResponse;
}

@Component({
  selector: 'app-branch-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [I18nPipe, NzButtonModule, NzDescriptionsModule, NzIconModule, NzTagModule],
  templateUrl: './branch-detail.component.html',
  styleUrl: './branch-detail.component.less'
})
export class BranchDetailComponent {
  private modalRef = inject(NzModalRef);
  private modalData = inject<BranchDetailModalData>(NZ_MODAL_DATA);

  branch = this.modalData.branch;
  canEdit = this.modalData.canEdit;

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

  edit(): void {
    const result: BranchDetailModalResult = { action: 'edit', branch: this.branch };
    this.modalRef.destroy(result);
  }

  close(): void {
    this.modalRef.destroy();
  }
}
