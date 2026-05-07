import React from 'react';
import { cn } from '../../../lib/cn';

/**
 * Card — the base surface used across every v2 page.
 *
 *   <Card>           default — hairline border, white surface
 *   <Card promoted>  promoted variant — 2px blue border (highlighted KPI)
 *   <Card flush>     no inner padding (use when the children manage their own)
 */
export const Card = React.forwardRef(function Card(
  { className, promoted, flush, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'tw-bg-bg-primary tw-rounded-md tw-border',
        promoted ? 'tw-border-fg-info tw-border-2' : 'tw-border-hairline tw-border-tertiary',
        'tw-transition-shadow tw-duration-base tw-ease-out-soft hover:tw-shadow-sm',
        flush ? 'tw-p-0' : 'tw-p-3',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

export function CardHeader({ className, children, action }) {
  return (
    <div className={cn('tw-flex tw-items-center tw-justify-between tw-mb-3', className)}>
      <div className="tw-min-w-0">{children}</div>
      {action && <div className="tw-shrink-0">{action}</div>}
    </div>
  );
}

export function CardTitle({ className, children }) {
  return <div className={cn('tw-text-h3 tw-text-fg-primary', className)}>{children}</div>;
}

export function CardDescription({ className, children }) {
  return <div className={cn('tw-text-[11px] tw-text-fg-tertiary tw-mt-1', className)}>{children}</div>;
}
