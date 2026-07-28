import { Component } from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [NzTypographyModule, NzCardModule],
  templateUrl: './user.component.html'
})
export class UserComponent {}
