import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { EmployeeResponse } from '../employee.model';

interface ModalData {
  employee: EmployeeResponse;
  branchName: string;
}

/** Chỉ đọc — backend chưa có API get-1-employee nên dựng từ dữ liệu dòng. */
@Component({
  selector: 'app-employee-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NzButtonModule, NzDescriptionsModule, NzTagModule, I18nPipe],
  templateUrl: './employee-detail.component.html',
  styleUrl: './employee-detail.component.less'
})
export class EmployeeDetailComponent {
  private modalRef = inject(NzModalRef);
  private modalData = inject<ModalData>(NZ_MODAL_DATA);

  employee = this.modalData.employee;
  branchName = this.modalData.branchName;

  close(): void {
    this.modalRef.destroy();
  }
}
