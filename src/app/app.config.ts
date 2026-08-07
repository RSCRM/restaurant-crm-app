import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { default as ngLang } from '@angular/common/locales/vi';
import {
  ApplicationConfig,
  EnvironmentProviders,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  Provider,
  provideZonelessChangeDetection
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withHashLocation,
  RouterFeatures,
  withViewTransitions
} from '@angular/router';
import { I18NService, defaultInterceptor, provideStartup } from '@core';
import { provideCellWidgets } from '@delon/abc/cell';
import { provideSTWidgets } from '@delon/abc/st';
import { provideAuth } from '@delon/auth';
import { provideSFConfig } from '@delon/form';
import { AlainProvideLang, provideAlain, vi_VN as delonLang } from '@delon/theme';
import { AlainConfig } from '@delon/util/config';
import { environment } from '@env/environment';
import { provideEffects } from '@ngrx/effects';
import { provideStore, Store } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { CELL_WIDGETS, SF_WIDGETS, ST_WIDGETS } from '@shared';
import { vi as dateLang } from 'date-fns/locale';
import { NzConfig, provideNzConfig } from 'ng-zorro-antd/core/config';
import { vi_VN as zorroLang } from 'ng-zorro-antd/i18n';

import { ICONS } from '../style-icons';
import { ICONS_AUTO } from '../style-icons-auto';
import { AuthActions } from './routes/auth/store/auth.actions';
import { AuthEffects } from './routes/auth/store/auth.effects';
import { authReducer } from './routes/auth/store/auth.reducer';
import { routes } from './routes/routes';

const defaultLang: AlainProvideLang = {
  abbr: 'vi-VN',
  ng: ngLang,
  zorro: zorroLang,
  date: dateLang,
  delon: delonLang
};

const alainConfig: AlainConfig = {
  st: { modal: { size: 'lg' } },
  auth: { login_url: '/auth/login' }
};

const ngZorroConfig: NzConfig = {};

const routerFeatures: RouterFeatures[] = [
  withComponentInputBinding(),
  withViewTransitions(),
  withInMemoryScrolling({ scrollPositionRestoration: 'top' })
];
if (environment.useHash) routerFeatures.push(withHashLocation());

const providers: Array<Provider | EnvironmentProviders> = [
  provideBrowserGlobalErrorListeners(),
  provideZonelessChangeDetection(),
  provideHttpClient(withInterceptors([defaultInterceptor])),
  provideRouter(routes, ...routerFeatures),
  provideAlain({ config: alainConfig, defaultLang, i18nClass: I18NService, icons: [...ICONS_AUTO, ...ICONS] }),
  provideNzConfig(ngZorroConfig),
  provideAuth(),
  provideCellWidgets(...CELL_WIDGETS),
  provideSTWidgets(...ST_WIDGETS),
  provideSFConfig({ widgets: SF_WIDGETS }),
  provideStartup(),
  provideStore({ auth: authReducer }),
  provideEffects([AuthEffects]),
  provideStoreDevtools({ maxAge: 25, logOnly: environment.production }),
  provideAppInitializer(() => {
    const store = inject(Store);
    store.dispatch(AuthActions.init());
  })
];

export const appConfig: ApplicationConfig = {
  providers: providers
};
