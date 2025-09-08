"use client";

export type ToastPayload = {
  id?: string;
  title?: string;
  description?: string;
  durationMs?: number;
  variant?: "default" | "destructive";
};

const TOAST_EVENT = "__app_toast_event__";

export function showToast(payload: ToastPayload) {
  const event = new CustomEvent(TOAST_EVENT, { detail: payload });
  window.dispatchEvent(event);
}

export function subscribeToasts(handler: (payload: ToastPayload) => void) {
  const listener = (e: Event) => {
    handler((e as CustomEvent<ToastPayload>).detail);
  };
  window.addEventListener(TOAST_EVENT, listener as EventListener);
  return () => window.removeEventListener(TOAST_EVENT, listener as EventListener);
}


