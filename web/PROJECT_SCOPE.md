# MyDhobi — Full Project Scope

## 1. Document control

| Field | Value |
| --- | --- |
| Product | MyDhobi / MyDhobi Admin |
| Product type | Laundry and dry-cleaning operations platform |
| Scope baseline | 5 August 2026 |
| Repository | `web` |
| Status | Active product baseline and delivery scope |
| Primary users | Admins, operations staff, store teams, riders, customers |
| Primary runtime | Next.js web application with PostgreSQL |

This document is the product and delivery scope for the MyDhobi web project. It describes the product purpose, users, workflows, functional modules, technical boundaries, quality requirements, and acceptance criteria. The existing codebase is the baseline for what is already available; requirements marked as future work must not be assumed to be implemented.

## 2. Product definition

MyDhobi is an operational platform for running a laundry and dry-cleaning business. It connects customer ordering with the daily work of stores, staff, riders, and administrators.

The product must help a team answer these questions quickly:

- Which orders need attention now?
- What must be picked up or delivered today?
- Who is handling each job?
- Which payments are pending, paid, failed, or refunded?
- Which customers, services, stock items, and stores need an update?
- What is the business performance for a selected period?

The platform is an operations tool, not a marketing website. Screens must be compact, practical, easy to scan, and usable by people with limited software experience.

## 3. Product goals

### 3.1 Business goals

1. Provide one source of truth for laundry orders and their operational status.
2. Reduce missed pickups, delayed deliveries, unassigned rider jobs, and unresolved complaints.
3. Give administrators control over stores, customers, riders, services, stock, payments, offers, and reports.
4. Give customers a simple way to browse services, place orders, pay, track progress, and request help.
5. Support repeat daily work on desktop and mobile devices.
6. Preserve a clear history of important order, payment, wallet, and complaint changes.

### 3.2 User outcomes

| User | Successful outcome |
| --- | --- |
| Admin | Can manage the full business and control staff access. |
| Staff or store team | Can complete assigned daily work without seeing unnecessary settings. |
| Rider | Can be assigned pickup and delivery work with clear customer and address details. |
| Customer | Can book a service, know what happens next, and see order and payment updates. |
| Business owner | Can review revenue, orders, customer activity, service performance, and operational issues. |

## 4. Users and access model

### 4.1 Application roles

The application has four authenticated account roles:

- **Admin**: full operational access, setup access, profile management, and role-permission management.
- **Staff**: admin operations access according to assigned page permissions.
- **Store manager**: login access for one assigned store with store-scoped operational control, without business-owner, developer, or super-admin access.
- **Customer**: customer portal access only. Customers must not access admin or developer routes.

Store team members and riders are operational records. They may be assigned to work without necessarily having a separate login experience in this web application.

### 4.2 Access rules

- Unauthenticated users can access the sign-in and public account entry screens.
- Admin and staff users can access `/admin` according to their role and page access.
- Customers are redirected to `/customer` and must not access admin or developer pages.
- Admin-only actions include role and permission management.
- Store managers can only access their assigned store's operational records. They can use store operations, customer, rider, stock, payment, complaint, and report workflows that are enabled for their store, but cannot open global setup, business-wide store management, role permissions, or developer pages.
- Store managers cannot create another manager, create an admin, change a team member to manager/admin access, or grant admin-level permissions.
- All protected API handlers must verify the current authenticated user server-side.
- Hiding a navigation item is not sufficient access control; the API and page must also enforce authorization.

### 4.3 Permission areas

The permission model covers these page groups:

| Group | Pages |
| --- | --- |
| Daily Work | Dashboard, Orders, Pickups, Deliveries, Complaints |
| People and Stores | Stores, Customers, Riders |
| Services and Stock | Services, Inventory |
| Money and Growth | Payments, Offers, Referrals |
| Reports and Setup | Reports, Basic Setup |

### 4.4 Store manager capability scope

The target store-manager workspace is strong enough for daily store operations while remaining store-scoped:

