import { Component } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { PageHeaderModule } from '@delon/abc/page-header';
import { I18nPipe } from '@delon/theme';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [NzCardModule, PageHeaderModule, I18nPipe],
  templateUrl: './booking.component.html'
})
export class BookingComponent {}
