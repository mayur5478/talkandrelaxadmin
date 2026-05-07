import React from 'react';
import { cn } from '../../../lib/cn';

const TONES = {
  info:    'tw-bg-bg-info    tw-text-fg-info',
  success: 'tw-bg-bg-success tw-text-fg-success',
  warning: 'tw-bg-bg-warning tw-text-fg-warning',
  danger:  'tw-bg-bg-danger  tw-text-fg-danger',
};

/**
 * IconTile — small colored backdrop for a leading icon, used in
 * KPI cards, activity feed rows, and action menu items.
 */
export function IconTile({ tone = 'info', size = 'md', className, children }) {
  const sz = size === 'sm' ? 'tw-w-6 tw-h-6' : size === 'lg' ? 'tw-w-9 tw-h-9' : 'tw-w-7 tw-h-7';
  return (
    <div className={cn('tw-rounded-sm tw-grid tw-place-items-center tw-shrink-0', sz, TONES[tone], className)}>
      {children}
    </div>
  );
}

/**
 * Avatar — circular initials avatar, two sizes.
 *
 *   <Avatar name="Priya Sharma" />            32px
 *   <Avatar name="Priya Sharma" size="sm" />  22px
 */
export function Avatar({ name, src, tone = 'info', size = 'md', className }) {
  const initials = (name || '')
    .split(' ').map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'A';
  const sz = size === 'sm' ? 'tw-w-[22px] tw-h-[22px] tw-text-[10px]' : 'tw-w-8 tw-h-8 tw-text-[11px]';

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={cn('tw-rounded-full tw-object-cover tw-shrink-0', sz, className)}
      />
    );
  }

  return (
    <div
      aria-label={name ? `Account: ${name}` : undefined}
      className={cn(
        'tw-rounded-full tw-grid tw-place-items-center tw-font-medium tw-shrink-0',
        sz,
        TONES[tone],
        className,
      )}
    >
      {initials}
    </div>
  );
}
