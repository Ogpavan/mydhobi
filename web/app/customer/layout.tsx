import { CustomerThemeSync } from "@/components/customer/customer-theme-sync";

export default function CustomerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="customer-app">
      <CustomerThemeSync />
      {children}
    </div>
  );
}
