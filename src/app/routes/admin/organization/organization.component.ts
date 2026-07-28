import { Component } from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-organization',
  standalone: true,
  imports: [NzTypographyModule, NzCardModule],
  templateUrl: './organization.component.html'
})
export class OrganizationComponent {}
