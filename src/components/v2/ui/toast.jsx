import React, { createContext, useCallback, useContext, useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../../lib/cn';

/**
 * Toast system — provider + hook + portal rendering.
 *
 *   import { ToastProvider, useToast } from '@/components/v2/ui/toast';
 *
 *   const { toast } = useToast();
 *   toast({ title: 'Saved', tone: 'success' });
 *   toast({ title: 'Failed', description: '…', tone: 'danger' });
 *
 * Mount <ToastProvider> once near the root (already wired into AppShell
 * in this commit). Each toast auto-dismisses after `duration` (default
 * 4000 ms) and can be cleared early by clicking its close button. The
 * region uses role="status" + aria-live="polite" so screen readers
 * announce new toasts without stealing focus.
 */

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setItems((xs) => xs.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(({ title, description, tone = 'neutral', duration = 4000 }) => {
    const id = ++idRef.current;
    setItems((xs) => [...xs, { id, title, description, tone, duration }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  return (
    <ToastCtx.Provider value={{ toast, dismiss }}>
      {children}
      {createPortal(
        <ol
          role="region"
          aria-label="Notifications"
          aria-live="polite"
          className="tw-fixed tw-z-[70] tw-bottom-4 tw-right-4 tw-flex tw-flex-col tw-gap-2 tw-w-[320px] tw-max-w-[calc(100vw-32px)]"
        >
          {items.map((t) => (
            <ToastItem key={t.id} item={t} onClose={() => dismiss(t.id)} />
          ))}
        </ol>,
        document.body,
      )}
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

const TONE_ICON = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger:  AlertCircle,
  info:    Info,
  neutral: Info,
};
const TONE_TILE = {
  success: 'tw-bg-bg-success tw-text-fg-success',
  warning: 'tw-bg-bg-warning tw-text-fg-warning',
  danger:  'tw-bg-bg-danger tw-text-fg-danger',
  info:    'tw-bg-bg-info tw-text-fg-info',
  neutral: 'tw-bg-bg-secondary tw-text-fg-secondary',
};

function ToastItem({ item, onClose }) {
  const Icon = TONE_ICON[item.tone] || Info;
  const [exiting, setExiting] = useState(false);
  // micro-fade on dismiss
  useEffect(() => {
    if (!exiting) return;
    const t = setTimeout(onClose, 150);
    return () => clearTimeout(t);
  }, [exiting, onClose]);

  return (
    <li
      role="status"
      className={cn(
        'tw-flex tw-items-start tw-gap-3 tw-p-3',
        'tw-bg-bg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-shadow-md',
        'tw-transition-opacity tw-duration-fast tw-ease-out-soft',
        exiting ? 'tw-opacity-0' : 'tw-opacity-100 tw-animate-fade-in',
      )}
    >
      <span className={cn('tw-w-7 tw-h-7 tw-rounded-sm tw-grid tw-place-items-center tw-shrink-0', TONE_TILE[item.tone])}>
        <Icon size={14} aria-hidden />
      </span>
      <div className="tw-flex-1 tw-min-w-0">
        {item.title && <div className="tw-text-small tw-font-medium tw-text-fg-primary">{item.title}</div>}
        {item.description && <div className="tw-text-[12px] tw-text-fg-secondary tw-mt-0.5">{item.description}</div>}
      </div>
      <button
        type="button"
        onClick={() => setExiting(true)}
        aria-label="Dismiss notification"
        className="tw-w-6 tw-h-6 tw-grid tw-place-items-center tw-rounded-sm tw-text-fg-tertiary hover:tw-bg-bg-secondary hover:tw-text-fg-primary focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info"
      >
        <X size={12} aria-hidden />
      </button>
    </li>
  );
}
