import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { I18nPipe } from '@delon/theme';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  selector: 'app-employee-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [I18nPipe, NzTagModule],
  templateUrl: './employee-status-badge.component.html'
})
export class EmployeeStatusBadgeComponent {
  @Input() status: string | null | undefined;

  get color(): string {
    switch (this.status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'warning';
      case 'TERMINATED':
        return 'error';
      default:
        return 'default';
    }
  }

  get labelKey(): string {
    switch (this.status) {
      case 'ACTIVE':
        return 'employee.status.active';
      case 'INACTIVE':
        return 'employee.status.inactive';
      case 'TERMINATED':
        return 'employee.status.terminated';
      default:
        return 'common.emptyValue';
    }
  }
}
