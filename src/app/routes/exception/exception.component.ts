import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ExceptionModule, ExceptionType } from '@delon/abc/exception';

@Component({
  selector: 'app-exception',
  templateUrl: './exception.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExceptionModule]
})
export class ExceptionComponent {
  private readonly route = inject(ActivatedRoute);
  get type(): ExceptionType {
    return this.route.snapshot.data['type'];
  }
}
