# FE

Front-end base project built on **[ng-alain](https://ng-alain.com)** — Angular 21 + [ng-zorro-antd](https://ng.ant.design) + [@delon](https://ng-alain.com).

This is a **clean starter**: it keeps the full infrastructure (core services, layout, auth, i18n, HTTP interceptors, mock backend) but removes all the demo/showcase pages so you can build your own features on top.

## What's included

- **Layouts** — `basic` (sidebar + header widgets), `blank`, `passport` (auth pages).
- **Passport** — login / register / lock screen (`src/app/routes/passport`).
- **Dashboard** — a single welcome page (`src/app/routes/dashboard/welcome`) as a starting point.
- **Exception** — 403 / 404 / 500 pages.
- **Core** (`src/app/core`) — startup service (menu/user/i18n loading), HTTP `defaultInterceptor`, token refresh, i18n service, route guards.
- **Shared** (`src/app/shared`) — `SHARED_IMPORTS`, ST / SF / cell widget registries.
- **Mock backend** (`_mock`) — working mock API (auth, user, etc.) enabled in development via `src/environments/environment.ts`.

## Getting started

```bash
# install dependencies (Yarn 4 via corepack, or use npm)
yarn install

# start dev server (opens the browser)
yarn start

# production build
yarn build

# lint / test
yarn lint
yarn test
```

Dev server runs at http://localhost:4200 with the mock backend enabled. Default login accepts any credentials (see `_mock/_user.ts`).

## Where to build

- Add feature pages under `src/app/routes/<feature>/` and register them in `src/app/routes/routes.ts`.
- Add menu entries in `src/assets/tmp/app-data.json` (the startup service loads them).
- Path aliases: `@core`, `@shared`, `@env/*`, `@_mock` (see `tsconfig.json`).

## Notes

- The mock backend is disabled automatically in production builds (`environment.prod.ts`). Point `environment.api.baseUrl` at your real API.
- Generated from the ng-alain scaffold; see the [official docs](https://ng-alain.com) for component usage.
