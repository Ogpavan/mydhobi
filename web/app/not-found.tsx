import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F6F9FF] px-4 text-[#071333]">
      <div className="w-full max-w-[420px] text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded bg-[#EEF5FF] text-[22px] font-semibold text-[#075DFF]">
          404
        </div>
        <h1 className="text-[24px] font-semibold leading-none text-[#0B1E57]">
          Page not found
        </h1>
        <p className="mt-3 text-[14px] font-normal leading-6 text-[#5A6B8C]">
          The page you are looking for is unavailable.
        </p>
        <Button
          asChild
          className="mt-5 h-[34px] rounded bg-[#075DFF] px-3 text-[13px] font-medium shadow-[0_8px_18px_rgba(7,93,255,0.2)] hover:bg-[#064FEB]"
        >
          <Link href="/">Back to Login</Link>
        </Button>
      </div>
    </main>
  );
}
