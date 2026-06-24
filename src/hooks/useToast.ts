import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

let toastCallback: ((toast: Toast) => void) | null = null;

export function setToastCallback(cb: (toast: Toast) => void) {
  toastCallback = cb;
}

export function toast(message: string, type: ToastType = 'info') {
  if (toastCallback) {
    toastCallback({ id: crypto.randomUUID(), message, type });
  }
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((t: Toast) => {
    setToasts(prev => [...prev, t]);
    setTimeout(() => {
      setToasts(prev => prev.filter(x => x.id !== t.id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(x => x.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}
