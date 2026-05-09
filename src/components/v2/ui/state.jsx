import React from 'react';
import { AlertTriangle, Inbox } from 'lucide-react';
import { cn } from '../../../lib/cn';

export function EmptyState({ icon, title, description, action, className }) {
  return (
    <div
      role="status"
      className={cn(
        'tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-14 tw-px-6 tw-text-center',
        className,
      )}
    >
      <div className="tw-w-12 tw-h-12 tw-rounded-xl tw-bg-bg-secondary tw-text-fg-tertiary tw-grid tw-place-items-center tw-mb-4 tw-shadow-xs">
        {icon || <Inbox size={20} aria-hidden />}
      </div>
      <div className="tw-text-[15px] tw-font-semibold tw-text-fg-primary">{title}</div>
      {description && (
        <div className="tw-mt-1.5 tw-text-[13px] tw-text-fg-tertiary tw-max-w-sm tw-leading-relaxed">
          {description}
        </div>
      )}
      {action && <div className="tw-mt-5">{action}</div>}
    </div>
  );
}

export function ErrorBanner({ title = 'Something went wrong', message, action, className }) {
  return (
    <div
      role="alert"
      className={cn(
        'tw-flex tw-items-start tw-gap-3 tw-p-4 tw-rounded-xl',
        'tw-bg-fg-danger/[.08] tw-text-fg-danger',
        'tw-border tw-border-fg-danger/20',
        className,
      )}
    >
      <AlertTriangle size={15} aria-hidden className="tw-shrink-0 tw-mt-[2px]" />
      <div className="tw-flex-1 tw-min-w-0">
        <div className="tw-text-[13px] tw-font-semibold">{title}</div>
        {message && <div className="tw-text-[12px] tw-mt-1 tw-opacity-80 tw-leading-relaxed">{message}</div>}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ size = 14, className }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      style={{ width: size, height: size }}
      className={cn(
        'tw-inline-block tw-rounded-full tw-animate-spin',
        'tw-border-2 tw-border-current tw-border-t-transparent',
        className,
      )}
    />
  );
}

/** Skeleton — shimmer placeholder using the .shimmer CSS class from tokens.css */
export function Skeleton({ className, style }) {
  return (
    <div
      aria-hidden
      className={cn('tw-rounded-lg shimmer', className)}
      style={style}
    />
  );
}
