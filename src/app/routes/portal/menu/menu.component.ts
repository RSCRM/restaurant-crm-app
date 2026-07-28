import { Component } from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [NzTypographyModule, NzCardModule],
  templateUrl: './menu.component.html'
})
export class MenuComponent {}
