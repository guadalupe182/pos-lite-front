'use client';

import { useEffect } from 'react';

type ErrorBannerProps = {
  message: string;
  onClose: () => void;
  duration?: number;
};

export default function ErrorBanner({ message, onClose, duration = 5000 }: ErrorBannerProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-bold">
        !
      </span>
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar error"
        className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold opacity-70 transition-opacity hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}