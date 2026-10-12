import { Alert, Snackbar } from "@mui/material";
import { useEffect, useState } from "react";
type Notice = {
  message: string;
  severity: "success" | "error" | "info" | "warning";
  id: number;
};
const listeners = new Set<(notice: Notice) => void>();
const publish = (message: string, severity: Notice["severity"]) => {
  for (const listener of listeners)
    listener({ message, severity, id: Date.now() });
};
export const toast = {
  success: (message: string) => publish(message, "success"),
  error: (message: string) => publish(message, "error"),
  info: (message: string) => publish(message, "info"),
  warning: (message: string) => publish(message, "warning"),
};
export function Notifications() {
  const [notice, setNotice] = useState<Notice | null>(null);
  useEffect(() => {
    listeners.add(setNotice);
    return () => {
      listeners.delete(setNotice);
    };
  }, []);
  return (
    <Snackbar
      key={notice?.id}
      open={Boolean(notice)}
      autoHideDuration={5000}
      onClose={() => setNotice(null)}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert
        severity={notice?.severity ?? "info"}
        variant="filled"
        onClose={() => setNotice(null)}
      >
        {notice?.message}
      </Alert>
    </Snackbar>
  );
}
