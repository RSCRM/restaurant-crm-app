import { Directive, inject, Input, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectHasPermission } from '../../auth/store/auth.selectors';

@Directive({ selector: '[appHasPermission]', standalone: true })
export class HasPermissionDirective implements OnInit {
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);
  private store = inject(Store);

  @Input('appHasPermission') permission!: string;

  ngOnInit(): void {
    this.store.select(selectHasPermission(this.permission)).subscribe(has => {
      this.viewContainer.clear();
      if (has) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}
