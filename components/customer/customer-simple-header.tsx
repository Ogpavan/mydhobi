import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

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
        <Link
          href={backHref}
          aria-label="Go back"
          className="absolute left-3 flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f4f1fb]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-[15px] font-bold">{title}</h1>
        {action && <div className="absolute right-3">{action}</div>}
      </div>
    </header>
  );
}