| Area | Allowed work |
| --- | --- |
| Dashboard | Today's orders, pending pickups and deliveries, delayed and warehouse orders, unpaid invoices, daily revenue, rider availability, complaints, and low stock. |
| Customers | Create customers, edit basic details and addresses, view order history and balances, add internal notes, manage packages or loyalty enrolment, and block COD under policy. |
| Orders | Create walk-in, telephone, or WhatsApp orders; edit pre-processing orders; change garments and services; record stains, damage, photographs, instructions, final counts, estimates, invoices, receipts, tags, reschedules, eligible cancellations, holds, urgency, rewash, losses, damage, and completion. |
| Riders | View store riders, assign and reassign pickup or delivery work, view status and location, change sequence, handle failed jobs, record and reconcile cash, and manage store shifts. |
| Warehouse | Select the warehouse, create and close dispatch manifests, send and receive orders, view processing, report missing garments, request rewash, perform output QC, and mark garments ready for packing. |
| Billing | Accept cash, UPI, card, and wallet payments; record partial payments and references; issue or share invoices; apply approved coupons and configured discounts; reconcile daily transactions and view store settlements. |
| Complaints | Create, respond to, rewash, redeliver, credit within the configured limit, escalate, and close store complaints. |
| Reports | View only store-level daily sales, orders, service sales, payment methods, pending payments, pickup and delivery performance, rider performance, warehouse turnaround, cancellations/refunds, rewash, discounts, cash closing, and retention. |
| Store staff | View assigned staff, assign duties, temporarily activate or deactivate staff, view attendance and shifts, reset counter PINs, and assign riders to shifts. |

The current web release exposes the implemented store-scoped dashboard, orders, customers, pickups, deliveries, inventory, riders, payments, complaints, reports, and profile surfaces. Warehouse manifests, advanced invoice/garment capture, staff attendance, counter PINs, settlements, loyalty, and retention reporting remain product-scope items until their dedicated data workflows are added.

## 5. Product surfaces

### 5.1 Authentication and entry

The entry experience includes:

- Sign in using a 10-digit mobile number and password.
- Customer account registration with name, mobile number, and password.
- Session creation using an HTTP-only JWT cookie.
- Sign out and session invalidation.
- Redirects to the correct portal based on account role.
- Account, onboarding, welcome, and recovery entry points where supported by the current UI.

The current implementation includes placeholder or transitional entry routes such as OTP verification and permissions onboarding. These routes must remain safe and must not imply a completed OTP or self-service permission workflow until the supporting service exists.

### 5.2 Admin operations console

The admin console is the primary work area for the business.

| Module | Route(s) | Scope |
| --- | --- | --- |
| Dashboard | `/admin`, `/admin/dashboard` | Operational summary, status counts, trends, recent orders, and attention items. |
| Global search | `/admin/search` | Search across orders, customers, and stores with links to the relevant record. |
| Orders | `/admin/orders`, `/admin/orders/[id]` | List, inspect, filter, and update customer orders through allowed lifecycle states. |
| Pickups | `/admin/pickups` | View scheduled pickup tasks, assign riders, update task status, reschedule, and add notes. |
| Deliveries | `/admin/deliveries` | View delivery tasks, assign riders, update status, reschedule, and add notes. |
| Payments | `/admin/payments` | Review payment records and totals; update supported payment states; process supported refunds. |
| Customers | `/admin/customers` | Manage customer records, contact details, address and service preferences, status, and wallet adjustments. |
| Stores | `/admin/store`, `/admin/store/create`, `/admin/store/[id]`, `/admin/store/[id]/edit` | Create, view, edit, activate, deactivate, and delete stores; manage store team members and manager login access. |
| Riders | `/admin/riders`, `/admin/riders/[id]` | Create, view, update, and review riders and their pickup/delivery jobs. |
| Services | `/admin/services`, `/admin/services/categories`, `/admin/services/pricing`, `/admin/rate-card` | Manage service categories, catalog services, units, prices, express prices, turnaround, and display order. |
| Inventory | `/admin/inventory` | Manage stock items, quantities, thresholds, suppliers, pricing, warehouse locations, expiry details, batches, and status. |
| Complaints | `/admin/complaints` | Review customer complaints, change status, send a response, and resolve issues. |
| Offers | `/admin/offers` | Create, edit, activate/deactivate, validate, and delete promotional offers or coupon codes. |
| Referrals | `/admin/referrals` | Review referral activity and rewards. |
| Reports | `/admin/reports`, `/admin/reports/[report]`, `/admin/reports/wallet` | View summary and operational reports, choose supported date ranges, and export the order report as CSV. |
| Basic setup | `/admin/settings/basic-setup` | Manage states, cities, inventory categories, inventory units, and configurable setup roles. |
| Role permissions | `/admin/settings/role-permissions` | Assign available admin page permissions to setup roles; admin-only. |
| Profile | `/admin/settings/profile` | Update the signed-in admin or staff member profile and password. |

