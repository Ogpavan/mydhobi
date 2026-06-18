# Cleanly Laundry Service

A production-ready Next.js App Router starter for a premium laundry service web app inspired by a modern mobile laundry UI. It includes responsive customer pages, admin CRM screens, shadcn/ui-style primitives, mock data, and typed API routes that can later be connected to a database.

## Tech Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- shadcn/ui-style components with Radix primitives
- Plus Jakarta Sans from Google Fonts
- lucide-react icons
- TanStack Query, Zustand, React Hook Form, Zod, date-fns, Sonner

## Routes

Customer app:

- `/` landing/onboarding homepage
- `/login` mobile number login
- `/dashboard` customer dashboard
- `/book` laundry booking flow
- `/orders` order listing and filters
- `/orders/[id]` order detail and timeline
- `/profile` customer profile

Admin app:

- `/admin` admin dashboard
- `/admin/orders` order management
- `/admin/customers` customer management
- `/admin/services` service and pricing management
- `/admin/riders` pickup/delivery staff management

API routes:

- `GET /api/services`
- `GET /api/orders`
- `POST /api/orders`
- `GET /api/orders/[id]`
- `PATCH /api/orders/[id]`
- `GET /api/customers`
- `POST /api/auth/login`
- `GET /api/dashboard/stats`

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm run lint
npm run build
```

Mock data lives in `src/lib/mock-data.ts`. API handlers are structured so persistence can be swapped in later without changing the frontend route contract.
