import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { EmployeeCardComponent } from '../employee-card/employee-card.component';
import { EmployeeResponse } from '../employee.model';
import { EmployeeRoleBadgeComponent } from '../employee-role-badge/employee-role-badge.component';
import { EmployeeStatusBadgeComponent } from '../employee-status-badge/employee-status-badge.component';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    I18nPipe,
    NzButtonModule,
    NzDescriptionsModule,
    NzTagModule,
    EmployeeCardComponent,
    EmployeeRoleBadgeComponent,
    EmployeeStatusBadgeComponent
  ],
  templateUrl: './employee-detail.component.html',
  styleUrl: './employee-detail.component.less'
})
export class EmployeeDetailComponent {
  private modalRef = inject(NzModalRef);
  employee = inject<EmployeeResponse>(NZ_MODAL_DATA);

  close(): void {
    this.modalRef.destroy();
  }
}
