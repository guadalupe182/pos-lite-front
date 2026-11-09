'use client';

import { useEffect } from 'react';

type ToastType = 'success' | 'error';

type ToastProps = {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
};

export default function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onClose();
    }, duration);

    return () => window.clearTimeout(timer);
  }, [duration, onClose]);

  const styles =
    type === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : 'border-rose-200 bg-rose-50 text-rose-800';

  const icon = type === 'success' ? '✓' : '!';

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 px-2 sm:bottom-6">
      <div
        role={type === 'success' ? 'status' : 'alert'}
        aria-live="polite"
        className={`pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg ${styles}`}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/70 text-base">
          {icon}
        </span>
        <span className="flex-1">{message}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar notificación"
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold opacity-70 transition-opacity hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
