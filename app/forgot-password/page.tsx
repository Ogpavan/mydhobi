import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F6F9FF] px-4">
      <section className="w-full max-w-[420px] rounded border border-[#DCE6F2] bg-white p-5 text-[#071333]">
        <h1 className="text-[20px] font-semibold">Reset Password</h1>
        <p className="mt-4 text-[13px] leading-6 text-[#52627A]">
          Call MyDhobi support from your registered mobile number. Our team
          will verify your account and set a new password.
        </p>
        <a href="tel:+919876543210" className="mt-5 flex h-10 items-center justify-center rounded bg-[#075DFF] text-[13px] font-medium text-white">
          Call Support
        </a>
        <Link href="/" className="mt-3 flex h-10 items-center justify-center rounded border border-[#DCE6F2] text-[13px] font-medium text-[#075DFF]">
          Back to Sign In
        </Link>
      </section>
    </main>
  );
}
