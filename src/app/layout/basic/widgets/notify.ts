import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NoticeIconList, NoticeIconModule, NoticeIconSelect, NoticeItem } from '@delon/abc/notice-icon';
import { ALAIN_I18N_TOKEN } from '@delon/theme';
import { add, formatDistanceToNow, parse } from 'date-fns';
import { NzI18nService } from 'ng-zorro-antd/i18n';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'header-notify',
  template: `
    <notice-icon
      [data]="data()"
      [count]="count"
      [loading]="loading()"
      btnClass="alain-default__nav-item"
      btnIconClass="alain-default__nav-item-icon"
      (select)="select($event)"
      (clear)="clear($event)"
      (popoverVisibleChange)="loadData()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NoticeIconModule]
})
export class HeaderNotify {
  private readonly msg = inject(NzMessageService);
  private readonly nzI18n = inject(NzI18nService);
  private readonly i18n = inject(ALAIN_I18N_TOKEN);
  protected data = signal<NoticeItem[]>([
    {
      title: this.i18n.fanyi('notice.notifications'),
      list: [],
      emptyText: this.i18n.fanyi('notice.notifications-empty'),
      emptyImage: 'https://gw.alipayobjects.com/zos/rmsportal/wAhyIChODzsoKIOBHcBk.svg',
      clearText: this.i18n.fanyi('notice.notifications-clear')
    },
    {
      title: this.i18n.fanyi('notice.messages'),
      list: [],
      emptyText: this.i18n.fanyi('notice.messages-empty'),
      emptyImage: 'https://gw.alipayobjects.com/zos/rmsportal/sAuJeJzSKbUmHfBQRzmZ.svg',
      clearText: this.i18n.fanyi('notice.messages-clear')
    },
    {
      title: this.i18n.fanyi('notice.tasks'),
      list: [],
      emptyText: this.i18n.fanyi('notice.tasks-empty'),
      emptyImage: 'https://gw.alipayobjects.com/zos/rmsportal/HsIsxMZiWKrNUavQUXqx.svg',
      clearText: this.i18n.fanyi('notice.tasks-clear')
    }
  ]);
  protected count = 5;
  protected loading = signal(false);

  private genNoticeData(notices: NoticeIconList[]): NoticeItem[] {
    const data = this.data().slice();
    data.forEach(i => (i.list = []));

    notices.forEach(item => {
      const newItem = { ...item } as NoticeIconList;
      if (typeof newItem.datetime === 'string') {
        newItem.datetime = parse(newItem.datetime, 'yyyy-MM-dd', new Date());
      }
      if (newItem.datetime) {
        newItem.datetime = formatDistanceToNow(newItem.datetime as Date, { locale: this.nzI18n.getDateLocale() });
      }
      if (newItem.extra && newItem['status']) {
        newItem['color'] = (
          {
            todo: undefined,
            processing: 'blue',
            urgent: 'red',
            doing: 'gold'
          } as Record<string, string | undefined>
        )[newItem['status']];
      }
      data.find(w => w.title === newItem['type'])!.list.push(newItem);
    });
    return data;
  }

  protected loadData(): void {
    if (this.loading()) {
      return;
    }
    this.loading.set(true);
    setTimeout(() => {
      const now = new Date();
      this.data.set(
        this.genNoticeData([
          {
            id: '000000001',
            avatar: 'https://gw.alipayobjects.com/zos/rmsportal/ThXAXghbEsBCCSDihZxY.png',
            title: this.i18n.fanyi('notice.sample.weekly-report'),
            datetime: add(now, { days: 10 }),
            type: this.i18n.fanyi('notice.notifications')
          },
          {
            id: '000000002',
            avatar: 'https://gw.alipayobjects.com/zos/rmsportal/OKJXDXrmkNshAMvwtvhu.png',
            title: this.i18n.fanyi('notice.sample.interview'),
            datetime: add(now, { days: -3 }),
            type: this.i18n.fanyi('notice.notifications')
          },
          {
            id: '000000003',
            avatar: 'https://gw.alipayobjects.com/zos/rmsportal/kISTdvpyTAhtGxpovNWd.png',
            title: this.i18n.fanyi('notice.sample.template'),
            datetime: add(now, { months: -3 }),
            read: true,
            type: this.i18n.fanyi('notice.notifications')
          },
          {
            id: '000000004',
            avatar: 'https://gw.alipayobjects.com/zos/rmsportal/GvqBnKhFgObvnSGkDsje.png',
            title: this.i18n.fanyi('notice.sample.icon'),
            datetime: add(now, { years: -1 }),
            type: this.i18n.fanyi('notice.notifications')
          },
          {
            id: '000000005',
            avatar: 'https://gw.alipayobjects.com/zos/rmsportal/ThXAXghbEsBCCSDihZxY.png',
            title: this.i18n.fanyi('notice.sample.truncated'),
            datetime: '2017-08-07',
            type: this.i18n.fanyi('notice.notifications')
          },
          {
            id: '000000006',
            avatar: 'https://gw.alipayobjects.com/zos/rmsportal/fcHMVNCjPOsbUGdEduuv.jpeg',
            title: this.i18n.fanyi('notice.sample.commented'),
            description: this.i18n.fanyi('notice.sample.description'),
            datetime: '2017-08-07',
            type: this.i18n.fanyi('notice.messages')
          },
          {
            id: '000000007',
            avatar: 'https://gw.alipayobjects.com/zos/rmsportal/fcHMVNCjPOsbUGdEduuv.jpeg',
            title: this.i18n.fanyi('notice.sample.replied'),
            description: this.i18n.fanyi('notice.sample.interaction'),
            datetime: '2017-08-07',
            type: this.i18n.fanyi('notice.messages')
          },
          {
            id: '000000008',
            avatar: 'https://gw.alipayobjects.com/zos/rmsportal/fcHMVNCjPOsbUGdEduuv.jpeg',
            title: this.i18n.fanyi('notice.sample.title'),
            description: this.i18n.fanyi('notice.sample.interaction'),
            datetime: '2017-08-07',
            type: this.i18n.fanyi('notice.messages')
          },
          {
            id: '000000009',
            title: this.i18n.fanyi('notice.sample.task-name'),
            description: this.i18n.fanyi('notice.sample.task-description'),
            extra: this.i18n.fanyi('notice.status.not-started'),
            status: 'todo',
            type: this.i18n.fanyi('notice.tasks')
          },
          {
            id: '000000010',
            title: this.i18n.fanyi('notice.sample.urgent-change'),
            description: this.i18n.fanyi('notice.sample.change-description'),
            extra: this.i18n.fanyi('notice.status.due-soon'),
            status: 'urgent',
            type: this.i18n.fanyi('notice.tasks')
          },
          {
            id: '000000011',
            title: this.i18n.fanyi('notice.sample.security-exam'),
            description: this.i18n.fanyi('notice.sample.security-description'),
            extra: this.i18n.fanyi('notice.status.elapsed'),
            status: 'doing',
            type: this.i18n.fanyi('notice.tasks')
          },
          {
            id: '000000012',
            title: this.i18n.fanyi('notice.sample.release'),
            description: this.i18n.fanyi('notice.sample.change-description'),
            extra: this.i18n.fanyi('notice.status.in-progress'),
            status: 'processing',
            type: this.i18n.fanyi('notice.tasks')
          }
        ])
      );
      this.loading.set(false);
    }, 500);
  }

  protected clear(type: string): void {
    this.msg.success(this.i18n.fanyi('notice.cleared', { type }));
  }

  protected select(res: NoticeIconSelect): void {
    this.msg.success(this.i18n.fanyi('notice.selected', { group: res.title, item: res.item.title }));
  }
}
