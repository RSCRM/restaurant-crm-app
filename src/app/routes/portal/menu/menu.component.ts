import { Component } from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';
import { I18nPipe } from '@delon/theme';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [NzTypographyModule, NzCardModule, I18nPipe],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.less'
})
export class MenuComponent {}
