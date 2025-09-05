"use client";

import { useEffect, useState } from "react";
import { subscribeToasts, ToastPayload } from "@/lib/toast";
import { cn } from "@/lib/utils";

export function Toaster() {
  const [toasts, setToasts] = useState<ToastPayload[]>([]);

  useEffect(() => {
    return subscribeToasts((payload) => {
      const id = payload.id ?? Math.random().toString(36).slice(2);
      const duration = payload.durationMs ?? 2500;
      setToasts((t) => [...t, { ...payload, id }]);
      const timer = setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, duration);
      return () => clearTimeout(timer);
    });
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute right-4 top-4 flex w-80 max-w-full flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto rounded-md border bg-background p-3 shadow-md",
              "animate-in fade-in-0 zoom-in-95",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
            )}
          >
            {t.title && <div className="font-medium">{t.title}</div>}
            {t.description && (
              <div className="text-sm text-muted-foreground">{t.description}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


