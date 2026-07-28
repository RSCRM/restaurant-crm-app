import { Component } from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [NzTypographyModule, NzCardModule],
  templateUrl: './booking.component.html'
})
export class BookingComponent {}
