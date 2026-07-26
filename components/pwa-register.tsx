"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      async function removeDevelopmentServiceWorker() {
        if (!("serviceWorker" in navigator)) return;

        const wasControlled = Boolean(navigator.serviceWorker.controller);
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));

        if ("caches" in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames
              .filter((cacheName) => cacheName.startsWith("dhobicart-static-"))
              .map((cacheName) => caches.delete(cacheName)),
          );
        }

        const reloadKey = "mydhobi:service-worker-cleanup";
        if (wasControlled && !sessionStorage.getItem(reloadKey)) {
          sessionStorage.setItem(reloadKey, "done");
          window.location.reload();
          return;
        }

        sessionStorage.removeItem(reloadKey);
      }

      void removeDevelopmentServiceWorker();
      return;
    }

    if (!("serviceWorker" in navigator) || !window.isSecureContext) {
      return;
    }

    const registerServiceWorker = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    };

    if (document.readyState === "complete") {
      registerServiceWorker();
      return;
    }

    window.addEventListener("load", registerServiceWorker, { once: true });

    return () => {
      window.removeEventListener("load", registerServiceWorker);
    };
  }, []);

  return null;
}
