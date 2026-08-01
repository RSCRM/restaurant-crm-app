import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ALAIN_I18N_TOKEN, I18nPipe } from '@delon/theme';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'header-clear-storage',
  template: `
    <nz-icon nzType="tool" />
    {{ 'menu.clear.local.storage' | i18n }}
  `,
  host: {
    class: 'flex-1',
    '(click)': '_click()'
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NzIconModule, I18nPipe]
})
export class HeaderClearStorage {
  private readonly modalSrv = inject(NzModalService);
  private readonly messageSrv = inject(NzMessageService);
  private readonly i18n = inject(ALAIN_I18N_TOKEN);

  protected _click(): void {
    this.modalSrv.confirm({
      nzTitle: this.i18n.fanyi('storage.confirm-clear'),
      nzOnOk: () => {
        localStorage.clear();
        this.messageSrv.success(this.i18n.fanyi('storage.clear-success'));
      }
    });
  }
}