The admin header also provides route progress feedback, search, operational alerts, profile actions, and responsive navigation. The sidebar is configurable through the developer surface.

### 5.3 Customer portal

The customer portal is a mobile-friendly booking and account experience.

| Module | Route(s) | Scope |
| --- | --- | --- |
| Home | `/customer` | Show available services, current order activity, wallet or account highlights, and useful shortcuts. |
| Service catalog | `/customer/services`, `/customer/services/[slug]` | Browse service categories and service details with prices and item selection. |
| Schedule pickup | `/customer/schedule` | Select pickup details, address, date/time, and instructions. |
| Cart and checkout | `/customer/cart`, `/customer/payment` | Review selected items, apply a valid offer or referral benefit, choose payment method, and place the order. |
| Order confirmation | `/customer/order-success` | Confirm that an order was created and link to its details. |
| Orders | `/customer/orders`, `/customer/orders/[id]` | View previous and current orders, items, amount, payment state, and timeline. |
| Tracking | `/customer/track` | See current order progress in a simple status view. |
| Addresses | `/customer/addresses`, `/customer/addresses/new`, `/customer/addresses/[id]/edit` | Add, edit, delete, and choose a default address. |
| Wallet | `/customer/wallet`, `/customer/wallet/add` | View balance and transaction history; add supported wallet funds. |
| Complaints | `/customer/complaints` | Create and view complaints and read admin responses. |
| Offers | `/customer/offers` | View customer-available offers and apply eligible discounts at checkout. |
| Referrals | `/customer/refer` | Share a referral code, redeem a code, and view referral progress or rewards. |
| Profile and settings | `/customer/profile`, `/customer/settings` | Update profile and customer preferences. |
| Help and legal | `/customer/help`, `/customer/about`, `/customer/terms`, `/customer/privacy` | Provide support, product information, terms, and privacy pages. |
| Notifications | `/customer/notifications` | View and mark in-app notifications as read. |

## 6. Core business workflows

### 6.1 Customer booking workflow

1. Customer signs in or creates an account.
2. Customer browses the active service catalog.
3. Customer selects a service and adds items with quantities.
4. Customer selects or creates an address.
5. Customer selects a pickup time and adds optional instructions.
6. Customer applies a valid coupon or eligible referral discount.
7. Customer chooses cash, wallet, or another supported payment method.
8. The system validates the cart, amount, address, offer, and wallet balance where relevant.
9. The system creates the order, order items, initial status history, payment record, and confirmation notification as one logical operation.
10. Customer sees the confirmation and can track the order.

### 6.2 Order lifecycle

The canonical order statuses are:

`New` → `Picked Up` → `In Cleaning` → `Ready` → `Out for Delivery` → `Delivered`

`Cancelled` is available only from the allowed early stages. The system must reject invalid status jumps and must record status history with an optional note.

Rules:

- `New` can move to `Picked Up` or `Cancelled`.
- `Picked Up` can move to `In Cleaning` or `Cancelled`.
- `In Cleaning` can move to `Ready` or `Cancelled`.
- `Ready` can move to `Out for Delivery` or `Cancelled`.
- `Out for Delivery` can move to `Delivered`.
- `Delivered` and `Cancelled` are terminal states.

