import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { I18nPipe } from '@delon/theme';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  selector: 'app-employee-role-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [I18nPipe, NzTagModule],
  templateUrl: './employee-role-badge.component.html'
})
export class EmployeeRoleBadgeComponent {
  @Input() role: string | null | undefined;

  get color(): string {
    switch (this.role) {
      case 'OWNER':
        return 'gold';
      case 'MANAGER':
        return 'blue';
      case 'CASHIER':
        return 'cyan';
      case 'WAITER':
        return 'green';
      case 'CHEF':
        return 'purple';
      default:
        return 'default';
    }
  }
}
