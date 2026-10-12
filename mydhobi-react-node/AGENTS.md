# MyDhobi React and Node.js

This is the independent migration project requested by the user. The sibling `web/` application must stay unchanged. This project intentionally replaces the ancestor's Next.js-specific rules with React Router, Vite, and Express.

- Use MUI controls, dialogs, drawers, tables, feedback, and navigation. Application components may compose MUI; do not implement competing UI primitives or add Radix/shadcn.
- Keep short labels, accessible controls, compact operational layouts, and standalone headings. Retain all role and store access checks.
- Routes are lazy React Router entries in `apps/web/src/app/page-routes.tsx`. Normal navigation uses React Router links. The root Suspense boundary owns route loading.
- UI features use the central TanStack Query client. Clear session-scoped caches on logout. Never put database credentials or server modules into browser code.
- Shared contracts and pure domain rules belong in `packages/domain/src`. API handlers belong in `apps/api/src/modules`; SQL and business services belong in `apps/api/src/services`.
- All database setup and backfills run through explicit, versioned migrations. Never execute schema changes from an HTTP request.
- Use strict TypeScript and keep the frontend/backend boundary enforced. Validate mobile numbers as exactly ten digits in forms and APIs.
- Run `npm run build`, `npm test`, and relevant desktop/mobile browser checks. Tests must use the disposable fixture database, never the existing application's database.
- `npm run dev` reserves ports 3000 and 4000 and fails if occupied. Do not run a second development frontend for this repository or silently change ports.
- Build output is `apps/web/dist` and `apps/api/dist`, separate from the existing Next.js output. Do not edit the existing application's build configuration.
- Keep the PWA offline fallback, manifest, and icons working. Do not cache private API data or authenticated HTML.
