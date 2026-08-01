import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { PageHeaderModule } from '@delon/abc/page-header';
import { STChange, STColumn, STModule } from '@delon/abc/st';
import { ALAIN_I18N_TOKEN, I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { catchError, EMPTY, finalize } from 'rxjs';

import { UserProfileResponse } from '../../account/profile/profile.model';
import { ProfileService } from '../../account/profile/profile.service';

@Component({
  selector: 'app-user',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, PageHeaderModule, STModule, NzButtonModule, NzCardModule, NzInputModule, NzTagModule, I18nPipe],
  templateUrl: './user.component.html'
})
export class UserComponent implements OnInit {
  private readonly service = inject(ProfileService);
  private readonly message = inject(NzMessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(ALAIN_I18N_TOKEN);

  data: UserProfileResponse[] = [];
  selected: UserProfileResponse | null = null;
  total = 0;
  page = 1;
  size = 10;
  loading = false;
  editing = false;
  fullName = '';
  phone = '';
  email = '';

  columns: STColumn[] = [];

  ngOnInit(): void {
    this.updateColumns();
    this.i18n.change.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.updateColumns();
      this.cdr.markForCheck();
    });
    this.load();
  }

  updateColumns(): void {
    this.columns = [
      { title: this.i18n.fanyi('profile.username'), index: 'username' },
      { title: this.i18n.fanyi('profile.fullname'), index: 'fullName' },
      { title: this.i18n.fanyi('profile.email'), index: 'email' },
      { title: this.i18n.fanyi('profile.phone'), index: 'phone' },
      { title: this.i18n.fanyi('profile.status'), index: 'status', render: 'status' },
      {
        title: this.i18n.fanyi('user.action'),
        buttons: [
          { text: this.i18n.fanyi('user.action.detail'), click: item => this.open(item.id, false) },
          { text: this.i18n.fanyi('user.action.edit'), iif: item => !!item.employeeId, click: item => this.open(item.id, true) }
        ]
      }
    ];
  }

  load(): void {
    this.loading = true;
    this.service
      .getAll(this.page, this.size)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.data = [];
          this.total = 0;
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(result => {
        this.data = result.data;
        this.total = result.totalElement;
        this.cdr.markForCheck();
      });
  }

  onChange(event: STChange): void {
    if (event.type === 'pi') this.page = event.pi!;
    if (event.type === 'ps') {
      this.size = event.ps!;
      this.page = 1;
    }
    if (event.type === 'pi' || event.type === 'ps') this.load();
  }

  open(profileId: string, editing: boolean): void {
    this.loading = true;
    this.service
      .getById(profileId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(profile => {
        this.selected = profile;
        this.editing = editing;
        this.fullName = profile.fullName ?? '';
        this.phone = profile.phone ?? '';
        this.email = profile.email;
        this.cdr.markForCheck();
      });
  }

  save(): void {
    if (!this.selected?.employeeId) return;
    this.loading = true;
    this.service
      .updateStaff(this.selected.employeeId, {
        fullName: this.fullName || null,
        phone: this.phone || null,
        email: this.email || null
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(profile => {
        this.selected = profile;
        this.data = this.data.map(item => (item.id === profile.id ? profile : item));
        this.editing = false;
        this.message.success(this.i18n.fanyi('user.update-staff-success'));
        this.cdr.markForCheck();
      });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'warning';
      case 'LOCKED':
        return 'error';
      case 'PENDING':
        return 'processing';
      default:
        return 'default';
    }
  }
}
