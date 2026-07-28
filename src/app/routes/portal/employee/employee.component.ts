import { Component } from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [NzTypographyModule, NzCardModule],
  templateUrl: './employee.component.html'
})
export class EmployeeComponent {}
