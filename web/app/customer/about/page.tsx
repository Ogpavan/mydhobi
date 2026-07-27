import { CustomerBottomNav } from "@/components/customer/customer-bottom-nav";
import { CustomerSimpleHeader } from "@/components/customer/customer-simple-header";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#fafafe] pb-[88px] text-[#17182c]">
      <CustomerSimpleHeader title="About MyDhobi" backHref="/customer/profile" />
      <main className="mx-auto max-w-[720px] space-y-3 px-4 py-4">
        <section className="rounded-[12px] border border-[#e5e2eb] bg-white p-4">
          <h2 className="text-[12px] font-bold">MyDhobi</h2>
          <p className="mt-3 text-[10px] leading-5 text-[#666879]">
            MyDhobi helps you book laundry and dry-cleaning pickup, follow each
            order, pay safely, and get clean clothes delivered to your door.
          </p>
        </section>
        <section className="rounded-[12px] border border-[#e5e2eb] bg-white p-4">
          <h2 className="text-[12px] font-bold">Our Promise</h2>
          <ul className="mt-3 space-y-2 text-[10px] leading-5 text-[#666879]">
            <li>Careful cleaning and quality checks</li>
            <li>Clear prices and order updates</li>
            <li>Support when you need help</li>
          </ul>
        </section>
      </main>
      <CustomerBottomNav active="profile" />
    </div>
  );
}
