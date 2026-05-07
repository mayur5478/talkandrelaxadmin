import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../../../lib/cn';

const TONES = {
  success: 'tw-bg-bg-success tw-text-fg-success',
  warning: 'tw-bg-bg-warning tw-text-fg-warning',
  danger:  'tw-bg-bg-danger  tw-text-fg-danger',
  info:    'tw-bg-bg-info    tw-text-fg-info',
  neutral: 'tw-bg-bg-secondary tw-text-fg-secondary',
};

/**
 * Pill — status / category badge.
 *
 *   <Pill tone="success">Paid</Pill>
 *   <Pill tone="warning">Pending</Pill>
 *   <Pill tone="danger">Failed</Pill>
 */
export function Pill({ tone = 'neutral', className, children }) {
  return (
    <span
      className={cn(
        'tw-inline-block tw-px-2 tw-py-[2px] tw-rounded-sm',
        'tw-text-[11px] tw-font-medium tw-leading-none',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Delta — percentage chip with up/down arrow, green/red text.
 *
 *   <Delta value={12.4} />   "▲ +12.4%"
 *   <Delta value={-0.4} />   "▼ -0.4%"
 */
export function Delta({ value, className }) {
  const up = Number(value) >= 0;
  return (
    <span
      className={cn(
        'tw-inline-flex tw-items-center tw-gap-1',
        'tw-text-[11px] tw-font-medium tw-tabular-nums',
        up ? 'tw-text-fg-success' : 'tw-text-fg-danger',
        className,
      )}
    >
      {up ? <ArrowUpRight size={12} aria-hidden /> : <ArrowDownRight size={12} aria-hidden />}
      {up ? '+' : ''}{Number(value).toFixed(1)}%
    </span>
  );
}
