"use client";

import { useState } from "react";
import { ArrowLeft, CalendarDays, Clock3, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { startNavigationProgress } from "@/components/navigation-loader";
import { cn } from "@/lib/utils";

export type PickupDateOption = {
  id: string;
  day: string;
  date: string;
  month: string;
};

const timeSlots = [
  "9:00 AM - 11:00 AM",
  "11:00 AM - 1:00 PM",
  "1:00 PM - 3:00 PM",
  "3:00 PM - 5:00 PM",
  "5:00 PM - 7:00 PM",
];

const slotStartHour: Record<string, number> = {
  "9:00 AM - 11:00 AM": 9,
  "11:00 AM - 1:00 PM": 11,
  "1:00 PM - 3:00 PM": 13,
  "3:00 PM - 5:00 PM": 15,
  "5:00 PM - 7:00 PM": 17,
};

export function SchedulePickupView({
  dates,
  pickupAddress,
}: {
  dates: PickupDateOption[];
  pickupAddress: string;
}) {
  const [selectedDate, setSelectedDate] = useState(dates[0]?.id ?? "");
  const [selectedTime, setSelectedTime] = useState(timeSlots[0]);
  const [instructions, setInstructions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  function schedulePickup() {
    setIsSubmitting(true);
    const hour = slotStartHour[selectedTime];
    const pickup = new Date(
      `${selectedDate}T${String(hour).padStart(2, "0")}:00:00+05:30`,
    );
    if (!selectedDate || Number.isNaN(pickup.getTime())) {
      toast.error("Select a valid pickup time");
      setIsSubmitting(false);
      return;
    }
    localStorage.setItem("mydhobi_pickup_at", pickup.toISOString());
    localStorage.setItem("mydhobi_pickup_instructions", instructions.trim());
    localStorage.setItem("mydhobi_checkout_address", pickupAddress);
    toast.success("Pickup time saved");
    startNavigationProgress();
    router.push("/customer/services");
  }

  return (
    <div className="min-h-screen bg-[#fafafe] text-[#17182c]">
      <header className="sticky top-0 z-40 border-b border-[#efedf5] bg-white">
        <div className="relative mx-auto flex h-14 w-full max-w-[720px] items-center justify-center px-4">
          <Link
            href="/customer"
            aria-label="Back to home"
            title="Back to home"
            className="absolute left-3 flex h-9 w-9 items-center justify-center rounded-full text-[#292b3c] transition hover:bg-[#f4f1fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#814de8]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-[15px] font-bold">Schedule Pickup</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[720px] px-4 py-4 sm:py-6">
        <section className="flex items-start gap-3 rounded-[12px] border border-[#e5e2ed] bg-white px-3 py-3 shadow-[0_3px_12px_rgba(56,46,88,0.05)]">
          <MapPin className="mt-1 h-[18px] w-[18px] shrink-0 text-[#55586b]" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[12px] font-bold">Pickup Address</h2>
              <Link
                href="/customer/addresses"
                className="rounded-md px-1.5 py-1 text-[11px] font-bold text-[#7c43e5] hover:bg-[#f4efff]"
              >
                Change
              </Link>
            </div>
            <p className="mt-1 text-[11px] leading-5 text-[#606273]">
              {pickupAddress || "Add a pickup address"}
            </p>
          </div>
        </section>

        <form
          className="mt-5 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            schedulePickup();
          }}
        >
          <fieldset className="min-w-0">
            <legend className="flex items-center gap-2 text-[12px] font-bold">
              <CalendarDays className="h-4 w-4 text-[#56586a]" />
              Select Date
            </legend>
            <div
              className="mt-3 flex w-full max-w-full snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="Pickup dates"
            >
              {dates.map((option, index) => {
                const selected = option.id === selectedDate;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSelectedDate(option.id)}
                    className={cn(
                      "flex min-h-[82px] w-[76px] shrink-0 snap-start flex-col items-center justify-center rounded-[12px] border px-1 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#814de8]",
                      selected
                        ? "border-[#7e45eb] bg-[linear-gradient(145deg,#8955f2,#7138e3)] text-white shadow-[0_7px_15px_rgba(111,54,219,0.2)]"
                        : "border-[#e5e2eb] bg-white text-[#282a3a] hover:border-[#cfc4e6]",
                    )}
                  >
                    <span
                      className={cn(
                        "text-[10px] font-semibold",
                        !selected && "text-[#626475]",
                      )}
                    >
                      {index === 0 ? "Today" : option.day}
                    </span>
                    <span className="mt-1 text-[22px] font-bold leading-none">{option.date}</span>
                    <span
                      className={cn(
                        "mt-1.5 text-[10px]",
                        !selected && "text-[#676978]",
                      )}
                    >
                      {option.month}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="flex items-center gap-2 text-[12px] font-bold">
              <Clock3 className="h-4 w-4 text-[#56586a]" />
              Select Time Slot
            </legend>
            <div className="mt-3 space-y-2">
              {timeSlots.map((slot) => {
                const selected = slot === selectedTime;
                return (
                  <button
                    key={slot}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSelectedTime(slot)}
                    className={cn(
                      "flex h-11 w-full items-center justify-center rounded-[10px] border bg-white text-[12px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#814de8]",
                      selected
                        ? "border-[#8a50ee] bg-[#fbf9ff] text-[#7840df] shadow-[inset_0_0_0_1px_rgba(126,64,226,0.08)]"
                        : "border-[#e3e1e9] text-[#303241] hover:border-[#cfc4e6]",
                    )}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label htmlFor="pickup-instructions" className="text-[12px] font-bold">
              Special Instructions (Optional)
            </label>
            <div className="relative mt-3">
              <textarea
                id="pickup-instructions"
                value={instructions}
                maxLength={120}
                rows={4}
                onChange={(event) => setInstructions(event.target.value)}
                placeholder="E.g. Call before coming, gate pass etc."
                className="min-h-[112px] w-full resize-none rounded-[12px] border border-[#e2dfe9] bg-white px-3 py-3 pb-7 text-[12px] leading-5 outline-none transition placeholder:text-[#9a9baa] focus:border-[#8a50ee] focus:ring-2 focus:ring-[#8a50ee]/15"
              />
              <span className="pointer-events-none absolute bottom-2.5 right-3 text-[9px] text-[#8a8c9b]">
                {instructions.length}/120
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !pickupAddress}
            className="flex h-12 w-full items-center justify-center rounded-[12px] bg-[linear-gradient(100deg,#7138e2,#8d4df0)] px-4 text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(111,55,217,0.2)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#814de8] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-65"
          >
            {isSubmitting ? "Saving..." : "Schedule Pickup"}
          </button>
        </form>
      </main>
    </div>
  );
}
