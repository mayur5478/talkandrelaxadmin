import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../../../lib/cn';

const TONES = {
  success: 'tw-bg-fg-success/[.12] tw-text-fg-success tw-ring-1 tw-ring-fg-success/20',
  warning: 'tw-bg-fg-warning/[.12] tw-text-fg-warning tw-ring-1 tw-ring-fg-warning/20',
  danger:  'tw-bg-fg-danger/[.12]  tw-text-fg-danger  tw-ring-1 tw-ring-fg-danger/20',
  info:    'tw-bg-fg-info/[.12]    tw-text-fg-info    tw-ring-1 tw-ring-fg-info/20',
  neutral: 'tw-bg-bg-secondary tw-text-fg-secondary tw-ring-1 tw-ring-[var(--color-border-tertiary)]',
};

const DOTS = {
  success: 'tw-bg-fg-success',
  warning: 'tw-bg-fg-warning',
  danger:  'tw-bg-fg-danger',
  info:    'tw-bg-fg-info',
  neutral: 'tw-bg-fg-tertiary',
};

/**
 * Pill — status / category badge with optional dot indicator.
 *
 *   <Pill tone="success">Paid</Pill>
 *   <Pill tone="warning" dot>Pending</Pill>
 */
export function Pill({ tone = 'neutral', dot, className, children }) {
  return (
    <span
      className={cn(
        'tw-inline-flex tw-items-center tw-gap-1.5',
        'tw-px-2 tw-py-[3px] tw-rounded-full',
        'tw-text-[11px] tw-font-semibold tw-leading-none tw-whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {dot && (
        <span
          aria-hidden
          className={cn('tw-w-1.5 tw-h-1.5 tw-rounded-full tw-shrink-0', DOTS[tone])}
        />
      )}
      {children}
    </span>
  );
}

/**
 * Delta — percentage chip with directional arrow.
 */
export function Delta({ value, className }) {
  const up = Number(value) >= 0;
  return (
    <span
      className={cn(
        'tw-inline-flex tw-items-center tw-gap-0.5',
        'tw-text-[11px] tw-font-semibold tw-tabular-nums',
        up ? 'tw-text-fg-success' : 'tw-text-fg-danger',
        className,
      )}
    >
      {up ? <ArrowUpRight size={11} aria-hidden /> : <ArrowDownRight size={11} aria-hidden />}
      {up ? '+' : ''}{Number(value).toFixed(1)}%
    </span>
  );
}
