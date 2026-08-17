"use client";

import Image from "next/image";
import Link from "next/link";
import { Award, ChevronLeft, Clock3, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

const benefits = [
  { label: "Safe & Secure", icon: ShieldCheck },
  { label: "Best Quality", icon: Award },
  { label: "On Time Delivery", icon: Clock3 },
] as const;

export function AuthShell({
  title,
  subtitle,
  backHref,
  children,
  className,
  cardless = false,
  showHero = true,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  children: React.ReactNode;
  className?: string;
  cardless?: boolean;
  showHero?: boolean;
}) {
  const backClassName =
    "absolute left-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/75 text-[#25213a] shadow-sm backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7440dc]";

  return (
    <main className="min-h-[100svh] bg-[#f3efff] text-[#17182c] sm:px-5 sm:py-5 lg:flex lg:items-center lg:justify-center lg:px-8 lg:py-8">
      <section className={cn(
        "relative mx-auto flex min-h-[100svh] w-full max-w-[460px] flex-col overflow-hidden bg-[linear-gradient(180deg,#e7dcff_0%,#f7f4ff_31%,#ffffff_100%)] shadow-[0_22px_70px_rgba(80,48,150,0.14)] sm:min-h-[calc(100svh-2.5rem)] sm:rounded-[22px]",
        showHero && "lg:grid lg:min-h-[680px] lg:max-w-[1040px] lg:grid-cols-[0.92fr_1.08fr] lg:bg-[linear-gradient(110deg,#e4d8ff_0%,#f5f1ff_49%,#ffffff_100%)]",
      )}>
        {backHref ? (
          <Link href={backHref} aria-label="Back" className={backClassName}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        ) : null}

        {showHero ? <div className="relative h-[245px] shrink-0 overflow-hidden rounded-b-[28px] px-8 pt-[136px] sm:h-[210px] sm:rounded-b-none sm:px-7 sm:pt-[86px] lg:h-auto lg:min-h-full lg:px-10 lg:pt-28">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_38%,rgba(255,255,255,0.8),transparent_34%),linear-gradient(135deg,#eee8ff_0%,#d7c5ff_100%)]" />
          <div className="absolute -right-8 top-3 h-[230px] w-[215px] opacity-95 sm:right-0 sm:w-[245px] lg:-bottom-2 lg:-right-10 lg:top-auto lg:h-[470px] lg:w-[520px]">
            <Image
              src="/wash_fold.png"
              alt=""
              fill
              priority
              sizes="245px"
              className="object-contain object-right"
            />
          </div>
          <div className="relative z-10 max-w-[210px] lg:max-w-[370px]">
            <h1 className="whitespace-nowrap text-2xl font-bold leading-tight tracking-[-0.03em] text-[#17142a] lg:text-4xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-4 hidden text-[22px] font-bold leading-tight text-[#17142a] sm:block">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div> : null}

        <div className={cn(
          "relative z-10 flex flex-1 flex-col px-6 pb-6 sm:px-5 lg:min-h-full lg:px-10 lg:py-8",
          showHero ? "-mt-3 lg:mt-0" : "mt-0",
        )}>
          {cardless ? (
            <div className={cn("lg:mt-auto", className)}>{children}</div>
          ) : (
            <div
              className={cn(
                "rounded-[17px] border border-white/80 bg-white/95 p-5 shadow-[0_12px_34px_rgba(57,39,104,0.09)] lg:mt-auto lg:p-6",
                className,
              )}
            >
              {children}
            </div>
          )}

          <div className="mt-auto grid grid-cols-3 gap-2 px-1 pb-5 pt-8 lg:pt-8">
            {benefits.map(({ label, icon: Icon }) => (
              <div key={label} className="flex min-w-0 flex-col items-center text-center">
                <Icon className="h-6 w-6 text-[#7440dc]" strokeWidth={1.8} />
                <span className="mt-2 text-xs font-medium text-[#5f5a70]">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
