import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PackageCheck, Sparkles } from "lucide-react";

import { MuiAction } from "@/components/ui/native-controls";
import { CustomerBottomNav } from "@/components/customer/customer-bottom-nav";
import { useCustomerData } from "@/components/customer/customer-client-data";
import {
  CustomerPageError,
  CustomerPageSkeleton,
} from "@/components/customer/customer-page-state";
import { CustomerSimpleHeader } from "@/components/customer/customer-simple-header";
import { startNavigationProgress } from "@/components/navigation-loader";
import Image from "@/platform/image";
import Link from "@/platform/navigation";
import type { OrderingCatalog } from "@/lib/customer-ordering";
import type { CatalogService } from "@/lib/service-catalog";
import { useOrderingDraft } from "./ordering-state";

type PackageDefinition = {
  code: string;
  name: string;
  match: (service: CatalogService) => boolean;
  accent: string;
};

type PackageCard = PackageDefinition & {
  services: CatalogService[];
};

const packageDefinitions: PackageDefinition[] = [
  {
    code: "everyday-care",
    name: "Everyday Care",
    match: (service) => /wash/.test(service.name.toLowerCase()),
    accent: "#eaf7f4",
  },
  {
    code: "complete-care",
    name: "Complete Care",
    match: () => true,
    accent: "#f1ebff",
  },
  {
    code: "special-care",
    name: "Special Care",
    match: (service) =>
      /dry|premium|shoe|repair|iron/.test(service.name.toLowerCase()),
    accent: "#fff4df",
  },
];

function uniqueServices(services: CatalogService[]) {
  return [
    ...new Map(
      services
        .filter((service) => service.isActive)
        .sort((left, right) => left.displayOrder - right.displayOrder)
        .map((service) => [service.name.trim().toLowerCase(), service]),
    ).values(),
  ];
}

function PackageIcon({ service }: { service: CatalogService }) {
  return service.imagePath ? (
    <Image
      src={service.imagePath}
      alt=""
      width={20}
      height={20}
      className="h-5 w-5 object-contain"
    />
  ) : (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#eee8ff] text-[#7440dc]">
      <Sparkles className="h-3 w-3" />
    </span>
  );
}

export function PackagesView() {
  const navigate = useNavigate();
  const { update } = useOrderingDraft();
  const [tab, setTab] = useState<"available" | "plans">("available");
  const catalog = useCustomerData<OrderingCatalog>(
    "/api/customer/catalog",
    300_000,
  );
  const packages = useMemo<PackageCard[]>(
    () =>
      packageDefinitions
        .map((definition) => ({
          ...definition,
          services: uniqueServices(catalog.data?.services ?? []).filter(
            definition.match,
          ),
        }))
        .filter((item) => item.services.length),
    [catalog.data?.services],
  );

  function choosePackage(item: PackageCard) {
    if (!catalog.data?.store) return;
    update({
      kind: "quick",
      storeId: catalog.data.store.id,
      items: [],
      serviceIds: item.services.map((service) => service.id),
      quickItemCount: 0,
      date: "",
      slot: "",
    });
    startNavigationProgress();
    navigate("/customer/quick-pickup");
  }

  if (catalog.loading)
    return <CustomerPageSkeleton variant="services" rows={4} />;
  if (catalog.error)
    return <CustomerPageError message={catalog.error} retry={catalog.retry} />;
  if (!catalog.data)
    return <CustomerPageSkeleton variant="services" rows={4} />;

  return (
    <div className="min-h-screen bg-[#f3f3f3] text-[#17182c]">
      <CustomerSimpleHeader title="Laundry Packages" backHref="/customer" />
      <main className="mx-auto max-w-[720px] space-y-4 px-4 py-4">
        <div
          role="tablist"
          aria-label="Package lists"
          className="grid grid-cols-2 rounded-xl bg-[#f0ecf8] p-1"
        >
          {(
            [
              ["available", "Available"],
              ["plans", "My Plans"],
            ] as const
          ).map(([value, label]) => (
            <MuiAction
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              style={{
                backgroundColor: tab === value ? "#ffffff" : "transparent",
                color: tab === value ? "#6033c7" : "#716b7b",
              }}
              className={`h-10 rounded-lg text-[12px] font-bold normal-case transition ${tab === value ? "bg-white text-[#6033c7] shadow-sm" : "text-[#716b7b]"}`}
            >
              {label}
            </MuiAction>
          ))}
        </div>
        {tab === "plans" ? (
          <section className="flex flex-col items-center rounded-2xl border border-[#e7e3ed] bg-white px-4 py-10 text-center">
            <PackageCheck
              aria-hidden="true"
              className="h-8 w-8 text-[#8a50ee]"
            />
            <h2 className="mt-3 text-[14px] font-bold">No active packages</h2>
          </section>
        ) : (
          <>
            {packages.length ? (
              <section
                aria-label="Available packages"
                className="grid grid-cols-2 gap-3"
              >
                {packages.map((item) => (
                  <article
                    key={item.code}
                    className="flex min-w-0 flex-col rounded-2xl border border-[#e5e2eb] bg-white p-3 shadow-[0_2px_8px_rgba(40,29,66,0.035)]"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: item.accent }}
                      >
                        <PackageCheck
                          aria-hidden="true"
                          className="h-[18px] w-[18px] text-[#7040dc]"
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h2 className="break-words text-[13px] font-bold leading-4">
                          {item.name}
                        </h2>
                        <p className="mt-1 text-[10px] text-[#777181]">
                          {item.services.length}{" "}
                          {item.services.length === 1 ? "service" : "services"}
                        </p>
                      </div>
                    </div>
                    <ul className="my-3 min-h-[84px] space-y-1.5 border-y border-[#efedf4] py-2">
                      {item.services.slice(0, 3).map((service) => (
                        <li
                          key={service.id}
                          className="flex min-w-0 items-center gap-1.5 text-[10px] font-medium text-[#514b5d]"
                        >
                          <PackageIcon service={service} />
                          <span className="truncate">{service.name}</span>
                        </li>
                      ))}
                      {item.services.length > 3 && (
                        <li className="pl-5 text-[10px] font-semibold text-[#7040dc]">
                          +{item.services.length - 3} more
                        </li>
                      )}
                    </ul>
                    <MuiAction
                      type="button"
                      onClick={() => choosePackage(item)}
                      aria-label={`Choose ${item.name}`}
                      className="mt-auto flex h-10 w-full items-center justify-center rounded-lg bg-[#7040dc] text-[11px] font-bold text-white normal-case"
                    >
                      Choose package
                    </MuiAction>
                  </article>
                ))}
              </section>
            ) : (
              <section className="rounded-[14px] border border-[#e5e2eb] bg-white px-4 py-12 text-center">
                <PackageCheck className="mx-auto h-8 w-8 text-[#8a50ee]" />
                <p className="mt-3 text-[12px] font-bold">
                  No packages available
                </p>
                <p className="mt-1 text-[10px] text-[#77798a]">
                  Choose individual services instead.
                </p>
              </section>
            )}

            <Link
              href="/customer/services"
              className="flex h-11 items-center justify-center rounded-[10px] border border-[#8a50ee] text-[11px] font-bold text-[#7440dc]"
            >
              View all services
            </Link>
          </>
        )}
      </main>
      <CustomerBottomNav active="packages" />
    </div>
  );
}
