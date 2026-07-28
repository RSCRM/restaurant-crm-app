import { Component } from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [NzTypographyModule, NzCardModule],
  templateUrl: './invoice.component.html'
})
export class InvoiceComponent {}
