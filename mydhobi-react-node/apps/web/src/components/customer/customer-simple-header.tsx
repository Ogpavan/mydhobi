import { startNavigationProgress } from "@/components/navigation-loader";
import { useRouter } from "@/platform/navigation";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function CustomerBackButton({
  fallback = "/customer",
  ariaLabel = "Go back",
  title,
  className,
}: {
  fallback?: string;
  ariaLabel?: string;
  title?: string;
  className?: string;
}) {
  const router = useRouter();

  function goBack() {
    const historyState = window.history.state as { idx?: number } | null;
    const canGoBack =
      typeof historyState?.idx === "number" && historyState.idx > 0;

    startNavigationProgress();
    if (canGoBack) {
      router.back();
      return;
    }
    router.replace(fallback);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={ariaLabel}
      title={title}
      className={cn(
        "absolute left-3 flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f4f1fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#814de8]",
        className,
      )}
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  );
}

export function CustomerSimpleHeader({
  title,
  backHref = "/customer",
  action,
}: {
  title: string;
  backHref?: string;
  action?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#efedf5] bg-white">
      <div className="relative mx-auto flex h-14 max-w-[720px] items-center justify-center px-4">
        <CustomerBackButton fallback={backHref} />
        <h1 className="text-[15px] font-bold">{title}</h1>
        {action && <div className="absolute right-3">{action}</div>}
      </div>
    </header>
  );
}
