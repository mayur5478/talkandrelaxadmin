import React from 'react';
import { AlertTriangle, Inbox } from 'lucide-react';
import { cn } from '../../../lib/cn';

/**
 * EmptyState — used when a list has no items.
 */
export function EmptyState({ icon, title, description, action, className }) {
  return (
    <div
      role="status"
      className={cn('tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-10 tw-px-6 tw-text-center', className)}
    >
      <div className="tw-w-10 tw-h-10 tw-rounded-md tw-bg-bg-secondary tw-text-fg-tertiary tw-grid tw-place-items-center tw-mb-3">
        {icon || <Inbox size={18} aria-hidden />}
      </div>
      <div className="tw-text-h3 tw-text-fg-primary">{title}</div>
      {description && <div className="tw-mt-1 tw-text-small tw-text-fg-tertiary tw-max-w-md">{description}</div>}
      {action && <div className="tw-mt-4">{action}</div>}
    </div>
  );
}

/**
 * ErrorBanner — inline error block, used under page heads or inside cards.
 */
export function ErrorBanner({ title = 'Something went wrong', message, action, className }) {
  return (
    <div
      role="alert"
      className={cn(
        'tw-flex tw-items-start tw-gap-3 tw-p-3 tw-rounded-md',
        'tw-bg-bg-danger tw-text-fg-danger',
        className,
      )}
    >
      <AlertTriangle size={16} aria-hidden className="tw-shrink-0 tw-mt-[2px]" />
      <div className="tw-flex-1 tw-min-w-0">
        <div className="tw-text-small tw-font-medium">{title}</div>
        {message && <div className="tw-text-[12px] tw-mt-1 tw-opacity-90">{message}</div>}
      </div>
      {action}
    </div>
  );
}

/**
 * Spinner — small inline spinner, currentColor.
 */
export function Spinner({ size = 14, className }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      style={{ width: size, height: size }}
      className={cn('tw-inline-block tw-border-2 tw-border-current tw-border-t-transparent tw-rounded-full tw-animate-spin', className)}
    />
  );
}

/**
 * Skeleton — placeholder block for loading lists/tables.
 */
export function Skeleton({ className }) {
  return (
    <div
      aria-hidden
      className={cn(
        'tw-bg-bg-secondary tw-rounded-sm tw-animate-pulse',
        className,
      )}
    />
  );
}
