import React from 'react';
import { cn } from '../../../lib/cn';

/**
 * Card — premium surface.
 *
 *   <Card>           standard card
 *   <Card promoted>  accent-bordered highlight card
 *   <Card flush>     no padding (children manage their own spacing)
 *   <Card glass>     frosted-glass variant (dark mode)
 */
export const Card = React.forwardRef(function Card(
  { className, promoted, flush, glass, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'tw-rounded-xl tw-border tw-overflow-hidden',
        /* base surface */
        !glass && 'tw-bg-bg-primary',
        /* glass variant */
        glass && [
          'tw-bg-bg-primary/70',
          'tw-backdrop-blur-[12px]',
          'tw-border-white/[0.06]',
        ],
        /* borders */
        promoted
          ? 'tw-border-fg-info/60 tw-border-[1.5px] tw-shadow-[0_0_0_1px_inset_rgba(99,102,241,.08)]'
          : 'tw-border-hairline tw-border-tertiary',
        /* shadow + hover lift */
        'tw-shadow-xs',
        'tw-transition-[box-shadow,transform] tw-duration-200 tw-ease-out',
        'hover:tw-shadow-md hover:-tw-translate-y-[1px]',
        /* spacing */
        flush ? 'tw-p-0' : 'tw-p-4',
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
    <div className={cn('tw-flex tw-items-start tw-justify-between tw-gap-3 tw-mb-3', className)}>
      <div className="tw-min-w-0 tw-flex-1">{children}</div>
      {action && <div className="tw-shrink-0">{action}</div>}
    </div>
  );
}

export function CardTitle({ className, children }) {
  return (
    <div className={cn('tw-text-[14px] tw-font-semibold tw-text-fg-primary tw-leading-snug', className)}>
      {children}
    </div>
  );
}

export function CardDescription({ className, children }) {
  return (
    <div className={cn('tw-text-[12px] tw-text-fg-tertiary tw-mt-0.5', className)}>
      {children}
    </div>
  );
}