### 6.3 Pickup workflow

Pickup task statuses are:

`Scheduled` → `Assigned` → `Out for Pickup` → `Completed`

Any active pickup can move to `Failed`; a failed pickup can be returned to `Scheduled` for another attempt. Assignment of a rider should automatically move a scheduled task to `Assigned` where appropriate. Pickup data includes customer contact, address, service, scheduled time, rider, and notes.

### 6.4 Delivery workflow

Delivery task statuses are:

`Ready` → `Assigned` → `Out for Delivery` → `Delivered`

An active delivery can move to `Failed`; a failed delivery can return to `Ready`. A rider is required before assignment, out-for-delivery, or delivered states. Delivery data includes customer contact, address, amount, payment state, scheduled time, rider, and notes.

### 6.5 Payment and wallet workflow

Payment statuses are `Pending`, `Paid`, `Failed`, and `Refunded`.

- Pending payments may be marked paid or failed.
- Paid order payments may be refunded where supported.
- A supported refund updates the order/payment state and credits the customer wallet.
- Wallet top-ups and order charges must be represented in the wallet transaction history.
- Wallet balance cannot become negative.
- Admin wallet adjustments must record the amount, note, source, creator, and resulting balance.
- Payment and wallet mutations must use database transactions and row locking where the balance or payment may be changed concurrently.

### 6.6 Complaint workflow

Complaint statuses are `Open`, `In Progress`, and `Resolved`.

- Customers can create a complaint and view its response.
- Admin or staff can update the status and add a response.
- A complaint cannot be resolved without a response.
- A status change or response creates an in-app customer notification.

### 6.7 Offer and referral workflow

- Admins create offers with a code, discount rules, active dates, usage limits, and active state.
- Customers see only offers eligible for customer use.
- Checkout validates the code against subtotal and validity rules before creating the order.
- A pending referral benefit may be selected in place of a coupon when it provides the greater supported discount.
- A successful referral is marked rewarded only after the qualifying order is created.

## 7. Functional requirements

### 7.1 Authentication and account requirements

- Mobile input accepts digits only and must contain exactly 10 digits.
- The same mobile validation rule applies in the browser and API.
- Passwords must be stored as hashes, never plain text.
- Session cookies must be HTTP-only, same-site, scoped to the application, and secure in production.
- Disabled users cannot sign in or continue using an existing session.
- Sign-in errors must use simple, non-technical language.
- Account updates must refresh the session when identity fields change.

### 7.2 Admin requirements

- Every list screen must show loading, empty, error, and success states.
- Tables and filters must remain usable on narrow screens.
- Destructive actions require confirmation and must show the result.
- Status changes must be limited to valid transitions.
- Form data must be normalized and validated before database writes.
- Duplicate values such as mobile numbers, service names, offer codes, and store emails must return clear conflict messages.
- Admin screens must use shared UI components and existing admin visual patterns.

### 7.3 Customer requirements

- Customers must never see another customer’s address, order, payment, wallet, complaint, or notification data.
- Store managers must never see or update orders, tasks, complaints, or payments belonging to another store.
- Customer order creation must validate ownership of the selected address and sufficient wallet balance.
- Cart data may be retained locally for convenience but the API remains the authority for final price and eligibility checks.
- Customer-facing labels must use short, familiar words and clear status labels.
- The portal must work well at mobile widths without clipped controls or horizontal overflow.

### 7.4 Data requirements

The platform must support the following core records:

| Domain | Records and responsibilities |
| --- | --- |
| Identity | `app_users`, roles, statuses, credentials, session identity. |
| Customers | Customer profile, contact details, address preferences, payment preferences, credit settings, internal notes. |
| Stores | Store profile, address, contact details, operating information, status, team members, and linked manager login. |
| Services | Service categories, catalog services, units, regular and express prices, turnaround, active state, display order. |
| Orders | Order header, items, pickup/delivery schedule, amount, discount, payment method/state, address snapshot, instructions. |
| Operations | Pickup tasks, delivery tasks, riders, task assignment, notes, timestamps, failure and completion state. |
| Money | Payments, wallet balances, wallet transactions, refunds, references, reports. |
| Support | Complaints, responses, statuses, resolution timestamps, notifications. |
| Growth | Offers, usage counts, referral profiles, referral records, rewards. |
| Stock | Inventory items, stock levels, reorder thresholds, suppliers, price, location, expiry and batch information. |
| Setup | States, cities, inventory categories, inventory units, configurable roles, role page permissions, sidebar settings. |

