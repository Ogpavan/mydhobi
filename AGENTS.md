# MyDhobi Project Instructions

## Product Direction

- This is an operational laundry and dry-cleaning admin application, not a marketing website.
- Many users may have limited literacy or limited experience with software. Design every workflow so it can be understood quickly without technical knowledge.
- Use short, familiar words and simple sentences. Avoid jargon, formal language, uncommon abbreviations, and difficult English.
- Prefer clear icons, status colors, familiar symbols, examples, and visual feedback where they make an action easier to understand. Do not rely on color or icons alone; pair them with a short label when meaning may be unclear.
- Keep screens compact, practical, and easy to scan during repeated daily use.
- Preserve the established visual language unless the task explicitly requests a redesign.
- Use `MyDhobi` for the customer-facing product name and `MyDhobi Admin` where the admin context needs to be explicit.

## Content Hierarchy

- Do not place a descriptive subheading, subtitle, eyebrow, or tagline directly beneath a page, section, card, modal, or form heading.
- A heading must stand on its own. Put essential context in the body content, field labels, status text, or an info tooltip instead.
- Do not repeat the page title inside the page body when `AdminHeader` already displays it.
- Keep labels and action text short and direct.
- Do not add visible instructional copy that explains obvious controls or how to use the interface.

## Interface Rules

- Reuse components from `components/ui` and existing admin components before creating new primitives.
- Use Lucide icons for familiar actions. Icon-only controls must have an accessible label and a tooltip when their meaning is not obvious.
- Keep controls and information dense enough for an admin dashboard; avoid oversized headings, promotional layouts, decorative sections, and excessive empty space.
- Do not nest cards inside cards or turn whole page sections into floating cards.
- Keep border radii, spacing, colors, typography, shadows, and control heights consistent with neighboring screens.
- Ensure layouts work on mobile and desktop without clipped text, overflow, or overlapping controls.
- Preserve visible loading, empty, error, disabled, and success states for user actions.

## Navigation

- Use `next/link` for normal internal navigation.
- Before a programmatic `router.push` or `router.replace`, call `startNavigationProgress()` from `components/navigation-loader.tsx`.
- Do not add another page-level progress bar; the root layout owns global route loading feedback.

## Next.js And TypeScript

- Keep Server Components as the default. Add `"use client"` only when browser APIs, state, effects, or event handlers require it.
- Keep TypeScript strict and avoid `any`. Prefer existing domain types and utilities from `lib`.
- Put API handlers under `app/api` and validate request data before persistence.
- Mobile numbers must contain exactly 10 digits. Accept digits only, show a simple validation message, and enforce the same rule in both the form and API.
- Preserve authentication checks for admin routes and API endpoints.

## PWA

- Keep the web manifest, service worker, icons, and offline fallback functional.
- Do not cache authenticated admin HTML or private API responses in the service worker.
- Update the service-worker cache version when changing its precached files.

## Change Discipline

- Keep changes scoped to the requested behavior and preserve unrelated work in the repository.
- Development output uses `.next-dev` and production output uses `.next`. Do not configure them to share a build directory or run commands that override this separation.
- Run only one development server for this repository. Use `npm run dev`, which reserves port 3000 and fails instead of silently starting another compiler on a different port.
- Follow existing file organization and naming patterns before introducing a new abstraction.
- Add or update focused tests when the affected area has test infrastructure.
- Run `npm run build` after code changes. Resolve type, lint, and build errors before handing off.
- For visual changes, inspect the result at both desktop and mobile widths.
