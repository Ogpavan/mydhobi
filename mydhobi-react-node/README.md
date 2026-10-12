# MyDhobi — React and Node.js

Independent migration of the MyDhobi admin and customer application. The existing `../web` Next.js project is unchanged.

## Stack

React 19, Vite, React Router, MUI 7, TanStack Query, TypeScript, Express 5, and PostgreSQL. There is no Next.js or Radix runtime dependency.

## Structure

```text
apps/
  web/src/
    app/           Theme, session gate, navigation and lazy routes
    features/      Feature page entry points and authentication
    components/    Application views composed from MUI
    platform/      HTTP cache, routing, images and MUI notifications
  api/src/
    modules/       Feature HTTP handlers; existing /api URLs preserved
    services/      Database queries and business rules
    database/      Explicit versioned schema setup and admin provisioning
    platform/      Request context, response adapter and access controls
packages/domain/   Shared contracts, constants and pure domain rules
tests/             Isolated PostgreSQL and desktop/mobile browser checks
```

MUI owns interactive controls and accessibility behavior. Small typed compositions in `components/ui` adapt existing business forms to MUI. Existing layout utility classes are retained for feature layout; they are not a second component library. Add new features using MUI directly and shared domain contracts.

## Run with your database

Requires Node.js 22.12+ and PostgreSQL. Create a project-local `.env` using `.env.example` and set `DATABASE_URL`, `JWT_SECRET`, and `APP_ORIGIN`. Credentials are never copied from the original project. Choose a separate development database while evaluating the migration.

```sh
npm install
npm run db:migrate
npm run dev
```

The browser app uses port 3000 and proxies `/api` to Express on port 4000. Open the app at `http://localhost:3000` (the development API also accepts `http://127.0.0.1:3000`). Stop an existing app on those ports first. The launcher fails if either port is busy and shuts down both child processes together.

For an empty database, set `ADMIN_NAME`, `ADMIN_MOBILE`, and `ADMIN_PASSWORD` in your private environment, then run `npm run admin:create`. Remove the provisioning password afterward. Existing users can sign in with their existing passwords when using a compatible database.

Set `MSGCLUB_AUTH_KEY` in the private environment to enable OTP sign-in and password recovery. `MSGCLUB_ENTITY_ID` and `MSGCLUB_TEMPLATE_ID` are optional and should be set when the MsgClub account requires DLT template fields. Run `npm run db:migrate` after adding these settings and before starting the API.

`db:migrate` performs schema changes and legacy data backfills on the configured database. Run it as a deployment step. The API checks the schema version before accepting requests; requests never run schema changes. Version 1 can also initialize an empty database. Subsequent schema changes need a new versioned migration.

## Production

```sh
npm run build
npm start
```

Express serves the built React app and `/api` from the same origin. Set `APP_ORIGIN` to the browser-facing URL and `PORT` to the desired server port; the default is 4000. Use HTTPS in production because session cookies are secure and HTTP-only. Static hashed assets have long cache lifetimes; HTML and API responses do not. Configure proxy forwarding deliberately if deploying behind a reverse proxy.

## Verify without the current database

```sh
npm test
npm run build
npm run preview:fixtures
# In another terminal:
npx playwright install chromium
npm run test:browser
```

The preview uses a disposable in-memory PostgreSQL engine with synthetic records. It never reads `.env` or connects to the current database. Sign in at `http://localhost:3000` with admin mobile `9000000000` or customer mobile `9000000002`, password `Test-only-123!`. These accounts exist only in the disposable preview. Stop the preview before starting development.

## Performance and growth

- Screens load through separate route chunks; admin navigation and charts are not required for the login screen.
- TanStack Query deduplicates requests, cancels unused reads, caches by feature, and invalidates after writes. Customer startup no longer preloads every page and order.
- Shared TypeScript contracts have one source of truth; database code never enters the browser bundle.
- PostgreSQL uses a bounded connection pool, connection/query timeouts, and indexes for frequent operational filters. `DB_POOL_MAX` controls per-process pool size.
- API handlers are independent of the transport through standard Request/Response objects; Express provides middleware, limits, compression, error handling, and static serving.
- Existing queries and financial workflows are carried over. This migration is not evidence of a measured production speedup; measure against representative data and the actual hosting environment before switching traffic.
- The current rate limiter is per API process. Multiple replicas require a shared limiter store or equivalent gateway limit. Keep aggregate database connections within the PostgreSQL capacity.

The original application's business features are retained, including password login, optional OTP sign-in, and OTP-based password recovery. Payment-provider integration is not introduced by this migration.
