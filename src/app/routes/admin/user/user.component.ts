import { Component } from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';
import { I18nPipe } from '@delon/theme';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [NzTypographyModule, NzCardModule, I18nPipe],
  templateUrl: './user.component.html',
  styleUrl: './user.component.less'
})
export class UserComponent {}
