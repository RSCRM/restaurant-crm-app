import { Component } from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';
import { I18nPipe } from '@delon/theme';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [NzTypographyModule, NzCardModule, I18nPipe],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.less'
})
export class InventoryComponent {}
