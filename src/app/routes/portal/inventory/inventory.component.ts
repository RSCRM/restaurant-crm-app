import { Component } from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [NzTypographyModule, NzCardModule],
  templateUrl: './inventory.component.html'
})
export class InventoryComponent {}
