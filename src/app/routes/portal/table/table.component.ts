import { Component } from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [NzTypographyModule, NzCardModule],
  templateUrl: './table.component.html'
})
export class TableComponent {}
