import { Environment } from '@delon/theme';

export const environment = {
  production: true,
  useHash: true,
  api: {
    baseUrl: '',
    refreshTokenEnabled: true,
    refreshTokenType: 're-request'
  }
} as Environment;