## 8. Technical scope

### 8.1 Application stack

- Next.js 15 App Router.
- React 19 and TypeScript in strict mode.
- Tailwind CSS with existing shared UI components.
- Lucide icons and existing admin/customer components.
- PostgreSQL accessed through the `pg` connection pool.
- `bcryptjs` for password hashing.
- `jose` for signed JWT sessions.
- Recharts for dashboard and report visualizations.
- Sonner for user feedback messages.
- PWA manifest, icons, service worker, and offline fallback.

### 8.2 Application structure

- `app/`: routes, layouts, API handlers, and entry pages.
- `components/admin`: admin shell, pages, tables, forms, reports, and operational views.
- `components/customer`: customer portal views, checkout, tracking, profile, and utility screens.
- `components/ui`: reusable controls and primitives.
- `components/auth`: sign-in and account shell components.
- `lib/`: database access, domain logic, validation, lifecycle rules, reporting, and shared types.
- `public/`: product images, icons, manifest, service worker, and offline page.

Server Components should remain the default. Client Components are appropriate only where browser state, local storage, effects, or event handlers are needed.

### 8.3 API boundaries

API handlers are grouped by responsibility:

- `/api/auth/*`: login, registration, logout, and current-user session checks.
- `/api/admin/*`: admin dashboard data, orders, pickups, deliveries, payments, complaints, offers, referrals, riders, reports, services, alerts, and profile.
- `/api/customer/*`: catalog, home, orders, addresses, wallet, complaints, profile, settings, offers, referrals, notifications, and portal data.
- `/api/customers/*`: admin customer records and customer wallet administration.
- `/api/stores/*`: stores and store team members.
- `/api/inventory/*`: inventory records.
- `/api/settings/*`: setup data and role permissions.
- `/api/developer/*`: developer-only sidebar configuration.

Normal internal navigation must use `next/link`. Programmatic route changes must call `startNavigationProgress()` first. The root layout owns the global navigation progress indicator.

### 8.4 Database approach

The current project creates or updates supporting tables through idempotent schema setup functions in `lib`. Any future schema change must:

- Be safe to run more than once.
- Preserve existing records.
- Use explicit constraints and indexes for important lookup paths.
- Validate and normalize values before persistence.
- Use a transaction for multi-record business operations.
- Be documented if it changes an existing field, status, or relationship.

A dedicated migration strategy should be introduced before production deployments with frequent schema changes. Runtime schema creation is acceptable for the current development baseline but should not become the long-term deployment mechanism without review.

## 9. Non-functional requirements

### 9.1 Usability

- Use short, familiar words and direct action labels.
- Do not place descriptive subtitles directly under page, section, card, modal, or form headings.
- Do not repeat a page title inside a page when the admin header already shows it.
- Pair status colors and icons with text; do not rely on color alone.
- Keep repeated daily workflows compact and scan-friendly.
- Preserve the established visual language, spacing, radii, typography, and control heights.

### 9.2 Responsive behavior

- Support desktop admin work and mobile customer use.
- Test at both desktop and mobile widths for every visual change.
- Avoid clipped text, overlapping actions, hidden required fields, and horizontal overflow.
- Ensure tables have a usable narrow-screen treatment such as wrapping, scrolling within a bounded region, or a compact row layout.

### 9.3 Accessibility

- All form fields must have accessible labels.
- Icon-only controls must have an accessible label and a tooltip where the meaning is not obvious.
- Keyboard focus must remain visible.
- Dialogs, menus, drawers, and status messages must be usable with keyboard and assistive technology.
- Validation errors must be associated with the relevant field or clearly announced.
- Color must not be the only way to understand status or action state.

