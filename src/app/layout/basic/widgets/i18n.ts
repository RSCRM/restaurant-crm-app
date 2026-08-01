import { ChangeDetectionStrategy, Component, DestroyRef, booleanAttribute, inject, DOCUMENT, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { I18NService } from '@core';
import { ALAIN_I18N_TOKEN, I18nPipe, SettingsService } from '@delon/theme';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzMessageService } from 'ng-zorro-antd/message';
import { catchError, EMPTY, finalize } from 'rxjs';

@Component({
  selector: 'header-i18n',
  template: `
    @if (showLangText()) {
      <div nz-dropdown [nzDropdownMenu]="langMenu" nzPlacement="bottomRight">
        <nz-icon nzType="global" />
        {{ 'menu.lang' | i18n }}
        <nz-icon nzType="down" />
      </div>
    } @else {
      <nz-icon nz-dropdown [nzDropdownMenu]="langMenu" nzPlacement="bottomRight" nzType="global" />
    }
    <nz-dropdown-menu #langMenu="nzDropdownMenu">
      <ul nz-menu>
        @for (item of langs; track $index) {
          <li nz-menu-item [nzSelected]="item.code === curLangCode" (click)="change(item.code)">
            <span role="img" [attr.aria-label]="item.text" class="pr-xs">{{ item.abbr }}</span>
            {{ item.text }}
          </li>
        }
      </ul>
    </nz-dropdown-menu>
  `,
  host: {
    class: 'flex-1'
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [I18nPipe, NzDropdownModule, NzIconModule, NzMenuModule]
})
export class HeaderI18n {
  private readonly settings = inject(SettingsService);
  private readonly i18n = inject<I18NService>(ALAIN_I18N_TOKEN);
  private readonly doc = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly message = inject(NzMessageService);
  private changing = false;

  /** Whether to display language text */
  readonly showLangText = input(true, { transform: booleanAttribute });

  protected readonly langs = this.i18n.getLangs();
  protected readonly curLangCode = this.settings.layout.lang;

  protected change(lang: string): void {
    if (this.changing || lang === this.curLangCode) return;
    this.changing = true;
    let switched = false;

    const spinEl = this.doc.createElement('div');
    spinEl.setAttribute('class', `page-loading ant-spin ant-spin-lg ant-spin-spinning`);
    spinEl.setAttribute('role', 'status');
    spinEl.setAttribute('aria-live', 'polite');
    spinEl.innerHTML = `<span class="ant-spin-dot ant-spin-dot-spin"><i></i><i></i><i></i><i></i></span>`;
    this.doc.body.appendChild(spinEl);

    this.i18n
      .loadLangData(lang)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.message.error(this.i18n.fanyi('language.load-failed'));
          return EMPTY;
        }),
        finalize(() => {
          if (!switched) {
            spinEl.remove();
            this.changing = false;
          }
        })
      )
      .subscribe(res => {
        this.i18n.use(lang, res);
        this.settings.setLayout('lang', lang);
        switched = true;
        this.doc.location.reload();
      });
  }
}
