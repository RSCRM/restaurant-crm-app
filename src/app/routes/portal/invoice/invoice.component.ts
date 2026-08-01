import { Component } from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';
import { I18nPipe } from '@delon/theme';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [NzTypographyModule, NzCardModule, I18nPipe],
  templateUrl: './invoice.component.html',
  styleUrl: './invoice.component.less'
})
export class InvoiceComponent {}