### 9.4 Reliability and consistency

- Show loading state while data is being fetched or saved.
- Show a useful empty state when there is no data.
- Show a recoverable error state when a request fails.
- Disable or guard submit actions while a save is in progress.
- Prevent duplicate order, payment, wallet, and referral mutations on retries.
- Keep source records and derived operational records synchronized.

### 9.5 Performance

- Fetch independent dashboard and report data in parallel where possible.
- Keep large list queries bounded and indexed.
- Avoid loading private admin HTML or API responses into the service-worker cache.
- Keep client-side state limited to interactive screens and short-lived UI needs.

## 10. Security and privacy scope

- Enforce authentication in middleware and again in server handlers.
- Enforce role and page permissions for protected admin actions.
- Scope every customer query by the authenticated customer ID.
- Validate path parameters before database queries.
- Use parameterized SQL queries only.
- Hash passwords with a suitable work factor.
- Keep JWT secrets and database credentials in environment variables.
- Do not log passwords, session tokens, payment secrets, or private customer information.
- Use secure cookies in production and do not expose session data to client JavaScript.
- Protect account deletion, refunds, wallet adjustments, offer deletion, store deletion, and other destructive actions with confirmation and authorization.
- Minimize customer information shown to staff based on the operational need.
- Provide and maintain customer terms and privacy pages before public launch.

## 11. PWA and offline scope

The application must retain a functional installable web-app experience:

- Keep the manifest, icons, maskable icon, and Apple touch icon valid.
- Keep the service worker registration and offline fallback working.
- Precache only public static assets and the offline page.
- Do not cache authenticated admin HTML or private API responses.
- Use network-first behavior for navigation and suitable caching for public static assets.
- Increment the service-worker cache version whenever precached files change.
- Treat offline mode as a read-only fallback unless an explicit, conflict-safe offline write design is added later.

## 12. Integrations and external dependencies

### Current dependencies

- PostgreSQL database through `DATABASE_URL`.
- `JWT_SECRET` with a minimum length of 32 characters.
- Optional `DATABASE_SSL=true` for database SSL configuration.
- Node.js runtime for database, authentication, and API handlers.

### Future integrations requiring separate approval and scope

The current repository does not define a production integration for:

- Payment gateways or payment verification webhooks.
- SMS, WhatsApp, email, or push notification delivery.
- Maps, geocoding, route optimization, or live rider location.
- Image/file storage for customer order evidence or inventory documents.
- Accounting, invoicing, GST, ERP, or external CRM systems.
- A dedicated rider mobile application.
- Multi-tenant organization billing or franchise settlement.

Adding any of these requires an integration design, credentials and environment plan, failure handling, privacy review, and a separate acceptance checklist.

## 13. Explicitly out of scope for this baseline

- Marketing pages, public SEO content, or a promotional landing-site redesign.
- Automated real-world pickup or delivery fulfillment without staff or rider updates.
- Guaranteed live location tracking.
- Automatic payment settlement without a verified payment provider integration.
- Payroll, rider attendance, or fleet management.
- Full manufacturing or production-floor workflow beyond order status and stock records.
- Accounting ledger reconciliation beyond the application payment and wallet records.
- Customer-to-customer communication or public reviews.
- Offline creation or editing of orders and payments.
- Replacing the established MyDhobi visual language with a new design system.

## 14. Acceptance criteria

The project is ready for a release candidate when all of the following are true:

### Product behavior

