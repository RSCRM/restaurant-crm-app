import { Component } from '@angular/core';
import { I18nPipe } from '@delon/theme';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [NzTypographyModule, NzCardModule, I18nPipe],
  templateUrl: './invoice.component.html'
})
export class InvoiceComponent {}
