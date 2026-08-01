import { Environment } from '@delon/theme';

export const environment = {
  production: false,
  useHash: true,
  api: {
    baseUrl: '',
    apiPrefix: '/api/v1',
    refreshTokenEnabled: true,
    refreshTokenType: 're-request'
  }
} as Environment;
