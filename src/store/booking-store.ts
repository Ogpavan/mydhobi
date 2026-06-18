"use client";

import { create } from "zustand";
import { services } from "@/lib/mock-data";
import type { ServiceId } from "@/lib/constants";

const firstService = services[0];
const initialQuantities = Object.fromEntries(firstService.items.map((item) => [item.id, item.id === "shirt" ? 2 : item.id === "jeans" ? 1 : 0]));

type BookingState = {
  selectedServiceId: ServiceId;
  quantities: Record<string, number>;
  pickupDate: string;
  pickupSlot: string;
  address: string;
  setService: (serviceId: ServiceId) => void;
  setQuantity: (itemId: string, quantity: number) => void;
  setPickupDate: (date: string) => void;
  setPickupSlot: (slot: string) => void;
  setAddress: (address: string) => void;
  reset: () => void;
};

export const useBookingStore = create<BookingState>((set) => ({
  selectedServiceId: firstService.id,
  quantities: initialQuantities,
  pickupDate: "2026-06-19",
  pickupSlot: "10:00 AM - 12:00 PM",
  address: "B 250, Baker Street, Indiranagar, Bengaluru",
  setService: (serviceId) => {
    const service = services.find((item) => item.id === serviceId) ?? firstService;
    set({
      selectedServiceId: service.id,
      quantities: Object.fromEntries(service.items.map((item) => [item.id, item.id === "shirt" ? 2 : 0])),
    });
  },
  setQuantity: (itemId, quantity) =>
    set((state) => ({
      quantities: {
        ...state.quantities,
        [itemId]: Math.max(0, Math.min(25, quantity)),
      },
    })),
  setPickupDate: (pickupDate) => set({ pickupDate }),
  setPickupSlot: (pickupSlot) => set({ pickupSlot }),
  setAddress: (address) => set({ address }),
  reset: () => set({ selectedServiceId: firstService.id, quantities: initialQuantities }),
}));
