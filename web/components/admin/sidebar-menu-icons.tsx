import type { ReactNode, SVGProps } from "react";

type SidebarMenuIconProps = SVGProps<SVGSVGElement>;

function IconBase({
  children,
  ...props
}: SidebarMenuIconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function DashboardMenuIcon(props: SidebarMenuIconProps) {
  return (
    <IconBase {...props}>
      <rect x="3.3" y="4" width="7.2" height="7.2" rx="1.4" fill="#DBEAFE" />
      <rect x="13.5" y="4" width="7.2" height="5" rx="1.4" fill="#CCFBF1" />
      <rect x="3.3" y="14" width="7.2" height="6.2" rx="1.4" fill="#BFDBFE" />
      <path
        d="M14.2 18.2l2.2-2.6 1.8 1.6 2.2-3.7"
        stroke="#2563EB"
        strokeWidth="2"
      />
      <path d="M16.2 15.6l1.8 1.6" stroke="#14B8A6" strokeWidth="2" />
    </IconBase>
  );
}

export function OrdersMenuIcon(props: SidebarMenuIconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 7.4l7-3.5 7 3.5-7 3.6-7-3.6Z" fill="#FDE68A" />
      <path d="M5 7.4v8.4l7 4 7-4V7.4" fill="#FEF3C7" />
      <path d="M12 11v8.8" stroke="#D97706" strokeWidth="1.8" />
      <path d="M5 7.4l7 3.6 7-3.6" stroke="#D97706" strokeWidth="1.8" />
      <path d="M15.1 15l1.2 1.2 2.5-2.9" stroke="#16A34A" strokeWidth="2" />
    </IconBase>
  );
}

export function CustomersMenuIcon(props: SidebarMenuIconProps) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="8.4" r="3.2" fill="#BFDBFE" />
      <path d="M3.6 19.6c.8-3.5 2.7-5.2 5.4-5.2s4.6 1.7 5.4 5.2H3.6Z" fill="#2563EB" />
      <circle cx="16" cy="9.5" r="2.7" fill="#CCFBF1" />
      <path d="M14.6 19.6c.5-2.6 2.1-4.1 4.7-4.6 1.1 1.1 1.8 2.6 2.1 4.6h-6.8Z" fill="#14B8A6" />
    </IconBase>
  );
}

export function PickupsMenuIcon(props: SidebarMenuIconProps) {
  return (
    <IconBase {...props}>
      <rect x="3.4" y="7" width="10.2" height="8.2" rx="1.2" fill="#DBEAFE" />
      <path d="M13.6 9.4h3.1l3.7 3.7v2.1h-6.8V9.4Z" fill="#BFDBFE" />
      <circle cx="7" cy="17" r="2.1" fill="#0F172A" />
      <circle cx="17.2" cy="17" r="2.1" fill="#0F172A" />
      <circle cx="7" cy="17" r="0.8" fill="#FFFFFF" />
      <circle cx="17.2" cy="17" r="0.8" fill="#FFFFFF" />
      <path d="M8.6 12.7V8.9" stroke="#2563EB" strokeWidth="1.9" />
      <path d="M7.1 10.4l1.5-1.5 1.5 1.5" stroke="#2563EB" strokeWidth="1.9" />
    </IconBase>
  );
}

export function DeliveriesMenuIcon(props: SidebarMenuIconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M12 21s6.5-5.3 6.5-11A6.5 6.5 0 0 0 5.5 10c0 5.7 6.5 11 6.5 11Z"
        fill="#FEE2E2"
        stroke="#EF4444"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="10.4" r="3.9" fill="#FFFFFF" />
      <path d="M9.7 10.4l1.6 1.6 3.1-3.4" stroke="#16A34A" strokeWidth="2" />
    </IconBase>
  );
}

export function RateCardMenuIcon(props: SidebarMenuIconProps) {
  return (
    <IconBase {...props}>
      <rect x="4" y="5" width="16" height="14" rx="2" fill="#ECFEFF" />
      <path d="M4 8.8h16" stroke="#06B6D4" strokeWidth="1.7" />
      <path d="M8 11.2h6.8" stroke="#0F172A" strokeWidth="1.7" />
      <path d="M8 13.6h6.8" stroke="#0F172A" strokeWidth="1.7" />
      <path d="M8 11.2c3.7 0 3.7 5 0 5h1.3l4.2 3.1" stroke="#2563EB" strokeWidth="1.8" />
      <path d="M17.1 12.2h1.2M17.1 15.2h1.2" stroke="#14B8A6" strokeWidth="1.8" />
    </IconBase>
  );
}

export function RidersMenuIcon(props: SidebarMenuIconProps) {
  return (
    <IconBase {...props}>
      <circle cx="7" cy="17" r="2.6" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.7" />
      <circle cx="17" cy="17" r="2.6" fill="#CCFBF1" stroke="#14B8A6" strokeWidth="1.7" />
      <path d="M7 17l3.2-6h3.2l3.6 6" stroke="#0F172A" strokeWidth="1.8" />
      <path d="M10.2 11l-1.4-2.4H6.7" stroke="#2563EB" strokeWidth="1.8" />
      <path d="M13.4 11l2.1-2.6h2.2" stroke="#14B8A6" strokeWidth="1.8" />
      <path d="M11.4 8.4h2.4" stroke="#0F172A" strokeWidth="1.8" />
    </IconBase>
  );
}

export function PaymentsMenuIcon(props: SidebarMenuIconProps) {
  return (
    <IconBase {...props}>
      <path d="M4.5 8.5h13.3a2 2 0 0 1 2 2v6.2a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2V8.5Z" fill="#DCFCE7" />
      <path d="M5.4 8.5l2-3.2h9.4l1.8 3.2" fill="#BBF7D0" />
      <path d="M15.8 12.5h4v3.2h-4.2c-.9 0-1.6-.7-1.6-1.6s.8-1.6 1.8-1.6Z" fill="#14B8A6" />
      <circle cx="16.1" cy="14.1" r="0.7" fill="#FFFFFF" />
      <path d="M8.3 11.3h4.5" stroke="#166534" strokeWidth="1.7" />
      <path d="M8.3 13.6h4.5" stroke="#166534" strokeWidth="1.7" />
      <path d="M8.3 11.3c2.7 0 2.7 3.5 0 3.5h1l3 2.8" stroke="#2563EB" strokeWidth="1.7" />
    </IconBase>
  );
}

export function ReportsMenuIcon(props: SidebarMenuIconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 19V5" stroke="#64748B" strokeWidth="1.8" />
      <path d="M5 19h15" stroke="#64748B" strokeWidth="1.8" />
      <rect x="8" y="11" width="3" height="5" rx="0.8" fill="#2563EB" />
      <rect x="12.6" y="7" width="3" height="9" rx="0.8" fill="#14B8A6" />
      <rect x="17.2" y="9.6" width="3" height="6.4" rx="0.8" fill="#F59E0B" />
    </IconBase>
  );
}

export function SettingsMenuIcon(props: SidebarMenuIconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3.2" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.8" />
      <path
        d="M12 3.9v2M12 18.1v2M4.9 7.1l1.5 1.3M17.6 15.6l1.5 1.3M4.9 16.9l1.5-1.3M17.6 8.4l1.5-1.3M3.8 12h2M18.2 12h2"
        stroke="#14B8A6"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="1.2" fill="#2563EB" />
    </IconBase>
  );
}
