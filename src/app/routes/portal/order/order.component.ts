import { Component } from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [NzTypographyModule, NzCardModule],
  templateUrl: './order.component.html'
})
export class OrderComponent {}
