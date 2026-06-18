"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      toastOptions={{
        classNames: {
          toast: "rounded-md border-border bg-card text-foreground shadow-soft",
          title: "font-bold",
          description: "text-muted-foreground",
          actionButton: "bg-accent text-accent-foreground",
          cancelButton: "bg-secondary text-secondary-foreground",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