- [ ] Admin and customer users are routed to the correct portal after sign-in.
- [ ] Unauthorized users cannot access protected pages or APIs.
- [ ] Customer registration, sign-in, sign-out, profile update, and account ownership checks work.
- [ ] Customers can browse active services, create a cart, select an address, schedule pickup, choose payment, and place an order.
- [ ] Orders show the correct lifecycle and reject invalid transitions.
- [ ] Pickup and delivery tasks can be assigned, updated, rescheduled, failed, retried, and completed according to their rules.
- [ ] Payments, refunds, wallet charges, wallet top-ups, and balance adjustments remain consistent.
- [ ] Customers and staff can create, update, respond to, and resolve complaints with the required notifications.
- [ ] Offers and referral benefits validate correctly and cannot be reused outside their rules.
- [ ] Admins can manage stores, store teams, riders, customers, services, categories, pricing, inventory, and setup data.
- [ ] Reports show correct supported date ranges and the order report export downloads valid CSV data.
- [ ] Admin role permissions are enforced both in navigation and at the API boundary.
- [ ] A store manager can be created from a store team record with a password, sign in with the assigned mobile number, and reach the admin operations console.
- [ ] Store manager navigation and APIs are limited to the assigned store and allowed operational pages.
- [ ] Store managers can use the enabled store-scoped customer, stock, rider, payment, complaint, and report workflows.
- [ ] Store managers cannot create another manager, create an admin, or change any team member to manager/admin access.

### Quality

- [ ] Loading, empty, error, disabled, and success states are present for user actions.
- [ ] Mobile and desktop layouts have been inspected for all changed screens.
- [ ] Forms use labels, clear validation, and accessible error messages.
- [ ] Mobile numbers accept digits only and require exactly 10 digits in both UI and API.
- [ ] No customer can access another customer’s private records.
- [ ] No authenticated HTML or private API response is cached by the service worker.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes using the production build directory `.next`.
- [ ] Development continues to use `.next-dev` and only one development server is run on port 3000.

## 15. Verification plan

Every material change should be verified at the level appropriate to its risk:

1. Run focused type, lint, or component checks for the changed area.
2. Exercise the relevant API with unauthenticated, wrong-role, invalid-input, not-found, duplicate, and success cases.
3. Exercise the happy path and failure path for the affected workflow.
4. Check mobile and desktop layouts when UI is changed.
5. Run `npm run lint`.
6. Run `npm run build`.
7. Confirm `git diff` contains only the intended change and does not alter unrelated user work.

## 16. Delivery phases

### Phase 1 — Platform foundation

- Authentication, sessions, role routing, database connection, shared UI, layouts, and PWA shell.
- Core customer records, service catalog, addresses, orders, and order history.

### Phase 2 — Daily operations

- Admin dashboard, order operations, pickup and delivery queues, riders, alerts, complaints, and notifications.

### Phase 3 — Commercial operations

- Payments, wallet, refunds, offers, referrals, customer management, stores, and store teams.

### Phase 4 — Control and insight

- Inventory, rate card and catalog setup, locations, roles, page permissions, reports, CSV export, and configurable sidebar.

### Phase 5 — Production hardening

- Migration strategy, monitoring, backups, rate limiting, audit history review, integration readiness, accessibility review, and release runbook.

## 17. Risks and decisions to track

| Risk or decision | Required follow-up |
| --- | --- |
| Runtime schema setup can make production deployments harder to audit. | Introduce versioned database migrations before frequent production releases. |
| Payment records currently model application state, not external gateway settlement. | Select a provider and define webhook, reconciliation, refund, and failure behavior. |
| Rider work is managed from the admin console. | Decide whether a dedicated rider experience is needed. |
| Notification records are in-app records. | Decide which external channels are required and obtain consent and provider credentials. |
| Staff role permissions are page-based. | Decide whether field-level or action-level permissions are needed. |
| Inventory supports stock records and thresholds. | Define whether stock must be consumed automatically by service orders. |
| Customer address and order data has operational sensitivity. | Confirm retention, deletion, export, and audit requirements. |
| Current public entry routes include transitional onboarding and OTP pages. | Finalize the customer acquisition and verification flow before public launch. |

## 18. Definition of done

A feature is complete only when its user flow, API behavior, authorization, validation, persistence, error states, responsive layout, accessibility labels, and documentation are complete. A feature that works only on the happy path or only because its navigation item is hidden is not complete.

The project is complete for this baseline when the implemented product matches this document, all acceptance criteria pass, production dependencies are configured, and the remaining future integrations are explicitly approved as separate work.
