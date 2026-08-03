import { Environment } from '@delon/theme';

export const environment = {
  production: false,
  useHash: true,
  api: {
    baseUrl: '',
    apiPrefix: '/api/v1',
    refreshTokenEnabled: false,
    refreshTokenType: 're-request'
  }
} as Environment;
