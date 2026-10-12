import { lazy } from "react";
export const pageRoutes = [
  {
    path: "/customer/quick-pickup",
    Component: lazy(() => import("../pages/customer/quick-pickup/page")),
  },
  {
    path: "/admin/complaints",
    Component: lazy(() => import("../pages/admin/complaints/page")),
  },
  {
    path: "/admin/customers",
    Component: lazy(() => import("../pages/admin/customers/page")),
  },
  {
    path: "/admin/dashboard",
    Component: lazy(() => import("../pages/admin/dashboard/page")),
  },
  {
    path: "/admin/deliveries",
    Component: lazy(() => import("../pages/admin/deliveries/page")),
  },
  {
    path: "/admin/inventory",
    Component: lazy(() => import("../pages/admin/inventory/page")),
  },
  {
    path: "/admin/offers",
    Component: lazy(() => import("../pages/admin/offers/page")),
  },
  {
    path: "/admin/orders/:id",
    Component: lazy(() => import("../pages/admin/orders/[id]/page")),
  },
  {
    path: "/admin/orders/new",
    Component: lazy(() => import("../pages/admin/orders/new/page")),
  },
  {
    path: "/admin/orders",
    Component: lazy(() => import("../pages/admin/orders/page")),
  },
  { path: "/admin", Component: lazy(() => import("../pages/admin/page")) },
  {
    path: "/admin/payments",
    Component: lazy(() => import("../pages/admin/payments/page")),
  },
  {
    path: "/admin/pickups",
    Component: lazy(() => import("../pages/admin/pickups/page")),
  },
  {
    path: "/admin/rate-card/:id",
    Component: lazy(() => import("../pages/admin/rate-card/[id]/page")),
  },
  {
    path: "/admin/rate-card",
    Component: lazy(() => import("../pages/admin/rate-card/page")),
  },
  {
    path: "/admin/referrals",
    Component: lazy(() => import("../pages/admin/referrals/page")),
  },
  {
    path: "/admin/reports/:report",
    Component: lazy(() => import("../pages/admin/reports/[report]/page")),
  },
  {
    path: "/admin/reports",
    Component: lazy(() => import("../pages/admin/reports/page")),
  },
  {
    path: "/admin/reports/wallet",
    Component: lazy(() => import("../pages/admin/reports/wallet/page")),
  },
  {
    path: "/admin/riders/:id",
    Component: lazy(() => import("../pages/admin/riders/[id]/page")),
  },
  {
    path: "/admin/riders",
    Component: lazy(() => import("../pages/admin/riders/page")),
  },
  {
    path: "/admin/search",
    Component: lazy(() => import("../pages/admin/search/page")),
  },
  {
    path: "/admin/services/categories",
    Component: lazy(() => import("../pages/admin/services/categories/page")),
  },
  {
    path: "/admin/services/mapping",
    Component: lazy(() => import("../pages/admin/services/mapping/page")),
  },
  {
    path: "/admin/services",
    Component: lazy(() => import("../pages/admin/services/page")),
  },
  {
    path: "/admin/services/pricing",
    Component: lazy(() => import("../pages/admin/services/pricing/page")),
  },
  {
    path: "/admin/settings/basic-setup",
    Component: lazy(() => import("../pages/admin/settings/basic-setup/page")),
  },
  {
    path: "/admin/settings/charges",
    Component: lazy(() => import("../pages/admin/settings/charges/page")),
  },
  {
    path: "/admin/settings/discount-groups/new",
    Component: lazy(
      () => import("../pages/admin/settings/discount-groups/new/page"),
    ),
  },
  {
    path: "/admin/settings/discount-groups/:id/edit",
    Component: lazy(
      () => import("../pages/admin/settings/discount-groups/[id]/edit/page"),
    ),
  },
  {
    path: "/admin/settings/discount-groups/:id",
    Component: lazy(
      () => import("../pages/admin/settings/discount-groups/[id]/page"),
    ),
  },
  {
    path: "/admin/settings/discount-groups",
    Component: lazy(
      () => import("../pages/admin/settings/discount-groups/page"),
    ),
  },
  {
    path: "/admin/settings",
    Component: lazy(() => import("../pages/admin/settings/page")),
  },
  {
    path: "/admin/settings/profile",
    Component: lazy(() => import("../pages/admin/settings/profile/page")),
  },
  {
    path: "/admin/settings/role-permissions",
    Component: lazy(
      () => import("../pages/admin/settings/role-permissions/page"),
    ),
  },
  {
    path: "/admin/store/:id/edit",
    Component: lazy(() => import("../pages/admin/store/[id]/edit/page")),
  },
  {
    path: "/admin/store/:id",
    Component: lazy(() => import("../pages/admin/store/[id]/page")),
  },
  {
    path: "/admin/store/create",
    Component: lazy(() => import("../pages/admin/store/create/page")),
  },
  {
    path: "/admin/store",
    Component: lazy(() => import("../pages/admin/store/page")),
  },
  {
    path: "/customer/about",
    Component: lazy(() => import("../pages/customer/about/page")),
  },
  {
    path: "/customer/addresses/:id/edit",
    Component: lazy(() => import("../pages/customer/addresses/[id]/edit/page")),
  },
  {
    path: "/customer/addresses/new",
    Component: lazy(() => import("../pages/customer/addresses/new/page")),
  },
  {
    path: "/customer/addresses",
    Component: lazy(() => import("../pages/customer/addresses/page")),
  },
  {
    path: "/customer/cart",
    Component: lazy(() => import("../pages/customer/cart/page")),
  },
  {
    path: "/customer/calculator/:categoryId/:serviceId",
    Component: lazy(
      () =>
        import("../pages/customer/calculator/[categoryId]/[serviceId]/page"),
    ),
  },
  {
    path: "/customer/calculator",
    Component: lazy(() => import("../pages/customer/calculator/page")),
  },
  {
    path: "/customer/complaints",
    Component: lazy(() => import("../pages/customer/complaints/page")),
  },
  {
    path: "/customer/help",
    Component: lazy(() => import("../pages/customer/help/page")),
  },
  {
    path: "/customer/notifications",
    Component: lazy(() => import("../pages/customer/notifications/page")),
  },
  {
    path: "/customer/offers",
    Component: lazy(() => import("../pages/customer/offers/page")),
  },
  {
    path: "/customer/packages",
    Component: lazy(() => import("../pages/customer/packages/page")),
  },
  {
    path: "/customer/order-success",
    Component: lazy(() => import("../pages/customer/order-success/page")),
  },
  {
    path: "/customer/orders/:id",
    Component: lazy(() => import("../pages/customer/orders/[id]/page")),
  },
  {
    path: "/customer/orders",
    Component: lazy(() => import("../pages/customer/orders/page")),
  },
  {
    path: "/customer",
    Component: lazy(() => import("../pages/customer/page")),
  },
  {
    path: "/customer/payment",
    Component: lazy(() => import("../pages/customer/payment/page")),
  },
  {
    path: "/customer/privacy",
    Component: lazy(() => import("../pages/customer/privacy/page")),
  },
  {
    path: "/customer/profile",
    Component: lazy(() => import("../pages/customer/profile/page")),
  },
  {
    path: "/customer/refer",
    Component: lazy(() => import("../pages/customer/refer/page")),
  },
  {
    path: "/customer/schedule",
    Component: lazy(() => import("../pages/customer/schedule/page")),
  },
  {
    path: "/customer/services/:slug",
    Component: lazy(() => import("../pages/customer/services/[slug]/page")),
  },
  {
    path: "/customer/services",
    Component: lazy(() => import("../pages/customer/services/page")),
  },
  {
    path: "/customer/settings",
    Component: lazy(() => import("../pages/customer/settings/page")),
  },
  {
    path: "/customer/subscription",
    Component: lazy(() => import("../pages/customer/subscription/page")),
  },
  {
    path: "/customer/terms",
    Component: lazy(() => import("../pages/customer/terms/page")),
  },
  {
    path: "/customer/track",
    Component: lazy(() => import("../pages/customer/track/page")),
  },
  {
    path: "/customer/wallet/add",
    Component: lazy(() => import("../pages/customer/wallet/add/page")),
  },
  {
    path: "/customer/wallet",
    Component: lazy(() => import("../pages/customer/wallet/page")),
  },
  {
    path: "/forgot-password",
    Component: lazy(() => import("../pages/forgot-password/page")),
  },
  {
    path: "/onboarding",
    Component: lazy(() => import("../pages/onboarding/page")),
  },
  { path: "/", Component: lazy(() => import("../pages/page")) },
  {
    path: "/permissions",
    Component: lazy(() => import("../pages/permissions/page")),
  },
  {
    path: "/register",
    Component: lazy(() => import("../pages/register/page")),
  },
  { path: "/welcome", Component: lazy(() => import("../pages/welcome/page")) },
];
