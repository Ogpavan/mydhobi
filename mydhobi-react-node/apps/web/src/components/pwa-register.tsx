import { useEffect } from "react";
export function PwaRegister() {
  useEffect(() => {
    if (
      !("serviceWorker" in navigator) ||
      !window.isSecureContext ||
      import.meta.env.DEV
    )
      return;
    void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);
  return null;
}
