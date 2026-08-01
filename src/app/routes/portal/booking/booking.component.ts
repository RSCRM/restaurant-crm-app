import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { STColumn, STComponent, STModule, STChange } from '@delon/abc/st';
import { PageHeaderModule } from '@delon/abc/page-header';

import { selectContextToken } from '../../auth/store/auth.selectors';
import { BookingStatus, BookingResponse } from './booking.model';
import { BookingService } from './booking.service';
import { BookingFormComponent } from './booking-form/booking-form.component';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

@Component({
  selector: 'app-booking',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzInputModule,
    NzSelectModule,
    NzFormModule,
    NzGridModule,
    NzTypographyModule,
    STModule,
    HasPermissionDirective
  ],
  templateUrl: './booking.component.html',
  styles: [
    `
      .countdown-active {
        color: var(--crm-primary-color);
        font-size: 12px;
        font-weight: 500;
        margin-top: 4px;
        display: block;
      }
      .overdue-pulse {
        color: #f5222d;
        font-size: 12px;
        font-weight: bold;
        animation: pulse 1.5s infinite;
        margin-top: 4px;
        display: block;
      }
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.3; }
        100% { opacity: 1; }
      }
    `
  ]
})
export class BookingComponent {}
