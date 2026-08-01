import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { I18nPipe } from '@delon/theme';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';

@Component({
  selector: 'header-task',
  template: `
    <div
      class="alain-default__nav-item"
      nz-dropdown
      [nzDropdownMenu]="taskMenu"
      nzTrigger="click"
      nzPlacement="bottomRight"
      (nzVisibleChange)="change()"
    >
      <nz-badge [nzDot]="true">
        <nz-icon nzType="bell" class="alain-default__nav-item-icon" />
      </nz-badge>
    </div>
    <nz-dropdown-menu #taskMenu="nzDropdownMenu">
      <div nz-menu class="wd-lg">
        @if (loading()) {
          <div class="mx-lg p-lg"><nz-spin /></div>
        } @else {
          <nz-card [nzTitle]="'notice.notifications' | i18n" nzBordered="false" class="ant-card__body-nopadding">
            <ng-template #extra><nz-icon nzType="plus" /></ng-template>
            <div nz-row [nzJustify]="'center'" [nzAlign]="'middle'" class="py-sm pr-md point bg-grey-lighter-h">
              <div nz-col [nzSpan]="4" class="text-center">
                <nz-avatar [nzSrc]="'./assets/tmp/img/1.png'" />
              </div>
              <div nz-col [nzSpan]="20">
                <strong>cipchk</strong>
                <p class="mb0">{{ 'notice.sample-message' | i18n }}</p>
              </div>
            </div>
            <div nz-row [nzJustify]="'center'" [nzAlign]="'middle'" class="py-sm pr-md point bg-grey-lighter-h">
              <div nz-col [nzSpan]="4" class="text-center">
                <nz-avatar [nzSrc]="'./assets/tmp/img/2.png'" />
              </div>
              <div nz-col [nzSpan]="20">
                <strong>Hanazaki</strong>
                <p class="mb0">{{ 'notice.sample-message' | i18n }}</p>
              </div>
            </div>
            <div nz-row [nzJustify]="'center'" [nzAlign]="'middle'" class="py-sm pr-md point bg-grey-lighter-h">
              <div nz-col [nzSpan]="4" class="text-center">
                <nz-avatar [nzSrc]="'./assets/tmp/img/3.png'" />
              </div>
              <div nz-col [nzSpan]="20">
                <strong>Mr. Su</strong>
                <p class="mb0">{{ 'notice.sample-message' | i18n }}</p>
              </div>
            </div>
            <div nz-row [nzJustify]="'center'" [nzAlign]="'middle'" class="py-sm pr-md point bg-grey-lighter-h">
              <div nz-col [nzSpan]="4" class="text-center">
                <nz-avatar [nzSrc]="'./assets/tmp/img/4.png'" />
              </div>
              <div nz-col [nzSpan]="20">
                <strong>Kent</strong>
                <p class="mb0">{{ 'notice.sample-message' | i18n }}</p>
              </div>
            </div>
            <div nz-row [nzJustify]="'center'" [nzAlign]="'middle'" class="py-sm pr-md point bg-grey-lighter-h">
              <div nz-col [nzSpan]="4" class="text-center">
                <nz-avatar [nzSrc]="'./assets/tmp/img/5.png'" />
              </div>
              <div nz-col [nzSpan]="20">
                <strong>Jefferson</strong>
                <p class="mb0">{{ 'notice.sample-message' | i18n }}</p>
              </div>
            </div>
            <div nz-row>
              <div nz-col [nzSpan]="24" class="pt-md border-top-1 text-center text-grey point">{{ 'notice.see-all' | i18n }}</div>
            </div>
          </nz-card>
        }
      </div>
    </nz-dropdown-menu>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NzDropdownModule, NzBadgeModule, NzIconModule, NzSpinModule, NzGridModule, NzAvatarModule, NzCardModule, I18nPipe]
})
export class HeaderTask {
  protected loading = signal(true);

  protected change(): void {
    setTimeout(() => {
      this.loading.set(false);
    }, 500);
  }
}
