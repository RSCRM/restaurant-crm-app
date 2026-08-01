import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { I18nPipe } from '@delon/theme';
import { Store } from '@ngrx/store';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

import { AuthActions } from '../store/auth.actions';
import { selectAuthError, selectAuthLoading } from '../store/auth.selectors';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [AsyncPipe, ReactiveFormsModule, NzFormModule, NzInputModule, NzButtonModule, NzTypographyModule, NzAlertModule, I18nPipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.less'
})
export class LoginComponent {
  private fb = inject(NonNullableFormBuilder);
  private store = inject(Store);

  loading$ = this.store.select(selectAuthLoading);
  error$ = this.store.select(selectAuthError);

  form = this.fb.group({
    email: this.fb.control('', [Validators.required, Validators.email]),
    password: this.fb.control('', [Validators.required])
  });

  submit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => c.markAsDirty());
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.store.dispatch(AuthActions.login({ email, password }));
  }
}
