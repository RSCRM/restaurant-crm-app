import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { I18nPipe } from '@delon/theme';

import { EmployeeResponse } from '../employee.model';
import { EmployeeRoleBadgeComponent } from '../employee-role-badge/employee-role-badge.component';
import { EmployeeStatusBadgeComponent } from '../employee-status-badge/employee-status-badge.component';

@Component({
  selector: 'app-employee-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [I18nPipe, EmployeeRoleBadgeComponent, EmployeeStatusBadgeComponent],
  templateUrl: './employee-card.component.html',
  styleUrl: './employee-card.component.less'
})
export class EmployeeCardComponent {
  @Input() employee: EmployeeResponse | null = null;
}
